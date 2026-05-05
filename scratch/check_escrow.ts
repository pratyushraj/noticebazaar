import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getRecentEscrow() {
  const { data, error } = await supabase
    .from('brand_deals')
    .select('id, brand_name, creator_id, deal_amount, status, payment_status, payment_id, updated_at')
    .not('payment_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error fetching escrow:', error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

getRecentEscrow();
