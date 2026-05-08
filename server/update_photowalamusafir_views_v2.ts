import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      avg_reel_views_manual: 30000,
      is_elite_verified: true 
    })
    .eq('username', 'photowalamusafir')
    .select();

  if (error) {
    console.error('Error updating profile:', error);
    return;
  }

  console.log('Updated Profile Data:');
  console.log(JSON.stringify(data, null, 2));
}

updateProfile();
