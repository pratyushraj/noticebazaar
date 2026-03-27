import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const email = 'notice2@yopmail.com';
  console.log('Sending test push to:', email);
  
  const { data: user } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
  if (!user) { console.error('User not found'); return; }

  const { data: subs } = await supabase.from('creator_push_subscriptions').select('*').eq('creator_id', user.id);
  if (!subs || subs.length === 0) {
    console.error('No subscriptions found. Note: You must open the PWA on your iPhone first.');
    return;
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@creatorarmour.com',
    process.env.VITE_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
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
    } catch (err: any) {
      console.error('❌ Failed:', err.message);
    }
  }
}
run();
