"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, PlusCircle } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import BrandDealForm from '@/components/forms/BrandDealForm'; // Import the new form
import { useBrandDeals } from '@/lib/hooks/useBrandDeals'; // Import the new hook
import { BrandDeal } from '@/types'; // Import BrandDeal type

const CreatorDashboard = () => {
  const { profile, loading: sessionLoading, isCreator } = useSession();
  const [isBrandDealFormOpen, setIsBrandDealFormOpen] = useState(false);

  // Fetch mock dashboard data (for KPIs, AI actions, etc. that are not directly brand deals)
  const { data: mockDashboardData, isLoading: isLoadingMocks, error: mockError } = useCreatorDashboardData(
    !sessionLoading && isCreator
  );

  // Fetch real brand deals
  const { data: brandDeals, isLoading: isLoadingBrandDeals, error: brandDealsError, refetch: refetchBrandDeals } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !sessionLoading && isCreator && !!profile?.id,
  });

  useEffect(() => {
    if (mockError) {
      toast.error('Failed to load creator dashboard data', { description: mockError.message });
    }
    if (brandDealsError) {
      toast.error('Failed to load brand deals', { description: brandDealsError.message });
    }
  }, [mockError, brandDealsError]);

  // Derive data for Revenue & Payments from real brand deals
  const derivedPendingBrandPayments = useMemo(() => {
    const pending = brandDeals?.filter(deal => deal.status === 'Payment Pending' || deal.status === 'Approved' && new Date(deal.payment_expected_date) > new Date()) || [];
    const overdue = brandDeals?.filter(deal => deal.status === 'Payment Pending' && new Date(deal.payment_expected_date) < new Date()) || [];
    
    const totalPendingAmount = pending.reduce((sum, deal) => sum + deal.deal_amount, 0);
    const totalOverdueAmount = overdue.reduce((sum, deal) => sum + deal.deal_amount, 0);

    let status = 'No Pending Payments';
    let details = '';
    let amount = '₹0';

    if (overdue.length > 0) {
      status = 'Overdue';
      details = `${overdue.length} invoice${overdue.length !== 1 ? 's' : ''}`;
      amount = `₹${totalOverdueAmount.toLocaleString('en-IN')}`;
    } else if (pending.length > 0) {
      status = 'Payment Pending';
      details = `${pending.length} invoice${pending.length !== 1 ? 's' : ''}`;
      amount = `₹${totalPendingAmount.toLocaleString('en-IN')}`;
    }

    return { amount, status, details };
  }, [brandDeals]);

  const derivedActiveBrandDeals = useMemo(() => {
    return brandDeals?.filter(deal => deal.status === 'Drafting' || deal.status === 'Approved' || deal.status === 'Payment Pending') || [];
  }, [brandDeals]);

  const derivedPreviousBrands = useMemo(() => {
    const completedBrands = brandDeals?.filter(deal => deal.status === 'Completed').map(deal => deal.brand_name) || [];
    return Array.from(new Set(completedBrands)); // Unique brand names
  }, [brandDeals]);

  const derivedTotalIncomeTracked = useMemo(() => {
    const total = brandDeals?.filter(deal => deal.status === 'Completed' || deal.status === 'Approved' || deal.status === 'Payment Pending').reduce((sum, deal) => sum + deal.deal_amount, 0) || 0;
    return `₹${total.toLocaleString('en-IN')}`;
  }, [brandDeals]);

  // Derive contracts requiring review from brand deals
  const derivedContractsRequiringReview = useMemo(() => {
    return brandDeals?.filter(deal => deal.status === 'Drafting' && deal.contract_file_url)
      .map(deal => ({
        id: deal.id,
        title: `${deal.brand_name} - Contract Review Needed`,
        status: 'risky' as const, // Placeholder status
      })) || [];
  }, [brandDeals]);


  if (sessionLoading || isLoadingMocks || isLoadingBrandDeals) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading Creator Dashboard...</p>
      </div>
    );
  }

  if (!mockDashboardData) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <p className="text-destructive">No dashboard data available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 bg-background"> {/* Ensure main container uses background color */}
      <h1 className="text-3xl font-bold text-foreground">
        CREATOR DASHBOARD, Welcome back, {profile?.first_name || 'Creator'}!
      </h1>
      <p className="text-muted-foreground opacity-60 -mt-6">Your comprehensive overview of brand deals, legal protection, and financial health.</p>

      {/* KPI Cards */}
      <CreatorKpiCards kpiCards={mockDashboardData.kpiCards} />

      {/* Quick Actions */}
      <CreatorQuickActions quickActions={mockDashboardData.quickActions} onAddBrandDeal={() => setIsBrandDealFormOpen(true)} />

      {/* Revenue & Payments */}
      <CreatorRevenuePayments
        pendingBrandPayments={derivedPendingBrandPayments}
        activeBrandDeals={derivedActiveBrandDeals}
        previousBrands={derivedPreviousBrands}
        totalIncomeTracked={derivedTotalIncomeTracked}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Legal Workflows */}
        <div className="lg:col-span-2">
          <CreatorLegalWorkflows
            contractsRequiringReview={derivedContractsRequiringReview}
            takedownAlerts={mockDashboardData.takedownAlerts}
          />
        </div>

        {/* AI Action Center */}
        <CreatorAIActionCenter aiActions={mockDashboardData.aiActionCenter} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Protection & Compliance */}
        <CreatorProtectionCompliance protectionCompliance={mockDashboardData.protectionCompliance} />

        {/* Tax Compliance Status */}
        <CreatorTaxCompliance taxComplianceStatus={mockDashboardData.taxComplianceStatus} />

        {/* Important Deadlines */}
        <CreatorImportantDeadlines deadlines={mockDashboardData.importantDeadlines} />
      </div>

      {/* Copyright Scanner */}
      <CreatorCopyrightScanner />

      {/* Brand Deal Form Dialog */}
      <Dialog open={isBrandDealFormOpen} onOpenChange={setIsBrandDealFormOpen}>
        <DialogContent 
          className="sm:max-w-[600px] bg-card text-foreground border-border"
          aria-labelledby="add-brand-deal-title"
          aria-describedby="add-brand-deal-description"
        >
          <DialogHeader>
            <DialogTitle id="add-brand-deal-title">Add New Brand Deal</DialogTitle>
            <DialogDescription id="add-brand-deal-description" className="text-muted-foreground">
              Enter the details for your new brand collaboration.
            </DialogDescription>
          </DialogHeader>
          <BrandDealForm
            onSaveSuccess={() => {
              refetchBrandDeals(); // Refetch brand deals after successful save
              setIsBrandDealFormOpen(false);
            }}
            onClose={() => setIsBrandDealFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreatorDashboard;