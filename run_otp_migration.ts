import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addOtpFields() {
    console.log('🚀 Checking/Adding OTP columns to creator_signing_tokens...\n');

    // We can't easily check for column existence via JS client freely on all tables without permissions or specific RPC.
    // But we can try to Select otp_hash from the table.

    const { error } = await supabase
        .from('creator_signing_tokens')
        .select('otp_hash')
        .limit(1);

    if (!error) {
        console.log('✅ OTP columns already exist!');
        console.log('   No migration needed.\n');
        return;
    }

    // If error code is 'PGRST204' (column could not be found) or similar
    // We need to add the columns.

    const sql = `
-- Add OTP fields to creator_signing_tokens table
ALTER TABLE creator_signing_tokens
ADD COLUMN IF NOT EXISTS otp_hash TEXT,
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN creator_signing_tokens.otp_hash IS 'SHA-256 hash of the OTP code';
COMMENT ON COLUMN creator_signing_tokens.otp_expires_at IS 'When the OTP expires (10 minutes from generation)';
COMMENT ON COLUMN creator_signing_tokens.otp_attempts IS 'Number of failed OTP verification attempts';
COMMENT ON COLUMN creator_signing_tokens.otp_verified IS 'Whether OTP has been successfully verified';
COMMENT ON COLUMN creator_signing_tokens.otp_verified_at IS 'When OTP was verified';
`;

    console.log('❌ OTP columns are missing.');
    console.log('📝 Please run this SQL in Supabase SQL Editor:\n');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log('\nSteps:');
    console.log('1. Go to https://supabase.com/dashboard/project/[project-id]/sql');
    console.log('2. Paste and Run the SQL above');
    console.log('3. Restart server: npm run dev:fresh\n');
}

addOtpFields();
