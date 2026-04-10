const SUPABASE_URL = process.env.SUPABASE_URL || "https://ooaxtwmqrvfzdqzoijcj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(2);
}

async function fetchJSON(endpoint) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

async function check() {
  const brandId = '1507ee4e-21e2-40a7-859f-de85f6a9f177';
  
  console.log('--- ALL collab_requests for demo brand ---');
  const reqs = await fetchJSON(`collab_requests?brand_id=eq.${brandId}&select=id,status,creator_id,brand_email`);
  console.log('Count:', reqs.length);
  reqs.forEach(r => console.log(`${r.id}: ${r.status}`));

  console.log('\n--- ALL brand_deals for demo brand ---');
  const deals = await fetchJSON(`brand_deals?brand_id=eq.${brandId}&select=id,status,creator_id,brand_email`);
  console.log('Count:', deals.length);
  deals.forEach(d => console.log(`${d.id}: ${d.status}`));
}

check().catch(console.error);
