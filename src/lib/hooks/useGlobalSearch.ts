/**
 * useGlobalSearch Hook
 * 
 * Unified search hook that searches across all data types
 */

import { useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from './useBrandDeals';
import { useNotifications } from './useNotifications';
import { globalSearch, SearchResult } from '@/lib/services/searchService';
import { getSearchHistory, addToSearchHistory } from '@/lib/utils/searchHistory';

interface UseGlobalSearchOptions {
  query: string;
  enabled?: boolean;
  limit?: number;
}

export function useGlobalSearch(options: UseGlobalSearchOptions) {
  const { query, enabled = true, limit = 20 } = options;
  const { profile } = useSession();

  // Fetch all data sources
  const { data: brandDeals = [] } = useBrandDeals({
    creatorId: profile?.id,
    enabled: enabled && !!profile?.id,
  });

  const { notifications = [] } = useNotifications({
    enabled: enabled && !!profile?.id,
    limit: 50,
  });

  // TODO: Add documents/contracts hook when available
  // For now, we'll search deals and notifications only
  // replaced-by-ultra-polish: replaced any[] with proper type
  const documents: Array<{ id: string; name: string; type: string }> = [];

  // Perform search
  const results = useMemo(() => {
    if (!query.trim() || !enabled) return [];

    const searchResults = globalSearch({
      deals: brandDeals,
      documents,
      notifications,
      query,
      limit,
    });

    // Save to search history
    if (searchResults.length > 0 && profile?.id) {
      addToSearchHistory(query, profile.id, searchResults.length);
    }

    return searchResults;
  }, [query, brandDeals, documents, notifications, enabled, limit, profile?.id]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const grouped: Record<string, SearchResult[]> = {
      deal: [],
      payment: [],
      contract: [],
      notification: [],
      message: [],
      tax: [],
    };

    for (const result of results) {
      if (grouped[result.type]) {
        grouped[result.type].push(result);
      }
    }

    return grouped;
  }, [results]);

  // Get search history
  const searchHistory = useMemo(() => {
    return getSearchHistory(profile?.id);
  }, [profile?.id]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: results.length,
      byType: {
        deals: groupedResults.deal.length,
        payments: groupedResults.payment.length,
        contracts: groupedResults.contract.length,
        notifications: groupedResults.notification.length,
        messages: groupedResults.message.length,
        tax: groupedResults.tax.length,
      },
    };
  }, [results, groupedResults]);

  return {
    results,
    groupedResults,
    stats,
    searchHistory,
    isLoading: false, // Could be enhanced with loading states from individual hooks
  };
}

