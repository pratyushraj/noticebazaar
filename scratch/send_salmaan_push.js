import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!supabaseUrl || !supabaseServiceKey || !vapidPublicKey || !vapidPrivateKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// VAPID configuration
webpush.setVapidDetails(
  'mailto:support@noticebazaar.com',
  vapidPublicKey,
  vapidPrivateKey
);

const CREATOR_ID = 'aa5b333c-6237-4aff-8995-686432cc6a14'; // Salmaan / @tootifrootie3?

async function sendPush() {
  console.log(`Checking subscriptions for Creator ID: ${CREATOR_ID}`);
  
  const { data: subscriptions, error } = await supabase
    .from('creator_push_subscriptions')
    .select('*')
    .eq('creator_id', CREATOR_ID);

  if (error) {
    console.error('Error fetching subscriptions:', error);
    return;
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('No subscriptions found for this creator');
    return;
  }

  console.log(`Found ${subscriptions.length} subscriptions. Sending to the most recent one...`);
  
  // Sort by last_seen to get the freshest one
  const sub = subscriptions.sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen))[0];
  
  console.log('Target Subscription ID:', sub.id);
  console.log('Endpoint:', sub.endpoint);
  console.log('Last Seen:', sub.last_seen);

  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      auth: sub.p256dh ? null : '', // These fields might be missing in your DB schema if you don't store them correctly
      p256dh: sub.p256dh ? null : ''
    }
  };

  // Wait, I need to check how p256dh and auth are stored in the DB.
  // Let's check the columns of creator_push_subscriptions.
}

// Check columns first
async function checkColumns() {
    const { data, error } = await supabase.from('creator_push_subscriptions').select('*').limit(1);
    if (data && data[0]) {
        console.log('Columns:', Object.keys(data[0]));
    }
}

// Actually, I'll just use the one from the service
const notificationPayload = JSON.stringify({
  title: 'Server-Side Test 🚀',
  body: 'This notification was triggered from the backend using the new VAPID keys!',
  icon: '/icon-192x192.png',
  data: {
    url: '/creator-dashboard'
  }
});

async function run() {
    const { data: subs, error } = await supabase
        .from('creator_push_subscriptions')
        .select('*')
        .eq('creator_id', CREATOR_ID)
        .order('last_seen', { ascending: false })
        .limit(1);

    if (error || !subs || subs.length === 0) {
        console.error('No sub found:', error);
        return;
    }

    const sub = subs[0];
    const pushSub = {
        endpoint: sub.endpoint,
        keys: {
            auth: sub.auth_key,
            p256dh: sub.p256dh_key
        }
    };

    try {
        console.log('Sending push...');
        const res = await webpush.sendNotification(pushSub, notificationPayload);
        console.log('Push Sent Successfully!', res.statusCode);
    } catch (err) {
        console.error('Push Failed:', err.statusCode, err.body);
    }
}

run();
