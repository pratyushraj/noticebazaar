import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchWithTimeout, getErrorMessage } from '@/lib/utils/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://noticebazaar-api.onrender.com';

export interface Influencer {
  id: string;
  creator_name: string;
  instagram_handle: string;
  followers: number;
  niche: string | null;
  email: string | null;
  website: string | null;
  manager_email: string | null;
  fit_score: number | null;
  profile_link: string;
  bio: string | null;
  link_in_bio: string | null;
  location: string | null;
  status: 'new' | 'contacted' | 'replied' | 'not_interested' | 'converted';
  source: 'apify' | 'phantombuster' | 'google' | 'manual';
  is_active: boolean;
  is_india_based: boolean;
  is_relevant_niche: boolean;
  contacted_at: string | null;
  last_dm_sent_at: string | null;
  follow_up_due_at: string | null;
  response_status: string | null;
  created_at: string;
  updated_at: string;
  last_checked_at: string;
}

export interface InfluencerFilters {
  minFitScore?: number;
  status?: 'new' | 'contacted' | 'replied' | 'not_interested' | 'converted';
  niche?: string;
  limit?: number;
  page?: number;
}

export interface DiscoveryScanParams {
  hashtags?: string[];
  keywords?: string[];
  minFollowers?: number;
  maxFollowers?: number;
  limit?: number;
  source?: 'apify' | 'phantombuster' | 'google' | 'manual';
}

export interface DiscoveryScanResult {
  success: boolean;
  influencersFound: number;
  influencersSaved: number;
  errors: string[];
  timestamp: string;
  duration_ms: number;
}

/**
 * Get influencers from database
 */
export const useInfluencers = (filters?: InfluencerFilters) => {
  return useQuery({
    queryKey: ['influencers', filters],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const params = new URLSearchParams();
      if (filters?.minFitScore) params.append('minFitScore', filters.minFitScore.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.niche) params.append('niche', filters.niche);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.page) params.append('page', filters.page.toString());

      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/influencers/list?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch influencers' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    enabled: !!supabase.auth.getSession(),
  });
};

/**
 * Trigger influencer discovery scan
 */
export const useRunDiscoveryScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: DiscoveryScanParams) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/influencers/run-daily-scan`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params || {}),
        },
        600000 // 10 minute timeout for discovery scans (50 profiles × ~5s each = ~4-5 minutes)
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to run discovery scan' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json() as Promise<{ success: boolean; message: string; result: DiscoveryScanResult }>;
    },
    onSuccess: () => {
      // Invalidate influencers query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['influencers'] });
    },
  });
};

/**
 * Update influencer status
 */
export const useUpdateInfluencerStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Influencer['status'] }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      // Update directly in Supabase
      const { error } = await supabase
        .from('influencers')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'contacted' && { contacted_at: new Date().toISOString() }),
        })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['influencers'] });
    },
  });
};

/**
 * Get influencer statistics
 */
export const useInfluencerStats = () => {
  return useQuery({
    queryKey: ['influencer-stats'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      // Get stats from Supabase
      const [totalResult, newResult, contactedResult, convertedResult] = await Promise.all([
        supabase.from('influencers').select('id', { count: 'exact', head: true }),
        supabase.from('influencers').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('influencers').select('id', { count: 'exact', head: true }).eq('status', 'contacted'),
        supabase.from('influencers').select('id', { count: 'exact', head: true }).eq('status', 'converted'),
      ]);

      return {
        total: totalResult.count || 0,
        new: newResult.count || 0,
        contacted: contactedResult.count || 0,
        converted: convertedResult.count || 0,
      };
    },
    enabled: !!supabase.auth.getSession(),
  });
};

