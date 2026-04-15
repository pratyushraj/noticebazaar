"use client";

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BrandDeal } from '@/types';
import { computePaymentStatus, computeDaysUntilDue, PaymentStatus } from '@/lib/constants/paymentStatus';

interface PaymentQuickFiltersProps {
  allDeals: BrandDeal[];
  activeFilter: PaymentStatus | 'all' | null;
  onFilterChange: (filter: PaymentStatus | 'all' | null) => void;
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

    let overdue = 0;
    let dueThisWeek = 0;
    let pending = 0;
    let paid = 0;

    for (const deal of allDeals) {
      const status = computePaymentStatus(deal.payment_received_date, deal.payment_expected_date);
      const days = computeDaysUntilDue(deal.payment_expected_date);

      if (status === 'paid') {
        paid++;
      } else if (status === 'overdue') {
        overdue++;
      } else if (status === 'upcoming' || (days !== null && days <= 7)) {
        dueThisWeek++;
      } else {
        pending++;
      }
    }

    return {
      all: allDeals.length,
      overdue,
      dueThisWeek,
      pending,
      paid,
    };
  }, [allDeals]);

  const filters: Array<{ id: PaymentStatus | 'all'; label: string; count: number }> = [
    { id: 'all', label: 'All', count: filterCounts.all },
    { id: 'overdue', label: 'Overdue', count: filterCounts.overdue },
    { id: 'upcoming', label: 'Due This Week', count: filterCounts.dueThisWeek },
    { id: 'pending', label: 'Pending', count: filterCounts.pending },
    { id: 'paid', label: 'Paid', count: filterCounts.paid },
  ];

  return (
    <div className="mt-3 md:mt-4">
      <div className="w-full bg-secondary/[0.03] border border-border rounded-2xl backdrop-blur-lg px-2 md:px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => onFilterChange(activeFilter === filter.id ? null : filter.id)}
            className={cn(
              'px-2.5 md:px-3 py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap border transition-all duration-300',
              activeFilter === filter.id
                ? 'bg-secondary/50 border-border text-foreground shadow-[0_0_12px_rgba(255,255,255,0.08)]'
                : 'border-border text-gray-300 hover:bg-card'
            )}
          >
            {filter.label}
            <span className={cn(
              'ml-1 text-xs',
              activeFilter === filter.id ? 'text-foreground/80' : 'text-gray-400'
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
