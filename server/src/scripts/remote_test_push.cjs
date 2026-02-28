const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

const supabase = createClient(
  "https://ooaxtwmqrvfzdqzoijcj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c"
);

async function run() {
  const email = 'notice2@yopmail.com';
  console.log('Sending test push to:', email);
  
  const { data: user } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
  if (!user) { console.error('User not found'); return; }

  const { data: subs } = await supabase.from('creator_push_subscriptions').select('*').eq('creator_id', user.id);
  if (!subs || subs.length === 0) { console.error('No subscriptions found.'); return; }

  webpush.setVapidDetails(
    'mailto:support@creatorarmour.com',
    'BECYhAslYA7HrXeAxtz1_LMFM69Lsgrq54d_X7TgxNoHndWX4cxYunJTEcWsAIeCJRiGWQ1y0OvgZnvKECQSJUo',
    'GyIB6afb7APgX5Tq2UasLjOO1y6MRMvNQPjLxXG1iy0'
  );

  const payload = JSON.stringify({
    title: 'Success! 🚀',
    body: 'Your iPhone is now connected to CreatorArmour alerts.',
    url: '/creator-dashboard'
  });

  for (const sub of subs) {
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh_key, auth: sub.auth_key }
      }, payload);
      console.log('✅ Sent successfully');
    } catch (err) {
      console.error('❌ Failed:', err.message);
    }
  }
}
run();
