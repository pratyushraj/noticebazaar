
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, instagram_handle, instagram_profile_photo, avatar_url, instagram_followers')
    .eq('instagram_handle', 'ronaldo');

  if (error) {
    console.error('Error fetching profile:', error);
    return;
  }

  console.log('Profile found:', data);
}

checkProfile();
