import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getApiBaseUrl } from '@/lib/utils/api';

export type CollabRequestStatus = 'pending' | 'accepted' | 'countered' | 'declined';
export type CollabType = 'paid' | 'barter' | 'hybrid' | 'both';

export interface CollabRequest {
  id: string;
  brand_name: string;
  brand_email: string;
  brand_verified?: boolean;
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
  counter_offer?: {
    final_price?: number;
    deliverables?: string;
    notes?: string;
    countered_at?: string;
  };
}

const STALE_TIME_MS = 3 * 60 * 1000;   // 3 minutes – cache considered fresh, no refetch on remount
const REFETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes – background refetch when on page
const FAST_POLL_WINDOW_MS = 60 * 1000; // 60s burst on first dashboard view to surface new offers quickly
const FAST_POLL_INTERVAL_MS = 5 * 1000; // 5s

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

  const rows = (data.requests || []) as CollabRequest[];
  // Ensure newest offers float to top for visibility.
  return [...rows].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
}

export function useCollabRequests(creatorId: string | undefined) {
  const queryClient = useQueryClient();
  const hookStartedAtRef = useRef<number>(Date.now());

  // Realtime: surface new offers immediately.
  useEffect(() => {
    if (!creatorId) return;
    let channel: any | null = null;

    try {
      channel = supabase
        .channel(`collab-requests:${creatorId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'collab_requests',
            filter: `creator_id=eq.${creatorId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['collab-requests'] });
          },
        )
        .subscribe();
    } catch {
      channel = null;
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [creatorId, queryClient]);

  const result = useQuery({
    queryKey: ['collab-requests', creatorId],
    queryFn: fetchCollabRequests,
    enabled: !!creatorId,
    staleTime: STALE_TIME_MS,
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;
      const withinBurst = Date.now() - hookStartedAtRef.current < FAST_POLL_WINDOW_MS;
      const current = (query.state.data as CollabRequest[] | undefined) ?? [];
      // Poll faster only when the creator is likely waiting for first offers.
      const waitingForFirstOffer = current.length === 0;
      if (withinBurst && waitingForFirstOffer) return FAST_POLL_INTERVAL_MS;
      return REFETCH_INTERVAL_MS;
    },
    retry: (failureCount, error: unknown) => {
      const err = error as { message?: string };
      if (err?.message === 'Session expired' || err?.message === 'Not authenticated') return false;
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
