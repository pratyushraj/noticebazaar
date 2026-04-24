
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const username = 'dikshagargx_';
  
  // 1. Base lookup
  const { data: baseProfile } = await supabase
    .from('profiles')
    .select('id, username, instagram_handle')
    .eq('username', username)
    .maybeSingle();
    
  console.log('Base Profile:', baseProfile);
  
  if (baseProfile) {
    // 2. Extended lookup (exactly as in collabRequests.ts)
    const { data: extendedProfile } = await supabase
      .from('profiles')
      .select(`
        creator_category,
        instagram_followers,
        instagram_profile_photo,
        last_instagram_sync,
        open_to_collabs
      `)
      .eq('id', baseProfile.id)
      .maybeSingle();
      
    console.log('Extended Profile:', extendedProfile);
  }
}

test();
