

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';

import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

interface OfflineBannerProps {
  onRetry?: () => void;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ onRetry }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerHaptic(HapticPatterns.success);
      if (onRetry) {
        setIsRetrying(true);
        setTimeout(async () => {
          await onRetry();
          setIsRetrying(false);
        }, 500);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      triggerHaptic(HapticPatterns.error);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onRetry]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-16 left-0 right-0 z-[99] bg-secondary/90 backdrop-blur-xl border-b border-border"
        >
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">Working offline</p>
                <p className="text-xs text-foreground/80">Your changes will sync when you're back online</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      {isOnline && isRetrying && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-16 left-0 right-0 z-[99] bg-primary/90 backdrop-blur-xl border-b border-primary"
        >
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-foreground animate-spin" />
            <p className="text-sm font-semibold text-foreground">Syncing your data...</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
