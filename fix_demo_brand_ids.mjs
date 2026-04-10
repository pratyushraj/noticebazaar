const SUPABASE_URL = process.env.SUPABASE_URL || "https://ooaxtwmqrvfzdqzoijcj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(2);
}

async function fetchJSON(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  return res.ok;
}

async function fix() {
  const brandEmail = 'brand-demo@noticebazaar.com';
  const brandId = '1507ee4e-21e2-40a7-859f-de85f6a9f177';
  
  console.log('Updating collab_requests...');
  const ok1 = await fetchJSON(`collab_requests?brand_email=eq.${brandEmail}&brand_id=is.null`, {
    method: 'PATCH',
    body: { brand_id: brandId }
  });
  console.log('collab_requests update:', ok1);

  console.log('Updating brand_deals...');
  const ok2 = await fetchJSON(`brand_deals?brand_email=eq.${brandEmail}&brand_id=is.null`, {
    method: 'PATCH',
    body: { brand_id: brandId }
  });
  console.log('brand_deals update:', ok2);
}

fix().catch(console.error);
