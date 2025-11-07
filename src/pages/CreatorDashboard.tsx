"use client";

import React, { useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreatorDashboardData } from '@/lib/hooks/useCreatorDashboardData';
import CreatorKpiCards from '@/components/creator-dashboard/CreatorKpiCards';
import CreatorQuickActions from '@/components/creator-dashboard/CreatorQuickActions';
import CreatorRevenuePayments from '@/components/creator-dashboard/CreatorRevenuePayments';
import CreatorLegalWorkflows from '@/components/creator-dashboard/CreatorLegalWorkflows';
import CreatorProtectionCompliance from '@/components/creator-dashboard/CreatorProtectionCompliance';
import CreatorTaxCompliance from '@/components/creator-dashboard/CreatorTaxCompliance';
import CreatorCopyrightScanner from '@/components/creator-dashboard/CreatorCopyrightScanner';
import CreatorAIActionCenter from '@/components/creator-dashboard/CreatorAIActionCenter';
import CreatorImportantDeadlines from '@/components/creator-dashboard/CreatorImportantDeadlines';
import { Card, CardContent } from '@/components/ui/card'; // Import Card for the scanner section

const CreatorDashboard = () => {
  const { profile, loading: sessionLoading, isCreator } = useSession();

  const { data: dashboardData, isLoading, error } = useCreatorDashboardData(
    !sessionLoading && isCreator
  );

  useEffect(() => {
    if (error) {
      toast.error('Failed to load creator dashboard data', { description: error.message });
    }
  }, [error]);

  if (sessionLoading || isLoading) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading Creator Dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <p className="text-destructive">No dashboard data available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold text-foreground">
        CREATOR DASHBOARD, Welcome back, {profile?.first_name || 'Creator'}!
      </h1>
      <p className="text-muted-foreground opacity-60 -mt-6">Your comprehensive overview of brand deals, legal protection, and financial health.</p>

      {/* KPI Cards */}
      <CreatorKpiCards kpiCards={dashboardData.kpiCards} />

      {/* Quick Actions */}
      <CreatorQuickActions quickActions={dashboardData.quickActions} />

      {/* Revenue & Payments */}
      <CreatorRevenuePayments
        pendingBrandPayments={dashboardData.pendingBrandPayments}
        activeBrandDeals={dashboardData.activeBrandDeals}
        previousBrands={dashboardData.previousBrands}
        totalIncomeTracked={dashboardData.totalIncomeTracked}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Legal Workflows */}
        <div className="lg:col-span-2">
          <CreatorLegalWorkflows
            contractsRequiringReview={dashboardData.contractsRequiringReview}
            takedownAlerts={dashboardData.takedownAlerts}
          />
        </div>

        {/* AI Action Center */}
        <CreatorAIActionCenter aiActions={dashboardData.aiActionCenter} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Protection & Compliance */}
        <CreatorProtectionCompliance protectionCompliance={dashboardData.protectionCompliance} />

        {/* Tax Compliance Status */}
        <CreatorTaxCompliance taxComplianceStatus={dashboardData.taxComplianceStatus} />

        {/* Important Deadlines */}
        <CreatorImportantDeadlines deadlines={dashboardData.importantDeadlines} />
      </div>

      {/* Copyright Scanner */}
      <CreatorCopyrightScanner />
    </div>
  );
};

export default CreatorDashboard;