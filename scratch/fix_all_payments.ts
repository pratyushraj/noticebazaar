import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: 'api/server/.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase keys');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const dealsToFix = [
    { id: '61f867a0-13cc-49e2-a875-c0922264aba8', orderId: 'order_SlzrdEn7lNZlnh', amount: 2.24 },
    { id: 'c6ef8dfc-746d-40eb-9a60-62a125f6b545', orderId: 'order_Sm04koUcig2RX9', amount: 1.12 }
  ];
  
  for (const deal of dealsToFix) {
    console.log('Force updating deal:', deal.id);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('brand_deals')
      .update({
        status: 'content_making',
        payment_status: 'captured',
        payment_id: deal.orderId,
        amount_paid: deal.amount,
        updated_at: now
      })
      .eq('id', deal.id);

    if (error) {
      console.error('Error updating deal ' + deal.id + ':', error);
    } else {
      console.log('Deal ' + deal.id + ' updated successfully.');
      
      await supabase.from('deal_action_logs').insert({
        deal_id: deal.id,
        event: 'PAYMENT_VERIFIED_FORCE_FIX',
        metadata: { order_id: deal.orderId, source: 'antigravity_fix', reason: 'User reported multiple payments delay' }
      });
    }
  }
}

fix();
