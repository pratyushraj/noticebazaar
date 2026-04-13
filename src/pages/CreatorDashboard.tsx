"use client";

import MobileDashboardDemo from '@/pages/MobileDashboardDemo';
import { useSession } from '@/contexts/SessionContext';
import { useCollabRequests } from '@/lib/hooks/useCollabRequests';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/lib/utils/api';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

async function fetchBrandDeals() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return [];

  // Backend exposes creator deals at GET /api/deals/mine (not /api/deals).
  const res = await fetch(`${getApiBaseUrl()}/api/deals/mine`, {
    headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
  });
  if (res.status === 404) return [];
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || `Failed to fetch deals (${res.status})`);
  }
  const data = await res.json().catch(() => ({}));
  return data?.deals || [];
}

const CreatorDashboard = () => {
  const { user, profile: sessionProfile } = useSession();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user?.id,
    initialData: sessionProfile,
  });

  const { requests: collabRequests } = useCollabRequests(user?.id);

  const { data: brandDeals = [] } = useQuery({
    queryKey: ['brand-deals', user?.id],
    queryFn: fetchBrandDeals,
    enabled: !!user?.id,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['collab-requests'] });
    queryClient.invalidateQueries({ queryKey: ['brand-deals'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
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
      onAcceptRequest={handleAcceptRequest}
      onDeclineRequest={handleDeclineRequest}
      onRefresh={handleRefresh}
    />
  );
};

export default CreatorDashboard;
