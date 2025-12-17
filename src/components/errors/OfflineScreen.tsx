"use client";

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface OfflineScreenProps {
  onRetry?: () => void;
}

/**
 * Full-page offline screen component
 * - Shows when user has no internet connection
 * - Provides retry functionality
 * - Auto-detects when connection is restored
 */
export const OfflineScreen: React.FC<OfflineScreenProps> = ({ onRetry }) => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (onRetry) {
        setIsRetrying(true);
        setTimeout(async () => {
          await onRetry();
          setIsRetrying(false);
        }, 500);
      } else {
        // Auto-reload if no custom retry handler
        window.location.reload();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsRetrying(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onRetry]);

  const handleRetry = () => {
    if (navigator.onLine) {
      if (onRetry) {
        setIsRetrying(true);
        onRetry();
        setTimeout(() => setIsRetrying(false), 1000);
      } else {
        window.location.reload();
      }
    }
  };

  return (
    <div className="nb-screen-height flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <WifiOff className="w-24 h-24 mx-auto mb-6 text-purple-400" />
        </motion.div>
        
        <h1 className="text-3xl font-bold mb-2">No Internet Connection</h1>
        <p className="text-white/70 mb-6">
          Please check your connection and try again. We'll automatically retry when you're back online.
        </p>
        
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleRetry}
            disabled={!navigator.onLine || isRetrying}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </>
            )}
          </Button>
          
          {!navigator.onLine && (
            <p className="text-sm text-purple-300 mt-2">
              Waiting for connection...
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OfflineScreen;

