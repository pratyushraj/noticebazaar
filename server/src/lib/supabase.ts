
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase.js';

// Initialize Supabase client
// Use VITE_SUPABASE_URL if SUPABASE_URL is not set or is a variable reference (for local dev)
let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
// If SUPABASE_URL looks like a variable reference (${...}), use VITE_SUPABASE_URL instead
if (supabaseUrl.startsWith('${') || supabaseUrl === '') {
    supabaseUrl = process.env.VITE_SUPABASE_URL || '';
}

let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
// If SERVICE_ROLE_KEY looks like a variable reference, try to find it
if (supabaseServiceKey.startsWith('${') || supabaseServiceKey === '') {
    // Try to find the service role key - it might be in a different env var name
    supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
        || process.env.SUPABASE_SERVICE_KEY
        || process.env.SUPABASE_KEY
        || '';
}

// Initialize Supabase client with error handling
// Don't throw errors during module initialization (crashes Vercel serverless functions)
const placeholderUrl = 'https://placeholder.supabase.co';
const placeholderKey = 'placeholder-key';

let supabaseClient: ReturnType<typeof createClient<Database>>;
let supabaseInitialized = false;

try {
    // Check if we have valid credentials (not placeholders)
    const hasValidCredentials =
        supabaseUrl &&
        supabaseUrl !== placeholderUrl &&
        supabaseServiceKey &&
        supabaseServiceKey !== placeholderKey;

    if (hasValidCredentials) {
        supabaseClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        supabaseInitialized = true;
        console.log('✅ Supabase client initialized successfully (lib)');
    } else {
        // Create a dummy client to prevent crashes (will fail on actual use)
        supabaseClient = createClient<Database>(placeholderUrl, placeholderKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        console.warn('⚠️ Supabase client initialized with placeholder values in lib. API calls will fail.');
    }
} catch (error: any) {
    console.error('❌ Failed to initialize Supabase client (lib):', error.message);
    // Create a dummy client to prevent crashes
    supabaseClient = createClient<Database>(placeholderUrl, placeholderKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

export const supabase = supabaseClient;
export { supabaseInitialized };
export const supabaseConfig = {
    url: supabaseUrl,
    serviceKey: supabaseServiceKey
};
