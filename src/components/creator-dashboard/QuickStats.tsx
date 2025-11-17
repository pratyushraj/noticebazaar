"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, BarChart3, Briefcase, DollarSign, Target, Send, Shield, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuickStatsProps {
  dealsClosed: number;
  dealsChange: number;
  avgDealValue: number;
  paymentCollectionRate: number;
  pitchesSent: number;
  takedownsSuccessful: number;
}

const QuickStats: React.FC<QuickStatsProps> = ({
  dealsClosed,
  dealsChange,
  avgDealValue,
  paymentCollectionRate,
  pitchesSent,
  takedownsSuccessful,
}) => {
  const stats = [
    {
      icon: Briefcase,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
      label: 'Deals closed',
      value: `${dealsClosed}`,
      change: dealsChange,
      changeLabel: `from last month`,
      positive: dealsChange >= 0,
    },
    {
      icon: DollarSign,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
      label: 'Average deal value',
      value: `₹${avgDealValue.toLocaleString('en-IN')}`,
      change: null,
      changeLabel: null,
      positive: true,
    },
    {
      icon: Target,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-500/10',
      label: 'Payment collection rate',
      value: paymentCollectionRate > 0 ? `${paymentCollectionRate}%` : 'Calculating...',
      change: null,
      changeLabel: null,
      positive: paymentCollectionRate >= 90,
      showProgress: paymentCollectionRate > 0,
      progressValue: paymentCollectionRate > 0 ? paymentCollectionRate : 0,
    },
    {
      icon: Send,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
      label: 'New brand pitches',
      value: `${pitchesSent} sent`,
      change: null,
      changeLabel: null,
      positive: true,
    },
    {
      icon: Shield,
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-500/10',
      label: 'Content protection',
      value: `${takedownsSuccessful} takedowns successful`,
      change: null,
      changeLabel: null,
      positive: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="bg-card border-border/40 hover:border-border/60 transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            This Month at a Glance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between group hover:bg-muted/50 p-3 rounded-lg transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.iconBg)}>
                      <Icon className={cn("w-5 h-5", stat.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-foreground">{stat.value}</span>
                        {stat.change !== null && (
                          <span className={cn(
                            "flex items-center gap-1 text-sm font-medium",
                            stat.positive ? "text-green-500" : "text-red-500"
                          )}>
                            {stat.positive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {stat.positive ? '↑' : '↓'} {Math.abs(stat.change)}
                            {stat.changeLabel && ` ${stat.changeLabel}`}
                          </span>
                        )}
                      </div>
                      {stat.showProgress && (
                        <div className="mt-2 w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.progressValue}%` }}
                            transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                            className="h-full bg-gradient-to-r from-green-500 to-green-400"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuickStats;
