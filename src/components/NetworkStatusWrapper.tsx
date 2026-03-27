"use client";

import React from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import OfflineScreen from '@/components/errors/OfflineScreen';

interface NetworkStatusWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that shows offline screen when network is unavailable
 * - Monitors network status
 * - Shows full-page offline screen when disconnected
 * - Auto-reloads when connection is restored
 */
export const NetworkStatusWrapper: React.FC<NetworkStatusWrapperProps> = ({ children }) => {
  const { isOnline, wasOffline } = useNetworkStatus();

  // Show offline screen if currently offline
  if (!isOnline) {
    return <OfflineScreen onRetry={() => window.location.reload()} />;
  }

  return <>{children}</>;
};

export default NetworkStatusWrapper;

