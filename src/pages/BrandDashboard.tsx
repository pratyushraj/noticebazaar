import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { getApiBaseUrl } from '@/lib/utils/api';
import { Loader2 } from 'lucide-react';
import { useSignOut } from '@/lib/hooks/useAuth';
import BrandMobileDashboard from '@/pages/BrandMobileDashboard';
import type { BrandDeal } from '@/types';

type BrandDashboardStats = {
  totalSent: number;
  needsAction: number;
  activeDeals: number;
  totalInvestment: number;
};

const BrandDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile, user, session, loading: sessionLoading } = useSession();
  const signOutMutation = useSignOut();

  const [deals, setDeals] = useState<BrandDeal[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const metadataRole =
    typeof user?.user_metadata?.role === 'string'
      ? user.user_metadata.role
      : typeof user?.user_metadata?.account_mode === 'string'
        ? user.user_metadata.account_mode
        : '';

  const isBrandUser = profile?.role === 'brand' || metadataRole === 'brand';
  const isDemoBrand = String(user?.email || '').toLowerCase() === 'brand-demo@noticebazaar.com';

  const loadBrandDashboard = useCallback(async () => {
    // Wait for session to be resolved
    if (sessionLoading) return;

    if (!isBrandUser || !session?.access_token) {
      setDeals([]);
      setRequests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const apiBase = getApiBaseUrl();
      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [dealsRes, requestsRes] = await Promise.all([
        fetch(`${apiBase}/api/brand-dashboard/deals`, { headers }),
        fetch(`${apiBase}/api/brand-dashboard/requests`, { headers }),
      ]);

      const [dealsJson, requestsJson] = await Promise.all([
        dealsRes.json().catch(() => ({})),
        requestsRes.json().catch(() => ({})),
      ]);

      if (!dealsRes.ok || !(dealsJson as any)?.success) setDeals([]);
      else setDeals((((dealsJson as any).deals as BrandDeal[]) || []) as BrandDeal[]);

      if (!requestsRes.ok || !(requestsJson as any)?.success) setRequests([]);
      else setRequests((((requestsJson as any).requests as any[]) || []) as any[]);
    } catch (err) {
      console.error('[BrandDashboard] Failed to load dashboard:', err);
      setDeals([]);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [isBrandUser, session?.access_token]);

  useEffect(() => {
    void loadBrandDashboard();
  }, [loadBrandDashboard]);

  const stats: BrandDashboardStats = useMemo(() => {
    const totalSent = (requests || []).length;
    const needsAction = (requests || []).filter((r: any) => {
      const s = String(r?.status || '').toUpperCase();
      return !s || s.includes('COUNTER') || s.includes('REVISION') || s.includes('ACTION_REQUIRED') || s === 'PENDING' || s === 'SENT' || s === 'OFFER_SENT' || s === 'SUBMITTED';
    }).length;
    const activeDeals = (deals || []).filter((d: any) => {
      const s = String(d?.status || '').toLowerCase();
      return !['completed', 'cancelled', 'declined'].includes(s);
    }).length;
    const totalInvestment = (deals || []).reduce((acc, d: any) => acc + (Number(d?.deal_amount) || 0), 0);
    return { totalSent, needsAction, activeDeals, totalInvestment };
  }, [deals, requests]);

  useEffect(() => {
    if (sessionLoading) return;
    if (profile && profile.role === 'brand' && !profile.onboarding_complete) {
      navigate('/brand-onboarding', { replace: true });
    }
  }, [profile, sessionLoading, navigate]);

  if (sessionLoading || (isLoading && requests.length === 0)) {
    return (
      <div className="min-h-[100dvh] bg-[#0D0F1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!isBrandUser) {
    return (
      <div className="min-h-[100dvh] bg-[#0D0F1A] text-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm mx-auto">
          <h2 className="text-xl font-bold mb-3">Brand account required</h2>
          <p className="text-white/60 mb-6">This section is for brand accounts only.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-500"
          >
            Go to Creator Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrandMobileDashboard
      profile={profile as any}
      requests={requests as any}
      deals={deals as any}
      stats={stats as any}
      isLoading={isLoading}
      isDemoBrand={isDemoBrand}
      onRefresh={loadBrandDashboard}
      onLogout={() => signOutMutation.mutate()}
    />
  );
};

export default BrandDashboard;

