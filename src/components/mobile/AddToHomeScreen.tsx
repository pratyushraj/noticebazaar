"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Download, Share, PlusSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useDealAlertNotifications } from '@/hooks/useDealAlertNotifications';
import { trackEvent } from '@/lib/utils/analytics';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { toast } from 'sonner';

const AddToHomeScreen: React.FC = () => {
  const { profile } = useSession();
  const location = useLocation();
  const {
    isSupported: notificationSupported,
    permission,
    isSubscribed,
    isBusy,
    enableNotifications,
  } = useDealAlertNotifications();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [showNotificationNudge, setShowNotificationNudge] = useState(false);

  const INSTALL_DISMISS_KEY = 'pwa_install_prompt_dismissed_at';
  const NOTIFICATION_NUDGE_DISMISS_KEY = 'pwa_notification_nudge_dismissed_at';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (location.pathname === '/') {
      setShowBanner(false);
      return;
    }
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
    const isAndroid = /Android/i.test(window.navigator.userAgent);
    const isSafari = /Safari/i.test(window.navigator.userAgent)
      && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(window.navigator.userAgent);
    const isBlockedRoute = ['/maintenance'].includes(location.pathname);

    const canShowIOSGuide = isIOS && isSafari;
    const canShowAndroidPrompt = isAndroid;
    setIsIOSDevice(canShowIOSGuide);

    if (isBlockedRoute || isStandalone || (!canShowIOSGuide && !canShowAndroidPrompt)) {
      setShowBanner(false);
      return;
    }

    const dismissedAt = Number(localStorage.getItem(INSTALL_DISMISS_KEY) || '0');
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const wasDismissedRecently = dismissedAt > 0 && Date.now() - dismissedAt < threeDaysMs;
    const params = new URLSearchParams(window.location.search);
    const forceInstallPreview = ['1', 'true', 'yes'].includes((params.get('showInstall') || '').toLowerCase());
    const forceInstallIntent = ['1', 'true', 'yes'].includes((params.get('openApp') || '').toLowerCase())
      || ['email', 'whatsapp', 'push'].includes((params.get('source') || '').toLowerCase());
    const shouldForceShow = forceInstallPreview || forceInstallIntent;

    if (wasDismissedRecently && !shouldForceShow) {
      setShowBanner(false);
      return;
    }

    // Show the same install banner UI on both iOS and Android.
    setShowBanner(true);
    trackEvent('pwa_install_banner_shown', {
      platform: canShowIOSGuide ? 'ios' : 'android',
      route: location.pathname,
      source: params.get('source') || null,
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setShowBanner(false);
      localStorage.setItem(INSTALL_DISMISS_KEY, Date.now().toString());
      trackEvent('pwa_app_installed', {
        platform: canShowIOSGuide ? 'ios' : 'android',
        route: location.pathname,
      });
      toast.success('CreatorArmour installed', {
        description: 'You can now open it directly from your home screen.',
      });
      localStorage.setItem('pwa_show_install_success_toast', '1');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [location.pathname, profile?.role, profile?.instagram_handle, profile?.username]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (location.pathname === '/') {
      setShowNotificationNudge(false);
      return;
    }
    const isCreator = profile?.role === 'creator';
    if (!isCreator) return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (!isStandalone || !notificationSupported || permission === 'granted' || isSubscribed) {
      setShowNotificationNudge(false);
      return;
    }

    const dismissedAt = Number(localStorage.getItem(NOTIFICATION_NUDGE_DISMISS_KEY) || '0');
    const cooldownMs = 7 * 24 * 60 * 60 * 1000;
    if (dismissedAt > 0 && Date.now() - dismissedAt < cooldownMs) {
      setShowNotificationNudge(false);
      return;
    }

    setShowNotificationNudge(true);
    trackEvent('pwa_notification_nudge_shown', { route: location.pathname });
  }, [location.pathname, profile?.role, notificationSupported, permission, isSubscribed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const shouldToast = localStorage.getItem('pwa_show_install_success_toast') === '1';
    if (!shouldToast) return;
    localStorage.removeItem('pwa_show_install_success_toast');
    toast.success('Welcome to App Mode', {
      description: 'You now get faster loading and a smoother creator workflow.',
    });
  }, []);

  const handleInstall = async () => {
    trackEvent('pwa_install_cta_clicked', {
      platform: isIOSDevice ? 'ios' : 'android',
      route: location.pathname,
    });

    if (!deferredPrompt) {
      if (isIOSDevice) {
        setShowSteps(true);
      } else {
        toast.message('Install from browser menu', {
          description: 'Tap browser menu and choose "Install app" or "Add to Home screen".',
        });
      }
      return;
    }

    triggerHaptic(HapticPatterns.success);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowBanner(false);
      localStorage.setItem(INSTALL_DISMISS_KEY, Date.now().toString());
      trackEvent('pwa_install_prompt_accepted', {
        platform: isIOSDevice ? 'ios' : 'android',
        route: location.pathname,
      });
    } else {
      trackEvent('pwa_install_prompt_dismissed', {
        platform: isIOSDevice ? 'ios' : 'android',
        route: location.pathname,
      });
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    triggerHaptic(HapticPatterns.light);
    setShowBanner(false);
    localStorage.setItem(INSTALL_DISMISS_KEY, Date.now().toString());
    trackEvent('pwa_install_prompt_dismissed', {
      platform: isIOSDevice ? 'ios' : 'android',
      route: location.pathname,
      manual: true,
    });
  };

  const handleDismissNotificationNudge = () => {
    setShowNotificationNudge(false);
    localStorage.setItem(NOTIFICATION_NUDGE_DISMISS_KEY, Date.now().toString());
  };

  const handleEnableNotifications = async () => {
    const result = await enableNotifications();
    if (result.success) {
      setShowNotificationNudge(false);
      trackEvent('pwa_notification_enabled', { route: location.pathname });
      toast.success('Instant deal alerts enabled');
      return;
    }
    toast.error('Could not enable alerts', {
      description: result.reason || 'Please try again',
    });
  };

  if (!showBanner && !showNotificationNudge) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-20 left-4 right-4 z-[90] md:hidden space-y-3">
        {showNotificationNudge && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-slate-900 border border-emerald-500/25 rounded-2xl shadow-[0_14px_40px_rgba(2,6,23,0.45)] p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white mb-1">Unlock instant deal alerts</h3>
                <p className="text-xs text-slate-300 mb-3">Know the moment a brand sends an offer.</p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleEnableNotifications}
                    size="sm"
                    disabled={isBusy}
                    className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500 min-h-[36px]"
                  >
                    Enable Alerts
                  </Button>
                  <button
                    onClick={handleDismissNotificationNudge}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    aria-label="Dismiss alerts prompt"
                  >
                    <X className="w-4 h-4 text-slate-200" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-white border border-emerald-100 rounded-2xl shadow-[0_14px_40px_rgba(16,185,129,0.18)] p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  Install CreatorArmour App
                </h3>
                <p className="text-xs text-slate-600 mb-3">
                  {isIOSDevice
                    ? 'Get instant deal alerts and close offers 2x faster from your home screen.'
                    : 'Get instant deal alerts and open your dashboard in one tap.'}
                </p>
                {showSteps && isIOSDevice && (
                  <div className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                    <p className="text-[11px] text-slate-700 flex items-center gap-1.5">
                      <Share className="w-3.5 h-3.5 text-emerald-600" />
                      Tap <span className="font-semibold">Share</span>
                    </p>
                    <p className="text-[11px] text-slate-700 mt-1 flex items-center gap-1.5">
                      <PlusSquare className="w-3.5 h-3.5 text-emerald-600" />
                      Choose <span className="font-semibold">Add to Home Screen</span>
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleInstall}
                    size="sm"
                    className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500 min-h-[36px]"
                  >
                    {isIOSDevice ? 'Add to Home Screen' : 'Install App'}
                  </Button>
                  <button
                    onClick={handleDismiss}
                    className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};

export default AddToHomeScreen;
