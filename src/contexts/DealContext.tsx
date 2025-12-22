import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useBrandDealById } from '@/lib/hooks/useBrandDeals';
import { useIssues } from '@/lib/hooks/useIssues';
import { useDealActionLogs } from '@/lib/hooks/useActionLogs';
import { useSession } from './SessionContext';
import { useQueryClient } from '@tanstack/react-query';

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
  children: ReactNode;
}

export function DealProvider({ dealId, children }: DealProviderProps) {
  const { profile } = useSession();
  const queryClient = useQueryClient();

  // Fetch deal data
  const {
    data: deal,
    isLoading: isLoadingDeal,
    error: dealError,
  } = useBrandDealById(dealId, profile?.id);

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
    queryClient.invalidateQueries({ queryKey: ['brand_deal', dealId, profile?.id] });
    // Force immediate refetch of active queries
    queryClient.refetchQueries({ 
      queryKey: ['brand_deal', dealId, profile?.id],
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
      deal,
      issues,
      actionLogs,
      isLoadingDeal,
      isLoadingIssues,
      isLoadingLogs,
      dealError: dealError as Error | null,
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
      deal,
      issues,
      actionLogs,
      isLoadingDeal,
      isLoadingIssues,
      isLoadingLogs,
      dealError,
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

