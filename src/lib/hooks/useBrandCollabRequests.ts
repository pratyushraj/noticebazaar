import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getApiBaseUrl } from '@/lib/utils/api';

export type BrandCollabRequestStatus = 'pending' | 'accepted' | 'countered' | 'declined';

export interface BrandCounterOffer {
  final_price?: number;
  deliverables?: string;
  notes?: string;
  countered_at?: string;
}

export interface BrandCollabRequest {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_username?: string;
  creator_instagram?: string;
  creator_avatar?: string;
  brand_name: string;
  brand_email: string;
  collab_type: 'paid' | 'barter' | 'hybrid' | 'both';
  budget_range?: string;
  exact_budget?: number;
  barter_description?: string;
  barter_value?: number;
  deliverables?: string | string[];
  deadline?: string;
  status: BrandCollabRequestStatus;
  counter_offer?: BrandCounterOffer | null;
  deal_id?: string;
  created_at: string;
  updated_at?: string;
  accepted_at?: string;
  countered_at?: string;
}

const STALE_TIME_MS = 2 * 60 * 1000;   // 2 minutes
const REFETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes background refetch

async function fetchBrandCollabRequests(): Promise<BrandCollabRequest[]> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/brand/collab-requests`, {
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
    throw new Error(data.error || 'Failed to load offers');
  }

  return data.requests || [];
}

export function useBrandCollabRequests() {
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: ['brand-collab-requests'],
    queryFn: fetchBrandCollabRequests,
    staleTime: STALE_TIME_MS,
    refetchInterval: REFETCH_INTERVAL_MS,
    retry: (failureCount, error: unknown) => {
      const err = error as { message?: string };
      if (err?.message === 'Session expired' || err?.message === 'Not authenticated') return false;
      return failureCount < 2;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['brand-collab-requests'] });
  };

  return {
    ...result,
    requests: result.data ?? [],
    invalidate,
  };
}

// Action helpers
export async function acceptCounterOffer(requestId: string): Promise<{ success: boolean; deal_id?: string; error?: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return { success: false, error: 'Not authenticated' };

  const response = await fetch(`${getApiBaseUrl()}/api/brand/collab-requests/${requestId}/accept-counter`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!data.success) return { success: false, error: data.error };
  return { success: true, deal_id: data.deal?.id };
}

export async function declineCounterOffer(requestId: string): Promise<{ success: boolean; error?: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return { success: false, error: 'Not authenticated' };

  const response = await fetch(`${getApiBaseUrl()}/api/brand/collab-requests/${requestId}/decline-counter`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!data.success) return { success: false, error: data.error };
  return { success: true };
}
