"use client";

import MobileDashboardDemo from '@/pages/MobileDashboardDemo';
import { useSession } from '@/contexts/SessionContext';
import { useCollabRequests } from '@/lib/hooks/useCollabRequests';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/lib/utils/api';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

async function fetchBrandDeals() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    const err: any = new Error('NOT_AUTHENTICATED');
    err.status = 401;
    throw err;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s — fail fast if backend is down
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/deals/mine`, {
      headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.status === 404) return [];
    if (res.status === 401) {
      const err: any = new Error('SESSION_EXPIRED');
      err.status = 401;
      throw err;
    }
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload?.error || `Failed to fetch deals (${res.status})`);
    }
    const data = await res.json().catch(() => ({}));
    return data?.deals || [];
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const e: any = new Error('API_TIMEOUT');
      e.status = 0;
      throw e;
    }
    throw err;
  }
}

const CreatorDashboard = () => {
  const { user, profile, loading: isLoadingProfile } = useSession();
  const queryClient = useQueryClient();

  const collabQuery = useCollabRequests(user?.id);
  const { requests: collabRequests, isLoading: isLoadingCollab, error: collabError } = collabQuery;

  const dealsQuery = useQuery({
    queryKey: ['brand-deals', user?.id],
    queryFn: fetchBrandDeals,
    enabled: !!user?.id,
    retry: false, // Don't retry — backend may be unavailable, fail fast
  });
  const brandDeals = (dealsQuery.data ?? []) as any[];
  const isLoadingBrandDeals = dealsQuery.isLoading;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['collab-requests'] });
    queryClient.invalidateQueries({ queryKey: ['brand-deals'] });
  };

  const handleAcceptRequest = async (req: any) => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new Error('Not authenticated');

    const res = await fetch(`${getApiBaseUrl()}/api/collab-requests/${req.id}/accept`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    });
    const data = await res.json();
    // Always invalidate so list refreshes even on "already processed" errors
    queryClient.invalidateQueries({ queryKey: ['collab-requests'] });
    queryClient.invalidateQueries({ queryKey: ['brand-deals'] });
    if (!res.ok || !data.success) {
      const msg = data?.error || '';
      if (msg.includes('already been processed') || msg.includes('already accepted') || msg.includes('already declined')) {
        toast.info('This offer was already processed.');
        return;
      }
      throw new Error(data.error || 'Failed to accept');
    }
  };

  const handleDeclineRequest = async (req: any) => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new Error('Not authenticated');
    const requestId = typeof req === 'string' ? req : req?.id;
    if (!requestId) { throw new Error('Request ID missing'); }
    const res = await fetch(`${getApiBaseUrl()}/api/collab-requests/${requestId}/decline`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    });
    const data = await res.json();
    // Always invalidate so list refreshes even on "already processed" errors
    queryClient.invalidateQueries({ queryKey: ['collab-requests'] });
    if (!res.ok || !data.success) {
      const msg = data?.error || '';
      if (msg.includes('already been processed') || msg.includes('already declined') || msg.includes('already accepted')) {
        toast.info('This offer was already processed.');
      } else {
        throw new Error(data.error || 'Failed to decline');
      }
      return;
    }
    toast.success('Offer declined');
  };

  return (
    <MobileDashboardDemo
      profile={profile}
      collabRequests={collabRequests}
      brandDeals={brandDeals}
      isLoadingProfile={!user?.id || isLoadingProfile}
      isLoadingDealsOverride={!user?.id || isLoadingCollab || isLoadingBrandDeals}
      offersError={
        collabError
          ? ((collabError as any)?.message === 'API_TIMEOUT'
            ? 'Offers could not load (timeout). Please retry.'
            : (collabError as any)?.message === 'Session expired'
              ? 'Session expired. Please sign in again.'
              : 'Offers could not load. Please retry.')
          : undefined
      }
      dealsError={
        dealsQuery.error
          ? ((dealsQuery.error as any)?.message === 'API_TIMEOUT'
            ? 'Deals could not load (timeout). Please retry.'
            : (dealsQuery.error as any)?.message === 'SESSION_EXPIRED'
              ? 'Session expired. Please sign in again.'
              : 'Deals could not load. Please retry.')
          : undefined
      }
      onAcceptRequest={handleAcceptRequest}
      onDeclineRequest={handleDeclineRequest}
      onRefresh={handleRefresh}
    />
  );
};

export default CreatorDashboard;
