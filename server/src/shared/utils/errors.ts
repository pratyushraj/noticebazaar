/**
 * Custom Error Classes
 * 
 * Standardized error types for consistent error handling across the API.
 * 
 * @module shared/utils/errors
 */

/**
 * Base application error
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400 Bad Request)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

/**
 * Authentication error (401 Unauthorized)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR', true);
  }
}

/**
 * Authorization error (403 Forbidden)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR', true);
  }
}

/**
 * Not found error (404 Not Found)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', true);
  }
}

/**
 * Conflict error (409 Conflict)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 409, 'CONFLICT', true, details);
  }
}

/**
 * Rate limit error (429 Too Many Requests)
 */
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Too many requests, please try again later', 429, 'RATE_LIMIT_EXCEEDED', true, 
      retryAfter ? { retryAfter } : undefined
    );
  }
}

/**
 * External service error (502 Bad Gateway)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(`External service '${service}' is unavailable`, 502, 'EXTERNAL_SERVICE_ERROR', true,
      originalError ? { originalMessage: originalError.message } : undefined
    );
  }
}

/**
 * Database error (500 Internal Server Error)
 */
export class DatabaseError extends AppError {
  constructor(operation: string, originalError?: Error) {
    super(`Database operation failed: ${operation}`, 500, 'DATABASE_ERROR', false,
      originalError ? { originalMessage: originalError.message } : undefined
    );
  }
}

/**
 * Helper function to determine if an error is operational
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Helper function to extract error details for API response
 */
export function getErrorDetails(error: Error): {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, any>;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  // Handle Supabase errors
  const anyError = error as any;
  if (anyError.code && anyError.message) {
    // Common Supabase error codes
    if (anyError.code === 'PGRST116') {
      return {
        message: 'Resource not found',
        code: 'NOT_FOUND',
        statusCode: 404,
      };
    }
    if (anyError.code === '23505') {
      return {
        message: 'Resource already exists',
        code: 'CONFLICT',
        statusCode: 409,
      };
    }
    if (anyError.code === '23503') {
      return {
        message: 'Referenced resource not found',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      };
    }
  }

  // Generic error
  return {
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message,
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  };
}

/**
 * Type guard for AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
