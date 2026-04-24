import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCreator() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, instagram_handle, instagram_profile_photo, avatar_url')
    .or('username.eq.dikshagargx_,instagram_handle.eq.dikshagargx_')
    .maybeSingle();

  if (error) {
    console.error('Error fetching creator:', error);
    return;
  }

  console.log('Creator data:', data);
}

checkCreator();
