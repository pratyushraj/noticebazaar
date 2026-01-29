import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getApiBaseUrl } from '@/lib/utils/api';

export type CollabRequestStatus = 'pending' | 'accepted' | 'countered' | 'declined';
export type CollabType = 'paid' | 'barter' | 'both';

export interface CollabRequest {
  id: string;
  brand_name: string;
  brand_email: string;
  collab_type: CollabType;
  budget_range: string | null;
  exact_budget: number | null;
  barter_description: string | null;
  barter_value: number | null;
  barter_product_image_url?: string | null;
  campaign_description: string;
  deliverables: string | string[];
  usage_rights: boolean;
  deadline: string | null;
  status: CollabRequestStatus;
  created_at: string;
  updated_at?: string;
  creator_id: string;
}

const STALE_TIME_MS = 3 * 60 * 1000;   // 3 minutes – cache considered fresh, no refetch on remount
const REFETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes – background refetch when on page

async function fetchCollabRequests(): Promise<CollabRequest[]> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/collab-requests`, {
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    throw new Error('Session expired');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to load collaboration requests');
  }

  return data.requests || [];
}

export function useCollabRequests(creatorId: string | undefined) {
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: ['collab-requests', creatorId],
    queryFn: fetchCollabRequests,
    enabled: !!creatorId,
    staleTime: STALE_TIME_MS,
    refetchInterval: REFETCH_INTERVAL_MS,
    retry: (failureCount, error: any) => {
      if (error?.message === 'Session expired' || error?.message === 'Not authenticated') return false;
      return failureCount < 2;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['collab-requests'] });
  };

  return {
    ...result,
    requests: result.data ?? [],
    invalidate,
  };
}
