"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Download, Smartphone, ShieldCheck } from 'lucide-react';

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
      alert('Tap Share -> Add to Home Screen, then open CreatorArmour from your home screen.');
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

  const title = isInstagramBrowser ? 'Best in Browser or App' : 'Open CreatorArmour App';
  const description = isInstagramBrowser
    ? 'Instagram in-app browser can break login and sharing. Open in your browser or continue here if you need to finish quickly.'
    : 'For the smoothest creator experience, use the installed app. You can still continue in your browser.';
  const installLabel = deferredPrompt ? 'Install App' : isInstagramBrowser ? 'Open in Browser / Install App' : 'Install / Open App';
  const continueLabel = 'Continue in Browser';
  const quickSteps = isInstagramBrowser
    ? [
        'Tap the browser menu and open this page in Chrome or Safari.',
        'If you want, install CreatorArmour from there later.',
        'You can also continue in browser right now.',
      ]
    : [
        'Install CreatorArmour to Home Screen.',
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
        <div className="mt-4 rounded-2xl bg-background border border-border p-4 text-left">
          <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" />
            Quick steps
          </p>
          {quickSteps.map((step) => (
            <p key={step} className="text-sm text-muted-foreground">{quickSteps.indexOf(step) + 1}. {step}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreatorAppModeGate;
