import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    const { data: user } = await supabase.auth.admin.getUserById('b2919d2e-bfb2-4ab0-af24-1749df80a58b');
    console.log('User metadata:', JSON.stringify(user?.user?.user_metadata, null, 2));
    console.log('Email confirmed:', user?.user?.email_confirmed_at);
    console.log('Has password:', !!user?.user?.encrypted_password);
}
run();
