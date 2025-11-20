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
    <Card variant="default" interactive>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <CardTitle>Projected Earnings</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-4xl font-bold text-white number-large">₹{projectedEarnings.toLocaleString('en-IN')}</p>
            <p className="text-body text-white/60 mt-2">Next 30 days</p>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <Calendar className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-small text-white/70">
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

