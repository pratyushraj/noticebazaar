import { Router, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.js';
import type { Database } from '../types/supabase.js';

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAuthKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_KEY ||
  '';

const createAuthClient = () => {
  if (!supabaseUrl || !supabaseAuthKey) {
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseAuthKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const isEmailLike = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

router.post('/login', async (req, res: Response) => {
  try {
    const identifier = String(req.body?.identifier || req.body?.email || '').trim();
    const password = String(req.body?.password || '');

    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Identifier and password are required' });
    }

    const authClient = createAuthClient();
    if (!authClient) {
      console.error('[Auth] Missing Supabase auth credentials for /login route');
      return res.status(500).json({ success: false, error: 'Login is temporarily unavailable' });
    }

    let email = identifier;

    if (!isEmailLike(identifier)) {
      const normalizedHandle = identifier.replace(/^@+/, '').trim().toLowerCase();

      const { data: profileMatch, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .or(`username.eq.${normalizedHandle},instagram_handle.eq.${normalizedHandle}`)
        .maybeSingle();

      if (profileError) {
        console.error('[Auth] Handle lookup failed:', profileError);
        return res.status(500).json({ success: false, error: 'Failed to resolve login identifier' });
      }

      if (!profileMatch?.id) {
        return res.status(401).json({ success: false, error: 'Invalid email/username or password' });
      }

      const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(profileMatch.id);
      if (authUserError) {
        console.error('[Auth] Failed to fetch auth user by profile id:', authUserError);
        return res.status(500).json({ success: false, error: 'Failed to resolve login identifier' });
      }

      email = String(authUserData?.user?.email || '').trim();
      if (!email) {
        return res.status(401).json({ success: false, error: 'Invalid email/username or password' });
      }
    }

    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const message = error.message.includes('Invalid login credentials')
        ? 'Invalid email/username or password'
        : error.message;
      return res.status(401).json({ success: false, error: message });
    }

    if (!data.session || !data.user) {
      return res.status(401).json({ success: false, error: 'Login failed' });
    }

    return res.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
        user: data.user,
      },
    });
  } catch (error: any) {
    console.error('[Auth] POST /login failed:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to sign in' });
  }
});

export default router;
