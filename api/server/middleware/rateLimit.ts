// Rate limiting middleware for API endpoints

import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // per minute per user

export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as any).user?.id || (req as any).ip || 'unknown';
  const now = Date.now();
  const key = `rate_limit:${userId}`;

  if (!store[key] || now > store[key].resetAt) {
    store[key] = { count: 1, resetAt: now + WINDOW_MS };
    return next();
  }

  if (store[key].count >= MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((store[key].resetAt - now) / 1000)
    });
  }

  store[key].count++;
  next();
};

