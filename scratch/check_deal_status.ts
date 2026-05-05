
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'api/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
  const creatorId = 'c531f12c-216b-4c77-9d44-76bea8f4a9c6';
  
  const { data: requests, error: reqError } = await supabase
    .from('collab_requests')
    .select('id, brand_name, status, updated_at')
    .eq('creator_id', creatorId)
    .order('updated_at', { ascending: false })
    .limit(10);
    
  if (reqError) {
    console.error('Error fetching requests:', reqError);
    return;
  }
  
  console.log('Collab Requests:');
  console.table(requests);
  
  const { data: deals, error: dealError } = await supabase
    .from('brand_deals')
    .select('id, brand_name, status, updated_at')
    .eq('creator_id', creatorId)
    .order('updated_at', { ascending: false })
    .limit(10);
    
  if (dealError) {
    console.error('Error fetching deals:', dealError);
    return;
  }
  
  console.log('\nBrand Deals:');
  console.table(deals);
}

checkStatus();
