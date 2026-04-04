import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Target,
  Award,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  totalEarnings: number;
  monthlyEarnings: number;
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  averageDealValue: number;
  topCategories: Array<{ category: string; count: number; earnings: number }>;
  monthlyTrend: Array<{ month: string; earnings: number; deals: number }>;
  performance: {
    responseRate: number;
    completionRate: number;
    averageRating: number;
  };
  upcomingPayments: Array<{
    id: string;
    brand: string;
    amount: number;
    dueDate: string;
    status: 'pending' | 'overdue' | 'processing';
  }>;
}

interface CreatorAnalyticsProps {
  data: AnalyticsData;
  className?: string;
}

export const CreatorAnalytics: React.FC<CreatorAnalyticsProps> = ({ data, className }) => {
  // Calculate growth metrics
  const earningsGrowth = useMemo(() => {
    if (data.monthlyTrend.length < 2) return 0;
    const current = data.monthlyTrend[data.monthlyTrend.length - 1].earnings;
    const previous = data.monthlyTrend[data.monthlyTrend.length - 2].earnings;
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  }, [data.monthlyTrend]);

  const dealsGrowth = useMemo(() => {
    if (data.monthlyTrend.length < 2) return 0;
    const current = data.monthlyTrend[data.monthlyTrend.length - 1].deals;
    const previous = data.monthlyTrend[data.monthlyTrend.length - 2].deals;
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  }, [data.monthlyTrend]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Earnings"
          value={`₹${data.totalEarnings.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 text-green-500" />}
          trend={earningsGrowth}
        />
        <MetricCard
          title="This Month"
          value={`₹${data.monthlyEarnings.toLocaleString()}`}
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
          subtitle="Current month earnings"
        />
        <MetricCard
          title="Total Deals"
          value={data.totalDeals.toString()}
          icon={<Users className="h-5 w-5 text-purple-500" />}
          trend={dealsGrowth}
        />
        <MetricCard
          title="Average Deal"
          value={`₹${data.averageDealValue.toLocaleString()}`}
          icon={<Target className="h-5 w-5 text-orange-500" />}
          subtitle="Per collaboration"
        />
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Response Rate</span>
                <span className="text-sm text-muted-foreground">{data.performance.responseRate}%</span>
              </div>
              <Progress value={data.performance.responseRate} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm text-muted-foreground">{data.performance.completionRate}%</span>
              </div>
              <Progress value={data.performance.completionRate} className="h-2" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Average Rating</span>
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-semibold">{data.performance.averageRating.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topCategories.slice(0, 5).map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">₹{category.earnings.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{category.count} deals</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monthly Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {data.monthlyTrend.slice(-6).map((month, index) => (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                  style={{
                    height: `${Math.max((month.earnings / Math.max(...data.monthlyTrend.map(m => m.earnings))) * 100, 8)}%`
                  }}
                />
                <div className="text-center">
                  <div className="text-xs font-medium">{month.month}</div>
                  <div className="text-xs text-muted-foreground">₹{month.earnings.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{month.deals} deals</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Payments */}
      {data.upcomingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.upcomingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{payment.brand}</div>
                      <div className="text-sm text-muted-foreground">Due {new Date(payment.dueDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₹{payment.amount.toLocaleString()}</div>
                    <Badge variant={
                      payment.status === 'overdue' ? 'destructive' :
                      payment.status === 'processing' ? 'default' : 'secondary'
                    } className="text-xs">
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, subtitle }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium",
              trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-muted-foreground"
            )}>
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : trend < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : null}
              {trend !== 0 && `${Math.abs(trend).toFixed(1)}%`}
              {trend === 0 && "No change"}
            </div>
          )}
        </div>
        <div className="p-2 rounded-lg bg-muted">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Sample data for development/testing
export const sampleAnalyticsData: AnalyticsData = {
  totalEarnings: 125000,
  monthlyEarnings: 18500,
  totalDeals: 24,
  activeDeals: 3,
  completedDeals: 21,
  averageDealValue: 5208,
  topCategories: [
    { category: 'Fashion', count: 8, earnings: 45000 },
    { category: 'Beauty', count: 6, earnings: 32000 },
    { category: 'Food', count: 5, earnings: 28000 },
    { category: 'Tech', count: 3, earnings: 15000 },
    { category: 'Lifestyle', count: 2, earnings: 5000 },
  ],
  monthlyTrend: [
    { month: 'Jun', earnings: 12000, deals: 3 },
    { month: 'Jul', earnings: 15000, deals: 4 },
    { month: 'Aug', earnings: 18000, deals: 5 },
    { month: 'Sep', earnings: 22000, deals: 6 },
    { month: 'Oct', earnings: 16000, deals: 4 },
    { month: 'Nov', earnings: 18500, deals: 5 },
  ],
  performance: {
    responseRate: 89,
    completionRate: 95,
    averageRating: 4.7,
  },
  upcomingPayments: [
    {
      id: 'payment-1',
      brand: 'Nike',
      amount: 25000,
      dueDate: '2024-12-15',
      status: 'pending',
    },
    {
      id: 'payment-2',
      brand: 'Mamaearth',
      amount: 12000,
      dueDate: '2024-12-10',
      status: 'processing',
    },
  ],
};