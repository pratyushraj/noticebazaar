import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Eye, Send, BarChart3, Loader2, Smartphone, Monitor, Tablet } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { getApiBaseUrl } from '@/lib/utils/api';

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

const CollabLinkAnalytics: React.FC = () => {
  const { profile } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30'>('30');

  // Intentionally delay analytics fetch slightly so Brand Requests load first
  useEffect(() => {
    if (!profile?.username) {
      setLoading(false);
      return;
    }

    // Small delay to avoid competing with primary brand-requests fetch
    const timer = setTimeout(() => {
      fetchAnalytics();
    }, 1200);

    return () => clearTimeout(timer);
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

      const apiUrl = getApiBaseUrl();
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
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2 py-3 text-purple-300/80 text-sm">
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            <span>Loading analytics…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data yet — compact placeholder
  if (!analytics) {
    return (
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white break-words">Collab Link Analytics</h3>
          </div>
          <p className="text-xs text-purple-300/70 break-words">Share your link to get your first view</p>
        </CardContent>
      </Card>
    );
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
      <div className={`flex items-center gap-0.5 ${color}`}>
        <Icon className="h-2.5 w-2.5" />
        <span className="text-[10px] font-medium">{formatTrend(trend, direction)}</span>
      </div>
    );
  };

  const maxMetricBase = Math.max(1, analytics.views.total, analytics.submissions.total);
  const requestRateValue = Math.max(0, analytics.conversionRate.value);
  const requestRateWidth = Math.min(100, requestRateValue);

  const metricWidth = (value: number) => {
    if (maxMetricBase <= 0) return 0;
    return Math.min(100, Math.max(6, Math.round((value / maxMetricBase) * 100)));
  };

  return (
    <Card className="bg-white/5 backdrop-blur-md border-white/10">
      <CardContent className="p-3">
        {/* Header — default 30 days */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">
              Collab Link Analytics
            </h3>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setPeriod('7')}
              aria-label="Last 7 days"
              className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                period === '7'
                  ? 'bg-purple-600 text-white border-purple-400/40 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'
                  : 'bg-white/10 text-purple-200 border-white/20 hover:bg-white/15'
              }`}
            >
              7d
            </button>
            <button
              onClick={() => setPeriod('30')}
              aria-label="Last 30 days"
              className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                period === '30'
                  ? 'bg-purple-600 text-white border-purple-400/40 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'
                  : 'bg-white/10 text-purple-200 border-white/20 hover:bg-white/15'
              }`}
            >
              30d
            </button>
          </div>
        </div>

        {/* Stats Grid - Compact */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {/* Total Views */}
          <div className="bg-white/8 rounded-lg p-2 border border-white/15">
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
            <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-400/80 to-indigo-400/80"
                style={{ width: `${metricWidth(analytics.views.total)}%` }}
              />
            </div>
          </div>

          {/* Requests Received */}
          <div className="bg-white/8 rounded-lg p-2 border border-white/15">
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
            <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-400/80 to-emerald-400/80"
                style={{ width: `${metricWidth(analytics.submissions.total)}%` }}
              />
            </div>
          </div>

          {/* Request Rate (submissions / views) */}
          <div className="bg-white/8 rounded-lg p-2 border border-white/15">
            <div className="flex items-center gap-1 mb-1">
              <BarChart3 className="h-3 w-3 text-purple-400" />
              <span className="text-[10px] text-purple-300">Request Rate</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white">
                {requestRateValue.toFixed(1)}%
              </span>
              <TrendIndicator
                trend={analytics.conversionRate.trend}
                direction={analytics.conversionRate.trendDirection}
              />
            </div>
            <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-400/80 to-pink-400/80"
                style={{ width: `${requestRateWidth}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-purple-300/70">
              {analytics.submissions.total.toLocaleString()} of {analytics.views.total.toLocaleString()} views submitted
            </p>
          </div>
        </div>

        {/* Device Breakdown - Compact with icons */}
        {analytics.deviceBreakdown && (analytics.deviceBreakdown.mobile > 0 || analytics.deviceBreakdown.desktop > 0 || analytics.deviceBreakdown.tablet > 0) && (
          <div className="flex gap-1.5">
            {analytics.deviceBreakdown.mobile > 0 && (
              <div className="flex-1 bg-white/5 rounded px-2 py-1 flex items-center justify-center gap-1 border border-white/10">
                <Smartphone className="h-3 w-3 text-purple-400 flex-shrink-0" aria-hidden />
                <span className="text-xs font-semibold text-white">{analytics.deviceBreakdown.mobile}</span>
              </div>
            )}
            {analytics.deviceBreakdown.desktop > 0 && (
              <div className="flex-1 bg-white/5 rounded px-2 py-1 flex items-center justify-center gap-1 border border-white/10">
                <Monitor className="h-3 w-3 text-purple-400 flex-shrink-0" aria-hidden />
                <span className="text-xs font-semibold text-white">{analytics.deviceBreakdown.desktop}</span>
              </div>
            )}
            {analytics.deviceBreakdown.tablet > 0 && (
              <div className="flex-1 bg-white/5 rounded px-2 py-1 flex items-center justify-center gap-1 border border-white/10">
                <Tablet className="h-3 w-3 text-purple-400 flex-shrink-0" aria-hidden />
                <span className="text-xs font-semibold text-white">{analytics.deviceBreakdown.tablet}</span>
              </div>
            )}
          </div>
        )}

        {/* Helper text — one primary line */}
        <div className="mt-2 pt-2 border-t border-white/10">
          <p className="text-xs text-purple-300/70 text-center">
            {analytics.views.total === 0
              ? 'Share your link to get your first view'
              : analytics.submissions.total > 0
                ? 'Faster replies improve deal closure'
                : 'Share your link to see these stats'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CollabLinkAnalytics;
