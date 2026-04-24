import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', 'notice104')
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return;
  }

  console.log('Profile keys for notice104:');
  console.log(Object.keys(data).sort());
  console.log('Avatar URL:', data.avatar_url);
}

inspectProfile();
