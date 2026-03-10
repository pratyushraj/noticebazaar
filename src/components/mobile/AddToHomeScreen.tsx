"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Share, PlusSquare, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '@/lib/utils/analytics';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { toast } from 'sonner';

const AddToHomeScreen: React.FC = () => {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  const INSTALL_DISMISS_KEY = 'pwa_install_prompt_dismissed_at';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
    const androidDevice = /Android/i.test(window.navigator.userAgent);
    const isMobile = isIOS || androidDevice || window.innerWidth < 768;
    const isSafari = /Safari/i.test(window.navigator.userAgent)
      && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(window.navigator.userAgent);
    const isBlockedRoute = ['/maintenance'].includes(location.pathname);

    const canShowIOSGuide = isIOS && isSafari;
    const canShowAndroidPrompt = androidDevice;
    setIsIOSDevice(canShowIOSGuide);
    setIsAndroid(androidDevice);

    if (isBlockedRoute || isStandalone || !isMobile || (!canShowIOSGuide && !canShowAndroidPrompt)) {
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
      toast.success('CreatorArmour app installed');
      localStorage.setItem('pwa_show_install_success_toast', '1');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [location.pathname]);

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
  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        className="fixed top-0 inset-x-0 z-[120] md:hidden"
      >
        <div
          className="bg-[#0B0F14] border-b border-white/10 px-3 py-2"
          style={{ paddingTop: 'max(8px, env(safe-area-inset-top, 0px))' }}
        >
          <div className="max-w-screen-sm mx-auto flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-[15px] leading-tight">CreatorArmour</p>
              <p className="text-white/70 text-sm">
                {isAndroid ? 'Install the app for faster deal alerts' : 'Open in the CreatorArmour app'}
              </p>
              {showSteps && isIOSDevice && (
                <div className="mt-1.5 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-[11px] text-white/85">
                  <p className="flex items-center gap-1"><Share className="w-3 h-3" /> Tap Share</p>
                  <p className="flex items-center gap-1 mt-0.5"><PlusSquare className="w-3 h-3" /> Add to Home Screen</p>
                </div>
              )}
            </div>
            <button
              onClick={handleInstall}
              className="shrink-0 bg-[#0A84FF] hover:bg-[#2190ff] text-white font-bold px-5 py-2 rounded-full text-[17px] leading-none"
            >
              OPEN
            </button>
            <button
              onClick={handleDismiss}
              className="shrink-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              aria-label="Dismiss app banner"
            >
              <X className="w-4 h-4 text-white/80" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddToHomeScreen;
