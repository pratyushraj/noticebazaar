import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const creatorId = '24e7f919-71b0-4d85-9b89-dd0c4e7df744';

async function run() {
    console.log('Sending test push to Rahul (ID: ' + creatorId + ')');
    
    const { data: subs, error } = await supabase
        .from('creator_push_subscriptions')
        .select('*')
        .eq('creator_id', creatorId);
        
    if (error) {
        console.error('Error fetching subscriptions:', error.message);
        return;
    }
    
    if (!subs || subs.length === 0) {
        console.error('No subscriptions found for Rahul. Make sure they subscribed on their iPhone.');
        return;
    }
    
    console.log('Found ' + subs.length + ' subscription(s).');
    
    webpush.setVapidDetails(
        'mailto:support@creatorarmour.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
    
    const payload = JSON.stringify({
        title: '💼 New Brand Offer!',
        body: 'A brand wants to collaborate with you. Tap to review.',
        url: '/creator-dashboard?tab=collabs&subtab=pending',
        sentAt: new Date().toISOString()
    });
    
    for (const sub of subs) {
        try {
            console.log('Attempting push to endpoint: ' + sub.endpoint.substring(0, 40) + '...');
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
            console.log('✅ Push delivered successfully to sub ID: ' + sub.id);
        } catch (pushError) {
            console.error('❌ Push failed for sub ID: ' + sub.id + ' - ' + pushError.message);
            if (pushError.statusCode) {
                console.error('Status code: ' + pushError.statusCode);
                console.error('Body: ' + pushError.body);
            }
            if (pushError.statusCode === 400 || pushError.statusCode === 404 || pushError.statusCode === 410) {
                console.log('Subscription is invalid, removing it.');
                await supabase.from('creator_push_subscriptions').delete().eq('id', sub.id);
            }
        }
    }
}

run();
