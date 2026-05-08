

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Briefcase, CreditCard, Clock, ArrowUpRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardMetricsCardsProps {
  totalDealValue?: number;
  activeDealCount?: number;
  outstandingPayments?: number;
  avgDealDuration?: number;
  isDark?: boolean;
  textColor?: string;
  trends?: {
    revenue?: string;
    active?: string;
    outstanding?: string;
    duration?: string;
  };
}

const DashboardMetricsCards: React.FC<DashboardMetricsCardsProps> = ({
  totalDealValue = 0,
  activeDealCount = 0,
  outstandingPayments = 0,
  avgDealDuration = 0,
  isDark = true,
  textColor = '',
  trends = {
    revenue: '+0%',
    active: '+0',
    outstanding: '−₹0',
    duration: '−0d'
  }
}) => {
  const metrics = [
    {
      id: 'revenue',
      label: 'Total Revenue',
      value: `₹${(totalDealValue / 1000).toFixed(1)}K`,
      icon: CreditCard,
      gradient: 'from-blue-600 to-indigo-600',
      bgGradient: 'from-blue-500/5 to-indigo-500/5',
      borderColor: 'border-blue-500/20',
      trend: trends.revenue || '+0%',
    },
    {
      id: 'active',
      label: 'Active Deals',
      value: `${activeDealCount}`,
      icon: Briefcase,
      gradient: 'from-emerald-600 to-teal-600',
      bgGradient: 'from-emerald-500/5 to-teal-500/5',
      borderColor: 'border-emerald-500/20',
      trend: trends.active || '+0',
    },
    {
      id: 'pending',
      label: 'Outstanding',
      value: `₹${(outstandingPayments / 1000).toFixed(1)}K`,
      icon: TrendingUp,
      gradient: 'from-orange-600 to-rose-600',
      bgGradient: 'from-orange-500/5 to-rose-500/5',
      borderColor: 'border-orange-500/20',
      trend: trends.outstanding || '−₹0',
    },
    {
      id: 'duration',
      label: 'Avg Duration',
      value: `${avgDealDuration}d`,
      icon: Clock,
      gradient: 'from-purple-600 to-pink-600',
      bgGradient: 'from-purple-500/5 to-pink-500/5',
      borderColor: 'border-purple-500/20',
      trend: trends.duration || '−0d',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: idx * 0.1, 
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            <Card
              className={cn(
                'relative overflow-hidden border-0 transition-all duration-700 h-[120px] group active:scale-[0.97] cursor-default',
                isDark
                  ? 'bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.05] shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md'
                  : 'bg-white border border-slate-200/60 shadow-[0_10px_40px_rgba(0,0,0,0.04)]'
              )}
            >
              {/* Premium Glow Effect */}
              <div className={cn(
                'absolute -top-12 -right-12 w-32 h-32 blur-[60px] opacity-20 transition-opacity duration-700 group-hover:opacity-40',
                `bg-gradient-to-br ${metric.gradient}`
              )} />
              
              <div className={cn(
                'absolute -bottom-12 -left-12 w-24 h-24 blur-[40px] opacity-10',
                `bg-gradient-to-tr ${metric.gradient}`
              )} />

              <CardContent className="p-4 h-full flex flex-col justify-between relative z-10">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    'w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-700 group-hover:scale-110 shadow-lg',
                    isDark 
                      ? `bg-gradient-to-br ${metric.gradient} text-white shadow-${metric.id}-500/20` 
                      : 'bg-slate-50 text-slate-600 border border-slate-100'
                  )}>
                    <Icon className="w-4.5 h-4.5" strokeWidth={2.2} />
                  </div>
                  <motion.div 
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-0.5 backdrop-blur-xl border",
                      idx === 2 || idx === 3 
                        ? (isDark ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-600 border-rose-200") 
                        : (isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-200")
                    )}
                  >
                    <ArrowUpRight className={cn("w-3 h-3", idx >= 2 ? "rotate-90" : "")} />
                    {metric.trend}
                  </motion.div>
                </div>

                <div className="mt-auto">
                  <p className={cn(
                    'text-[10px] font-black uppercase tracking-[0.15em] opacity-40 mb-1',
                    textColor
                  )}>
                    {metric.label}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <h3 className={cn(
                      'text-2xl font-black tracking-tight leading-none',
                      isDark ? 'text-white' : 'text-slate-900'
                    )}>
                      {metric.value}
                    </h3>
                  </div>
                </div>

                {/* Animated Bottom Bar */}
                <div className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden opacity-30">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '0%' }}
                    transition={{ delay: 0.5 + idx * 0.1, duration: 1.5, ease: "easeOut" }}
                    className={cn('h-full w-full bg-gradient-to-r', metric.gradient)} 
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DashboardMetricsCards;
