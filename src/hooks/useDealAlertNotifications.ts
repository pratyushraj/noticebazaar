import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getApiBaseUrl, fetchWithTimeout } from '@/lib/utils/api';
import { logger } from '@/lib/utils/logger';

const PROMPT_DISMISSED_KEY = 'deal_alert_prompt_dismissed';

const isIOSDevice = () => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
};

const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (window.navigator as any).standalone === true;
  const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches === true;
  return iosStandalone || displayModeStandalone;
};

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const useDealAlertNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);

  const isIOS = useMemo(() => isIOSDevice(), []);
  const isStandalone = useMemo(() => isStandaloneMode(), []);
  const isIOSNeedsInstall = isIOS && !isStandalone;
  const isLocalhostDev = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1';
  }, []);

  const pushApiBase = useMemo(() => {
    if (typeof window === 'undefined') return getApiBaseUrl();
    const host = window.location.hostname.toLowerCase();
    const isPublicHost =
      host.endsWith('creatorarmour.com') ||
      host.endsWith('noticebazaar.com') ||
      host.endsWith('vercel.app');
    // On production Vercel, use RELATIVE paths so requests go through the
    // same-origin /api/push/* Vercel rewrite → Render. This avoids iOS Safari
    // CSP cross-origin blocking of direct fetches to noticebazaar-api.onrender.com.
    if (isPublicHost) return '';
    // Localhost dev: default to production API (most dev flows don't run the backend locally).
    // If you *do* run the backend locally, set VITE_API_URL/VITE_API_BASE_URL accordingly.
    if (isLocalhostDev) return getApiBaseUrl();
    return getApiBaseUrl();
  }, [isLocalhostDev]);

  const hasVapidKey = !!import.meta.env.VITE_VAPID_PUBLIC_KEY;

  const syncSubscriptionStatus = useCallback(async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    setPermission(Notification.permission);

    let browserSub: PushSubscription | null = null;
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      // Force an update check to clear PWA cache for the new UI
      await registration.update();

      browserSub = await registration.pushManager.getSubscription();
    } catch (error: any) {
      // Non-fatal: we still allow email fallback
      logger.warn('Service worker check failed in syncSubscriptionStatus', { error: error?.message });
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        // Without auth, we can only reflect the local browser subscription state.
        setIsSubscribed(!!browserSub);
        return;
      }

      // Canonical source is server-side: push delivery depends on the server storing a subscription.
      const statusResponse = await fetchWithTimeout(
        `${pushApiBase}/api/push/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        5000
      ); // 5s timeout for status check

      if (!statusResponse.ok) {
        setIsSubscribed(false);
        return;
      }

      const statusData = await statusResponse.json();
      const serverHasSubscription = !!statusData?.hasSubscription;

      // If the browser has a subscription but the server doesn't, attempt a best-effort re-register.
      if (browserSub && !serverHasSubscription) {
        try {
          const subscribeResponse = await fetchWithTimeout(
            `${pushApiBase}/api/push/subscribe`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                subscription: browserSub.toJSON(),
              }),
            },
            15000
          ); // 15s timeout for subscription upsert

          setIsSubscribed(subscribeResponse.ok);
          return;
        } catch (error: any) {
          logger.warn('Push subscribe retry failed in syncSubscriptionStatus', { error: error?.message });
          setIsSubscribed(false);
          return;
        }
      }

      setIsSubscribed(serverHasSubscription);
    } catch (error: any) {
      logger.warn('Push status check failed', { error: error?.message });
      setIsSubscribed(false);
    }
  }, [pushApiBase, isLocalhostDev]);

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    setPromptDismissed(localStorage.getItem(PROMPT_DISMISSED_KEY) === 'true');
    if (!supported) return;
    syncSubscriptionStatus();
  }, [syncSubscriptionStatus]);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
    setPromptDismissed(true);
  }, []);

  const enableNotifications = useCallback(async (): Promise<{ success: boolean; reason?: string }> => {
    if (!isSupported) {
      return { success: false, reason: 'unsupported' };
    }
    if (!hasVapidKey) {
      return { success: false, reason: 'missing_vapid_key' };
    }

    setIsBusy(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== 'granted') {
        return { success: false, reason: permissionResult };
      }

      const registration = await navigator.serviceWorker.register('/sw.js');

      // Force refresh subscription so stale iOS/WebPush tokens are replaced.
      // This is especially important after VAPID key updates or APNS token expiry.
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        try {
          await existingSubscription.unsubscribe();
        } catch (_error) {
          // Ignore unsubscribe failures; we'll still try creating a new subscription.
        }
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY as string),
      });

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        return { success: false, reason: 'not_authenticated' };
      }

      const response = await fetchWithTimeout(`${pushApiBase}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      }, 15000); // 15s timeout for subscription

      if (!response.ok) {
        let errorReason = 'subscribe_failed';
        try {
          const errorJson = await response.json();
          errorReason = errorJson?.details || errorJson?.code || errorJson?.error || `subscribe_failed_${response.status}`;
        } catch {
          errorReason = `subscribe_failed_${response.status}`;
        }
        return { success: false, reason: errorReason };
      }

      setIsSubscribed(true);
      localStorage.removeItem(PROMPT_DISMISSED_KEY);
      setPromptDismissed(false);
      return { success: true };
    } catch (error: any) {
      return { success: false, reason: error?.message || 'unknown_error' };
    } finally {
      setIsBusy(false);
    }
  }, [hasVapidKey, isSupported, pushApiBase]);

  const disableNotifications = useCallback(async (): Promise<{ success: boolean; reason?: string }> => {
    if (!isSupported) {
      setIsSubscribed(false);
      return { success: false, reason: 'unsupported' };
    }

    setIsBusy(true);
    try {
      // Best-effort: remove browser subscription first.
      let endpoint: string | null = null;
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const existingSubscription = await registration.pushManager.getSubscription();
        endpoint = (existingSubscription as any)?.endpoint || null;
        if (existingSubscription) {
          await existingSubscription.unsubscribe();
        }
      } catch (error: any) {
        logger.warn('Browser unsubscribe failed; continuing with server cleanup', { error: error?.message });
      }

      // Best-effort: remove server-side record (if we know the endpoint).
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token && endpoint) {
          await fetchWithTimeout(`${pushApiBase}/api/push/unsubscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ endpoint }),
          }, 15000);
        }
      } catch (error: any) {
        logger.warn('Server unsubscribe failed', { error: error?.message });
      }

      setIsSubscribed(false);
      return { success: true };
    } catch (error: any) {
      const msg = error?.message || 'unknown_error';
      return { success: false, reason: msg };
    } finally {
      setIsBusy(false);
      // Refresh from canonical sources.
      syncSubscriptionStatus();
    }
  }, [isSupported, pushApiBase, syncSubscriptionStatus]);

  const sendTestPush = useCallback(async (options?: { title?: string; body?: string }): Promise<{ success: boolean; reason?: string }> => {
    setIsBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        return { success: false, reason: 'not_authenticated' };
      }

      const response = await fetchWithTimeout(`${pushApiBase}/api/push/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: options?.title || 'Test Notification 🚀',
          body: options?.body || 'If you see this, your push notifications are working perfectly!',
          url: '/creator-profile?section=account',
        }),
      }, 20000); // 20s timeout for test push

      const textBody = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(textBody);
      } catch (err) {
        logger.warn('Failed to parse push test response as JSON', { body: textBody });
      }

      if (!response.ok) {
        return { success: false, reason: data.error || data.reason || `server_error_${response.status}` };
      }

      if (data.success && data.sentCount > 0) {
        return { success: true };
      }

      return { success: false, reason: data.reason || 'all_push_attempts_failed' };
    } catch (error: any) {
      const msg = error?.message || String(error);
      logger.error('Push test failed', { error: msg });
      if (msg.includes('Load failed') || msg.includes('Failed to fetch')) {
        return { success: false, reason: 'Network error or blocked. Please refresh your browser or check your connection.' };
      }
      return { success: false, reason: msg };
    } finally {
      setIsBusy(false);
    }
  }, [pushApiBase]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isBusy,
    promptDismissed,
    isIOSNeedsInstall,
    hasVapidKey,
    enableNotifications,
    disableNotifications,
    dismissPrompt,
    refreshStatus: syncSubscriptionStatus,
    sendTestPush,
  };
};
