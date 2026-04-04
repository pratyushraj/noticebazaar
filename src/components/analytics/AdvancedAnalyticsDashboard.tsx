import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Zap,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

// Advanced analytics data types
interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  brandName: string;
  status: 'active' | 'completed' | 'paused';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  creators: number;
  content: number;
  reach: number;
  engagement: number;
  conversions: number;
  roi: number;
  performance: {
    reach: number;
    engagement: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpm: number;
  };
  timeline: Array<{
    date: string;
    reach: number;
    engagement: number;
    conversions: number;
  }>;
}

interface CreatorPortfolio {
  creatorId: string;
  portfolio: {
    bio: string;
    niche: string[];
    audience: {
      age_range: string;
      gender_split: { male: number; female: number; other: number };
      top_locations: string[];
      interests: string[];
    };
    content: {
      total_posts: number;
      avg_engagement: number;
      top_performing: Array<{
        id: string;
        type: string;
        engagement: number;
        reach: number;
        date: string;
      }>;
    };
    brands: {
      worked_with: string[];
      avg_rating: number;
      total_deals: number;
      avg_deal_value: number;
    };
    pricing: {
      reel: number;
      post: number;
      story: number;
      integration: number;
    };
  };
  analytics: {
    growth: {
      followers: number;
      followers_change: number;
      engagement: number;
      engagement_change: number;
    };
    performance: {
      best_posting_times: string[];
      best_posting_days: string[];
      content_types: { [key: string]: number };
      hashtags: Array<{ tag: string; usage: number; avg_engagement: number }>;
    };
    audience_insights: {
      demographics: any;
      behavior: any;
      preferences: any;
    };
  };
}

interface PredictiveInsights {
  content_performance: {
    next_week_prediction: {
      reach: number;
      engagement: number;
      confidence: number;
    };
    trending_topics: Array<{
      topic: string;
      predicted_engagement: number;
      competition_level: 'low' | 'medium' | 'high';
    }>;
    optimal_posting_schedule: Array<{
      day: string;
      hour: string;
      predicted_performance: number;
    }>;
  };
  market_opportunities: {
    emerging_trends: string[];
    competitor_analysis: Array<{
      competitor: string;
      growth_rate: number;
      strategy: string;
    }>;
    pricing_recommendations: {
      current_avg: number;
      recommended_min: number;
      recommended_max: number;
      market_position: string;
    };
  };
  risk_assessment: {
    content_quality_risk: number;
    audience_engagement_risk: number;
    market_saturation_risk: number;
    recommendations: string[];
  };
}

// Advanced Analytics Dashboard Component
export const AdvancedAnalyticsDashboard: React.FC<{
  creatorData: CreatorPortfolio;
  campaigns: CampaignAnalytics[];
  predictiveInsights: PredictiveInsights;
  className?: string;
}> = ({ creatorData, campaigns, predictiveInsights, className }) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  // Calculate key metrics
  const metrics = useMemo(() => {
    const portfolio = creatorData.portfolio;
    const analytics = creatorData.analytics;

    return {
      totalReach: portfolio.content.top_performing.reduce((sum, post) => sum + post.reach, 0),
      avgEngagement: portfolio.content.avg_engagement,
      growthRate: analytics.growth.followers_change,
      totalBrands: portfolio.brands.worked_with.length,
      avgDealValue: portfolio.brands.avg_deal_value,
      portfolioScore: calculatePortfolioScore(creatorData)
    };
  }, [creatorData]);

  // Campaign performance summary
  const campaignSummary = useMemo(() => {
    const active = campaigns.filter(c => c.status === 'active');
    const completed = campaigns.filter(c => c.status === 'completed');

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: active.length,
      totalBudget: campaigns.reduce((sum, c) => sum + c.budget, 0),
      totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
      avgROI: campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length || 0,
      totalReach: campaigns.reduce((sum, c) => sum + c.reach, 0),
      totalEngagement: campaigns.reduce((sum, c) => sum + c.engagement, 0)
    };
  }, [campaigns]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Portfolio Score"
          value={`${metrics.portfolioScore}/100`}
          icon={<Award className="h-5 w-5 text-yellow-500" />}
          trend={5}
          subtitle="Overall performance"
          color="yellow"
        />
        <MetricCard
          title="Total Reach"
          value={formatNumber(metrics.totalReach)}
          icon={<Eye className="h-5 w-5 text-blue-500" />}
          trend={metrics.growthRate}
          subtitle="Across all content"
          color="blue"
        />
        <MetricCard
          title="Avg Engagement"
          value={`${metrics.avgEngagement.toFixed(1)}%`}
          icon={<Heart className="h-5 w-5 text-red-500" />}
          trend={2.3}
          subtitle="Engagement rate"
          color="red"
        />
        <MetricCard
          title="Avg Deal Value"
          value={`₹${formatNumber(metrics.avgDealValue)}`}
          icon={<DollarSign className="h-5 w-5 text-green-500" />}
          trend={8.5}
          subtitle="Per collaboration"
          color="green"
        />
      </div>

      {/* Main analytics tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generatePerformanceData(selectedTimeframe)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="reach" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="engagement" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Campaign Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Campaigns</span>
                  <Badge variant="secondary">{campaignSummary.activeCampaigns}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average ROI</span>
                  <span className={`text-sm font-bold ${campaignSummary.avgROI > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {campaignSummary.avgROI > 0 ? '+' : ''}{campaignSummary.avgROI.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Reach</span>
                  <span className="text-sm font-semibold">{formatNumber(campaignSummary.totalReach)}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Budget Utilized</span>
                    <span>{((campaignSummary.totalSpent / campaignSummary.totalBudget) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(campaignSummary.totalSpent / campaignSummary.totalBudget) * 100} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Analytics Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Content Type Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(creatorData.analytics.performance.content_types).map(([type, count]) => ({ type, count }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Hashtags */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Hashtags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {creatorData.analytics.performance.hashtags.slice(0, 8).map((hashtag, index) => (
                    <div key={hashtag.tag} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium">#{hashtag.tag}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{hashtag.avg_engagement.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">{hashtag.usage} posts</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Optimal Posting Times */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Optimal Posting Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {creatorData.analytics.performance.best_posting_times.map((time, index) => (
                  <div key={index} className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="text-lg font-bold text-green-700">{time}</div>
                    <div className="text-xs text-green-600">Peak Performance</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {/* Predictive Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Next Week Prediction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Predicted Reach</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatNumber(predictiveInsights.content_performance.next_week_prediction.reach)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Predicted Engagement</span>
                  <span className="text-lg font-bold text-red-600">
                    {predictiveInsights.content_performance.next_week_prediction.engagement.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Confidence Level</span>
                  <Badge variant={predictiveInsights.content_performance.next_week_prediction.confidence > 80 ? "default" : "secondary"}>
                    {predictiveInsights.content_performance.next_week_prediction.confidence}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trending Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {predictiveInsights.content_performance.trending_topics.slice(0, 5).map((topic, index) => (
                    <div key={topic.topic} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-medium">{topic.topic}</div>
                        <div className="text-sm text-muted-foreground">
                          {topic.predicted_engagement}% predicted engagement
                        </div>
                      </div>
                      <Badge variant={
                        topic.competition_level === 'low' ? 'default' :
                        topic.competition_level === 'medium' ? 'secondary' : 'destructive'
                      }>
                        {topic.competition_level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Assessment & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {predictiveInsights.risk_assessment.content_quality_risk}%
                  </div>
                  <div className="text-sm text-muted-foreground">Content Quality Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {predictiveInsights.risk_assessment.audience_engagement_risk}%
                  </div>
                  <div className="text-sm text-muted-foreground">Engagement Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {predictiveInsights.risk_assessment.market_saturation_risk}%
                  </div>
                  <div className="text-sm text-muted-foreground">Market Saturation Risk</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Recommendations:</h4>
                {predictiveInsights.risk_assessment.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper functions
function calculatePortfolioScore(creatorData: CreatorPortfolio): number {
  const portfolio = creatorData.portfolio;
  const analytics = creatorData.analytics;

  let score = 50; // Base score

  // Content quality (0-20 points)
  if (portfolio.content.avg_engagement > 5) score += 20;
  else if (portfolio.content.avg_engagement > 3) score += 15;
  else if (portfolio.content.avg_engagement > 1) score += 10;

  // Brand reputation (0-15 points)
  if (portfolio.brands.avg_rating >= 4.5) score += 15;
  else if (portfolio.brands.avg_rating >= 4.0) score += 10;
  else if (portfolio.brands.avg_rating >= 3.5) score += 5;

  // Experience (0-10 points)
  if (portfolio.brands.total_deals > 50) score += 10;
  else if (portfolio.brands.total_deals > 20) score += 7;
  else if (portfolio.brands.total_deals > 5) score += 5;

  // Growth (0-5 points)
  if (analytics.growth.followers_change > 10) score += 5;
  else if (analytics.growth.followers_change > 5) score += 3;

  return Math.min(score, 100);
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function generatePerformanceData(timeframe: string) {
  // Generate mock performance data
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const data = [];

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      reach: Math.floor(Math.random() * 50000) + 10000,
      engagement: Math.floor(Math.random() * 5000) + 1000,
    });
  }

  return data;
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {trend > 0 ? <TrendingUp className="h-3 w-3" /> :
                 trend < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                {trend !== 0 && `${Math.abs(trend).toFixed(1)}%`}
                {trend === 0 && "No change"}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};