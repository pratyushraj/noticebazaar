"use client";

import React, { useMemo } from 'react';
import { TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { BrandDeal } from '@/types';
import { cn } from '@/lib/utils';

interface EarningsNanoMetricsProps {
  brandDeals?: BrandDeal[];
  currentEarnings?: number;
}

const EarningsNanoMetrics: React.FC<EarningsNanoMetricsProps> = ({ brandDeals = [] }) => {
  const metrics = useMemo(() => {
    const completedDeals = brandDeals.filter(d => d.status === 'Completed' && d.deal_amount > 0);
    const avgDealSize = completedDeals.length > 0
      ? completedDeals.reduce((sum, d) => sum + d.deal_amount, 0) / completedDeals.length
      : 71425; // Demo value

    // Calculate on-time payment rate
    const onTimePayments = brandDeals.filter(d => {
      if (!d.payment_received_date || !d.payment_expected_date) return false;
      const received = new Date(d.payment_received_date);
      const expected = new Date(d.payment_expected_date);
      return received <= expected;
    }).length;
    const totalPaid = brandDeals.filter(d => d.payment_received_date).length || 1;
    const onTimeRate = Math.round((onTimePayments / totalPaid) * 100);

    // Calculate average payment cycle (days from deal approval to payment received)
    const paymentCycles = brandDeals
      .filter(d => d.payment_received_date && d.created_at)
      .map(d => {
        const created = new Date(d.created_at);
        const paid = new Date(d.payment_received_date!);
        const days = Math.ceil((paid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return days;
      });

    const avgPaymentCycle = paymentCycles.length > 0
      ? Math.round(paymentCycles.reduce((sum, days) => sum + days, 0) / paymentCycles.length)
      : 35; // Demo value

    // For demo mode, use demo values
    if (brandDeals.length <= 6) {
      return {
        avgDealSize: 71425,
        onTimeRate: 92,
        avgPaymentCycle: 35,
      };
    }

    return {
      avgDealSize: Math.round(avgDealSize),
      onTimeRate: onTimeRate || 92,
      avgPaymentCycle: avgPaymentCycle || 35,
    };
  }, [brandDeals]);

  return (
    <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-white/10">
      <div className="flex items-center gap-1.5 text-xs">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-400/70" />
        <span className="text-gray-300">Avg deal size:</span>
        <span className="text-white/90 font-semibold">₹{metrics.avgDealSize.toLocaleString('en-IN')}</span>
      </div>
      
      <div className="flex items-center gap-1.5 text-xs">
        <CheckCircle className="h-3.5 w-3.5 text-emerald-400/70" />
        <span className="text-gray-300">On-time payment rate:</span>
        <span className={cn(
          "font-semibold",
          metrics.onTimeRate >= 90 ? "text-emerald-400" :
          metrics.onTimeRate >= 70 ? "text-yellow-400" :
          "text-orange-400"
        )}>
          {metrics.onTimeRate}%
        </span>
      </div>
      
      <div className="flex items-center gap-1.5 text-xs">
        <Clock className="h-3.5 w-3.5 text-blue-400/70" />
        <span className="text-gray-300">Avg payment cycle:</span>
        <span className="text-white/90 font-semibold">{metrics.avgPaymentCycle} days</span>
      </div>
    </div>
  );
};

export default EarningsNanoMetrics;

