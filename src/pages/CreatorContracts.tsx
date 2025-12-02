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
import { sectionLayout, animations, spacing, typography, separators, iconSizes, scroll, gradients, cardVariants } from '@/lib/design-system';
import { BaseCard, StatCard } from '@/components/ui/card-variants';

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

  return (
    <ContextualTipsProvider currentView="deals">
    <div className={`min-h-screen ${gradients.page} text-white ${spacing.page} pb-24 ${scroll.container}`}>
      {/* Header */}
      <div className={sectionLayout.header}>
        <h1 className={typography.h1 + " mb-2"}>Brand Deals</h1>
        <p className={typography.body}>Track and manage your partnerships</p>
      </div>

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

      {/* Section Separator */}
      <div className={separators.section} />

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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <BaseCard 
                variant="secondary" 
                className={`${animations.cardHover} ${animations.cardPress} cursor-pointer`}
                onClick={() => {
                  triggerHaptic('light');
                  navigate(`/creator-contracts/${deal.id}`);
                }}
              >
              {/* Deal Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className={typography.h3 + " mb-1"}>{deal.title}</h3>
                  <div className={`flex items-center gap-2 ${typography.bodySmall}`}>
                    <span>{deal.brand}</span>
                    <span>•</span>
                    <span>{deal.platform}</span>
                  </div>
                </div>
                <ChevronRight className={`${iconSizes.lg} text-purple-300 flex-shrink-0 ml-2 transition-transform group-hover:translate-x-1`} />
              </div>

              {/* Deal Value */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`bg-green-500/20 text-green-400 px-3 py-1.5 ${cardVariants.tertiary.radius} ${typography.bodySmall} font-semibold`}>
                  ₹{(deal.value / 1000).toFixed(0)}K
                </div>
                <div className={`${typography.caption} text-purple-300`}>{deal.type}</div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-purple-200 mb-1">
                  <span>Progress</span>
                  <span>{deal.progress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      deal.status === 'completed' ? 'bg-green-500' :
                      deal.status === 'active' ? 'bg-blue-500' :
                      deal.status === 'negotiation' ? 'bg-purple-500' :
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${deal.progress}%` }}
                  />
                </div>
              </div>

              {/* Status and Deadline */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon className={iconSizes.sm} />
                  <span className={`${typography.bodySmall} font-medium`}>{statusConfig[deal.status as DealStatus].label}</span>
                </div>
                <div className={`flex items-center gap-1 ${typography.caption}`}>
                  <Calendar className={iconSizes.xs} />
                  <span>{deal.deadline}</span>
                </div>
              </div>

              {/* Next Step */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className={`flex items-center gap-2 ${typography.bodySmall}`}>
                  <AlertCircle className={`${iconSizes.sm} text-purple-300`} />
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
        <div className="py-8">
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

      {/* FAB - Add New Deal */}
      <button 
        onClick={() => {
          triggerHaptic('medium');
          navigate('/contract-upload');
        }}
        className="fixed bottom-24 right-6 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-full p-5 shadow-[0_8px_32px_rgba(59,130,246,0.5)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.6)] transition-all duration-200 hover:scale-110 active:scale-[0.97] z-50 backdrop-blur-[20px] border border-white/20"
        aria-label="Add new deal"
      >
        <Plus className={iconSizes.lg} />
      </button>
    </div>
    </ContextualTipsProvider>
  );
};

export default CreatorContracts;
