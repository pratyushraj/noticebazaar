// @ts-nocheck
// Auth API routes
// Handles resolving identifiers (username/instagram_handle) to emails for Supabase login

import { Router, Request, Response } from 'express';
import { supabase } from '../index';

const router = Router();

/**
 * POST /api/auth/login
 * Resolve an identifier (email, username, or instagram_handle) to an email address.
 * Used by the frontend to allow logging in with usernames while using Supabase email/password auth.
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: 'Identifier is required' });
    }

    // If identifier is already an email, just return it (though frontend usually handles this)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    if (isEmail && password !== '__resolve_only__') {
       // This route is primarily for resolution. If they sent a password, they might expect full auth,
       // but we prefer Supabase client-side for that.
       return res.json({ email: identifier });
    }

    console.log('[Auth] Resolving identifier:', identifier);

    // Search for profile by username or instagram_handle to get the user ID
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .or(`username.eq."${identifier}",instagram_handle.eq."${identifier}"`)
      .maybeSingle();

    if (error) {
      console.error('[Auth] Error searching profiles:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!profile) {
      console.warn('[Auth] No profile found for identifier:', identifier);
      return res.status(404).json({ error: 'No account found with that username' });
    }

    // Use admin API to get the email from the auth system
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);

    if (userError || !userData?.user?.email) {
      console.error('[Auth] Error fetching user from auth.admin:', userError);
      return res.status(404).json({ error: 'Account found but email could not be resolved' });
    }

    const resolvedEmail = userData.user.email;
    console.log('[Auth] Resolved email for', identifier, '->', resolvedEmail);

    return res.json({ 
      success: true, 
      email: resolvedEmail,
      resolved_email: resolvedEmail 
    });

  } catch (error: any) {
    console.error('[Auth] Resolution exception:', error);
    res.status(500).json({ error: 'Failed to resolve account' });
  }
});

export default router;
