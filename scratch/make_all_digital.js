
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

async function makeAllDealsDigital() {
  console.log('Updating all deals to shipping_required = false...');
  
  const { data, error, count } = await supabase
    .from('brand_deals')
    .update({ 
      shipping_required: false
    })
    .neq('id', '00000000-0000-0000-0000-000000000000') // dummy filter to update all
    .select('id');

  if (error) {
    console.error('Error updating deals:', error);
  } else {
    console.log(`Successfully updated ${data?.length || 0} deals to digital-only.`);
  }
}

makeAllDealsDigital();
