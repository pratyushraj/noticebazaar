const SUPABASE_URL = process.env.SUPABASE_URL || "https://ooaxtwmqrvfzdqzoijcj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(2);
}

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
