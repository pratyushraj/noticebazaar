"use client";

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, Clock, CheckCircle, AlertCircle, IndianRupee, Calendar, ChevronRight, Shield, ArrowUpDown, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { motion } from 'framer-motion';
import { ContextualTipsProvider } from '@/components/contextual-tips/ContextualTipsProvider';
import { FilteredNoMatchesEmptyState, NoDealsEmptyState } from '@/components/empty-states/PreconfiguredEmptyStates';
import { animations, spacing, typography, iconSizes, radius, motion as motionTokens, gradients } from '@/lib/design-system';
import { BaseCard, StatCard } from '@/components/ui/card-variants';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CreatorContracts = () => {
  const navigate = useNavigate();
  const { profile } = useSession();
  
  // Fetch real brand deals data (single call for both data and loading state)
  const { data: brandDeals = [], isLoading: isLoadingDeals, refetch: refetchDeals } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  // Refetch deals when component mounts or becomes visible (to catch newly created deals)
  useEffect(() => {
    if (profile?.id) {
      // Refetch on mount to ensure we have the latest deals
      refetchDeals();
      
      // Also refetch when page becomes visible (user switches back to tab)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          refetchDeals();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [profile?.id, refetchDeals]);

  // Transform brand deals to match UI format
  const deals = useMemo(() => {
    // Return empty array for new users (empty state will handle it)
    if (!brandDeals.length) {
      return [];
    }

    return brandDeals.map(deal => {
      // Map status from database to UI status
      // Check brand_response_status FIRST - it's the source of truth for brand acceptance
      const brandResponseStatus = (deal as any).brand_response_status;
      
      // If brand has accepted_verified, never show "waiting" - it's final
      if (brandResponseStatus === 'accepted_verified') {
        return {
          id: deal.id,
          title: `${deal.brand_name} Sponsorship`,
          brand: deal.brand_name,
          value: deal.deal_amount || 0,
          status: 'signed', // Treat accepted_verified as signed/approved
          progress: 70, // Progress to signed stage
          brandResponseStatus: brandResponseStatus,
          deadline: deal.payment_expected_date 
            ? new Date(deal.payment_expected_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : (deal.due_date ? new Date(deal.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'),
          platform: deal.platform || 'Multiple',
          nextStep: 'Start content creation',
          createdAt: deal.created_at,
          updatedAt: deal.updated_at,
        };
      }
      
      // Preserve Draft and Sent statuses (only if not accepted_verified)
      const statusLower = (deal.status || '').toLowerCase();
      let status: string = 'pending';
      let progress = 0;
      let nextStep = 'Review contract';

      // Handle new flow statuses
      if (statusLower === 'agreement_prepared') {
        status = 'sent';
        progress = 30;
        nextStep = 'Brand reviewing agreement';
      } else if (statusLower === 'signed_pending_creator') {
        status = 'signed';
        progress = 70;
        nextStep = 'Review & Sign Contract';
      } else if (statusLower === 'brand_requested_changes') {
        status = 'negotiation';
        progress = 30;
        nextStep = 'Review Brand Feedback';
      } else if (statusLower === 'draft') {
        status = 'draft';
        progress = 10;
        nextStep = 'Review and send to brand';
      } else if (statusLower === 'sent') {
        // Only show "waiting" if brand_response_status is not accepted/accepted_verified
        if (brandResponseStatus === 'accepted' || brandResponseStatus === 'accepted_verified') {
          status = 'signed';
          progress = 70;
          nextStep = 'Start content creation';
        } else {
          status = 'sent';
          progress = 20;
          nextStep = 'Waiting for brand response';
        }
      } else {
        // Use progress_percentage if available, otherwise map from status
        if (deal.progress_percentage !== null && deal.progress_percentage !== undefined) {
          progress = deal.progress_percentage;
          if (progress >= 100) {
            status = 'completed';
            nextStep = 'Deal completed';
          } else if (progress >= 90) {
            status = 'content_delivered';
            nextStep = 'Awaiting payment';
          } else if (progress >= 80) {
            status = 'content_making';
            nextStep = 'Complete content creation';
          } else if (progress >= 70) {
            status = 'signed';
            nextStep = 'Start content creation';
          } else {
            status = 'negotiation';
            nextStep = 'Complete negotiation';
          }
        } else {
          // Fallback mapping from status
          if (statusLower.includes('completed')) {
            status = 'completed';
            progress = 100;
            nextStep = 'Deal completed';
          } else if (statusLower.includes('content_delivered') || statusLower.includes('content delivered')) {
            status = 'content_delivered';
            progress = 90;
            nextStep = 'Awaiting payment';
          } else if (statusLower.includes('content_making') || statusLower.includes('content making')) {
            status = 'content_making';
            progress = 80;
            nextStep = 'Complete content creation';
          } else if (statusLower.includes('signed')) {
            status = 'signed';
            progress = 70;
            nextStep = 'Start content creation';
          } else {
            status = 'negotiation';
            progress = 30;
            nextStep = 'Complete negotiation';
          }
        }
      }

      return {
        id: deal.id,
        title: `${deal.brand_name} Sponsorship`,
        brand: deal.brand_name,
        value: deal.deal_amount || 0,
        status,
        progress,
        brandResponseStatus: (deal as any).brand_response_status || null,
        deadline: deal.payment_expected_date 
          ? new Date(deal.payment_expected_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : (deal.due_date ? new Date(deal.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'),
        platform: deal.platform || 'Multiple',
        type: 'Brand Partnership',
        nextStep: status === 'draft' ? 'Review contract & send to brand' : nextStep
      };
    });
  }, [brandDeals]);

  // Calculate stats from real data
  const stats = useMemo(() => {
    const total = brandDeals.length;
    const active = brandDeals.filter(d => {
      const status = d.status?.toLowerCase() || '';
      return !status.includes('completed');
    }).length;
    const pending = brandDeals.filter(d => {
      const status = d.status?.toLowerCase() || '';
      return status.includes('negotiation') || status.includes('draft') || !d.status;
    }).length;
    const completed = brandDeals.filter(d => d.status === 'Completed').length;
    const drafts = brandDeals.filter(d => {
      const status = d.status?.toLowerCase() || '';
      return status === 'draft' || status.includes('draft');
    }).length;
    const sent = brandDeals.filter(d => {
      const status = d.status?.toLowerCase() || '';
      return status === 'sent' || status.includes('sent');
    }).length;
    const accepted = brandDeals.filter(d => {
      const brandResponseStatus = (d as any).brand_response_status;
      return brandResponseStatus === 'accepted';
    }).length;
    const rejected = brandDeals.filter(d => {
      const brandResponseStatus = (d as any).brand_response_status;
      return brandResponseStatus === 'rejected';
    }).length;
    const totalValue = brandDeals.reduce((sum, d) => sum + (d.deal_amount || 0), 0);
    
    // Calculate this month's deals
    const now = new Date();
    const thisMonth = brandDeals.filter(d => {
      if (!d.created_at) return false;
      const created = new Date(d.created_at);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    return {
      total,
      active,
      pending,
      completed,
      drafts,
      sent,
      accepted,
      rejected,
      totalValue,
      thisMonth
    };
  }, [brandDeals]);

  type DealStatus = 'pending' | 'negotiation' | 'active' | 'completed' | 'signed' | 'content_making' | 'content_delivered';
  
  const statusConfig: Record<DealStatus, { color: string; label: string; icon: typeof Clock }> = {
    pending: { color: 'bg-yellow-500', label: 'Pending', icon: Clock },
    negotiation: { color: 'bg-blue-500', label: 'Negotiation', icon: TrendingUp },
    active: { color: 'bg-green-500', label: 'Active', icon: CheckCircle },
    completed: { color: 'bg-purple-500', label: 'Completed', icon: CheckCircle },
    signed: { color: 'bg-indigo-500', label: 'Signed', icon: CheckCircle },
    content_making: { color: 'bg-orange-500', label: 'Content Making', icon: TrendingUp },
    content_delivered: { color: 'bg-yellow-500', label: 'Content Delivered', icon: CheckCircle }
  };
  
  // Helper to get status config with fallback
  const getStatusConfig = (status: string) => {
    const config = statusConfig[status as DealStatus];
    if (config) return config;
    // Fallback for unknown statuses
    return { color: 'bg-gray-500', label: status, icon: Clock };
  };

  // Calculate closed count (paid + rejected)
  const closedCount = useMemo(() => {
    return brandDeals.filter(deal => {
      const status = deal.status?.toLowerCase() || '';
      const brandResponseStatus = (deal as any)?.brand_response_status?.toLowerCase() || '';
      return status.includes('completed') || 
             status.includes('paid') ||
             brandResponseStatus === 'rejected';
    }).length;
  }, [brandDeals]);

  // Calculate action needed count (deals with next_action OR status in [draft, sent_to_brand, accepted_not_paid, under_watch])
  const actionNeededCount = useMemo(() => {
    return brandDeals.filter(deal => {
      const status = deal.status?.toLowerCase() || '';
      const hasNextAction = !!(deal as any)?.next_action;
      return hasNextAction ||
             status === 'draft' ||
             status.includes('sent') ||
             status.includes('accepted') ||
             status.includes('under_watch') ||
             status.includes('under watch');
    }).length;
  }, [brandDeals]);

  // Initialize activeFilter state - default to "All Deals"
  const [activeFilter, setActiveFilter] = useState<'all' | 'action_needed' | 'closed'>('all');
  
  // Sort state
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low' | 'deadline_soon' | 'deadline_later' | 'status'>('newest');

  // Advanced filter states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');

  const filters = useMemo(() => [
    { id: 'all', label: 'All Deals', count: stats.total },
    { id: 'action_needed', label: 'Action Needed', count: actionNeededCount },
    { id: 'closed', label: 'Closed', count: closedCount }
  ], [stats.total, actionNeededCount, closedCount]);

  // Get unique brands for filter
  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(brandDeals.map(d => d.brand_name).filter(Boolean))).sort();
  }, [brandDeals]);

  const filteredDeals = useMemo(() => {
    let filtered = deals;
    
    // Apply main filter tabs
    if (activeFilter === 'all') {
      filtered = [...deals];
    } else if (activeFilter === 'action_needed') {
      // Action Needed: deals with next_action OR status in [draft, sent_to_brand, accepted_not_paid, under_watch]
      filtered = deals.filter(deal => {
        const dealData = brandDeals.find(d => d.id === deal.id);
        const status = dealData?.status?.toLowerCase() || '';
        const brandResponseStatus = (dealData as any)?.brand_response_status?.toLowerCase() || '';
        const hasNextAction = (dealData as any)?.next_action || false;
        
        return hasNextAction || 
               status === 'draft' || 
               status.includes('sent') ||
               brandResponseStatus === 'accepted' ||
               status.includes('under_watch') ||
               status.includes('under watch');
      });
    } else if (activeFilter === 'closed') {
      // Closed: paid + rejected deals
      filtered = deals.filter(deal => {
        const dealData = brandDeals.find(d => d.id === deal.id);
        const status = dealData?.status?.toLowerCase() || '';
        const brandResponseStatus = (dealData as any)?.brand_response_status?.toLowerCase() || '';
        return status.includes('completed') || 
               status.includes('paid') ||
               brandResponseStatus === 'rejected';
      });
    }

    // Apply advanced filters
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(deal => {
        const dealStatus = deal.status?.toLowerCase() || '';
        return dealStatus === statusFilter.toLowerCase() || 
               (statusFilter === 'signed' && (dealStatus === 'signed' || deal.brandResponseStatus === 'accepted_verified')) ||
               (statusFilter === 'in_progress' && (dealStatus === 'content_making' || dealStatus === 'negotiation'));
      });
    }

    // Brand filter
    if (brandFilter !== 'all') {
      filtered = filtered.filter(deal => deal.brand === brandFilter);
    }

    // Amount range filter
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) {
        filtered = filtered.filter(deal => deal.value >= min);
      }
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) {
        filtered = filtered.filter(deal => deal.value <= max);
      }
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(deal => {
        const dealData = brandDeals.find(d => d.id === deal.id);
        const createdDate = dealData?.created_at ? new Date(dealData.created_at) : null;
        if (!createdDate) return false;

        switch (dateRangeFilter) {
          case 'today':
            return createdDate.toDateString() === now.toDateString();
          case 'this_week':
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return createdDate >= weekAgo;
          case 'this_month':
            return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
          case 'this_quarter':
            const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            return createdDate >= quarterStart;
          case 'overdue':
            const deadline = dealData?.payment_expected_date || dealData?.due_date;
            if (!deadline) return false;
            return new Date(deadline) < now;
          case 'due_soon':
            const dueDate = dealData?.payment_expected_date || dealData?.due_date;
            if (!dueDate) return false;
            const sevenDaysFromNow = new Date(now);
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            const due = new Date(dueDate);
            return due >= now && due <= sevenDaysFromNow;
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      const aDeal = brandDeals.find(d => d.id === a.id);
      const bDeal = brandDeals.find(d => d.id === b.id);
      
      switch (sortBy) {
        case 'newest':
          // Prioritize drafts and newly submitted deals, then by most recent activity (updated_at or created_at)
          const aStatus = aDeal?.status?.toLowerCase() || '';
          const bStatus = bDeal?.status?.toLowerCase() || '';
          const aIsDraft = aStatus === 'draft';
          const bIsDraft = bStatus === 'draft';
          const aIsNewlySubmitted = aStatus.includes('brand_details_submitted') || aStatus.includes('details_submitted');
          const bIsNewlySubmitted = bStatus.includes('brand_details_submitted') || bStatus.includes('details_submitted');
          
          // Drafts first
          if (aIsDraft && !bIsDraft) return -1;
          if (!aIsDraft && bIsDraft) return 1;
          
          // Then newly submitted deals
          if (aIsNewlySubmitted && !bIsNewlySubmitted) return -1;
          if (!aIsNewlySubmitted && bIsNewlySubmitted) return 1;
          
          // Then by most recent activity: use updated_at if available (for recently signed/updated deals), otherwise created_at
          const aUpdatedDate = aDeal?.updated_at ? new Date(aDeal.updated_at).getTime() : 0;
          const bUpdatedDate = bDeal?.updated_at ? new Date(bDeal.updated_at).getTime() : 0;
          const aCreatedDate = aDeal?.created_at ? new Date(aDeal.created_at).getTime() : 0;
          const bCreatedDate = bDeal?.created_at ? new Date(bDeal.created_at).getTime() : 0;
          
          // Use the most recent date (updated_at or created_at) for comparison
          const aMostRecent = Math.max(aUpdatedDate, aCreatedDate);
          const bMostRecent = Math.max(bUpdatedDate, bCreatedDate);
          
          return bMostRecent - aMostRecent;
        
        case 'oldest':
          const aDateOld = aDeal?.created_at ? new Date(aDeal.created_at).getTime() : 0;
          const bDateOld = bDeal?.created_at ? new Date(bDeal.created_at).getTime() : 0;
          return aDateOld - bDateOld;
        
        case 'amount_high':
          return (b.value || 0) - (a.value || 0);
        
        case 'amount_low':
          return (a.value || 0) - (b.value || 0);
        
        case 'deadline_soon':
          const aDeadline = aDeal?.due_date || aDeal?.payment_expected_date;
          const bDeadline = bDeal?.due_date || bDeal?.payment_expected_date;
          if (!aDeadline && !bDeadline) return 0;
          if (!aDeadline) return 1;
          if (!bDeadline) return -1;
          return new Date(aDeadline).getTime() - new Date(bDeadline).getTime();
        
        case 'deadline_later':
          const aDeadlineLate = aDeal?.due_date || aDeal?.payment_expected_date;
          const bDeadlineLate = bDeal?.due_date || bDeal?.payment_expected_date;
          if (!aDeadlineLate && !bDeadlineLate) return 0;
          if (!aDeadlineLate) return 1;
          if (!bDeadlineLate) return -1;
          return new Date(bDeadlineLate).getTime() - new Date(aDeadlineLate).getTime();
        
        case 'status':
          // Sort by status priority: draft < negotiation < signed < content_making < content_delivered < completed
          const statusPriority: Record<string, number> = {
            'draft': 0,
            'pending': 1,
            'negotiation': 2,
            'sent': 3,
            'signed': 4,
            'content_making': 5,
            'content_delivered': 6,
            'completed': 7
          };
          const aPriority = statusPriority[a.status] ?? 99;
          const bPriority = statusPriority[b.status] ?? 99;
          return aPriority - bPriority;
        
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [deals, activeFilter, brandDeals, sortBy, statusFilter, brandFilter, minAmount, maxAmount, dateRangeFilter]);

  // Check if any advanced filters are active
  const hasActiveAdvancedFilters = statusFilter !== 'all' || brandFilter !== 'all' || minAmount || maxAmount || dateRangeFilter !== 'all';

  // Clear all advanced filters
  const clearAdvancedFilters = () => {
    setStatusFilter('all');
    setBrandFilter('all');
    setMinAmount('');
    setMaxAmount('');
    setDateRangeFilter('all');
  };

  return (
    <ErrorBoundary>
      <ContextualTipsProvider currentView="deals">
        <div className={cn(
          `min-h-full ${gradients.page} text-white`,
          "px-4 pt-4 sm:px-5 md:px-6 md:pt-6 lg:px-8",
          "safe-area-fix"
        )}>
          {/* Header - Matching Payments Page */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="space-y-1 md:space-y-2">
              <h1 className={cn(typography.h1, "mb-0")}>Deals Under Protection</h1>
              <p className={cn(typography.body, "font-medium")}>We monitor payments, risks, and next actions for every deal.</p>
            </div>
          </div>

          <div className={cn("min-h-[200px]", spacing.section)}>
            {/* Stats Overview - Compact Grid */}
            <section className="mb-4 md:mb-6">
              {isLoadingDeals ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <SkeletonCard variant="secondary" />
                  <SkeletonCard variant="secondary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <StatCard
                    label="Deals Monitored"
                    value={stats.total}
                    icon={<Briefcase className={cn(iconSizes.md, "text-white")} />}
                    variant="secondary"
                    subtitle={stats.total === 0 ? "No deals yet" : (stats.thisMonth > 0 ? `${stats.thisMonth} added this month` : undefined)}
                    trend={stats.thisMonth > 0 ? { value: stats.thisMonth, isPositive: true } : undefined}
                    isEmpty={stats.total === 0}
                  />
                  <StatCard
                    label="Total Value Under Watch"
                    value={stats.totalValue}
                    icon={<IndianRupee className={cn(iconSizes.md, "text-white")} />}
                    variant="secondary"
                    subtitle={stats.totalValue === 0 ? "Start your first deal to see total earnings" : "Across monitored deals"}
                    isEmpty={stats.totalValue === 0}
                  />
                </div>
              )}
            </section>

            {/* Protect a New Deal CTA */}
            <div className="mb-4 md:mb-6">
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
                  "rounded-2xl",
                  "flex items-center justify-center gap-2",
                  "transition-all duration-200",
                  "shadow-lg shadow-purple-500/20",
                  "min-h-[48px]"
                )}
              >
                <Shield className={cn(iconSizes.md)} />
                Protect a New Deal
              </button>
              <p className="text-[10px] sm:text-[11px] text-purple-300/50 text-center mt-1.5 hidden sm:block">
                Upload a contract or let the brand share details
              </p>
            </div>

            {/* Filter Tabs and Sort - Centered under stats */}
            <div className={cn(
              "flex flex-col gap-3 md:gap-4 mt-4 md:mt-6 mb-4 md:mb-6"
            )}>
              <div className={cn(
                "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              )}>
                {/* Filter Tabs */}
                <div className={cn(
                  "flex items-center justify-start md:justify-center gap-2 md:gap-4",
                  "overflow-x-auto overflow-y-visible py-1 -mx-4 px-4 md:mx-0 md:px-0",
                  "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
                  "flex-nowrap snap-x snap-mandatory w-full sm:w-auto"
                )}>
                  {filters.map((filter) => {
                    const isActive = activeFilter === filter.id;
                    return (
                      <motion.button
                        key={filter.id}
                        onClick={() => {
                          triggerHaptic(HapticPatterns.light);
                          setActiveFilter(filter.id as 'all' | 'action_needed' | 'closed');
                        }}
                        whileTap={animations.microTap}
                        className={cn(
                          "whitespace-nowrap rounded-full border transition-all select-none",
                          "text-sm md:text-base px-3 md:px-5 py-1.5 md:py-2",
                          "flex-shrink-0 font-semibold snap-start",
                          isActive
                            ? "bg-white/15 text-white border-2 border-white/20 scale-[1.02] shadow-sm"
                            : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/8"
                        )}
                      >
                        {filter.label}
                        {filter.id === 'action_needed' && filter.count !== undefined && filter.count > 0 && (
                          <span className={cn(
                            "ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold",
                            isActive ? "bg-white/25 text-white" : "bg-white/10 text-white/80"
                          )}>
                            {filter.count}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                
                {/* Sort and Advanced Filter Controls */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Advanced Filter Toggle */}
                  <motion.button
                    onClick={() => {
                      triggerHaptic(HapticPatterns.light);
                      setShowAdvancedFilters(!showAdvancedFilters);
                    }}
                    whileTap={animations.microTap}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
                      "bg-white/5 text-white border-white/10 hover:bg-white/8",
                      hasActiveAdvancedFilters && "bg-purple-500/20 border-purple-400/30 text-purple-300",
                      "text-sm h-9"
                    )}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Filters</span>
                    {hasActiveAdvancedFilters && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-500/30 text-xs font-semibold">
                        {[statusFilter !== 'all', brandFilter !== 'all', minAmount || maxAmount, dateRangeFilter !== 'all'].filter(Boolean).length}
                      </span>
                    )}
                  </motion.button>

                  {/* Sort Dropdown */}
                  <Select
                    value={sortBy}
                    onValueChange={(value) => {
                      triggerHaptic(HapticPatterns.light);
                      setSortBy(value as typeof sortBy);
                    }}
                  >
                    <SelectTrigger className={cn(
                      "w-full sm:w-[180px]",
                      "bg-white/5 text-white border-white/10",
                      "hover:bg-white/8 focus:ring-2 focus:ring-purple-500/50",
                      "h-9 text-sm"
                    )}>
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4 text-white/60" />
                        <SelectValue placeholder="Sort by" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-[#1C1C1E] border-white/10 text-white">
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="amount_high">Amount: High to Low</SelectItem>
                      <SelectItem value="amount_low">Amount: Low to High</SelectItem>
                      <SelectItem value="deadline_soon">Deadline: Soonest</SelectItem>
                      <SelectItem value="deadline_later">Deadline: Latest</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {showAdvancedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    "bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6",
                    "space-y-4"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
                    <div className="flex items-center gap-2">
                      {hasActiveAdvancedFilters && (
                        <button
                          onClick={clearAdvancedFilters}
                          className="text-sm text-purple-300 hover:text-purple-200 underline"
                        >
                          Clear All
                        </button>
                      )}
                      <button
                        onClick={() => setShowAdvancedFilters(false)}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="bg-white/5 text-white border-white/10 h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1C1C1E] border-white/10 text-white">
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="negotiation">Negotiation</SelectItem>
                          <SelectItem value="signed">Signed</SelectItem>
                          <SelectItem value="content_making">Content Making</SelectItem>
                          <SelectItem value="content_delivered">Content Delivered</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Brand Filter */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Brand</label>
                      <Select value={brandFilter} onValueChange={setBrandFilter}>
                        <SelectTrigger className="bg-white/5 text-white border-white/10 h-9 text-sm">
                          <SelectValue placeholder="All Brands" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1C1C1E] border-white/10 text-white max-h-[200px]">
                          <SelectItem value="all">All Brands</SelectItem>
                          {uniqueBrands.map(brand => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Amount Range */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Amount Range (₹)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minAmount}
                          onChange={(e) => setMinAmount(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                        <span className="text-white/60">-</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxAmount}
                          onChange={(e) => setMaxAmount(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Date Range</label>
                      <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                        <SelectTrigger className="bg-white/5 text-white border-white/10 h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1C1C1E] border-white/10 text-white">
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="this_week">This Week</SelectItem>
                          <SelectItem value="this_month">This Month</SelectItem>
                          <SelectItem value="this_quarter">This Quarter</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="due_soon">Due Soon (7 days)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Content Section */}
            <section className="flex flex-col gap-6 md:gap-8">
              {/* Loading State */}
              {isLoadingDeals ? (
                <div className={cn("py-12 text-center")}>
                  <div className="text-white/60">Loading deals...</div>
                </div>
              ) : filteredDeals.length > 0 ? (
                /* Deals List - Matching Payments Page Card Style */
                <div className={cn("space-y-5 sm:space-y-6")}>
          {filteredDeals.map((deal, index) => {
            const statusInfo = getStatusConfig(deal.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <motion.div
                key={deal.id}
                initial={motionTokens.slide.up.initial}
                animate={motionTokens.slide.up.animate}
                transition={{ ...motionTokens.slide.up.transition, delay: index * 0.05 }}
                whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
                whileTap={animations.microTap}
              >
                <BaseCard 
                  variant="secondary" 
                  className={cn(
                    animations.cardHover,
                    "cursor-pointer relative overflow-hidden"
                  )}
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    navigate(`/creator-contracts/${deal.id}`);
                  }}
                >
                  {/* Deal Header */}
                  <div className={cn("flex items-start justify-between mb-3")}>
                    <div className="flex-1">
                      <h3 className={cn(typography.h4, "mb-1")}>{deal.title}</h3>
                      <div className={cn("flex items-center gap-2", typography.bodySmall)}>
                        <span>{deal.brand}</span>
                        <span>•</span>
                        <span>{deal.platform}</span>
                      </div>
                    </div>
                    <ChevronRight className={cn(iconSizes.lg, "text-purple-300 flex-shrink-0 ml-2 transition-transform group-hover:translate-x-1")} />
                  </div>

                  {/* Deal Value */}
                  <div className={cn("flex items-center gap-2 mb-4 flex-wrap")}>
                    <div className={cn("bg-green-500/20 text-green-400", spacing.cardPadding.tertiary, radius.md, typography.bodySmall, "font-semibold")}>
                      ₹{Math.round(deal.value).toLocaleString('en-IN')}
                    </div>
                    <div className={cn(typography.caption, "text-purple-300")}>{deal.type}</div>
                    {/* Brand Response Status Chip - Smaller and muted */}
                    {deal.brandResponseStatus && (() => {
                      const statusConfig = {
                        pending: {
                          label: 'Payment Not Secured',
                          color: 'text-yellow-400/70',
                          bgColor: 'bg-yellow-500/10',
                          borderColor: 'border-yellow-500/20',
                        },
                        accepted: {
                          label: '✅ Brand Accepted',
                          color: 'text-green-400/70',
                          bgColor: 'bg-green-500/10',
                          borderColor: 'border-green-500/20',
                        },
                        negotiating: {
                          label: '🟡 Negotiating',
                          color: 'text-orange-400/70',
                          bgColor: 'bg-orange-500/10',
                          borderColor: 'border-orange-500/20',
                        },
                        rejected: {
                          label: '❌ Rejected',
                          color: 'text-red-400/70',
                          bgColor: 'bg-red-500/10',
                          borderColor: 'border-red-500/20',
                        },
                      };
                      const config = statusConfig[deal.brandResponseStatus as keyof typeof statusConfig];
                      if (!config) return null;
                      return (
                        <div className={cn(
                          "rounded-full px-1.5 py-0.5 text-[9px] font-medium border",
                          config.color,
                          config.bgColor,
                          config.borderColor
                        )}>
                          {config.label}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Protection Status - Matching Payments Style */}
                  <div className="mb-4">
                    <div className={cn("flex items-center justify-between", typography.caption, "text-purple-200 mb-1")}>
                      <span>Protection Status — {deal.progress < 30 ? 'Low' : deal.progress < 70 ? 'Medium' : 'High'}</span>
                    </div>
                    <div className={cn("w-full bg-white/10", radius.full, "h-2")}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${deal.progress}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={cn(
                          "h-2 rounded-full transition-all",
                          deal.status === 'completed' ? 'bg-green-500' :
                          deal.status === 'active' ? 'bg-blue-500' :
                          deal.status === 'negotiation' ? 'bg-purple-500' :
                          'bg-yellow-500'
                        )}
                      />
                    </div>
                    <p className={cn(typography.caption, "text-purple-300/70 mt-1")}>
                      {deal.status === 'draft' ? 'Contract in draft stage' :
                       deal.status === 'sent' ? 'Contract sent to brand' :
                       deal.status === 'negotiation' ? 'Negotiation in progress' :
                       deal.status === 'signed' ? 'Contract signed' :
                       deal.status === 'content_making' ? 'Content creation in progress' :
                       deal.status === 'content_delivered' ? 'Content delivered, awaiting payment' :
                       deal.status === 'completed' ? 'Payment received' :
                       'Status pending'}
                    </p>
                  </div>

                  {/* Status and Payment Due */}
                  <div className={cn("flex items-center justify-between mb-3")}>
                    <div className={cn("flex items-center gap-2")}>
                      <StatusIcon className={iconSizes.sm} />
                      <span className={cn(typography.bodySmall, "font-medium")}>{statusInfo.label}</span>
                    </div>
                    <div className={cn("flex items-center gap-1", typography.caption)}>
                      <Calendar className={iconSizes.xs} />
                      <span>Payment Due: {deal.deadline}</span>
                    </div>
                  </div>

                  {/* Next Action */}
                  <div className={cn("pt-3 border-t border-white/10")}>
                    <div className={cn("flex items-center gap-2", typography.bodySmall)}>
                      <AlertCircle className={cn(iconSizes.sm, "text-purple-300")} />
                      <span className="text-purple-200">Next Action: </span>
                      <span className="text-white">{deal.nextStep}</span>
                    </div>
                  </div>
                </BaseCard>
              </motion.div>
            );
          })}
                </div>
              ) : (
                /* Empty State - Centered and compact */
                <div className="flex justify-center md:pt-6">
                  <div className="w-full max-w-xl text-center">
                    {deals.length === 0 ? (
                      <NoDealsEmptyState
                        onAddDeal={() => navigate('/contract-upload')}
                        onExploreBrands={() => {
                          toast.info('Explore Brands coming soon!', {
                            description: 'We\'re working on bringing you an amazing brand directory experience.',
                            duration: 3000,
                          });
                        }}
                        variant="compact"
                      />
                    ) : (
                      <FilteredNoMatchesEmptyState
                        onClearFilters={() => setActiveFilter('all' as 'all' | 'action_needed' | 'closed')}
                        filterCount={activeFilter !== 'all' ? 1 : 0}
                      />
                    )}
                  </div>
                </div>
              )}
            </section>

          </div>
        </div>
      </ContextualTipsProvider>
    </ErrorBoundary>
  );
};

export default CreatorContracts;
