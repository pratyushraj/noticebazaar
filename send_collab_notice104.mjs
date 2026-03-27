const SUPABASE_URL = "https://ooaxtwmqrvfzdqzoijcj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c";

async function fetchJSON(endpoint, options = {}) {
  const url = `${SUPABASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  return res.json();
}

async function sendDeal() {
    const brandEmail = 'brand-demo@noticebazaar.com';
    const creatorEmail = 'notice104@yopmail.com';

    const authData = await fetchJSON('/auth/v1/admin/users');
    const brandUser = (authData.users || []).find(u => u.email === brandEmail);
    const creatorUser = (authData.users || []).find(u => u.email === creatorEmail);
    
    if (!brandUser || !creatorUser) {
        console.error('Could not find brand/creator users.');
        return;
    }

    const profiles = await fetchJSON(`/rest/v1/profiles?id=eq.${brandUser.id}&select=*`);
    const brandProfile = Array.isArray(profiles) ? profiles[0] : null;

    const offer = {
        brand_id: brandUser.id,
        brand_email: brandEmail,
        creator_id: creatorUser.id,
        brand_name: brandProfile?.business_name || 'Demo Brand Co',
        collab_type: 'paid',
        status: 'pending',
        exact_budget: 35000,
        campaign_description: 'We would love to feature you in our upcoming summer collection campaign. We are looking for authentic storytelling.',
        deliverables: ['1 YouTube Video', '1 Instagram Reel'],
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    };

    const newRequest = await fetchJSON('/rest/v1/collab_requests', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(offer)
    });

    console.log('Successfully sent collab request:', newRequest);
}

sendDeal().catch(console.error);
