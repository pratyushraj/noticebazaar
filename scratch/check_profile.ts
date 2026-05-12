import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const handle = 'thegleamngown';
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`instagram_handle.eq.${handle},full_name.eq.${handle}`)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    
    // Try searching by handle if single failed
    const { data: profiles, error: searchError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('instagram_handle', `%${handle}%`);
      
    if (profiles && profiles.length > 0) {
      console.log('Found similar profiles:');
      profiles.forEach(p => console.log(`- ${p.full_name} (@${p.instagram_handle}) ID: ${p.id}`));
    }
  } else {
    console.log('Found profile:', profile.full_name, '(@' + profile.instagram_handle + ')');
    console.log('ID:', profile.id);
    console.log('Current discovery_video_url:', profile.discovery_video_url);
  }
}

main();
