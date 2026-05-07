
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'noticebazaar.legal@gmail.com')
    .maybeSingle();
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('Profile for noticebazaar.legal@gmail.com:');
  console.log(JSON.stringify(data, null, 2));
}

checkProfile();
