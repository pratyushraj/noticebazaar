"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee, AlertTriangle, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { BrandDeal } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FinancialOverviewHeaderProps {
  allDeals: BrandDeal[];
}

const FinancialOverviewHeader: React.FC<FinancialOverviewHeaderProps> = ({ allDeals }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Pending payments (not overdue)
    const pendingPayments = allDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate >= now;
    });

    const pendingAmount = pendingPayments.reduce((sum, deal) => sum + deal.deal_amount, 0);
    const pendingCount = pendingPayments.length;

    // Overdue payments
    const overduePayments = allDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate < now;
    });

    const overdueAmount = overduePayments.reduce((sum, deal) => sum + deal.deal_amount, 0);
    const overdueCount = overduePayments.length;

    // Received this month
    const receivedThisMonth = allDeals.filter(deal => {
      if (!deal.payment_received_date || deal.status !== 'Completed') return false;
      const receivedDate = new Date(deal.payment_received_date);
      return receivedDate.getMonth() === currentMonth && 
             receivedDate.getFullYear() === currentYear;
    });

    const receivedAmount = receivedThisMonth.reduce((sum, deal) => sum + deal.deal_amount, 0);

    // Collection success rate
    const totalExpected = allDeals
      .filter(deal => deal.status === 'Payment Pending' || deal.status === 'Completed')
      .reduce((sum, deal) => sum + deal.deal_amount, 0);
    
    const totalReceived = allDeals
      .filter(deal => deal.status === 'Completed' && deal.payment_received_date)
      .reduce((sum, deal) => sum + deal.deal_amount, 0);

    const collectionRate = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0;

    // Last month collection rate for comparison
    const lastMonthExpected = allDeals.filter(deal => {
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate.getMonth() === lastMonth && dueDate.getFullYear() === lastMonthYear;
    }).reduce((sum, deal) => sum + deal.deal_amount, 0);

    const lastMonthReceived = allDeals.filter(deal => {
      if (!deal.payment_received_date) return false;
      const receivedDate = new Date(deal.payment_received_date);
      return receivedDate.getMonth() === lastMonth && receivedDate.getFullYear() === lastMonthYear;
    }).reduce((sum, deal) => sum + deal.deal_amount, 0);

    const lastMonthRate = lastMonthExpected > 0 ? Math.round((lastMonthReceived / lastMonthExpected) * 100) : 0;
    const rateChange = collectionRate - lastMonthRate;

    return {
      pending: { amount: pendingAmount, count: pendingCount },
      overdue: { amount: overdueAmount, count: overdueCount },
      received: { amount: receivedAmount },
      collectionRate,
      rateChange,
    };
  }, [allDeals]);

  return (
    <div className="space-y-6 mb-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">💰 My Money</h1>
        <p className="text-sm text-muted-foreground">
          Track payments, recover overdue amounts, and manage your income
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-950/20 border border-yellow-700/40 hover:border-yellow-600/60 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-muted-foreground">Pending</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">
                ₹{stats.pending.amount.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-muted-foreground">
                {stats.pending.count} payment{stats.pending.count !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-red-900/20 to-red-950/20 border border-red-700/40 hover:border-red-600/60 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-muted-foreground">Overdue</span>
              </div>
              <div className="text-3xl font-bold text-red-500 mb-1 tabular-nums">
                ₹{stats.overdue.amount.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-muted-foreground">
                {stats.overdue.count} payment{stats.overdue.count !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 border border-emerald-700/40 hover:border-emerald-600/60 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-muted-foreground">Received</span>
              </div>
              <div className="text-3xl font-bold text-emerald-500 mb-1 tabular-nums">
                ₹{stats.received.amount.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-muted-foreground">This month</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Collection Success Rate */}
      {stats.collectionRate > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border border-blue-700/40">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-foreground">Collection Success Rate</span>
                </div>
                <span className="text-2xl font-bold text-blue-500">{stats.collectionRate}%</span>
              </div>
              <div className="relative h-3 bg-gray-800/50 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.collectionRate}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </motion.div>
              </div>
              <div className={cn(
                "flex items-center gap-1 text-sm",
                stats.rateChange >= 0 ? "text-emerald-500" : "text-red-500"
              )}>
                <TrendingUp className={cn(
                  "w-4 h-4",
                  stats.rateChange < 0 && "rotate-180"
                )} />
                <span>
                  {stats.rateChange >= 0 ? '+' : ''}{stats.rateChange}% {stats.rateChange >= 0 ? 'better' : 'worse'} than last month
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default FinancialOverviewHeader;

