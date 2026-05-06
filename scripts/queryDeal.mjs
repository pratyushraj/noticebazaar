import { createClient } from '@supabase/supabase-js';
import process from 'process';
import dotenv from 'dotenv';
dotenv.config();

const [,, dealId] = process.argv;
if (!dealId) {
  console.error('Usage: node scripts/queryDeal.mjs <DEAL_ID>');
  process.exit(2);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(3);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    console.log('Querying deal:', dealId);
    const { data: deal, error: dealErr } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealErr) {
      console.error('Deal query error:', dealErr);
      process.exit(4);
    }

    console.log('Deal row:');
    console.log(JSON.stringify(deal, null, 2));

    const { data: logs, error: logsErr } = await supabase
      .from('deal_action_logs')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (logsErr) {
      console.error('Logs query error:', logsErr);
      process.exit(5);
    }

    console.log('\nRecent action logs:');
    console.log(JSON.stringify(logs || [], null, 2));
  } catch (e) {
    console.error('Exception:', e);
    process.exit(1);
  }
})();
