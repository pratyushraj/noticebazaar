import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const username = 'storiesbyseema';
  console.log(`Updating rates for @${username}...`);

  const { data, error } = await supabase
    .from('profiles')
    .update({
      reel_price: 7000,
      collaboration_preference: 'Paid',
      barter_min_value: 0,
      updated_at: new Date().toISOString()
    })
    .eq('username', username)
    .select('username, reel_price, collaboration_preference, barter_min_value')
    .single();
  
  if (error) {
    console.error('❌ Error updating profile rates:', error.message);
    return;
  }
  
  console.log('✅ Rates updated successfully in database!');
  console.log('Username:', data.username);
  console.log('Reel Price (INR):', data.reel_price);
  console.log('Collaboration Preference:', data.collaboration_preference);
  console.log('Barter Min Value:', data.barter_min_value);
}

main();
