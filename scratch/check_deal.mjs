import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDeal() {
  const { data, error } = await supabase
    .from('brand_deals')
    .select('*')
    .eq('id', '408e6fac-cb12-4694-b2a1-971eb92f9bce')
    .single();

  if (error) {
    console.error('Error fetching deal:', error);
  } else {
    console.log('Deal data:', JSON.stringify(data, null, 2));
  }
}

checkDeal();
