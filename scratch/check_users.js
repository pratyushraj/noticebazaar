import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('profiles').select('id, email, username, role, onboarding_complete');
  if (error) {
    console.error(error);
  } else {
    console.log(`Found ${data.length} profiles:`);
    console.table(data);
  }
}
run();
