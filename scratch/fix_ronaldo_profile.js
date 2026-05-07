
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProfile() {
  const userId = '06baef82-4805-44c5-83bf-ac5ff2c9b4b8';
  const publicUrl = 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/storage/v1/object/public/creator-assets/06baef82-4805-44c5-83bf-ac5ff2c9b4b8/avatars/profile-1778151028583.jpeg';
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      instagram_profile_photo: publicUrl,
      avatar_url: publicUrl
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    return;
  }

  console.log('Profile updated successfully:', data);
}

fixProfile();
