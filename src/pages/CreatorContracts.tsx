"use client";

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, Clock, CheckCircle, AlertCircle, IndianRupee, Calendar, ChevronRight, Plus } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { motion } from 'framer-motion';
import { ContextualTipsProvider } from '@/components/contextual-tips/ContextualTipsProvider';
import { FilteredNoMatchesEmptyState, NoDealsEmptyState } from '@/components/empty-states/PreconfiguredEmptyStates';
import { sectionLayout, animations, spacing, typography, iconSizes, radius, shadows, zIndex, glass, vision, motion as motionTokens, gradients, separators, scroll } from '@/lib/design-system';
import { BaseCard, StatCard } from '@/components/ui/card-variants';
import { Divider } from '@/components/ui/Divider';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { cn } from '@/lib/utils';

const CreatorContracts = () => {
  const navigate = useNavigate();
  const { profile } = useSession();
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Fetch real brand deals data (single call for both data and loading state)
  const { data: brandDeals = [], isLoading: isLoadingDeals } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  // Transform brand deals to match UI format
  const deals = useMemo(() => {
    // Return empty array for new users (empty state will handle it)
    if (!brandDeals.length) {
      return [];
    }

    return brandDeals.map(deal => {
      // Map status from database to UI status
      let status = 'pending';
      let progress = 0;
      let nextStep = 'Review contract';

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
        const statusLower = (deal.status || '').toLowerCase();
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

      return {
        id: deal.id,
        title: `${deal.brand_name} Deal`,
        brand: deal.brand_name,
        value: deal.deal_amount || 0,
        status,
        progress,
        deadline: deal.due_date ? new Date(deal.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
        platform: deal.platform || 'Multiple',
        type: 'Brand Partnership',
        nextStep
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

  const filters = useMemo(() => [
    { id: 'all', label: 'All Deals', count: stats.total },
    { id: 'active', label: 'Active', count: stats.active },
    { id: 'pending', label: 'Pending', count: stats.pending },
    { id: 'completed', label: 'Completed', count: stats.completed }
  ], [stats]);

  const filteredDeals = activeFilter === 'all' 
    ? deals 
    : deals.filter(deal => deal.status === activeFilter);

  return (
    <ErrorBoundary>
      <ContextualTipsProvider currentView="deals">
        <div className={cn(`min-h-full ${gradients.page} text-white ${spacing.page} pb-24 safe-area-fix`)}>
          {/* Header - Matching Payments Page */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={cn(typography.h1, "mb-1")}>Brand Deals</h1>
              <p className={cn(typography.body, "font-medium")}>Track and manage your partnerships</p>
            </div>
          </div>

          <div className={cn("min-h-[200px]", spacing.section)}>
            {/* Stats Overview - Always visible */}
            {isLoadingDeals ? (
              <div className={sectionLayout.grid.two}>
                <SkeletonCard variant="secondary" />
                <SkeletonCard variant="secondary" />
              </div>
            ) : (
              <div className={cn("grid grid-cols-2 gap-3 md:gap-5 mb-6")}>
                <StatCard
                  label="Total Deals"
                  value={stats.total}
                  icon={<Briefcase className={cn(iconSizes.md, "text-white")} />}
                  variant="secondary"
                  subtitle={stats.thisMonth > 0 ? `+${stats.thisMonth} this month` : undefined}
                  trend={stats.thisMonth > 0 ? { value: stats.thisMonth, isPositive: true } : undefined}
                />
                <StatCard
                  label="Total Value"
                  value={stats.totalValue}
                  icon={<IndianRupee className={cn(iconSizes.md, "text-white")} />}
                  variant="secondary"
                  subtitle="Across all deals"
                />
              </div>
            )}

            {/* Section Separator - Matching Payments Page */}
            <div className={cn("h-[1px] w-full bg-white/5 my-6")} />

            {/* Filter Tabs - Matching Payments Page Style */}
            <div className={cn(
              "flex gap-2 overflow-x-auto overflow-y-visible py-1 mb-6",
              "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            )}>
              {filters.map((filter) => {
                const isActive = activeFilter === filter.id;
                return (
                  <motion.button
                    key={filter.id}
                    onClick={() => {
                      triggerHaptic(HapticPatterns.light);
                      setActiveFilter(filter.id);
                    }}
                    whileTap={animations.microTap}
                    className={cn(
                      "whitespace-nowrap rounded-full border transition-all select-none",
                      "text-xs sm:text-sm px-2 py-1.5",
                      "flex-shrink-0 font-semibold",
                      isActive
                        ? "bg-white/15 text-white border-2 border-white/20 scale-[1.02] shadow-sm"
                        : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/8"
                    )}
                  >
                    {filter.label}
                    {filter.count !== undefined && (
                      <span className={cn(
                        "ml-1.5 px-1.5 py-0.5 rounded-full text-xs",
                        isActive ? "bg-white/25" : "bg-white/10"
                      )}>
                        {filter.count}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

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
                  <div className={cn("flex items-center gap-2 mb-4")}>
                    <div className={cn("bg-green-500/20 text-green-400", spacing.cardPadding.tertiary, radius.md, typography.bodySmall, "font-semibold")}>
                      ₹{Math.round(deal.value).toLocaleString('en-IN')}
                    </div>
                    <div className={cn(typography.caption, "text-purple-300")}>{deal.type}</div>
                  </div>

                  {/* Progress Bar - Matching Payments Style */}
                  <div className="mb-4">
                    <div className={cn("flex items-center justify-between", typography.caption, "text-purple-200 mb-1")}>
                      <span>Progress</span>
                      <span>{deal.progress}%</span>
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
                  </div>

                  {/* Status and Deadline */}
                  <div className={cn("flex items-center justify-between mb-3")}>
                    <div className={cn("flex items-center gap-2")}>
                      <StatusIcon className={iconSizes.sm} />
                      <span className={cn(typography.bodySmall, "font-medium")}>{statusInfo.label}</span>
                    </div>
                    <div className={cn("flex items-center gap-1", typography.caption)}>
                      <Calendar className={iconSizes.xs} />
                      <span>{deal.deadline}</span>
                    </div>
                  </div>

                  {/* Next Step */}
                  <div className={cn("pt-3 border-t border-white/10")}>
                    <div className={cn("flex items-center gap-2", typography.bodySmall)}>
                      <AlertCircle className={cn(iconSizes.sm, "text-purple-300")} />
                      <span className="text-purple-200">Next: </span>
                      <span className="text-white">{deal.nextStep}</span>
                    </div>
                  </div>
                </BaseCard>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Empty State - Always show when no deals */
        <div className={cn("py-12")}>
          {deals.length === 0 ? (
            <NoDealsEmptyState
              onAddDeal={() => navigate('/contract-upload')}
              onExploreBrands={() => navigate('/brand-directory')}
            />
          ) : (
            <FilteredNoMatchesEmptyState
              onClearFilters={() => setActiveFilter('all')}
              filterCount={activeFilter !== 'all' ? 1 : 0}
            />
          )}
        </div>
      )}

          </div>
        </div>
      </ContextualTipsProvider>
    </ErrorBoundary>
  );
};

export default CreatorContracts;
