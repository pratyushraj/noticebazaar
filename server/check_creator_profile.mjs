import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const handle = 'ddindialive';
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.eq.${handle},instagram_handle.eq.${handle}`)
    .maybeSingle();
    
  console.log('Profile:', JSON.stringify(profile, null, 2));
  console.log('Error:', error);
}

check();
