import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', 'photowalamusafir')
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return;
  }

  console.log('Full Profile Data for photowalamusafir:');
  console.log(JSON.stringify(data, null, 2));
}

checkProfile();
