const SUPABASE_URL = "https://ooaxtwmqrvfzdqzoijcj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c";

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
  const brandEmail = 'brand-demo@noticebazaar.com';
  
  console.log('--- collab_requests ---');
  const reqs = await fetchJSON(`collab_requests?brand_email=eq.${brandEmail}&select=*&limit=1`);
  console.log(JSON.stringify(reqs[0], null, 2));

  console.log('\n--- brand_deals ---');
  const deals = await fetchJSON(`brand_deals?brand_email=eq.${brandEmail}&select=*&limit=1`);
  console.log(JSON.stringify(deals[0], null, 2));
}

check().catch(console.error);
