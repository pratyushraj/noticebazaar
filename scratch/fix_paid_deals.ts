import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDeals() {
  const deals = [
    { id: 'a0284c59-9043-446f-b9cc-aa4556debd9f', payment_id: 'pay_SlqGiuI778c8K6' },
    { id: '99cd86c8-316c-4be5-8d53-ba7de66cccf7', payment_id: 'pay_SlpMQfYDMo8LsZ' }
  ];

  for (const deal of deals) {
    const { error } = await supabase
      .from('brand_deals')
      .update({
        status: 'content_making',
        payment_status: 'captured',
        payment_id: deal.payment_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', deal.id);

    if (error) {
      console.error(`Error updating ${deal.id}:`, error);
    } else {
      console.log(`Updated ${deal.id} to content_making`);
    }
  }
}

fixDeals();
