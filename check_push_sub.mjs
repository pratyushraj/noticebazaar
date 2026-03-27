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
  return JSON.parse(text);
}

async function checkSub() {
  const id = '703f68cf-a5cd-4368-9eae-a347c7bd3608';
  try {
    const data = await supabaseFetch(`creator_push_subscriptions?creator_id=eq.${id}`);
    console.log(`Subscriptions for ${id}:`, data);
  } catch (error) {
    console.error(error);
  }
}

checkSub().catch(console.error);
