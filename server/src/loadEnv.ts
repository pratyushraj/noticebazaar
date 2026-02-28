
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ESM-native way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const serverDir = dirname(__filename); // This will be server/src

// Load from server directory (where .env file is located is base server folder)
// serverDir is /path/to/server/src, so ../.env is /path/to/server/.env
const envPath = resolve(serverDir, '../.env');
console.log('[Env] Loading environment from:', envPath);
dotenv.config({ path: envPath });

// Fallback to current directory or default dotenv.config()
dotenv.config();

if (!process.env.SUPABASE_URL) {
    console.warn('[Env] ⚠️ SUPABASE_URL not found after loading .env');
} else {
    console.log('[Env] ✅ SUPABASE_URL loaded');
}
