"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

import EarningsNanoMetrics from './EarningsNanoMetrics';
import { BrandDeal } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { TrendingUp as TrendingUpIcon } from 'lucide-react';
import { Sparkline } from '@/components/ui/sparkline';

interface HeroEarningsCardProps {
  current: number;
  previous: number;
  goal: number;
  brandDeals?: BrandDeal[];
  isLoading?: boolean;
  earningsHistory?: number[]; // For sparkline
}

const HeroEarningsCard: React.FC<HeroEarningsCardProps> = ({ 
  current, 
  previous, 
  goal,
  brandDeals = [],
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

  if (isLoading) {
    return (
      <Card variant="primary" className="relative">
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (current === 0 && !isLoading) {
    return (
      <Card variant="primary" className="relative">
        <CardContent>
          <EmptyState
            icon={TrendingUpIcon}
            title="No earnings yet"
            description="Start by completing brand deals and receiving payments to see your earnings grow."
            actionLabel="View Deals"
            onAction={() => navigate('/creator-contracts')}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card variant="primary" className="relative">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent animate-pulse pointer-events-none z-0"></div>
        
        <CardContent className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-white tracking-[-0.2px]">
                This Month's Earnings
              </h2>
              {earningsHistory.length > 0 && (
                <Sparkline
                  data={earningsHistory}
                  width={60}
                  height={20}
                  color="rgb(34, 197, 94)"
                />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/creator-payments')}
              className="text-[13px] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 group active:scale-[0.97]"
            >
              View Breakdown
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>

          <div className="mb-4">
            <div className="text-3xl font-bold text-white mb-2 tabular-nums tracking-tight">
              ₹{displayValue.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              <div className={cn(
                "flex items-center gap-1 font-semibold",
                isPositive ? "text-emerald-400" : "text-red-400"
              )}>
                <TrendingUp className={cn(
                  "w-3.5 h-3.5",
                  !isPositive && "rotate-180"
                )} />
                <span>₹{Math.abs(change).toLocaleString('en-IN')} ({Math.abs(changePercent)}%)</span>
              </div>
              <span className="text-white/50">vs last month</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-white/60">Monthly Goal Progress</span>
              <span className="text-emerald-400 font-semibold">{progressPercent}% of ₹{goal.toLocaleString('en-IN')} goal</span>
            </div>
            <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-y-0 left-0 h-full rounded-full bg-emerald-500"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </motion.div>
            </div>
          </div>

          {/* Nano Metrics */}
          <EarningsNanoMetrics brandDeals={brandDeals} currentEarnings={current} />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HeroEarningsCard;

