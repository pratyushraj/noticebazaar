"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee, Briefcase, Clock, DollarSign, Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { BrandDeal } from '@/types';
import { cn } from '@/lib/utils';
import { DealStage, getDealStageFromStatus } from '@/lib/hooks/useBrandDeals';

interface BrandDealsStatsProps {
  allDeals: BrandDeal[];
  isLoading: boolean;
}

// Helper function to map status to stage - uses canonical mapping
const getDealStage = (deal: BrandDeal): DealStage => {
  return getDealStageFromStatus(deal.status, deal.progress_percentage);
};

const BrandDealsStats: React.FC<BrandDealsStatsProps> = ({ allDeals, isLoading }) => {
  const stats = useMemo(() => {
    const totalDeals = allDeals.length;
    
    const dealsWithStages = allDeals.map(deal => ({ deal, stage: getDealStage(deal) }));
    
    const activeDeals = dealsWithStages.filter(({ stage }) => 
      stage === 'signed' || stage === 'content_making' || stage === 'content_delivered'
    ).length;
    
    const pendingPayments = dealsWithStages.filter(({ deal }) => 
      deal.status === 'Payment Pending' || (deal.payment_expected_date && !deal.payment_received_date)
    ).length;
    
    const incomeTracked = dealsWithStages
      .filter(({ stage }) => stage === 'completed')
      .reduce((sum, { deal }) => sum + deal.deal_amount, 0);

    // Revenue this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const revenueThisMonth = dealsWithStages
      .filter(({ deal, stage }) => {
        if (stage !== 'completed') return false;
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
      if (stage === 'completed') return false;
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="bg-gradient-to-br from-card to-card/80 border-border/40 shadow-sm shadow-black/20 rounded-[12px] aspect-square">
            <CardContent className="p-3 md:p-4 flex items-center justify-center h-full">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className={cn(
              "bg-gradient-to-br from-card to-card/80 border-border/40 shadow-sm shadow-black/20",
              "rounded-[12px] overflow-hidden transition-all hover:shadow-md aspect-square flex flex-col"
            )}
          >
            <CardContent className="p-3 md:p-4 flex flex-col flex-1">
              <div className="flex items-start justify-between mb-2 flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] md:text-xs uppercase tracking-wide text-muted-foreground mb-1 truncate">{stat.title}</p>
                </div>
                <div className="flex-shrink-0 ml-1">
                  <Icon className={cn("h-3.5 w-3.5 md:h-4 md:w-4 xl:h-5 xl:w-5", stat.color)} />
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-foreground leading-tight mb-1">{stat.value}</p>
                <p className="text-[10px] md:text-[11px] text-muted-foreground truncate">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BrandDealsStats;

