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
        ? 'bg-gradient-to-br from-background/50 to-slate-800/30 border-border'
        : 'bg-card border-border shadow-sm'
    )}>
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={cn(
            'text-base font-bold tracking-tight flex items-center gap-2',
            isDark ? 'text-foreground' : 'text-muted-foreground'
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
              ? 'bg-info/10 border-info/20'
              : 'bg-info border-info'
          )}
        >
          <div className={cn(
            'flex-shrink-0 text-2xl',
            isDark ? 'text-info' : 'text-info'
          )}>
            🤖
          </div>
          <div className="flex-1">
            <p className={cn(
              'text-sm font-medium',
              isDark ? 'text-info' : 'text-info'
            )}>
              AI Insight
            </p>
            <p className={cn(
              'text-xs mt-1',
              isDark ? 'text-info/80' : 'text-info'
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
                  ? 'bg-card border-border hover:bg-secondary/50 hover:border-border'
                  : 'bg-background border-border hover:bg-card shadow-sm hover:shadow-md'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br',
                  insight.color
                )}>
                  <span className="text-foreground">{insight.icon}</span>
                </div>
                {insight.trend !== undefined && insight.trend !== 0 && (
                  <span className={cn(
                    'text-xs font-bold',
                    insight.trend > 0 ? 'text-primary' : 'text-destructive'
                  )}>
                    {insight.trend > 0 ? '+' : ''}{insight.trend}%
                  </span>
                )}
              </div>

              <p className={cn(
                'text-xs font-medium opacity-60 mb-1',
                isDark ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {insight.label}
              </p>
              <p className={cn(
                'text-lg font-bold',
                isDark ? 'text-foreground' : 'text-muted-foreground'
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
              ? 'bg-warning/10 border-warning/20'
              : 'bg-warning border-warning'
          )}
        >
          <h4 className={cn(
            'text-sm font-bold mb-3 flex items-center gap-2',
            isDark ? 'text-warning' : 'text-warning'
          )}>
            <AlertCircle className="w-4 h-4" />
            Recommendations
          </h4>

          <div className="space-y-2">
            <div className={cn(
              'flex items-start gap-2 text-xs p-2 rounded-lg',
              isDark ? 'bg-card' : 'bg-card'
            )}>
              <span className="flex-shrink-0 mt-0.5">💡</span>
              <p className={isDark ? 'text-warning/90' : 'text-warning'}>
                Your Instagram content gets 40% more engagement. Focus on that platform.
              </p>
            </div>

            <div className={cn(
              'flex items-start gap-2 text-xs p-2 rounded-lg',
              isDark ? 'bg-card' : 'bg-card'
            )}>
              <span className="flex-shrink-0 mt-0.5">🎯</span>
              <p className={isDark ? 'text-warning/90' : 'text-warning'}>
                Try increasing your rates by 10-15% based on recent deal values.
              </p>
            </div>

            <div className={cn(
              'flex items-start gap-2 text-xs p-2 rounded-lg',
              isDark ? 'bg-card' : 'bg-card'
            )}>
              <span className="flex-shrink-0 mt-0.5">⚡</span>
              <p className={isDark ? 'text-warning/90' : 'text-warning'}>
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
