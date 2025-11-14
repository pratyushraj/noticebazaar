"use client";

import React, { useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Menu,
  User,
  CircleDot,
  Play,
  Briefcase,
  Shield
} from 'lucide-react';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { useClientDashboardMetrics } from '@/lib/hooks/useClientDashboardMetrics';
import { Link } from 'react-router-dom';

const ClientDashboard = () => {
  const { profile, loading: sessionLoading, isCreator } = useSession();
  const isClient = !isCreator && profile?.role === 'client';

  // Fetch brand deals (works for both creators and clients)
  const { data: brandDeals = [], isLoading: isLoadingBrandDeals } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !sessionLoading && !!profile?.id,
  });

  // Fetch client metrics if client
  const { data: clientMetrics } = useClientDashboardMetrics(
    profile?.id,
    !sessionLoading && isClient && !!profile?.id
  );

  // Calculate pending payments
  const pendingPayments = useMemo(() => {
    const pending = brandDeals?.filter(
      deal => deal.status === 'Payment Pending' && new Date(deal.payment_expected_date) >= new Date()
    ) || [];
    const overdue = brandDeals?.filter(
      deal => deal.status === 'Payment Pending' && new Date(deal.payment_expected_date) < new Date()
    ) || [];

    const totalPending = pending.reduce((sum, deal) => sum + deal.deal_amount, 0);
    const totalOverdue = overdue.reduce((sum, deal) => sum + deal.deal_amount, 0);

    const overdueDays = overdue.length > 0 
      ? Math.max(...overdue.map(deal => {
          const today = new Date();
          const dueDate = new Date(deal.payment_expected_date);
          return Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }))
      : 0;

    return {
      overdueAmount: totalOverdue,
      overdueCount: overdue.length,
      pendingCount: pending.length,
      overdueDays: overdueDays,
    };
  }, [brandDeals]);

  // Calculate this month's income
  const monthlyIncome = useMemo(() => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const thisMonthDeals = brandDeals?.filter(deal => {
      const dealDate = new Date(deal.created_at);
      return dealDate.getMonth() === thisMonth && dealDate.getFullYear() === thisYear;
    }) || [];

    const total = thisMonthDeals.reduce((sum, deal) => sum + deal.deal_amount, 0);
    return {
      amount: total,
      count: thisMonthDeals.length,
    };
  }, [brandDeals]);

  // Contracts requiring review
  const contractsReview = useMemo(() => {
    return brandDeals?.filter(deal => 
      deal.status === 'Drafting' && deal.contract_file_url
    ) || [];
  }, [brandDeals]);

  // Tax compliance (mock data for now)
  const taxCompliance = {
    amount: 285700,
    deals: 5,
  };

  // Health score (calculated)
  const healthScore = useMemo(() => {
    let score = 72; // Base score
    // Reduce score based on issues
    if (pendingPayments.overdueCount > 0) score -= 10;
    if (contractsReview.length > 0) score -= 8;
    return Math.max(0, Math.min(100, score));
  }, [pendingPayments, contractsReview]);

  // Role-aware labels
  const dashboardTitle = isCreator ? 'CREATOR DASHBOARD' : 'DASHBOARD';
  const baseRoute = isCreator ? '/creator' : '/client';

  if (sessionLoading || isLoadingBrandDeals) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-3">
              {/* Logo: Two overlapping rectangles with diamond cutout */}
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded"></div>
                <div className="absolute top-1 left-1 w-6 h-6 bg-white/20 rounded"></div>
                <div className="absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded" style={{ 
                  clipPath: 'polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)'
                }}></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{dashboardTitle}</h1>
                <p className="text-sm text-muted-foreground">Manage your legal & financial tasks</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to={`${baseRoute}-dashboard`} className="text-primary font-semibold">Home</Link>
              <Link to={`${baseRoute}-documents`} className="text-muted-foreground hover:text-foreground">Documents</Link>
              <Link to={`${baseRoute}-cases`} className="text-muted-foreground hover:text-foreground">Cases</Link>
              {isCreator && (
                <>
                  <Link to="/creator-payments-recovery" className="text-muted-foreground hover:text-foreground">Payments & Recovery</Link>
                  <Link to="/creator-content-protection" className="text-muted-foreground hover:text-foreground">Content Protection</Link>
                </>
              )}
            </nav>

            {/* Right: Profile and Menu */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-muted-foreground">Welcome back!</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <Menu className="w-6 h-6 text-muted-foreground cursor-pointer" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* 1. Pending Payments - Top Left */}
          <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-pink-200 dark:border-pink-800">
            <CardHeader>
              <CardTitle className="text-pink-600 dark:text-pink-400">
                {isCreator ? 'Pending Brand Payments' : 'Pending Payments'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">₹{pendingPayments.overdueAmount.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-muted-foreground mt-1">Overdue</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {pendingPayments.overdueCount + pendingPayments.pendingCount} invoices • {pendingPayments.overdueDays} days
                </div>
                <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">
                  Send Legal Reminder
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2. Contracts Requiring Review - Top Middle */}
          <Card>
            <CardHeader>
              <CardTitle>Contracts Requiring Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contractsReview.length > 0 ? (
                  contractsReview.slice(0, 2).map((deal, idx) => (
                    <div key={deal.id || idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{deal.brand_name || 'Contract'}</p>
                        <p className="text-xs text-muted-foreground">Review needed</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">MamaEarth Deal</p>
                        <p className="text-xs text-muted-foreground">2 clauses risky</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">XYZ Agency</p>
                        <p className="text-xs text-muted-foreground">missing usage rights details</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 3. Tax Compliance Status - Top Right */}
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle>Tax Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">₹{taxCompliance.amount.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{taxCompliance.deals} {isCreator ? 'Deals' : 'Matters'}</p>
                </div>
                <div className="flex items-center justify-center my-4">
                  <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                </div>
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  File Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 4. This Month's Income - Bottom Left */}
          <Card>
            <CardHeader>
              <CardTitle>This Month&apos;s {isCreator ? 'Brand Deal ' : ''}Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-start">
                  <div className="relative w-12 h-12">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border-2 border-blue-300 dark:border-blue-700">
                      <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800"></div>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">₹{(monthlyIncome.amount || taxCompliance.amount).toLocaleString('en-IN')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{monthlyIncome.count || taxCompliance.deals} {isCreator ? 'Deals' : 'Matters'}</p>
                </div>
                <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">
                  {isCreator ? 'Upload Contract' : 'Upload Document'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 5. Copyright Alerts / Legal Alerts - Bottom Middle */}
          {isCreator ? (
            <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                  Copyright Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">2 Videos Reposted on TikTok</p>
                  <Button className="w-full bg-pink-700 hover:bg-pink-800 text-white">
                    Take Down Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-red-500" />
                  Legal Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">2 Active Cases Requiring Attention</p>
                  <Button className="w-full bg-pink-700 hover:bg-pink-800 text-white">
                    View Cases
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 6. Your Legal & Tax Health Score - Bottom Right */}
          <Card>
            <CardHeader>
              <CardTitle>Your Legal & Tax Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Circular Gauge */}
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#1F2937"
                        strokeWidth="8"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#gradient-client)"
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - healthScore / 100)}`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gradient-client" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#A855F7" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-foreground">{healthScore}</span>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-muted-foreground">Score</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    <span className="text-muted-foreground">Contracts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-muted-foreground">{isCreator ? 'Copyright' : 'Legal'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                    <span className="text-muted-foreground">Taxes</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">View tips to improve</p>
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  Fix issues
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              {/* Payments / Documents */}
              {isCreator ? (
                <Link to="/creator-payments-recovery" className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <span className="text-xs font-medium text-foreground">Payments</span>
                </Link>
              ) : (
                <Link to="/client-documents" className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <span className="text-xs font-medium text-foreground">Documents</span>
                </Link>
              )}

              {/* Contracts / Cases */}
              {isCreator ? (
                <Link to="/creator-contracts" className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-medium text-foreground">Contracts</span>
                </Link>
              ) : (
                <Link to="/client-cases" className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-medium text-foreground">Cases</span>
                </Link>
              )}

              {/* Copyright / Consultations */}
              {isCreator ? (
                <Link to="/creator-content-protection" className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <span className="text-orange-600 dark:text-orange-400 font-bold text-lg">C</span>
                  </div>
                  <span className="text-xs font-medium text-foreground">Copyright</span>
                </Link>
              ) : (
                <Link to="/client-consultations" className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs font-medium text-foreground">Consultations</span>
                </Link>
              )}

              {/* Taxes / Profile */}
              <Link to={isCreator ? "/creator-taxes" : "/client-profile"} className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  {isCreator ? (
                    <Play className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <span className="text-xs font-medium text-foreground">{isCreator ? 'Taxes' : 'Profile'}</span>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <CircleDot className="w-2 h-2 text-purple-500" />
              <span className="text-xs text-muted-foreground">All NoticeBazaar</span>
            </div>
          </div>
        </div>

        {/* Spacer for fixed bottom nav */}
        <div className="h-32"></div>
      </main>
    </div>
  );
};

export default ClientDashboard;
