"use client";

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandDeal } from '@/types';

interface PaymentQuickFiltersProps {
  allDeals: BrandDeal[];
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

const PaymentQuickFilters: React.FC<PaymentQuickFiltersProps> = ({
  allDeals,
  activeFilter,
  onFilterChange,
}) => {
  const filterCounts = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const overdue = allDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate < now;
    });

    const dueThisWeek = allDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate >= now && dueDate <= sevenDaysFromNow;
    });

    const pending = allDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate >= now;
    });

    const paid = allDeals.filter(deal => 
      deal.status === 'Completed' && deal.payment_received_date
    );

    return {
      all: allDeals.length,
      overdue: overdue.length,
      dueThisWeek: dueThisWeek.length,
      pending: pending.length,
      paid: paid.length,
    };
  }, [allDeals]);

  const filters = [
    { id: 'all', label: 'All', count: filterCounts.all },
    { id: 'overdue', label: 'Overdue', count: filterCounts.overdue },
    { id: 'due_this_week', label: 'Due This Week', count: filterCounts.dueThisWeek },
    { id: 'pending', label: 'Pending', count: filterCounts.pending },
    { id: 'paid', label: 'Paid', count: filterCounts.paid },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(activeFilter === filter.id ? null : filter.id)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
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

export default PaymentQuickFilters;

