import { createContext, useContext, useMemo, ReactNode, useEffect, useState } from 'react';
import { useBrandDealById } from '@/lib/hooks/useBrandDeals';
import { useIssues } from '@/lib/hooks/useIssues';
import { useDealActionLogs } from '@/lib/hooks/useActionLogs';
import { useSession } from './SessionContext';
import { useQueryClient } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/lib/utils/api';
import { supabase } from '@/integrations/supabase/client';

const readPersistedSupabaseAuth = (): { userId: string | null; accessToken: string | null } => {
  if (typeof window === 'undefined') {
    return { userId: null, accessToken: null };
  }

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.includes('auth-token')) continue;

    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const candidates = [
        parsed,
        parsed?.currentSession,
        parsed?.session,
        Array.isArray(parsed) ? parsed[0] : null,
      ].filter(Boolean);

      for (const candidate of candidates) {
        const accessToken = candidate?.access_token || null;
        const userId = candidate?.user?.id || null;
        if (accessToken || userId) {
          return { userId, accessToken };
        }
      }
    } catch {
      // Ignore malformed persisted auth values.
    }
  }

  return { userId: null, accessToken: null };
};

const readCachedDeal = (dealId?: string, userId?: string | null) => {
  if (typeof window === 'undefined' || !dealId || !userId) return null;

  try {
    const raw = window.sessionStorage.getItem(`creator-deals:${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.find((deal) => String(deal?.id || '') === String(dealId)) || null;
  } catch {
    return null;
  }
};

interface DealContextValue {
  // Data
  deal: ReturnType<typeof useBrandDealById>['data'];
  issues: ReturnType<typeof useIssues>['data'];
  actionLogs: ReturnType<typeof useDealActionLogs>['data'];
  
  // Loading states
  isLoadingDeal: boolean;
  isLoadingIssues: boolean;
  isLoadingLogs: boolean;
  
  // Error states
  dealError: Error | null;
  issuesError: Error | null;
  logsError: Error | null;
  
  // Refresh methods
  refreshDeal: () => void;
  refreshIssues: () => void;
  refreshLogs: () => void;
  refreshAll: () => void;
  
  // Computed states
  hasIssues: boolean;
  hasActionLogs: boolean;
}

const DealContext = createContext<DealContextValue | undefined>(undefined);

interface DealProviderProps {
  dealId: string | undefined;
  initialDeal?: ReturnType<typeof useBrandDealById>['data'];
  children: ReactNode;
}

export function DealProvider({ dealId, initialDeal = null, children }: DealProviderProps) {
  const { profile, session, user } = useSession();
  const queryClient = useQueryClient();
  const persistedAuth = readPersistedSupabaseAuth();
  const [authFallbackUserId, setAuthFallbackUserId] = useState<string | null>(() => persistedAuth.userId);
  const [authFallbackAccessToken, setAuthFallbackAccessToken] = useState<string | null>(() => persistedAuth.accessToken);
  const resolvedUserId = profile?.id || session?.user?.id || user?.id || authFallbackUserId;
  const accessToken = session?.access_token || authFallbackAccessToken;
  const [serverDealFallback, setServerDealFallback] = useState<DealContextValue['deal']>(() => (
    initialDeal || readCachedDeal(dealId, profile?.id || session?.user?.id || user?.id || persistedAuth.userId)
  ));
  const [isLoadingServerDeal, setIsLoadingServerDeal] = useState(false);

  // Fetch deal data
  const {
    data: deal,
    isLoading: isLoadingDeal,
    error: dealError,
  } = useBrandDealById(dealId, resolvedUserId);

  useEffect(() => {
    if (session?.access_token && session?.user?.id) return;

    let cancelled = false;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;
      if (!cancelled && currentSession) {
        setAuthFallbackUserId(currentSession.user?.id || null);
        setAuthFallbackAccessToken(currentSession.access_token || null);
      }
    };

    void syncSession();

    return () => {
      cancelled = true;
    };
  }, [session?.access_token, session?.user?.id]);

  useEffect(() => {
    let cancelled = false;

    const loadServerDeal = async () => {
      if (!dealId || !accessToken || deal) {
        setIsLoadingServerDeal(false);
        return;
      }

      setIsLoadingServerDeal(true);
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/deals/${dealId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) return;
        const payload = await response.json().catch(() => null);
        if (!cancelled && payload?.success && payload?.deal) {
          setServerDealFallback(payload.deal);
        }
      } catch {
        // Best-effort fallback only.
      } finally {
        if (!cancelled) {
          setIsLoadingServerDeal(false);
        }
      }
    };

    void loadServerDeal();

    return () => {
      cancelled = true;
    };
  }, [accessToken, deal, dealId]);

  const resolvedDeal = deal || serverDealFallback;
  const resolvedDealError = (dealError as Error | null) && !resolvedDeal ? (dealError as Error | null) : null;
  const resolvedIsLoadingDeal = !resolvedDeal && (isLoadingDeal || isLoadingServerDeal);

  useEffect(() => {
    if (typeof window === 'undefined' || !resolvedDeal || !dealId) return;

    try {
      window.sessionStorage.setItem(`deal-cache:${dealId}`, JSON.stringify(resolvedDeal));

      if (resolvedUserId) {
        const existingRaw = window.sessionStorage.getItem(`creator-deals:${resolvedUserId}`);
        const existingDeals = (() => {
          try {
            const parsed = existingRaw ? JSON.parse(existingRaw) : [];
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })();

        const nextDeals = [
          resolvedDeal,
          ...existingDeals.filter((item) => String(item?.id || '') !== String(resolvedDeal?.id || '')),
        ].slice(0, 25);

        window.sessionStorage.setItem(`creator-deals:${resolvedUserId}`, JSON.stringify(nextDeals));
      }
    } catch {
      // Best-effort cache only.
    }
  }, [dealId, resolvedDeal, resolvedUserId]);

  // Fetch issues
  const {
    data: issues = [],
    isLoading: isLoadingIssues,
    error: issuesError,
  } = useIssues(dealId, !!dealId);

  // Fetch action logs
  const {
    data: actionLogs = [],
    isLoading: isLoadingLogs,
    error: logsError,
  } = useDealActionLogs(dealId, !!dealId);

  // Refresh methods
  const refreshDeal = () => {
    // Invalidate all variations of the query key
    queryClient.invalidateQueries({ queryKey: ['brand-deal', dealId] });
    queryClient.invalidateQueries({ queryKey: ['brand_deal', dealId] });
    queryClient.invalidateQueries({ queryKey: ['brand_deal', dealId, resolvedUserId] });
    // Force immediate refetch of active queries
    queryClient.refetchQueries({ 
      queryKey: ['brand_deal', dealId, resolvedUserId],
      type: 'active'
    });
    queryClient.refetchQueries({ 
      queryKey: ['brand-deal', dealId],
      type: 'active'
    });
  };

  const refreshIssues = () => {
    queryClient.invalidateQueries({ queryKey: ['issues', dealId] });
  };

  const refreshLogs = () => {
    queryClient.invalidateQueries({ queryKey: ['deal-action-logs', dealId] });
  };

  const refreshAll = () => {
    refreshDeal();
    refreshIssues();
    refreshLogs();
  };

  // Computed values
  const hasIssues = issues.length > 0;
  const hasActionLogs = actionLogs.length > 0;

  const value = useMemo<DealContextValue>(
    () => ({
      deal: resolvedDeal,
      issues,
      actionLogs,
      isLoadingDeal: resolvedIsLoadingDeal,
      isLoadingIssues,
      isLoadingLogs,
      dealError: resolvedDealError,
      issuesError: issuesError as Error | null,
      logsError: logsError as Error | null,
      refreshDeal,
      refreshIssues,
      refreshLogs,
      refreshAll,
      hasIssues,
      hasActionLogs,
    }),
    [
      resolvedDeal,
      issues,
      actionLogs,
      resolvedIsLoadingDeal,
      isLoadingIssues,
      isLoadingLogs,
      resolvedDealError,
      issuesError,
      logsError,
      hasIssues,
      hasActionLogs,
    ]
  );

  return <DealContext.Provider value={value}>{children}</DealContext.Provider>;
}

/**
 * Hook to use DealContext
 */
export function useDeal() {
  const context = useContext(DealContext);
  if (context === undefined) {
    throw new Error('useDeal must be used within a DealProvider');
  }
  return context;
}
