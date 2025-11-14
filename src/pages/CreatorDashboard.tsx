"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, PlusCircle, FileText, Bot, CheckCircle, AlertTriangle, MessageSquare, Lightbulb, DollarSign } from 'lucide-react'; // Added Lightbulb icon and DollarSign
import { toast } from 'sonner';
import { useCreatorDashboardData } from '@/lib/hooks/useCreatorDashboardData';
import CreatorKpiCards from '@/components/creator-dashboard/CreatorKpiCards';
import ProtectionScoreCard from '@/components/creator-dashboard/ProtectionScoreCard';
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

      {/* KPI Cards with Protection Score */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Protection Score - Enhanced and Prominent */}
        <div className="lg:col-span-1">
          {mockDashboardData?.kpiCards && (() => {
            const protectionScoreKpi = mockDashboardData.kpiCards.find(kpi => kpi.title === 'Protection Score');
            if (protectionScoreKpi) {
              const scoreValue = parseInt(protectionScoreKpi.value.replace('%', ''));
              return (
                <ProtectionScoreCard
                  score={scoreValue}
                  changePercentage={protectionScoreKpi.changePercentage}
                  changeDirection={protectionScoreKpi.changeDirection}
                  statusDescription={protectionScoreKpi.statusDescription}
                  onUploadContract={handleUploadContractQuickAction}
                  onResolveCopyright={() => {
                    // Navigate to content protection page
                    window.location.href = '/creator-content-protection';
                  }}
                  onSendPaymentReminder={handleSendPaymentReminderQuickAction}
                />
              );
            }
            return null;
          })()}
        </div>
        
        {/* Other KPI Cards */}
        <div className="lg:col-span-3">
          <CreatorKpiCards kpiCards={mockDashboardData?.kpiCards || []} />
        </div>
      </div>

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

