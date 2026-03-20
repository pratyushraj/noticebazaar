/**
 * Offline Detection Hook
 * Monitors network status and provides retry functionality
 */

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseOfflineDetectionOptions {
  autoRetry?: boolean;
  retryInterval?: number; // in milliseconds
  onOnline?: () => void;
  onOffline?: () => void;
}

export const useOfflineDetection = (options: UseOfflineDetectionOptions = {}) => {
  const {
    autoRetry = true,
    retryInterval = 3000,
    onOnline,
    onOffline,
  } = options;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const [retryToastId, setRetryToastId] = useState<string | number | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      // Try to fetch a small resource to verify connection
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  const handleOnline = useCallback(async () => {
    const actuallyOnline = await checkConnection();
    if (actuallyOnline) {
      setIsOnline(true);
      setRetryCount(0);
      if (retryToastId) {
        toast.dismiss(retryToastId);
        setRetryToastId(null);
      }
      toast.success('Connected', {
        description: 'You are back online',
        duration: 2000,
      });
      onOnline?.();
    }
  }, [checkConnection, retryToastId, onOnline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    onOffline?.();
    
    if (autoRetry) {
      const toastId = toast.error('No internet — retrying', {
        description: 'We will automatically retry when connection is restored',
        duration: Infinity,
      });
      setRetryToastId(toastId);
    }
  }, [autoRetry, onOffline]);

  useEffect(() => {
    // Initial check
    checkConnection().then((online) => {
      if (!online && navigator.onLine) {
        // Browser says online but fetch failed
        handleOffline();
      }
    });

    // Listen to online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic retry if offline
    let retryIntervalId: NodeJS.Timeout | null = null;
    if (!isOnline && autoRetry) {
      retryIntervalId = setInterval(async () => {
        const online = await checkConnection();
        if (online) {
          handleOnline();
        } else {
          setRetryCount((prev) => prev + 1);
        }
      }, retryInterval);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (retryIntervalId) {
        clearInterval(retryIntervalId);
      }
    };
  }, [isOnline, autoRetry, retryInterval, checkConnection, handleOnline, handleOffline]);

  return {
    isOnline,
    retryCount,
    checkConnection,
  };
};

