import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase'; // Import the Database type

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your .env file.');
}

// Get the current origin for redirect URLs (works in browser)
// With HashRouter, we need to include the hash prefix for OAuth redirects
// Default redirect after OAuth should go to dashboard
const getRedirectUrl = () => {
  if (typeof window !== 'undefined') {
    // Use hash-based routing for OAuth redirects - default to dashboard
    return `${window.location.origin}/#/creator-dashboard`;
  }
  // Fallback for SSR or Edge Functions
  return import.meta.env.VITE_APP_URL || 'http://localhost:32100';
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