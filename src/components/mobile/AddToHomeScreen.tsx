"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

const AddToHomeScreen: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    // Check visit count
    const count = parseInt(localStorage.getItem('visit_count') || '0', 10);
    const newCount = count + 1;
    setVisitCount(newCount);
    localStorage.setItem('visit_count', newCount.toString());

    // Show banner on 2nd, 3rd, and 4th visit
    if (newCount >= 2 && newCount <= 4) {
      const dismissed = localStorage.getItem('add_to_home_dismissed') === 'true';
      if (!dismissed) {
        setShowBanner(true);
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (newCount >= 2 && newCount <= 4) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback for iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert('To add to home screen:\n1. Tap the Share button\n2. Select "Add to Home Screen"');
      }
      return;
    }

    triggerHaptic(HapticPatterns.success);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowBanner(false);
      localStorage.setItem('add_to_home_dismissed', 'true');
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    triggerHaptic(HapticPatterns.light);
    setShowBanner(false);
    localStorage.setItem('add_to_home_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-[90] md:hidden"
      >
        <div className="bg-gradient-to-r from-purple-600/90 to-blue-600/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white mb-1">
                Add NoticeBazaar to home screen
              </h3>
              <p className="text-xs text-white/80 mb-3">
                Get 1-tap access to your dashboard
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="flex-1 bg-white text-purple-600 hover:bg-white/90 min-h-[36px]"
                >
                  Add to Home
                </Button>
                <button
                  onClick={handleDismiss}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddToHomeScreen;

