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
  // Get notice104 user id
  const authResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  });
  const authData = await authResp.json();
  const notice104 = (authData.users || []).find(u => u.email === 'notice104@yopmail.com');
  console.log('notice104 user:', notice104?.id, notice104?.email);

  // Get brand-demo user
  const demoBrand = (authData.users || []).find(u => u.email === 'brand-demo@noticebazaar.com');
  console.log('demo brand user:', demoBrand?.id, demoBrand?.email);

  if (notice104) {
    // Check collab_requests where creator_id = notice104
    const reqs = await fetchJSON(`collab_requests?creator_id=eq.${notice104.id}&select=id,status,brand_email,brand_name,created_at&order=created_at.desc`);
    console.log('\nCollab requests for notice104:', JSON.stringify(reqs, null, 2));

    // Check brand_deals where creator_id = notice104
    const deals = await fetchJSON(`brand_deals?creator_id=eq.${notice104.id}&select=id,status,brand_email,deal_amount,created_at&order=created_at.desc`);
    console.log('\nBrand deals for notice104:', JSON.stringify(deals, null, 2));
  }

  if (demoBrand) {
    // Check collab_requests sent by demo brand
    const reqs = await fetchJSON(`collab_requests?brand_email=eq.brand-demo@noticebazaar.com&select=id,status,creator_id,brand_name,created_at&order=created_at.desc`);
    console.log('\nCollab requests by demo brand:', JSON.stringify(reqs, null, 2));

    // Check brand_deals from demo brand
    const deals = await fetchJSON(`brand_deals?brand_email=eq.brand-demo@noticebazaar.com&select=id,status,creator_id,deal_amount,created_at&order=created_at.desc`);
    console.log('\nBrand deals from demo brand:', JSON.stringify(deals, null, 2));
  }
}

check().catch(console.error);
