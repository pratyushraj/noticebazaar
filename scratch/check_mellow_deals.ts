import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDeals() {
  const { data, error } = await supabase
    .from('brand_deals')
    .select('id, brand_name, status, deal_type, amount_paid, payment_status, profiles!inner(username)')
    .eq('brand_name', 'Mellow Prints');

  if (error) {
    console.error(error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

checkDeals();
