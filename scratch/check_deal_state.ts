import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkDeal() {
  const dealId = 'da1d8256-a298-44cb-82e3-1c722ba59497';
  const { data: deal, error } = await supabase
    .from('brand_deals')
    .select('*')
    .eq('id', dealId)
    .single();

  if (error) {
    console.error('Error fetching deal:', error);
    return;
  }

  console.log('Deal Details:');
  console.log('Status:', deal.status);
  console.log('Collab Type:', deal.collab_type);
  console.log('Deal Type:', deal.deal_type);
  console.log('Brand Address:', deal.brand_address);
  console.log('Requires Shipping:', deal.requires_shipping);
  console.log('Shipping Status:', deal.shipping_status);
}

checkDeal();
