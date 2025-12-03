"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandDeal } from '@/types';
import { DealStage } from '@/lib/hooks/useBrandDeals';

interface QuickFilterChipsProps {
  allDeals: BrandDeal[];
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

// Helper function to map old status to new stage
const getDealStage = (deal: BrandDeal): DealStage => {
  const status = deal.status?.toLowerCase() || '';
  
  // Map old statuses to new stages
  if (status.includes('draft')) return 'negotiation';
  if (status.includes('review')) return 'signed';
  if (status.includes('negotiation')) return 'negotiation';
  if (status.includes('signed')) return 'signed';
  if (status.includes('content_making') || status.includes('content making')) return 'content_making';
  if (status.includes('content_delivered') || status.includes('content delivered')) return 'content_delivered';
  if (status.includes('completed')) return 'completed';
  
  // Fallback: use progress_percentage if available
  if (deal.progress_percentage !== null && deal.progress_percentage !== undefined) {
    if (deal.progress_percentage >= 100) return 'completed';
    if (deal.progress_percentage >= 90) return 'content_delivered';
    if (deal.progress_percentage >= 80) return 'content_making';
    if (deal.progress_percentage >= 70) return 'signed';
    return 'negotiation';
  }
  
  // Default fallback
  return 'negotiation';
};

const QuickFilterChips: React.FC<QuickFilterChipsProps> = ({
  allDeals,
  activeFilter,
  onFilterChange,
}) => {
  const filterCounts = React.useMemo(() => {
    const dealsWithStages = allDeals.map(deal => ({ deal, stage: getDealStage(deal) }));
    
    const active = dealsWithStages.filter(({ stage }) => 
      stage === 'signed' || stage === 'content_making' || stage === 'content_delivered'
    ).length;
    const pendingPayment = dealsWithStages.filter(({ deal }) => 
      deal.status === 'Payment Pending' || (deal.payment_expected_date && !deal.payment_received_date)
    ).length;
    
    // Expiring soon (due in 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringSoon = dealsWithStages.filter(({ deal }) => {
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate >= now && dueDate <= sevenDaysFromNow;
    }).length;
    
    const completed = dealsWithStages.filter(({ stage }) => stage === 'completed').length;
    
    return {
      all: allDeals.length,
      active,
      pendingPayment,
      expiringSoon,
      completed,
    };
  }, [allDeals]);

  const filters = [
    { id: 'all', label: 'All', count: filterCounts.all },
    { id: 'active', label: 'Active', count: filterCounts.active },
    { id: 'pending_payment', label: 'Pending Payment', count: filterCounts.pendingPayment },
    { id: 'expiring_soon', label: 'Expiring Soon', count: filterCounts.expiringSoon },
    { id: 'completed', label: 'Completed', count: filterCounts.completed },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(activeFilter === filter.id ? null : filter.id)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
            "border",
            activeFilter === filter.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:border-primary/50"
          )}
        >
          {filter.label} ({filter.count})
        </button>
      ))}
      {activeFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange(null)}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="w-3 h-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
};

export default QuickFilterChips;

