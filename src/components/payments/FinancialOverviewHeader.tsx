"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, TrendingUp, CheckCircle, Wallet, Download } from 'lucide-react';
import { BrandDeal } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

  const handleExportPDF = () => {
    // Generate PDF summary
    const pdfContent = `
Financial Summary Report
Generated: ${new Date().toLocaleDateString('en-IN')}

PENDING PAYMENTS
Amount: ₹${stats.pending.amount.toLocaleString('en-IN')}
Count: ${stats.pending.count} payments

OVERDUE PAYMENTS
Amount: ₹${stats.overdue.amount.toLocaleString('en-IN')}
Count: ${stats.overdue.count} payments

RECEIVED THIS MONTH
Amount: ₹${stats.received.amount.toLocaleString('en-IN')}
Count: ${stats.received.count} payments

COLLECTION SUCCESS RATE
${stats.collectionRate}%
    `.trim();

    // Create blob and download
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Financial summary exported!', {
      description: 'A text file has been downloaded. PDF export coming soon.',
    });
  };

  return (
    <div className="space-y-3 mt-2">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleExportPDF}
          variant="outline"
          size="sm"
          className="bg-white/5 border-white/10 text-white hover:bg-white/10 min-h-[44px]"
          aria-label="Export financial summary as PDF"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Summary
        </Button>
      </div>

      {/* Premium Icon Graphic */}
      <div className="flex justify-center mb-6 py-6 md:py-8 overflow-visible">
        <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-amber-500/20 rounded-full blur-3xl animate-pulse opacity-60"></div>
          
          {/* Icon Container */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            {/* Premium Icon - Large Wallet Icon with decorative elements */}
            <div className="relative">
              {/* Wallet Box Icon */}
              <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-emerald-500 via-green-600 to-amber-600 rounded-2xl shadow-2xl shadow-emerald-500/40 flex items-center justify-center transform rotate-[-8deg] hover:rotate-[-5deg] transition-transform duration-300">
                <Wallet className="w-16 h-16 md:w-20 md:h-20 text-white drop-shadow-lg" />
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-xl shadow-amber-500/50 flex items-center justify-center transform rotate-12 animate-bounce" style={{ animationDuration: '3s' }}>
                <span className="text-2xl md:text-3xl">💰</span>
              </div>
              
              <div className="absolute -bottom-4 -left-4 w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-xl shadow-amber-500/50 flex items-center justify-center transform -rotate-12 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                <span className="text-xl md:text-2xl">💵</span>
              </div>
              
              {/* Arrow pointing up */}
              <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 translate-x-4">
                <TrendingUp className="w-12 h-12 md:w-16 md:h-16 text-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-3">
        {/* Pending Card - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/[0.08] backdrop-blur-lg border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] px-5 py-4 transition-all hover:shadow-2xl hover:border-purple-500/30 hover:-translate-y-0.5">
            <CardContent className="p-0">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 md:gap-4 flex-1">
                  <div className="p-2 md:p-2.5 rounded-xl bg-amber-500/20">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/50 mb-1 md:mb-2">Pending</p>
                    <p className="text-lg md:text-xl font-semibold text-white tabular-nums">₹{stats.pending.amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <span className="text-xs text-white/40 text-right">{stats.pending.count} payments</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Overdue and Received - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/[0.08] backdrop-blur-lg border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] px-5 py-4 transition-all hover:shadow-2xl hover:border-purple-500/30 hover:-translate-y-0.5">
              <CardContent className="p-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 md:gap-4 flex-1">
                    <div className="p-2 md:p-2.5 rounded-xl bg-red-500/20">
                      <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-white/50 mb-1 md:mb-2">Overdue</p>
                      <p className="text-lg md:text-xl font-semibold text-red-500 tabular-nums">₹{stats.overdue.amount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <span className="text-xs text-white/40 text-right">{stats.overdue.count} payments</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {stats.received.amount > 0 ? (
              <Card className="bg-white/[0.08] backdrop-blur-lg border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] px-5 py-4 transition-all hover:shadow-2xl hover:border-purple-500/30 hover:-translate-y-0.5">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 md:gap-4 flex-1">
                      <div className="p-2 md:p-2.5 rounded-xl bg-emerald-500/20">
                        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-white/50 mb-1 md:mb-2">Received</p>
                        <p className="text-lg md:text-xl font-semibold text-emerald-400 tabular-nums">₹{stats.received.amount.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <span className="text-xs text-white/40 text-right">{stats.received.count || 0} payments</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/[0.08] backdrop-blur-lg border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] px-5 py-4 transition-all hover:shadow-2xl hover:border-purple-500/30 hover:-translate-y-0.5">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 md:gap-4 flex-1">
                      <div className="p-2 md:p-2.5 rounded-xl bg-blue-500/20">
                        <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-white/50 mb-1 md:mb-2">Received</p>
                        <p className="text-sm text-white/60 italic">Keep going! Payments will appear here once received.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>

      {/* Collection Success Rate */}
      {stats.collectionRate > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border border-white/5 rounded-2xl shadow-[0px_4px_24px_rgba(0,0,0,0.25)]">
            <CardContent className="px-5 py-4">
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

