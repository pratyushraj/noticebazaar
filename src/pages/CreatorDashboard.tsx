"use client";

import { useState, useEffect, useMemo } from 'react';
import { Home, Briefcase, CreditCard, Shield, MessageCircle, TrendingUp, DollarSign, Calendar, FileText, AlertCircle, Clock, ChevronRight, Plus, Search, Target, BarChart3, RefreshCw, LogOut, Loader2, XCircle, Menu } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useSignOut } from '@/lib/hooks/useAuth';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals, getDealStageFromStatus, STAGE_TO_PROGRESS } from '@/lib/hooks/useBrandDeals';
import { usePartnerStats } from '@/lib/hooks/usePartnerProgram';
import { logger } from '@/lib/utils/logger';
import { isCreatorPro } from '@/lib/subscription';
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
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
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
  const [moneyProtectionTab, setMoneyProtectionTab] = useState<'recovered' | 'atRisk' | 'allTime'>('recovered');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickActionsSheet, setShowQuickActionsSheet] = useState(false);
  const [isPro, setIsPro] = useState(false);

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
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    triggerHaptic(HapticPatterns.light);
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

  // Upcoming payments - Real data from brand deals
  const upcomingPayments = useMemo(() => {
    if (!brandDeals || brandDeals.length === 0) return [];
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return brandDeals
      .filter(deal => {
        // Only show deals with Payment Pending status that haven't been received yet
        if (deal.status !== 'Payment Pending' || deal.payment_received_date) return false;
        
        // Must have a payment expected date
        if (!deal.payment_expected_date) return false;
        
        const dueDate = new Date(deal.payment_expected_date);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Only show future payments (or today)
        return daysUntil >= 0;
      })
      .map(deal => {
        const dueDate = new Date(deal.payment_expected_date!);
        const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determine status based on days until payment
        let status: 'pending' | 'processing' | 'overdue' = 'pending';
        if (daysUntil === 0) {
          status = 'processing'; // Due today
        } else if (daysUntil < 0) {
          status = 'overdue';
        }
        
        return {
          id: deal.id,
          title: deal.brand_name || 'Unknown Brand',
          amount: deal.deal_amount || 0,
          date: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: status,
          dealId: deal.id
        };
      })
      .sort((a, b) => {
        // Sort by date (earliest first)
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      })
      .slice(0, 5); // Limit to top 5 upcoming payments
  }, [brandDeals]);

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
      id: 3,
      icon: MessageCircle,
      label: "Talk to Lawyer",
      subtitle: "Get human legal advice when AI isn't enough",
      color: "bg-green-500/20",
      iconColor: "text-green-400",
      onClick: () => navigate('/messages')
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
              // Empty State for New Users
              <div className="max-w-5xl mx-auto space-y-6 pb-4 md:pb-8">
                {/* Greeting */}
                <div className={cn(sectionLayout.header, "md:pt-4 md:text-left")}>
                  <h1 className={cn(typography.h1, "mb-2 leading-tight md:text-xl")}>
                    {getGreeting()}, {userData.name}! 👋
                  </h1>
                  <p className={cn(typography.body, "leading-relaxed")}>Let's get you started with your first brand deal.</p>
                </div>

                {/* Empty State Card */}
                <BaseCard variant="secondary" className="text-center p-6 md:p-6 relative" onClick={(e) => e?.stopPropagation()}>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4 md:mb-3"
                  >
                    <Briefcase className={cn(iconSizes.xl, "md:w-8 md:h-8 text-purple-400")} />
                  </motion.div>
                  <h2 className={cn(typography.h2, "mb-3 md:text-2xl")}>Welcome to Your Dashboard!</h2>
                  <p className={cn(typography.body, "mb-6 max-w-md md:max-w-lg mx-auto")}>
                    Start tracking your brand deals, payments, and contracts. Add your first deal to see your earnings and activity here.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center relative md:max-w-md md:mx-auto" style={{ zIndex: 50, pointerEvents: 'auto' }}>
                    <motion.button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        triggerHaptic(HapticPatterns.medium);
                        navigate('/contract-upload');
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        buttons.primary,
                        "flex items-center justify-center gap-2",
                        "cursor-pointer",
                        "pointer-events-auto",
                        "touch-manipulation",
                        "select-none",
                        "min-h-[44px] md:min-h-[40px]",
                        "will-change-transform",
                        "md:text-sm"
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
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        triggerHaptic(HapticPatterns.light);
                        toast.info('Explore Brands coming soon!', {
                          description: 'We\'re working on bringing you an amazing brand directory experience.',
                          duration: 3000,
                        });
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        buttons.secondary,
                        "flex items-center justify-center gap-2",
                        "cursor-pointer",
                        "pointer-events-auto",
                        "touch-manipulation",
                        "select-none",
                        "min-h-[44px] md:min-h-[40px]",
                        "will-change-transform",
                        "md:text-sm",
                        "opacity-90"
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
                      aria-label="Explore Brands - Coming Soon"
                    >
                      <Briefcase className={iconSizes.md} />
                      Explore Brands - Coming Soon
                    </motion.button>
                  </div>
                </BaseCard>

                {/* Quick Start Guide */}
                <SectionCard 
                  variant="secondary"
                  title="Quick Start Guide"
                  icon={<Target className="w-5 h-5 text-purple-400" />}
                  className="mb-6 md:mb-24 border-t border-white/10 pt-6 mt-6"
                >
                  <div className="grid md:grid-cols-3 gap-4 md:gap-3">
                    <motion.div
                      onClick={() => {
                        triggerHaptic(HapticPatterns.light);
                        navigate('/creator-contracts');
                      }}
                      whileTap={animations.microTap}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      className="cursor-pointer h-full"
                    >
                      <BaseCard variant="tertiary" interactive className="h-full md:p-4 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200">
                        <div className="w-10 h-10 md:w-9 md:h-9 rounded-lg bg-purple-500/20 flex items-center justify-center mb-2 md:mb-1.5">
                          <Briefcase className={cn(iconSizes.md, "md:w-4 md:h-4 text-purple-400")} />
                        </div>
                        <h4 className={cn(typography.h4, "mb-0.5 md:mb-0 md:text-sm")}>Add Brand Deals</h4>
                        <p className={cn(typography.bodySmall, "md:text-xs")}>Track your partnerships and contracts</p>
                      </BaseCard>
                    </motion.div>
                    <motion.div
                      onClick={() => {
                        triggerHaptic(HapticPatterns.light);
                        navigate('/creator-payments');
                      }}
                      whileTap={animations.microTap}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      className="cursor-pointer h-full"
                    >
                      <BaseCard variant="tertiary" interactive className="h-full md:p-4 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-200">
                        <div className="w-10 h-10 md:w-9 md:h-9 rounded-lg bg-green-500/20 flex items-center justify-center mb-2 md:mb-1.5">
                          <CreditCard className={cn(iconSizes.md, "md:w-4 md:h-4 text-green-400")} />
                        </div>
                        <h4 className={cn(typography.h4, "mb-0.5 md:mb-0 md:text-sm")}>Track Payments</h4>
                        <p className={cn(typography.bodySmall, "md:text-xs")}>Monitor incoming and pending payments</p>
                      </BaseCard>
                    </motion.div>
                    <motion.div
                      onClick={() => {
                        triggerHaptic(HapticPatterns.light);
                        navigate('/creator-contracts');
                      }}
                      whileTap={animations.microTap}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      className="cursor-pointer h-full"
                    >
                      <BaseCard variant="tertiary" interactive className="h-full md:p-4 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200">
                        <div className="w-10 h-10 md:w-9 md:h-9 rounded-lg bg-blue-500/20 flex items-center justify-center mb-2 md:mb-1.5">
                          <Shield className={cn(iconSizes.md, "md:w-4 md:h-4 text-blue-400")} />
                        </div>
                        <h4 className={cn(typography.h4, "mb-0.5 md:mb-0 md:text-sm")}>Protect Content</h4>
                        <p className={cn(typography.bodySmall, "md:text-xs")}>Register and monitor your content</p>
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
              "pt-6 pb-4 md:pt-8 md:pb-6",
              "px-4 md:px-0",
              "lg:mb-6"
            )}>
              {/* Greeting */}
              <div className={cn(sectionLayout.header, "md:pt-0 md:text-left")}>
                <h1 className={cn(typography.h1, "mb-2 leading-tight md:text-xl")}>
                  {getGreeting()}, <br />
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                    {userData.name}!
                  </span> 👋
                </h1>
                {stats.activeDeals === 0 && (
                  <p className={cn(typography.bodySmall, "mt-2 mb-2 text-purple-300/70")}>
                    Your next step: protect a deal by uploading a contract or requesting details from a brand.
                  </p>
                )}
                {stats.activeDeals > 0 && (
                  <p className={cn(typography.body, "mt-2 mb-3 leading-relaxed text-purple-200")}>
                    We're protecting your deals today.
                  </p>
                )}
                {/* Compact Summary Strip - Improved color hierarchy */}
                <div className={`mt-3 flex items-center gap-1.5 overflow-x-auto ${typography.bodySmall} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
                  <span className="px-2 py-0.5 bg-green-500/25 text-green-300 rounded-full flex items-center gap-1 font-semibold whitespace-nowrap text-[10px] sm:text-xs">
                    All clear
                  </span>
                  <span className="text-purple-300/40 flex-shrink-0">•</span>
                  <span className="px-2 py-0.5 bg-white/5 text-white/60 rounded-full flex items-center gap-1 font-medium whitespace-nowrap text-[10px] sm:text-xs">
                    {stats.activeDeals} deal{stats.activeDeals === 1 ? '' : 's'} being monitored
                  </span>
                  <span className="text-purple-300/40 flex-shrink-0">•</span>
                  <span className="px-2 py-0.5 bg-white/5 text-white/60 rounded-full flex items-center gap-1 font-medium whitespace-nowrap text-[10px] sm:text-xs">
                    {stats.pendingPayments === 0 ? "No money at risk yet" : `₹${Math.round(stats.pendingPayments).toLocaleString('en-IN')} at risk`}
                  </span>
                </div>
              </div>

              {/* Primary CTA - Attached to hero section - Always visible */}
              <div className="mt-4">
                <button
                  onClick={() => {
                    triggerHaptic(HapticPatterns.medium);
                    navigate('/contract-upload');
                  }}
                  className={cn(
                    "w-full",
                    "bg-gradient-to-r from-purple-600 to-pink-600",
                    "hover:from-purple-700 hover:to-pink-700",
                    "active:scale-95",
                    "text-white font-semibold",
                    "px-6 py-3.5",
                    radius.lg,
                    "flex items-center justify-center gap-2",
                    "transition-all duration-200",
                    "shadow-lg shadow-purple-500/20",
                    "min-h-[48px]",
                    "relative z-10",
                    "opacity-100"
                  )}
                  style={{ opacity: 1 }}
                >
                  <Shield className={iconSizes.md} />
                  Protect a New Deal
                </button>
                <p className="text-[10px] sm:text-[11px] text-purple-300/50 text-center mt-1.5 hidden sm:block">
                  Upload a contract or let the brand share details
                </p>
              </div>
            </div>

            {/* Desktop 2-Column Layout (≥1024px) */}
            <div className="lg:grid lg:grid-cols-[65%_35%] lg:gap-6 space-y-6 lg:space-y-0">
              {/* LEFT COLUMN - Primary Information */}
              <div className="space-y-6 lg:space-y-4">

                {/* Active Deals Preview - Enhanced spacing (Moved to top of left column) */}
                <div className={spacing.loose}>
                  <div className={sectionHeader.base}>
                    <h2 className={sectionHeader.title}>Active Deals Under Protection</h2>
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
                      <p className={typography.bodySmall}>No Active Deals Yet</p>
                      <p className={cn(typography.caption, "mt-1 text-purple-300/60")}>Deals appear here only after a contract is signed.</p>
                      <motion.button
                        onClick={() => {
                          triggerHaptic(HapticPatterns.light);
                          navigate('/contract-upload');
                        }}
                        whileTap={animations.microTap}
                        className={cn("mt-4", sectionHeader.action)}
                      >
                        Protect a New Deal →
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
                          
                          {/* 1. Brand name + trust badge */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <h3 className={cn(
                              typography.h4, 
                              "text-base sm:text-lg font-bold truncate flex-1"
                            )}>
                              {deal.title}
                            </h3>
                            {deal.trustBadge && (
                              <span className={cn(
                                "px-1.5 py-0.5 rounded-full text-[9px] font-medium flex-shrink-0 whitespace-nowrap opacity-80",
                                deal.trustBadge === 'verified' && "bg-green-500/15 text-green-400/80 border border-green-500/20",
                                deal.trustBadge === 'gst' && "bg-green-500/15 text-green-400/80 border border-green-500/20",
                                deal.trustBadge === 'repeat' && "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              )}>
                                {deal.trustBadge === 'verified' && 'Verified'}
                                {deal.trustBadge === 'gst' && 'GST Verified'}
                                {deal.trustBadge === 'repeat' && 'Repeat'}
                              </span>
                            )}
                          </div>

                          {/* 2. Amount at risk */}
                          <div className={cn(
                            typography.amountSmall, 
                            "text-orange-400 text-sm sm:text-base font-semibold mb-1.5"
                          )}>
                            ₹{Math.round(deal.value).toLocaleString('en-IN')} at risk
                          </div>

                          {/* 3. Payment status chip */}
                          {deal.paymentStatus && (
                            <div className="mb-2">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-medium inline-block",
                                deal.paymentStatus === 'received' && "bg-green-500/20 text-green-400 border border-green-500/30",
                                deal.paymentStatus === 'pending' && "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                                deal.paymentStatus === 'overdue' && "bg-red-500/20 text-red-400 border border-red-500/30"
                              )}>
                                {deal.paymentStatus === 'received' && 'Payment Received'}
                                {deal.paymentStatus === 'pending' && 'Payment Pending'}
                                {deal.paymentStatus === 'overdue' && 'Payment Overdue'}
                              </span>
                            </div>
                          )}

                          {/* 4. Signed + Due date */}
                          <div className={cn(
                            "flex items-center justify-between flex-wrap gap-2", 
                            typography.caption, 
                            "mt-2 text-xs sm:text-sm"
                          )}>
                            <span className={cn(
                              "flex items-center gap-1.5",
                              deal.status === 'signed' && "text-green-400/70 text-[10px] sm:text-xs"
                            )}>
                              {deal.status === 'signed' ? '✅ Contract Signed' : (deal.status === 'active' ? '✅ Active' : '🔵 Negotiation')}
                            </span>
                            <span className="text-white/60 whitespace-nowrap">
                              Due: {deal.deadline}
                            </span>
                          </div>

                          {/* 5. Next action helper */}
                          {deal.nextAction && (
                            <div className="mt-2 text-xs text-white/50 opacity-70">
                              Action needed: {deal.nextAction}
                            </div>
                          )}

                          {/* 6. Deliverables progress (optional) */}
                          {deal.deliverablesProgress && deal.deliverablesProgress.total > 0 && (
                            <div className="mt-1.5 text-xs text-white/50 opacity-70">
                              {deal.deliverablesProgress.delivered} of {deal.deliverablesProgress.total} delivered
                            </div>
                          )}
                        </BaseCard>
                      </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section Separator */}
                <div className={separators.section} />

                {/* Money Protection Card */}
                <motion.div 
                  data-tutorial="money-protection-card"
                  onClick={() => {
                    triggerHaptic(HapticPatterns.medium);
                    navigate('/creator-payments');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      triggerHaptic(HapticPatterns.medium);
                      navigate('/creator-payments');
                    }
                  }}
                  whileTap={animations.microTap}
                  whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
                  className={cn(
                    "w-full relative overflow-hidden text-left",
                    glass.apple,
                    shadows.vision,
                    radius.lg,
                    "p-3 sm:p-6",
                    animations.cardHover,
                    "transition-all duration-200",
                    "cursor-pointer"
                  )}
                  role="button"
                  tabIndex={0}
                  aria-label="View money protection details"
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
                {/* Header */}
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
                      <Shield className={cn(iconSizes.md, "text-purple-300")} />
                    </div>
                    <span className={cn(typography.body, "font-medium")}>Money Protection</span>
                  </div>
                  <div className={cn(
                    "flex gap-1.5 sm:gap-1 w-full sm:w-auto",
                    glass.appleSubtle,
                    radius.md,
                    "p-1.5 sm:p-2",
                    "overflow-x-auto sm:overflow-visible",
                    "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  )}>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMoneyProtectionTab('recovered');
                        triggerHaptic(HapticPatterns.light);
                      }}
                      whileTap={animations.microTap}
                      className={cn(
                        "px-3 py-2 sm:px-2 sm:py-1.5",
                        "text-xs sm:text-sm",
                        radius.sm,
                        "transition-all whitespace-nowrap",
                        "min-h-[36px] sm:min-h-0",
                        moneyProtectionTab === 'recovered'
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-300 hover:text-white'
                      )}
                      aria-label="View recovered amount"
                    >
                      Recovered
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (stats.pendingPayments === 0 && stats.earnings === 0) {
                          return; // Disable if no data
                        }
                        setMoneyProtectionTab('atRisk');
                        triggerHaptic(HapticPatterns.light);
                      }}
                      whileTap={animations.microTap}
                      disabled={stats.pendingPayments === 0 && stats.earnings === 0}
                      className={cn(
                        "px-3 py-2 sm:px-2 sm:py-1.5",
                        "text-xs sm:text-sm",
                        radius.sm,
                        "transition-all whitespace-nowrap",
                        "min-h-[36px] sm:min-h-0",
                        moneyProtectionTab === 'atRisk'
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-300 hover:text-white',
                        (stats.pendingPayments === 0 && stats.earnings === 0) && 'opacity-50 cursor-not-allowed'
                      )}
                      aria-label="View amount at risk"
                      title={(stats.pendingPayments === 0 && stats.earnings === 0) ? "Amounts will appear here if a payment becomes overdue" : undefined}
                    >
                      At Risk
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (stats.pendingPayments === 0 && stats.earnings === 0) {
                          return; // Disable if no data
                        }
                        setMoneyProtectionTab('allTime');
                        triggerHaptic(HapticPatterns.light);
                      }}
                      whileTap={animations.microTap}
                      disabled={stats.pendingPayments === 0 && stats.earnings === 0}
                      className={cn(
                        "px-3 py-2 sm:px-2 sm:py-1.5",
                        "text-xs sm:text-sm",
                        radius.sm,
                        "transition-all whitespace-nowrap",
                        "min-h-[36px] sm:min-h-0",
                        moneyProtectionTab === 'allTime'
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-300 hover:text-white',
                        (stats.pendingPayments === 0 && stats.earnings === 0) && 'opacity-50 cursor-not-allowed'
                      )}
                      aria-label="View all time protection"
                    >
                      All Time
                    </motion.button>
                  </div>
                </div>

                {/* Primary Value and Secondary Line */}
                <div className={cn(
                  "flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-2",
                  "mt-4 sm:mt-2"
                )}>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums mb-2",
                      "leading-tight"
                    )}>
                      {moneyProtectionTab === 'recovered' 
                        ? (stats.pendingPayments === 0 && stats.earnings === 0 ? "No money at risk 🎉" : `₹0 recovered`)
                        : moneyProtectionTab === 'atRisk'
                        ? (stats.pendingPayments === 0 ? "No money at risk 🎉" : `₹${Math.round(stats.pendingPayments).toLocaleString('en-IN')} at risk`)
                        : `₹${stats.earnings.toLocaleString('en-IN', { maximumFractionDigits: 0 })} protected`
                      }
                    </div>
                    <div className={cn(typography.bodySmall, "text-purple-300")}>
                      {moneyProtectionTab === 'recovered' 
                        ? (stats.pendingPayments === 0 && stats.earnings === 0 ? "We'll alert you instantly if anything changes." : `₹${Math.round(stats.pendingPayments).toLocaleString('en-IN')} currently at risk`)
                        : moneyProtectionTab === 'atRisk'
                        ? (stats.pendingPayments === 0 ? "We'll alert you instantly if anything changes." : `From ${stats.activeDeals} active deal${stats.activeDeals === 1 ? '' : 's'}`)
                        : `Total amount protected across all deals`
                      }
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-purple-300",
                    typography.bodySmall,
                    "self-start sm:self-end",
                    "pt-1 sm:pt-0"
                  )}>
                    <span>View Recovery Details</span>
                    <ChevronRight className={iconSizes.sm} />
                  </div>
                </div>
              </div>
            </motion.div>

                {/* Section Separator */}
                <div className={separators.section} />

            {/* Section Separator */}
            <div className={separators.section} />

                {/* Legal Power Ready Card */}
                <div className={spacing.loose}>
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
                        <p className={cn(typography.caption, "text-center text-purple-300/60")}>
                          Includes free legal notices & lawyer reviews
                        </p>
                      </div>
                    </div>
                  </BaseCard>
                </div>

                {/* Section Separator */}
                <div className={separators.section} />

                {/* Recent Activity - iOS 17 + visionOS */}
                <div className={cn(spacing.loose, "pb-6 md:pb-8 lg:pb-0")}>
                  <div className={sectionHeader.base}>
                    <h2 className={sectionHeader.title}>Recent Activity</h2>
                  </div>
                  {recentActivity.length === 0 ? (
                    <BaseCard variant="tertiary" className={cn(spacing.cardPadding.secondary, "text-center relative overflow-hidden")}>
                      {/* Spotlight */}
                      <div className={cn(vision.spotlight.base, "opacity-20")} />
                      <Clock className={cn(iconSizes.xl, "text-purple-400/50 mx-auto mb-3")} />
                      <p className={typography.bodySmall}>No legal actions yet</p>
                      <p className={cn(typography.caption, "mt-1")}>Your activity will appear here once contracts are scanned or notices are sent.</p>
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
                                  <p className={cn("text-sm md:text-base", "text-purple-200 mb-1")}>{activity.description}</p>
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
              </div>

              {/* RIGHT COLUMN - Secondary Actions and Status */}
              <div className="space-y-6 lg:space-y-4">
                {/* Quick Actions - Desktop: Vertical Command Panel */}
                <div data-tutorial="quick-actions" className="hidden lg:block">
                  <div className={sectionHeader.base}>
                    <h2 className={sectionHeader.title}>Quick Actions</h2>
                  </div>
                  <BaseCard variant="tertiary" className="p-3 space-y-2">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <motion.button
                          key={action.id}
                          initial={motionTokens.slide.up.initial}
                          animate={motionTokens.slide.up.animate}
                          transition={{ ...motionTokens.slide.up.transition, delay: index * 0.05 }}
                          whileTap={animations.microTap}
                          whileHover={animations.microHover}
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
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5",
                            "bg-white/5 hover:bg-white/10",
                            "border border-white/10 hover:border-white/20",
                            "rounded-lg transition-all duration-200",
                            "text-left"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg",
                            action.color,
                            "flex items-center justify-center flex-shrink-0"
                          )}>
                            <Icon className={cn(iconSizes.sm, action.iconColor)} />
                          </div>
                          <span className={cn(typography.bodySmall, "font-medium text-white/90")}>
                            {action.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </BaseCard>
                </div>

                {/* Quick Actions - Mobile: Keep existing 2x2 grid */}
                <div data-tutorial="quick-actions" className={cn(spacing.loose, "mb-6 md:mb-8 lg:hidden")}>
                  <div className={sectionHeader.base}>
                    <h2 className={sectionHeader.title}>Quick Actions</h2>
                    <button
                      onClick={() => {
                        triggerHaptic(HapticPatterns.light);
                        setShowQuickActionsSheet(true);
                      }}
                      className={sectionHeader.action}
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
                          className="aspect-square"
                        >
                          <BaseCard
                            variant="tertiary"
                            className={cn(
                              action.color,
                              "flex flex-col items-center justify-center gap-2 text-center cursor-pointer p-4 md:p-5",
                              "pointer-events-auto h-full"
                            )}
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
                            interactive
                          >
                            <div className="p-3 rounded-xl bg-white/5 pointer-events-none">
                              <Icon className={cn(iconSizes.lg, action.iconColor)} />
                            </div>
                            <span className={cn(typography.bodySmall, "pointer-events-none font-medium")}>{action.label}</span>
                            {action.subtitle && (
                              <span className={cn(typography.caption, "pointer-events-none text-purple-300/70 mt-0.5")}>{action.subtitle}</span>
                            )}
                          </BaseCard>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

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

                {/* Quick Stats Row - Mobile/Tablet Only */}
                {Math.round(stats.pendingPayments) > 0 ? (
                  <div data-tutorial="stats-grid" className="space-y-3 mb-4 lg:hidden">
                    <StatCard
                      label="Action Required"
                      value={Math.round(stats.pendingPayments)}
                      icon={<CreditCard className={`${iconSizes.sm} text-amber-400`} />}
                      variant="tertiary"
                      className="border-amber-500/30 bg-amber-500/5"
                    />
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
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
                  <div data-tutorial="stats-grid" className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-full mb-4 lg:hidden">
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

                {/* Optional Calm-State Nudge - Show when Action Required = 0 and Money at risk = 0 */}
                {Math.round(stats.pendingPayments) === 0 && stats.earnings === 0 && (() => {
                  const hintDismissed = localStorage.getItem(`dashboard-hint-dismissed-${user?.id || 'anonymous'}`);
                  if (hintDismissed === 'true') return null;
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 px-2"
                    >
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
                              triggerHaptic(HapticPatterns.light);
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

            {/* Payments Under Watch - Full width below columns */}
            <div className="mt-6">
              {/* Section Separator */}
              <div className={separators.section} />

              {/* Payments Under Watch - iOS 17 + visionOS */}
              <div>
              <div className={sectionHeader.base}>
                <h2 className={sectionHeader.title}>Payments Under Watch</h2>
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
