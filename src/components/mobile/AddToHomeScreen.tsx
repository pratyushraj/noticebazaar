
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Share, PlusSquare, X, ArrowRight, Zap, MoreVertical, Download, Bell, Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '@/lib/utils/analytics';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePwaInstall } from '@/hooks/usePwaInstall';

const AddToHomeScreen: React.FC = () => {
  const location = useLocation();
  const { deferredPrompt, canInstall, promptInstall } = usePwaInstall();
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
    const eligiblePrefixes = [
      '/deal/', 
      '/creator-dashboard', 
      '/brand-dashboard', 
      '/dashboard-preview', 
      '/creator-link-ready',
      '/collab-requests',
      '/brand-offers',
      '/payment/',
      '/deal-delivery-details'
    ];
    const isEligibleRoute = eligiblePrefixes.some(prefix => location.pathname.startsWith(prefix))
      || (location.pathname.length > 1 && !location.pathname.includes('.') && !location.pathname.includes('/')); // Handle /username landing pages

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

    const handleAppInstalled = () => {
      setShowBanner(false);
      localStorage.setItem(INSTALL_DISMISS_KEY, Date.now().toString());
      trackEvent('pwa_app_installed', {
        platform: canShowIOSGuide ? 'ios' : 'android',
        route: location.pathname,
      });
      toast.success('Creator Armour app installed');
      localStorage.setItem('pwa_show_install_success_toast', '1');
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [location.pathname, canInstall]);

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
        setShowSteps(true);
        triggerHaptic(HapticPatterns.light);
      }
      return;
    }

    triggerHaptic(HapticPatterns.success);
    const success = await promptInstall();
    
    if (success) {
      setShowBanner(false);
      localStorage.setItem(INSTALL_DISMISS_KEY, Date.now().toString());
    }
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
        initial={{ y: -120, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -120, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="fixed top-0 inset-x-0 z-[9999] p-4 md:hidden pointer-events-none"
      >
        <div className="max-w-screen-sm mx-auto pointer-events-auto">
          <div
            className={cn(
              "relative overflow-hidden rounded-[2.5rem] border backdrop-blur-3xl px-5 py-4 shadow-2xl",
              "bg-card/95 border-primary/20 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]"
            )}
            style={{ paddingTop: 'max(12px, env(safe-area-inset-top, 0px))' }}
          >
            {/* Background Accent / Dynamic Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-[100px] animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full -ml-24 -mb-24 blur-[80px]" />
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="relative group shrink-0">
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary to-primary/50 rounded-2xl blur-md opacity-40 group-hover:opacity-70 transition duration-1000 animate-pulse" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center shadow-2xl border border-primary/30 overflow-hidden">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent_70%)]" />
                  <ShieldCheck className="w-7 h-7 text-primary-foreground drop-shadow-md" strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary font-black text-[9px] uppercase tracking-[0.15em] shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]">Premium</span>
                  <div className="flex items-center gap-1 text-primary/70">
                    <Zap className="w-2.5 h-2.5 fill-current animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest">v1.3</span>
                  </div>
                </div>
                <h3 className="text-foreground font-black tracking-tight text-[17px] leading-tight">
                  Install <span className="text-primary">Armour</span>
                </h3>
                <p className="text-muted-foreground text-[11px] font-bold leading-tight mt-1">
                  {isAndroid ? 'Native workflow • 2x Faster' : 'Add to home screen for push'}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={handleInstall}
                  className={cn(
                    "relative h-10 px-6 rounded-full text-[12px] font-black uppercase tracking-widest transition-all active:scale-90 shadow-2xl overflow-hidden",
                    "bg-foreground text-background hover:opacity-90"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-background/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                  {showSteps ? 'Steps' : 'Open'}
                </button>
                <button 
                  type="button"
                  onClick={handleDismiss}
                  className="w-10 h-10 rounded-full bg-secondary/30 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 active:scale-90 transition-all backdrop-blur-md"
                  aria-label="Dismiss app banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showSteps && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-6 pt-6 border-t border-white/10"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {isIOSDevice ? (
                      <>
                        <div className="bg-secondary/20 rounded-[22px] p-4 border border-border relative overflow-hidden group">
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex items-center gap-3 mb-2.5">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                              <Share className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Step 01</span>
                          </div>
                          <p className="text-[11px] font-bold text-foreground leading-snug">Tap 'Share' in Safari browser</p>
                        </div>
                        <div className="bg-secondary/20 rounded-[22px] p-4 border border-border relative overflow-hidden group">
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex items-center gap-3 mb-2.5">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                              <Plus className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Step 02</span>
                          </div>
                          <p className="text-[11px] font-bold text-foreground leading-snug">Select 'Add to Home Screen'</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-secondary/20 rounded-[22px] p-4 border border-border relative overflow-hidden group">
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex items-center gap-3 mb-2.5">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                              <MoreVertical className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Step 01</span>
                          </div>
                          <p className="text-[11px] font-bold text-foreground leading-snug">Tap Menu (three dots)</p>
                        </div>
                        <div className="bg-secondary/20 rounded-[22px] p-4 border border-border relative overflow-hidden group">
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex items-center gap-3 mb-2.5">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                              <Download className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Step 02</span>
                          </div>
                          <p className="text-[11px] font-bold text-foreground leading-snug">Select 'Install' or 'Add to Home'</p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 rounded-xl p-3 border border-primary/10">
                    <Bell className="w-3 h-3 fill-current" />
                    Enables Instant Push Notifications & Offline Access
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
