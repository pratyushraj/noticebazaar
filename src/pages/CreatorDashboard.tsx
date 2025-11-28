"use client";

import { useState, useEffect, useMemo } from 'react';
import { Home, Briefcase, CreditCard, Shield, MessageCircle, TrendingUp, DollarSign, Calendar, FileText, AlertCircle, Clock, ChevronRight, Plus, Bell, Search, User, Menu, X, Target, BarChart3, RefreshCw, LogOut, Loader2, Sparkles, XCircle, LineChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useSignOut } from '@/lib/hooks/useAuth';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { usePartnerStats } from '@/lib/hooks/usePartnerProgram';
import { logger } from '@/lib/utils/logger';
import { getInitials } from '@/lib/utils/avatar';
import { motion, AnimatePresence } from 'framer-motion';
// Onboarding components - commented out if not currently used
// import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
// import InteractiveTutorial from '@/components/onboarding/InteractiveTutorial';
// import { AchievementBadge, AchievementDisplay } from '@/components/onboarding/AchievementBadge';
// import FeedbackCollector from '@/components/onboarding/FeedbackCollector';
// import { onboardingAnalytics } from '@/lib/onboarding/analytics';
// import type { AchievementId } from '@/components/onboarding/AchievementBadge';
import DashboardTutorial from '@/components/onboarding/DashboardTutorial';
import { ContextualTipsProvider } from '@/components/contextual-tips/ContextualTipsProvider';
import { DashboardSkeleton as EnhancedDashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { QuickSearch } from '@/components/dashboard/QuickSearch';
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
  const signOutMutation = useSignOut();
  const { profile, user, loading: sessionLoading } = useSession();
  const [activeTab, setActiveTab] = useState('home');
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [timeframe, setTimeframe] = useState<'month' | 'lastMonth' | 'allTime'>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Fetch real data
  const { data: brandDeals = [], isLoading: isLoadingDeals } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !sessionLoading && !!profile?.id,
  });

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

  const isInitialLoading = sessionLoading || isLoadingDeals;

  // Haptic feedback helper
  const triggerHaptic = (pattern: 'light' | 'medium' | 'heavy' = 'light') => {
    if (navigator.vibrate) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30]
      };
      navigator.vibrate(patterns[pattern]);
    }
  };

  // Pull to refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    triggerHaptic('medium');
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    triggerHaptic('light');
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
      .filter(deal => deal.status === 'Payment Pending' && !deal.payment_received_date)
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);

    // Get next payout (earliest pending payment)
    const nextPayoutDeal = brandDeals
      .filter(deal => deal.status === 'Payment Pending' && deal.payment_expected_date)
      .sort((a, b) => {
        const dateA = new Date(a.payment_expected_date!).getTime();
        const dateB = new Date(b.payment_expected_date!).getTime();
        return dateA - dateB;
      })[0];

    // Active deals (not completed, not drafting)
    const activeDeals = brandDeals.filter(deal => 
      deal.status !== 'Completed' && deal.status !== 'Drafting'
    ).length;

    return {
      month: {
        earnings: currentEarnings,
        monthlyGrowth,
        goal: currentEarnings * 1.5, // Dynamic goal based on current earnings
      },
      lastMonth: {
        earnings: lastMonthEarnings,
        monthlyGrowth: 0,
        goal: lastMonthEarnings * 1.5,
      },
      allTime: {
        earnings: allTimeEarnings,
        monthlyGrowth: monthlyGrowth,
        goal: allTimeEarnings * 1.2,
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
  
  // Check if user has no data (new user)
  const hasNoData = brandDeals.length === 0;

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
  const activeDealsPreview = useMemo(() => {
    if (hasNoData) return [];
    
    return brandDeals
      .filter(deal => deal.status !== 'Completed' && deal.status !== 'Drafting')
      .sort((a, b) => {
        const dateA = new Date(a.due_date || a.created_at).getTime();
        const dateB = new Date(b.due_date || b.created_at).getTime();
        return dateB - dateA;
      })
      .slice(0, 2)
      .map(deal => ({
        id: deal.id,
        brand: deal.brand_name,
        amount: deal.deal_amount,
        status: deal.status,
        dueDate: deal.due_date,
        progress: deal.status === 'Completed' ? 100 : deal.status === 'Payment Pending' ? 75 : 50
      }));
  }, [brandDeals, hasNoData]);

  // Active deals formatted for display
  const activeDeals = activeDealsPreview.map(deal => ({
    id: deal.id,
    title: `${deal.brand} Deal`,
    brand: deal.brand,
    value: deal.amount,
    progress: deal.progress,
    status: deal.status === 'Payment Pending' ? 'active' : 'negotiation',
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
        triggerHaptic('light');
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      {/* Top Header */}
      <div className="sticky top-0 z-50 bg-purple-900/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => {
              setShowMenu(!showMenu);
              triggerHaptic('light');
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-95"
            aria-label={showMenu ? "Close menu" : "Open menu"}
          >
            {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <div className="text-lg font-bold">NoticeBazaar</div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 hover:bg-white/10 rounded-lg transition-all active:scale-95 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-label="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowSearch(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-95"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/calendar')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-95"
              aria-label="Calendar"
            >
              <Calendar className="w-5 h-5" />
            </button>
            <NotificationDropdown />
            <button 
              onClick={() => {
                navigate('/creator-profile');
                triggerHaptic('light');
              }}
              className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-semibold active:scale-95 transition-transform hover:bg-blue-700 hover:scale-105"
              aria-label="View profile settings"
            >
              {userData.avatar}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => {
              setShowMenu(false);
              triggerHaptic('light');
            }}
          />
          
          {/* Sidebar */}
          <div className="fixed top-0 left-0 bottom-0 w-80 bg-gradient-to-b from-purple-900/95 via-purple-800/95 to-indigo-900/95 backdrop-blur-lg border-r border-white/10 shadow-2xl z-50 flex flex-col max-h-screen pb-20 md:pb-0">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xl font-bold">Menu</div>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    triggerHaptic('light');
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* User Profile */}
              <button
                onClick={() => {
                  navigate('/creator-profile');
                  setShowMenu(false);
                  triggerHaptic('light');
                }}
                className="flex items-center gap-3 w-full hover:bg-white/5 rounded-lg p-2 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                  {userData.avatar}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{userData.name}</div>
                  <div className="text-sm text-purple-300">@{userData.displayName}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400" />
              </button>
            </div>

            {/* Navigation Links - Scrollable area */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-1">
              <button
                onClick={() => {
                  setActiveTab('home');
                  setShowMenu(false);
                  triggerHaptic('light');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left"
              >
                <Home className="w-5 h-5 text-purple-300" />
                <span className="font-medium">Home</span>
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('deals');
                  setShowMenu(false);
                  triggerHaptic('light');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left"
              >
                <Briefcase className="w-5 h-5 text-purple-300" />
                <span className="font-medium">Brand Deals</span>
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('payments');
                  setShowMenu(false);
                  triggerHaptic('light');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left"
              >
                <CreditCard className="w-5 h-5 text-purple-300" />
                <span className="font-medium">Payments</span>
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('protection');
                  setShowMenu(false);
                  triggerHaptic('light');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left"
              >
                <Shield className="w-5 h-5 text-purple-300" />
                <span className="font-medium">Content Protection</span>
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('messages');
                  setShowMenu(false);
                  triggerHaptic('light');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left"
              >
                <MessageCircle className="w-5 h-5 text-purple-300" />
                <div className="flex items-center justify-between flex-1">
                  <span className="font-medium">Messages</span>
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
                </div>
              </button>
              
              <button
                onClick={() => {
                  navigate('/calendar');
                  setShowMenu(false);
                  triggerHaptic('light');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left"
              >
                <Calendar className="w-5 h-5 text-purple-300" />
                <span className="font-medium">Calendar</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-t border-white/10">
              <div className="text-sm font-semibold text-purple-300 mb-3 px-4">Quick Actions</div>
              <div className="space-y-1">
                <button 
                  onClick={() => {
                    navigate('/contract-upload');
                    setShowMenu(false);
                    triggerHaptic('light');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left"
                >
                  <FileText className="w-5 h-5 text-purple-400" />
                  <span className="text-sm">Upload Contract</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left">
                  <Plus className="w-5 h-5 text-blue-400" />
                  <span className="text-sm">Add New Deal</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Schedule Call</span>
                </button>
              </div>
            </div>

              {/* Settings & Help */}
              <div className="p-4 border-t border-white/10">
                <div className="space-y-1">
                  <button 
                    onClick={() => {
                      navigate('/creator-profile');
                      setShowMenu(false);
                      triggerHaptic('light');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left"
                  >
                    <User className="w-5 h-5 text-purple-300" />
                    <span className="text-sm">Profile Settings</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left">
                    <Bell className="w-5 h-5 text-purple-300" />
                    <span className="text-sm">Notifications</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left">
                    <FileText className="w-5 h-5 text-purple-300" />
                    <span className="text-sm">Help & Support</span>
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/creator-analytics');
                      setShowMenu(false);
                      triggerHaptic('light');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left"
                  >
                    <LineChart className="w-5 h-5 text-purple-300" />
                    <span className="text-sm">Analytics</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Logout - Prominent at bottom with better visibility */}
            <div className="mt-auto flex-shrink-0 p-4 pb-6 md:pb-4 border-t-2 border-red-500/20 bg-gradient-to-br from-red-500/10 via-red-600/5 to-transparent">
              <div className="mb-2">
                <p className="text-xs text-red-300/70 font-medium px-1">Account</p>
              </div>
              <button 
                onClick={() => {
                  triggerHaptic('medium');
                  setShowLogoutDialog(true);
                }}
                disabled={signOutMutation.isPending}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 border-2 border-red-500/40 hover:border-red-500/60 text-red-400 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:ring-offset-2 focus:ring-offset-purple-900 shadow-lg hover:shadow-xl hover:shadow-red-500/20 group"
                aria-label="Log out of your account"
                aria-describedby="sidebar-logout-description"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 flex items-center justify-center transition-colors">
                    {signOutMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin text-red-400" />
                    ) : (
                      <LogOut className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                  <div className="text-left">
                    {signOutMutation.isPending ? (
                      <span className="text-sm font-semibold text-red-400">Logging out...</span>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-red-400 block">Log Out</span>
                        <span className="text-xs text-red-300/70">Sign out of your account</span>
                      </>
                    )}
                  </div>
                </div>
                {!signOutMutation.isPending && (
                  <ChevronRight className="w-4 h-4 text-red-400/50 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                )}
              </button>
              <p id="sidebar-logout-description" className="sr-only">
                Log out of your account. This will sign you out and require you to sign in again.
              </p>
            </div>
          </div>
        </>
      )}

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
                triggerHaptic('light');
              }}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 focus:ring-2 focus:ring-purple-400/50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  triggerHaptic('medium');
                  
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
        {showWelcomeBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-16 z-40 mx-4 mt-4 mb-4"
          >
            <div className="bg-gradient-to-r from-purple-600/90 to-indigo-600/90 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Welcome to NoticeBazaar! 🎉</h3>
                    <p className="text-sm text-white/90">
                      Your dashboard is ready. Start by adding your first brand deal to track payments and contracts.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWelcomeBanner(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Dismiss welcome banner"
                >
                  <XCircle className="w-5 h-5 text-white/80" />
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    navigate('/creator-contracts');
                    setShowWelcomeBanner(false);
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Add Your First Deal
                </button>
                <button
                  onClick={() => setShowWelcomeBanner(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/90 text-sm font-medium rounded-lg transition-colors"
                >
                  Explore Dashboard
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="p-4 pb-24">
        {/* Home Tab */}
        {activeTab === 'home' && (
          <>
            {isInitialLoading ? (
              <EnhancedDashboardSkeleton />
            ) : hasNoData ? (
              // Empty State for New Users
              <div className="space-y-6">
                {/* Greeting */}
                <div className="mb-6">
                  <h1 className="text-[30px] md:text-[34px] font-bold mb-2 leading-tight">
                    {getGreeting()}, {userData.name}! 👋
                  </h1>
                  <p className="text-[15px] md:text-[17px] text-purple-200 leading-relaxed">Let's get you started with your first brand deal.</p>
                </div>

                {/* Empty State Card */}
                <div className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-6 md:p-8 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <Briefcase className="w-12 h-12 text-purple-400" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-3">Welcome to Your Dashboard!</h2>
                  <p className="text-purple-200 mb-6 max-w-md mx-auto">
                    Start tracking your brand deals, payments, and contracts. Add your first deal to see your earnings and activity here.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => navigate('/creator-contracts')}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_4px_16px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_24px_rgba(168,85,247,0.5)]"
                    >
                      <Plus className="w-5 h-5" />
                      Add Your First Deal
                    </button>
                    <button
                      onClick={() => navigate('/brand-directory')}
                      className="px-6 py-3 bg-white/[0.08] backdrop-blur-[30px] hover:bg-white/[0.12] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                    >
                      <Briefcase className="w-5 h-5" />
                      Explore Brands
                    </button>
                  </div>
                </div>

                {/* Quick Start Guide */}
                <div className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 md:p-6 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    Quick Start Guide
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                        <Briefcase className="w-5 h-5 text-purple-400" />
                      </div>
                      <h4 className="font-semibold text-white mb-1">Add Brand Deals</h4>
                      <p className="text-sm text-purple-200">Track your partnerships and contracts</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
                        <CreditCard className="w-5 h-5 text-green-400" />
                      </div>
                      <h4 className="font-semibold text-white mb-1">Track Payments</h4>
                      <p className="text-sm text-purple-200">Monitor incoming and pending payments</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                        <Shield className="w-5 h-5 text-blue-400" />
                      </div>
                      <h4 className="font-semibold text-white mb-1">Protect Content</h4>
                      <p className="text-sm text-purple-200">Register and monitor your content</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
            {/* Greeting */}
            <div className="mb-6">
              <h1 className="text-[30px] md:text-[34px] font-bold mb-2 leading-tight">
                {getGreeting()}, <br />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                  {userData.displayName}!
                </span> 👋
              </h1>
              <div className="flex items-center gap-3 text-[13px] md:text-[15px] text-purple-200">
                <span>{userData.userType}</span>
                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full flex items-center gap-1">
                  🔥 {userData.streak} weeks streak
                </span>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div data-tutorial="stats-grid" className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-purple-300">Total Deals</span>
                </div>
                <div className="text-xl font-bold">{stats.totalDeals}</div>
              </div>
              <div className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-purple-300">Active</span>
                </div>
                <div className="text-xl font-bold">{stats.activeDeals}</div>
              </div>
              <div className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-purple-300">Pending</span>
                </div>
                <div className="text-xl font-bold">₹{(stats.pendingPayments / 1000).toFixed(0)}K</div>
              </div>
            </div>

            {/* Main Earnings Card */}
            <button 
              data-tutorial="earnings-card"
              onClick={() => {
                triggerHaptic('medium');
                navigate('/creator-analytics');
              }}
              className="w-full bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 md:p-6 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden hover:bg-white/[0.12] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-200 active:scale-[0.98] text-left"
              aria-label="View analytics"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative">
                {/* Timeframe Selector */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-purple-300" />
                    </div>
                    <span className="text-purple-200 font-medium">Earnings</span>
                  </div>
                  <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTimeframe('month');
                        triggerHaptic('light');
                      }}
                      className={`px-3 py-1 text-xs rounded transition-all ${
                        timeframe === 'month'
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-300 hover:text-white'
                      }`}
                      aria-label="View this month's earnings"
                    >
                      This Month
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTimeframe('lastMonth');
                        triggerHaptic('light');
                      }}
                      className={`px-3 py-1 text-xs rounded transition-all ${
                        timeframe === 'lastMonth'
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-300 hover:text-white'
                      }`}
                      aria-label="View last month's earnings"
                    >
                      Last Month
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTimeframe('allTime');
                        triggerHaptic('light');
                      }}
                      className={`px-3 py-1 text-xs rounded transition-all ${
                        timeframe === 'allTime'
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-300 hover:text-white'
                      }`}
                      aria-label="View all time earnings"
                    >
                      All Time
                    </button>
                  </div>
                </div>
                
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <div className="text-4xl font-bold mb-2">₹{(stats.earnings / 1000).toFixed(1)}K</div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-sm flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        +{stats.monthlyGrowth}%
                      </span>
                      <span className="text-purple-300 text-sm">
                        {timeframe === 'month' ? 'vs last month' : timeframe === 'lastMonth' ? 'vs previous' : 'growth'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-purple-300 text-sm">
                    <span>View Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Goal Progress bar with labels */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs text-purple-300 mb-1.5">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Progress to Goal
                    </span>
                    <span className="font-semibold text-white">{earningsProgress.toFixed(0)}%</span>
                  </div>
                  <div className="relative w-full bg-white/10 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 h-3 rounded-full transition-all duration-500 shadow-lg shadow-teal-500/30" 
                      style={{ width: `${Math.min(earningsProgress, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-purple-300 mt-1">
                    <span>₹{(stats.earnings / 1000).toFixed(0)}K earned</span>
                    <span>Goal: ₹{(stats.goal / 1000).toFixed(0)}K</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
                <div className="text-purple-200 text-sm mb-2">Next Payout</div>
                <div className="text-2xl font-bold mb-1">₹{(stats.nextPayout / 1000).toFixed(0)}K</div>
                <div className="text-xs text-purple-300">{stats.payoutDate}</div>
              </div>

              <div className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
                <div className="text-purple-200 text-sm mb-2">Active Deals</div>
                <div className="text-2xl font-bold mb-1">{stats.activeDeals}</div>
                <div className="text-xs text-green-400">+2 this week</div>
              </div>

              <div className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
                <div className="text-purple-200 text-sm mb-2">Pending</div>
                <div className="text-2xl font-bold mb-1">₹{(stats.pendingPayments / 1000).toFixed(0)}K</div>
                <div className="text-xs text-yellow-400">4 payments</div>
              </div>

              <div className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
                <div className="text-purple-200 text-sm mb-2">Protection</div>
                <div className="text-2xl font-bold mb-1">{stats.protectionScore}</div>
                <div className="text-xs text-green-400">Excellent</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div data-tutorial="quick-actions">
              <h2 className="font-semibold text-[17px] md:text-[20px] mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={action.onClick}
                      className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:bg-white/[0.12] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all duration-200 text-left active:scale-95"
                    >
                      <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3`}>
                        <Icon className={`w-6 h-6 ${action.iconColor}`} />
                      </div>
                      <div className="text-sm font-medium">{action.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Deals Preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-[17px] md:text-[20px]">Active Deals</h2>
                <button className="text-sm text-purple-300 hover:text-white transition-colors">
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {activeDeals.map((deal, index) => (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:bg-white/[0.12] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold mb-1">{deal.title}</h3>
                        <div className="text-sm text-purple-200">{deal.brand}</div>
                      </div>
                      <div className="text-lg font-bold text-green-400">
                        ₹{(deal.value / 1000).toFixed(0)}K
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs text-purple-200 mb-1">
                        <span>Progress</span>
                        <span>{deal.progress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${deal.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-purple-300">
                      <span>{deal.status === 'active' ? '✅ Active' : '🔵 Negotiation'}</span>
                      <span>Due: {deal.deadline}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="font-semibold text-[17px] md:text-[20px] mb-3">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      whileHover={{ scale: 1.01, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:bg-white/[0.12] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl ${activity.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1">{activity.title}</h3>
                          <p className="text-sm text-purple-200 mb-1">{activity.description}</p>
                          <p className="text-xs text-purple-300">{activity.time}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Payments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">Upcoming Payments</h2>
                <button className="text-sm text-purple-300 hover:text-white transition-colors">
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {upcomingPayments.map(payment => (
                  <div
                    key={payment.id}
                    className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:bg-white/[0.12] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{payment.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-purple-200">
                          <Clock className="w-3 h-3" />
                          <span>Expected: {payment.date}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">
                          ₹{(payment.amount / 1000).toFixed(0)}K
                        </div>
                        <div className={`text-xs ${payment.status === 'pending' ? 'text-yellow-400' : 'text-blue-400'}`}>
                          {payment.status === 'pending' ? '⏰ Pending' : '🔵 Processing'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
              </div>
            )}
          </>
        )}
      </div>

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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-purple-900/90 backdrop-blur-lg border-t border-white/10 z-50">
        <div className="flex justify-around items-center py-3 px-4">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'home' ? 'text-white' : 'text-purple-300 hover:text-white'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            data-tutorial="deals-nav"
            onClick={() => setActiveTab('deals')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'deals' ? 'text-white' : 'text-purple-300 hover:text-white'
            }`}
          >
            <Briefcase className="w-6 h-6" />
            <span className="text-xs font-medium">Deals</span>
          </button>

          <button
            data-tutorial="payments-nav"
            onClick={() => setActiveTab('payments')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'payments' ? 'text-white' : 'text-purple-300 hover:text-white'
            }`}
          >
            <CreditCard className="w-6 h-6" />
            <span className="text-xs font-medium">Payments</span>
          </button>

          <button
            data-tutorial="protection-nav"
            onClick={() => setActiveTab('protection')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'protection' ? 'text-white' : 'text-purple-300 hover:text-white'
            }`}
          >
            <Shield className="w-6 h-6" />
            <span className="text-xs font-medium">Protection</span>
          </button>

          <button
            data-tutorial="messages-nav"
            onClick={() => setActiveTab('messages')}
            className={`flex flex-col items-center gap-1 transition-colors relative ${
              activeTab === 'messages' ? 'text-white' : 'text-purple-300 hover:text-white'
            }`}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Messages</span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </button>
        </div>
      </div>

      {/* Upload FAB for Tutorial */}
      <button
        data-tutorial="upload-fab"
        onClick={() => {
          navigate('/contract-upload');
          triggerHaptic('light');
        }}
        className="fixed bottom-24 right-6 bg-blue-600 text-white rounded-full p-4 shadow-2xl z-40 hover:bg-blue-700 transition-all active:scale-95"
        aria-label="Upload contract"
      >
        <FileText className="w-6 h-6" />
      </button>

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
