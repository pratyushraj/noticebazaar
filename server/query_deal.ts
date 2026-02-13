import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const dealId = 'ac01cd76-9469-412f-bc2f-5009df57e15b';
  const { data: deal, error: dealError } = await supabase
    .from('brand_deals')
    .select('*')
    .eq('id', dealId)
    .single();

  if (dealError) {
    console.error('Error fetching deal:', dealError);
  } else {
    console.log('Deal:', JSON.stringify(deal, null, 2));
  }

  const { data: logs, error: logsError } = await supabase
    .from('deal_action_logs')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  if (logsError) {
    console.error('Error fetching logs:', logsError);
  } else {
    console.log('Logs:', JSON.stringify(logs, null, 2));
  }
}

run();
