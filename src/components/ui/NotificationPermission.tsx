'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotificationPermissionProps {
  className?: string;
}

/**
 * Shows a subtle bell icon that:
 * - Prompts to enable notifications when permission is 'default'
 * - Listens silently when permission is 'granted'
 * - Is hidden when permission is 'denied'
 *
 * Actual push notification sending requires backend — this is UI only.
 */
export function NotificationPermission({ className }: NotificationPermissionProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unknown'>('unknown');
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;

    setPermission(Notification.permission);
    setVisible(Notification.permission === 'default');
  }, []);

  const handleEnable = useCallback(async () => {
    if (!('Notification' in window)) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        toast.success('Notifications enabled! You\'ll get alerts for new brand offers.');
        setVisible(false);
      } else if (result === 'denied') {
        setVisible(false);
        toast.error('Notifications blocked. Enable them in your browser settings.');
      }
    } catch (err) {
      console.error('[NotificationPermission] requestPermission failed:', err);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setVisible(false);
  }, []);

  // Don't render if denied, granted, unknown (no Notification support), or dismissed
  if (!visible || dismissed || permission === 'denied' || permission === 'granted' || permission === 'unknown') {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleEnable}
      title="Enable notifications"
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
        'bg-blue-500/10 border border-blue-500/30 text-blue-400',
        'text-xs font-semibold cursor-pointer',
        'hover:bg-blue-500/20 active:scale-95 transition-all',
        'animate-in fade-in zoom-in duration-200',
        className
      )}
    >
      <Bell className="w-3.5 h-3.5" />
      <span>Enable notifications</span>
    </button>
  );
}

/**
 * Silent notification listener — only fires when app is backgrounded
 * and a new offer notification would come in.
 * This is a hook for components that want to trigger browser notifications.
 */
export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | 'unknown'>('unknown');

  useEffect(() => {
    if (!('Notification' in window)) return;
    setPermission(Notification.permission);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Notification.permission === 'granted') {
        // App came back to foreground — any missed notifications would be handled by the backend
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const showOfferNotification = useCallback((offer: { brand_name?: string; brand_logo?: string }) => {
    if (Notification.permission !== 'granted') return;

    // Only show if page is hidden (backgrounded)
    if (document.visibilityState !== 'hidden') return;

    try {
      new Notification('New brand offer! 🎉', {
        body: `${offer.brand_name || 'A brand'} sent you a collaboration request`,
        icon: offer.brand_logo || '/icon-192x192.png',
        tag: 'new-offer',
        requireInteraction: false,
      });
    } catch (err) {
      console.error('[useBrowserNotifications] Notification failed:', err);
    }
  }, []);

  return { permission, showOfferNotification };
}
