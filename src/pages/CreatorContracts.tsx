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
import { sectionLayout, animations, spacing, typography, iconSizes, scroll, radius, shadows, zIndex, glass, vision, motion as motionTokens, colors } from '@/lib/design-system';
import { BaseCard, StatCard } from '@/components/ui/card-variants';
import { CreatorNavigationWrapper } from '@/components/navigation/CreatorNavigationWrapper';
import { Divider } from '@/components/ui/Divider';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { cn } from '@/lib/utils';

const CreatorContracts = () => {
  const navigate = useNavigate();
  const { profile } = useSession();
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Fetch real brand deals data
  const { data: brandDeals = [] } = useBrandDeals({
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

      if (deal.status === 'Completed') {
        status = 'completed';
        progress = 100;
        nextStep = 'Payment processing';
      } else if (deal.status === 'Payment Pending') {
        status = 'active';
        progress = 75;
        nextStep = 'Awaiting payment';
      } else if (deal.status === 'Drafting') {
        status = 'negotiation';
        progress = 30;
        nextStep = 'Review contract terms';
      } else {
        status = 'pending';
        progress = 20;
        nextStep = 'Awaiting brand approval';
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
    const active = brandDeals.filter(d => d.status !== 'Completed' && d.status !== 'Drafting').length;
    const pending = brandDeals.filter(d => d.status === 'Drafting' || !d.status).length;
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

  type DealStatus = 'pending' | 'negotiation' | 'active' | 'completed';
  
  const statusConfig: Record<DealStatus, { color: string; label: string; icon: typeof Clock }> = {
    pending: { color: 'bg-yellow-500', label: 'Pending', icon: Clock },
    negotiation: { color: 'bg-blue-500', label: 'Negotiation', icon: TrendingUp },
    active: { color: 'bg-green-500', label: 'Active', icon: CheckCircle },
    completed: { color: 'bg-purple-500', label: 'Completed', icon: CheckCircle }
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

  const { isLoading: isLoadingDeals } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  return (
    <ErrorBoundary>
      <ContextualTipsProvider currentView="deals">
        <CreatorNavigationWrapper
          title="Brand Deals"
          subtitle="Track and manage your partnerships"
        >
          <div className={cn(scroll.container, spacing.section)}>
            {/* Stats Overview */}
            {isLoadingDeals ? (
              <div className={sectionLayout.grid.two}>
                <SkeletonCard variant="secondary" />
                <SkeletonCard variant="secondary" />
              </div>
            ) : (
              <div className={sectionLayout.grid.two}>
                <StatCard
                  label="Total Deals"
                  value={stats.total}
                  icon={<Briefcase className={cn(iconSizes.md, "text-purple-300")} />}
                  variant="secondary"
                  className="text-left"
                />
                <StatCard
                  label="Total Value"
                  value={`₹${(stats.totalValue / 1000).toFixed(0)}K`}
                  icon={<IndianRupee className={cn(iconSizes.md, "text-purple-300")} />}
                  variant="secondary"
                  className="text-left"
                />
              </div>
            )}

            <Divider variant="section" />

      {/* Stats Overview */}
      <div className={`${sectionLayout.grid.two} mb-6`}>
        <StatCard
          label="Total Deals"
          value={stats.total}
          icon={<Briefcase className={`${iconSizes.md} text-purple-300`} />}
          variant="secondary"
          className="text-left"
        />
        <StatCard
          label="Total Value"
          value={`₹${(stats.totalValue / 1000).toFixed(0)}K`}
          icon={<IndianRupee className={`${iconSizes.md} text-purple-300`} />}
          variant="secondary"
          className="text-left"
        />
      </div>

            {/* iOS Segmented Control */}
            <div className="mb-6">
        <SegmentedControl
          options={filters.map(f => ({ id: f.id, label: f.label, count: f.count }))}
          value={activeFilter}
          onChange={setActiveFilter}
          className="w-full"
        />
      </div>

      {/* Deals List */}
      <div className={spacing.compact}>
        {filteredDeals.map((deal, index) => {
          const StatusIcon = statusConfig[deal.status as DealStatus].icon;
          
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
                {/* Spotlight on hover */}
                <div className={cn(vision.spotlight.hover, "opacity-0 group-hover:opacity-100")} />
              {/* Deal Header */}
              <div className={cn("flex items-start justify-between", spacing.compact)}>
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
              <div className={cn("flex items-center gap-2", spacing.compact)}>
                <div className={cn("bg-green-500/20 text-green-400", spacing.cardPadding.tertiary, radius.md, typography.bodySmall, "font-semibold")}>
                  ₹{(deal.value / 1000).toFixed(0)}K
                </div>
                <div className={cn(typography.caption, "text-purple-300")}>{deal.type}</div>
              </div>

              {/* Progress Bar */}
              <div className={spacing.compact}>
                <div className={cn("flex items-center justify-between", typography.caption, "text-purple-200 mb-1")}>
                  <span>Progress</span>
                  <span>{deal.progress}%</span>
                </div>
                <div className={cn("w-full bg-white/10", radius.full, "h-2")}>
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      deal.status === 'completed' ? 'bg-green-500' :
                      deal.status === 'active' ? 'bg-blue-500' :
                      deal.status === 'negotiation' ? 'bg-purple-500' :
                      'bg-yellow-500'
                    )}
                    style={{ width: `${deal.progress}%` }}
                  />
                </div>
              </div>

              {/* Status and Deadline */}
              <div className={cn("flex items-center justify-between", spacing.compact)}>
                <div className={cn("flex items-center gap-2")}>
                  <StatusIcon className={iconSizes.sm} />
                  <span className={cn(typography.bodySmall, "font-medium")}>{statusConfig[deal.status as DealStatus].label}</span>
                </div>
                <div className={cn("flex items-center gap-1", typography.caption)}>
                  <Calendar className={iconSizes.xs} />
                  <span>{deal.deadline}</span>
                </div>
              </div>

              {/* Next Step */}
              <div className={cn("mt-3 pt-3 border-t border-white/10")}>
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

      {/* Empty State */}
      {filteredDeals.length === 0 && (
        <div className={cn("py-8")}>
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

            {/* FAB - Add New Deal - iOS 17 + visionOS */}
            <motion.button 
              onClick={() => {
                triggerHaptic(HapticPatterns.medium);
                navigate('/contract-upload');
              }}
              whileTap={animations.microTap}
              whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
              className={cn(
                "fixed bottom-24 right-6 relative overflow-hidden",
                gradients.primary,
                "text-white",
                radius.full,
                spacing.cardPadding.primary,
                shadows.vision,
                zIndex.modal,
                glass.apple,
                "transition-all duration-200"
              )}
              aria-label="Add new deal"
            >
              {/* Spotlight gradient */}
              <div className={cn(vision.spotlight.base, "opacity-30")} />
              
              {/* Glare effect */}
              <div className={vision.glare.soft} />
              
              <Plus className={cn(iconSizes.lg, "relative z-10")} />
            </motion.button>
          </div>
        </CreatorNavigationWrapper>
      </ContextualTipsProvider>
    </ErrorBoundary>
  );
};

export default CreatorContracts;
