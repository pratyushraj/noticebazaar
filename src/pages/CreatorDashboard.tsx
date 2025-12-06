"use client";

import { useState, useEffect, useMemo } from 'react';
import { Home, Briefcase, CreditCard, Shield, MessageCircle, TrendingUp, DollarSign, Calendar, FileText, AlertCircle, Clock, ChevronRight, Plus, Search, Target, BarChart3, RefreshCw, LogOut, Loader2, Sparkles, XCircle } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSignOut } from '@/lib/hooks/useAuth';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { usePartnerStats } from '@/lib/hooks/usePartnerProgram';
import { logger } from '@/lib/utils/logger';
import { getInitials } from '@/lib/utils/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
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
  const { profile, user, loading: sessionLoading, session } = useSession();
  const [activeTab, setActiveTab] = useState('home');
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [timeframe, setTimeframe] = useState<'month' | 'lastMonth' | 'allTime'>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickActionsSheet, setShowQuickActionsSheet] = useState(false);

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

  // Check if user just completed onboarding (show welcome banner)
  useEffect(() => {
    if (profile?.onboarding_complete) {
      // Check if onboarding was completed recently (within last 24 hours)
      const onboardingDate = profile.updated_at ? new Date(profile.updated_at) : null;
      if (onboardingDate) {
        const hoursSinceOnboarding = (Date.now() - onboardingDate.getTime()) / (1000 * 60 * 60);
        if (hoursSinceOnboarding < 24) {
          setShowWelcomeBanner(true);
          // Auto-hide after 10 seconds
          const timer = setTimeout(() => setShowWelcomeBanner(false), 10000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [profile]);

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
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    triggerHaptic(HapticPatterns.light);
  };

  // User data from session
  const userData = useMemo(() => ({
    name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Creator',
    displayName: profile?.instagram_handle?.replace('@', '') || user?.email?.split('@')[0] || 'creator',
    userType: "Content Creator",
    streak: 0, // TODO: Calculate from actual streak data when available
    avatar: getInitials(profile?.first_name || null, profile?.last_name || null)
  }), [profile, user, partnerStats]);

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
                     brandDealsError?.code === '42501';
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

  // Recent activity from real deals
  const recentActivity = useMemo(() => {
    if (hasNoData) return [];
    
    const activities: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      time: string;
      icon: typeof DollarSign;
      color: string;
      bgColor: string;
    }> = [];

    // Get recent payments
    const recentPayments = brandDeals
      .filter(deal => deal.payment_received_date)
      .sort((a, b) => {
        const dateA = new Date(a.payment_received_date!).getTime();
        const dateB = new Date(b.payment_received_date!).getTime();
        return dateB - dateA;
      })
      .slice(0, 2);

    recentPayments.forEach(deal => {
      const date = new Date(deal.payment_received_date!);
      const hoursAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
      activities.push({
        id: `payment-${deal.id}`,
        type: "payment_received",
        title: "Payment Received",
        description: `${deal.brand_name} - ₹${deal.deal_amount.toLocaleString('en-IN')}`,
        time: hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.floor(hoursAgo / 24)} days ago`,
        icon: DollarSign,
        color: "text-green-400",
        bgColor: "bg-green-500/20"
      });
    });

    // Get upcoming due dates
    const upcomingDue = brandDeals
      .filter(deal => deal.due_date && !deal.payment_received_date)
      .sort((a, b) => {
        const dateA = new Date(a.due_date!).getTime();
        const dateB = new Date(b.due_date!).getTime();
        return dateA - dateB;
      })
      .slice(0, 1);

    upcomingDue.forEach(deal => {
      const date = new Date(deal.due_date!);
      const daysUntil = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 7) {
        activities.push({
          id: `due-${deal.id}`,
          type: "contract_alert",
          title: daysUntil < 0 ? "Overdue" : "Due Soon",
          description: `${deal.brand_name} ${daysUntil < 0 ? 'overdue' : `due in ${daysUntil} days`}`,
          time: daysUntil < 0 ? "Overdue" : `${daysUntil} days left`,
          icon: AlertCircle,
          color: daysUntil < 0 ? "text-red-400" : "text-yellow-400",
          bgColor: daysUntil < 0 ? "bg-red-500/20" : "bg-yellow-500/20"
        });
      }
    });

    return activities.slice(0, 3);
  }, [brandDeals, hasNoData]);

  // Active deals preview from real data
  // Active = not completed and not fully paid (payment_received_date is null or status is not 'Completed')
  const activeDealsPreview = useMemo(() => {
    if (hasNoData) return [];
    
    return brandDeals
      .filter(deal => {
        // Exclude only completed deals
        if (deal.status === 'Completed') return false;
        
        // Include all other deals (Drafting, Payment Pending, Approved, etc.)
        // This ensures we show deals that are in progress
        return true;
      })
      .sort((a, b) => {
        // Sort by due date (most urgent first), then by created date (newest first)
        const dateA = new Date(a.due_date || a.created_at).getTime();
        const dateB = new Date(b.due_date || b.created_at).getTime();
        return dateA - dateB; // Sort ascending (earliest due date first)
      })
      .slice(0, 2)
      .map(deal => ({
        id: deal.id,
        brand: deal.brand_name,
        amount: deal.deal_amount,
        status: deal.status,
        dueDate: deal.due_date,
        progress: deal.progress_percentage ?? (deal.status === 'Completed' ? 100 : deal.status === 'Content Delivered' ? 90 : deal.status === 'Content Making' ? 80 : deal.status === 'Signed' ? 70 : 30)
      }));
  }, [brandDeals, hasNoData]);

  // Active deals formatted for display
  const activeDeals = activeDealsPreview.map(deal => ({
    id: deal.id,
    title: `${deal.brand} Deal`,
    brand: deal.brand,
    value: deal.amount,
    progress: deal.progress,
    status: (deal.status === 'Content Delivered' || deal.status === 'Content Making' || deal.status === 'Signed') ? 'active' : 'negotiation',
    deadline: deal.dueDate ? new Date(deal.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'
  }));

  // Upcoming payments
  const upcomingPayments = [
    {
      id: 1,
      title: "TechGear Pro Sponsorship",
      amount: 75000,
      date: "Nov 30, 2024",
      status: "pending"
    },
    {
      id: 2,
      title: "SkillShare Affiliate",
      amount: 45000,
      date: "Dec 5, 2024",
      status: "processing"
    }
  ];

  // Quick actions
  const quickActions = [
    {
      id: 1,
      icon: FileText,
      label: "Upload Contract",
      color: "bg-purple-500/20",
      iconColor: "text-purple-400",
      onClick: () => navigate('/contract-upload')
    },
    {
      id: 2,
      icon: Plus,
      label: "Add Deal",
      color: "bg-blue-500/20",
      iconColor: "text-blue-400",
      onClick: () => {
        navigate('/contract-upload');
        triggerHaptic(HapticPatterns.light);
      }
    },
    {
      id: 3,
      icon: MessageCircle,
      label: "Message Advisor",
      color: "bg-green-500/20",
      iconColor: "text-green-400",
      onClick: () => navigate('/messages')
    },
    {
      id: 4,
      icon: Calendar,
      label: "Schedule Call",
      color: "bg-orange-500/20",
      iconColor: "text-orange-400",
      onClick: () => navigate('/messages')
    }
  ];


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Import enhanced skeleton (fallback to inline if import fails)

    return (
    <ContextualTipsProvider currentView="dashboard">
    <div className={`min-h-full ${gradients.page} text-white overflow-x-hidden`}>
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
          paddingTop: 'max(20px, env(safe-area-inset-top, 20px))',
          paddingBottom: '16px',
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
          "py-3 relative z-10",
          // Better spacing on mobile
          "px-4 sm:px-5"
        )}>
          {/* Creator Avatar - Replaces Menu Icon */}
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
            aria-label={showMenu ? "Close menu" : "Open profile menu"}
          >
            {userData.avatar}
          </motion.button>
          
          <div className={typography.h4}>NoticeBazaar</div>
          
          <div className="flex items-center gap-2">
            <motion.button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              whileTap={animations.microTap}
              className={cn(buttons.icon, isRefreshing && 'animate-spin')}
              aria-label="Refresh data"
            >
              <RefreshCw className={iconSizes.md} />
            </motion.button>
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


      {/* Welcome Banner for New Users */}
      <AnimatePresence>
        {showWelcomeBanner && !currentTip && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`sticky top-16 z-40 ${spacing.page} mt-4 mb-4 max-h-[calc(100vh-120px)] ${scroll.container}`}
          >
            <BaseCard variant="primary" className={cn("relative overflow-hidden", glass.apple, shadows.depth)}>
              {/* Spotlight gradient */}
              <div className={cn(spotlight.top, "opacity-30")} />
              
              <div className={cn("flex items-start justify-between", spacing.compact)}>
                <div className={cn("flex items-start gap-3 flex-1")}>
                  <div className={cn(
                    "w-10 h-10",
                    radius.full,
                    "bg-white/20 flex items-center justify-center flex-shrink-0",
                    shadows.sm
                  )}>
                    <Sparkles className={cn(iconSizes.md, "text-white")} />
                  </div>
                  <div className="flex-1">
                    <h3 className={cn(typography.h4, "mb-1")}>Welcome to NoticeBazaar! 🎉</h3>
                    <p className={cn(typography.bodySmall, "break-words")}>
                      Your dashboard is ready. Start by adding your first brand deal to track payments and contracts.
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowWelcomeBanner(false)}
                  whileTap={animations.microTap}
                  className={cn(
                    spacing.cardPadding.tertiary,
                    "hover:bg-white/20",
                    radius.md,
                    "transition-colors flex-shrink-0"
                  )}
                  aria-label="Dismiss welcome banner"
                >
                  <XCircle className={cn(iconSizes.md, "text-white/80")} />
                </motion.button>
              </div>
              <div className={cn("mt-3 flex gap-2")}>
                <PremiumButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    navigate('/creator-contracts');
                    setShowWelcomeBanner(false);
                  }}
                >
                  Add Your First Deal
                </PremiumButton>
                <motion.button
                  onClick={() => setShowWelcomeBanner(false)}
                  whileTap={animations.microTap}
                  className={cn(
                    spacing.cardPadding.tertiary,
                    "bg-white/10 hover:bg-white/20 text-white/90",
                    typography.bodySmall,
                    "font-medium",
                    radius.md
                  )}
                >
                  Explore Dashboard
                </motion.button>
              </div>
            </BaseCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
      >
        Skip to main content
      </a>

      {/* Main Content */}
      <main id="main-content" className={`${sectionLayout.container} ${scroll.container}`}>
        {/* Home Tab */}
        {activeTab === 'home' && (
          <>
            {isInitialLoading ? (
              <div className={sectionLayout.container}>
                <EnhancedDashboardSkeleton />
              </div>
            ) : hasNoData ? (
              // Empty State for New Users
              <div className="space-y-6">
                {/* Greeting */}
                <div className={sectionLayout.header}>
                  <h1 className={typography.h1 + " mb-2 leading-tight"}>
                    {getGreeting()}, {userData.name}! 👋
                  </h1>
                  <p className={typography.body + " leading-relaxed"}>Let's get you started with your first brand deal.</p>
                </div>

                {/* Empty State Card */}
                <BaseCard variant="secondary" className="text-center p-6 md:p-8 relative" style={{ pointerEvents: 'auto' }}>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <Briefcase className={`${iconSizes.xl} text-purple-400`} />
                  </motion.div>
                  <h2 className={typography.h2 + " mb-3"}>Welcome to Your Dashboard!</h2>
                  <p className={typography.body + " mb-6 max-w-md mx-auto"}>
                    Start tracking your brand deals, payments, and contracts. Add your first deal to see your earnings and activity here.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center relative" style={{ zIndex: 50, pointerEvents: 'auto' }}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        triggerHaptic(HapticPatterns.medium);
                        navigate('/creator-contracts');
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      className={cn(
                        buttons.primary,
                        "flex items-center justify-center gap-2",
                        "cursor-pointer",
                        "pointer-events-auto",
                        "touch-manipulation",
                        "select-none",
                        "min-h-[44px]",
                        "will-change-transform"
                      )}
                      type="button"
                      style={{ 
                        pointerEvents: 'auto',
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        position: 'relative',
                        zIndex: 50,
                        isolation: 'isolate'
                      }}
                      aria-label="Add Your First Deal"
                    >
                      <Plus className={iconSizes.md} />
                      Add Your First Deal
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        triggerHaptic(HapticPatterns.light);
                        navigate('/brand-directory');
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      className={cn(
                        buttons.secondary,
                        "flex items-center justify-center gap-2",
                        "cursor-pointer",
                        "pointer-events-auto",
                        "touch-manipulation",
                        "select-none",
                        "min-h-[44px]",
                        "will-change-transform"
                      )}
                      type="button"
                      style={{ 
                        pointerEvents: 'auto',
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        position: 'relative',
                        zIndex: 50,
                        isolation: 'isolate'
                      }}
                      aria-label="Explore Brands"
                    >
                      <Briefcase className={iconSizes.md} />
                      Explore Brands
                    </button>
                  </div>
                </BaseCard>

                {/* Quick Start Guide */}
                <SectionCard 
                  variant="secondary"
                  title="Quick Start Guide"
                  icon={<Target className="w-5 h-5 text-purple-400" />}
                >
                  <div className="grid md:grid-cols-3 gap-4">
                    <motion.div
                      onClick={() => {
                        triggerHaptic(HapticPatterns.light);
                        navigate('/creator-contracts');
                      }}
                      whileTap={animations.microTap}
                      className="cursor-pointer"
                    >
                      <BaseCard variant="tertiary" interactive>
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                          <Briefcase className={`${iconSizes.md} text-purple-400`} />
                        </div>
                        <h4 className={typography.h4 + " mb-1"}>Add Brand Deals</h4>
                        <p className={typography.bodySmall}>Track your partnerships and contracts</p>
                      </BaseCard>
                    </motion.div>
                    <motion.div
                      onClick={() => {
                        triggerHaptic(HapticPatterns.light);
                        navigate('/creator-payments');
                      }}
                      whileTap={animations.microTap}
                      className="cursor-pointer"
                    >
                      <BaseCard variant="tertiary" interactive>
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
                          <CreditCard className={`${iconSizes.md} text-green-400`} />
                        </div>
                        <h4 className={typography.h4 + " mb-1"}>Track Payments</h4>
                        <p className={typography.bodySmall}>Monitor incoming and pending payments</p>
                      </BaseCard>
                    </motion.div>
                    <motion.div
                      onClick={() => {
                        triggerHaptic(HapticPatterns.light);
                        navigate('/creator-content-protection');
                      }}
                      whileTap={animations.microTap}
                      className="cursor-pointer"
                    >
                      <BaseCard variant="tertiary" interactive>
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                          <Shield className={`${iconSizes.md} text-blue-400`} />
                        </div>
                        <h4 className={typography.h4 + " mb-1"}>Protect Content</h4>
                        <p className={typography.bodySmall}>Register and monitor your content</p>
                      </BaseCard>
                    </motion.div>
                  </div>
                </SectionCard>
                    </div>
            ) : (
              <div className={spacing.section}>
            {/* Greeting */}
            <div className={sectionLayout.header}>
              <h1 className={typography.h1 + " mb-2 leading-tight"}>
                {getGreeting()}, <br />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                  {userData.displayName}!
                </span> 👋
              </h1>
              {/* Compact Summary Strip */}
              <div className={`mt-3 flex flex-wrap items-center gap-2 ${typography.bodySmall}`}>
                <span className="px-2.5 py-1 bg-orange-500/20 text-orange-400 rounded-full flex items-center gap-1.5 font-medium">
                  🔥 {userData.streak}-week streak
                </span>
                <span className="text-purple-300/60">•</span>
                <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-full flex items-center gap-1.5 font-medium">
                  {stats.activeDeals} active {stats.activeDeals === 1 ? 'deal' : 'deals'}
                </span>
                <span className="text-purple-300/60">•</span>
                <span className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full flex items-center gap-1.5 font-medium">
                  ₹{Math.round(calculatedStats.allTime.earnings).toLocaleString('en-IN')} lifetime value
                </span>
                  </div>
                </div>

            {/* Quick Stats Row */}
            <div data-tutorial="stats-grid" className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-full px-2 mb-4">
              <StatCard
                label="Total Deals"
                value={stats.totalDeals}
                icon={<Briefcase className={`${iconSizes.sm} text-blue-400`} />}
                variant="tertiary"
              />
              <StatCard
                label="Active"
                value={stats.activeDeals}
                icon={<BarChart3 className={`${iconSizes.sm} text-green-400`} />}
                variant="tertiary"
              />
              <StatCard
                label="Pending"
                value={Math.round(stats.pendingPayments)}
                icon={<CreditCard className={`${iconSizes.sm} text-orange-400`} />}
                variant="tertiary"
              />
            </div>

            {/* Main Earnings Card - iOS 17 + visionOS */}
            <motion.div 
              data-tutorial="earnings-card"
              onClick={() => {
                triggerHaptic(HapticPatterns.medium);
                navigate('/creator-analytics');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerHaptic(HapticPatterns.medium);
                  navigate('/creator-analytics');
                }
              }}
              whileTap={animations.microTap}
              whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
              className={cn(
                "w-full relative overflow-hidden text-left",
                glass.apple,
                shadows.vision,
                radius.lg,
                "p-4 sm:p-6", // Smaller padding on mobile
                animations.cardHover,
                "transition-all duration-200",
                "cursor-pointer"
              )}
              role="button"
              tabIndex={0}
              aria-label="View analytics"
            >
              {/* Vision Pro depth elevation */}
              <div className={vision.depth.elevation} />
              
              {/* Spotlight gradient */}
              <div className={cn(vision.spotlight.base, "opacity-40")} />
              
              {/* Glare effect */}
              <div className={vision.glare.soft} />
              
              {/* Background glow */}
              <div className={cn("absolute top-0 right-0 w-32 h-32", radius.full, "bg-purple-500/10 blur-3xl")} />
              
              <div className="relative z-10">
                {/* Timeframe Selector - Mobile: Stack, Desktop: Side by side */}
                <div className={cn(
                  "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2",
                  spacing.compact
                )}>
                  <div className={cn("flex items-center gap-2")}>
                    <div className={cn(
                      "w-10 h-10",
                      radius.full,
                      "bg-purple-500/20 flex items-center justify-center",
                      shadows.sm
                    )}>
                      <DollarSign className={cn(iconSizes.md, "text-purple-300")} />
                    </div>
                    <span className={cn(typography.body, "font-medium")}>Earnings</span>
                  </div>
                  <div className={cn(
                    "flex gap-1.5 sm:gap-1 w-full sm:w-auto",
                    glass.appleSubtle,
                    radius.md,
                    "p-1.5 sm:p-2",
                    "overflow-x-auto sm:overflow-visible", // Allow horizontal scroll on mobile if needed
                    "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  )}>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTimeframe('month');
                        triggerHaptic(HapticPatterns.light);
                      }}
                      whileTap={animations.microTap}
                      className={cn(
                        "px-3 py-2 sm:px-2 sm:py-1.5",
                        "text-xs sm:text-sm",
                        radius.sm,
                        "transition-all whitespace-nowrap",
                        "min-h-[36px] sm:min-h-0", // Better touch target on mobile
                        timeframe === 'month'
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-300 hover:text-white'
                      )}
                      aria-label="View this month's earnings"
                    >
                      This Month
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTimeframe('lastMonth');
                        triggerHaptic(HapticPatterns.light);
                      }}
                      whileTap={animations.microTap}
                      className={cn(
                        "px-3 py-2 sm:px-2 sm:py-1.5",
                        "text-xs sm:text-sm",
                        radius.sm,
                        "transition-all whitespace-nowrap",
                        "min-h-[36px] sm:min-h-0",
                        timeframe === 'lastMonth'
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-300 hover:text-white'
                      )}
                      aria-label="View last month's earnings"
                    >
                      Last Month
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTimeframe('allTime');
                        triggerHaptic(HapticPatterns.light);
                      }}
                      whileTap={animations.microTap}
                      className={cn(
                        "px-3 py-2 sm:px-2 sm:py-1.5",
                        "text-xs sm:text-sm",
                        radius.sm,
                        "transition-all whitespace-nowrap",
                        "min-h-[36px] sm:min-h-0",
                        timeframe === 'allTime'
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-300 hover:text-white'
                      )}
                      aria-label="View all time earnings"
                    >
                      All Time
                    </motion.button>
                  </div>
                </div>

                {/* Earnings Amount and Growth - Mobile: Stack, Desktop: Side by side */}
                <div className={cn(
                  "flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-2",
                  "mt-4 sm:mt-2"
                )}>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "text-3xl sm:text-4xl md:text-5xl font-bold tabular-nums mb-2",
                      "leading-tight"
                    )}>₹{stats.earnings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    <div className={cn("flex flex-wrap items-center gap-2")}>
                      <span className={cn("text-green-400", typography.bodySmall, "flex items-center gap-1")}>
                        <TrendingUp className={iconSizes.sm} />
                        +{stats.monthlyGrowth}%
                      </span>
                      <span className={cn("text-purple-300", typography.bodySmall)}>
                        {timeframe === 'month' ? 'vs last month' : timeframe === 'lastMonth' ? 'vs previous' : 'growth'}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-purple-300",
                    typography.bodySmall,
                    "self-start sm:self-end", // Align left on mobile, right on desktop
                    "pt-1 sm:pt-0"
                  )}>
                    <span>View Details</span>
                    <ChevronRight className={iconSizes.sm} />
                  </div>
                </div>

                {/* Goal Progress bar with labels - Mobile optimized */}
                <div className={cn("mt-4 sm:mt-5")}>
                  <div className={cn(
                    "flex items-center justify-between",
                    typography.caption,
                    "mb-2 sm:mb-1.5",
                    "text-xs sm:text-xs"
                  )}>
                    <span className={cn("flex items-center gap-1", "truncate")}>
                      <Target className={cn(iconSizes.xs, "flex-shrink-0")} />
                      <span className="truncate">Progress to Goal</span>
                    </span>
                    <span className={cn(
                      typography.bodySmall,
                      "font-semibold flex-shrink-0 ml-2",
                      "text-xs sm:text-sm"
                    )}>{earningsProgress.toFixed(0)}%</span>
                  </div>
                  <div className={cn(
                    "relative w-full",
                    colors.bg.secondary,
                    radius.full,
                    "h-2.5 sm:h-3 overflow-hidden"
                  )}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(earningsProgress, 100)}%` }}
                      transition={motionTokens.spring.gentle}
                      className={cn(
                        "bg-gradient-to-r from-teal-500 to-cyan-500 h-2.5 sm:h-3",
                        radius.full,
                        shadows.lg,
                        "shadow-teal-500/30"
                      )}
                    />
                  </div>
                  <div className={cn(
                    "flex items-center justify-between",
                    typography.caption,
                    "mt-1.5 sm:mt-1",
                    "text-xs sm:text-xs",
                    "gap-2"
                  )}>
                    <span className="truncate">₹{Math.round(stats.earnings).toLocaleString('en-IN')} earned</span>
                    <span className="flex-shrink-0">Goal: ₹{Math.round(stats.goal).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section Separator */}
            <div className={separators.section} />

            {/* Quick Actions - Enhanced with spacing and animations */}
            <div data-tutorial="quick-actions" className={spacing.loose}>
              <div className={sectionHeader.base}>
                <h2 className={sectionHeader.title}>Quick Actions</h2>
                {/* Mobile: Show bottom sheet button */}
                <button
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    setShowQuickActionsSheet(true);
                  }}
                  className={`${sectionHeader.action} md:hidden`}
                >
                  View All
                </button>
                </div>
              <div className="grid grid-cols-2 gap-4 md:gap-5">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.div
                      key={action.id}
                      initial={motionTokens.slide.up.initial}
                      animate={motionTokens.slide.up.animate}
                      transition={{ ...motionTokens.slide.up.transition, delay: index * 0.1 }}
                      whileTap={animations.microTap}
                      whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <ActionCard
                        icon={<Icon className={cn(iconSizes.lg, action.iconColor)} />}
                        label={action.label}
                        onClick={(e) => {
                          if (e) {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                          triggerHaptic(HapticPatterns.light);
                          if (import.meta.env.DEV) {
                            console.log('[CreatorDashboard] Action clicked:', action.label);
                          }
                          try {
                            action.onClick();
                          } catch (error) {
                            console.error('[CreatorDashboard] Error in action onClick:', error);
                          }
                        }}
                        variant="tertiary"
                        className={action.color}
                      />
                    </motion.div>
                  );
                })}
                </div>
                </div>

            {/* Section Separator */}
            <div className={separators.section} />

            {/* Active Deals Preview - Enhanced spacing */}
            <div className={spacing.loose}>
              <div className={sectionHeader.base}>
                <h2 className={sectionHeader.title}>Active Deals</h2>
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
                  <p className={typography.bodySmall}>No active deals yet</p>
                  <motion.button
                    onClick={() => {
                      triggerHaptic(HapticPatterns.light);
                      navigate('/creator-contracts');
                    }}
                    whileTap={animations.microTap}
                    className={cn("mt-4", sectionHeader.action)}
                  >
                    View all deals →
                  </motion.button>
                </BaseCard>
              ) : (
                <div className={spacing.card}>
                  {activeDeals.map((deal, index) => (
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
                      className={cn(
                        animations.cardHover,
                        "cursor-pointer relative overflow-hidden"
                      )}
                      onClick={() => {
                        triggerHaptic(HapticPatterns.light);
                        navigate(`/creator-contracts/${deal.id}`);
                      }}
                    >
                      {/* Spotlight on hover */}
                      <div className={cn(vision.spotlight.hover, "opacity-0 group-hover:opacity-100")} />
                      
                      <div className={cn("flex items-start justify-between", spacing.compact)}>
                        <div>
                          <h3 className={cn(typography.h4, "mb-1")}>{deal.title}</h3>
                          <div className={typography.bodySmall}>{deal.brand}</div>
                        </div>
                        <div className={cn(typography.amountSmall, "text-green-400")}>
                          ₹{Math.round(deal.value).toLocaleString('en-IN')}
                        </div>
                      </div>
                      
                      <div className={cn("mt-3")}>
                        <div className={cn("flex items-center justify-between", typography.caption, "mb-1")}>
                          <span>Progress</span>
                          <span>{deal.progress}%</span>
                        </div>
                        <div className={cn(
                          "w-full",
                          colors.bg.secondary,
                          radius.full,
                          "h-2 overflow-hidden"
                        )}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${deal.progress}%` }}
                            transition={motionTokens.spring.gentle}
                            className={cn(
                              "bg-gradient-to-r from-blue-500 to-purple-500 h-2",
                              radius.full
                            )}
                          />
                        </div>
                      </div>

                      <div className={cn("flex items-center justify-between", typography.caption, "mt-2")}>
                        <span>{deal.status === 'active' ? '✅ Active' : '🔵 Negotiation'}</span>
                        <span>Due: {deal.deadline}</span>
                      </div>
                    </BaseCard>
                  </motion.div>
                  ))}
                </div>
              )}
              </div>

            {/* Section Separator */}
            <div className={separators.section} />

            {/* Recent Activity - iOS 17 + visionOS */}
            <div className={spacing.loose}>
              <div className={sectionHeader.base}>
                <h2 className={sectionHeader.title}>Recent Activity</h2>
              </div>
              {recentActivity.length === 0 ? (
                <BaseCard variant="tertiary" className={cn(spacing.cardPadding.secondary, "text-center relative overflow-hidden")}>
                  {/* Spotlight */}
                  <div className={cn(vision.spotlight.base, "opacity-20")} />
                  <Clock className={cn(iconSizes.xl, "text-purple-400/50 mx-auto mb-3")} />
                  <p className={typography.bodySmall}>No recent activity</p>
                  <p className={cn(typography.caption, "mt-1")}>Activity will appear here as you complete deals</p>
                </BaseCard>
              ) : (
                <div className={spacing.card}>
                  {recentActivity.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <motion.div
                        key={activity.id}
                        initial={motionTokens.slide.up.initial}
                        animate={motionTokens.slide.up.animate}
                        transition={{ ...motionTokens.slide.up.transition, delay: index * 0.1 }}
                        whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
                        whileTap={animations.microTap}
                      >
                        <BaseCard 
                          variant="tertiary" 
                          className={cn(
                            animations.cardHover,
                            "cursor-pointer relative overflow-hidden"
                          )}
                          onClick={() => triggerHaptic(HapticPatterns.light)}
                        >
                          {/* Spotlight on hover */}
                          <div className={cn(vision.spotlight.hover, "opacity-0 group-hover:opacity-100")} />
                          
                          <div className={cn("flex items-start gap-3")}>
                            <div className={cn(
                              "w-10 h-10",
                              radius.md,
                              activity.bgColor,
                              "flex items-center justify-center flex-shrink-0",
                              shadows.sm
                            )}>
                              <Icon className={cn(iconSizes.md, activity.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={cn(typography.h4, "mb-1")}>{activity.title}</h3>
                              <p className={cn(typography.bodySmall, "text-purple-200 mb-1")}>{activity.description}</p>
                              <p className={cn(typography.caption, "text-purple-300")}>{activity.time}</p>
                            </div>
                          </div>
                        </BaseCard>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section Separator */}
            <div className={separators.section} />

            {/* Upcoming Payments - iOS 17 + visionOS */}
            <div>
              <div className={sectionHeader.base}>
                <h2 className={sectionHeader.title}>Upcoming Payments</h2>
                <motion.button 
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    navigate('/creator-payments');
                  }}
                  whileTap={animations.microTap}
                  className={sectionHeader.action}
                >
                  View All →
                </motion.button>
              </div>
              <div className={spacing.card}>
                {upcomingPayments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={motionTokens.slide.up.initial}
                    animate={motionTokens.slide.up.animate}
                    transition={{ ...motionTokens.slide.up.transition, delay: index * 0.1 }}
                    whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
                    whileTap={animations.microTap}
                  >
                    <BaseCard 
                      variant="tertiary" 
                      className={cn(
                        animations.cardHover,
                        "cursor-pointer relative overflow-hidden"
                      )}
                      onClick={() => {
                        triggerHaptic(HapticPatterns.light);
                        navigate('/creator-payments');
                      }}
                    >
                      {/* Spotlight on hover */}
                      <div className={cn(vision.spotlight.hover, "opacity-0 group-hover:opacity-100")} />
                      
                      <div className={cn("flex items-center justify-between")}>
                        <div className="flex-1">
                          <h3 className={cn(typography.h4, "mb-1")}>{payment.title}</h3>
                          <div className={cn("flex items-center gap-2", typography.bodySmall)}>
                            <Clock className={iconSizes.xs} />
                            <span>Expected: {payment.date}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(typography.amountSmall, "text-green-400")}>
                            ₹{Math.round(payment.amount).toLocaleString('en-IN')}
                          </div>
                          <div className={cn(
                            typography.caption,
                            "flex items-center gap-1",
                            payment.status === 'pending' ? 'text-yellow-400' : 'text-blue-400'
                          )}>
                            {payment.status === 'pending' ? (
                              <>
                                <Clock className={iconSizes.xs} />
                              <span>Pending</span>
                </>
              ) : (
                <>
                              <RefreshCw className={`${iconSizes.xs} animate-spin`} />
                              <span>Processing</span>
                            </>
            )}
          </div>
                      </div>
                    </div>
                    </BaseCard>
                  </motion.div>
                ))}
            </div>
            </div>
              </div>
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

      {/* Quick Actions Bottom Sheet (Mobile) */}
      <BottomSheet
        open={showQuickActionsSheet}
        onClose={() => setShowQuickActionsSheet(false)}
        title="Quick Actions"
      >
        <div className="grid grid-cols-2 gap-4 py-2">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ActionCard
                  icon={<Icon className={`w-6 h-6 ${action.iconColor}`} />}
                  label={action.label}
                  onClick={(e) => {
                    if (e) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                    triggerHaptic(HapticPatterns.medium);
                    if (import.meta.env.DEV) {
                      console.log('[CreatorDashboard] Action clicked:', action.label);
                    }
                    action.onClick();
                    setShowQuickActionsSheet(false);
                  }}
                  variant="tertiary"
                  className={`${action.color}`}
                />
              </motion.div>
            );
          })}
        </div>
      </BottomSheet>
    </div>
    </ContextualTipsProvider>
  );
};

export default CreatorDashboard;
