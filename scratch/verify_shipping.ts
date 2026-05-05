import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDeal() {
  const { data, error } = await supabase
    .from('brand_deals')
    .select('id, shipping_required, deal_type, status')
    .eq('id', 'a0284c59-9043-446f-b9cc-aa4556debd9f')
    .single();

  if (error) {
    console.error(error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

checkDeal();
