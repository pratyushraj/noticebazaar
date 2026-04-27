import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data, error } = await supabase.from('brand_deals').select('*').eq('id', '408e6fac-cb12-4694-b2a1-971eb92f9bce');
  console.log('Deal:', data, 'Error:', error);
}
run();
