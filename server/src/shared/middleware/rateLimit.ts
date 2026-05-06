/**
 * Rate Limiting Middleware
 * 
 * Express middleware for rate limiting API requests.
 * 
 * @module shared/middleware/rateLimit
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../utils/errors';

/**
 * Rate limit store (in-memory for development)
 * In production, use Redis store
 */
interface RateLimitStore {
  hits: Map<string, { count: number; resetTime: number }>;
}

/**
 * Custom rate limit handler
 */
function rateLimitHandler(req: Request, res: Response, next: NextFunction) {
  throw new RateLimitError();
}

/**
 * Standard rate limiter
 * 100 requests per 15 minutes
 */
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGenerator: false },
  handler: rateLimitHandler,
});

/**
 * Strict rate limiter
 * 20 requests per 15 minutes
 * Use for sensitive endpoints
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGenerator: false },
  handler: rateLimitHandler,
});

/**
 * Auth rate limiter
 * 10 requests per 15 minutes
 * Use for login, signup, password reset
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGenerator: false },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: rateLimitHandler,
});

/**
 * API rate limiter
 * 1000 requests per 15 minutes
 * Use for general API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGenerator: false },
  handler: rateLimitHandler,
});

/**
 * Create a custom rate limiter
 * 
 * @param options - Rate limit options
 * @returns Express middleware
 * 
 * @example
 * router.get('/api/data', createRateLimiter({ windowMs: 60000, max: 50 }), handler);
 */
export function createRateLimiter(options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}): RequestHandler {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: {
      success: false,
      error: options.message || 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGenerator: false },
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    keyGenerator: options.keyGenerator,
    handler: rateLimitHandler,
  });
}

/**
 * IP-based rate limiter
 * Limits by IP address instead of user
 */
export function ipLimiter(windowMs: number = 15 * 60 * 1000, max: number = 100): RequestHandler {
  return rateLimit({
    windowMs,
    max,
    // Use default keyGenerator which handles IPs correctly for IPv6
    // keyGenerator: (req: Request) => {
    //   return req.ip || req.connection.remoteAddress || 'unknown';
    // },
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGenerator: false },
    handler: rateLimitHandler,
  });
}

/**
 * User-based rate limiter
 * Limits by authenticated user ID
 */
export function userLimiter(windowMs: number = 15 * 60 * 1000, max: number = 100): RequestHandler {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req: Request) => {
      const user = (req as any).user;
      // If we have a user ID, use it. Otherwise, let express-rate-limit 
      // handle the IP-based key to avoid IPv6 warnings.
      if (user?.id) return user.id;
      return 'anonymous'; // Fallback to anonymous, express-rate-limit will add IP if configured
    },
    message: {
      success: false,
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGenerator: false },
    handler: rateLimitHandler,
  });
}

/**
 * Endpoint-specific rate limiters
 */
export const endpointLimiters = {
  // Contract generation - expensive operation
  contractGeneration: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: 'Too many contract generation requests, please try again later',
  }),

  // AI analysis - expensive operation
  aiAnalysis: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Too many AI analysis requests, please try again later',
  }),

  // Email sending
  emailSending: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
    message: 'Too many email requests, please try again later',
  }),

  // File uploads
  fileUpload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100,
    message: 'Too many file uploads, please try again later',
  }),

  // Search queries
  search: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: 'Too many search requests, please try again later',
  }),
};

export default {
  standardLimiter,
  strictLimiter,
  authLimiter,
  apiLimiter,
  createRateLimiter,
  ipLimiter,
  userLimiter,
  endpointLimiters,
};
