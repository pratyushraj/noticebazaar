"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar } from 'lucide-react';
import { BrandDeal } from '@/types';

interface ProjectedEarningsProps {
  brandDeals?: BrandDeal[];
}

const ProjectedEarnings: React.FC<ProjectedEarningsProps> = ({ brandDeals = [] }) => {
  const projectedEarnings = React.useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Sum up pending payments due in next 30 days
    const pendingPayments = brandDeals
      .filter(deal => {
        if (deal.status !== 'Payment Pending') return false;
        const dueDate = new Date(deal.payment_expected_date);
        return dueDate >= now && dueDate <= thirtyDaysFromNow;
      })
      .reduce((sum, deal) => sum + deal.deal_amount, 0);

    // Add estimated earnings from active deals (mock: 50% of active deal value)
    const activeDealsEstimated = brandDeals
      .filter(deal => deal.status === 'Approved' || deal.status === 'Drafting')
      .reduce((sum, deal) => sum + (deal.deal_amount * 0.5), 0);

    return Math.round(pendingPayments + activeDealsEstimated);
  }, [brandDeals]);

  return (
    <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl shadow-[0_0_20px_-6px_rgba(59,130,246,0.15)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          Projected Earnings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-4xl font-bold text-white">₹{projectedEarnings.toLocaleString('en-IN')}</p>
            <p className="text-sm text-white/60 mt-1">Next 30 days</p>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
            <Calendar className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-white/70">
                <span className="font-semibold text-blue-400">Calculation:</span> Based on pending payments due within 30 days and estimated completion value of active deals.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectedEarnings;

