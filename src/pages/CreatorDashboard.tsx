"use client";

import { useState, useEffect, useMemo } from 'react';
import { Home, Briefcase, CreditCard, Shield, TrendingUp, Calendar, FileText, FileEdit, AlertCircle, Clock, ChevronRight, Plus, Search, Target, BarChart3, RefreshCw, LogOut, Loader2, XCircle, Menu, Link2, Copy, ExternalLink, Check, AlertTriangle, MessageCircle, Instagram } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useSignOut } from '@/lib/hooks/useAuth';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals, getDealStageFromStatus, STAGE_TO_PROGRESS } from '@/lib/hooks/useBrandDeals';
import { usePartnerStats } from '@/lib/hooks/usePartnerProgram';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/utils/logger';
import { isCreatorPro } from '@/lib/subscription';
import { getInitials } from '@/lib/utils/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { trackEvent } from '@/lib/utils/analytics';
import { cn } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/utils/api';
import { sectionLayout, animations, spacing, typography, separators, iconSizes, scroll, sectionHeader, gradients, buttons, glass, shadows, spotlight, radius, zIndex, vision, motion as motionTokens, colors } from '@/lib/design-system';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { BaseCard, SectionCard, StatCard, ActionCard } from '@/components/ui/card-variants';
// Onboarding components - commented out if not currently used
// import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
// import InteractiveTutorial from '@/components/onboarding/InteractiveTutorial';
// import { AchievementBadge, AchievementDisplay } from '@/components/onboarding/AchievementBadge';
// import FeedbackCollector from '@/components/onboarding/FeedbackCollector';
// import { onboardingAnalytics } from '@/lib/onboarding/analytics';
// import type { AchievementId } from '@/components/onboarding/AchievementBadge';
import DashboardTutorial from '@/components/onboarding/DashboardTutorial';
import { ContextualTipsProvider } from '@/components/contextual-tips/ContextualTipsProvider';
import { useContextualTips } from '@/hooks/useContextualTips';
import { DashboardSkeleton as EnhancedDashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { QuickSearch } from '@/components/dashboard/QuickSearch';
import PremiumDrawer from '@/components/drawer/PremiumDrawer';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import CollabLinkAnalytics from '@/components/collab/CollabLinkAnalytics';
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

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const signOutMutation = useSignOut();
  const { profile, user, loading: sessionLoading, session, isAuthInitializing } = useSession();
  const [activeTab, setActiveTab] = useState('home');
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [timeframe, setTimeframe] = useState<'month' | 'lastMonth' | 'allTime'>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [pendingCollabRequestsCount, setPendingCollabRequestsCount] = useState(0);
  const [collabRequestsPreview, setCollabRequestsPreview] = useState<Array<{
    id: string;
    brand_name: string;
    brand_email?: string;
    collab_type?: string;
    budget_range?: string | null;
    exact_budget?: number | null;
    barter_value?: number | null;
    deadline?: string | null;
    created_at: string;
    // Keep full request for Counter page navigation
    raw: any;
  }>>([]);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [declineRequestId, setDeclineRequestId] = useState<string | null>(null);
  const [showDeclineRequestDialog, setShowDeclineRequestDialog] = useState(false);
  const [collabLinkCopied, setCollabLinkCopied] = useState(false);
  const [collabRequestsLoading, setCollabRequestsLoading] = useState(true);
  const [hintDismissed, setHintDismissed] = useState(false);

  const fetchPendingCollabRequestsPreview = async (signal?: AbortSignal, options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sess = sessionData.session;
      if (!sess?.access_token) return;
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/collab-requests`, {
        headers: { 'Authorization': `Bearer ${sess.access_token}`, 'Content-Type': 'application/json' },
        signal: signal ?? undefined,
      });
      let data: { success?: boolean; requests?: unknown[] };
      if (res.ok) {
        data = await res.json().catch(() => ({ success: false, requests: [] }));
      } else {
        if (import.meta.env.DEV) {
          const body = await res.text();
          logger.warn('[CreatorDashboard] collab-requests API error', { status: res.status, statusText: res.statusText, body: body.slice(0, 200) });
        }
        data = { success: false, requests: [] };
      }
      const list = Array.isArray(data?.requests) ? data.requests : [];
      const pending = list.filter((r: { status?: string }) => (r.status || '').toLowerCase() === 'pending');
      setPendingCollabRequestsCount(pending.length);
      // Keep the list small on dashboard, but unified (paid + barter in one list)
      setCollabRequestsPreview(
        pending.slice(0, 1).map((r: any) => ({
          id: r.id,
          brand_name: r.brand_name || 'Brand',
          brand_email: r.brand_email || undefined,
          collab_type: r.collab_type,
          budget_range: r.budget_range ?? null,
          exact_budget: r.exact_budget ?? null,
          barter_value: r.barter_value ?? null,
          deadline: r.deadline ?? null,
          created_at: r.created_at || '',
          raw: r,
        }))
      );
    } catch (err: any) {
      // AbortError is expected when effect cleans up or timeout fires — don't log or clear state
      if (err?.name === 'AbortError') return;
      if (import.meta.env.DEV && !silent) logger.warn('[CreatorDashboard] collab-requests fetch failed', err);
      setPendingCollabRequestsCount(0);
      setCollabRequestsPreview([]);
    }
  };

  // Pending collaboration requests (count + preview for decision-first inbox)
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout so card never sticks loading
    setCollabRequestsLoading(true);
    (async () => {
      try {
        if (cancelled) return;
        await fetchPendingCollabRequestsPreview(controller.signal);
      } finally {
        clearTimeout(timeoutId);
        // Always clear loading so skeleton never sticks (even when aborted)
        setCollabRequestsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [session?.user?.id]);

  // Refetch collab requests when tab becomes visible (e.g. after brand submits in another tab)
  useEffect(() => {
    if (!session?.user?.id) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchPendingCollabRequestsPreview(undefined, { silent: true });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [session?.user?.id]);

  // Check for contextual tips to avoid overlap
  const { currentTip } = useContextualTips('dashboard');

  // Fetch real data
  // Ensure we use the authenticated user's ID to match RLS policies
  // For new accounts, profile might not exist yet, so use session.user.id as fallback
  const authenticatedUserId = session?.user?.id;
  const creatorId = profile?.id || authenticatedUserId;
  
  // Debug: Log creator ID resolution (dev only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[CreatorDashboard] Creator ID resolution:', {
        profileId: profile?.id,
        authenticatedUserId,
        finalCreatorId: creatorId,
        hasSession: !!session,
        hasProfile: !!profile,
      });
    }
  }, [profile?.id, authenticatedUserId, creatorId, session, profile]);

  // Check Pro status
  useEffect(() => {
    const checkProStatus = async () => {
      if (user?.id) {
        const proStatus = await isCreatorPro(user.id);
        setIsPro(proStatus);
      }
    };
    checkProStatus();
  }, [user?.id]);
  
  const { data: brandDeals = [], isLoading: isLoadingDeals, error: brandDealsError } = useBrandDeals({
    creatorId: creatorId,
    enabled: !sessionLoading && !!creatorId,
  });
  
  // Debug: Log dashboard state (dev only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[CreatorDashboard] State:', {
        profileId: profile?.id,
        authenticatedUserId,
        creatorId,
        brandDealsLength: brandDeals?.length ?? 0,
        isLoadingDeals,
        hasError: !!brandDealsError,
        errorMessage: brandDealsError?.message,
        brandDealsIsArray: Array.isArray(brandDeals),
        brandDealsValue: brandDeals,
      });
    }
  }, [profile?.id, authenticatedUserId, creatorId, brandDeals, isLoadingDeals, brandDealsError]);

  const { data: partnerStats } = usePartnerStats(profile?.id);


  // Show tutorial after onboarding completion
  useEffect(() => {
    if (profile?.onboarding_complete && !sessionLoading && profile?.id) {
      // Check if tutorial was already completed or dismissed
      const tutorialCompleted = localStorage.getItem(`dashboard-tutorial-completed-${profile.id}`);
      const tutorialDismissed = localStorage.getItem(`dashboard-tutorial-dismissed-${profile.id}`);
      
      // Show tutorial if:
      // 1. Just completed onboarding (within 24 hours)
      // 2. Haven't completed tutorial
      // 3. Haven't dismissed tutorial
      if (!tutorialCompleted && !tutorialDismissed) {
        const onboardingDate = profile.updated_at ? new Date(profile.updated_at) : null;
        if (onboardingDate) {
          const hoursSinceOnboarding = (Date.now() - onboardingDate.getTime()) / (1000 * 60 * 60);
          if (hoursSinceOnboarding < 24) {
            // Show tutorial after 2 seconds delay
            const timer = setTimeout(() => {
              setShowTutorial(true);
            }, 2000);
            return () => clearTimeout(timer);
          }
        }
      }
    }
  }, [profile, sessionLoading]);

  // Only show loading skeleton if we're actually loading data
  // Don't show loading if we're just waiting for profile (new accounts should see empty state)
  // Also don't show loading if there's an error (show empty state instead)
  const isInitialLoading = (sessionLoading && !session) || (isLoadingDeals && !!creatorId && !brandDealsError);

  // Pull to refresh
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

  const acceptCollabRequest = async (req: any) => {
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
        if (data.needs_delivery_details) {
          toast.success('Share delivery details to proceed');
          await fetchPendingCollabRequestsPreview();
          if (data.deal?.id) navigate(`/creator-contracts/${data.deal.id}/delivery-details`);
        } else {
          toast.success(data.contract ? 'Contract generated and ready for signing' : 'Deal accepted!');
          await fetchPendingCollabRequestsPreview();
          if (data.deal?.id) navigate(`/creator-contracts/${data.deal.id}`);
        }
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

  // User data from session
  const userData = useMemo(() => {
    const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
    const displayName = fullName || 
      profile?.instagram_handle?.replace('@', '') || 
      user?.email?.split('@')[0] || 
      'Creator';
    
    return {
      name: fullName || 'Creator',
      displayName: displayName,
      userType: "Content Creator",
      streak: 0, // TODO: Calculate from actual streak data when available
      avatar: getInitials(profile?.first_name || null, profile?.last_name || null)
    };
  }, [profile, user, partnerStats]);

  // Calculate real stats from brand deals
  const calculatedStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Filter deals by timeframe
    const getDealsByTimeframe = (timeframe: 'month' | 'lastMonth' | 'allTime') => {
      if (timeframe === 'allTime') return brandDeals;
      
      const targetMonth = timeframe === 'month' ? currentMonth : lastMonth;
      const targetYear = timeframe === 'month' ? currentYear : lastMonthYear;
      
      return brandDeals.filter(deal => {
        if (!deal.payment_received_date) return false;
        const date = new Date(deal.payment_received_date);
        return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
      });
    };

    const currentDeals = getDealsByTimeframe('month');
    const lastMonthDeals = getDealsByTimeframe('lastMonth');
    const allTimeDeals = getDealsByTimeframe('allTime');

    // Calculate earnings
    const currentEarnings = currentDeals
      .filter(deal => deal.payment_received_date)
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);
    
    const lastMonthEarnings = lastMonthDeals
      .filter(deal => deal.payment_received_date)
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);

    const allTimeEarnings = allTimeDeals
      .filter(deal => deal.payment_received_date)
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);

    // Calculate growth
    const monthlyGrowth = lastMonthEarnings > 0 
      ? ((currentEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 
      : currentEarnings > 0 ? 100 : 0;

    // Calculate pending payments
    const pendingPayments = brandDeals
      .filter(deal => {
        const status = deal.status?.toLowerCase() || '';
        return (status.includes('content_delivered') || status.includes('content delivered')) && !deal.payment_received_date;
      })
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);

    // Get next payout (earliest pending payment)
    const nextPayoutDeal = brandDeals
      .filter(deal => {
        const status = deal.status?.toLowerCase() || '';
        return (status.includes('content_delivered') || status.includes('content delivered')) && deal.payment_expected_date;
      })
      .sort((a, b) => {
        const dateA = new Date(a.payment_expected_date!).getTime();
        const dateB = new Date(b.payment_expected_date!).getTime();
        return dateA - dateB;
      })[0];

    // Active deals (not completed) - includes all deals that are in progress
    const activeDeals = brandDeals.filter(deal => 
      deal.status !== 'Completed'
    ).length;

    // Set minimum goal of ₹10,000 if earnings are 0
    const getGoal = (earnings: number, multiplier: number) => {
      if (earnings === 0) return 10000; // Default minimum goal
      return earnings * multiplier;
    };

    return {
      month: {
        earnings: currentEarnings,
        monthlyGrowth,
        goal: getGoal(currentEarnings, 1.5), // Dynamic goal with minimum fallback
      },
      lastMonth: {
        earnings: lastMonthEarnings,
        monthlyGrowth: 0,
        goal: getGoal(lastMonthEarnings, 1.5),
      },
      allTime: {
        earnings: allTimeEarnings,
        monthlyGrowth: monthlyGrowth,
        goal: getGoal(allTimeEarnings, 1.2),
      },
      totalDeals: brandDeals.length,
      activeDeals,
      pendingPayments,
      nextPayout: nextPayoutDeal?.deal_amount || 0,
      payoutDate: nextPayoutDeal?.payment_expected_date || null,
      protectionScore: 85, // TODO: Calculate from content protection data
    };
  }, [brandDeals, timeframe]);

  const stats = {
    ...calculatedStats[timeframe],
    totalDeals: calculatedStats.totalDeals,
    activeDeals: calculatedStats.activeDeals,
    pendingPayments: calculatedStats.pendingPayments,
    nextPayout: calculatedStats.nextPayout,
    payoutDate: calculatedStats.payoutDate,
    protectionScore: calculatedStats.protectionScore,
  };

  const hasPaymentOrDeliverableOverdue = useMemo(() => {
    if (!Array.isArray(brandDeals) || brandDeals.length === 0) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return brandDeals.some((deal) => {
      if (deal.payment_received_date) return false;
      if (deal.payment_expected_date) {
        const d = new Date(deal.payment_expected_date);
        d.setHours(0, 0, 0, 0);
        if (d < now) return true;
      }
      if (deal.due_date) {
        const d = new Date(deal.due_date);
        d.setHours(0, 0, 0, 0);
        if (d < now) return true;
      }
      return false;
    });
  }, [brandDeals]);

  const hasPaymentOverdue = useMemo(() => {
    if (!Array.isArray(brandDeals) || brandDeals.length === 0) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return brandDeals.some((deal) => {
      if (deal.payment_received_date) return false;
      if (!deal.payment_expected_date) return false;
      const d = new Date(deal.payment_expected_date);
      d.setHours(0, 0, 0, 0);
      return d < now;
    });
  }, [brandDeals]);

  const attentionItems = useMemo(() => {
    if (!Array.isArray(brandDeals) || brandDeals.length === 0) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return brandDeals
      .filter((deal) => {
        if (deal.payment_received_date) return false;
        const paymentOverdue = deal.payment_expected_date && new Date(deal.payment_expected_date) < now;
        const deliverableOverdue = deal.due_date && new Date(deal.due_date) < now;
        return paymentOverdue || deliverableOverdue;
      })
      .sort((a, b) => (b.deal_amount || 0) - (a.deal_amount || 0))
      .slice(0, 2)
      .map((deal) => {
        const payDue = deal.payment_expected_date ? new Date(deal.payment_expected_date) : null;
        const delDue = deal.due_date ? new Date(deal.due_date) : null;
        const payOverdue = payDue && payDue < now && !deal.payment_received_date;
        const delOverdue = delDue && delDue < now;
        const label = payOverdue ? 'payment overdue' : delOverdue ? 'deliverable overdue' : 'action needed';
        const dueDate = (payOverdue ? payDue : delDue)!;
        return {
          id: deal.id,
          brand_name: deal.brand_name || 'Brand',
          amount: deal.deal_amount || 0,
          label,
          dueDate: dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        };
      });
  }, [brandDeals]);

  const earningsProgress = stats.goal > 0 ? (stats.earnings / stats.goal) * 100 : 0;
  
  // Safe check: Ensure brandDeals is an array and check length
  // Only show empty state when:
  // 1. Not loading (or query is disabled because no creatorId yet)
  // 2. No error (or error is handled - RLS errors are acceptable for new accounts)
  // 3. brandDeals is an empty array
  const hasDeals = Array.isArray(brandDeals) && brandDeals.length > 0;
  
  // For new accounts: if creatorId exists but query hasn't run yet, or query completed with empty array
  // Also show empty state if there's an RLS error (new account might not have profile yet)
  const queryHasCompleted = !isLoadingDeals || !creatorId; // If no creatorId, query is disabled, so consider it "completed"
  const isRLSError = brandDealsError?.message?.includes('permission') || 
                     brandDealsError?.message?.includes('row-level security') ||
                     (brandDealsError as any)?.code === '42501';
  // Show empty state if: query completed AND (no error OR RLS error) AND empty array
  const hasNoData = queryHasCompleted && 
                    (!brandDealsError || isRLSError) && 
                    Array.isArray(brandDeals) && 
                    brandDeals.length === 0;
  
  // Debug: Log empty state decision
  useEffect(() => {
    console.log('[CreatorDashboard] Empty state check:', {
      hasDeals,
      hasNoData,
      isLoadingDeals,
      hasError: !!brandDealsError,
      brandDealsLength: brandDeals?.length ?? 0,
      brandDealsIsArray: Array.isArray(brandDeals),
    });
  }, [hasDeals, hasNoData, isLoadingDeals, brandDealsError, brandDeals]);

  // Active deals preview from real data
  // Active = not completed and not fully paid (payment_received_date is null or status is not 'Completed')
  const activeDealsPreview = useMemo(() => {
    if (hasNoData) return [];
    
    return brandDeals
      .filter(deal => {
        // Exclude only completed deals
        if (deal.status === 'Completed') return false;

        // Only show accepted deals on dashboard (decision-focused)
        const statusLower = String(deal.status || '').toLowerCase();
        const exec = String((deal as any)?.deal_execution_status || '').toLowerCase();
        const isSignedOrAccepted =
          exec === 'signed' ||
          exec === 'completed' ||
          statusLower.includes('signed') ||
          statusLower.includes('active') ||
          statusLower.includes('content') ||
          statusLower.includes('approved') ||
          statusLower.includes('payment') ||
          statusLower.includes('delivered');

        return isSignedOrAccepted;
      })
      .sort((a, b) => {
        // Risk-first: overdue payments/deliverables first, then earliest due date
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const aPayOverdue = !!(a.payment_expected_date && !a.payment_received_date && new Date(a.payment_expected_date) < now);
        const bPayOverdue = !!(b.payment_expected_date && !b.payment_received_date && new Date(b.payment_expected_date) < now);
        const aDelOverdue = !!(a.due_date && new Date(a.due_date) < now);
        const bDelOverdue = !!(b.due_date && new Date(b.due_date) < now);
        const aRisk = (aPayOverdue || aDelOverdue) ? 1 : 0;
        const bRisk = (bPayOverdue || bDelOverdue) ? 1 : 0;
        if (aRisk !== bRisk) return bRisk - aRisk; // risky first
        const dateA = new Date(a.due_date || a.created_at).getTime();
        const dateB = new Date(b.due_date || b.created_at).getTime();
        return dateA - dateB;
      })
      .slice(0, 6)
      .map(deal => {
        // Check if deal is signed by checking deal_execution_status
        const dealExecutionStatus = (deal as any)?.deal_execution_status;
        const isSigned = dealExecutionStatus === 'signed' || dealExecutionStatus === 'completed' || 
                         deal.status?.toLowerCase()?.includes('signed');
        
        // Extract campaign name from deal (could be in campaign_name field or form_data)
        const campaignName = (deal as any).campaign_name || 
                            ((deal as any).form_data?.campaignName) || 
                            null;
        
        // Calculate payment status
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        let paymentStatus: 'received' | 'pending' | 'overdue' = 'pending';
        if (deal.payment_received_date) {
          paymentStatus = 'received';
        } else if (deal.payment_expected_date) {
          const paymentDue = new Date(deal.payment_expected_date);
          paymentDue.setHours(0, 0, 0, 0);
          if (paymentDue < now) {
            paymentStatus = 'overdue';
          }
        }
        
        // Calculate next action
        let nextAction = '';
        const statusLower = deal.status?.toLowerCase() || '';
        
        // Priority 1: If signed, check deliverable status
        if (isSigned) {
          // Check if content delivery is due
          if (deal.due_date) {
            const dueDate = new Date(deal.due_date);
            dueDate.setHours(0, 0, 0, 0);
            const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntil < 0) {
              nextAction = 'Deliverable overdue';
            } else if (daysUntil === 0) {
              nextAction = 'Deliver today';
            } else if (daysUntil <= 7) {
              // Try to extract deliverable type from deliverables field
              let deliverableType = 'content';
              try {
                const deliverablesStr = deal.deliverables;
                if (deliverablesStr) {
                  const deliverables = typeof deliverablesStr === 'string' ? JSON.parse(deliverablesStr) : deliverablesStr;
                  if (Array.isArray(deliverables) && deliverables.length > 0) {
                    const firstDeliverable = deliverables[0];
                    if (firstDeliverable.contentType) {
                      deliverableType = firstDeliverable.contentType;
                    } else if (typeof firstDeliverable === 'string' && firstDeliverable.toLowerCase().includes('reel')) {
                      deliverableType = 'Reel';
                    } else if (typeof firstDeliverable === 'string' && firstDeliverable.toLowerCase().includes('post')) {
                      deliverableType = 'Post';
                    }
                  }
                }
              } catch (e) {
                // Ignore parse errors
              }
              nextAction = `Deliver ${deliverableType} in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
            } else {
              nextAction = `Deliver in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
            }
          } 
          // Priority 2: If payment is due/overdue and content is delivered
          else if (paymentStatus === 'overdue') {
            nextAction = 'Await payment';
          } else if (paymentStatus === 'pending' && (statusLower.includes('delivered') || statusLower.includes('completed'))) {
            nextAction = 'Await payment';
          } 
          // Priority 3: Default for signed deals
          else {
            nextAction = 'Upload deliverable';
          }
        } 
        // If not signed, show contract/negotiation actions
        else if (statusLower.includes('contract') || statusLower.includes('agreement') || statusLower.includes('ready')) {
          nextAction = 'Review contract';
        } else {
          nextAction = 'Complete negotiation';
        }
        
        // Calculate deliverables progress
        let deliverablesProgress = null;
        try {
          const deliverablesStr = deal.deliverables;
          if (deliverablesStr) {
            const deliverables = typeof deliverablesStr === 'string' ? JSON.parse(deliverablesStr) : deliverablesStr;
            if (Array.isArray(deliverables)) {
              const total = deliverables.length;
              // For now, assume delivered if deal is completed or payment received
              const delivered = (deal.status === 'Completed' || deal.payment_received_date) ? total : 0;
              if (total > 0) {
                deliverablesProgress = { delivered, total };
              }
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
        
        // Check brand trust indicators
        let trustBadge: 'verified' | 'gst' | 'repeat' | null = null;
        // Check if brand has GST (from brand_email or form_data)
        const brandGst = (deal as any).brand_gstin || ((deal as any).form_data?.gstin);
        if (brandGst) {
          trustBadge = 'gst';
        }
        // Check if repeat brand (same brand_name appears multiple times)
        const brandDealCount = brandDeals.filter(d => d.brand_name === deal.brand_name).length;
        if (brandDealCount > 1 && !trustBadge) {
          trustBadge = 'repeat';
        }
        // Check if verified (brand_response_status accepted_verified)
        if ((deal as any).brand_response_status === 'accepted_verified' && !trustBadge) {
          trustBadge = 'verified';
        }
        
        return {
          id: deal.id,
          brand: deal.brand_name,
          campaignName: campaignName,
          amount: deal.deal_amount,
          status: deal.status,
          dealExecutionStatus: dealExecutionStatus,
          isSigned: isSigned,
          dueDate: deal.due_date,
          paymentStatus: paymentStatus,
          paymentExpectedDate: deal.payment_expected_date,
          paymentReceivedDate: deal.payment_received_date,
          nextAction: nextAction,
          deliverablesProgress: deliverablesProgress,
          trustBadge: trustBadge,
          progress: deal.progress_percentage ?? (() => {
            // Use canonical status mapping for progress
            const stage = getDealStageFromStatus(deal.status, deal.progress_percentage);
            return STAGE_TO_PROGRESS[stage] ?? 20;
          })()
        };
      });
  }, [brandDeals, hasNoData]);

  // Active deals formatted for display
  const activeDeals = activeDealsPreview.map(deal => ({
    id: deal.id,
    title: deal.campaignName || `${deal.brand} Deal`,
    brand: deal.brand,
    campaignName: deal.campaignName,
    value: deal.amount,
    progress: deal.progress,
    status: deal.isSigned ? 'signed' : ((deal.status === 'Content Delivered' || deal.status === 'Content Making') ? 'active' : 'negotiation'),
    deadline: deal.dueDate ? new Date(deal.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
    paymentStatus: deal.paymentStatus,
    nextAction: deal.nextAction,
    deliverablesProgress: deal.deliverablesProgress,
    trustBadge: deal.trustBadge
  }));

  // Quick actions
  const quickActions = [
    {
      id: 1,
      icon: FileText,
      label: "Upload Contract",
      subtitle: "Scan for hidden risks before signing",
      color: "bg-purple-500/20",
      iconColor: "text-purple-400",
      onClick: () => navigate('/contract-upload')
    },
    {
      id: 2,
      icon: Plus,
      label: "Add Deal",
      subtitle: "Track payments, deadlines & deliverables",
      color: "bg-blue-500/20",
      iconColor: "text-blue-400",
      onClick: () => {
        navigate('/contract-upload');
        triggerHaptic(HapticPatterns.light);
      }
    },
    {
      id: 4,
      icon: AlertCircle,
      label: "Consumer Complaint",
      subtitle: "File complaints against brands or services",
      color: "bg-orange-500/20",
      iconColor: "text-orange-400",
      onClick: () => navigate('/lifestyle/consumer-complaints')
    }
  ];


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Show AuthLoadingScreen during auth initialization OR while initial data is loading
  // This prevents skeleton from showing during the transition
  // Only show if we have session and profile (to avoid showing on first page load)
  // IMPORTANT: This check must come AFTER all hooks to avoid React Hooks violations
  if (isAuthInitializing || (isLoadingDeals && !!creatorId && !brandDealsError && session && profile)) {
    return <AuthLoadingScreen />;
  }

  // Import enhanced skeleton (fallback to inline if import fails)

    return (
    <ContextualTipsProvider currentView="dashboard">
    <div className={`min-h-[100dvh] ${gradients.page} text-white overflow-x-hidden flex flex-col`}>
      {/* Top Header - iOS 17 + visionOS Premium */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={motionTokens.spring.ios17}
        className={cn(
          "sticky top-0 relative overflow-hidden",
          zIndex.sticky,
          // iOS 17 glass with enhanced blur
          "bg-white/8 backdrop-blur-3xl",
          "border-b border-white/15",
          shadows.depthStrong,
          // Inner shadow for depth
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
          // Purple theme integration
          "before:absolute before:inset-0 before:bg-gradient-to-b before:from-purple-500/10 before:to-transparent before:pointer-events-none"
        )}
        style={{
          paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
          paddingBottom: '6px',
          paddingLeft: 'calc(16px + env(safe-area-inset-left, 0px))',
          paddingRight: 'calc(16px + env(safe-area-inset-right, 0px))',
        }}
      >
        {/* Enhanced spotlight gradient */}
        <div className={cn(
          "absolute inset-x-0 top-0 h-24",
          "bg-gradient-to-b from-white/20 via-white/10 to-transparent",
          "pointer-events-none"
        )} />
        
        {/* Inner border for depth - enhanced */}
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        {/* Subtle purple glow at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-purple-400/30 blur-sm" />
        
        <div className={cn(
          "flex items-center justify-between gap-3",
          spacing.cardPadding.tertiary,
          "py-1.5 relative z-10",
          // Better spacing on mobile
          "px-4 sm:px-5"
        )}>
          {/* Sidebar Menu Icon - Left Side */}
          <motion.button 
            onClick={() => {
              setShowMenu(!showMenu);
              triggerHaptic(HapticPatterns.light);
            }}
            whileTap={animations.microTap}
            whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
            className={cn(
              buttons.icon,
              "flex-shrink-0"
            )}
            aria-label={showMenu ? "Close menu" : "Open menu"}
          >
            <Menu className={iconSizes.md} />
          </motion.button>
          
          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <motion.button 
              onClick={() => {
                setShowSearch(true);
                triggerHaptic(HapticPatterns.light);
              }}
              whileTap={animations.microTap}
              className={buttons.icon}
              aria-label="Search"
            >
              <Search className={iconSizes.md} />
            </motion.button>
            {/* Creator Avatar - Right Side */}
            <motion.button 
              onClick={() => {
                setShowMenu(!showMenu);
                triggerHaptic(HapticPatterns.light);
              }}
              whileTap={animations.microTap}
              whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
              className={cn(
                "w-10 h-10",
                radius.full,
                "bg-gradient-to-br from-blue-600 to-purple-600",
                "flex items-center justify-center",
                typography.body,
                "font-semibold flex-shrink-0",
                "border-2 border-white/20",
                shadows.md
              )}
              aria-label={showMenu ? "Close profile menu" : "Open profile menu"}
            >
              {userData.avatar}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Premium Drawer */}
      <PremiumDrawer
        open={showMenu}
        onClose={() => {
          setShowMenu(false);
          triggerHaptic(HapticPatterns.light);
        }}
        onNavigate={(path) => {
          navigate(path);
          triggerHaptic(HapticPatterns.light);
        }}
        onSetActiveTab={(tab) => {
          setActiveTab(tab);
          triggerHaptic(HapticPatterns.light);
        }}
        onLogout={() => {
          triggerHaptic(HapticPatterns.medium);
          setShowLogoutDialog(true);
        }}
        activeItem={activeTab}
        counts={{ messages: 3 }}
      />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-indigo-900/95 backdrop-blur-xl border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-xl flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-400" />
              Confirm Logout
            </AlertDialogTitle>
            <AlertDialogDescription className="text-purple-200">
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel 
              onClick={() => {
                triggerHaptic(HapticPatterns.light);
              }}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 focus:ring-2 focus:ring-purple-400/50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  triggerHaptic(HapticPatterns.medium);
                  
                  // Analytics tracking
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'logout', {
                      event_category: 'engagement',
                      event_label: 'user_logout',
                      method: 'dashboard_sidebar'
                    });
                  }
                  
                  logger.info('User logging out from dashboard');
                  await signOutMutation.mutateAsync();
                  setShowMenu(false);
                  setShowLogoutDialog(false);
                } catch (error: any) {
                  logger.error('Logout failed', error);
                }
              }}
              disabled={signOutMutation.isPending}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 focus:ring-2 focus:ring-red-400/50 disabled:opacity-50"
            >
              {signOutMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline Request Confirmation (dashboard inbox) */}
      <AlertDialog open={showDeclineRequestDialog} onOpenChange={setShowDeclineRequestDialog}>
        <AlertDialogContent className="bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-indigo-900/95 backdrop-blur-xl border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-xl">Decline brand request?</AlertDialogTitle>
            <AlertDialogDescription className="text-purple-200">
              This will send a polite decline to the brand. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20 focus:ring-2 focus:ring-purple-400/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={declineCollabRequest} className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40">
              Decline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Welcome Banner for New Users */}

      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
      >
        Skip to main content
      </a>

      {/* Main Content */}
      <main id="main-content" className={`${sectionLayout.container} ${scroll.container} flex-1 overflow-y-auto`}>
        {/* Home Tab */}
        {activeTab === 'home' && (
          <>
            {isInitialLoading ? (
              <div className={sectionLayout.container}>
                <EnhancedDashboardSkeleton />
              </div>
            ) : hasNoData ? (
              // New-user empty state — Collab-Link–first (no manual “Add Deal”)
              <div className="max-w-5xl mx-auto space-y-8 pb-28 md:pb-32">
                {/* Greeting — intent: brands reach you the right way */}
                <div className={cn(sectionLayout.header, "md:pt-4 md:text-left")}>
                  <h1 className={cn(typography.h1, "mb-2 leading-tight md:text-xl break-words")}>
                    {getGreeting()}, {userData.name}! 👋
                  </h1>
                  <p className={cn(typography.body, "leading-relaxed break-words")}>Let&apos;s help brands reach you the right way.</p>
                  <p className={cn(typography.bodySmall, "text-white/70 mt-1 break-words")}>Creator Armour replaces brand DMs with protected collaboration requests.</p>
                </div>

                {/* Hero: Your Official Brand Collaboration Link */}
                <BaseCard variant="secondary" className="text-center p-6 md:p-6 relative border border-purple-400/30" onClick={(e) => e?.stopPropagation()}>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 md:w-14 md:h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <Link2 className={cn(iconSizes.xl, "md:w-7 md:h-7 text-purple-400")} />
                  </motion.div>
                  <h2 className={cn(typography.h2, "mb-2 md:text-2xl break-words")}>Your Official Brand Collaboration Link</h2>
                  <p className={cn(typography.body, "mb-5 max-w-md mx-auto break-words")}>
                    This is the only link brands need to collaborate with you.<br className="hidden sm:inline" /> No DMs. No confusion. Fully protected.
                  </p>
                  <div className="flex flex-col gap-3 max-w-sm mx-auto" style={{ zIndex: 50, pointerEvents: 'auto' }}>
                    <motion.button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const username = profile?.instagram_handle || profile?.username;
                        if (username) {
                          const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/collab/${username}`;
                          navigator.clipboard.writeText(link);
                          toast.success('Collab link copied!');
                          triggerHaptic(HapticPatterns.medium);
                        } else {
                          toast.error('Username not set. Please complete your profile.');
                        }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      whileTap={animations.microTap}
                      className={cn(
                        buttons.primary,
                        "flex items-center justify-center gap-2 min-h-[44px] w-full"
                      )}
                      type="button"
                      aria-label="Copy Collab Link"
                    >
                      <Copy className={iconSizes.md} />
                      Copy Collab Link
                    </motion.button>
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const username = profile?.instagram_handle || profile?.username;
                          if (username) {
                            const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/collab/${username}`;
                            const message = encodeURIComponent(`For collaborations, submit here:\n\n${link}`);
                            window.open(`https://wa.me/?text=${message}`, '_blank');
                            toast.success('Opening WhatsApp…');
                            triggerHaptic(HapticPatterns.light);
                          } else {
                            toast.error('Username not set. Please complete your profile.');
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        whileTap={animations.microTap}
                        className={cn(
                          "min-h-[40px] rounded-lg border border-white/20 bg-white/5 text-white/90 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-white/10 transition-colors"
                        )}
                        aria-label="Share via WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const username = profile?.instagram_handle || profile?.username;
                          if (username) {
                            const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/collab/${username}`;
                            navigator.clipboard.writeText(link);
                            toast.success('Link copied. Paste in bio or DMs.');
                            triggerHaptic(HapticPatterns.light);
                          } else {
                            toast.error('Username not set. Please complete your profile.');
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        whileTap={animations.microTap}
                        className={cn(
                          "min-h-[40px] rounded-lg border border-white/20 bg-white/5 text-white/90 text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-white/10 transition-colors"
                        )}
                        aria-label="Share via Instagram"
                      >
                        <Instagram className="w-4 h-4" />
                        Instagram
                      </motion.button>
                    </div>
                    <motion.a
                      href={(profile?.instagram_handle || profile?.username) ? `/collab/${profile?.instagram_handle || profile?.username}` : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!(profile?.instagram_handle || profile?.username)) {
                          e.preventDefault();
                          toast.error('Username not set. Please complete your profile.');
                        } else {
                          triggerHaptic(HapticPatterns.light);
                        }
                      }}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 min-h-[44px] text-sm font-medium text-white/80 hover:text-white transition-colors",
                        !(profile?.instagram_handle || profile?.username) && "pointer-events-none opacity-60"
                      )}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Preview as a Brand
                    </motion.a>
                  </div>
                  <p className={cn(typography.caption, "text-white/50 mt-4 break-words")}>Every request is timestamped and legally protected.</p>
                </BaseCard>

                {/* First-time activation: guided steps */}
                <BaseCard variant="tertiary" className="p-5 md:p-5 text-left border border-white/10">
                  <h3 className={cn(typography.h4, "mb-4 break-words")}>You&apos;re ready to receive brand deals</h3>
                  <ul className="space-y-3 mb-5">
                    <li className="flex items-start gap-3 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/30 border border-green-400/50 flex items-center justify-center text-green-300 text-xs font-semibold">1</span>
                      <span className="break-words">Add your collab link to Instagram bio</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/30 border border-green-400/50 flex items-center justify-center text-green-300 text-xs font-semibold">2</span>
                      <span className="break-words">Reply to brand DMs with this link</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/30 border border-green-400/50 flex items-center justify-center text-green-300 text-xs font-semibold">3</span>
                          <span className="break-words">Accept Deal, Counter, or Decline inside Creator Armour</span>
                    </li>
                  </ul>
                  <motion.button
                    onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/creator-collab'); }}
                    whileTap={animations.microTap}
                    className={cn(
                      buttons.secondary,
                      "w-full min-h-[44px] flex items-center justify-center gap-2 border-purple-400/40 text-purple-100"
                    )}
                  >
                    Go to Collaboration Requests
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </BaseCard>

                {/* How Creator Armour Works — refactored from Quick Start */}
                <SectionCard
                  variant="secondary"
                  title="How Creator Armour Works"
                  icon={<Target className="w-5 h-5 text-purple-400" />}
                  className="mb-6 md:mb-24 border-t border-white/10 pt-6 mt-6"
                >
                  <div className="grid md:grid-cols-3 gap-4 md:gap-3">
                    <motion.div
                      onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/creator-collab'); }}
                      whileTap={animations.microTap}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      className="cursor-pointer h-full"
                    >
                      <BaseCard variant="tertiary" interactive className="h-full md:p-4 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200">
                        <div className="w-10 h-10 md:w-9 md:h-9 rounded-lg bg-purple-500/20 flex items-center justify-center mb-2 md:mb-1.5">
                          <Link2 className={cn(iconSizes.md, "md:w-4 md:h-4 text-purple-400")} />
                        </div>
                        <h4 className={cn(typography.h4, "mb-0.5 md:mb-0 md:text-sm break-words")}>Share your Collab Link</h4>
                        <p className={cn(typography.bodySmall, "md:text-xs break-words")}>Brands submit structured requests</p>
                      </BaseCard>
                    </motion.div>
                    <motion.div
                      onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/creator-collab'); }}
                      whileTap={animations.microTap}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      className="cursor-pointer h-full"
                    >
                      <BaseCard variant="tertiary" interactive className="h-full md:p-4 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-200">
                        <div className="w-10 h-10 md:w-9 md:h-9 rounded-lg bg-green-500/20 flex items-center justify-center mb-2 md:mb-1.5">
                          <Briefcase className={cn(iconSizes.md, "md:w-4 md:h-4 text-green-400")} />
                        </div>
                        <h4 className={cn(typography.h4, "mb-0.5 md:mb-0 md:text-sm break-words")}>Brand Requests</h4>
                        <p className={cn(typography.bodySmall, "md:text-xs break-words")}>Accept Deal, Counter, or Decline</p>
                      </BaseCard>
                    </motion.div>
                    <motion.div
                      onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/creator-payments'); }}
                      whileTap={animations.microTap}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      className="cursor-pointer h-full"
                    >
                      <BaseCard variant="tertiary" interactive className="h-full md:p-4 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 opacity-90">
                        <div className="w-10 h-10 md:w-9 md:h-9 rounded-lg bg-blue-500/20 flex items-center justify-center mb-2 md:mb-1.5">
                          <CreditCard className={cn(iconSizes.md, "md:w-4 md:h-4 text-blue-400")} />
                        </div>
                        <h4 className={cn(typography.h4, "mb-0.5 md:mb-0 md:text-sm break-words")}>Payments & Contracts Auto-Handled</h4>
                        <p className={cn(typography.bodySmall, "md:text-xs break-words")}>Activated only after acceptance</p>
                      </BaseCard>
                    </motion.div>
                  </div>
                </SectionCard>
              </div>
            ) : (
              <>
            {/* Hero Section - Edge-to-edge with gradient background */}
            <div className={cn(
              "-mx-4 md:mx-0",
              "bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent",
              "pt-4 pb-1 md:pt-5 md:pb-2",
              "px-4 md:px-0",
              "lg:mb-1"
            )}>
              {/* Greeting */}
              <div className={cn("mb-2 md:pt-0 md:text-left")}>
                <h1 className={cn(typography.h1, "mb-0.5 leading-tight md:text-xl whitespace-nowrap overflow-hidden text-ellipsis")}>
                  {getGreeting()}, <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">{userData.name ? userData.name.charAt(0).toUpperCase() + userData.name.slice(1) : ''}!</span> 👋
                </h1>
                <p className={cn(typography.bodySmall, "text-white/70 mt-0.5")}>
                  Here&apos;s what&apos;s happening with your collabs.
                </p>
                {/* Live region: announce count changes to screen readers */}
                <div aria-live="polite" aria-atomic="true" className="sr-only">
                  {pendingCollabRequestsCount === 0
                    ? 'No brand requests pending'
                    : `${pendingCollabRequestsCount} brand request${pendingCollabRequestsCount !== 1 ? 's' : ''} pending`}
                </div>
                {pendingCollabRequestsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/collab-requests'); }}
                    className={cn(
                      "mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      "bg-purple-500/25 text-purple-200 border border-purple-400/30",
                      "hover:bg-purple-500/35 hover:border-purple-400/50 transition-colors"
                    )}
                    aria-label={`View ${pendingCollabRequestsCount} pending brand request${pendingCollabRequestsCount !== 1 ? 's' : ''}`}
                  >
                    <span>{pendingCollabRequestsCount} pending</span>
                    <ChevronRight className="w-3 h-3" aria-hidden />
                  </button>
                )}
              </div>

            </div>

            {/* Decision-first dashboard: no extra above-fold cards */}

            {/* Incoming Brand Requests (highest priority) — same width as Active Collaborations */}
            <div className={cn("space-y-6 md:space-y-8", "-mt-2")}>
              <div className={cn(sectionHeader.base, "mb-3 md:mb-4")}>
                <h2 className={sectionHeader.title}>Incoming Brand Requests</h2>
                {pendingCollabRequestsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/collab-requests'); }}
                    className={sectionHeader.action}
                    aria-label={`View all ${pendingCollabRequestsCount} brand requests`}
                  >
                    View all →
                  </button>
                )}
              </div>
              {collabRequestsLoading ? (
                <BaseCard variant="tertiary" className="rounded-xl md:rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="h-4 w-32 rounded bg-white/10 animate-pulse" />
                    <div className="h-5 w-14 rounded-full bg-white/10 animate-pulse" />
                  </div>
                  <div className="h-3 w-full max-w-[200px] rounded bg-white/10 animate-pulse mb-1" />
                  <div className="h-3 w-24 rounded bg-white/10 animate-pulse mb-3" />
                  <div className="h-10 w-full rounded-lg bg-white/10 animate-pulse mb-2" />
                  <div className="flex gap-2">
                    <div className="h-9 flex-1 rounded-lg bg-white/10 animate-pulse" />
                    <div className="h-9 flex-1 rounded-lg bg-white/10 animate-pulse" />
                  </div>
                </BaseCard>
              ) : pendingCollabRequestsCount === 0 ? (
                <BaseCard variant="tertiary" className={cn(spacing.cardPadding.secondary, "text-center")}>
                  <p className={typography.bodySmall}>No brand requests yet</p>
                  <p className={cn(typography.caption, "mt-1 text-purple-300/60")}>Share your collab link to receive requests.</p>
                  <motion.button
                    type="button"
                    onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/creator-collab'); }}
                    whileTap={animations.microTap}
                    className={cn("mt-3", sectionHeader.action)}
                  >
                    Share your collab link →
                  </motion.button>
                </BaseCard>
              ) : (
                <div className="space-y-6">
                  {/* Demo: same request in 3 UI variants (use first request) */}
                  {(() => {
                    const r = collabRequestsPreview[0];
                    if (!r) return null;
                    const isBarter = r.collab_type === 'barter';
                    const typeLabel = isBarter ? 'Barter' : 'Paid';
                    const offerDisplay =
                      !isBarter
                        ? (r.exact_budget ? `₹${Number(r.exact_budget).toLocaleString('en-IN')}` : (r.budget_range || '—'))
                        : (r.barter_value ? `Product worth ₹${Number(r.barter_value).toLocaleString('en-IN')}` : 'Product');
                    const deadline = r.deadline
                      ? new Date(r.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—';
                    const brandNameDisplay = r.brand_name ? r.brand_name.charAt(0).toUpperCase() + r.brand_name.slice(1) : 'Brand';

                    const acceptBtn = (
                      <div>
                        <button
                          type="button"
                          disabled={acceptingRequestId === r.id}
                          onClick={() => { triggerHaptic(HapticPatterns.light); acceptCollabRequest(r.raw); }}
                          className={cn(
                            "w-full min-h-[38px] inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm text-white",
                            "transition-colors duration-200 shadow-[0_2px_12px_rgba(139,92,246,0.25)]",
                            acceptingRequestId === r.id
                              ? "bg-[#4C1D95] text-[#A78BFA] opacity-70 pointer-events-none cursor-not-allowed"
                              : "bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:from-[#7C3AED] hover:to-[#4F46E5]"
                          )}
                        >
                          {acceptingRequestId === r.id ? <><Loader2 className="w-4 h-4 animate-spin" /> Accepting…</> : <><Check className="w-4 h-4" /> Accept Deal</>}
                        </button>
                        <p className="text-[10px] text-white/50 mt-1.5 text-center">Contract auto-generated • No payment risk</p>
                      </div>
                    );
                    const pill = (
                      <span className={cn("flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border", isBarter ? "bg-blue-500/20 text-blue-200 border-blue-500/30" : "bg-green-500/20 text-green-200 border-green-500/30")}>{typeLabel}</span>
                    );

                    return (
                      <BaseCard variant="tertiary" className="rounded-xl md:rounded-2xl">
                            <div className="flex items-center justify-between gap-2 min-w-0 mb-2">
                              <p className="font-bold text-white text-sm truncate flex-1 min-w-0">{brandNameDisplay}</p>
                              {pill}
                            </div>
                            <p className={cn(typography.caption, "text-white/70")}>{offerDisplay}</p>
                            <p className={cn(typography.caption, "mt-1 text-white/50")}>Due: {deadline}</p>
                            <div className="mt-2">{acceptBtn}</div>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => { triggerHaptic(HapticPatterns.light); navigate(`/collab-requests/${r.id}/counter`, { state: { request: r.raw } }); }}
                                className="flex-1 min-h-[36px] rounded-lg border border-[#A78BFA] bg-transparent text-[#DDD6FE] text-xs font-medium hover:bg-purple-500/10 transition-colors inline-flex items-center justify-center gap-1.5"
                                aria-label="Counter offer"
                              >
                                <FileEdit className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                Counter
                              </button>
                              <button
                                type="button"
                                onClick={() => { triggerHaptic(HapticPatterns.light); setDeclineRequestId(r.id); setShowDeclineRequestDialog(true); }}
                                className="flex-1 min-h-[36px] rounded-lg border border-red-700/50 bg-transparent text-[#FCA5A5] text-xs font-medium hover:bg-red-500/10 transition-colors inline-flex items-center justify-center gap-1.5"
                                aria-label="Decline"
                              >
                                <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                Decline
                              </button>
                            </div>
                            <p className={cn(typography.caption, "mt-1.5 text-white/40 text-center")}>
                              You can counter or decline anytime.
                            </p>
                          </BaseCard>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Desktop 2-Column Layout (≥1024px) */}
            <div className="lg:grid lg:grid-cols-[65%_35%] lg:gap-6 space-y-6 lg:space-y-0">
              {/* LEFT COLUMN - Primary Information */}
              <div className="space-y-6 lg:space-y-4">

                {/* Active Collaborations (accepted deals only) */}
                <div className="space-y-6 md:space-y-8">
                  <div className={sectionHeader.base}>
                    <h2 className={sectionHeader.title}>Active Collaborations</h2>
                    <button 
                      onClick={() => {
                        triggerHaptic(HapticPatterns.light);
                        navigate('/creator-contracts');
                      }}
                      className={sectionHeader.action}
                    >
                      View All →
                    </button>
                  </div>
                  {activeDeals.length === 0 ? (
                    <BaseCard variant="tertiary" className={cn(spacing.cardPadding.secondary, "text-center relative overflow-hidden")}>
                      {/* Spotlight */}
                      <div className={cn(vision.spotlight.base, "opacity-20")} />
                      <Briefcase className={cn(iconSizes.xl, "text-purple-400/50 mx-auto mb-3")} />
                      <p className={typography.bodySmall}>No active collaborations yet</p>
                      <p className={cn(typography.caption, "mt-1 text-purple-300/60")}>Once accepted via Brand Requests, Creator Armour protects you here.</p>
                      <motion.button
                        onClick={() => {
                          triggerHaptic(HapticPatterns.light);
                          navigate('/creator-collab');
                        }}
                        whileTap={animations.microTap}
                        className={cn("mt-4", sectionHeader.action)}
                      >
                        Share your collab link →
                      </motion.button>
                    </BaseCard>
                  ) : (
                    <div className={spacing.card}>
                      {(() => {
                        const risky = activeDeals.filter((d) => d.paymentStatus === 'overdue' || String(d.nextAction || '').toLowerCase().includes('overdue'));
                        const toShow = risky.slice(0, 2);
                        if (toShow.length === 0) {
                          return (
                            <BaseCard variant="tertiary" className={cn(spacing.cardPadding.secondary, "text-center border border-white/10 rounded-xl md:rounded-2xl")}>
                              <p className={typography.bodySmall}>All active collaborations look on track</p>
                              <p className={cn(typography.caption, "mt-1 text-white/50")}>No payments or deliverables need attention right now.</p>
                              <button
                                type="button"
                                onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/creator-contracts'); }}
                                className={cn("mt-3", sectionHeader.action)}
                              >
                                View all →
                              </button>
                            </BaseCard>
                          );
                        }
                        return toShow.map((deal, index) => (
                      <motion.div
                        key={deal.id}
                        initial={motionTokens.slide.up.initial}
                        animate={motionTokens.slide.up.animate}
                        transition={{ ...motionTokens.slide.up.transition, delay: index * 0.1 }}
                        whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
                        whileTap={animations.microTap}
                      >
                        <BaseCard 
                          variant="tertiary" 
                          className="rounded-xl md:rounded-2xl cursor-pointer hover:shadow-xl transition-shadow relative overflow-hidden w-full"
                          onClick={() => {
                            triggerHaptic(HapticPatterns.light);
                            navigate(`/creator-contracts/${deal.id}`);
                          }}
                        >
                          {/* Top row: Deal name (left) + Payment status (right) — same position as Incoming card brand name */}
                          <div className="flex items-center justify-between gap-2 min-w-0 mb-2">
                            <h3 className={cn(
                              typography.h4,
                              "text-base sm:text-lg font-bold truncate flex-1 min-w-0"
                            )}>
                              {deal.title}
                            </h3>
                            {deal.paymentStatus && (
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0",
                                deal.paymentStatus === 'received' && "bg-green-500/20 text-green-400 border border-green-500/30",
                                deal.paymentStatus === 'pending' && "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                                deal.paymentStatus === 'overdue' && "bg-red-500/20 text-red-400 border border-red-500/30"
                              )}>
                                {deal.paymentStatus === 'received' && 'Payment Received'}
                                {deal.paymentStatus === 'pending' && 'Payment Pending'}
                                {deal.paymentStatus === 'overdue' && 'Payment Overdue'}
                              </span>
                            )}
                          </div>

                          {/* Second row: Amount at risk + Due / days overdue */}
                          <div className={cn(
                            "flex items-center justify-between gap-2 text-xs text-white/70",
                            typography.caption
                          )}>
                            <span className={cn(
                              typography.amountSmall,
                              "text-orange-400 text-sm font-bold"
                            )}>
                              ₹{Math.round(deal.value).toLocaleString('en-IN')} at risk
                            </span>
                            {deal.deadline ? (() => {
                              const due = new Date(deal.deadline);
                              const now = new Date();
                              const daysOverdue = due < now ? Math.ceil((now.getTime() - due.getTime()) / (24 * 60 * 60 * 1000)) : 0;
                              return (
                                <span className="whitespace-nowrap">
                                  {daysOverdue > 0 ? (
                                    <span className="text-red-300/90 font-medium">{daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue</span>
                                  ) : (
                                    <>Due: {deal.deadline}</>
                                  )}
                                </span>
                              );
                            })() : (
                              <span className="whitespace-nowrap">Due: —</span>
                            )}
                          </div>
                          {/* Third row: deliverable / next action (below amount at risk) */}
                          <div className={cn(
                            "flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/70 mt-1",
                            typography.caption
                          )}>
                            {deal.nextAction && deal.deliverablesProgress && deal.deliverablesProgress.total > 0 ? (
                              <span>• {deal.nextAction} ({deal.deliverablesProgress.delivered}/{deal.deliverablesProgress.total})</span>
                            ) : (
                              <>
                                {deal.nextAction && <span>• {deal.nextAction}</span>}
                                {deal.deliverablesProgress && deal.deliverablesProgress.total > 0 && (
                                  <span>• {deal.deliverablesProgress.delivered}/{deal.deliverablesProgress.total} submitted</span>
                                )}
                              </>
                            )}
                          </div>

                          {/* Bottom: Primary CTA — button style for clarity */}
                          <div className="mt-3 pt-2 border-t border-white/10">
                            {deal.paymentStatus === 'overdue' ? (
                              <>
                                <span className={cn(
                                  "inline-flex items-center justify-center gap-1.5 w-full min-h-[36px] rounded-lg text-xs font-semibold text-white",
                                  "bg-gradient-to-r from-[#EF4444] to-[#F97316] hover:from-[#DC2626] hover:to-[#EA580C] transition-colors shadow-[0_2px_12px_rgba(239,68,68,0.3)]",
                                  deal.deadline && (Date.now() - new Date(deal.deadline).getTime() > 3 * 24 * 60 * 60 * 1000) && "animate-pulse"
                                )}>
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Resolve Payment
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                                <p className={cn(typography.caption, "mt-1 text-center text-white/40")}>
                                  Opens contract to resolve payment
                                </p>
                              </>
                            ) : (
                              <span className={cn("inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-200", sectionHeader.action)}>
                                View deal
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </BaseCard>
                      </motion.div>
                        ));
                      })()}
                    </div>
                  )}
                </div>

                {/* Collab Link — utility card (Copy | Preview only) */}
                <div className="space-y-6 md:space-y-8">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-purple-300 flex-shrink-0" />
                    <p className={cn("text-sm font-medium text-white/90")}>All brand deals start here</p>
                  </div>
                  {(profile?.instagram_handle || profile?.username) ? (
                    <BaseCard variant="tertiary" className="p-4 border border-white/10">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 min-w-0 truncate text-sm text-purple-200 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                          creatorarmour.com/collab/{profile?.instagram_handle || profile?.username}
                        </code>
                        <motion.button
                          type="button"
                          aria-label="Copy link"
                          whileTap={animations.microTap}
                          onClick={() => {
                            const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/collab/${profile?.instagram_handle || profile?.username}`;
                            navigator.clipboard?.writeText(link);
                            setCollabLinkCopied(true);
                            toast.success('Link copied');
                            triggerHaptic(HapticPatterns.light);
                            setTimeout(() => setCollabLinkCopied(false), 2000);
                          }}
                          className={cn(
                            "flex-shrink-0 p-2 rounded-lg border transition-colors",
                            collabLinkCopied ? "bg-green-500/20 border-green-500/40 text-green-300" : "border-white/20 bg-white/5 text-purple-200 hover:bg-white/10"
                          )}
                        >
                          {collabLinkCopied ? <span className="text-xs font-medium">Copied!</span> : <Copy className="w-4 h-4" />}
                        </motion.button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <motion.button
                          type="button"
                          whileTap={animations.microTap}
                          onClick={() => {
                            const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/collab/${profile?.instagram_handle || profile?.username}`;
                            navigator.clipboard?.writeText(link);
                            setCollabLinkCopied(true);
                            toast.success('Link copied');
                            triggerHaptic(HapticPatterns.light);
                            setTimeout(() => setCollabLinkCopied(false), 2000);
                          }}
                          className={cn(buttons.secondary, "flex-1 min-h-[44px] min-w-[80px] flex items-center justify-center gap-2 text-purple-100 border-purple-400/40")}
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </motion.button>
                        <motion.button
                          type="button"
                          whileTap={animations.microTap}
                          onClick={() => {
                            const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/collab/${profile?.instagram_handle || profile?.username}`;
                            const message = encodeURIComponent(`For collaborations, submit here:\n\n${link}`);
                            window.open(`https://wa.me/?text=${message}`, '_blank');
                            toast.success('Opening WhatsApp…');
                            triggerHaptic(HapticPatterns.light);
                          }}
                          className={cn(buttons.secondary, "flex-1 min-h-[44px] min-w-[80px] flex items-center justify-center gap-2 text-purple-100 border-purple-400/40")}
                          aria-label="Share via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </motion.button>
                        <motion.button
                          type="button"
                          whileTap={animations.microTap}
                          onClick={() => {
                            const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/collab/${profile?.instagram_handle || profile?.username}`;
                            navigator.clipboard?.writeText(link);
                            setCollabLinkCopied(true);
                            toast.success('Link copied. Paste in bio or DMs.');
                            triggerHaptic(HapticPatterns.light);
                            setTimeout(() => setCollabLinkCopied(false), 2000);
                          }}
                          className={cn(buttons.secondary, "flex-1 min-h-[44px] min-w-[80px] flex items-center justify-center gap-2 text-purple-100 border-purple-400/40")}
                          aria-label="Share via Instagram"
                        >
                          <Instagram className="w-4 h-4" />
                          Instagram
                        </motion.button>
                        <motion.button
                          type="button"
                          whileTap={animations.microTap}
                          onClick={() => { triggerHaptic(HapticPatterns.light); window.open(`/collab/${profile?.instagram_handle || profile?.username}`, '_blank'); }}
                          className={cn(buttons.secondary, "flex-1 min-h-[44px] min-w-[80px] flex items-center justify-center gap-2 text-purple-100 border-purple-400/40")}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Preview
                        </motion.button>
                      </div>
                    </BaseCard>
                  ) : (
                    <p className={cn(typography.caption, "text-purple-300/60")}>Complete your profile to get your link.</p>
                  )}
                </div>

                {/* Collab Link Analytics — below Collab Link on home */}
                <div className="space-y-6 md:space-y-8">
                  <CollabLinkAnalytics />
                </div>

                {/* Section Separator */}
            <div className={separators.section} />

                {/* Legal Power: only show when a payment is overdue */}
                {hasPaymentOverdue && (
                <div className="space-y-6 md:space-y-8">
                  <BaseCard variant="secondary" className={cn("relative overflow-hidden")}>
                    {/* Background glow */}
                    <div className={cn("absolute top-0 right-0 w-32 h-32", radius.full, "bg-orange-500/10 blur-3xl")} />
                    
                    <div className="relative z-10">
                      <div className={cn("flex items-start justify-between gap-4 mb-4")}>
                        <div className="flex-1">
                          <h3 className={cn(typography.h3, "mb-2")}>Legal Power Ready</h3>
                          <p className={cn(typography.bodySmall, "text-purple-200")}>
                            Send a legal notice instantly if a brand delays or refuses payment.
                          </p>
                          <p className={cn(typography.caption, "mt-1 text-purple-300/80")}>
                            A formal notice is sent to the brand to resolve the payment.
                          </p>
                        </div>
                        <div className={cn(
                          "w-12 h-12",
                          radius.full,
                          "bg-orange-500/20 flex items-center justify-center flex-shrink-0",
                          shadows.sm
                        )}>
                          <Shield className={cn(iconSizes.md, "text-orange-400")} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <motion.button
                          onClick={() => {
                            triggerHaptic(HapticPatterns.medium);
                            navigate('/creator-contracts');
                          }}
                          whileTap={animations.microTap}
                          className={cn(
                            buttons.primary,
                            "w-full flex items-center justify-center gap-2",
                            "min-h-[44px]"
                          )}
                        >
                          <Shield className={iconSizes.md} />
                          Send Legal Notice
                        </motion.button>
                        <p className={cn(typography.caption, "text-center text-purple-300/70")}>
                          We&apos;ll send a formal notice to the brand
                        </p>
                        <p className={cn(typography.caption, "text-center text-purple-300/60")}>
                          Includes free legal notices & lawyer reviews
                        </p>
                      </div>
                    </div>
                  </BaseCard>
                </div>
                )}

              </div>

              {/* RIGHT COLUMN - Secondary Actions and Status */}
              <div className="space-y-6 lg:space-y-4">
                {/* Collaboration Tools moved to /creator-collab */}

                {/* Status Summary Cards - Desktop Only */}
                <div className="hidden lg:block space-y-3">
                  <div className={sectionHeader.base}>
                    <h2 className={sectionHeader.title}>Status Summary</h2>
                  </div>
                  {Math.round(stats.pendingPayments) > 0 ? (
                    <div className="space-y-2">
                      <StatCard
                        label="Action Required"
                        value={Math.round(stats.pendingPayments)}
                        icon={<CreditCard className={`${iconSizes.sm} text-amber-400`} />}
                        variant="tertiary"
                        className="border-amber-500/30 bg-amber-500/5"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <StatCard
                          label="Deals Monitored"
                          value={stats.totalDeals}
                          icon={<Briefcase className={`${iconSizes.sm} text-blue-400`} />}
                          variant="tertiary"
                          showAffordance={true}
                        />
                        <StatCard
                          label="Under Protection"
                          value={stats.activeDeals}
                          icon={<BarChart3 className={`${iconSizes.sm} text-green-400`} />}
                          variant="tertiary"
                          showAffordance={true}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <StatCard
                        label="Deals Monitored"
                        value={stats.totalDeals}
                        icon={<Briefcase className={`${iconSizes.sm} text-blue-400`} />}
                        variant="tertiary"
                        showAffordance={true}
                      />
                      <StatCard
                        label="Under Protection"
                        value={stats.activeDeals}
                        icon={<BarChart3 className={`${iconSizes.sm} text-green-400`} />}
                        variant="tertiary"
                        showAffordance={true}
                      />
                      <StatCard
                        label="Action Required"
                        value={Math.round(stats.pendingPayments)}
                        icon={<CreditCard className={`${iconSizes.sm} text-orange-400`} />}
                        variant="tertiary"
                        subtitle="No action needed 🎉"
                      />
                    </div>
                  )}
                </div>

                {/* Optional Calm-State Nudge - Show when Action Required = 0 and Money at risk = 0 */}
                {Math.round(stats.pendingPayments) === 0 && stats.earnings === 0 && (() => {
                  const stored = typeof window !== 'undefined' && localStorage.getItem(`dashboard-hint-dismissed-${user?.id || 'anonymous'}`) === 'true';
                  if (hintDismissed || stored) return null;
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 px-2"
                    >
                      <div aria-live="polite" aria-atomic="true" className="sr-only" id="dashboard-hint-live" />
                      <BaseCard variant="secondary" className={cn(
                        "relative p-4",
                        "bg-gradient-to-r from-purple-500/10 to-indigo-500/10",
                        "border border-purple-500/20"
                      )}>
                        <div className="flex items-start justify-between gap-3">
                          <p className={cn(typography.bodySmall, "text-purple-200/90 leading-relaxed flex-1")}>
                            💡 Most payment issues start from unclear contracts. Protecting deals early saves weeks later.
                          </p>
                          <button
                            onClick={() => {
                              localStorage.setItem(`dashboard-hint-dismissed-${user?.id || 'anonymous'}`, 'true');
                              setHintDismissed(true);
                              triggerHaptic(HapticPatterns.light);
                              const live = document.getElementById('dashboard-hint-live');
                              if (live) live.textContent = 'Tip dismissed';
                            }}
                            className="flex-shrink-0 text-purple-300/60 hover:text-purple-300 transition-colors"
                            aria-label="Dismiss hint"
                          >
                            <XCircle className={iconSizes.sm} />
                          </button>
                        </div>
                      </BaseCard>
                    </motion.div>
                  );
                })()}
              </div>
            </div>
              </>
            )}
          </>
        )}
          </main>

      {/* Tutorial Component */}
      {showTutorial && (
        <DashboardTutorial
          onComplete={() => {
            setShowTutorial(false);
          }}
          onSkip={() => {
            setShowTutorial(false);
          }}
        />
      )}


      {/* Global Search */}
      <QuickSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={(result) => {
          if (result.url) {
            navigate(result.url);
          }
        }}
      />

    </div>
    </ContextualTipsProvider>
  );
};

export default CreatorDashboard;
