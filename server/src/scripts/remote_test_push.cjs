const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
}
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  throw new Error('Missing VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY env vars');
}

const supabase = createClient(
  process.env.SUPABASE_URL || "https://ooaxtwmqrvfzdqzoijcj.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
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
