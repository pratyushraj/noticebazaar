const { createClient } = require('@supabase/supabase-js');
const { JSDOM } = require('jsdom');
const dotenv = require('dotenv');
const webpush = require('web-push');

dotenv.config({ path: 'server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const email = 'notice2@yopmail.com';
  
  try {
    // 1. Find the user
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('email', email)
      .maybeSingle();

    if (userError || !user) {
      console.error('User not found:', email, userError);
      return;
    }

    console.log('Found user:', user.name, '(', user.id, ')');

    // 2. Find their push subscriptions
    const { data: subs, error: subError } = await supabase
      .from('creator_push_subscriptions')
      .select('*')
      .eq('creator_id', user.id);

    if (subError || !subs || subs.length === 0) {
      console.error('No active push subscriptions found for this user. Make sure they have "Added to Home Screen" and enabled notifications on their iPhone.');
      return;
    }

    console.log('Found', subs.length, 'subscriptions. Sending test alerts...');

    // 3. Configure web-push
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:support@creatorarmour.com',
      process.env.VITE_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const payload = JSON.stringify({
      title: 'Success! 🚀',
      body: 'Your iPhone is now connected to CreatorArmour alerts.',
      url: '/creator-dashboard'
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key
            }
          },
          payload
        );
        console.log('✅ Sent to subscription:', sub.id);
      } catch (err) {
        console.error('❌ Failed to send to subscription:', sub.id, err.message);
      }
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
}

run();
