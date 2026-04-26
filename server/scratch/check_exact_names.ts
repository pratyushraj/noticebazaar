
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExactNames() {
  const creatorId = 'c5311910-6192-4f15-847e-a035272a08f5';
  
  console.log('--- Brand Deals ---');
  const { data: deals } = await supabase.from('brand_deals').select('id, brand_name, collab_request_id').eq('creator_id', creatorId);
  deals?.forEach(d => console.log(`[Deal ${d.id}] Brand: "${d.brand_name}" (Length: ${d.brand_name?.length}), Request ID: ${d.collab_request_id}`));

  console.log('\n--- Collab Requests ---');
  const { data: requests } = await supabase.from('collab_requests').select('id, brand_name, barter_product_image_url').eq('creator_id', creatorId);
  requests?.forEach(r => console.log(`[Request ${r.id}] Brand: "${r.brand_name}" (Length: ${r.brand_name?.length}), Image: ${r.barter_product_image_url ? 'YES' : 'NO'}`));
}

checkExactNames();
