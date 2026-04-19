import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase.from('profiles').select('id, first_name, last_name, username, business_name').ilike('username', '%beyonce%');
  console.log('Profiles with beyonce username:', JSON.stringify(data, null, 2));
}
check();
