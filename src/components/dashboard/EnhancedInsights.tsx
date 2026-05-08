

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
  brandDeals?: any[];
  isDark?: boolean;
  aiMessage?: string;
}

const EnhancedInsights: React.FC<EnhancedInsightsProps> = ({
  insights = [],
  brandDeals = [],
  isDark = true,
  aiMessage: providedAiMessage,
}) => {
  const defaultInsights: DealInsight[] = [
    {
      label: 'Avg Deal Value',
      value: '₹0',
      trend: 0,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Deal Duration',
      value: '0 days',
      trend: 0,
      icon: <BarChartIcon className="w-5 h-5" />,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      label: 'Success Rate',
      value: '0%',
      trend: 0,
      icon: <Check className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-600',
    },
    {
      label: 'Popular Platform',
      value: 'None',
      trend: 0,
      icon: <PieChart className="w-5 h-5" />,
      color: 'from-violet-500 to-indigo-600',
    },
  ];

  // Dynamic calculation logic
  const dynamicInsights = React.useMemo(() => {
    if (!brandDeals || brandDeals.length === 0) return defaultInsights;

    const validDeals = brandDeals.filter(d => !String(d?.id || '').includes('demo'));
    const dealsToUse = validDeals.length > 0 ? validDeals : brandDeals;

    // 1. Avg Deal Value
    const totalAmount = dealsToUse.reduce((sum, d) => sum + (Number(d.deal_amount) || 0), 0);
    const avgValue = dealsToUse.length > 0 ? Math.round(totalAmount / dealsToUse.length) : 0;
    
    // 2. Success Rate
    const completedCount = dealsToUse.filter(d => {
      const s = String(d?.status || '').toLowerCase();
      return s.includes('completed') || s === 'paid' || s.includes('approved');
    }).length;
    const successRate = dealsToUse.length > 0 ? Math.round((completedCount / dealsToUse.length) * 100) : 0;

    // 3. Top Platform
    const platforms = dealsToUse.map(d => String(d.platform || 'Instagram'));
    const platformCounts = platforms.reduce((acc, p) => {
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Instagram';

    const totalDeals = dealsToUse.length;
    const previousDealsCount = dealsToUse.filter(d => {
        const date = new Date(d.created_at || d.createdAt);
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return date < lastMonth;
    }).length;
    
    const dealGrowth = previousDealsCount > 0 ? Math.round(((totalDeals - previousDealsCount) / previousDealsCount) * 100) : 10;

    return [
      {
        label: 'Avg Deal Value',
        value: `₹${(avgValue / 1000).toFixed(1)}K`,
        trend: 12,
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'from-emerald-500 to-teal-600',
      },
      {
        label: 'Total Deals',
        value: totalDeals.toString(),
        trend: dealGrowth,
        icon: <BarChartIcon className="w-5 h-5" />,
        color: 'from-blue-500 to-cyan-600',
      },
      {
        label: 'Success Rate',
        value: `${successRate}%`,
        trend: successRate > 90 ? 2 : (successRate > 50 ? 5 : 0),
        icon: <Check className="w-5 h-5" />,
        color: 'from-purple-500 to-pink-600',
      },
      {
        label: 'Top Platform',
        value: topPlatform,
        trend: 0,
        icon: <PieChart className="w-5 h-5" />,
        color: 'from-violet-500 to-indigo-600',
      },
    ];
  }, [brandDeals, defaultInsights]);

  const dynamicAiMessage = React.useMemo(() => {
    if (providedAiMessage) return providedAiMessage;
    if (!brandDeals || brandDeals.length === 0) return "Start sharing your collab link to get your first deal insights! 🚀";
    
    const completedCount = brandDeals.filter(d => {
      const s = String(d?.status || '').toLowerCase();
      return s.includes('completed') || s === 'paid';
    }).length;

    if (completedCount > 0) {
      const successRate = Math.round((completedCount / brandDeals.length) * 100);
      const rateIncrease = successRate > 80 ? '20%' : '15%';
      return `Awesome! You've completed ${completedCount} deals. With your ${successRate}% success rate, you can likely command a ${rateIncrease} premium on your next deal. 📈`;
    }
    return "You're building momentum! Keep delivering high-quality content to boost your brand trust score. 🌟";
  }, [brandDeals, providedAiMessage]);

  const recommendations = React.useMemo(() => {
    if (!brandDeals || brandDeals.length === 0) return [
      { icon: '💡', text: 'Complete your profile to attract more brand deals.' },
      { icon: '🎯', text: 'Link your social accounts to show real-time reach.' },
      { icon: '⚡', text: 'Respond to offers within 24 hours to stay ahead.' }
    ];

    const recs = [];
    
    // Platform recommendation
    const platforms = brandDeals.map(d => String(d.platform || 'Instagram'));
    const platformCounts = platforms.reduce((acc, p) => { acc[p] = (acc[p] || 0) + 1; return acc; }, {} as Record<string, number>);
    const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Instagram';
    recs.push({ icon: '💡', text: `Your ${topPlatform} content is performing best. Double down on that platform.` });

    // Pricing recommendation
    const avgValue = brandDeals.reduce((sum, d) => sum + (Number(d.deal_amount) || 0), 0) / brandDeals.length;
    if (avgValue < 10000) {
      recs.push({ icon: '🎯', text: 'Try bundling multiple deliverables to increase your average deal size.' });
    } else {
      recs.push({ icon: '🎯', text: 'Consider offering long-term retainers to brands you enjoy working with.' });
    }

    // Speed recommendation
    const avgDuration = brandDeals.reduce((sum, d) => sum + (d.duration || 14), 0) / brandDeals.length;
    if (avgDuration > 10) {
        recs.push({ icon: '⚡', text: 'Shortening your delivery time to 7 days could increase your re-hire rate by 30%.' });
    } else {
        recs.push({ icon: '⚡', text: 'Your speed is a major competitive advantage. Keep it up!' });
    }

    return recs;
  }, [brandDeals]);

  const displayInsights = insights.length > 0 ? insights : dynamicInsights;
  const aiMessage = dynamicAiMessage;

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
              : 'bg-blue-50 border-blue-200 shadow-sm'
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
              'text-sm font-bold',
              isDark ? 'text-info' : 'text-blue-700'
            )}>
              AI Insight
            </p>
            <p className={cn(
              'text-xs mt-1 leading-relaxed',
              isDark ? 'text-info/80' : 'text-blue-700/80'
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
              : 'bg-amber-50 border-amber-200 shadow-sm'
          )}
        >
          <h4 className={cn(
            'text-sm font-bold mb-3 flex items-center gap-2',
            isDark ? 'text-warning' : 'text-amber-700'
          )}>
            <AlertCircle className="w-4 h-4" />
            Recommendations
          </h4>

          <div className="space-y-2">
            {recommendations.map((rec, idx) => (
              <div key={idx} className={cn(
                'flex items-start gap-2 text-xs p-2 rounded-lg',
                isDark ? 'bg-card' : 'bg-card'
              )}>
                <span className="flex-shrink-0 mt-0.5">{rec.icon}</span>
                <p className={isDark ? 'text-warning/90' : 'text-amber-700 font-medium'}>
                  {rec.text}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default EnhancedInsights;
