import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data, error } = await supabase.from('brand_deals').select('id, brand_id, brand_email, shipping_required, deal_type').eq('id', '408e6fac-cb12-4694-b2a1-971eb92f9bce').maybeSingle();
  console.log('Deal:', data, 'Error:', error);
  
  const { data: data2, error: error2 } = await supabase.from('brand_deals').select('collab_type').limit(1);
  console.log('collab_type check:', data2, 'Error:', error2);
}
run();
