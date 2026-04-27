
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllMellowDeals() {
  const { data: deals, error } = await supabase
    .from('brand_deals')
    .select('*, profiles:profiles!brand_deals_creator_id_fkey(first_name, last_name, username)')
    .eq('brand_name', 'Mellow Prints');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${deals.length} deals for Mellow Prints`);
  deals.forEach((d, i) => {
    console.log(`Deal ${i+1}:`);
    console.log(`  ID: ${d.id}`);
    console.log(`  Creator ID: ${d.creator_id}`);
    console.log(`  Creator Username: ${d.profiles?.username}`);
    console.log(`  Status: ${d.status}`);
    console.log('---');
  });
}

checkAllMellowDeals();
