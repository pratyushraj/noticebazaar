import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Eye, Send, BarChart3, Loader2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useCollabAnalytics } from '@/lib/hooks/useCollabAnalytics';
import { getCollabLinkUsername } from '@/lib/utils/collabLink';
import { cn } from '@/lib/utils';

const CollabLinkAnalytics: React.FC = () => {
  const { profile } = useSession();
  const [period, setPeriod] = useState<'7' | '30'>('30');
  const { data: analytics, isLoading, error } = useCollabAnalytics(period);
  const username = getCollabLinkUsername(profile);

  // Don't show analytics if user doesn't have a username
  if (!username) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show error state - analytics might not be available yet
  if (error || !analytics) {
    return null;
  }

  const formatTrend = (trend: number, direction: 'up' | 'down' | 'neutral') => {
    if (direction === 'neutral' || trend === 0) return '—';
    const sign = direction === 'up' ? '+' : '';
    return `${sign}${Math.round(Math.abs(trend))}%`;
  };

  const TrendIndicator = ({ 
    trend, 
    direction 
  }: { 
    trend: number; 
    direction: 'up' | 'down' | 'neutral' 
  }) => {
    if (direction === 'neutral' || trend === 0) {
      return <span className="text-purple-300/50 text-xs">—</span>;
    }
    
    const Icon = direction === 'up' ? TrendingUp : TrendingDown;
    const color = direction === 'up' ? 'text-green-400' : 'text-red-400';
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">{formatTrend(trend, direction)}</span>
      </div>
    );
  };

  return (
    <Card className="bg-white/5 backdrop-blur-md border-white/10">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              Collab Link Analytics
            </h3>
            <p className="text-sm text-purple-200">
              Your link is working {analytics.submissions.total > 0 ? '🎉' : '✨'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('7')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                period === '7'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-purple-300 hover:bg-white/10'
              }`}
            >
              7d
            </button>
            <button
              onClick={() => setPeriod('30')}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                period === '30'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-purple-300 hover:bg-white/10'
              }`}
            >
              30d
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Total Views */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-purple-300">Total Views</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {analytics.views.total.toLocaleString()}
              </span>
              <TrendIndicator 
                trend={analytics.views.trend} 
                direction={analytics.views.trendDirection} 
              />
            </div>
            <p className="text-xs text-purple-300/60 mt-1">
              {analytics.views.unique} unique
            </p>
          </div>

          {/* Requests Received */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Send className="h-4 w-4 text-green-400" />
              <span className="text-xs text-purple-300">Requests</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {analytics.submissions.total.toLocaleString()}
              </span>
              <TrendIndicator 
                trend={analytics.submissions.trend} 
                direction={analytics.submissions.trendDirection} 
              />
            </div>
            <p className="text-xs text-purple-300/60 mt-1">
              Brands engaging
            </p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-200 mb-1">Conversion Rate</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {analytics.conversionRate.value.toFixed(1)}%
                </span>
                <TrendIndicator 
                  trend={analytics.conversionRate.trend} 
                  direction={analytics.conversionRate.trendDirection} 
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-purple-300/60 mb-1">Views → Requests</p>
              <p className="text-xs text-purple-200">
                {analytics.submissions.total} of {analytics.views.total || analytics.submissions.total}
              </p>
            </div>
          </div>
        </div>

        {/* Device Breakdown */}
        {analytics.deviceBreakdown && (
          <div className="space-y-2">
            <p className="text-xs text-purple-300/60 mb-2">Device Breakdown</p>
            <div className="flex gap-2">
              {analytics.deviceBreakdown.mobile > 0 && (
                <div className="flex-1 bg-white/5 rounded-lg p-2 text-center border border-white/10">
                  <p className="text-xs text-purple-300">Mobile</p>
                  <p className="text-sm font-semibold text-white">
                    {analytics.deviceBreakdown.mobile}
                  </p>
                </div>
              )}
              {analytics.deviceBreakdown.desktop > 0 && (
                <div className="flex-1 bg-white/5 rounded-lg p-2 text-center border border-white/10">
                  <p className="text-xs text-purple-300">Desktop</p>
                  <p className="text-sm font-semibold text-white">
                    {analytics.deviceBreakdown.desktop}
                  </p>
                </div>
              )}
              {analytics.deviceBreakdown.tablet > 0 && (
                <div className="flex-1 bg-white/5 rounded-lg p-2 text-center border border-white/10">
                  <p className="text-xs text-purple-300">Tablet</p>
                  <p className="text-sm font-semibold text-white">
                    {analytics.deviceBreakdown.tablet}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Encouraging Message */}
        {analytics.submissions.total === 0 && analytics.views.total > 0 && (
          <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <p className="text-xs text-purple-200 text-center">
              Brands are viewing your profile! Keep sharing your link. 🚀
            </p>
          </div>
        )}

        {analytics.submissions.total > 0 && (
          <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-xs text-green-200 text-center">
              Brands are engaging with your profile! Keep it up! 🎉
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(CollabLinkAnalytics);

