import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase'; // Import the Database type
import { getApiBaseUrl } from '@/lib/utils/api';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * ISP Bypass Implementation (Method B):
 * Proxy is opt-in via VITE_USE_SUPABASE_PROXY=true.
 * Default remains direct Supabase for production stability.
 */
const getSupabaseUrl = () => {
  if (!rawSupabaseUrl) return '';

  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const useProxy = import.meta.env.VITE_USE_SUPABASE_PROXY === 'true' && !isLocalhost;

  if (useProxy) {
    const apiBase = getApiBaseUrl();
    // getApiBaseUrl returns "https://api.creatorarmour.com" (no trailing slash)
    return `${apiBase}/supabase-proxy`;
  }

  return rawSupabaseUrl;
};

const supabaseUrl = getSupabaseUrl();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your .env file.');
}

// Get the current origin for redirect URLs (works in browser)
// With HashRouter, we need to include the hash prefix for OAuth redirects
// Default redirect after OAuth should go to dashboard
const getRedirectUrl = () => {
  if (typeof window !== 'undefined') {
    // Use path-based routing for OAuth redirects - default to dashboard
    return `${window.location.origin}/creator-dashboard`;
  }
  // Fallback for SSR or Edge Functions
  return import.meta.env.VITE_APP_URL || 'http://localhost:8080';
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use current origin as default redirect URL
    redirectTo: getRedirectUrl(),
    // Auto-refresh tokens
    autoRefreshToken: true,
    // Persist session
    persistSession: true,
    // Detect session from URL hash
    detectSessionInUrl: true,
  },
});
