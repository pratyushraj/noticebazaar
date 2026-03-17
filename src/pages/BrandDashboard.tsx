import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useSupabaseQuery } from '@/lib/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { getApiBaseUrl } from '@/lib/utils/api';
import BrandMobileDashboard from './BrandMobileDashboard';

const PROD_API_BASE = 'https://noticebazaar-api.onrender.com';

const BrandDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, session } = useSession();

  const isDemoBrand = useMemo(() => {
    const email = (user?.email || '').toLowerCase();
    const params = new URLSearchParams(window.location.search);
    return email === 'brand-demo@noticebazaar.com' || ['1', 'true', 'yes'].includes((params.get('demo') || '').toLowerCase());
  }, [user?.email]);

  const initialTab = useMemo(() => {
    const path = location.pathname;
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    
    if (tabParam === 'collabs' || path.includes('/brand/collaborations') || path.includes('/brand/offers') || path.includes('/brand/deals')) return 'collabs' as const;
    if (path.includes('/brand/creators')) return 'creators' as const;
    return 'dashboard' as const;
  }, [location.pathname, location.search]);

  const isLocalApiForced = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return localStorage.getItem('useLocalApi') === 'true' || params.get('localApi') === 'true';
  }, []);

  const isLocalhostApiBase = (apiBase: string) =>
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(String(apiBase || ''));

  const fetchBrandDashboard = async (path: string) => {
    if (!session?.access_token) throw new Error('Authentication required');
    const apiBase = getApiBaseUrl() || PROD_API_BASE;

    const doFetch = async (base: string) => {
      const res = await fetch(`${base}${path}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data: any = await res.json().catch(() => ({}));
      return { res, data };
    };

    try {
      const first = await doFetch(apiBase);
      if (first.res.ok && first.data?.success) return first.data;

      // Common pitfall: frontend accidentally pointing to a local API server (or an old local build)
      // which doesn't have the newest routes. Auto-fallback to production API unless local API is forced.
      if (!isLocalApiForced && isLocalhostApiBase(apiBase) && (first.res.status === 404 || first.res.status >= 500)) {
        const second = await doFetch(PROD_API_BASE);
        if (second.res.ok && second.data?.success) return second.data;
        throw new Error(second.data?.error || 'Failed to load brand dashboard data');
      }

      throw new Error(first.data?.error || 'Failed to load brand dashboard data');
    } catch (err: any) {
      // Connection refused / server down on localhost → fallback to prod API when not forced.
      const msg = String(err?.message || err || '').toLowerCase();
      if (!isLocalApiForced && isLocalhostApiBase(getApiBaseUrl()) && (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('connection'))) {
        const second = await fetch(`${PROD_API_BASE}${path}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data: any = await second.json().catch(() => ({}));
        if (second.ok && data?.success) return data;
      }
      throw err;
    }
  };

  const {
    data: requests = [],
    isLoading: isLoadingRequests,
    refetch: refetchRequests,
  } = useSupabaseQuery(
    ['brandRequests', user?.id],
    async () => {
      if (!user?.id || !session?.access_token) return [];

      // Use backend (service-role) to avoid RLS blocking brand accounts from reading
      // collab_requests / brand_deals directly via Supabase.
      const data = await fetchBrandDashboard('/api/brand-dashboard/requests');
      return Array.isArray(data.requests) ? data.requests : [];
    },
    {
      enabled: !!user?.id && !!session?.access_token,
      refetchOnWindowFocus: true,
      refetchInterval: 15000,
      staleTime: 5000,
    }
  );

  const {
    data: deals = [],
    isLoading: isLoadingDeals,
    refetch: refetchDeals,
  } = useSupabaseQuery(
    ['brandDeals', user?.id],
    async () => {
      if (!user?.id || !session?.access_token) return [];

      const data = await fetchBrandDashboard('/api/brand-dashboard/deals');
      return Array.isArray(data.deals) ? data.deals : [];
    },
    {
      enabled: !!user?.id && !!session?.access_token,
      refetchOnWindowFocus: true,
      refetchInterval: 15000,
      staleTime: 5000,
    }
  );

  const isLoading = Boolean(isLoadingRequests || isLoadingDeals);

  const stats = useMemo(() => {
    const pendingRequests = requests.filter((r: any) => {
      const s = String(r?.status || '').toLowerCase();
      return s === 'pending' || s === 'countered';
    });
    const acceptedRequests = requests.filter((r: any) => String(r?.status || '').toLowerCase() === 'accepted');
    const activeFromDeals = deals.filter((d: any) => {
      const s = String(d?.status || '').toLowerCase();
      return !s.includes('cancel') && !s.includes('complete') && !s.includes('closed') && !s.includes('paid');
    });
    // Active = brand_deals that are active + accepted requests not already in brand_deals
    const dealCreatorIds = new Set(activeFromDeals.map((d: any) => String(d.creator_id || '')).filter(Boolean));
    const acceptedNotInDeals = acceptedRequests.filter((r: any) => !dealCreatorIds.has(String(r.creator_id || '')));
    const activeDeals = activeFromDeals.length + acceptedNotInDeals.length;

    const totalInvestment = deals.reduce((acc: number, d: any) => acc + (Number(d?.deal_amount) || 0), 0);
    const needsAction = requests.filter((r: any) => String(r?.status || '').toLowerCase() === 'countered').length;

    return { totalSent: pendingRequests.length, activeDeals, totalInvestment, needsAction };
  }, [requests, deals]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleRefresh = async () => {
    await Promise.all([refetchRequests(), refetchDeals()]);
  };

  return (
    <BrandMobileDashboard
      profile={profile}
      requests={requests}
      deals={deals}
      stats={stats}
      initialTab={initialTab}
      isLoading={isLoading}
      isDemoBrand={isDemoBrand}
      onRefresh={handleRefresh}
      onLogout={handleLogout}
    />
  );
};

export default BrandDashboard;
