/**
 * Error Tracking and Logging Service
 * 
 * Centralized error tracking with Sentry integration and structured logging.
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// ============================================================
// SENTRY INITIALIZATION
// ============================================================

let sentryInitialized = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  const release = process.env.GIT_COMMIT_SHA || 'unknown';

  if (!dsn) {
    console.warn('[Monitoring] SENTRY_DSN not set, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release: `creator-armour-api@${release}`,
    integrations: [
      // Enable automatic instrumentation
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express(),
      new Sentry.Integrations.Postgres(),
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Filter out noisy errors
    ignoreErrors: [
      'NotFoundError',
      'UnauthorizedError',
      'ValidationError',
      'InvalidTransitionError',
    ],
    
    // Filter out health checks
    beforeSend(event, hint) {
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      return event;
    },
  });

  sentryInitialized = true;
  console.log(`[Monitoring] Sentry initialized for ${environment}`);
}

// ============================================================
// LOGGING UTILITIES
// ============================================================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

interface LogContext {
  userId?: string;
  dealId?: string;
  requestId?: string;
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
  duration?: number;
}

class Logger {
  private service: string;
  private environment: string;

  constructor(service: string = 'api') {
    this.service = service;
    this.environment = process.env.NODE_ENV || 'development';
  }

  private formatEntry(entry: LogEntry): string {
    const formatted = {
      '@timestamp': entry.timestamp,
      '@level': entry.level,
      '@service': this.service,
      '@env': this.environment,
      message: entry.message,
      ...(entry.context && { context: entry.context }),
      ...(entry.duration !== undefined && { duration_ms: entry.duration }),
      ...(entry.error && {
        error: {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack,
        },
      }),
    };
    return JSON.stringify(formatted);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    const formatted = this.formatEntry(entry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted);
        // Also send to Sentry
        if (sentryInitialized && error) {
          Sentry.captureException(error, {
            user: context?.userId ? { id: context.userId } : undefined,
            tags: {
              dealId: context?.dealId,
            },
            extra: context,
          });
        }
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  // Timing helper
  time(label: string, context?: LogContext): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`${label} completed`, { ...context, duration_ms: duration });
    };
  }
}

// Export singleton logger
export const logger = new Logger('creator-armour-api');

// ============================================================
// ERROR CLASSES
// ============================================================

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, true, context);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource} not found${id ? `: ${id}` : ''}`,
      'NOT_FOUND',
      404,
      true
    );
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401, true);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403, true);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CONFLICT', 409, true, context);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number = 60) {
    super(
      `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
      'RATE_LIMIT_EXCEEDED',
      429,
      true,
      { retryAfter }
    );
    this.name = 'RateLimitError';
  }
}

// ============================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================

import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error('Unhandled error', err, {
    userId: (req as any).user?.id,
    requestId: req.headers['x-request-id'] as string,
    path: req.path,
    method: req.method,
  });

  // Handle known errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      ...(err.context && { context: err.context }),
    });
    return;
  }

  // Handle validation errors from Zod
  if (err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: (err as any).errors,
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    code: 'INTERNAL_ERROR',
  });
}

// ============================================================
// REQUEST ID MIDDLEWARE
// ============================================================

import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

// ============================================================
// SENTRY REQUEST HANDLER
// ============================================================

export const sentryRequestHandler = Sentry.Handlers.requestHandler();
export const sentryTracingHandler = Sentry.Handlers.tracingHandler();
export const sentryErrorHandler = Sentry.Handlers.errorHandler();

// ============================================================
// PERFORMANCE MONITORING
// ============================================================

export function startTransaction(name: string, op: string) {
  if (!sentryInitialized) {
    return {
      finish: () => {},
      setStatus: () => {},
    };
  }
  return Sentry.startTransaction({ name, op });
}

export function setTag(key: string, value: string): void {
  if (sentryInitialized) {
    Sentry.setTag(key, value);
  }
}

export function setUser(user: { id: string; email?: string; role?: string }): void {
  if (sentryInitialized) {
    Sentry.setUser(user);
  }
}

export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  if (sentryInitialized) {
    Sentry.addBreadcrumb(breadcrumb);
  }
}

// ============================================================
// HEALTH CHECK
// ============================================================

export function getMonitoringHealth(): {
  sentry: boolean;
  environment: string;
  release: string;
} {
  return {
    sentry: sentryInitialized,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.GIT_COMMIT_SHA || 'unknown',
  };
}
