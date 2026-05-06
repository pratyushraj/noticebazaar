import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import webpush from 'web-push';

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
const toUrlSafeBase64 = (value) => {
  if (!value) return '';
  return value
    .trim()
    .replace(/\s+/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

webpush.setVapidDetails(
  'mailto:support@creatorarmour.com',
  toUrlSafeBase64(vapidPublicKey),
  toUrlSafeBase64(vapidPrivateKey)
);

const CREATOR_ID = 'c531f12c-216b-4c77-9d44-76bea8f4a9c6'; // @tootifrootie3

async function run() {
  console.log('--- CREATING DEMO OFFER ---');
  
  // 1. Create a fake collab request
  const { data: request, error: requestError } = await supabase
    .from('collab_requests')
    .insert({
      creator_id: CREATOR_ID,
      brand_name: 'Demo Brand 🚀',
      brand_email: 'demo@brand.com',
      collab_type: 'paid',
      exact_budget: 15000,
      currency: 'INR',
      status: 'pending',
      campaign_description: 'We love your content! We want you to create a reel for our new summer collection.',
      deliverables: '1x Instagram Reel, 2x Stories',
      usage_rights: true,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      brand_logo_url: 'https://img.freepik.com/free-vector/gradient-abstract-logo-design_23-2149007321.jpg'
    })
    .select()
    .single();

  if (requestError) {
    console.error('Failed to create demo request:', requestError);
    return;
  }

  console.log('✅ Demo Request Created:', request.id);

  // 2. Fetch push subscriptions
  const { data: subs, error: subsError } = await supabase
    .from('creator_push_subscriptions')
    .select('*')
    .eq('creator_id', CREATOR_ID);

  if (subsError || !subs || subs.length === 0) {
    console.warn('No push subscriptions found for this creator. Notification skipped.');
    return;
  }

  console.log(`Found ${subs.length} subscriptions. Sending notification...`);

  // 3. Send notification
  const payload = JSON.stringify({
    title: '💼 New Brand Offer!',
    body: 'Demo Brand 🚀 wants to collaborate with you. Tap to review.',
    url: `/creator-dashboard?tab=collabs&subtab=pending&requestId=${encodeURIComponent(request.id)}`,
    requestId: request.id,
  });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        },
        payload
      );
      console.log(`✅ Push delivered to sub: ${sub.id}`);
    } catch (err) {
      console.error(`❌ Push failed for sub: ${sub.id}`, err.statusCode, err.body);
    }
  }

  console.log('--- DONE ---');
}

run();
