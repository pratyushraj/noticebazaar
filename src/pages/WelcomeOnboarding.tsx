
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smartphone, 
  Share, 
  PlusSquare, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2,
  Zap,
  Bell,
  MoreVertical,
  Plus,
  Download,
  Laptop,
  ShieldCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { OnboardingContainer } from "@/components/onboarding/OnboardingContainer";
import { cn } from "@/lib/utils";
import { triggerHaptic, HapticPatterns } from "@/lib/utils/haptics";

type Platform = "ios" | "android" | "desktop";

export default function WelcomeOnboarding() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform>("ios");
  const [hasDetected, setHasDetected] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    document.title = "Welcome to Creator Armour";

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform("android"); // Priority for Android if prompt is available
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    // Detect platform
    const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
    const isAndroid = /Android/i.test(window.navigator.userAgent);
    
    if (isIOS) setPlatform("ios");
    else if (isAndroid) setPlatform("android");
    else setPlatform("ios"); // Default to iOS for demo/desktop if not detected
    
    setHasDetected(true);

    // Celebrate!
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handlePlatformChange = (p: Platform) => {
    setPlatform(p);
    triggerHaptic(HapticPatterns.light);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    triggerHaptic(HapticPatterns.medium);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  return (
    <OnboardingContainer theme="light" allowScroll>
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col items-center px-4 py-10 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-2xl rounded-[36px] border border-slate-200 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)]"
        >
          {/* Success Header */}
          <div className="rounded-t-[36px] border-b border-slate-100 bg-gradient-to-b from-emerald-50/80 to-white px-6 py-8 text-center sm:px-10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-50">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-8 h-[1px] bg-emerald-500/30" />
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-600">Access Secured</p>
              <div className="w-8 h-[1px] bg-emerald-500/30" />
            </div>
            <h1 className="text-[2.5rem] font-black tracking-tight text-slate-950 leading-[0.95] sm:text-5xl uppercase italic">
              Welcome to the Armoury
            </h1>
            <p className="mt-4 mx-auto max-w-md text-[15px] leading-7 text-slate-600 sm:text-base">
              Your account is ready. To receive instant deal alerts, install the Creator Armour app on your phone.
            </p>
          </div>

          {/* Installation Guide */}
          <div className="rounded-b-[36px] px-6 py-10 sm:px-10 bg-slate-50/30">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-slate-950">Install Instructions</h2>
              </div>
              
              {/* Platform Switcher */}
              <div className="flex p-1 bg-slate-200/50 rounded-2xl border border-slate-200">
                <button 
                  onClick={() => handlePlatformChange("ios")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                    platform === "ios" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  iPhone
                </button>
                <button 
                  onClick={() => handlePlatformChange("android")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                    platform === "android" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Android
                </button>
                <button 
                  onClick={() => handlePlatformChange("desktop")}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                    platform === "desktop" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Desktop
                </button>
              </div>
            </div>

            <div className="min-h-[300px]">
              <AnimatePresence mode="wait">
                {platform === "ios" && (
                  <motion.div 
                    key="ios"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid gap-6"
                  >
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start gap-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <MoreVertical className="h-5 w-5 rotate-90" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Step 01</p>
                        <p className="font-bold text-slate-900 text-lg">Tap the 3 dots (•••)</p>
                        <p className="text-sm text-slate-600 mt-1">Look for the menu dots near your browser's address bar.</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start gap-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <Share className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Step 02</p>
                        <p className="font-bold text-slate-900 text-lg">Tap the 3 dots again</p>
                        <p className="text-sm text-slate-600 mt-1">Tap the dots again or select the "Share" option in the menu.</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start gap-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <PlusSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Step 03</p>
                        <p className="font-bold text-slate-900 text-lg">Add to Home Screen</p>
                        <p className="text-sm text-slate-600 mt-1">Select <strong className="text-slate-900">"Add to Home Screen"</strong> from the list.</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {platform === "android" && (
                  <motion.div 
                    key="android"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid gap-6"
                  >
                    {deferredPrompt ? (
                      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100">
                          <Download className="h-8 w-8" />
                        </div>
                        <p className="font-bold text-slate-900 text-xl">Ready to Install</p>
                        <p className="text-sm text-slate-600 mt-2 max-w-xs mx-auto leading-relaxed">
                          Your Android device supports direct installation. Tap below to add Creator Armour to your home screen.
                        </p>
                        <Button 
                          onClick={handleInstall}
                          className="mt-6 h-14 w-full rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                        >
                          Install App Now
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start gap-5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <MoreVertical className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Step 01</p>
                            <p className="font-bold text-slate-900 text-lg">Tap Menu Icon</p>
                            <p className="text-sm text-slate-600 mt-1">Tap the three dots (⋮) in the top right corner of Chrome.</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start gap-5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <Download className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Step 02</p>
                            <p className="font-bold text-slate-900 text-lg">Install App</p>
                            <p className="text-sm text-slate-600 mt-1">Select <strong className="text-slate-900">"Install App"</strong> or "Add to Home Screen".</p>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {platform === "desktop" && (
                  <motion.div 
                    key="desktop"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid gap-6"
                  >
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                        <Laptop className="h-8 w-8" />
                      </div>
                      <p className="font-bold text-slate-900 text-xl">Desktop Installation</p>
                      <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                        In Chrome or Edge, click the <strong className="text-slate-900">Install icon</strong> in the right side of your address bar to add Creator Armour to your computer.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-10 rounded-[2rem] bg-indigo-50/50 p-6 border border-indigo-100 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-3 w-3 text-indigo-600 fill-current" />
                    <p className="text-[11px] font-black uppercase tracking-widest text-indigo-600">Why install?</p>
                  </div>
                  <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                    Installing the app enables <strong>Real-time Push Notifications</strong>. We'll alert you instantly whenever a brand sends an offer or releases a payment.
                  </p>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-4">
                <Button 
                  onClick={() => navigate("/login")}
                  className="h-16 rounded-[1.25rem] bg-slate-950 text-base font-black uppercase tracking-[0.1em] text-white hover:bg-slate-800 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] transition-all active:scale-95"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Secure login required • v1.4.2
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </OnboardingContainer>
  );
}
