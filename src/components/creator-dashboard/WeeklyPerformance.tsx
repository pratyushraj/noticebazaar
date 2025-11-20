"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, FileText, DollarSign, AlertCircle, Briefcase, CheckCircle2 } from 'lucide-react';
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

  // Calculate weekly metrics - merged from both WeeklyPerformance and ThisWeeksSummary
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

  // From ThisWeeksSummary
  const dealsClosed = React.useMemo(() => {
    return brandDeals.filter(deal => {
      if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
      const completedDate = new Date(deal.payment_received_date);
      return completedDate >= weekAgo;
    }).length;
  }, [brandDeals, weekAgo]);

  const invoicesSent = React.useMemo(() => {
    return brandDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const createdDate = new Date(deal.created_at);
      return createdDate >= weekAgo;
    }).length;
  }, [brandDeals, weekAgo]);

  const paymentsCollected = React.useMemo(() => {
    return brandDeals
      .filter(deal => {
        if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
        const paidDate = new Date(deal.payment_received_date);
        return paidDate >= weekAgo;
      })
      .reduce((sum, deal) => sum + deal.deal_amount, 0);
  }, [brandDeals, weekAgo]);

  const contractsReviewed = React.useMemo(() => {
    return brandDeals.filter(deal => {
      if (!deal.contract_file_url) return false;
      if (deal.status === 'Approved' || deal.status === 'Completed') {
        const updatedDate = new Date(deal.updated_at || deal.created_at);
        return updatedDate >= weekAgo;
      }
      return false;
    }).length;
  }, [brandDeals, weekAgo]);

  if (isLoading) {
    return (
      <Card variant="metric">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-6 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (brandDeals.length === 0) {
    return (
      <Card variant="tertiary">
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
    <Card variant="metric" interactive>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <CardTitle>Weekly Performance</CardTitle>
            <p className="text-small text-white/60 mt-1">This week's activity and metrics</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {/* Row 1 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/60 text-[13px]">
            <Briefcase className="h-3.5 w-3.5 text-blue-400" />
            <span>Deals Closed</span>
          </div>
          <p className="text-3xl font-bold text-blue-400 tracking-tight">{dealsClosed}</p>
          <p className="text-[12px] text-white/50">this week</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/60 text-[13px]">
            <DollarSign className="h-3.5 w-3.5 text-green-400" />
            <span>Payments Collected</span>
          </div>
          <p className="text-3xl font-bold text-green-400 tracking-tight">₹{Math.round(paymentsCollected / 1000)}k</p>
          <p className="text-[12px] text-white/50">this week</p>
        </div>

        {/* Row 2 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/60 text-[13px]">
            <FileText className="h-3.5 w-3.5 text-purple-400" />
            <span>Invoices Sent</span>
          </div>
          <p className="text-3xl font-bold text-purple-400 tracking-tight">{invoicesSent}</p>
          <p className="text-[12px] text-white/50">this week</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/60 text-[13px]">
            <CheckCircle2 className="h-3.5 w-3.5 text-orange-400" />
            <span>Contracts Reviewed</span>
          </div>
          <p className="text-3xl font-bold text-orange-400 tracking-tight">{contractsReviewed}</p>
          <p className="text-[12px] text-white/50">this week</p>
        </div>

        {/* Row 3 */}
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

        {/* Row 4 */}
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
          <p className="text-3xl font-bold text-orange-400 tracking-tight">{overduePayments}</p>
          <p className="text-[12px] text-white/50">payments</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyPerformance;

