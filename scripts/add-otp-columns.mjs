// Quick script to add OTP columns to contract_ready_tokens
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from server directory
dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function addOTPColumns() {
    console.log('Adding OTP columns to contract_ready_tokens...');

    // Check if table exists first
    const { data: tables, error: tablesError } = await supabase
        .from('contract_ready_tokens')
        .select('id')
        .limit(1);

    if (tablesError) {
        console.error('Error checking table:', tablesError);
        console.log('\n⚠️  The contract_ready_tokens table might not exist yet.');
        console.log('This is OK - the OTP columns will be added when the table is created.');
        return;
    }

    console.log('✅ Table exists. Columns will be added via SQL migration.');
    console.log('\nPlease run this SQL in your Supabase SQL Editor:');
    console.log('---');
    console.log(`
ALTER TABLE public.contract_ready_tokens
ADD COLUMN IF NOT EXISTS otp_hash text,
ADD COLUMN IF NOT EXISTS otp_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS otp_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS otp_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS otp_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_valid boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_contract_ready_tokens_otp_hash 
ON public.contract_ready_tokens(otp_hash) 
WHERE otp_hash IS NOT NULL;
  `);
    console.log('---');
}

addOTPColumns().catch(console.error);
