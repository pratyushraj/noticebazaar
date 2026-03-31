/**
 * Authentication Middleware
 * 
 * Express middleware for authenticating requests using Supabase JWT tokens.
 * 
 * @module shared/middleware/auth
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

/**
 * Extended request with user data
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
    aud: string;
    [key: string]: any;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
  };
}

/**
 * Supabase client for token verification
 */
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || ''
    );
  }
  return supabaseClient;
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Verify JWT token and get user
 */
async function verifyToken(token: string): Promise<{ user: any; session: any } | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) {
    return null;
  }

  return {
    user: data.user,
    session: null,
  };
}

/**
 * Authentication middleware
 * 
 * Verifies the JWT token and attaches user to request.
 * 
 * @example
 * router.get('/protected', authMiddleware, handler);
 */
export function authMiddleware(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractBearerToken(req);
      
      if (!token) {
        throw new AuthenticationError('No authentication token provided');
      }

      const result = await verifyToken(token);
      
      if (!result) {
        throw new AuthenticationError('Invalid or expired token');
      }

      // Attach user and session to request
      (req as AuthenticatedRequest).user = result.user;
      (req as AuthenticatedRequest).session = result.session;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Optional authentication middleware
 * 
 * Attempts to verify token but doesn't fail if not present.
 * Useful for endpoints that work for both authenticated and unauthenticated users.
 * 
 * @example
 * router.get('/public', optionalAuthMiddleware, handler);
 */
export function optionalAuthMiddleware(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractBearerToken(req);
      
      if (token) {
        const result = await verifyToken(token);
        if (result) {
          (req as AuthenticatedRequest).user = result.user;
          (req as AuthenticatedRequest).session = result.session;
        }
      }

      next();
    } catch (error) {
      // Don't fail, just continue without user
      next();
    }
  };
}

/**
 * Role-based authorization middleware
 * 
 * Must be used after authMiddleware.
 * 
 * @example
 * router.delete('/admin/users', authMiddleware(), requireRole('admin'), handler);
 */
export function requireRole(...roles: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      throw new AuthenticationError('Authentication required');
    }

    const userRole = user.role || user.user_metadata?.role;
    
    if (!userRole || !roles.includes(userRole)) {
      throw new AuthorizationError(`Required role: ${roles.join(' or ')}`);
    }

    next();
  };
}

/**
 * Resource ownership middleware factory
 * 
 * Creates middleware that checks if the authenticated user owns the resource.
 * 
 * @param getResourceUserId - Function to extract resource owner ID from request
 * 
 * @example
 * router.delete('/profiles/:id', 
 *   authMiddleware(), 
 *   requireOwnership((req) => req.params.id),
 *   handler
 * );
 */
export function requireOwnership(
  getResourceUserId: (req: Request) => string | Promise<string>
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      throw new AuthenticationError('Authentication required');
    }

    try {
      const resourceUserId = await getResourceUserId(req);
      
      // Allow if user owns the resource or is an admin
      const isAdmin = user.role === 'admin' || user.user_metadata?.role === 'admin';
      
      if (user.id !== resourceUserId && !isAdmin) {
        throw new AuthorizationError('You do not have access to this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Admin-only middleware
 * 
 * Shorthand for requireRole('admin').
 */
export function requireAdmin(): RequestHandler[] {
  return [authMiddleware(), requireRole('admin')];
}

/**
 * Creator-only middleware
 */
export function requireCreator(): RequestHandler[] {
  return [authMiddleware(), requireRole('creator')];
}

/**
 * Brand-only middleware
 */
export function requireBrand(): RequestHandler[] {
  return [authMiddleware(), requireRole('brand')];
}

/**
 * Lawyer-only middleware
 */
export function requireLawyer(): RequestHandler[] {
  return [authMiddleware(), requireRole('lawyer')];
}

/**
 * Combined auth middleware with role check
 * 
 * Convenience function that combines auth and role check.
 * 
 * @example
 * router.get('/admin/dashboard', authWithRole('admin'), handler);
 */
export function authWithRole(...roles: string[]): RequestHandler[] {
  return [authMiddleware(), requireRole(...roles)];
}

export default {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requireOwnership,
  requireAdmin,
  requireCreator,
  requireBrand,
  requireLawyer,
  authWithRole,
};
