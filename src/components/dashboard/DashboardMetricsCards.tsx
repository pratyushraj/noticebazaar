"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Briefcase, CreditCard, Clock, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardMetricsCardsProps {
  totalDealValue?: number;
  activeDealCount?: number;
  outstandingPayments?: number;
  avgDealDuration?: number;
  isDark?: boolean;
}

const DashboardMetricsCards: React.FC<DashboardMetricsCardsProps> = ({
  totalDealValue = 0,
  activeDealCount = 0,
  outstandingPayments = 0,
  avgDealDuration = 0,
  isDark = true,
}) => {
  const metrics = [
    {
      id: 'revenue',
      label: 'Total Deal Value',
      value: `₹${(totalDealValue / 100000).toFixed(1)}L`,
      icon: CreditCard,
      gradient: 'from-emerald-600 to-teal-600',
      bgGradient: 'from-emerald-500/10 to-teal-500/10',
      borderColor: 'border-emerald-500/20',
      trend: '+12%',
      trendColor: 'text-emerald-400',
    },
    {
      id: 'active',
      label: 'Active Deals',
      value: `${activeDealCount}`,
      icon: Briefcase,
      gradient: 'from-blue-600 to-cyan-600',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/20',
      trend: '+3',
      trendColor: 'text-blue-400',
    },
    {
      id: 'pending',
      label: 'Outstanding Payments',
      value: `₹${(outstandingPayments / 100000).toFixed(1)}L`,
      icon: CreditCard,
      gradient: 'from-amber-600 to-orange-600',
      bgGradient: 'from-amber-500/10 to-orange-500/10',
      borderColor: 'border-amber-500/20',
      trend: '−5%',
      trendColor: 'text-amber-400',
    },
    {
      id: 'duration',
      label: 'Avg Deal Duration',
      value: `${avgDealDuration}d`,
      icon: Clock,
      gradient: 'from-purple-600 to-pink-600',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/20',
      trend: '−2d',
      trendColor: 'text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            whileHover={{ y: -4 }}
          >
            <Card
              className={cn(
                'relative overflow-hidden border transition-all duration-300 h-full',
                isDark
                  ? `bg-gradient-to-br ${metric.bgGradient} ${metric.borderColor} backdrop-blur-sm`
                  : 'bg-white border-slate-200 shadow-sm'
              )}
            >
              {/* Animated background accent */}
              <div className={cn(
                'absolute top-0 right-0 w-20 h-20 opacity-10 group-hover:opacity-20 transition-opacity',
                `bg-gradient-to-br ${metric.gradient}`
              )} />

              <CardContent className="p-4 relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn(
                    'p-2.5 rounded-lg backdrop-blur-sm',
                    isDark ? `bg-${metric.gradient.split('-')[0]}-500/20` : 'bg-slate-100'
                  )}>
                    <Icon className={cn('w-4 h-4', isDark ? 'text-white' : 'text-slate-600')} />
                  </div>
                  <span className={cn(
                    'text-xs font-bold flex items-center gap-1',
                    metric.trendColor
                  )}>
                    <ArrowUpRight className="w-3 h-3" />
                    {metric.trend}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className={cn(
                    'text-xs font-medium opacity-60',
                    isDark ? 'text-white' : 'text-slate-600'
                  )}>
                    {metric.label}
                  </p>
                  <h3 className={cn(
                    'text-lg sm:text-xl font-bold tracking-tight',
                    isDark ? 'text-white' : 'text-slate-900'
                  )}>
                    {metric.value}
                  </h3>
                </div>

                {/* Progress indicator bar */}
                <div className={cn(
                  'absolute bottom-0 left-0 h-1 bg-gradient-to-r',
                  metric.gradient
                )} style={{ width: '45%' }} />
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DashboardMetricsCards;
