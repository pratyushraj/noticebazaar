import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
  process.env.SUPABASE_URL || "https://ooaxtwmqrvfzdqzoijcj.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function run() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  }
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    throw new Error('Missing VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY env vars');
  }
  console.log('Fetching most recent push subscription...');
  
  const { data: subs } = await supabase.from('creator_push_subscriptions').select('*').order('created_at', { ascending: false }).limit(1);
  if (!subs || subs.length === 0) { console.error('No subscriptions found.'); return; }

  const sub = subs[0];
  console.log(`Found subscription for creator_id: ${sub.creator_id}`);

  webpush.setVapidDetails(
    'mailto:support@creatorarmour.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh_key, auth: sub.auth_key }
      }, JSON.stringify({
        title: 'Brand Alert Test 🚀',
        body: 'Push notifications are enabled for the Brand Dashboard!',
        url: '/brand/offers'
      }));
      console.log('✅ Sent successfully to ID:', sub.id);
    } catch (err: any) {

      console.error('❌ Failed:', err.message);
    }
}
run();
