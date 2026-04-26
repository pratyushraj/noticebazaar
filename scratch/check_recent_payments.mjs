import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRecentPayments() {
  const { data, error } = await supabase
    .from('deal_action_logs')
    .select('*')
    .eq('event', 'PAYMENT_CAPTURED')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching logs:', error);
  } else {
    console.log('Recent captured payments:', JSON.stringify(data, null, 2));
  }
}

checkRecentPayments();
