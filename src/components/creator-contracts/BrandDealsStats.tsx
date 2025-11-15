"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Briefcase, Clock, DollarSign, Loader2 } from 'lucide-react';
import { BrandDeal } from '@/types';
import { cn } from '@/lib/utils';

interface BrandDealsStatsProps {
  allDeals: BrandDeal[];
  isLoading: boolean;
}

const BrandDealsStats: React.FC<BrandDealsStatsProps> = ({ allDeals, isLoading }) => {
  const totalDeals = allDeals.length;
  const activeDeals = allDeals.filter(d => d.status === 'Drafting' || d.status === 'Approved' || d.status === 'Payment Pending').length;
  const pendingPayments = allDeals.filter(d => d.status === 'Payment Pending').length;
  
  const incomeTracked = allDeals
    .filter(d => d.status === 'Completed')
    .reduce((sum, deal) => sum + deal.deal_amount, 0);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const stats = [
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
      description: 'In progress (Drafting/Approved/Payment Pending)',
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
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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