"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, PieChart, BarChart3 as BarChartIcon, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface DealInsight {
  label: string;
  value: number | string;
  trend?: number; // percentage change
  icon: React.ReactNode;
  color: string;
}

interface EnhancedInsightsProps {
  insights?: DealInsight[];
  isDark?: boolean;
  aiMessage?: string;
}

const EnhancedInsights: React.FC<EnhancedInsightsProps> = ({
  insights = [],
  isDark = true,
  aiMessage = "You're closing deals 23% faster than other creators on the platform. Keep it up! 🚀",
}) => {
  const defaultInsights: DealInsight[] = [
    {
      label: 'Avg Deal Value',
      value: '₹35K',
      trend: 15,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Deal Duration',
      value: '18 days',
      trend: -8,
      icon: <BarChartIcon className="w-5 h-5" />,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      label: 'Success Rate',
      value: '92%',
      trend: 5,
      icon: <Check className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-600',
    },
    {
      label: 'Popular Platform',
      value: 'Instagram',
      trend: 0,
      icon: <PieChart className="w-5 h-5" />,
      color: 'from-violet-500 to-indigo-600',
    },
  ];

  const displayInsights = insights.length > 0 ? insights : defaultInsights;

  return (
    <Card className={cn(
      'border transition-all duration-300 overflow-hidden',
      isDark
        ? 'bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-700/30'
        : 'bg-white border-slate-200 shadow-sm'
    )}>
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={cn(
            'text-base font-bold tracking-tight flex items-center gap-2',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            <span className="text-lg">📊</span> Deal Insights
          </h3>
        </div>

        {/* AI Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'p-3 rounded-xl border mb-6 flex gap-3',
            isDark
              ? 'bg-blue-500/10 border-blue-500/20'
              : 'bg-blue-50 border-blue-200'
          )}
        >
          <div className={cn(
            'flex-shrink-0 text-2xl',
            isDark ? 'text-blue-400' : 'text-blue-600'
          )}>
            🤖
          </div>
          <div className="flex-1">
            <p className={cn(
              'text-sm font-medium',
              isDark ? 'text-blue-300' : 'text-blue-900'
            )}>
              AI Insight
            </p>
            <p className={cn(
              'text-xs mt-1',
              isDark ? 'text-blue-200/80' : 'text-blue-800'
            )}>
              {aiMessage}
            </p>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {displayInsights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (idx + 1) * 0.1 }}
              whileHover={{ y: -2 }}
              className={cn(
                'p-3 rounded-lg border transition-all',
                isDark
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-white shadow-sm hover:shadow-md'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br',
                  insight.color
                )}>
                  <span className="text-white">{insight.icon}</span>
                </div>
                {insight.trend !== undefined && insight.trend !== 0 && (
                  <span className={cn(
                    'text-xs font-bold',
                    insight.trend > 0 ? 'text-emerald-500' : 'text-red-500'
                  )}>
                    {insight.trend > 0 ? '+' : ''}{insight.trend}%
                  </span>
                )}
              </div>

              <p className={cn(
                'text-xs font-medium opacity-60 mb-1',
                isDark ? 'text-white' : 'text-slate-600'
              )}>
                {insight.label}
              </p>
              <p className={cn(
                'text-lg font-bold',
                isDark ? 'text-white' : 'text-slate-900'
              )}>
                {insight.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Recommendations Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={cn(
            'p-4 rounded-xl border',
            isDark
              ? 'bg-amber-500/10 border-amber-500/20'
              : 'bg-amber-50 border-amber-200'
          )}
        >
          <h4 className={cn(
            'text-sm font-bold mb-3 flex items-center gap-2',
            isDark ? 'text-amber-300' : 'text-amber-900'
          )}>
            <AlertCircle className="w-4 h-4" />
            Recommendations
          </h4>

          <div className="space-y-2">
            <div className={cn(
              'flex items-start gap-2 text-xs p-2 rounded-lg',
              isDark ? 'bg-white/5' : 'bg-white'
            )}>
              <span className="flex-shrink-0 mt-0.5">💡</span>
              <p className={isDark ? 'text-amber-200/90' : 'text-amber-900'}>
                Your Instagram content gets 40% more engagement. Focus on that platform.
              </p>
            </div>

            <div className={cn(
              'flex items-start gap-2 text-xs p-2 rounded-lg',
              isDark ? 'bg-white/5' : 'bg-white'
            )}>
              <span className="flex-shrink-0 mt-0.5">🎯</span>
              <p className={isDark ? 'text-amber-200/90' : 'text-amber-900'}>
                Try increasing your rates by 10-15% based on recent deal values.
              </p>
            </div>

            <div className={cn(
              'flex items-start gap-2 text-xs p-2 rounded-lg',
              isDark ? 'bg-white/5' : 'bg-white'
            )}>
              <span className="flex-shrink-0 mt-0.5">⚡</span>
              <p className={isDark ? 'text-amber-200/90' : 'text-amber-900'}>
                Quick delivery (3-5 days) increases acceptances by 25%. Stay fast!
              </p>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default EnhancedInsights;
