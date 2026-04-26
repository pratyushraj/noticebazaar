import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLogs() {
  const { data, error } = await supabase
    .from('deal_action_logs')
    .select('*')
    .eq('deal_id', '408e6fac-cb12-4694-b2a1-971eb92f9bce')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error);
  } else {
    console.log('Action logs:', JSON.stringify(data, null, 2));
  }
}

checkLogs();
