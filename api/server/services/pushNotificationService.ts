// @ts-nocheck
import webpush from 'web-push';
import { supabase } from '../index';

const toUrlSafeBase64 = (value?: string | null): string => {
  if (!value) return '';
  return value
    .trim()
    .replace(/\s+/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const vapidPublicKey = toUrlSafeBase64(process.env.VAPID_PUBLIC_KEY);
const vapidPrivateKey = toUrlSafeBase64(process.env.VAPID_PRIVATE_KEY);
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@creatorarmour.com';

let vapidConfigured = false;
if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    vapidConfigured = true;
  } catch (error: any) {
    console.warn('[PushNotificationService] Invalid VAPID configuration:', error?.message || error);
  }
} else {
  console.warn('[PushNotificationService] VAPID keys not configured.');
}

type TestPushResult = {
  sent: boolean;
  attempted: number;
  delivered: number;
  failed: number;
  reason?: string;
};

const isGoneSubscriptionError = (error: any): boolean => {
  const statusCode = error?.statusCode;
  return statusCode === 404 || statusCode === 410;
};

export const getPushRuntimeStatus = () => ({
  vapidConfigured,
  hasVapidPublicKey: !!vapidPublicKey,
  hasVapidPrivateKey: !!vapidPrivateKey,
  vapidSubject,
  vapidPublicKeyLength: vapidPublicKey?.length || 0,
  vapidPrivateKeyLength: vapidPrivateKey?.length || 0,
});

export const upsertCreatorPushSubscription = async (
  creatorId: string,
  subscription: {
    endpoint: string;
    keys?: { p256dh?: string; auth?: string };
  },
  userAgent?: string
) => {
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;

  if (!creatorId || !endpoint || !p256dh || !auth) {
    throw new Error('Invalid push subscription payload');
  }

  const { error } = await supabase
    .from('creator_push_subscriptions')
    .upsert(
      {
        creator_id: creatorId,
        endpoint,
        p256dh_key: p256dh,
        auth_key: auth,
        user_agent: userAgent || null,
        last_seen: new Date().toISOString(),
      },
      { onConflict: 'creator_id,endpoint' }
    );

  if (error) throw error;
};

export const removeCreatorPushSubscription = async (creatorId: string, endpoint: string) => {
  if (!creatorId || !endpoint) return;

  const { error } = await supabase
    .from('creator_push_subscriptions')
    .delete()
    .eq('creator_id', creatorId)
    .eq('endpoint', endpoint);

  if (error) throw error;
};

export const getCreatorPushSubscriptionStatus = async (creatorId: string) => {
  const { data, error } = await supabase
    .from('creator_push_subscriptions')
    .select('endpoint, last_seen')
    .eq('creator_id', creatorId)
    .order('last_seen', { ascending: false })
    .limit(1);

  if (error) throw error;

  return {
    hasSubscription: Array.isArray(data) && data.length > 0,
    lastSeen: data?.[0]?.last_seen || null,
  };
};

export const sendTestPushToCreator = async (
  creatorId: string,
  payload?: { title?: string; body?: string; url?: string }
): Promise<TestPushResult> => {
  if (!creatorId) {
    return { sent: false, attempted: 0, delivered: 0, failed: 0, reason: 'missing_creator_id' };
  }

  if (!vapidConfigured) {
    return { sent: false, attempted: 0, delivered: 0, failed: 0, reason: 'vapid_not_configured' };
  }

  const { data: subs, error: subsError } = await supabase
    .from('creator_push_subscriptions')
    .select('id, endpoint, p256dh_key, auth_key')
    .eq('creator_id', creatorId);

  if (subsError) {
    return { sent: false, attempted: 0, delivered: 0, failed: 0, reason: `subscription_fetch_error:${subsError.message}` };
  }

  if (!subs || subs.length === 0) {
    return { sent: false, attempted: 0, delivered: 0, failed: 0, reason: 'no_subscriptions' };
  }

  const notificationPayload = JSON.stringify({
    title: payload?.title || 'Test Push from CreatorArmour',
    body: payload?.body || 'Push delivery is working for your account.',
    url: payload?.url || '/creator-dashboard',
    test: true,
    sentAt: new Date().toISOString(),
  });

  let delivered = 0;
  let failed = 0;

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
        notificationPayload
      );
      delivered += 1;
    } catch (error: any) {
      failed += 1;
      if (isGoneSubscriptionError(error)) {
        await supabase.from('creator_push_subscriptions').delete().eq('id', sub.id);
      }
    }
  }

  return {
    sent: delivered > 0,
    attempted: subs.length,
    delivered,
    failed,
    reason: delivered > 0 ? undefined : 'all_push_attempts_failed',
  };
};

export const sendDirectTestPush = async (
  subscription: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | null | undefined,
  payload?: { title?: string; body?: string; url?: string }
): Promise<TestPushResult> => {
  if (!vapidConfigured) {
    return { sent: false, attempted: 0, delivered: 0, failed: 0, reason: 'vapid_not_configured' };
  }

  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return { sent: false, attempted: 0, delivered: 0, failed: 0, reason: 'invalid_subscription_payload' };
  }

  const notificationPayload = JSON.stringify({
    title: payload?.title || 'Direct Push Test (No DB)',
    body: payload?.body || 'If you see this, web push delivery works without Supabase reads.',
    url: payload?.url || '/push-test',
    test: true,
    mode: 'direct',
    sentAt: new Date().toISOString(),
  });

  try {
    await webpush.sendNotification(
      {
        endpoint,
        keys: { p256dh, auth },
      },
      notificationPayload
    );
    return { sent: true, attempted: 1, delivered: 1, failed: 0 };
  } catch (error: any) {
    return {
      sent: false,
      attempted: 1,
      delivered: 0,
      failed: 1,
      reason: error?.message || 'direct_push_failed',
    };
  }
};
