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
  const handle = process.argv.find(arg => arg.startsWith('--handle='))?.split('=')[1] || '_rounak_agarwal_17';
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('instagram_handle', handle)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
  } else if (!profile) {
    console.log('Profile not found for handle:', handle);
    
    // Try searching by handle if single failed
    const { data: profiles, error: searchError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('instagram_handle', `%${handle}%`);
      
    if (profiles && profiles.length > 0) {
      console.log('Found similar profiles:');
      profiles.forEach(p => console.log(`- ${p.first_name} ${p.last_name} (@${p.instagram_handle}) ID: ${p.id}`));
    }
  } else {
    console.log('Found profile:', profile.first_name, profile.last_name, '(@' + profile.instagram_handle + ')');
    console.log('ID:', profile.id);
    console.log('Username:', profile.username);
    console.log('Role:', profile.role);
    console.log('Onboarding Complete:', profile.onboarding_complete);
    console.log('Avatar URL:', profile.avatar_url);
    console.log('Current discovery_video_url:', profile.discovery_video_url);
    console.log('Followers:', profile.instagram_followers);
    console.log('Niches:', profile.content_niches);
    console.log('Past Brands:', profile.past_brands);
    console.log('Past Brand Count:', profile.past_brand_count);
    console.log('Top Cities:', profile.top_cities);
    console.log('Gender Split:', profile.audience_gender_split);
  }
}

main();
