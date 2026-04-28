
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function bypassShipping() {
  const dealId = '408e6fac-cb12-4694-b2a1-971eb92f9bce';
  console.log('Updating deal:', dealId);
  
  const { data, error } = await supabase
    .from('brand_deals')
    .update({ 
      shipping_required: false,
      deal_type: 'paid' // Ensure it's just 'paid'
    })
    .eq('id', dealId)
    .select();

  if (error) {
    console.error('Error updating deal:', error);
  } else {
    console.log('Update successful:', JSON.stringify(data, null, 2));
  }
}

bypassShipping();
