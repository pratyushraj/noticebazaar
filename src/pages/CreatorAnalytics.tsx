"use client";

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Calendar,
  Download,
  Share2,
  Target,
  Award,
  Info,
  Zap,
  Shield,
  Clock,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { motion } from 'framer-motion';
import { analytics } from '@/utils/analytics';
import { toast } from 'sonner';

interface MetricCardProps {
  title: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
  suffix?: string;
  prefix?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  suffix = '',
  prefix = '',
}) => {
  const isPositive = trend === 'up';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const formatValue = (val: number | string): string => {
    if (typeof val === 'number') {
      if (val >= 100000) return `₹${(val / 1000).toFixed(0)}K`;
      if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
      return `₹${val.toLocaleString()}`;
    }
    return String(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-purple-300">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-purple-400" />
        </div>
      </div>

      <div className="text-3xl font-bold mb-2">
        {prefix}
        {formatValue(value)}
        {suffix}
      </div>

      <div
        className={`flex items-center gap-1 text-sm ${
          isPositive ? 'text-green-400' : 'text-red-400'
        }`}
      >
        <TrendIcon className="w-4 h-4" />
        <span>{Math.abs(change).toFixed(1)}%</span>
        <span className="text-purple-300 ml-1">vs last period</span>
      </div>
    </motion.div>
  );
};

interface BarChartProps {
  data: Array<{ month: string; amount: number }>;
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const maxAmount = Math.max(...data.map((d) => d.amount));

  const formatCurrency = (amount: number): string => {
    if (amount >= 100000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-center justify-between mb-1 text-sm">
            <span className="text-purple-300">{item.month}</span>
            <span className="font-semibold">{formatCurrency(item.amount)}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.amount / maxAmount) * 100}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

interface PieChartLegendProps {
  data: Array<{ source: string; amount: number; percentage: number; color: string }>;
}

const PieChartLegend: React.FC<PieChartLegendProps> = ({ data }) => {
  const formatCurrency = (amount: number): string => {
    if (amount >= 100000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 ${item.color} rounded`}></div>
            <div>
              <div className="font-medium">{item.source}</div>
              <div className="text-sm text-purple-300">{item.percentage}%</div>
            </div>
          </div>
          <div className="font-semibold">{formatCurrency(item.amount)}</div>
        </motion.div>
      ))}
    </div>
  );
};

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'tip' | 'achievement';
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  color: string;
}

const CreatorAnalytics = () => {
  const navigate = useNavigate();
  const { profile } = useSession();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Fetch real brand deals data
  const { data: brandDeals = [] } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  // Calculate metrics from real data
  const metrics = useMemo(() => {
    const completedDeals = brandDeals.filter((deal) => deal.status === 'Completed');
    const activeDeals = brandDeals.filter(
      (deal) => deal.status !== 'Drafting' && deal.status !== 'Completed'
    );

    // Average deal value
    const totalDealValue = brandDeals.reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);
    const avgDealValue = brandDeals.length > 0 ? totalDealValue / brandDeals.length : 0;

    // Closing rate (completed / total)
    const closingRate = brandDeals.length > 0 ? (completedDeals.length / brandDeals.length) * 100 : 0;

    // Average payment time (simulated - would need payment_received_date vs deal_date)
    const avgPaymentTime = 18; // TODO: Calculate from actual payment dates

    // Protection score (simulated - would calculate from contract reviews)
    const protectionScore = 85; // TODO: Calculate from actual protection data

    return {
      avgDealValue: { value: avgDealValue, change: 15.2, trend: 'up' as const },
      closingRate: { value: closingRate, change: 8.5, trend: 'up' as const },
      avgPaymentTime: { value: avgPaymentTime, change: -12.3, trend: 'up' as const },
      protectionScore: { value: protectionScore, change: 5.0, trend: 'up' as const },
    };
  }, [brandDeals]);

  // Calculate earnings data
  const earningsData = useMemo(() => {
    const completedDeals = brandDeals.filter(
      (deal) => deal.status === 'Completed' && deal.payment_received_date
    );
    const currentEarnings = completedDeals.reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);

    // Generate monthly breakdown (last 6 months)
    const monthly: Array<{ month: string; amount: number }> = [];
    const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[date.getMonth()] || months[i];
      
      // Simulate earnings (in real app, would filter by date)
      const monthEarnings = i === 5 ? currentEarnings * 0.5 : currentEarnings * (0.5 + (5 - i) * 0.1);
      monthly.push({ month: monthName, amount: Math.round(monthEarnings) });
    }

    const previousEarnings = monthly[monthly.length - 2]?.amount || 0;
    const growth = previousEarnings > 0 
      ? ((currentEarnings - previousEarnings) / previousEarnings) * 100 
      : 0;

    // Revenue breakdown by platform (simulated - would need platform data)
    const breakdown = [
      { source: 'YouTube', amount: Math.round(currentEarnings * 0.63), percentage: 63, color: 'bg-red-500' },
      { source: 'Instagram', amount: Math.round(currentEarnings * 0.26), percentage: 26, color: 'bg-pink-500' },
      { source: 'Sponsored', amount: Math.round(currentEarnings * 0.11), percentage: 11, color: 'bg-blue-500' },
    ];

    return {
      current: currentEarnings,
      previous: previousEarnings,
      growth,
      trend: growth >= 0 ? ('up' as const) : ('down' as const),
      monthly,
      breakdown,
    };
  }, [brandDeals]);

  // Top deals
  const topDeals = useMemo(() => {
    return brandDeals
      .sort((a, b) => (b.deal_amount || 0) - (a.deal_amount || 0))
      .slice(0, 3)
      .map((deal, index) => ({
        id: deal.id,
        name: deal.brand_name || 'Unknown Brand',
        value: deal.deal_amount || 0,
        status: deal.status === 'Completed' ? ('completed' as const) : ('active' as const),
        platform: 'YouTube', // TODO: Get from deal data
      }));
  }, [brandDeals]);

  // Generate AI insights
  const insights: Insight[] = useMemo(() => {
    const insightsList: Insight[] = [];

    if (earningsData.growth > 10) {
      insightsList.push({
        id: 'strong-growth',
        type: 'success',
        icon: TrendingUp,
        title: 'Strong Growth',
        message: `Your earnings grew ${earningsData.growth.toFixed(1)}% this month. Keep it up!`,
        color: 'from-green-500 to-emerald-500',
      });
    }

    if (metrics.avgPaymentTime.value > 15) {
      insightsList.push({
        id: 'payment-delay',
        type: 'warning',
        icon: Clock,
        title: 'Payment Delay',
        message: `Average payment time is ${metrics.avgPaymentTime.value} days. Follow up on overdue payments.`,
        color: 'from-yellow-500 to-orange-500',
      });
    }

    const goalProgress = (earningsData.current / 300000) * 100;
    if (goalProgress < 100) {
      insightsList.push({
        id: 'revenue-goal',
        type: 'tip',
        icon: Target,
        title: 'Revenue Goal',
        message: `You're ${goalProgress.toFixed(0)}% toward your ₹3L monthly goal. Keep adding deals!`,
        color: 'from-blue-500 to-purple-500',
      });
    }

    if (earningsData.current > 500000) {
      insightsList.push({
        id: 'milestone',
        type: 'achievement',
        icon: Award,
        title: 'Milestone Reached',
        message: `You've earned ₹${(earningsData.current / 1000).toFixed(0)}K total! Great work!`,
        color: 'from-purple-500 to-pink-500',
      });
    }

    return insightsList;
  }, [earningsData, metrics]);

  // Track analytics view
  useEffect(() => {
    if (profile?.id) {
      analytics.track('analytics_page_viewed', {
        category: 'analytics',
        timeframe,
        userId: profile.id,
      });
    }
  }, [profile?.id, timeframe]);

  const handleExport = (format: 'pdf' | 'excel') => {
    if (profile?.id) {
      analytics.track('analytics_export', {
        category: 'analytics',
        format,
        userId: profile.id,
      });
    }
    toast.success(`${format.toUpperCase()} export started. This feature will be available soon!`);
  };

  const timeframes = [
    { id: 'week' as const, label: 'Week' },
    { id: 'month' as const, label: 'Month' },
    { id: 'quarter' as const, label: 'Quarter' },
    { id: 'year' as const, label: 'Year' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-purple-900/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/creator-dashboard')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Analytics</h1>
              <p className="text-sm text-purple-300">Your performance insights</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExport('pdf')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Share analytics"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Download analytics"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 pb-24">
        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {timeframes.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                timeframe === tf.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white/10 text-purple-200 hover:bg-white/15'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <MetricCard
            title="Avg Deal Value"
            value={metrics.avgDealValue.value}
            change={metrics.avgDealValue.change}
            trend={metrics.avgDealValue.trend}
            icon={DollarSign}
            prefix="₹"
          />
          <MetricCard
            title="Closing Rate"
            value={metrics.closingRate.value}
            change={metrics.closingRate.change}
            trend={metrics.closingRate.trend}
            icon={Target}
            suffix="%"
          />
          <MetricCard
            title="Payment Time"
            value={metrics.avgPaymentTime.value}
            change={metrics.avgPaymentTime.change}
            trend={metrics.avgPaymentTime.trend}
            icon={Clock}
            suffix=" days"
          />
          <MetricCard
            title="Protection Score"
            value={metrics.protectionScore.value}
            change={metrics.protectionScore.change}
            trend={metrics.protectionScore.trend}
            icon={Shield}
          />
        </div>

        {/* Earnings Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)] mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Earnings Trend</h2>
            <button
              className="text-sm text-purple-300 hover:text-white transition-colors flex items-center gap-1"
              aria-label="Earnings trend info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-6">
            <div className="text-4xl font-bold mb-2">
              {earningsData.current >= 100000
                ? `₹${(earningsData.current / 1000).toFixed(0)}K`
                : `₹${earningsData.current.toLocaleString()}`}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1 text-sm font-medium ${
                  earningsData.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {earningsData.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(earningsData.growth).toFixed(1)}%
              </span>
              <span className="text-sm text-purple-300">
                vs{' '}
                {earningsData.previous >= 100000
                  ? `₹${(earningsData.previous / 1000).toFixed(0)}K`
                  : `₹${earningsData.previous.toLocaleString()}`}
              </span>
            </div>
          </div>

          <BarChart data={earningsData.monthly} />
        </motion.div>

        {/* Revenue Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)] mb-6"
        >
          <h2 className="font-semibold text-lg mb-4">Revenue by Platform</h2>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {earningsData.breakdown.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div
                  className={`w-12 h-12 ${item.color} rounded-xl mx-auto mb-2 flex items-center justify-center`}
                >
                  <span className="text-2xl font-bold">{item.percentage}%</span>
                </div>
                <div className="text-xs font-medium mb-1">{item.source}</div>
                <div className="text-xs text-purple-300">
                  {item.amount >= 100000
                    ? `₹${(item.amount / 1000).toFixed(0)}K`
                    : `₹${item.amount.toLocaleString()}`}
                </div>
              </motion.div>
            ))}
          </div>

          <PieChartLegend data={earningsData.breakdown} />
        </motion.div>

        {/* Top Deals */}
        {topDeals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)] mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Top Deals</h2>
              <button
                onClick={() => navigate('/creator-contracts')}
                className="text-sm text-purple-300 hover:text-white transition-colors"
              >
                View All →
              </button>
            </div>

            <div className="space-y-3">
              {topDeals.map((deal, index) => (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/creator-contracts/${deal.id}`)}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{deal.name}</div>
                      <div className="text-xs text-purple-300">{deal.platform}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {deal.value >= 100000
                        ? `₹${(deal.value / 1000).toFixed(0)}K`
                        : `₹${deal.value.toLocaleString()}`}
                    </div>
                    <div
                      className={`text-xs ${
                        deal.status === 'active' ? 'text-green-400' : 'text-purple-400'
                      }`}
                    >
                      {deal.status === 'active' ? '● Active' : '✓ Completed'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Insights */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <h2 className="font-semibold text-lg mb-4">AI Insights</h2>
            <div className="space-y-3">
              {insights.map((insight) => {
                const Icon = insight.icon;
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`bg-gradient-to-r ${insight.color} bg-opacity-20 rounded-[20px] p-4 border border-white/10`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{insight.title}</h3>
                        <p className="text-sm text-white/90">{insight.message}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Performance Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-5 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)] mb-6"
        >
          <h2 className="font-semibold text-lg mb-4">Quick Stats</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300">Total Deals</span>
              </div>
              <div className="text-2xl font-bold">{brandDeals.length}</div>
              <div className="text-xs text-purple-400 mt-1">
                {brandDeals.filter((d) => d.status !== 'Completed' && d.status !== 'Drafting').length} active,{' '}
                {brandDeals.filter((d) => d.status === 'Completed').length} completed
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300">This Month</span>
              </div>
              <div className="text-2xl font-bold">
                {brandDeals.filter((d) => d.status !== 'Completed' && d.status !== 'Drafting').length}
              </div>
              <div className="text-xs text-green-400 mt-1">Active deals</div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300">Success Rate</span>
              </div>
              <div className="text-2xl font-bold">{metrics.closingRate.value.toFixed(0)}%</div>
              <div className="text-xs text-purple-400 mt-1">Deals closed</div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300">Avg Response</span>
              </div>
              <div className="text-2xl font-bold">2.5</div>
              <div className="text-xs text-purple-400 mt-1">Days to reply</div>
            </div>
          </div>
        </motion.div>

        {/* Export Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 rounded-[20px] p-5 border border-purple-400/30"
        >
          <div className="flex items-start gap-3 mb-4">
            <Download className="w-6 h-6 text-purple-300 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">Export Your Data</h3>
              <p className="text-sm text-purple-200">Download detailed reports for tax filing or analysis</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleExport('pdf')}
              className="bg-white/10 hover:bg-white/15 font-medium py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              PDF Report
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="bg-white/10 hover:bg-white/15 font-medium py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel Export
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreatorAnalytics;

