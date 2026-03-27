const SUPABASE_URL = "https://ooaxtwmqrvfzdqzoijcj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c";

async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {})
    }
  });
  
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    if (!response.ok) throw new Error(JSON.stringify(data));
    return data;
  } catch (e) {
    if (!response.ok) throw new Error(text);
    return null;
  }
}

async function checkSchema() {
  try {
    const data = await supabaseFetch('creator_push_subscriptions?select=*&limit=1');
    console.log('Successfully fetched from creator_push_subscriptions. Rows:', data?.length);
  } catch (error) {
    console.error('Error fetching creator_push_subscriptions:', error);
  }
}

checkSchema().catch(console.error);
