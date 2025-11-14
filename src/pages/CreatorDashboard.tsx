"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, PlusCircle, FileText, Bot, CheckCircle, AlertTriangle, MessageSquare, Lightbulb, DollarSign } from 'lucide-react'; // Added Lightbulb icon and DollarSign
import { toast } from 'sonner';
import { useCreatorDashboardData } from '@/lib/hooks/useCreatorDashboardData';
import CreatorKpiCards from '@/components/creator-dashboard/CreatorKpiCards';
import LegalHealthOverview from '@/components/creator-dashboard/LegalHealthOverview';
import SimpleQuickActions from '@/components/creator-dashboard/SimpleQuickActions';
import MonthSummary from '@/components/creator-dashboard/MonthSummary';
import CreatorRevenuePayments from '@/components/creator-dashboard/CreatorRevenuePayments';
import CreatorLegalWorkflows from '@/components/creator-dashboard/CreatorLegalWorkflows';
import CreatorProtectionCompliance from '@/components/creator-dashboard/CreatorProtectionCompliance';
import CreatorTaxCompliance from '@/components/creator-dashboard/CreatorTaxCompliance';
import CreatorCopyrightScanner from '@/components/creator-dashboard/CreatorCopyrightScanner';
import CopyrightScannerCard from '@/components/creator-dashboard/CopyrightScannerCard';
import CreatorAIActionCenter from '@/components/creator-dashboard/CreatorAIActionCenter';
import CreatorImportantDeadlines from '@/components/creator-dashboard/CreatorImportantDeadlines';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // Added DialogFooter
import BrandDealForm from '@/components/forms/BrandDealForm';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { useAIScanContractReview } from '@/lib/hooks/useAIScanContractReview'; // Import the correct hook
import { BrandDeal } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button'; // Ensure Button is imported
import { Label } from '@/components/ui/label'; // Import Label
import { Input } from '@/components/ui/input'; // Import Input
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea
import { useSendPaymentReminder } from '@/lib/hooks/useSendPaymentReminder'; // NEW: Import useSendPaymentReminder
import { useSendTakedownNotice } from '@/lib/hooks/useSendTakedownNotice'; // NEW: Import useSendTakedownNotice
import { useCreatorDeadlines } from '@/lib/hooks/useTaxFilings'; // NEW: Import useCreatorDeadlines

const CreatorDashboard = () => {
  const { profile, loading: sessionLoading, isCreator } = useSession();
  const creatorId = profile?.id;
  const [isBrandDealFormOpen, setIsBrandDealFormOpen] = useState(false);
  const [editingBrandDeal, setEditingBrandDeal] = useState<BrandDeal | null>(null);
  const [isAIScanDialogOpen, setIsAIScanDialogOpen] = useState(false); // New state for AI scan dialog
  const [selectedContractForAIScan, setSelectedContractForAIScan] = useState<string | null>(null); // Stores contract_file_url
  const [aiScanResults, setAiScanResults] = useState<any>(null); // Stores AI scan results
  const [isUploadContractQuickActionOpen, setIsUploadContractQuickActionOpen] = useState(false); // State for 'Upload Contract' quick action dialog
  const [isSendPaymentReminderDialogOpen, setIsSendPaymentReminderDialogOpen] = useState(false); // NEW: State for Send Payment Reminder dialog
  const [selectedDealForReminder, setSelectedDealForReminder] = useState<BrandDeal | null>(null); // NEW: State for selected deal for reminder
  const [isSendTakedownNoticeDialogOpen, setIsSendTakedownNoticeDialogOpen] = useState(false); // NEW: State for Send Takedown Notice dialog
  const [takedownNoticeDetails, setTakedownNoticeDetails] = useState({ // NEW: State for takedown notice details
    contentUrl: '', platform: '', infringingUrl: '', infringingUser: ''
  });

  // Fetch mock dashboard data (for KPIs, AI actions, etc. that are not directly brand deals)
  const { data: mockDashboardData, isLoading: isLoadingMocks, error: mockError } = useCreatorDashboardData(
    !sessionLoading && isCreator
  );

  // Fetch real brand deals
  const { data: brandDeals, isLoading: isLoadingBrandDeals, error: brandDealsError, refetch: refetchBrandDeals } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !sessionLoading && isCreator && !!profile?.id,
  });
  
  // NEW: Fetch real upcoming deadlines
  const { data: upcomingDeadlines, isLoading: isLoadingDeadlines } = useCreatorDeadlines({
    creatorId: creatorId,
    enabled: !sessionLoading && isCreator && !!creatorId,
  });

  // AI Scan Contract Mutation
  const scanContractMutation = useAIScanContractReview();
  // NEW: Send Payment Reminder Mutation
  const sendPaymentReminderMutation = useSendPaymentReminder();
  // NEW: Send Takedown Notice Mutation
  const sendTakedownNoticeMutation = useSendTakedownNotice();

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
    // Refetch brand deals to ensure we have the latest contracts
    refetchBrandDeals();
    setSelectedContractForAIScan(null); // Reset selection
    setAiScanResults(null); // Clear previous results
    setIsAIScanDialogOpen(true);
  };

  // Handler for 'Upload Contract' quick action
  const handleUploadContractQuickAction = () => {
    setIsUploadContractQuickActionOpen(true);
  };

  // NEW: Handler for 'Send Payment Reminder' quick action
  const handleSendPaymentReminderQuickAction = () => {
    setSelectedDealForReminder(null); // Reset selected deal
    setIsSendPaymentReminderDialogOpen(true);
  };

  // NEW: Handler for 'Send Takedown Notice' quick action
  const handleSendTakedownNoticeQuickAction = () => {
    setTakedownNoticeDetails({ contentUrl: '', platform: '', infringingUrl: '', infringingUser: '' }); // Reset form
    setIsSendTakedownNoticeDialogOpen(true);
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

  // NEW: Handle sending payment reminder from dialog
  const handleSendReminderFromDialog = async () => {
    if (!selectedDealForReminder) return;

    try {
      await sendPaymentReminderMutation.mutateAsync({ brandDealId: selectedDealForReminder.id });
      toast.success('Payment reminder sent!');
      setIsSendPaymentReminderDialogOpen(false);
      setSelectedDealForReminder(null);
      refetchBrandDeals();
    } catch (error: any) {
      toast.error('Failed to send reminder', { description: error.message });
    }
  };

  // NEW: Handle sending takedown notice from dialog
  const handleSendTakedownFromDialog = async () => {
    if (!takedownNoticeDetails.contentUrl.trim() || !takedownNoticeDetails.platform.trim() || !takedownNoticeDetails.infringingUrl.trim()) {
      toast.error('Please fill in all required fields for the takedown notice.');
      return;
    }

    try {
      await sendTakedownNoticeMutation.mutateAsync({
        contentUrl: takedownNoticeDetails.contentUrl.trim(),
        platform: takedownNoticeDetails.platform.trim(),
        infringingUrl: takedownNoticeDetails.infringingUrl.trim(),
        infringingUser: takedownNoticeDetails.infringingUser.trim() || undefined,
      });
      toast.success('Takedown notice sent successfully!');
      setIsSendTakedownNoticeDialogOpen(false);
      setTakedownNoticeDetails({ contentUrl: '', platform: '', infringingUrl: '', infringingUser: '' });
    } catch (error: any) {
      toast.error('Failed to send takedown notice', { description: error.message });
    }
  };

  if (sessionLoading || isLoadingMocks || isLoadingBrandDeals || isLoadingDeadlines) {
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

      {/* KPI Cards - Reordered: Money First (Total Income, Active Deals, Pending Payments), Legal Health Last */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Other KPI Cards - Total Income, Active Brand Deals, Pending Payments */}
        <div className="lg:col-span-3">
          <CreatorKpiCards kpiCards={mockDashboardData?.kpiCards || []} />
        </div>
        
        {/* Legal Health Overview - Last */}
        <div className="lg:col-span-1">
          <LegalHealthOverview
            copyrightHealth={{
              status: 'healthy',
              message: 'No takedowns pending',
            }}
            contractHealth={{
              status: 'healthy',
              message: '2 contracts reviewed',
              reviewedContracts: 2,
            }}
            paymentHealth={{
              status: derivedPendingBrandPayments.status === 'Overdue' ? 'critical' : 'warning',
              message: `${derivedPendingBrandPayments.details}`,
              overdueInvoices: derivedPendingBrandPayments.status === 'Overdue' ? parseInt(derivedPendingBrandPayments.details.split(' ')[0]) : 0,
            }}
          />
        </div>
      </div>

      {/* Month Summary */}
      <MonthSummary
        earningsReceived={35000}
        paymentsPending={42000}
        newDeals={3}
        contractsReviewed={5}
        aiFlagsFound={2}
      />

      {/* Top Action Buttons - Above the fold */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sticky-quick-actions md:relative md:sticky md:top-0">
        <Button
          onClick={handleAddBrandDeal}
          className="flex flex-col items-center justify-center p-4 md:p-6 h-20 md:h-24 rounded-xl quick-action-button-gradient min-h-[52px] md:min-h-[80px] text-secondary-foreground"
        >
          <PlusCircle className="h-6 w-6 mb-2" />
          <span className="text-sm font-semibold">Add Brand Deal</span>
        </Button>
        <Button
          onClick={handleUploadContractQuickAction}
          className="flex flex-col items-center justify-center p-4 md:p-6 h-20 md:h-24 rounded-xl quick-action-button-gradient min-h-[52px] md:min-h-[80px] text-secondary-foreground"
        >
          <FileText className="h-6 w-6 mb-2" />
          <span className="text-sm font-semibold">Upload Contract</span>
        </Button>
        <Button
          onClick={handleAIScanContract}
          className="flex flex-col items-center justify-center p-4 md:p-6 h-20 md:h-24 rounded-xl quick-action-button-gradient min-h-[52px] md:min-h-[80px] text-secondary-foreground"
        >
          <Bot className="h-6 w-6 mb-2" />
          <span className="text-sm font-semibold">AI Scan Contract</span>
        </Button>
        <Button
          onClick={handleSendPaymentReminderQuickAction}
          className="flex flex-col items-center justify-center p-4 md:p-6 h-20 md:h-24 rounded-xl quick-action-button-gradient min-h-[52px] md:min-h-[80px] text-secondary-foreground"
        >
          <DollarSign className="h-6 w-6 mb-2" />
          <span className="text-sm font-semibold">Payment Reminder</span>
        </Button>
      </div>


      {/* Simple Quick Actions - ONE clean row with 5 buttons */}
      <SimpleQuickActions
        onAddBrandDeal={handleAddBrandDeal}
        onUploadContract={handleUploadContractQuickAction}
        onAIScanContract={handleAIScanContract}
        onSendPaymentReminder={handleSendPaymentReminderQuickAction}
        onSendTakedownNotice={handleSendTakedownNoticeQuickAction}
      />

      {/* Revenue & Payments */}
      <CreatorRevenuePayments
        pendingBrandPayments={derivedPendingBrandPayments}
        activeBrandDeals={derivedActiveBrandDeals}
        previousBrands={derivedPreviousBrands}
        totalIncomeTracked={derivedTotalIncomeTracked}
        onEditBrandDeal={handleEditBrandDeal}
        onSendReminder={(deal) => {
          setSelectedDealForReminder(deal);
          setIsSendPaymentReminderDialogOpen(true);
        }}
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
        <CreatorAIActionCenter aiActions={mockDashboardData.aiActionCenter} onSendPaymentReminder={handleSendPaymentReminderQuickAction} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Protection & Compliance */}
        <CreatorProtectionCompliance protectionCompliance={mockDashboardData.protectionCompliance} />

        {/* Tax Compliance Status */}
        <CreatorTaxCompliance taxComplianceStatus={mockDashboardData.taxComplianceStatus} />

        {/* Important Deadlines (Now using real data) */}
        <CreatorImportantDeadlines deadlines={upcomingDeadlines || []} isLoading={isLoadingDeadlines} />
      </div>

      {/* Copyright Scanner - Link Card */}
      <CopyrightScannerCard />


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

      {/* AI Scan Contract Dialog */}
      <Dialog open={isAIScanDialogOpen} onOpenChange={setIsAIScanDialogOpen}>
        <DialogContent className="sm:max-w-[700px] bg-card text-foreground border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Contract Scan</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select a contract to scan for legal risks and issues.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {brandDeals
              ?.filter((deal) => deal.contract_file_url)
              .map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedContractForAIScan(deal.contract_file_url || null);
                  }}
                >
                  <div>
                    <p className="font-semibold text-foreground">{deal.brand_name}</p>
                    <p className="text-sm text-muted-foreground">{deal.contract_file_url}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContractForAIScan(deal.contract_file_url || null);
                    }}
                  >
                    Scan
                  </Button>
                </div>
              ))}
          </div>
          {selectedContractForAIScan && (
            <div className="space-y-4 py-4 border-t border-border">
              <AIScanContractReview
                contractFileUrl={selectedContractForAIScan}
                onClose={() => {
                  setSelectedContractForAIScan(null);
                  setIsAIScanDialogOpen(false);
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Contract Quick Action Dialog */}
      <Dialog open={isUploadContractQuickActionOpen} onOpenChange={setIsUploadContractQuickActionOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card text-foreground border-border">
          <DialogHeader>
            <DialogTitle>Upload Contract</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select a brand deal to upload a contract for.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {brandDeals?.map((deal) => (
              <Button
                key={deal.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  handleEditBrandDeal(deal);
                  setIsUploadContractQuickActionOpen(false);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                {deal.brand_name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Payment Reminder Dialog */}
      <Dialog open={isSendPaymentReminderDialogOpen} onOpenChange={setIsSendPaymentReminderDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card text-foreground border-border">
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedDealForReminder
                ? `Send a payment reminder to ${selectedDealForReminder.brand_name} for ₹${selectedDealForReminder.deal_amount.toLocaleString('en-IN')}.`
                : 'Select a brand deal to send a payment reminder.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!selectedDealForReminder ? (
              brandDeals
                ?.filter((deal) => deal.status === 'Payment Pending')
                .map((deal) => (
                  <Button
                    key={deal.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedDealForReminder(deal);
                    }}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    {deal.brand_name} - ₹{deal.deal_amount.toLocaleString('en-IN')}
                  </Button>
                ))
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="font-semibold text-foreground">{selectedDealForReminder.brand_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Amount: ₹{selectedDealForReminder.deal_amount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Due: {new Date(selectedDealForReminder.payment_expected_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <Button
                  onClick={handleSendPaymentReminder}
                  className="w-full"
                  disabled={sendPaymentReminderMutation.isPending}
                >
                  {sendPaymentReminderMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Send Payment Reminder
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSendPaymentReminderDialogOpen(false);
                setSelectedDealForReminder(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Takedown Notice Dialog */}
      <Dialog open={isSendTakedownNoticeDialogOpen} onOpenChange={setIsSendTakedownNoticeDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card text-foreground border-border">
          <DialogHeader>
            <DialogTitle>Send Takedown Notice</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Fill in the details to send a takedown notice for copyright infringement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="content-url">Your Content URL</Label>
              <Input
                id="content-url"
                placeholder="https://youtube.com/watch?v=..."
                value={takedownNoticeDetails.contentUrl}
                onChange={(e) =>
                  setTakedownNoticeDetails({ ...takedownNoticeDetails, contentUrl: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select
                value={takedownNoticeDetails.platform}
                onValueChange={(value) =>
                  setTakedownNoticeDetails({ ...takedownNoticeDetails, platform: value })
                }
              >
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="infringing-url">Infringing Content URL</Label>
              <Input
                id="infringing-url"
                placeholder="https://..."
                value={takedownNoticeDetails.infringingUrl}
                onChange={(e) =>
                  setTakedownNoticeDetails({ ...takedownNoticeDetails, infringingUrl: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="infringing-user">Infringing User (Optional)</Label>
              <Input
                id="infringing-user"
                placeholder="Username or channel name"
                value={takedownNoticeDetails.infringingUser}
                onChange={(e) =>
                  setTakedownNoticeDetails({ ...takedownNoticeDetails, infringingUser: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSendTakedownNoticeDialogOpen(false);
                setTakedownNoticeDetails({ contentUrl: '', platform: '', infringingUrl: '', infringingUser: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTakedownFromDialog}
              disabled={sendTakedownNoticeMutation.isPending}
            >
              {sendTakedownNoticeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Takedown Notice'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreatorDashboard;
