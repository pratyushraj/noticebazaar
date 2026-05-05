import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDeals() {
  const { data, error } = await supabase
    .from('brand_deals')
    .select('id, brand_name, deal_type, shipping_required, requires_shipping')
    .in('id', ['a0284c59-9043-446f-b9cc-aa4556debd9f', '99cd86c8-316c-4be5-8d53-ba7de66cccf7']);

  if (error) {
    console.error(error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

checkDeals();
