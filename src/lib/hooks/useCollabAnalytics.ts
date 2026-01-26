import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { getCollabLinkUsername } from '@/lib/utils/collabLink';

export interface CollabAnalyticsData {
  period: number;
  views: {
    total: number;
    unique: number;
    trend: number;
    trendDirection: 'up' | 'down';
  };
  submissions: {
    total: number;
    trend: number;
    trendDirection: 'up' | 'down';
  };
  conversionRate: {
    value: number;
    trend: number;
    trendDirection: 'up' | 'down' | 'neutral';
  };
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
    unknown: number;
  };
}

interface CollabAnalyticsResponse {
  success: boolean;
  analytics?: CollabAnalyticsData;
  error?: string;
}

export const useCollabAnalytics = (period: '7' | '30' = '30') => {
  const { profile } = useSession();
  const username = getCollabLinkUsername(profile);

  return useQuery<CollabAnalyticsData | null, Error>({
    queryKey: ['collabAnalytics', period, username],
    queryFn: async () => {
      if (!username) {
        return null;
      }

      // Get current session (Supabase auto-refreshes tokens)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error('No active session');
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      try {
        const response = await fetch(
          `${apiUrl}/api/collab-analytics?days=${period}`,
          {
            headers: {
              'Authorization': `Bearer ${sessionData.session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized - please log in again');
          } else if (response.status === 404) {
            // Analytics endpoint not available yet - return null instead of error
            return null;
          } else {
            throw new Error(`Failed to fetch analytics: ${response.statusText}`);
          }
        }

        const data: CollabAnalyticsResponse = await response.json();
        
        if (data.success && data.analytics) {
          return data.analytics;
        }
        
        return null;
      } catch (error: any) {
        // Handle network errors gracefully
        if (error.message?.includes('Failed to fetch')) {
          // Server may not be running - return null instead of error
          if (import.meta.env.DEV) {
            console.warn('[useCollabAnalytics] Server not available');
          }
          return null;
        }
        throw error;
      }
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount, error) => {
      // Don't retry on 404 or network errors (server might be down)
      if (error.message?.includes('404') || error.message?.includes('Failed to fetch')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

