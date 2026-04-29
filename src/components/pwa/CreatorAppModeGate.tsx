

import React, { useEffect, useMemo, useState } from 'react';
import { Download, Smartphone, ShieldCheck, Share, Plus, MoreVertical, Zap, Bell } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface CreatorAppModeGateProps {
  enabled: boolean;
  children: React.ReactNode;
}

const CreatorAppModeGate: React.FC<CreatorAppModeGateProps> = ({ enabled, children }) => {
  const BROWSER_BYPASS_KEY = 'creatorarmour.allow-browser-mode';
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstagramBrowser, setIsInstagramBrowser] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [allowBrowserMode, setAllowBrowserMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setAllowBrowserMode(window.localStorage.getItem(BROWSER_BYPASS_KEY) === '1');

    const updateMode = () => {
      const standaloneMatch = window.matchMedia?.('(display-mode: standalone)').matches === true;
      const iosStandalone = (window.navigator as any).standalone === true;
      const userAgent = navigator.userAgent || '';
      setIsStandalone(standaloneMatch || iosStandalone);
      setIsMobile(/Android|iPhone|iPad|iPod/i.test(userAgent) || window.innerWidth < 1024);
      setIsIOS(/iPhone|iPad|iPod/i.test(userAgent));
      setIsAndroid(/Android/i.test(userAgent));
      setIsInstagramBrowser(/Instagram/i.test(userAgent));
    };

    updateMode();
    window.addEventListener('resize', updateMode);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', updateMode);

    return () => {
      window.removeEventListener('resize', updateMode);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', updateMode);
    };
  }, []);

  const shouldBlock = useMemo(() => {
    if (!enabled) return false;
    if (typeof window === 'undefined') return false;
    const pathname = window.location.pathname || '';
    const isProtectedCreatorWorkflow =
      pathname.startsWith('/creator-dashboard') ||
      pathname.startsWith('/collab-requests/') ||
      pathname.startsWith('/deal/') ||
      pathname.startsWith('/payment/') ||
      pathname.startsWith('/deal-delivery-details/');
    if (isProtectedCreatorWorkflow) return false;
    const bypass = new URLSearchParams(window.location.search).get('allowBrowser') === '1';
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    return !bypass && !allowBrowserMode && !isLocalhost && isMobile && !isStandalone;
  }, [allowBrowserMode, enabled, isMobile, isStandalone]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    if (isIOS) {
      alert('Tap Share -> Add to Home Screen, then open Creator Armour from your home screen.');
      return;
    }
    alert('Open browser menu and choose "Install app" or "Add to home screen".');
  };

  const handleContinueAnyway = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(BROWSER_BYPASS_KEY, '1');
    setAllowBrowserMode(true);
  };

  if (!shouldBlock) {
    return <>{children}</>;
  }

  const title = isInstagramBrowser ? 'Best in Browser or App' : 'Open Creator Armour App';
  const description = isInstagramBrowser
    ? 'Instagram in-app browser can break login and sharing. Open in your browser or install the app for a native experience.'
    : 'Get instant notifications, faster load times, and a native app experience. Install to your home screen today.';
  const installLabel = deferredPrompt ? 'Install App' : isInstagramBrowser ? 'Open in Browser / Install App' : 'Install / Open App';
  const continueLabel = 'Continue in Browser';
  const quickSteps = isInstagramBrowser
    ? [
        'Tap the browser menu and open this page in Chrome or Safari.',
        'If you want, install Creator Armour from there later.',
        'You can also continue in browser right now.',
      ]
    : [
        'Install Creator Armour to Home Screen.',
        'Open from the Home Screen icon.',
        'Sign in once and continue.',
      ];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#F8FAFC] via-[#EEF7F1] to-[#F8FAFC] px-5 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-primary bg-card shadow-[0_20px_60px_rgba(16,185,129,0.12)] p-6 text-center">
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <ShieldCheck className="w-7 h-7 text-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-muted-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground mb-5">{description}</p>
        <button type="button"
          onClick={handleInstall}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-foreground font-semibold py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
        >
          <Download className="w-4 h-4" />
          {installLabel}
        </button>
        <button
          onClick={handleContinueAnyway}
          className="mt-3 w-full rounded-2xl border border-border bg-card text-muted-foreground font-semibold py-3.5 transition-colors hover:bg-background"
        >
          {continueLabel}
        </button>
        <div className="mt-6 rounded-[24px] bg-background border border-border p-5 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-[0.05]">
            <Smartphone className="w-16 h-16 rotate-12" />
          </div>
          
          <p className="text-[12px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5" />
            Quick Setup Guide
          </p>

          <div className="space-y-4 relative z-10">
            {isIOS ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Share className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-muted-foreground leading-tight">Step 1: Tap Share</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">Found at the bottom or top of Safari</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-muted-foreground leading-tight">Step 2: Add to Home Screen</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">Scroll down in the share menu to find it</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <MoreVertical className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-muted-foreground leading-tight">Step 1: Open Browser Menu</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">Tap the three dots in Chrome or Edge</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Download className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-muted-foreground leading-tight">Step 2: Install / Add to Home</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">Tap 'Install app' or 'Add to home screen'</p>
                  </div>
                </div>
              </>
            )}

            <div className="pt-2 flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-500/5 -mx-5 -mb-5 p-3 px-5 border-t border-emerald-500/10">
              <Bell className="w-3 h-3" />
              Enables Instant Notifications
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorAppModeGate;
