
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCreators() {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, first_name, last_name, business_name, avatar_url, instagram_profile_photo')
    .in('username', ['virat.kohli', 'beyonce']);

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log('Profiles found:', JSON.stringify(data, null, 2));
}

checkCreators();
