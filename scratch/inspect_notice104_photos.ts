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
    .select('username, avatar_url, instagram_profile_photo, discovery_card_image')
    .eq('username', 'notice104')
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return;
  }

  console.log('Profile photo fields for notice104:');
  console.log(JSON.stringify(data, null, 2));
}

inspectProfile();
