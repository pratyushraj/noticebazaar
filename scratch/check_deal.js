
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDeal() {
  const dealId = '408e6fac-cb12-4694-b2a1-971eb92f9bce';
  const { data, error } = await supabase
    .from('brand_deals')
    .select('id, status, deal_type, deal_amount, amount_paid, payment_id, payment_status, brand_id, creator_id')
    .eq('id', dealId)
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Deal Data:', JSON.stringify(data, null, 2));
  }
}

checkDeal();
