"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { BrandDeal } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

interface WeeklyPerformanceProps {
  brandDeals?: BrandDeal[];
  isLoading?: boolean;
}

const WeeklyPerformance: React.FC<WeeklyPerformanceProps> = ({ brandDeals = [], isLoading = false }) => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Calculate weekly metrics
  const brandInquiries = React.useMemo(() => {
    return brandDeals.filter(deal => {
      const dealDate = new Date(deal.created_at);
      return dealDate >= weekAgo;
    }).length;
  }, [brandDeals, weekAgo]);

  const estimatedPayments = React.useMemo(() => {
    return brandDeals
      .filter(deal => deal.status === 'Payment Pending')
      .reduce((sum, deal) => sum + deal.deal_amount, 0);
  }, [brandDeals]);

  const contractsReviewing = React.useMemo(() => {
    return brandDeals.filter(deal => 
      deal.status === 'Drafting' && deal.contract_file_url
    ).length;
  }, [brandDeals]);

  const overduePayments = React.useMemo(() => {
    return brandDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate < now;
    }).length;
  }, [brandDeals, now]);

  if (isLoading) {
    return (
      <Card variant="metric">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (brandDeals.length === 0) {
    return (
      <Card variant="metric">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/5 backdrop-blur-sm">
              <TrendingUp className="h-5 w-5 text-white/80" />
            </div>
            Weekly Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={TrendingUp}
            title="No performance data yet"
            description="Complete brand deals and track your weekly progress here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="metric">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/5 backdrop-blur-sm">
            <TrendingUp className="h-5 w-5 text-white/80" />
          </div>
          Weekly Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/60 text-[13px]">
            <FileText className="h-3.5 w-3.5" />
            <span>Brand Inquiries</span>
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">+{brandInquiries}</p>
          <p className="text-[12px] text-white/50">this week</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/60 text-[13px]">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Est. Incoming</span>
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">₹{Math.round(estimatedPayments / 1000)}k</p>
          <p className="text-[12px] text-white/50">pending payments</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/60 text-[13px]">
            <FileText className="h-3.5 w-3.5" />
            <span>Under Review</span>
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{contractsReviewing}</p>
          <p className="text-[12px] text-white/50">contracts</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/60 text-[13px]">
            <AlertCircle className="h-3.5 w-3.5 text-orange-400" />
            <span>Overdue</span>
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{overduePayments}</p>
          <p className="text-[12px] text-white/50">payments</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyPerformance;

