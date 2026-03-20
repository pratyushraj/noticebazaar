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
    <div className="mt-3 md:mt-4">
      <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-lg px-2 md:px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(activeFilter === filter.id ? null : filter.id)}
            className={cn(
              "px-2.5 md:px-3 py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap border transition-all duration-300",
              activeFilter === filter.id
                ? "bg-white/10 border-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.08)]"
                : "border-white/10 text-gray-300 hover:bg-white/5"
            )}
          >
            {filter.label}
            <span className={cn(
              "ml-1 text-xs",
              activeFilter === filter.id ? "text-white/80" : "text-gray-400"
            )}>
              ({filter.count})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PaymentQuickFilters;

