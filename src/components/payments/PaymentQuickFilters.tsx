"use client";

import React, { useMemo } from 'react';
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
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm text-slate-400">Filter:</span>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(activeFilter === filter.id ? null : filter.id)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
            activeFilter === filter.id
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600"
          )}
        >
          {filter.label} ({filter.count})
        </button>
      ))}
    </div>
  );
};

export default PaymentQuickFilters;

