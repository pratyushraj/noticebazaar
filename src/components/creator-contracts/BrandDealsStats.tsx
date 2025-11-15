"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Briefcase, Clock, DollarSign, Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { BrandDeal } from '@/types';
import { cn } from '@/lib/utils';
import { DealStage } from './DealStatusBadge';

interface BrandDealsStatsProps {
  allDeals: BrandDeal[];
  isLoading: boolean;
}

// Helper function to map old status to new stage
const getDealStage = (deal: BrandDeal): DealStage => {
  if (deal.status === 'Drafting') return 'draft';
  if (deal.status === 'Approved') return 'active';
  if (deal.status === 'Payment Pending') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(deal.payment_expected_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today ? 'overdue' : 'payment_pending';
  }
  if (deal.status === 'Completed') return 'completed';
  if (deal.payment_received_date) return 'paid';
  return 'draft';
};

const BrandDealsStats: React.FC<BrandDealsStatsProps> = ({ allDeals, isLoading }) => {
  const stats = useMemo(() => {
    const totalDeals = allDeals.length;
    
    const dealsWithStages = allDeals.map(deal => ({ deal, stage: getDealStage(deal) }));
    
    const activeDeals = dealsWithStages.filter(({ stage }) => 
      stage === 'active' || stage === 'payment_pending'
    ).length;
    
    const pendingPayments = dealsWithStages.filter(({ stage }) => 
      stage === 'payment_pending' || stage === 'overdue'
    ).length;
    
    const incomeTracked = dealsWithStages
      .filter(({ stage }) => stage === 'completed' || stage === 'paid')
      .reduce((sum, { deal }) => sum + deal.deal_amount, 0);

    // Revenue this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const revenueThisMonth = dealsWithStages
      .filter(({ deal, stage }) => {
        if (stage !== 'paid' && stage !== 'completed') return false;
        const paymentDate = deal.payment_received_date 
          ? new Date(deal.payment_received_date)
          : new Date(deal.updated_at || deal.created_at);
        return paymentDate >= startOfMonth;
      })
      .reduce((sum, { deal }) => sum + deal.deal_amount, 0);

    // Deals closing soon (due within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const dealsClosingSoon = dealsWithStages.filter(({ deal, stage }) => {
      if (stage === 'completed' || stage === 'paid') return false;
      const dueDate = new Date(deal.payment_expected_date || deal.due_date);
      return dueDate <= sevenDaysFromNow && dueDate >= new Date();
    }).length;

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

    return [
      {
        title: 'Total Deals',
        value: totalDeals,
        icon: Briefcase,
        color: 'text-blue-500',
        description: 'Deals ever created',
      },
      {
        title: 'Active Deals',
        value: activeDeals,
        icon: Clock,
        color: 'text-orange-500',
        description: 'In progress',
      },
      {
        title: 'Pending Payments',
        value: pendingPayments,
        icon: IndianRupee,
        color: 'text-red-500',
        description: 'Awaiting payment',
      },
      {
        title: 'Income Tracked',
        value: formatCurrency(incomeTracked),
        icon: DollarSign,
        color: 'text-green-500',
        description: 'From completed deals',
      },
      {
        title: 'Revenue This Month',
        value: formatCurrency(revenueThisMonth),
        icon: TrendingUp,
        color: 'text-emerald-500',
        description: 'Paid this month',
      },
      {
        title: 'Deals Closing Soon',
        value: dealsClosingSoon,
        icon: AlertCircle,
        color: 'text-amber-500',
        description: 'Due within 7 days',
      },
    ];
  }, [allDeals]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="creator-card-base shadow-sm p-4">
            <div className="flex items-center justify-center h-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="creator-card-base shadow-sm p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <Icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-2xl font-bold text-foreground mt-1">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BrandDealsStats;