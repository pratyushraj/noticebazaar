"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, PlusCircle, FileText, Bot, CheckCircle, AlertTriangle, MessageSquare, Lightbulb } from 'lucide-react'; // Added Lightbulb icon
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // Added DialogFooter
import BrandDealForm from '@/components/forms/BrandDealForm';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { BrandDeal } from '@/types';
import { useScanContractAI } from '@/lib/hooks/useScanContractAI'; // Import the new hook
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button'; // Ensure Button is imported
import { Label } from '@/components/ui/label'; // Import Label
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea
import SocialAccountLinkForm from '@/components/forms/SocialAccountLinkForm'; // NEW: Import SocialAccountLinkForm

const CreatorDashboard = () => {
  const { profile, loading: sessionLoading, isCreator } = useSession();
  const [isBrandDealFormOpen, setIsBrandDealFormOpen] = useState(false);
  const [editingBrandDeal, setEditingBrandDeal] = useState<BrandDeal | null>(null);
  const [isAIScanDialogOpen, setIsAIScanDialogOpen] = useState(false); // New state for AI scan dialog
  const [selectedContractForAIScan, setSelectedContractForAIScan] = useState<string | null>(null); // Stores contract_file_url
  const [aiScanResults, setAiScanResults] = useState<any>(null); // Stores AI scan results
  const [isUploadContractQuickActionOpen, setIsUploadContractQuickActionOpen] = useState(false); // State for 'Upload Contract' quick action dialog
  const [isSocialLinkFormOpen, setIsSocialLinkFormOpen] = useState(false); // NEW: State for SocialAccountLinkForm dialog

  // Fetch mock dashboard data (for KPIs, AI actions, etc. that are not directly brand deals)
  const { data: mockDashboardData, isLoading: isLoadingMocks, error: mockError } = useCreatorDashboardData(
    !sessionLoading && isCreator
  );

  // Fetch real brand deals
  const { data: brandDeals, isLoading: isLoadingBrandDeals, error: brandDealsError, refetch: refetchBrandDeals } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !sessionLoading && isCreator && !!profile?.id,
  });

  // AI Scan Contract Mutation
  const scanContractMutation = useScanContractAI();

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
    const pending = brandDeals?.filter(deal => deal.status === 'Payment Pending' && new Date(deal.payment_expected_date) >= new Date()) || [];
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

  const handleAddBrandDeal = () => {
    setEditingBrandDeal(null); // Clear any editing data
    setIsBrandDealFormOpen(true);
  };

  const handleEditBrandDeal = (deal: BrandDeal) => {
    setEditingBrandDeal(deal);
    setIsBrandDealFormOpen(true);
  };

  const handleAIScanContract = () => {
    setSelectedContractForAIScan(null); // Reset selection
    setAiScanResults(null); // Clear previous results
    setIsAIScanDialogOpen(true);
  };

  // Handler for 'Upload Contract' quick action
  const handleUploadContractQuickAction = () => {
    setIsUploadContractQuickActionOpen(true);
  };

  // NEW: Handler for 'Link Social Accounts' quick action
  const handleLinkSocialAccounts = () => {
    setIsSocialLinkFormOpen(true);
  };

  const handlePerformAIScan = async () => {
    if (!selectedContractForAIScan) {
      toast.error('Please select a contract to scan.');
      return;
    }
    const selectedDeal = brandDeals?.find(deal => deal.contract_file_url === selectedContractForAIScan);
    if (!selectedDeal) {
      toast.error('Selected contract not found.');
      return;
    }

    try {
      const results = await scanContractMutation.mutateAsync({
        contract_file_url: selectedContractForAIScan,
        brand_name: selectedDeal.brand_name,
      });
      setAiScanResults(results);
      toast.success('AI scan completed successfully!');
    } catch (error: any) {
      toast.error('AI scan failed', { description: error.message });
    }
  };

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
      <CreatorQuickActions 
        quickActions={mockDashboardData.quickActions} 
        onAddBrandDeal={handleAddBrandDeal} 
        onAIScanContract={handleAIScanContract} 
        onUploadContract={handleUploadContractQuickAction} 
        onLinkSocialAccounts={handleLinkSocialAccounts} // NEW: Pass the handler
      />

      {/* Revenue & Payments */}
      <CreatorRevenuePayments
        pendingBrandPayments={derivedPendingBrandPayments}
        activeBrandDeals={derivedActiveBrandDeals}
        previousBrands={derivedPreviousBrands}
        totalIncomeTracked={derivedTotalIncomeTracked}
        onEditBrandDeal={handleEditBrandDeal}
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
          className="sm:max-w-[600px] bg-card text-foreground border-border h-[90vh] flex flex-col"
          aria-labelledby="brand-deal-form-title"
          aria-describedby="brand-deal-form-description"
        >
          <DialogHeader>
            <DialogTitle id="brand-deal-form-title">{editingBrandDeal ? 'Edit Brand Deal' : 'Add New Brand Deal'}</DialogTitle>
            <DialogDescription id="brand-deal-form-description" className="text-muted-foreground">
              {editingBrandDeal ? 'Update the details for this brand collaboration.' : 'Enter the details for your new brand collaboration.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 p-4 -mx-4">
            <BrandDealForm
              initialData={editingBrandDeal}
              onSaveSuccess={() => {
                refetchBrandDeals();
                setIsBrandDealFormOpen(false);
                setEditingBrandDeal(null);
              }}
              onClose={() => {
                setIsBrandDealFormOpen(false);
                setEditingBrandDeal(null);
              }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Upload Contract Quick Action Dialog */}
      <Dialog open={isUploadContractQuickActionOpen} onOpenChange={setIsUploadContractQuickActionOpen}>
        <DialogContent 
          className="sm:max-w-[600px] bg-card text-foreground border-border h-[90vh] flex flex-col"
          aria-labelledby="upload-contract-quick-action-title"
          aria-describedby="upload-contract-quick-action-description"
        >
          <DialogHeader>
            <DialogTitle id="upload-contract-quick-action-title">Upload New Contract</DialogTitle>
            <DialogDescription id="upload-contract-quick-action-description" className="text-muted-foreground">
              To upload a contract, please create a new brand deal and attach the file.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 p-4 -mx-4">
            <BrandDealForm
              initialData={null} // Always for a new deal
              onSaveSuccess={() => {
                refetchBrandDeals();
                setIsUploadContractQuickActionOpen(false);
              }}
              onClose={() => {
                setIsUploadContractQuickActionOpen(false);
              }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* NEW: Social Account Link Dialog */}
      <Dialog open={isSocialLinkFormOpen} onOpenChange={setIsSocialLinkFormOpen}>
        <DialogContent 
          className="sm:max-w-[600px] bg-card text-foreground border-border h-[90vh] flex flex-col" // Added h-[90vh] flex flex-col
          aria-labelledby="social-link-form-title"
          aria-describedby="social-link-form-description"
        >
          <DialogHeader>
            <DialogTitle id="social-link-form-title">Link Social Accounts</DialogTitle>
            <DialogDescription id="social-link-form-description" className="text-muted-foreground">
              Connect your social media profiles to enable advanced insights and protection.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 p-4 -mx-4"> {/* Added flex-1 and negative margin for padding */}
            {profile && (
              <SocialAccountLinkForm
                initialData={profile}
                onSaveSuccess={() => {
                  // Profile refetch is handled by useUpdateProfile's onSuccess
                  setIsSocialLinkFormOpen(false);
                }}
                onClose={() => setIsSocialLinkFormOpen(false)}
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* AI Scan Contract Dialog */}
      <Dialog open={isAIScanDialogOpen} onOpenChange={setIsAIScanDialogOpen}>
        <DialogContent 
          className="sm:max-w-[600px] bg-card text-foreground border-border"
          aria-labelledby="ai-scan-contract-title"
          aria-describedby="ai-scan-contract-description"
        >
          <DialogHeader>
            <DialogTitle id="ai-scan-contract-title">AI Contract Scan</DialogTitle>
            <DialogDescription id="ai-scan-contract-description" className="text-muted-foreground">
              Select a contract to analyze for potential risks and insights.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="selectContract">Select Contract to Scan</Label>
              <Select
                onValueChange={setSelectedContractForAIScan}
                value={selectedContractForAIScan || ''}
                disabled={scanContractMutation.isPending || !brandDeals || brandDeals.length === 0}
              >
                <SelectTrigger id="selectContract">
                  <SelectValue placeholder="Choose a contract" />
                </SelectTrigger>
                <SelectContent>
                  {brandDeals?.length === 0 ? (
                    <SelectItem value="no-contracts" disabled>No contracts available</SelectItem>
                  ) : (
                    brandDeals?.filter(deal => deal.contract_file_url).map((deal) => (
                      <SelectItem key={deal.id} value={deal.contract_file_url!}>
                        {deal.brand_name} - {deal.deliverables}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!brandDeals?.some(deal => deal.contract_file_url) && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" /> Upload a contract to a brand deal first to enable AI scanning.
                </p>
              )}
            </div>

            <Button
              onClick={handlePerformAIScan}
              disabled={!selectedContractForAIScan || scanContractMutation.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {scanContractMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning...
                </>
              ) : (
                <>
                  <Bot className="mr-2 h-4 w-4" /> Perform AI Scan
                </>
              )}
            </Button>

            {aiScanResults && (
              <Card className="bg-secondary p-4 rounded-lg border border-border mt-4">
                <CardHeader className="p-0 mb-3">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" /> AI Scan Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  <p className="text-sm text-muted-foreground">{aiScanResults.summary}</p>
                  <h4 className="font-medium text-foreground flex items-center"><AlertTriangle className="h-4 w-4 text-red-500 mr-2" /> Key Insights:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-sm text-muted-foreground">
                    {aiScanResults.insights.map((insight: any, index: number) => (
                      <li key={index}>{insight.description}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3">
                    <MessageSquare className="h-4 w-4 inline mr-2 text-blue-500" />
                    **Recommendation:** {aiScanResults.recommendations}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIScanDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreatorDashboard;