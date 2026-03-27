"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRight, Briefcase, Send, Shield, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { BrandDeal } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Sparkline } from '@/components/ui/sparkline';
import { PINK_THEME } from '@/constants/colors';

interface MonthlyOverviewCardProps {
  current: number;
  previous: number;
  goal: number;
  brandDeals?: BrandDeal[];
  dealsClosed: number;
  dealsChange: number;
  pitchesSent: number;
  takedownsSuccessful: number;
  isLoading?: boolean;
  earningsHistory?: number[];
}

const MonthlyOverviewCard: React.FC<MonthlyOverviewCardProps> = ({ 
  current, 
  previous, 
  goal,
  brandDeals = [],
  dealsClosed,
  dealsChange,
  pitchesSent,
  takedownsSuccessful,
  isLoading = false,
  earningsHistory = []
}) => {
  const navigate = useNavigate();
  const change = current - previous;
  const changePercent = previous > 0 ? Math.round((change / previous) * 100) : 0;
  const progressPercent = goal > 0 ? Math.round((current / goal) * 100) : 0;
  const isPositive = change >= 0;

  // Animated counting effect
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = current / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const nextValue = Math.min(increment * step, current);
      setDisplayValue(Math.floor(nextValue));
      
      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [current]);

  // Calculate nano metrics
  const avgDealSize = brandDeals.length > 0
    ? Math.round(brandDeals.reduce((sum, deal) => sum + deal.deal_amount, 0) / brandDeals.length)
    : 0;

  const onTimePayments = brandDeals.filter(deal => {
    if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
    const expectedDate = new Date(deal.payment_expected_date);
    const receivedDate = new Date(deal.payment_received_date);
    return receivedDate <= expectedDate;
  }).length;

  const totalCompleted = brandDeals.filter(deal => deal.status === 'Completed').length;
  const onTimeRate = totalCompleted > 0 ? Math.round((onTimePayments / totalCompleted) * 100) : 0;

  // Calculate average payment cycle
  const completedDealsWithDates = brandDeals.filter(deal => 
    deal.status === 'Completed' && deal.payment_received_date && deal.payment_expected_date
  );
  const avgPaymentCycle = completedDealsWithDates.length > 0
    ? Math.round(
        completedDealsWithDates.reduce((sum, deal) => {
          const expected = new Date(deal.payment_expected_date);
          const received = new Date(deal.payment_received_date);
          return sum + Math.abs((received.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / completedDealsWithDates.length
      )
    : 35;

  if (isLoading) {
    return (
      <Card className="relative bg-[#2A1F2E] border-[#4A3A4F] rounded-2xl">
        <CardContent className="space-y-6">
          <div className="skeleton h-8 w-48 rounded-lg"></div>
          <div className="skeleton h-12 w-32 rounded-lg"></div>
          <div className="skeleton h-3 w-full rounded-full"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24 rounded-xl"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (current === 0 && !isLoading) {
    return (
      <Card className="relative bg-[#2A1F2E] border-[#4A3A4F] rounded-2xl">
        <CardContent>
          <EmptyState
            icon={TrendingUp}
            title="No earnings yet"
            description="Start by completing brand deals and receiving payments to see your earnings grow."
            actionLabel="View Deals"
            onAction={() => navigate('/creator-contracts')}
          />
        </CardContent>
      </Card>
    );
  }

  const quickStats = [
    {
      icon: Briefcase,
      iconColor: 'text-[#B4D4FF]',
      iconBg: 'bg-[#B4D4FF]/20',
      label: 'Deals closed',
      value: dealsClosed,
      unit: '',
      change: dealsChange,
      positive: dealsChange >= 0,
    },
    {
      icon: Send,
      iconColor: 'text-[#F472B6]',
      iconBg: 'bg-[#F472B6]/20',
      label: 'Brand pitches',
      value: pitchesSent,
      unit: 'sent',
      change: null,
      positive: true,
    },
    {
      icon: Shield,
      iconColor: 'text-[#E879F9]',
      iconBg: 'bg-[#E879F9]/20',
      label: 'Takedowns',
      value: takedownsSuccessful,
      unit: 'successful',
      change: null,
      positive: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="relative bg-[#2A1F2E] border-[#4A3A4F] rounded-2xl shadow-lg hover:bg-[#3D2A3F] transition-all duration-300">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#E879F9]/10 via-[#F472B6]/5 to-transparent pointer-events-none z-0 rounded-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B9D]/5 to-transparent pointer-events-none z-0 rounded-2xl"></div>
        
        <CardContent className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#E879F9] to-[#F472B6] border border-[#FF6B9D]/30 flex-shrink-0 shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-h3 font-semibold text-white tracking-tight">
                  This Month's Overview
                </h2>
                {earningsHistory.length > 0 && (
                  <div className="mt-2">
                    <Sparkline
                      data={earningsHistory}
                      width={80}
                      height={24}
                      color="#F472B6"
                    />
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/creator-payments')}
              className="text-body text-[#F472B6] hover:text-[#FF8FAB] hover:bg-[#F472B6]/10 transition-fast flex items-center gap-2 group focus-ring rounded-lg px-3 py-2 flex-shrink-0"
            >
              View Breakdown
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Earnings Section - More Prominent */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <div className="text-5xl font-bold text-white number-large leading-none">
                ₹{displayValue.toLocaleString('en-IN')}
              </div>
              <div className={cn(
                "flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-lg text-small",
                isPositive ? "bg-[#A8E6CF]/20 text-[#A8E6CF] border border-[#A8E6CF]/40" : "bg-[#FFB3BA]/20 text-[#FF6B9D] border border-[#FF6B9D]/40"
              )}>
                <TrendingUp className={cn(
                  "w-3.5 h-3.5",
                  !isPositive && "rotate-180"
                )} />
                <span>{isPositive ? '+' : ''}₹{Math.abs(change).toLocaleString('en-IN')} ({Math.abs(changePercent)}%)</span>
              </div>
            </div>
            <div className="text-body text-white/60">
              vs last month
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-body">
                <span className="text-white/70">Monthly Goal Progress</span>
                <span className="text-[#A8E6CF] font-semibold">{progressPercent}% of ₹{goal.toLocaleString('en-IN')} goal</span>
              </div>
              <div className="relative h-3 rounded-full bg-[#1F1B2E] overflow-hidden border border-[#4A3A4F]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                  transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-y-0 left-0 h-full rounded-full bg-gradient-to-r from-[#E879F9] via-[#F472B6] to-[#FB7185]"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10"></div>

          {/* Quick Stats Grid - Improved */}
          <div>
            <h3 className="text-micro font-semibold text-white/70 mb-3 uppercase tracking-wider">Quick Metrics</h3>
            <div className="grid grid-cols-3 gap-3">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    className="flex flex-col items-center gap-2.5 p-3 rounded-xl bg-[#1F1B2E] hover:bg-[#2A1F2E] border border-[#4A3A4F] hover:border-[#5A4A5F] transition-smooth card-interactive"
                  >
                    <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 border", stat.iconBg)}>
                      <Icon className={cn("w-6 h-6", stat.iconColor)} />
                    </div>
                    <div className="text-center space-y-2 w-full">
                      <div className="space-y-1">
                        <div className="text-3xl font-bold text-white number-large leading-none">
                          {stat.value}
                        </div>
                        {stat.unit && (
                          <div className="text-small text-white/50 font-medium">
                            {stat.unit}
                          </div>
                        )}
                      </div>
                      <div className="text-small text-white/70 font-medium leading-tight px-2">
                        {stat.label}
                      </div>
                      {stat.change !== null && (
                        <div className={cn(
                          "flex items-center justify-center gap-1.5 text-small font-semibold mt-2 pt-2 border-t border-[#4A3A4F]",
                          stat.positive ? "text-[#A8E6CF]" : "text-[#FF6B9D]"
                        )}>
                          <TrendingUp className={cn("w-3.5 h-3.5 flex-shrink-0", !stat.positive && "rotate-180")} />
                          <span>{stat.positive ? '↑' : '↓'} {Math.abs(stat.change)} from last month</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10"></div>

          {/* Performance Metrics - Improved */}
          <div>
            <h3 className="text-micro font-semibold text-white/70 mb-4 uppercase tracking-wider">Performance Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1F1B2E] border border-[#4A3A4F] hover:bg-[#2A1F2E] transition-all">
                <div className="p-2 rounded-lg bg-[#A8E6CF]/20 border border-[#A8E6CF]/40">
                  <TrendingUp className="h-4 w-4 text-[#A8E6CF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-small text-white/60">Avg deal size</div>
                  <div className="text-lg font-bold text-white number-large">₹{avgDealSize.toLocaleString('en-IN')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1F1B2E] border border-[#4A3A4F] hover:bg-[#2A1F2E] transition-all">
                <div className="p-2 rounded-lg bg-[#A8E6CF]/20 border border-[#A8E6CF]/40">
                  <TrendingUp className="h-4 w-4 text-[#A8E6CF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-small text-white/60">On-time rate</div>
                  <div className="text-lg font-bold text-white number-large">{onTimeRate}%</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1F1B2E] border border-[#4A3A4F] hover:bg-[#2A1F2E] transition-all">
                <div className="p-2 rounded-lg bg-[#A8E6CF]/20 border border-[#A8E6CF]/40">
                  <TrendingUp className="h-4 w-4 text-[#A8E6CF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-small text-white/60">Payment cycle</div>
                  <div className="text-lg font-bold text-white number-large">{avgPaymentCycle} days</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MonthlyOverviewCard;

