
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'api/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDealAmounts() {
  const { data: deals, error } = await supabase
    .from('brand_deals')
    .select('id, brand_name, status, deal_amount, collab_request_id')
    .in('status', ['accepted_pending_otp'])
    .order('updated_at', { ascending: false });
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Deals with accepted_pending_otp:');
  console.table(deals);
}

checkDealAmounts();
