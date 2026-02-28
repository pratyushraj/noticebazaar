// Authentication middleware using Supabase JWT

import express from 'express';
import type { IncomingHttpHeaders } from 'http';
import { supabase, supabaseInitialized } from '../lib/supabase.js';

export interface AuthenticatedRequest extends express.Request {
  method: string;
  path: string;
  headers: IncomingHttpHeaders & { authorization?: string };
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const normalized = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = Buffer.from(normalized, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function shouldAllowOfflineJwtAuth(): boolean {
  const flag = (process.env.ALLOW_OFFLINE_JWT_AUTH || '').toLowerCase();
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

function buildOfflineUser(token: string): { id: string; email?: string; role?: string } | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp <= now) return null;

  const sub = payload.sub || payload.user_id;
  if (!sub || typeof sub !== 'string') return null;

  return {
    id: sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    role: typeof payload.role === 'string' ? payload.role : undefined,
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    if (!supabaseInitialized) {
      return res.status(500).json({ error: 'Server configuration error: Supabase not initialized. Please check environment variables.' });
    }

    // DEBUG: Log all hits to authMiddleware
    console.log(`[AuthMiddleware] Hit: ${req.method} ${req.path}`, {
      hasAuthHeader: !!req.headers?.authorization,
      authHeaderPrefix: req.headers?.authorization?.substring(0, 15)
    });

    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    let token = authHeader.substring(7).trim();
    // Remove surrounding quotes if present
    if (token.startsWith('"') && token.endsWith('"')) {
      token = token.substring(1, token.length - 1);
    }

    const allowOfflineFallback = shouldAllowOfflineJwtAuth();

    // Get user with timeout protection
    let user, authError;
    try {
      const result = await Promise.race([
        supabase.auth.getUser(token),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000))
      ]) as Awaited<ReturnType<typeof supabase.auth.getUser>>;
      user = result.data?.user;
      authError = result.error;
    } catch (err: any) {
      if (allowOfflineFallback) {
        const offlineUser = buildOfflineUser(token);
        if (offlineUser) {
          req.user = {
            id: offlineUser.id,
            email: offlineUser.email,
            role: offlineUser.role || 'creator'
          };
          console.warn('[AuthMiddleware] Using offline JWT fallback after auth request exception', {
            userId: offlineUser.id,
            error: err?.message,
            path: req.path,
            method: req.method
          });
          return next();
        }
      }

      if (err.message === 'Auth timeout') {
        if (allowOfflineFallback) {
          const offlineUser = buildOfflineUser(token);
          if (offlineUser) {
            req.user = {
              id: offlineUser.id,
              email: offlineUser.email,
              role: offlineUser.role || 'creator'
            };
            console.warn('[AuthMiddleware] Using offline JWT fallback after timeout', {
              userId: offlineUser.id,
              path: req.path,
              method: req.method
            });
            return next();
          }
        }
        return res.status(504).json({ error: 'Authentication timeout - Supabase connection issue' });
      }
      throw err;
    }

    if (authError || !user) {
      if (allowOfflineFallback && authError) {
        const offlineUser = buildOfflineUser(token);
        if (offlineUser) {
          req.user = {
            id: offlineUser.id,
            email: offlineUser.email,
            role: offlineUser.role || 'creator'
          };
          console.warn('[AuthMiddleware] Using offline JWT fallback after auth error', {
            userId: offlineUser.id,
            authError: authError.message,
            path: req.path,
            method: req.method
          });
          return next();
        }
      }
      console.warn('[AuthMiddleware] Token verification failed:', {
        event: 'auth_failure',
        error: authError?.message,
        errorCode: authError?.status,
        hasUser: !!user,
        tokenPrefix: token.substring(0, 10) + '...',
        path: req.path,
        method: req.method
      });
      return res.status(401).json({
        error: 'Invalid or expired token',
        details: authError?.message || 'User not found for token',
        path: req.path
      });
    }

    // Get user profile for role (with timeout)
    let profile;
    try {
      const profileResult = await Promise.race([
        supabase.from('profiles').select('role').eq('id', user.id).single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Profile timeout')), 3000))
      ]) as any;
      profile = profileResult.data;
    } catch (err: any) {
      // If profile query times out or fails, continue with default role
      console.warn('Profile query failed, using default role:', err.message);
      profile = null;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'creator'
    };

    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    if (error.message?.includes('timeout')) {
      return res.status(504).json({ error: 'Authentication timeout - Supabase connection issue' });
    }
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
};
