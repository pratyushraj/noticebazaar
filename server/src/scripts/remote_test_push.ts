import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
  "https://ooaxtwmqrvfzdqzoijcj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c"
);

async function run() {
  console.log('Fetching most recent push subscription...');
  
  const { data: subs } = await supabase.from('creator_push_subscriptions').select('*').order('created_at', { ascending: false }).limit(1);
  if (!subs || subs.length === 0) { console.error('No subscriptions found.'); return; }

  const sub = subs[0];
  console.log(`Found subscription for creator_id: ${sub.creator_id}`);

  webpush.setVapidDetails(
    'mailto:support@creatorarmour.com',
    'BECYhAslYA7HrXeAxtz1_LMFM69Lsgrq54d_X7TgxNoHndWX4cxYunJTEcWsAIeCJRiGWQ1y0OvgZnvKECQSJUo',
    'GyIB6afb7APgX5Tq2UasLjOO1y6MRMvNQPjLxXG1iy0'
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
