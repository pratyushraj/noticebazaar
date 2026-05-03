

import React, { useEffect, useMemo, useState } from 'react';
import { Download, Smartphone, ShieldCheck, Share, Plus, MoreVertical, Zap, Bell } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface CreatorAppModeGateProps {
  enabled: boolean;
  children: React.ReactNode;
}

const CreatorAppModeGate: React.FC<CreatorAppModeGateProps> = ({ enabled, children }) => {
  const { deferredPrompt, promptInstall } = usePwaInstall();
  const BROWSER_BYPASS_KEY = 'creatorarmour.allow-browser-mode';
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstagramBrowser, setIsInstagramBrowser] = useState(false);
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
    window.addEventListener('appinstalled', updateMode);

    return () => {
      window.removeEventListener('resize', updateMode);
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
    const success = await promptInstall();
    if (success) return;
    
    if (isIOS) {
      alert('Tap Share -> Add to Home Screen, then open Creator Armour from your home screen.');
      return;
    }
    if (!deferredPrompt) {
      alert('Open browser menu and choose "Install app" or "Add to home screen".');
    }
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
    <div className="min-h-[100dvh] bg-background px-5 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-[2.5rem] border border-border bg-card shadow-2xl p-6 text-center relative overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full -ml-24 -mb-24 blur-[60px]" />
        
        <div className="relative z-10">
          <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 border border-primary/20">
            <ShieldCheck className="w-8 h-8 text-primary-foreground drop-shadow-md" strokeWidth={2.5} />
          </div>
        <h2 className="text-2xl font-black tracking-tight text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6 font-medium leading-relaxed">{description}</p>
        
        <button type="button"
          onClick={handleInstall}
          className="relative w-full rounded-2xl overflow-hidden group py-4 flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(16,185,129,0.2)] transition-transform active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_60%)]" />
          <Download className="w-5 h-5 text-primary-foreground relative z-10" />
          <span className="text-primary-foreground font-black tracking-wide relative z-10">{installLabel}</span>
        </button>
        <button
          onClick={handleContinueAnyway}
          className="mt-3 w-full rounded-2xl border border-border bg-secondary/30 text-secondary-foreground font-bold py-4 transition-colors hover:bg-secondary/50 active:scale-[0.98]"
        >
          {continueLabel}
        </button>
        
        <div className="mt-8 rounded-[24px] bg-secondary/20 border border-border p-5 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
            <Smartphone className="w-24 h-24 rotate-12" />
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

            <div className="pt-2 flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 -mx-5 -mb-5 p-3 px-5 border-t border-primary/10">
              <Bell className="w-3 h-3" />
              Enables Instant Notifications
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorAppModeGate;
