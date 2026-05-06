/**
 * Security Middleware
 * 
 * Rate limiting, input validation, and security headers.
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult, ValidationChain } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';
import { logger, ValidationError } from '../lib/monitoring.js';

// ============================================================
// SECURITY HEADERS
// ============================================================

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.supabase.io', 'https://*.supabase.co'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// ============================================================
// RATE LIMITING
// ============================================================

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGenerator: false },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      path: req.path,
      ip: req.ip,
      userId: (req as any).user?.id,
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGenerator: false },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Very strict limiter for OTP endpoints
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 OTP requests per hour
  message: {
    success: false,
    error: 'Too many OTP requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGenerator: false },
});

// Collab request submission limiter (per IP and per email domain)
export const collabSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Effectively disabled for testing
  keyGenerator: (req) => {
    const domain = req.body?.brand_email?.split('@')[1];
    if (domain) return domain;
    return 'unknown-domain'; // Let default IP rate limiting handle the rest if needed
  },
  message: {
    success: false,
    error: 'Too many collab submissions from this domain. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGenerator: false },
});

// Brand dashboard limiter
export const brandDashboardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per 15 min
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGenerator: false },
});

// Payment endpoint limiter
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 payment operations per hour
  message: {
    success: false,
    error: 'Too many payment operations. Please try again later.',
    code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGenerator: false },
});

// Contract generation limiter
export const contractLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 contract generations per hour
  message: {
    success: false,
    error: 'Too many contract generation requests.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGenerator: false },
});

// ============================================================
// INPUT SANITIZATION
// ============================================================

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Check for potential XSS
      sanitized[key] = sanitizeHtml(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeHtml(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Middleware to sanitize request body
 */
export function sanitizeBody(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

// ============================================================
// INPUT VALIDATION
// ============================================================

/**
 * Validation middleware wrapper
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
      return;
    }

    // Format errors
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
    }));

    logger.warn('Validation failed', {
      path: req.path,
      errors: formattedErrors,
      userId: (req as any).user?.id,
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: formattedErrors,
    });
  };
}

// ============================================================
// COMMON VALIDATORS
// ============================================================

export const validators = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),

  phone: body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{9,14}$/)
    .withMessage('Please provide a valid phone number'),

  otp: body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits'),

  dealId: body('dealId')
    .isUUID()
    .withMessage('Invalid deal ID'),

  amount: body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),

  gstNumber: body('gstNumber')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Invalid GST number format'),

  panNumber: body('panNumber')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Invalid PAN number format'),

  ifscCode: body('ifscCode')
    .optional()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Invalid IFSC code format'),

  accountNumber: body('accountNumber')
    .optional()
    .matches(/^[0-9]{9,18}$/)
    .withMessage('Account number must be 9-18 digits'),

  url: (field: string) => body(field)
    .optional()
    .isURL()
    .withMessage(`Invalid URL for ${field}`),

  string: (field: string, min: number = 1, max: number = 1000) => 
    body(field)
      .trim()
      .isLength({ min, max })
      .withMessage(`${field} must be between ${min} and ${max} characters`),

  optionalString: (field: string, max: number = 1000) => 
    body(field)
      .optional()
      .trim()
      .isLength({ max })
      .withMessage(`${field} must be at most ${max} characters`),
};

// ============================================================
// FILE UPLOAD VALIDATION
// ============================================================

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationOptions {
  allowedMimeTypes?: string[];
  maxSize?: number;
}

export function validateFile(
  options: FileValidationOptions = {}
): (req: Request, res: Response, next: NextFunction) => void {
  const {
    allowedMimeTypes = ALLOWED_MIME_TYPES,
    maxSize = MAX_FILE_SIZE,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const file = req.file;

    if (!file) {
      next();
      return;
    }

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype || '')) {
      logger.warn('Invalid file type uploaded', {
        mimetype: file.mimetype,
        userId: (req as any).user?.id,
      });
      
      res.status(400).json({
        success: false,
        error: `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
        code: 'INVALID_FILE_TYPE',
      });
      return;
    }

    // Check file size
    if (file.size > maxSize) {
      res.status(400).json({
        success: false,
        error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
        code: 'FILE_TOO_LARGE',
      });
      return;
    }

    next();
  };
}

// ============================================================
// SQL INJECTION PREVENTION
// ============================================================

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/i,
  /(--)|(\/\*)|(\*\/)/,
  /(\bOR\b|\bAND\b).*?=/i,
  /(\bunion\b.*?\bselect\b)/i,
  /('|")/g,
];

/**
 * Check for potential SQL injection
 */
export function hasSqlInjection(value: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Middleware to check for SQL injection in query params
 */
export function checkSqlInjection(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const checkValue = (value: any): boolean => {
    if (typeof value === 'string' && hasSqlInjection(value)) {
      return true;
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  // Check query params
  if (req.query && checkValue(req.query)) {
    logger.warn('Potential SQL injection detected in query params', {
      query: req.query,
      ip: req.ip,
      userId: (req as any).user?.id,
    });
    
    res.status(400).json({
      success: false,
      error: 'Invalid input detected',
      code: 'INVALID_INPUT',
    });
    return;
  }

  // Check body (basic check - parameterized queries should be used anyway)
  if (req.body && checkValue(req.body)) {
    logger.warn('Potential SQL injection detected in body', {
      ip: req.ip,
      userId: (req as any).user?.id,
    });
    
    res.status(400).json({
      success: false,
      error: 'Invalid input detected',
      code: 'INVALID_INPUT',
    });
    return;
  }

  next();
}

// ============================================================
// CORS CONFIGURATION
// ============================================================

import cors from 'cors';

const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.PRODUCTION_URL,
].filter(Boolean) as string[];

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-API-Key',
  ],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400, // 24 hours
};

export const corsMiddleware = cors(corsOptions);

// ============================================================
// REQUEST SIZE LIMIT
// ============================================================

import express from 'express';

export const jsonLimit = express.json({ limit: '10mb' });
export const urlencodedLimit = express.urlencoded({ extended: true, limit: '10mb' });
