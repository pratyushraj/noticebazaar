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
      received: { amount: receivedAmount, count: receivedThisMonth.length },
      collectionRate,
      rateChange,
    };
  }, [allDeals]);

  return (
    <div className="space-y-4 mb-4">
      {/* Key Metrics */}
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden rounded-2xl p-6 border transition-all hover:scale-[1.02] bg-gradient-to-br from-amber-950/50 to-amber-900/30 border-amber-800/50">
            <CardContent className="p-0">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2.5 rounded-xl bg-amber-500/20">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-400 mb-2">Pending</p>
                    <p className="text-3xl font-bold tabular-nums">₹{stats.pending.amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-400">{stats.pending.count} payments</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden rounded-2xl p-6 border transition-all hover:scale-[1.02] bg-gradient-to-br from-red-950/50 to-red-900/30 border-red-800/50">
            <CardContent className="p-0">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2.5 rounded-xl bg-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-400 mb-2">Overdue</p>
                    <p className="text-3xl font-bold text-red-400 tabular-nums">₹{stats.overdue.amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-400">{stats.overdue.count} payments</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden rounded-2xl p-6 border transition-all hover:scale-[1.02] bg-gradient-to-br from-emerald-950/50 to-emerald-900/30 border-emerald-800/50">
            <CardContent className="p-0">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-400 mb-2">Received</p>
                    <p className="text-3xl font-bold text-emerald-400 tabular-nums">₹{stats.received.amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-400">{stats.received.count || 0} payments</span>
              </div>
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

