"use client";

import React, { useMemo } from 'react';
import { BrandDeal } from '@/types';
import { TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface NanoMetricsProps {
  brandDeals?: BrandDeal[];
  totalEarnings: number;
}

const NanoMetrics: React.FC<NanoMetricsProps> = ({ brandDeals = [], totalEarnings }) => {
  const metrics = useMemo(() => {
    const completedDeals = brandDeals.filter(d => d.status === 'Completed');
    const dealCount = completedDeals.length || 1;
    const avgDealSize = Math.round(totalEarnings / dealCount);

    // Calculate on-time payment rate
    const dealsWithPaymentDates = brandDeals.filter(d => 
      d.payment_received_date && d.payment_expected_date
    );
    const onTimePayments = dealsWithPaymentDates.filter(d => {
      const received = new Date(d.payment_received_date!);
      const expected = new Date(d.payment_expected_date);
      return received <= expected;
    }).length;
    const onTimeRate = dealsWithPaymentDates.length > 0
      ? Math.round((onTimePayments / dealsWithPaymentDates.length) * 100)
      : 92; // Demo: 92%

    // Calculate average payment cycle (days from deal approval to payment)
    let totalDays = 0;
    let cycleCount = 0;
    dealsWithPaymentDates.forEach(d => {
      if (d.created_at && d.payment_received_date) {
        const created = new Date(d.created_at);
        const received = new Date(d.payment_received_date);
        const days = Math.floor((received.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        totalDays += days;
        cycleCount++;
      }
    });
    const avgPaymentCycle = cycleCount > 0
      ? Math.round(totalDays / cycleCount)
      : 35; // Demo: 35 days

    // For demo mode (empty or few deals), return demo values
    if (brandDeals.length <= 6) {
      return {
        avgDealSize: 71425,
        onTimeRate: 92,
        avgPaymentCycle: 35,
      };
    }

    return {
      avgDealSize,
      onTimeRate,
      avgPaymentCycle,
    };
  }, [brandDeals, totalEarnings]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
        <span>Avg deal size: <span className="text-foreground font-semibold">₹{metrics.avgDealSize.toLocaleString('en-IN')}</span></span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle className="h-3.5 w-3.5 text-blue-400" />
        <span>On-time payment rate: <span className="text-foreground font-semibold">{metrics.onTimeRate}%</span></span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5 text-purple-400" />
        <span>Avg payment cycle: <span className="text-foreground font-semibold">{metrics.avgPaymentCycle} days</span></span>
      </div>
    </div>
  );
};

export default NanoMetrics;

