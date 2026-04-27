
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDealsDetail() {
  const userId = 'c531f12c-216b-4c77-9d44-76bea8f4a9c6';
  const { data: deals, error } = await supabase
    .from('brand_deals')
    .select('*')
    .eq('creator_id', userId);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${deals.length} deals`);
  deals.forEach((d, i) => {
    console.log(`Deal ${i+1}:`);
    console.log(`  ID: ${d.id}`);
    console.log(`  Brand: ${d.brand_name}`);
    console.log(`  Status: ${d.status}`);
    console.log(`  Amount: ${d.deal_amount}`);
    console.log(`  Deliverables: ${d.deliverables}`);
    console.log(`  Req ID: ${d.collab_request_id}`);
    console.log(`  Raw: ${JSON.stringify(d.raw || {}, null, 2)}`);
    console.log('---');
  });
}

checkDealsDetail();
