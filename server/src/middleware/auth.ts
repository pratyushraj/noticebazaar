// Authentication middleware using Supabase JWT

import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseInitialized } from '../index.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
  body: any;
  params: any;
  query: any;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!supabaseInitialized) {
      return res.status(500).json({ error: 'Server configuration error: Supabase not initialized. Please check environment variables.' });
    }
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    
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
      if (err.message === 'Auth timeout') {
        return res.status(504).json({ error: 'Authentication timeout - Supabase connection issue' });
      }
      throw err;
    }

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token', details: authError?.message });
    }

    // Get user profile for role (with timeout)
    let profile;
    try {
      const profileResult = await Promise.race([
        supabase.from('profiles').select('role').eq('id', user.id).single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Profile timeout')), 3000))
      ]) as Awaited<ReturnType<typeof supabase.from>>;
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

