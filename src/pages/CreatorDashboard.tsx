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
import { Zap, ChevronRight, Bell } from 'lucide-react';

async function fetchBrandDeals() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    // If no session, return empty deals instead of throwing.
    // This prevents console noise during logout/transition.
    return [];
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s — more lenient for complex deal queries
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/deals/mine`, {
      headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      if (res.status === 401) throw new Error('SESSION_EXPIRED');
      if (res.status === 504) throw new Error('API_TIMEOUT');
      throw new Error(`Failed to fetch deals: ${res.status}`);
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
  const navigate = useNavigate();
  const { user, profile, loading: isLoadingProfile } = useSession();
  const queryClient = useQueryClient();

  // If no user and not loading, we shouldn't be here (transitioning or logged out)
  if (!user?.id && !isLoadingProfile) return null;

  const isBrandSession = profile?.role === 'brand' || user?.user_metadata?.account_mode === 'brand' || user?.user_metadata?.role === 'brand';

  const collabQuery = useCollabRequests((isBrandSession || isLoadingProfile) ? undefined : user?.id);
  const { requests: collabRequests, isLoading: isLoadingCollab, error: collabError } = collabQuery;

  const dealsQuery = useQuery({
    queryKey: ['brand-deals', user?.id],
    queryFn: fetchBrandDeals,
    enabled: !!user?.id && !isBrandSession && !isLoadingProfile,
    retry: false, // Don't retry — backend may be unavailable, fail fast
    meta: { silent: true },
  });
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
  // We only "release" the dashboard once both endpoints have settled (success or error).
  const isDashboardSettled = !!user?.id && !isLoadingCollab && !isLoadingBrandDeals && !isLoadingProfile;

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

    // Listen for ANY changes to this creator's data
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
          // Use a broader invalidation to catch all variants of the collab-requests key
          queryClient.invalidateQueries({ queryKey: ['collab-requests'] });
          
          // Also refetch immediately to be sure
          collabQuery.refetch();

          // Also toast for visibility if the tab is active
          if (document.visibilityState === 'visible') {
            triggerHaptic();
            const brandName = payload.new?.brand_name || 'A brand';
            const offerId = payload.new?.id;
            
            toast.custom((t) => (
              <div 
                className="w-full max-w-[360px] bg-[#0F172A] border border-blue-500/30 rounded-[28px] p-4 shadow-[0_25px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 cursor-pointer active:scale-95 transition-transform"
                onClick={() => {
                  toast.dismiss(t);
                  if (offerId) navigate(`/dashboard?requestId=${offerId}`);
                }}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent opacity-50" />
                  <Zap className="w-6 h-6 text-blue-400 fill-blue-400/20 relative z-10" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-[14px] font-black text-white leading-tight tracking-tight uppercase italic">New Offer!</p>
                  </div>
                  <p className="text-[13px] text-white/70 font-bold truncate mt-1">
                    <span className="text-white">{brandName}</span> sent a collaboration.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <ChevronRight className="w-5 h-5 text-white/40" />
                </div>
              </div>
            ), { duration: 6000, position: 'top-center' });
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Creator dashboard is now LIVE and listening for updates');
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

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
      profileViewsToday={profileViewsToday}
      isLoadingProfile={!user?.id || isLoadingProfile}
      // Hold skeleton until both offers+deals have resolved; prevents 0-count flicker and cross-tab ghosting.
      isLoadingDealsOverride={!user?.id || !isDashboardSettled}
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
