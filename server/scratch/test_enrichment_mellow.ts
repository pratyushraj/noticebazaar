
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function testMineDeals() {
  const creatorId = 'cc68c864-81a1-44d9-9e26-0efec94ee7e3';
  
  // Since we don't have a JWT, we'll mock the call by calling the internal logic or just checking what the API would return.
  // Actually, I'll just use the supabase client to simulate the enrichment logic.
  
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: deals, error } = await supabase.from('brand_deals').select('*').eq('creator_id', creatorId);
  
  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  // Simulate enrichment
  const dealsToEnrich = deals.filter((d: any) => 
    d.collab_request_id || 
    (d.created_via === 'collab_request' && d.status !== 'Completed')
  );

  console.log(`Deals to enrich: ${dealsToEnrich.length}`);

  const linkedIds = dealsToEnrich.map((d: any) => d.collab_request_id).filter(Boolean);
  const brandNames = Array.from(new Set(dealsToEnrich.filter(d => !d.collab_request_id).map((d: any) => d.brand_name))).filter(Boolean);

  console.log(`Searching for brand names: ${brandNames.join(', ')}`);

  const { data: requests } = await supabase
    .from('collab_requests')
    .select('id, brand_name, barter_product_image_url')
    .eq('creator_id', creatorId)
    .or(`id.in.(${linkedIds.length ? linkedIds.join(',') : '00000000-0000-0000-0000-000000000000'}),brand_name.in.(${brandNames.length ? brandNames.join(',') : '""'})`);

  console.log(`Found ${requests?.length || 0} matching requests`);
  requests?.forEach(r => console.log(`[Request] Brand: "${r.brand_name}", Image: ${r.barter_product_image_url ? 'YES' : 'NO'}`));

  const brandMap = new Map();
  requests?.forEach(r => {
    const key = String(r.brand_name || '').trim().toLowerCase();
    if (!brandMap.has(key) || (!brandMap.get(key).barter_product_image_url && r.barter_product_image_url)) {
      brandMap.set(key, r);
    }
  });

  deals.forEach(d => {
    const key = String(d.brand_name || '').trim().toLowerCase();
    const r = brandMap.get(key);
    if (r) {
      d.barter_product_image_url = r.barter_product_image_url;
      console.log(`[Enriched] Deal ${d.id} for "${d.brand_name}" now has image: ${d.barter_product_image_url ? 'YES' : 'NO'}`);
    } else {
      console.log(`[Not Enriched] Deal ${d.id} for "${d.brand_name}"`);
    }
  });
}

testMineDeals();
