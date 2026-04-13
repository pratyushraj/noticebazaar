import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/utils/api';

export type HealthStatus = 'idle' | 'checking' | 'connected' | 'error';

interface UseHealthCheckResult {
  status: HealthStatus;
  isConnected: boolean;
  checkHealth: () => Promise<boolean>;
}

/**
 * Pings /api/health on mount and returns connection status.
 * Use this to show a subtle "Connecting..." indicator until first success.
 */
export function useHealthCheck(): UseHealthCheckResult {
  const [status, setStatus] = useState<HealthStatus>('idle');

  const checkHealth = useCallback(async (): Promise<boolean> => {
    setStatus('checking');
    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // Abort after 5s to avoid hanging on cold starts
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json().catch(() => ({}));
      const ok = res.ok || data?.success || data?.status === 'ok';
      setStatus(ok ? 'connected' : 'error');
      return ok;
    } catch {
      setStatus('error');
      return false;
    }
  }, []);

  useEffect(() => {
    // Ping on mount (cold-start check)
    checkHealth();

    // Re-check every 60s to keep status fresh
    const interval = setInterval(checkHealth, 60_000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    status,
    isConnected: status === 'connected',
    checkHealth,
  };
}
