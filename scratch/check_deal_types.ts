
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'api/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDealTypes() {
  const { data: deal, error } = await supabase
    .from('brand_deals')
    .select('id, deal_type, collab_type, status, deal_amount')
    .eq('id', 'c3f088bd-7258-4a1a-b2e1-1920d1387c94')
    .maybeSingle();
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Deal Type Check:');
  console.table([deal]);
}

checkDealTypes();
