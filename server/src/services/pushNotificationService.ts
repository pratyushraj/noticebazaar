// @ts-nocheck
// Push notification service for creator collab alerts

import webpush from 'web-push';
import { supabase } from '../lib/supabase.js';
import { sendCollabRequestCreatorNotificationEmail } from './collabRequestEmailService.js';

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
    console.warn(
      '[PushNotificationService] Invalid VAPID configuration. Push will be skipped; email fallback will be used.',
      error?.message || error
    );
  }
} else {
  console.warn('[PushNotificationService] VAPID keys not configured. Push will be skipped; email fallback will be used.');
}

export const getPushRuntimeStatus = () => ({
  vapidConfigured,
  hasVapidPublicKey: !!vapidPublicKey,
  hasVapidPrivateKey: !!vapidPrivateKey,
  vapidSubject,
  vapidPublicKeyLength: vapidPublicKey?.length || 0,
  vapidPrivateKeyLength: vapidPrivateKey?.length || 0,
});

type CreatorCollabNotifyInput = {
  creatorId: string;
  creatorEmail?: string | null;
  requestId: string;
  emailData: Parameters<typeof sendCollabRequestCreatorNotificationEmail>[1];
};

type NotifyResult = {
  sent: boolean;
  channel: 'push' | 'email' | null;
  reason?: string;
};

type TestPushResult = {
  sent: boolean;
  attempted: number;
  delivered: number;
  failed: number;
  reason?: string;
};

const sendCollabPushFallbackEmail = async (
  creatorEmail: string,
  data: { creatorName: string; brandName: string }
): Promise<{ success: boolean; emailId?: string; error?: string }> => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !creatorEmail) {
    return { success: false, error: 'email_not_configured' };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
  const dashboardLink = `${frontendUrl}/collab-requests`;
  const firstName = (data.creatorName || 'Creator').trim().split(/\s+/)[0] || 'Creator';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #111827;">
      <h2 style="margin: 0 0 12px;">New Collaboration Request</h2>
      <p style="margin: 0 0 10px;">Hi ${firstName},</p>
      <p style="margin: 0 0 10px;">A brand has sent you a collaboration request on CreatorArmour.</p>
      <p style="margin: 0 0 16px;">Review, accept, counter, or decline directly in your dashboard.</p>
      <a href="${dashboardLink}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;">Open CreatorArmour</a>
    </div>
  `;

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'CreatorArmour <noreply@creatorarmour.com>',
        to: creatorEmail,
        subject: 'New Collaboration Request',
        html,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      return { success: false, error: `resend_error_${resp.status}:${txt}` };
    }

    const json: any = await resp.json().catch(() => ({}));
    return { success: true, emailId: json?.id };
  } catch (e: any) {
    return { success: false, error: e?.message || 'email_send_failed' };
  }
};

const isGoneSubscriptionError = (error: any): boolean => {
  const statusCode = error?.statusCode;
  return statusCode === 404 || statusCode === 410;
};

const markRequestNotified = async (requestId: string) => {
  const { error } = await supabase
    .from('collab_requests')
    .update({ last_notified_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) {
    console.warn('[PushNotificationService] Failed to update collab_requests.last_notified_at:', error.message);
  }
};

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

  if (error) {
    throw error;
  }
};

export const removeCreatorPushSubscription = async (creatorId: string, endpoint: string) => {
  if (!creatorId || !endpoint) return;

  const { error } = await supabase
    .from('creator_push_subscriptions')
    .delete()
    .eq('creator_id', creatorId)
    .eq('endpoint', endpoint);

  if (error) {
    throw error;
  }
};

export const getCreatorPushSubscriptionStatus = async (creatorId: string) => {
  const { data, error } = await supabase
    .from('creator_push_subscriptions')
    .select('endpoint, last_seen')
    .eq('creator_id', creatorId)
    .order('last_seen', { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  return {
    hasSubscription: Array.isArray(data) && data.length > 0,
    lastSeen: data?.[0]?.last_seen || null,
  };
};

export const notifyCreatorOnCollabRequestCreated = async ({
  creatorId,
  creatorEmail,
  requestId,
  emailData,
}: CreatorCollabNotifyInput): Promise<NotifyResult> => {
  if (!creatorId || !requestId) {
    return { sent: false, channel: null, reason: 'missing_creator_or_request' };
  }

  const { data: requestRow, error: requestError } = await supabase
    .from('collab_requests')
    .select('id, last_notified_at')
    .eq('id', requestId)
    .maybeSingle();

  if (requestError) {
    console.warn('[PushNotificationService] Failed to fetch collab request for dedupe:', requestError.message);
  }

  /* We no longer return early here. Push is free and real-time; we only use dedupe for the email fallback. */


  let pushSent = false;
  if (vapidConfigured) {
    const { data: subs, error: subsError } = await supabase
      .from('creator_push_subscriptions')
      .select('id, endpoint, p256dh_key, auth_key')
      .eq('creator_id', creatorId);

    if (subsError) {
      console.warn('[PushNotificationService] Failed to fetch push subscriptions:', subsError.message);
    }

    if (!Array.isArray(subs) || subs.length === 0) {
      console.warn(`[PushNotificationService] No push subscriptions for creator ${creatorId} — push skipped`);
    } else {
      console.log(`[PushNotificationService] Sending collab push to ${subs.length} device(s) for creator ${creatorId}`);

      const brandName = emailData?.brandName || 'A brand';
      const payload = JSON.stringify({
        title: '💼 New Brand Offer!',
        body: `${brandName} wants to collaborate with you. Tap to review.`,
        url: '/collab-requests',
        requestId,
      });

      const pushPromises = subs.map(async (sub) => {
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
          console.log(`[PushNotificationService] ✅ Collab push delivered to sub ${sub.id}`);
          return true;
        } catch (pushError: any) {
          const statusCode = pushError?.statusCode || pushError?.status || 'unknown';
          const body = pushError?.body || pushError?.message || String(pushError);
          console.warn(`[PushNotificationService] ❌ Collab push FAILED for sub ${sub.id} — status: ${statusCode}, body: ${JSON.stringify(body)}`);
          if (isGoneSubscriptionError(pushError)) {
            // Background delete; don't await to keep notify fast
            supabase.from('creator_push_subscriptions').delete().eq('id', sub.id).then(({ error }) => {
              if (error) console.warn('[PushNotificationService] Failed to cleanup stale sub:', sub.id, error.message);
              else console.log(`[PushNotificationService] Cleaned up stale subscription ${sub.id}`);
            });
          }
          return false;
        }
      });

      const results = await Promise.all(pushPromises);
      pushSent = results.some(r => r === true);
      console.log(`[PushNotificationService] Collab push result: ${results.filter(Boolean).length}/${subs.length} delivered`);
    }
  } else {
    console.warn('[PushNotificationService] VAPID not configured — push skipped');
  }

  if (pushSent) {
    await markRequestNotified(requestId);
    return { sent: true, channel: 'push' };
  }

  if (creatorEmail && !requestRow?.last_notified_at) {

    const emailResult = await sendCollabPushFallbackEmail(creatorEmail, {
      creatorName: emailData?.creatorName || 'Creator',
      brandName: emailData?.brandName || 'Brand',
    });
    if (emailResult.success) {
      await markRequestNotified(requestId);
      return { sent: true, channel: 'email' };
    }
    return { sent: false, channel: null, reason: emailResult.error || 'email_failed' };
  }

  console.warn(`[PushNotificationService] Collab notification not sent for request ${requestId}: pushSent=${pushSent}, hasEmail=${!!creatorEmail}`);
  return { sent: false, channel: null, reason: 'no_push_and_no_email' };
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

  const pushPromises = subs.map(async (sub) => {
    const isApple = sub.endpoint.includes('web.push.apple.com');
    const deviceType = isApple ? 'iOS/Safari' : sub.endpoint.includes('fcm.googleapis.com') ? 'Chrome/Android' : 'Unknown';
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
      console.log(`[PushNotificationService] ✅ Test push delivered to ${deviceType} (id: ${sub.id})`);
      return { success: true, id: sub.id, deviceType };
    } catch (error: any) {
      const statusCode = error?.statusCode || error?.status;
      const errorBody = error?.body || error?.message || String(error);
      console.warn(`[PushNotificationService] ❌ Test push FAILED for ${deviceType} (id: ${sub.id}) — status: ${statusCode}, body: ${JSON.stringify(errorBody)}`);
      const isGone = statusCode === 404 || statusCode === 410;
      if (isGone) {
        // Background delete stale subscription
        supabase.from('creator_push_subscriptions').delete().eq('id', sub.id).catch(() => { });
      }
      return { success: false, id: sub.id, deviceType, statusCode, error: errorBody, isGone };
    }
  });

  const results = await Promise.all(pushPromises);
  const delivered = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const deviceResults = results.map(r => ({ deviceType: r.deviceType, success: r.success, ...(r.success ? {} : { statusCode: (r as any).statusCode, error: (r as any).error }) }));

  return {
    sent: delivered > 0,
    attempted: subs.length,
    delivered,
    failed,
    deviceResults,
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
    console.warn('[PushNotificationService] Direct test push failed:', error?.message || error);
    return {
      sent: false,
      attempted: 1,
      delivered: 0,
      failed: 1,
      reason: error?.message || 'direct_push_failed',
    };
  }
};
