import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getApiBaseUrl } from '@/lib/utils/api';

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
  const pushApiBase = useMemo(() => {
    const base = getApiBaseUrl();
    if (typeof window === 'undefined') return base;
    const host = window.location.hostname.toLowerCase();
    const isPublicHost =
      host.endsWith('creatorarmour.com') ||
      host.endsWith('noticebazaar.com') ||
      host.endsWith('vercel.app');
    // Hard-pin push routes to known-good backend to avoid edge rewrite drift.
    return isPublicHost ? 'https://noticebazaar-api.onrender.com' : base;
  }, []);

  const hasVapidKey = !!import.meta.env.VITE_VAPID_PUBLIC_KEY;

  const syncSubscriptionStatus = useCallback(async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    setPermission(Notification.permission);

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const browserSub = await registration.pushManager.getSubscription();
      if (browserSub) {
        setIsSubscribed(true);
        return;
      }
    } catch (error) {
      // Non-fatal: we still allow email fallback
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setIsSubscribed(false);
        return;
      }

      const response = await fetch(`${pushApiBase}/api/push/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        setIsSubscribed(false);
        return;
      }
      const data = await response.json();
      setIsSubscribed(!!data?.hasSubscription);
    } catch (error) {
      setIsSubscribed(false);
    }
  }, []);

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

      const response = await fetch(`${pushApiBase}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

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

  return {
    isSupported,
    permission,
    isSubscribed,
    isBusy,
    promptDismissed,
    isIOSNeedsInstall,
    hasVapidKey,
    enableNotifications,
    dismissPrompt,
    refreshStatus: syncSubscriptionStatus,
  };
};
