
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDeal() {
  const dealId = '408e6fac-cb12-4694-b2a1-971eb92f9bce';

  const { data, error } = await supabase
    .from('brand_deals')
    .select('id, deal_type, shipping_required, shipping_status, brand_name')
    .eq('id', dealId)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  console.log('Deal Data:');
  console.log(JSON.stringify(data, null, 2));
}

checkDeal();
