

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
}

const DashboardMetricsCards: React.FC<DashboardMetricsCardsProps> = ({
  totalDealValue = 0,
  activeDealCount = 0,
  outstandingPayments = 0,
  avgDealDuration = 0,
  isDark = true,
  textColor = '',
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
      trend: '+12%',
    },
    {
      id: 'active',
      label: 'Active Deals',
      value: `${activeDealCount}`,
      icon: Briefcase,
      gradient: 'from-emerald-600 to-teal-600',
      bgGradient: 'from-emerald-500/5 to-teal-500/5',
      borderColor: 'border-emerald-500/20',
      trend: '+3',
    },
    {
      id: 'pending',
      label: 'Outstanding',
      value: `₹${(outstandingPayments / 1000).toFixed(1)}K`,
      icon: TrendingUp,
      gradient: 'from-orange-600 to-rose-600',
      bgGradient: 'from-orange-500/5 to-rose-500/5',
      borderColor: 'border-orange-500/20',
      trend: '−₹2K',
    },
    {
      id: 'duration',
      label: 'Avg Duration',
      value: `${avgDealDuration}d`,
      icon: Clock,
      gradient: 'from-purple-600 to-pink-600',
      bgGradient: 'from-purple-500/5 to-pink-500/5',
      borderColor: 'border-purple-500/20',
      trend: '−2d',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.5 }}
          >
            <Card
              className={cn(
                'relative overflow-hidden border-0 transition-all duration-500 h-[110px] group active:scale-[0.98]',
                isDark
                  ? `bg-[#0B1220] border-[#223046] shadow-[0_10px_30px_rgb(0,0,0,0.2)]`
                  : 'bg-white border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
              )}
            >
              {/* Subtle top-left gradient glow */}
              <div className={cn(
                'absolute -top-4 -left-4 w-12 h-12 blur-2xl opacity-20',
                `bg-gradient-to-br ${metric.gradient}`
              )} />

              <CardContent className="p-4 h-full flex flex-col justify-between relative z-10">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-sm',
                    isDark ? `bg-gradient-to-br ${metric.gradient} text-white` : 'bg-slate-50 text-slate-600 border border-slate-100'
                  )}>
                    <Icon className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <div className={cn(
                    "px-1.5 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-0.5",
                    idx === 2 || idx === 3 ? (isDark ? "bg-rose-500/10 text-rose-400" : "bg-rose-50 text-rose-600") : (isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600")
                  )}>
                    <ArrowUpRight className={cn("w-2.5 h-2.5", idx >= 2 ? "rotate-90" : "")} />
                    {metric.trend}
                  </div>
                </div>

                <div className="mt-2">
                  <p className={cn(
                    'text-[10px] font-black uppercase tracking-[0.12em] opacity-40 mb-0.5',
                    textColor
                  )}>
                    {metric.label}
                  </p>
                  <h3 className={cn(
                    'text-xl font-black tracking-tight leading-none',
                    isDark ? 'text-white' : 'text-slate-900'
                  )}>
                    {metric.value}
                  </h3>
                </div>

                {/* Animated progress accent bottom line */}
                <div className={cn(
                  'absolute bottom-0 left-0 h-0.5 bg-gradient-to-r opacity-30',
                  metric.gradient
                )} style={{ width: '100%' }} />
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DashboardMetricsCards;
