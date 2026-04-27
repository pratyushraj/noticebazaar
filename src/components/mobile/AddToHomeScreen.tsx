
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Share, PlusSquare, X, ArrowRight, Zap } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '@/lib/utils/analytics';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
    const params = new URLSearchParams(window.location.search);
    const forceInstallPreview = ['1', 'true', 'yes'].includes((params.get('showInstall') || '').toLowerCase());
    const forceInstallIntent = ['1', 'true', 'yes'].includes((params.get('openApp') || '').toLowerCase())
      || ['email', 'whatsapp', 'push', 'collab_submit'].includes((params.get('source') || '').toLowerCase());
    const shouldForceShow = forceInstallPreview || forceInstallIntent;

    // Only show the banner where it makes product sense
    const eligiblePrefixes = ['/deal/', '/creator-dashboard', '/brand-dashboard', '/dashboard-preview', '/creator-link-ready'];
    const isEligibleRoute = eligiblePrefixes.some(prefix => location.pathname.startsWith(prefix));

    const canShowIOSGuide = isIOS && isSafari;
    const canShowAndroidPrompt = androidDevice;
    setIsIOSDevice(canShowIOSGuide);
    setIsAndroid(androidDevice);

    if (isBlockedRoute || isStandalone || !isMobile || (!canShowIOSGuide && !canShowAndroidPrompt) || (!isEligibleRoute && !shouldForceShow)) {
      setShowBanner(false);
      return;
    }

    const dismissedAt = Number(localStorage.getItem(INSTALL_DISMISS_KEY) || '0');
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const wasDismissedRecently = dismissedAt > 0 && Date.now() - dismissedAt < threeDaysMs;

    if (wasDismissedRecently && !shouldForceShow) {
      setShowBanner(false);
      return;
    }

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

  const handleInstall = async () => {
    trackEvent('pwa_install_cta_clicked', {
      platform: isIOSDevice ? 'ios' : 'android',
      route: location.pathname,
    });

    if (!deferredPrompt) {
      if (isIOSDevice) {
        setShowSteps(true);
        triggerHaptic(HapticPatterns.light);
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
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    triggerHaptic(HapticPatterns.light);
    setShowBanner(false);
    localStorage.setItem(INSTALL_DISMISS_KEY, Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 inset-x-0 z-[9999] p-4 md:hidden pointer-events-none"
      >
        <div className="max-w-screen-sm mx-auto pointer-events-auto">
          <div
            className={cn(
              "relative overflow-hidden rounded-[2.5rem] border backdrop-blur-3xl px-6 py-5 shadow-[0_25px_60px_rgba(0,0,0,0.4)]",
              "bg-gradient-to-br from-[#0F172A]/90 via-[#0F172A]/95 to-black/95 border-white/10"
            )}
            style={{ paddingTop: 'max(20px, env(safe-area-inset-top, 0px))' }}
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/15 rounded-full -mr-20 -mt-20 blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -ml-16 -mb-16 blur-[60px]" />
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-emerald-500 to-sky-500 rounded-[22px] blur-md opacity-40 group-hover:opacity-60 transition duration-1000" />
                <div className="relative w-14 h-14 rounded-[20px] bg-gradient-to-tr from-emerald-500 to-sky-500 flex items-center justify-center shrink-0 shadow-xl border border-white/20">
                  <ShieldCheck className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[9px] uppercase tracking-[0.2em]">Premium</span>
                  <div className="flex items-center gap-1 text-sky-400/60">
                    <Zap className="w-2.5 h-2.5 fill-current" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Fast</span>
                  </div>
                </div>
                <h3 className="text-white font-black tracking-tight text-[18px] leading-tight flex items-center gap-1.5">
                  CreatorArmour <span className="text-white/40 font-medium">App</span>
                </h3>
                <p className="text-white/50 text-[11px] font-bold leading-tight mt-1 truncate">
                  {isAndroid ? 'Native workflow • 2x Faster alerts' : 'Add to home screen for native experience'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={handleInstall}
                  className={cn(
                    "relative h-11 px-6 rounded-full text-[13px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg",
                    "bg-white text-black hover:bg-slate-100 shadow-white/10"
                  )}
                >
                  {showSteps ? 'Guide' : 'Open'}
                </button>
                <button 
                  type="button"
                  onClick={handleDismiss}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/10 active:scale-90 transition-all"
                  aria-label="Dismiss app banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showSteps && isIOSDevice && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-4 pt-4 border-t border-white/5"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Share className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Step 1</span>
                      </div>
                      <p className="text-[11px] font-bold text-white/80">Tap 'Share' in Safari browser</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <PlusSquare className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Step 2</span>
                      </div>
                      <p className="text-[11px] font-bold text-white/80">Choose 'Add to Home Screen'</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddToHomeScreen;
