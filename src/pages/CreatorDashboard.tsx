import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileDashboardDemo from '@/pages/MobileDashboardDemo';
import { useSession } from '@/contexts/SessionContext';
import { useCollabRequests } from '@/lib/hooks/useCollabRequests';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/lib/utils/api';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/utils/haptics';
import { useMutation } from '@tanstack/react-query';

async function fetchBrandDeals() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return [];
  }

  // Offline Detection
  if (!navigator.onLine) {
    const error = new Error('No internet connection');
    (error as any).status = 'OFFLINE';
    throw error;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/deals/mine`, {
      headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error(`[Deals] API Error: ${res.status} ${res.statusText}`);
      if (res.status === 401) throw new Error('SESSION_EXPIRED');
      if (res.status === 504) throw new Error('API_TIMEOUT');
      throw new Error(`Failed to fetch deals: ${res.status}`);
    }

    const data = await res.json().catch(() => ({}));
    return data?.deals || [];
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('[Deals] Fetch Exception:', err);

    if (err.name === 'AbortError') {
      const e: any = new Error('API_TIMEOUT');
      e.status = 0;
      throw e;
    }
    throw err;
  }
}

const CreatorDashboardContent = ({ navigate }: { navigate: any }) => {
  const { user, profile, loading: isLoadingProfile, signOut } = useSession();
  const queryClient = useQueryClient();

  const signOutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      navigate('/login', { replace: true });
    }
  });

  const isBrandSession = profile?.role === 'brand' || user?.user_metadata?.account_mode === 'brand' || user?.user_metadata?.role === 'brand';

  const collabQuery = useCollabRequests((isBrandSession || isLoadingProfile || !user?.id) ? undefined : user?.id);
  const { requests: collabRequests, isLoading: isLoadingCollab, error: collabError } = collabQuery;

  const dealsQuery = useQuery({
    queryKey: ['brand-deals', user?.id],
    queryFn: fetchBrandDeals,
    enabled: !!user?.id && !isBrandSession && !isLoadingProfile,
    retry: false, // Don't retry — backend may be unavailable, fail fast
    meta: { silent: true },
  });

  // Early return if no user and not loading (transitioning or logged out)
  // Hooks MUST be called before this.
  if (!user?.id && !isLoadingProfile) return null;

  const brandDeals = (dealsQuery.data ?? []) as any[];
  const isLoadingBrandDeals = dealsQuery.isLoading;

  // Real-time Profile Views tracking (from collab_link_events)
  // REMOVED for performance — we no longer show visitor counts on home
  /*
  const viewsQuery = useQuery({
    queryKey: ['profile-views-today', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from('collab_link_events')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('event_type', 'view')
        .gte('created_at', today.toISOString());
        
      if (error) {
        console.error('Error fetching profile views:', error);
        return 0;
      }
      return count || 0;
    },
    enabled: !!user?.id && !isBrandSession && !isLoadingProfile,
    refetchInterval: 60000, // Refresh every minute
    meta: { silent: true },
  });
  const profileViewsToday = viewsQuery.data ?? 0;
  */
  const profileViewsToday = 0;

  // Production safety: avoid partial render flicker on first load.
  // We settled once the identity is known. Individual data fetches will show their own skeletons.
  const isDashboardSettled = !!user?.id && !isLoadingProfile;

  // Onboarding enforcement: Ensure creators complete onboarding before accessing the full dashboard
  useEffect(() => {
    if (isLoadingProfile || !profile) return;
    
    // Only enforce for creator role
    if (profile.role === 'creator' && !profile.onboarding_complete) {
      console.log('[CreatorDashboard] Redirecting to onboarding (incomplete profile)');
      navigate('/creator-onboarding', { replace: true });
    }
  }, [profile, isLoadingProfile, navigate]);

  // Realtime: Listen for new offers or deal updates to avoid manual refreshes
  useEffect(() => {
    if (!user?.id) return;

    let retryCount = 0;
    const MAX_RETRIES = 3;

    const setupSubscription = () => {
      const channel = supabase
        .channel(`dashboard-realtime:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'collab_requests',
            filter: `creator_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[Realtime] Collab request update received:', payload);
            queryClient.invalidateQueries({ queryKey: ['collab-requests'] });
            collabQuery.refetch();

            if (payload.eventType === 'INSERT' && document.visibilityState === 'visible') {
              triggerHaptic();
              toast.success('🔥 New offer received!', {
                description: 'A brand just sent you a new collaboration request.',
                duration: 5000,
              });
            }

            if (
              payload.eventType === 'UPDATE' && 
              payload.new.status === 'declined' && 
              payload.new.decline_reason === 'withdrawn_by_brand' &&
              payload.old?.status !== 'declined' &&
              document.visibilityState === 'visible'
            ) {
              triggerHaptic();
              toast.info('Offer Withdrawn', {
                description: `A brand has withdrawn their collaboration request.`,
                duration: 5000,
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'brand_deals',
            filter: `creator_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[Realtime] Brand deal update received:', payload);
            queryClient.invalidateQueries({ queryKey: ['brand-deals'] });
            dealsQuery.refetch();
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Realtime] Creator dashboard is now LIVE');
            retryCount = 0;
          }
          if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            console.error('[Realtime] Subscription error/closed:', err || status);
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              console.log(`[Realtime] Retrying subscription (${retryCount}/${MAX_RETRIES})...`);
              setTimeout(setupSubscription, 5000 * retryCount);
            }
          }
        });

      return channel;
    };

    const channel = setupSubscription();

    return () => {
      console.log('[Realtime] Cleaning up dashboard subscription');
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const handleAcceptRequest = async (req: any, addressData?: { address: string; pincode: string }, otpVerified?: boolean, otpVerifiedAt?: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new Error('Not authenticated');

    const res = await fetch(`${getApiBaseUrl()}/api/collab-requests/${req.id}/accept`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({
        shipping_address: addressData?.address,
        pincode: addressData?.pincode,
        otp_verified: otpVerified,
        otp_verified_at: otpVerifiedAt,
      }),
    });
    const data = await res.json();
    queryClient.invalidateQueries({ queryKey: ['collab-requests'] });
    queryClient.invalidateQueries({ queryKey: ['brand-deals'] });
    if (!res.ok || !data.success) {
      const msg = data?.error || '';
      if (msg.includes('already been processed') || msg.includes('already accepted') || msg.includes('already declined')) {
        toast.info('This offer was already processed.');
        return data;
      }
      throw new Error(data.error || 'Failed to accept');
    }
    return data;
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

  const handleRefresh = async () => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['collab-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['brand-deals'] }),
        collabQuery.refetch(),
        dealsQuery.refetch()
      ]);
      toast.success('Dashboard updated');
    } catch (err) {
      console.error('[Dashboard] Refresh failed:', err);
      toast.error('Failed to refresh data. Please check your connection.');
    }
  };

  const parseErrorMessage = (err: any, type: 'Offers' | 'Deals') => {
    if (!err) return undefined;
    const msg = String(err?.message || err || '').toUpperCase();
    if (msg.includes('OFFLINE') || msg.includes('NETWORK') || !navigator.onLine) {
      return `${type} could not load. Check your internet and retry.`;
    }
    if (msg.includes('TIMEOUT')) {
      return `${type} request timed out. Please retry.`;
    }
    if (msg.includes('SESSION_EXPIRED') || msg.includes('401')) {
      return 'Session expired. Please sign in again.';
    }
    return `${type} could not load (Server Error). Please retry.`;
  };

  return (
    <MobileDashboardDemo
      profile={profile}
      collabRequests={collabRequests}
      brandDeals={brandDeals}
      profileViewsToday={profileViewsToday}
      isLoadingProfile={isLoadingProfile}
      isLoadingDealsOverride={isLoadingBrandDeals}
      isLoadingCollab={isLoadingCollab}
      offersError={parseErrorMessage(collabError, 'Offers')}
      dealsError={parseErrorMessage(dealsQuery.error, 'Deals')}
      onAcceptRequest={handleAcceptRequest}
      onDeclineRequest={handleDeclineRequest}
      onRefresh={handleRefresh}
      onLogout={() => signOutMutation.mutate()}
    />
  );
};

// Wrapper component to handle Router context properly with lazy loading
const CreatorDashboard = () => {
  const navigate = useNavigate();
  const { loading: isLoadingProfile } = useSession();
  
  // Return null during initial load to ensure Router context is ready
  if (isLoadingProfile) return null;
  
  return <CreatorDashboardContent navigate={navigate} />;
};

export default CreatorDashboard;
