import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useSupabaseQuery } from '@/lib/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { getApiBaseUrl } from '@/lib/utils/api';
import BrandMobileDashboard from './BrandMobileDashboard';

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
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/brand-dashboard/requests`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to load brand requests');
      return Array.isArray(data.requests) ? data.requests : [];
    },
    { enabled: !!user?.id && !!session?.access_token }
  );

  const {
    data: deals = [],
    isLoading: isLoadingDeals,
    refetch: refetchDeals,
  } = useSupabaseQuery(
    ['brandDeals', user?.id],
    async () => {
      if (!user?.id || !session?.access_token) return [];

      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/brand-dashboard/deals`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to load brand deals');
      return Array.isArray(data.deals) ? data.deals : [];
    },
    { enabled: !!user?.id && !!session?.access_token }
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
