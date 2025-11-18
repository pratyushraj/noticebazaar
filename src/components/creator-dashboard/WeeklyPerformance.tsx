"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { BrandDeal } from '@/types';

interface WeeklyPerformanceProps {
  brandDeals?: BrandDeal[];
}

const WeeklyPerformance: React.FC<WeeklyPerformanceProps> = ({ brandDeals = [] }) => {
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

  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-3xl shadow-[0_0_20px_-6px_rgba(255,255,255,0.1)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          Weekly Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <FileText className="h-4 w-4" />
            <span>Brand Inquiries</span>
          </div>
          <p className="text-2xl font-bold text-white">+{brandInquiries}</p>
          <p className="text-xs text-white/40">this week</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <DollarSign className="h-4 w-4" />
            <span>Est. Incoming</span>
          </div>
          <p className="text-2xl font-bold text-white">₹{Math.round(estimatedPayments / 1000)}k</p>
          <p className="text-xs text-white/40">pending payments</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <FileText className="h-4 w-4" />
            <span>Under Review</span>
          </div>
          <p className="text-2xl font-bold text-white">{contractsReviewing}</p>
          <p className="text-xs text-white/40">contracts</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <AlertCircle className="h-4 w-4 text-orange-400" />
            <span>Overdue</span>
          </div>
          <p className="text-2xl font-bold text-white">{overduePayments}</p>
          <p className="text-xs text-white/40">payments</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyPerformance;

