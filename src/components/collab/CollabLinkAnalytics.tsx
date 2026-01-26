import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Eye, Send, BarChart3, Loader2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  period: number;
  views: {
    total: number;
    unique: number;
    trend: number;
    trendDirection: 'up' | 'down';
  };
  submissions: {
    total: number;
    trend: number;
    trendDirection: 'up' | 'down';
  };
  conversionRate: {
    value: number;
    trend: number;
    trendDirection: 'up' | 'down' | 'neutral';
  };
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
    unknown: number;
  };
}

interface CollabLinkAnalyticsProps {
  compact?: boolean;
}

const CollabLinkAnalytics: React.FC<CollabLinkAnalyticsProps> = ({ compact = false }) => {
  const { profile } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30'>('30');

  useEffect(() => {
    if (profile?.username) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [period, profile?.username]);

  const fetchAnalytics = async () => {
    try {
      // Get current session (Supabase auto-refreshes tokens)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error('[CollabLinkAnalytics] No session:', sessionError);
        setLoading(false);
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${apiUrl}/api/collab-analytics?days=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.error('[CollabLinkAnalytics] Unauthorized - token may be invalid');
        } else if (response.status === 404) {
          console.warn('[CollabLinkAnalytics] Analytics endpoint not found - may not be available yet');
        } else {
          console.error('[CollabLinkAnalytics] Failed to fetch analytics:', response.status, response.statusText);
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.analytics) {
        setAnalytics(data.analytics);
      } else {
        console.warn('[CollabLinkAnalytics] Analytics data not available:', data);
      }
    } catch (error: any) {
      // Only log network errors, not expected errors like connection refused when server is down
      if (error.message && !error.message.includes('Failed to fetch')) {
        console.error('[CollabLinkAnalytics] Error fetching analytics:', error);
      } else {
        // Silently handle connection errors - server may not be running
        if (import.meta.env.DEV) {
          console.warn('[CollabLinkAnalytics] Server not available - analytics will load when server is running');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Don't show analytics if user doesn't have a username
  if (!profile?.username) {
    return null;
  }

  if (loading) {
    return (
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardContent className={compact ? "p-4" : "p-6"}>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
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

  if (compact) {
    return (
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardContent className="p-4">
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Collab Link Analytics</h3>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setPeriod('7')}
                className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                  period === '7'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-purple-300 hover:bg-white/10'
                }`}
              >
                7d
              </button>
              <button
                onClick={() => setPeriod('30')}
                className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                  period === '30'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-purple-300 hover:bg-white/10'
                }`}
              >
                30d
              </button>
            </div>
          </div>

          {/* Compact Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Total Views - Compact */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center gap-1 mb-1">
                <Eye className="h-3 w-3 text-purple-400" />
                <span className="text-[10px] text-purple-300">Views</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-white">
                  {analytics.views.total.toLocaleString()}
                </span>
                <TrendIndicator 
                  trend={analytics.views.trend} 
                  direction={analytics.views.trendDirection} 
                />
              </div>
            </div>

            {/* Requests Received - Compact */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center gap-1 mb-1">
                <Send className="h-3 w-3 text-green-400" />
                <span className="text-[10px] text-purple-300">Requests</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-white">
                  {analytics.submissions.total.toLocaleString()}
                </span>
                <TrendIndicator 
                  trend={analytics.submissions.trend} 
                  direction={analytics.submissions.trendDirection} 
                />
              </div>
            </div>

            {/* Conversion Rate - Compact */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-3 border border-purple-500/20">
              <div className="text-[10px] text-purple-200 mb-1">Conversion</div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-white">
                  {analytics.conversionRate.value.toFixed(1)}%
                </span>
                <TrendIndicator 
                  trend={analytics.conversionRate.trend} 
                  direction={analytics.conversionRate.trendDirection} 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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

export default CollabLinkAnalytics;

