import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, avatar_url, profile_image_url')
    .eq('username', 'notice104')
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return;
  }

  console.log('Profile data for notice104:');
  console.log(JSON.stringify(data, null, 2));
}

checkProfile();
