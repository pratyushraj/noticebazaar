
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCollabRequestDetails() {
  const userId = 'c531f12c-216b-4c77-9d44-76bea8f4a9c6';
  const { data: requests, error } = await supabase
    .from('collab_requests')
    .select('id, brand_name, barter_product_name, barter_product_image_url, created_at')
    .eq('creator_id', userId);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${requests.length} requests for this creator`);
  requests.forEach((r, i) => {
    console.log(`Request ${i+1}:`);
    console.log(`  ID: ${r.id}`);
    console.log(`  Brand: ${r.brand_name}`);
    console.log(`  Product: ${r.barter_product_name}`);
    console.log(`  Image: ${r.barter_product_image_url}`);
    console.log(`  Created: ${r.created_at}`);
    console.log('---');
  });
}

checkCollabRequestDetails();
