"use client";

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {  } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSignOut } from '@/lib/hooks/useAuth';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals, getDealStageFromStatus, STAGE_TO_PROGRESS } from '@/lib/hooks/useBrandDeals';
import { usePartnerStats } from '@/lib/hooks/usePartnerProgram';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/utils/logger';
import { isCreatorPro } from '@/lib/subscription';
import { getInitials } from '@/lib/utils/avatar';
import { motion } from 'framer-motion';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { trackEvent } from '@/lib/utils/analytics';
import { cn } from '@/lib/utils';
import { getApiBaseUrl, fetchWithTimeout } from '@/lib/utils/api';
import { withRetry } from '@/lib/utils/retry';
import { getCollabReadiness } from '@/lib/collab/readiness';
import { sectionLayout, animations, spacing, typography, separators, iconSizes, scroll, sectionHeader, gradients, buttons, shadows, radius, zIndex, vision, motion as motionTokens } from '@/lib/design-system';
import { BaseCard, SectionCard, StatCard } from '@/components/ui/card-variants';
import { DashboardSkeleton as EnhancedDashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { QuickSearch } from '@/components/dashboard/QuickSearch';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useDealAlertNotifications } from '@/hooks/useDealAlertNotifications';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Types for collab request preview
interface CollabRequestPreview {
  id: string;
  brand_name: string;
  brand_email?: string;
  collab_type?: string;
  budget_range?: string | null;
  exact_budget?: number | null;
  barter_value?: number | null;
  deadline?: string | null;
  brand_logo?: string | null;
  created_at: string;
  raw: Record<string, unknown>;
}

interface CollabRequestsResponse {
  success?: boolean;
  requests?: CollabRequestData[];
}

interface CollabRequestData {
  id: string;
  brand_name?: string;
  brand_email?: string;
  collab_type?: string;
  budget_range?: string | null;
  exact_budget?: number | null;
  barter_value?: number | null;
  deadline?: string | null;
  brand_logo?: string | null;
  brand_logo_url?: string | null;
  created_at?: string;
  status?: string;
  raw?: { brand_logo?: string; brand_logo_url?: string };
  brand?: { logo_url?: string };
}

// NEW: Premium Dashboard Components
import {
  calculateDashboardStats,
  calculateTrends,
  generateRevenueChartData,
  extractUrgentActions,
  generateRecentActivity,
  getDefaultQuickActions
} from '@/lib/utils/dashboardHelpers';

import MobileDashboardDemo from './MobileDashboardDemo';

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const signOutMutation = useSignOut();
  const { profile, user, loading: sessionLoading, session, isAuthInitializing } = useSession();
  const [activeTab, setActiveTab] = useState('home');
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [timeframe, setTimeframe] = useState<'month' | 'lastMonth' | 'allTime'>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [pendingCollabRequestsCount, setPendingCollabRequestsCount] = useState(0);
  const [collabRequestsPreview, setCollabRequestsPreview] = useState<CollabRequestPreview[]>([]);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [declineRequestId, setDeclineRequestId] = useState<string | null>(null);
  const [showDeclineRequestDialog, setShowDeclineRequestDialog] = useState(false);
  const [showIosInstallGuide, setShowIosInstallGuide] = useState(false);
  const [collabLinkCopied, setCollabLinkCopied] = useState(false);
  const [collabRequestsLoading, setCollabRequestsLoading] = useState(true);
  const {
    isSupported: isDealAlertSupported,
    permission: dealAlertPermission,
    isSubscribed: isDealAlertSubscribed,
    isBusy: isDealAlertBusy,
    promptDismissed: isDealAlertPromptDismissed,
    isIOSNeedsInstall,
    hasVapidKey,
    enableNotifications,
    dismissPrompt: dismissDealAlertPrompt,
  } = useDealAlertNotifications();

  const [isTestingPush, setIsTestingPush] = useState(false);

  const fetchPendingCollabRequestsPreview = async (signal?: AbortSignal, options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sess = sessionData.session;
      if (!sess?.access_token) return;
      const apiUrl = getApiBaseUrl();
      const res = await withRetry(() => fetch(`${apiUrl}/api/collab-requests`, {
        headers: { 'Authorization': `Bearer ${sess.access_token}`, 'Content-Type': 'application/json' },
        signal: signal ?? undefined,
      }));
      let data: CollabRequestsResponse;
      if (res.ok) {
        data = await res.json().catch(() => ({ success: false, requests: [] }));
      } else {
        data = { success: false, requests: [] };
      }
      const list = Array.isArray(data?.requests) ? data.requests : [];
      const pending = list.filter((r: CollabRequestData) => {
        const s = (r.status || '').toLowerCase();
        return s === 'pending' || s === 'countered';
      });
      setPendingCollabRequestsCount(pending.length);
      setCollabRequestsPreview(
        pending.slice(0, 10).map((r: CollabRequestData) => ({
          id: r.id,
          brand_name: r.brand_name || 'Brand',
          brand_email: r.brand_email || undefined,
          collab_type: r.collab_type,
          budget_range: r.budget_range ?? null,
          exact_budget: r.exact_budget ?? null,
          barter_value: r.barter_value ?? null,
          deadline: r.deadline ?? null,
          brand_logo: r.brand_logo || r.brand_logo_url || r.raw?.brand_logo || r.raw?.brand_logo_url || (r as { brand?: { logo_url?: string } }).brand?.logo_url,
          created_at: r.created_at || '',
          raw: r,
        }))
      );
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      setPendingCollabRequestsCount(0);
      setCollabRequestsPreview([]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    setCollabRequestsLoading(true);
    (async () => {
      try {
        if (cancelled) return;
        await fetchPendingCollabRequestsPreview(controller.signal);
      } finally {
        clearTimeout(timeoutId);
        setCollabRequestsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchPendingCollabRequestsPreview(undefined, { silent: true });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [session?.user?.id]);

  const authenticatedUserId = session?.user?.id;
  const creatorId = profile?.id || authenticatedUserId;

  useEffect(() => {
    const checkProStatus = async () => {
      if (user?.id) {
        const proStatus = await isCreatorPro(user.id);
        setIsPro(proStatus);
      }
    };
    checkProStatus();
  }, [user?.id]);

  const { data: rawBrandDeals = [], isLoading: isLoadingDeals, error: brandDealsError, refetch: refetchBrandDeals } = useBrandDeals({
    creatorId: creatorId,
    enabled: !sessionLoading && !!creatorId,
  });

  const brandDeals = useMemo(() => {
    return rawBrandDeals;
  }, [rawBrandDeals]);

  const { data: partnerStats } = usePartnerStats(profile?.id);

  const isInitialLoading = (sessionLoading && !session) || (isLoadingDeals && !!creatorId && !brandDealsError);

  // Defense-in-depth gate: never allow creator dashboard before onboarding completion.
  useEffect(() => {
    if (!profile) return;
    const isCreatorLikeRole = !profile.role || profile.role === 'creator' || profile.role === 'client';
    if (isCreatorLikeRole && profile.onboarding_complete === false) {
      navigate('/creator-onboarding', { replace: true });
    }
  }, [profile, navigate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    triggerHaptic(HapticPatterns.medium);
    await Promise.all([
      new Promise(resolve => setTimeout(resolve, 500)),
      fetchPendingCollabRequestsPreview(undefined, { silent: true }),
    ]);
    setIsRefreshing(false);
    triggerHaptic(HapticPatterns.light);
  };

  const acceptCollabRequest = async (req: CollabRequestPreview) => {
    if (!req?.id) return;
    try {
      setAcceptingRequestId(req.id);
      const { data: sessionData } = await supabase.auth.getSession();
      const sess = sessionData.session;
      if (!sess?.access_token) {
        toast.error('Please log in to accept requests');
        return;
      }
      const res = await fetch(`${getApiBaseUrl()}/api/collab-requests/${req.id}/accept`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${sess.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        trackEvent('creator_accepted_request', {
          deal_id: data.deal?.id,
          creator_id: profile?.id,
          collab_type: req.collab_type || 'paid',
        });
        toast.success(
          data.needs_delivery_details
            ? 'Deal accepted — add delivery details to proceed'
            : (data.contract ? 'Deal accepted — contract ready' : 'Deal accepted!')
        );

        await Promise.all([
          fetchPendingCollabRequestsPreview(),
          refetchBrandDeals?.(),
        ]);

        // Keep creators inside the new mobile dashboard UI instead of bouncing to legacy pages.
        navigate('/creator-dashboard?tab=collabs', { replace: true });
      } else {
        toast.error(data.error || 'Failed to accept request');
      }
    } catch {
      toast.error('Failed to accept request');
    } finally {
      setAcceptingRequestId(null);
    }
  };

  const declineCollabRequest = async () => {
    if (!declineRequestId) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sess = sessionData.session;
      if (!sess?.access_token) {
        toast.error('Please log in to decline requests');
        return;
      }
      const res = await fetch(`${getApiBaseUrl()}/api/collab-requests/${declineRequestId}/decline`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${sess.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        trackEvent('creator_declined_request', { request_id: declineRequestId, creator_id: profile?.id });
        toast.success('Request declined');
        await fetchPendingCollabRequestsPreview();
      } else {
        toast.error(data.error || 'Failed to decline request');
      }
    } catch {
      toast.error('Failed to decline request');
    } finally {
      setShowDeclineRequestDialog(false);
      setDeclineRequestId(null);
    }
  };

  const userData = useMemo(() => {
    const isGeneratedCreatorHandle = (value?: string | null) => Boolean(value && /^creator-[a-z0-9]{6,}$/i.test(value.trim()));
    const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
    const cleanInstagramHandle = (profile?.instagram_handle || '').replace('@', '').trim();
    const cleanUsername = (profile?.username || '').replace('@', '').trim();
    const preferredHandle = cleanInstagramHandle && !isGeneratedCreatorHandle(cleanInstagramHandle)
      ? cleanInstagramHandle
      : (cleanUsername && !isGeneratedCreatorHandle(cleanUsername) ? cleanUsername : '');
    const displayName = fullName ||
      preferredHandle ||
      user?.email?.split('@')[0] ||
      'Creator';

    return {
      name: fullName || 'Creator',
      displayName: displayName,
      userType: "Content Creator",
      avatar: getInitials(profile?.first_name || null, profile?.last_name || null)
    };
  }, [profile, user]);

  const calculatedStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const getDealsByTimeframe = (tf: 'month' | 'lastMonth' | 'allTime') => {
      if (tf === 'allTime') return brandDeals;
      const targetMonth = tf === 'month' ? currentMonth : lastMonth;
      const targetYear = tf === 'month' ? currentYear : lastMonthYear;
      return brandDeals.filter(deal => {
        if (!deal.payment_received_date) return false;
        const date = new Date(deal.payment_received_date);
        return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
      });
    };

    const currentDeals = getDealsByTimeframe('month');
    const lastMonthDeals = getDealsByTimeframe('lastMonth');
    const allTimeDeals = getDealsByTimeframe('allTime');

    const currentEarnings = currentDeals.reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);
    const lastMonthEarnings = lastMonthDeals.reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);
    const allTimeEarnings = allTimeDeals.reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);

    const monthlyGrowth = lastMonthEarnings > 0
      ? ((currentEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
      : currentEarnings > 0 ? 100 : 0;

    const pendingPayments = brandDeals
      .filter(deal => {
        const s = deal.status?.toLowerCase() || '';
        return (s.includes('content') || s.includes('delivered')) && !deal.payment_received_date;
      })
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);

    const nextPayoutDeal = brandDeals
      .filter(deal => (deal.status?.toLowerCase().includes('delivered') || deal.status?.toLowerCase().includes('content')) && deal.payment_expected_date)
      .sort((a, b) => new Date(a.payment_expected_date!).getTime() - new Date(b.payment_expected_date!).getTime())[0];

    return {
      month: { earnings: currentEarnings, monthlyGrowth, goal: currentEarnings === 0 ? 10000 : currentEarnings * 1.5 },
      lastMonth: { earnings: lastMonthEarnings, monthlyGrowth: 0, goal: lastMonthEarnings === 0 ? 10000 : lastMonthEarnings * 1.5 },
      allTime: { earnings: allTimeEarnings, monthlyGrowth, goal: allTimeEarnings === 0 ? 10000 : allTimeEarnings * 1.2 },
      totalDeals: brandDeals.length,
      activeDeals: brandDeals.filter(d => d.status !== 'Completed').length,
      pendingPayments,
      nextPayout: nextPayoutDeal?.deal_amount || 0,
      payoutDate: nextPayoutDeal?.payment_expected_date || null,
      protectionScore: 85,
    };
  }, [brandDeals]);

  const stats = {
    ...calculatedStats[timeframe],
    totalDeals: calculatedStats.totalDeals,
    activeDeals: calculatedStats.activeDeals,
    pendingPayments: calculatedStats.pendingPayments,
    nextPayout: calculatedStats.nextPayout,
    payoutDate: calculatedStats.payoutDate,
    protectionScore: calculatedStats.protectionScore,
  };

  const activeDealsPreview = useMemo(() => {
    return brandDeals
      .filter(deal => {
        if (deal.status === 'Completed') return false;
        const statusLower = String(deal.status || '').toLowerCase();
        const exec = String((deal as any)?.deal_execution_status || '').toLowerCase();
        return exec === 'signed' || exec === 'completed' || statusLower.includes('signed') || statusLower.includes('active') || statusLower.includes('content') || statusLower.includes('delivered');
      })
      .sort((a, b) => {
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const aRisk = (a.payment_expected_date && new Date(a.payment_expected_date) < now && !a.payment_received_date) || (a.due_date && new Date(a.due_date) < now) ? 1 : 0;
        const bRisk = (b.payment_expected_date && new Date(b.payment_expected_date) < now && !b.payment_received_date) || (b.due_date && new Date(b.due_date) < now) ? 1 : 0;
        if (aRisk !== bRisk) return bRisk - aRisk;
        return new Date(a.due_date || a.created_at).getTime() - new Date(b.due_date || b.created_at).getTime();
      })
      .slice(0, 6)
      .map(deal => {
        const now = new Date(); now.setHours(0, 0, 0, 0);
        let paymentStatus: 'received' | 'pending' | 'overdue' = 'pending';
        if (deal.payment_received_date) paymentStatus = 'received';
        else if (deal.payment_expected_date && new Date(deal.payment_expected_date) < now) paymentStatus = 'overdue';

        return {
          id: deal.id,
          brand: deal.brand_name,
          campaignName: (deal as any).campaign_name || ((deal as any).form_data?.campaignName),
          amount: deal.deal_amount,
          status: deal.status,
          isSigned: (deal as any)?.deal_execution_status === 'signed' || (deal as any)?.deal_execution_status === 'completed' || deal.status?.toLowerCase()?.includes('signed'),
          dueDate: deal.due_date,
          paymentStatus,
          progress: deal.progress_percentage ?? STAGE_TO_PROGRESS[getDealStageFromStatus(deal.status, deal.progress_percentage)] ?? 20
        };
      });
  }, [brandDeals]);

  const iosInstallGuideOverlay = (showIosInstallGuide && typeof document !== 'undefined')
    ? createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-[#1b1037]/95 p-5 shadow-2xl">
          <h3 className="text-lg font-semibold text-white">Add to Home Screen</h3>
          <p className="text-sm text-white/75 mt-1">Get instant collaboration alerts in app mode.</p>
          <div className="mt-4 space-y-3 text-sm text-white/85">
            <p><span className="text-white font-semibold">Step 1</span><br />Tap the Share icon ↓</p>
            <p><span className="text-white font-semibold">Step 2</span><br />Tap “Add to Home Screen”</p>
            <p><span className="text-white font-semibold">Step 3</span><br />Open CreatorArmour from your Home Screen</p>
          </div>
          <div className="mt-5 flex gap-2">
            <button type="button"
              onClick={() => setShowIosInstallGuide(false)}
              className="flex-1 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              Got it
            </button>
            <button type="button"
              onClick={() => { setShowIosInstallGuide(false); dismissDealAlertPrompt(); }}
              className="rounded-lg border border-white/25 text-white/85 hover:text-white hover:bg-white/10 text-sm px-3 py-2 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
    : null;

  if (isAuthInitializing || (isLoadingDeals && !!creatorId && !brandDealsError && session && profile)) {
    return <AuthLoadingScreen />;
  }

  if (isInitialLoading) {
    return <EnhancedDashboardSkeleton />;
  }

  return (
    <>
      <MobileDashboardDemo
        profile={profile}
        collabRequests={collabRequestsPreview}
        brandDeals={brandDeals}
        stats={stats}
        onAcceptRequest={acceptCollabRequest}
        onDeclineRequest={(id: string) => {
          setDeclineRequestId(id);
          setShowDeclineRequestDialog(true);
        }}
        onOpenMenu={() => setShowMenu(true)}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onLogout={() => setShowLogoutDialog(true)}
      />

      {iosInstallGuideOverlay}

      <AlertDialog open={showDeclineRequestDialog} onOpenChange={setShowDeclineRequestDialog}>
        <AlertDialogContent className="bg-[#1C1C1E] border-white/10 text-white shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Decline this request?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              The brand will be notified that you&apos;ve declined. You can&apos;t undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={declineCollabRequest}
              className="bg-red-500 hover:bg-red-600 text-white border-none"
            >
              Decline Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-[#1C1C1E] border-white/10 text-white shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to sign out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { signOutMutation.mutate(); setShowLogoutDialog(false); }}
              className="bg-red-500 hover:bg-red-600 text-white border-none"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QuickSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={(res: any) => res.url && navigate(res.url)}
      />
    </>
  );
};

export default CreatorDashboard;
