

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, Target, LineChart, Calendar, Award, ArrowLeft, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/navbar/Navbar';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import WeeklyPerformance from '@/components/creator-dashboard/WeeklyPerformance';
import BrandInterestScore from '@/components/creator-dashboard/BrandInterestScore';
import CreatorScoreBadge from '@/components/creator-dashboard/CreatorScoreBadge';
import ProjectedEarnings from '@/components/creator-dashboard/ProjectedEarnings';
import GoalProgressAnnual from '@/components/creator-dashboard/GoalProgressAnnual';

const InsightsPage: React.FC = () => {
  const { profile, loading: sessionLoading } = useSession();
  const navigate = useNavigate();

  const { data: brandDeals, isLoading: isLoadingDeals } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !sessionLoading && !!profile?.id,
  });

  // Calculate earnings trend
  const earningsTrend = useMemo(() => {
    if (!brandDeals || brandDeals.length === 0) return { trend: 'flat', percent: 0 };
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const currentMonthEarnings = brandDeals
      .filter(deal => {
        if (!deal.payment_received_date) return false;
        const date = new Date(deal.payment_received_date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, deal) => sum + deal.deal_amount, 0);
    
    const lastMonthEarnings = brandDeals
      .filter(deal => {
        if (!deal.payment_received_date) return false;
        const date = new Date(deal.payment_received_date);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      })
      .reduce((sum, deal) => sum + deal.deal_amount, 0);
    
    const change = lastMonthEarnings > 0 
      ? ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 
      : 0;
    
    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
      percent: Math.abs(change),
      current: currentMonthEarnings,
      previous: lastMonthEarnings,
    };
  }, [brandDeals]);

  if (sessionLoading) {
    return (
      <div className="nb-screen-height bg-[#0A0F1A] flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="creator">
      <div className="nb-screen-height bg-[#0A0F1A]">
        <Navbar />
        
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/creator-dashboard')}
              className="mb-4 text-foreground/70 hover:text-foreground hover:bg-secondary/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center border border-purple-500/30">
                <TrendingUp className="h-5 w-5 text-secondary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Insights & Analytics</h1>
            </div>
            <p className="text-sm text-foreground/60 mt-1">
              Growth intelligence, performance data, and forecasting for your creator business
            </p>
          </div>

          {/* Earnings Trend Card */}
          <Card className="mb-6 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-purple-500/10 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground/70 mb-1">Earnings Trend</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">
                      ₹{earningsTrend.current.toLocaleString('en-IN')}
                    </span>
                    <span className={cn(
                      "text-sm font-semibold flex items-center gap-1",
                      earningsTrend.trend === 'up' ? "text-primary" :
                      earningsTrend.trend === 'down' ? "text-destructive" : "text-foreground/60"
                    )}>
                      <TrendingUp className={cn(
                        "w-4 h-4",
                        earningsTrend.trend === 'down' && "rotate-180",
                        earningsTrend.trend === 'flat' && "hidden"
                      )} />
                      {earningsTrend.trend !== 'flat' && `${earningsTrend.percent.toFixed(1)}%`}
                      {earningsTrend.trend === 'flat' && 'No change'}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/50 mt-1">vs last month</p>
                </div>
                <div className="h-16 w-16 rounded-xl bg-card flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Insights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Brand Interest Score */}
            <BrandInterestScore brandDeals={brandDeals} profile={profile} />
            
            {/* Weekly Performance */}
            <WeeklyPerformance brandDeals={brandDeals} />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            {/* Creator Score */}
            <CreatorScoreBadge brandDeals={brandDeals} />
            
            {/* Projected Earnings */}
            <ProjectedEarnings brandDeals={brandDeals} />
            
            {/* Goal Progress */}
            <GoalProgressAnnual brandDeals={brandDeals} />
          </div>

          {/* Growth Forecast Section */}
          <Card className="mb-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-info/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Target className="w-5 h-5 text-info" />
                Growth Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-card rounded-xl">
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Projected Next Month</p>
                    <p className="text-2xl font-bold text-foreground">
                      ₹{Math.round(earningsTrend.current * 1.1).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <Sparkles className="w-8 h-8 text-info" />
                </div>
                <div className="flex items-center justify-between p-4 bg-card rounded-xl">
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Estimated 3-Month Average</p>
                    <p className="text-2xl font-bold text-foreground">
                      ₹{Math.round(earningsTrend.current * 1.15).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <LineChart className="w-8 h-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Highlights */}
          <Card className="bg-[#0F121A]/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Calendar className="w-5 h-5 text-info" />
                Weekly Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {brandDeals && brandDeals.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-card rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-foreground">Top Performing Deal</p>
                        <p className="text-xs text-foreground/60">
                          {brandDeals.reduce((max, deal) => deal.deal_amount > (max?.deal_amount || 0) ? deal : max, brandDeals[0])?.brand_name}
                        </p>
                      </div>
                      <Award className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-card rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-foreground">Total Active Deals</p>
                        <p className="text-xs text-foreground/60">
                          {brandDeals.filter(d => d.status === 'Approved' || d.status === 'Drafting').length} running
                        </p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-foreground/60 text-center py-4">No highlights available yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default InsightsPage;
