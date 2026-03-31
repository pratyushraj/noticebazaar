import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineTime: Date | null;
  lastOfflineTime: Date | null;
}

/**
 * Hook to monitor network status
 * - Tracks online/offline state
 * - Detects when connection is restored
 * - Provides timestamps for connection events
 */
export const useNetworkStatus = (): NetworkStatus => {
  const isLocalhost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);

  const getEffectiveOnlineState = () => (isLocalhost ? true : navigator.onLine);

  const [isOnline, setIsOnline] = useState(getEffectiveOnlineState);
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(
    getEffectiveOnlineState() ? new Date() : null
  );
  const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(
    !getEffectiveOnlineState() ? new Date() : null
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(getEffectiveOnlineState());
      setLastOnlineTime(new Date());
      if (wasOffline) {
        // Connection restored
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      if (isLocalhost) {
        setIsOnline(true);
        return;
      }
      setIsOnline(false);
      setWasOffline(true);
      setLastOfflineTime(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isLocalhost, wasOffline]);

  return {
    isOnline,
    wasOffline,
    lastOnlineTime,
    lastOfflineTime,
  };
};
