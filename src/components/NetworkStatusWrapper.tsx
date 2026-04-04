"use client";

import React from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

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
  useNetworkStatus();

  return <>{children}</>;
};

export default NetworkStatusWrapper;
