import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase.from('collab_requests').select('*').eq('id', '80d25aca-a857-43cf-8efb-78379b4ea94c');
  console.log(data);
}
check();
