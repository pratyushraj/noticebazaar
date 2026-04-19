import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
  const email = 'mellowprints0707@yopmail.com';
  console.log("Checking profiles...");
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('email', email);
  console.log(error || profile);

  console.log("Checking collab_requests...");
  const { data: requests, error: reqError } = await supabase.from('collab_requests').select('*').eq('brand_email', email);
  console.log(reqError || requests);
}
test();
