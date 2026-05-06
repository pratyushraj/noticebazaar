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

async function fixDeal() {
  const dealId = '61f867a0-13cc-49e2-a875-c0922264aba8';
  const orderId = 'order_SlzrdEn7lNZlnh';
  
  console.log('Force updating deal status for:', dealId);
  
  const now = new Date().toISOString();
  const updateData = {
    status: 'content_making',
    payment_status: 'captured',
    payment_id: orderId,
    amount_paid: 2.24,
    updated_at: now
  };

  const { data, error } = await supabase
    .from('brand_deals')
    .update(updateData)
    .eq('id', dealId)
    .select();

  if (error) {
    console.error('Error updating deal:', error);
    return;
  }

  console.log('Deal updated successfully:', data);

  // Also log it
  await supabase.from('deal_action_logs').insert({
    deal_id: dealId,
    event: 'PAYMENT_VERIFIED_FORCE_FIX',
    metadata: { order_id: orderId, source: 'antigravity_fix', reason: 'User reported already paid' }
  });
}

fixDeal();
