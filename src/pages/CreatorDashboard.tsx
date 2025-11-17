"use client";

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { 
  Search, 
  Bell, 
  Loader2,
  Bot,
  Briefcase,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useCreatorDashboardData } from '@/lib/hooks/useCreatorDashboardData';
import HeroEarningsCard from '@/components/creator-dashboard/HeroEarningsCard';
import CriticalActions from '@/components/creator-dashboard/CriticalActions';
import CombinedPaymentsCard from '@/components/creator-dashboard/CombinedPaymentsCard';
import MoneyOverview from '@/components/creator-dashboard/MoneyOverview';
import QuickStats from '@/components/creator-dashboard/QuickStats';
import UpcomingDeadlines from '@/components/creator-dashboard/UpcomingDeadlines';
import QuickActionsFAB from '@/components/creator-dashboard/QuickActionsFAB';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import BrandDealForm from '@/components/forms/BrandDealForm';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { useAIScanContractReview } from '@/lib/hooks/useAIScanContractReview';
import { BrandDeal } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSendPaymentReminder } from '@/lib/hooks/useSendPaymentReminder';
import { useSendTakedownNotice } from '@/lib/hooks/useSendTakedownNotice';
import { cn } from '@/lib/utils';
import ProjectDealCard from '@/components/creator-contracts/ProjectDealCard';
import { DealStage, PaymentStatus } from '@/components/creator-contracts/DealStatusBadge';
import EnhancedPaymentCard from '@/components/payments/EnhancedPaymentCard';
import FinancialOverviewHeader from '@/components/payments/FinancialOverviewHeader';
import PaymentQuickFilters from '@/components/payments/PaymentQuickFilters';
import CreatorCopyrightScanner from '@/components/creator-dashboard/CreatorCopyrightScanner';
import ProtectionDashboardHeader from '@/components/content-protection/ProtectionDashboardHeader';
import { useOriginalContent, useCopyrightMatches } from '@/lib/hooks/useCopyrightScanner';

// Helper functions
const getDealStage = (deal: BrandDeal): DealStage => {
  if (deal.status === 'Drafting') return 'draft';
  if (deal.status === 'Approved' && !deal.payment_received_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(deal.due_date || deal.payment_expected_date);
    dueDate.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 0) return 'deliverables_due';
    if (daysUntilDue <= 7) return 'deliverables_due';
    return 'in_progress';
  }
  if (deal.status === 'Payment Pending' && deal.payment_received_date === null) {
    return 'review_pending';
  }
  if (deal.status === 'Completed' || deal.payment_received_date) return 'completed';
  return 'draft';
};

const getPaymentStatus = (deal: BrandDeal): PaymentStatus => {
  if (deal.payment_received_date) return 'paid';
  if (deal.status === 'Payment Pending') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(deal.payment_expected_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today ? 'overdue' : 'pending';
  }
  return 'not_due';
};

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const { profile, loading: sessionLoading, isCreator } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'protection'>('overview');
  const [dealsViewMode, setDealsViewMode] = useState<'deals' | 'payments'>('deals');
  
  // Dialog states
  const [isBrandDealFormOpen, setIsBrandDealFormOpen] = useState(false);
  const [editingBrandDeal, setEditingBrandDeal] = useState<BrandDeal | null>(null);
  const [isAIScanDialogOpen, setIsAIScanDialogOpen] = useState(false);
  const [selectedContractForAIScan, setSelectedContractForAIScan] = useState<string | null>(null);
  const [aiScanResults, setAiScanResults] = useState<any>(null);
  const [isSendPaymentReminderDialogOpen, setIsSendPaymentReminderDialogOpen] = useState(false);
  const [selectedDealForReminder, setSelectedDealForReminder] = useState<BrandDeal | null>(null);
  const [isSendTakedownNoticeDialogOpen, setIsSendTakedownNoticeDialogOpen] = useState(false);
  const [takedownNoticeDetails, setTakedownNoticeDetails] = useState({
    contentUrl: '', platform: '', infringingUrl: '', infringingUser: ''
  });

  // Filter states for deals tab
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  // Fetch data
  const { data: mockDashboardData, isLoading: isLoadingMocks, error: mockError } = useCreatorDashboardData(
    !sessionLoading && isCreator
  );

  const { data: brandDeals, isLoading: isLoadingBrandDeals, error: brandDealsError, refetch: refetchBrandDeals } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !sessionLoading && isCreator && !!profile?.id,
  });

  const scanContractMutation = useAIScanContractReview();
  const sendPaymentReminderMutation = useSendPaymentReminder();
  const sendTakedownNoticeMutation = useSendTakedownNotice();

  // Content protection data
  const { data: originalContentList } = useOriginalContent({
    creatorId: profile?.id,
    enabled: !sessionLoading && isCreator && !!profile?.id,
  });
  const { data: copyrightMatches } = useCopyrightMatches({
    contentId: originalContentList?.[0]?.id,
    enabled: !!originalContentList?.[0]?.id,
  });

  useEffect(() => {
    if (mockError) {
      toast.error('Failed to load creator dashboard data', { description: mockError.message });
    }
    if (brandDealsError) {
      toast.error('Failed to load brand deals', { description: brandDealsError.message });
    }
  }, [mockError, brandDealsError]);

  // Calculate dashboard data
  const dashboardData = useMemo(() => {
    if (!brandDeals) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthEarnings = brandDeals
      .filter(deal => {
        if (!deal.payment_received_date) return false;
        const receivedDate = new Date(deal.payment_received_date);
        return receivedDate.getMonth() === currentMonth && 
               receivedDate.getFullYear() === currentYear &&
               deal.status === 'Completed';
      })
      .reduce((sum, deal) => sum + deal.deal_amount, 0);

    const lastMonthEarnings = brandDeals
      .filter(deal => {
        if (!deal.payment_received_date) return false;
        const receivedDate = new Date(deal.payment_received_date);
        return receivedDate.getMonth() === lastMonth && 
               receivedDate.getFullYear() === lastMonthYear &&
               deal.status === 'Completed';
      })
      .reduce((sum, deal) => sum + deal.deal_amount, 0);

    const urgentActions: Array<{
      type: 'payment_overdue' | 'contract_review' | 'content_stolen';
      title: string;
      amount?: number;
      daysOverdue?: number;
      dueDate?: string;
      brand?: string;
      receivedDays?: number;
      hasRedFlags?: boolean;
      matches?: number;
      topThief?: string;
      views?: number;
      platform?: string;
      dealId?: string;
    }> = [];
    
    const overduePayments = brandDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 0;
    });
    
    overduePayments.forEach(deal => {
      const dueDate = new Date(deal.payment_expected_date);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      urgentActions.push({
        type: 'payment_overdue' as const,
        title: `${deal.brand_name} Payment Overdue`,
        amount: deal.deal_amount,
        daysOverdue,
        dueDate: deal.payment_expected_date,
        brand: deal.brand_name,
        dealId: deal.id,
      });
    });

    const contractsNeedingReview = brandDeals.filter(deal => 
      deal.status === 'Drafting' && deal.contract_file_url
    );
    
    contractsNeedingReview.forEach(deal => {
      const createdDate = new Date(deal.created_at);
      const daysSince = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      urgentActions.push({
        type: 'contract_review' as const,
        title: `${deal.brand_name} Contract Needs Review`,
        receivedDays: daysSince,
        hasRedFlags: true,
        dealId: deal.id,
      });
    });

    const pendingPayments = brandDeals
      .filter(deal => deal.status === 'Payment Pending')
      .reduce((sum, deal) => sum + deal.deal_amount, 0);
    
    const pendingBrandCount = new Set(
      brandDeals
        .filter(deal => deal.status === 'Payment Pending')
        .map(deal => deal.brand_name)
    ).size;

    const oneWeekFromNow = new Date(now);
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    const dueThisWeek = brandDeals
      .filter(deal => {
        if (deal.status !== 'Payment Pending') return false;
        const dueDate = new Date(deal.payment_expected_date);
        return dueDate >= now && dueDate <= oneWeekFromNow;
      })
      .reduce((sum, deal) => sum + deal.deal_amount, 0);
    
    const dueThisWeekCount = brandDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate >= now && dueDate <= oneWeekFromNow;
    }).length;

    const activeCampaigns = brandDeals.filter(deal => 
      deal.status === 'Approved' || deal.status === 'Drafting'
    ).length;

    const deliverablesDue = brandDeals.filter(deal => {
      return deal.status === 'Approved';
    }).length;

    const completedThisMonth = brandDeals.filter(deal => {
      if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
      const receivedDate = new Date(deal.payment_received_date);
      return receivedDate.getMonth() === currentMonth && 
             receivedDate.getFullYear() === currentYear;
    }).length;

    const dealsClosedThisMonth = completedThisMonth;
    const dealsClosedLastMonth = brandDeals.filter(deal => {
      if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
      const receivedDate = new Date(deal.payment_received_date);
      return receivedDate.getMonth() === lastMonth && 
             receivedDate.getFullYear() === lastMonthYear;
    }).length;

    const avgDealValue = completedThisMonth > 0
      ? brandDeals
          .filter(deal => {
            if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
            const receivedDate = new Date(deal.payment_received_date);
            return receivedDate.getMonth() === currentMonth && 
                   receivedDate.getFullYear() === currentYear;
          })
          .reduce((sum, deal) => sum + deal.deal_amount, 0) / completedThisMonth
      : 0;

    const upcomingDeadlines = brandDeals
      .filter(deal => {
        if (deal.status === 'Completed') return false;
        const dueDate = new Date(deal.payment_expected_date);
        return dueDate >= now;
      })
      .slice(0, 3)
      .map(deal => ({
        date: deal.payment_expected_date,
        task: `${deal.brand_name} payment due`,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      earnings: {
        current: currentMonthEarnings || 285700,
        previous: lastMonthEarnings || 255200,
        goal: 350000,
      },
      urgentActions: urgentActions.slice(0, 3),
      moneyOverview: {
        pendingPayments,
        pendingBrandCount,
        dueThisWeek,
        dueThisWeekCount,
        activeCampaigns,
        deliverablesDue,
        completed: completedThisMonth,
        onTimeRate: 100,
      },
      quickStats: {
        dealsClosed: dealsClosedThisMonth || 4,
        dealsChange: dealsClosedThisMonth - dealsClosedLastMonth,
        avgDealValue: Math.round(avgDealValue) || 71425,
        paymentCollectionRate: 92,
        pitchesSent: 2,
        takedownsSuccessful: 8,
      },
      upcomingDeadlines,
    };
  }, [brandDeals]);

  // Filter deals for deals tab
  const filteredDeals = useMemo(() => {
    if (!brandDeals) return [];
    let filtered = [...brandDeals];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(deal => 
        deal.brand_name.toLowerCase().includes(searchLower) ||
        deal.deliverables?.toLowerCase().includes(searchLower)
      );
    }

    if (quickFilter) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      switch (quickFilter) {
        case 'active':
          filtered = filtered.filter(deal => 
            deal.status === 'Approved' || deal.status === 'Drafting'
          );
          break;
        case 'pending_payment':
          filtered = filtered.filter(deal => deal.status === 'Payment Pending');
          break;
        case 'expiring_soon':
          const sevenDaysFromNow = new Date(now);
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
          filtered = filtered.filter(deal => {
            const dueDate = new Date(deal.payment_expected_date);
            return dueDate >= now && dueDate <= sevenDaysFromNow;
          });
          break;
        case 'completed':
          filtered = filtered.filter(deal => deal.status === 'Completed');
          break;
      }
    }

    return filtered;
  }, [brandDeals, searchTerm, quickFilter]);

  // Filter payments for payments tab
  const filteredPayments = useMemo(() => {
    if (!brandDeals) return [];
    let filtered = brandDeals.filter(deal => 
      deal.status === 'Payment Pending' || (deal.status === 'Completed' && deal.payment_received_date)
    );

    if (quickFilter === 'overdue') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      filtered = filtered.filter(deal => {
        if (deal.status !== 'Payment Pending') return false;
        const dueDate = new Date(deal.payment_expected_date);
        return dueDate < now;
      });
    } else if (quickFilter === 'due_this_week') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      filtered = filtered.filter(deal => {
        if (deal.status !== 'Payment Pending') return false;
        const dueDate = new Date(deal.payment_expected_date);
        return dueDate >= now && dueDate <= sevenDaysFromNow;
      });
    } else if (quickFilter === 'paid') {
      filtered = filtered.filter(deal => 
        deal.status === 'Completed' && deal.payment_received_date
      );
    }

    return filtered;
  }, [brandDeals, quickFilter]);

  const handleAddBrandDeal = () => {
    setEditingBrandDeal(null);
    setIsBrandDealFormOpen(true);
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

  if (sessionLoading || isLoadingMocks || isLoadingBrandDeals) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading Creator Dashboard...</p>
      </div>
    );
  }

  if (!mockDashboardData || !dashboardData) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <p className="text-destructive">No dashboard data available.</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-950 text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold">
                N
              </div>
              <div>
                <h1 className="text-lg font-semibold">NoticeBazaar</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Search className="w-5 h-5 text-gray-400" />
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
              </div>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-semibold">
                {profile?.first_name?.[0] || 'U'}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 px-4 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'deals', label: 'Deals & Payments' },
              { id: 'protection', label: 'Protection' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2 text-sm font-medium capitalize whitespace-nowrap transition-colors",
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <div>
                <h1 className="text-2xl font-bold mb-1">
                  Welcome back, <span className="text-blue-400">{profile?.first_name || 'Creator'}</span>!
                </h1>
                <p className="text-gray-400 text-sm">
                  Your comprehensive overview of brand deals, legal protection, and financial health.
                </p>
              </div>

              <HeroEarningsCard
                current={dashboardData.earnings.current}
                previous={dashboardData.earnings.previous}
                goal={dashboardData.earnings.goal}
              />

              <CriticalActions
                actions={dashboardData.urgentActions}
                onSendReminder={(dealId) => {
                  const deal = brandDeals?.find(d => d.id === dealId);
                  if (deal) {
                    setSelectedDealForReminder(deal);
                    setIsSendPaymentReminderDialogOpen(true);
                  }
                }}
                onEscalate={() => toast.info('Escalation feature coming soon!')}
                onAnalyzeContract={(dealId) => {
                  const deal = brandDeals?.find(d => d.id === dealId);
                  if (deal?.contract_file_url) {
                    setSelectedContractForAIScan(deal.contract_file_url);
                    setIsAIScanDialogOpen(true);
                  }
                }}
                onTakeDown={() => setIsSendTakedownNoticeDialogOpen(true)}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CombinedPaymentsCard
                  pendingPayments={dashboardData.moneyOverview.pendingPayments}
                  pendingBrandCount={dashboardData.moneyOverview.pendingBrandCount}
                  dueThisWeek={dashboardData.moneyOverview.dueThisWeek}
                  dueThisWeekCount={dashboardData.moneyOverview.dueThisWeekCount}
                  brandDeals={brandDeals}
                  onSendReminder={(dealId) => {
                    const deal = brandDeals?.find(d => d.id === dealId);
                    if (deal) {
                      setSelectedDealForReminder(deal);
                      setIsSendPaymentReminderDialogOpen(true);
                    }
                  }}
                />
                <MoneyOverview
                  pendingPayments={0}
                  pendingBrandCount={0}
                  dueThisWeek={0}
                  dueThisWeekCount={0}
                  activeCampaigns={dashboardData.moneyOverview.activeCampaigns}
                  deliverablesDue={dashboardData.moneyOverview.deliverablesDue}
                  completed={dashboardData.moneyOverview.completed}
                  onTimeRate={dashboardData.moneyOverview.onTimeRate}
                  brandDeals={brandDeals}
                  onSendReminder={() => {}}
                  onAddCampaign={handleAddBrandDeal}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <QuickStats
                  dealsClosed={dashboardData.quickStats.dealsClosed}
                  dealsChange={dashboardData.quickStats.dealsChange}
                  avgDealValue={dashboardData.quickStats.avgDealValue}
                  paymentCollectionRate={dashboardData.quickStats.paymentCollectionRate}
                  pitchesSent={dashboardData.quickStats.pitchesSent}
                  takedownsSuccessful={dashboardData.quickStats.takedownsSuccessful}
                />
                <UpcomingDeadlines deadlines={dashboardData.upcomingDeadlines} />
              </div>
            </>
          )}

          {/* Deals & Payments Tab */}
          {activeTab === 'deals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Deals & Payments</h2>
                <Button onClick={handleAddBrandDeal} className="bg-blue-600 hover:bg-blue-700">
                  <Briefcase className="w-4 h-4 mr-2" /> Add New Deal
                </Button>
              </div>

              {/* Sub-tabs for Deals vs Payments view */}
              <div className="flex gap-2 border-b border-border/40">
                <button
                  onClick={() => setDealsViewMode('deals')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px]",
                    dealsViewMode === 'deals'
                      ? 'text-blue-400 border-blue-400'
                      : 'text-gray-400 border-transparent hover:text-gray-300'
                  )}
                >
                  Deals ({brandDeals?.length || 0})
                </button>
                <button
                  onClick={() => setDealsViewMode('payments')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px]",
                    dealsViewMode === 'payments'
                      ? 'text-blue-400 border-blue-400'
                      : 'text-gray-400 border-transparent hover:text-gray-300'
                  )}
                >
                  Payments ({filteredPayments.length})
                </button>
              </div>

              {/* Deals View */}
              {dealsViewMode === 'deals' && (
                <>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button
                      onClick={() => setQuickFilter(null)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all",
                        quickFilter === null
                          ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                          : "text-muted-foreground border border-border/30 hover:bg-muted/20"
                      )}
                    >
                      All ({brandDeals?.length || 0})
                    </button>
                    <button
                      onClick={() => setQuickFilter('active')}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all",
                        quickFilter === 'active'
                          ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                          : "text-muted-foreground border border-border/30 hover:bg-muted/20"
                      )}
                    >
                      Active ({brandDeals?.filter(d => d.status === 'Approved' || d.status === 'Drafting').length || 0})
                    </button>
                    <button
                      onClick={() => setQuickFilter('pending_payment')}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all",
                        quickFilter === 'pending_payment'
                          ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                          : "text-muted-foreground border border-border/30 hover:bg-muted/20"
                      )}
                    >
                      Pending Payment ({brandDeals?.filter(d => d.status === 'Payment Pending').length || 0})
                    </button>
                    <button
                      onClick={() => setQuickFilter('completed')}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all",
                        quickFilter === 'completed'
                          ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                          : "text-muted-foreground border border-border/30 hover:bg-muted/20"
                      )}
                    >
                      Completed ({brandDeals?.filter(d => d.status === 'Completed').length || 0})
                    </button>
                  </div>

                  <Input
                    placeholder="Search deals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />

                  <div className="space-y-3">
                    {filteredDeals.length === 0 ? (
                      <Card className="p-8 text-center">
                        <p className="text-gray-400">No deals found</p>
                      </Card>
                    ) : (
                      filteredDeals.map((deal) => {
                        const stage = getDealStage(deal);
                        return (
                          <ProjectDealCard
                            key={deal.id}
                            deal={deal}
                            stage={stage}
                            onView={(d) => navigate(`/creator-contracts/${d.id}`)}
                            onEdit={(d) => {
                              setEditingBrandDeal(d);
                              setIsBrandDealFormOpen(true);
                            }}
                            onManageDeliverables={() => toast.info('Deliverables management coming soon!')}
                            onUploadContent={() => toast.info('Content upload coming soon!')}
                            onContactBrand={() => navigate('/messages')}
                            onViewContract={(d) => {
                              if (d.contract_file_url) {
                                window.open(d.contract_file_url, '_blank');
                              } else {
                                toast.error('Contract file not available');
                              }
                            }}
                          />
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {/* Payments View */}
              {dealsViewMode === 'payments' && (
                <>
                  <FinancialOverviewHeader allDeals={brandDeals || []} />
                  <PaymentQuickFilters
                    allDeals={brandDeals || []}
                    activeFilter={quickFilter}
                    onFilterChange={setQuickFilter}
                  />
                  <div className="space-y-3">
                    {filteredPayments.length === 0 ? (
                      <Card className="p-8 text-center">
                        <p className="text-gray-400">No payments found</p>
                      </Card>
                    ) : (
                      filteredPayments.map((deal) => {
                        const paymentStatus = getPaymentStatus(deal);
                        // Map PaymentStatus to EnhancedPaymentCard status
                        const status: 'overdue' | 'pending' | 'upcoming' | 'paid' = 
                          paymentStatus === 'paid' ? 'paid' :
                          paymentStatus === 'overdue' ? 'overdue' :
                          paymentStatus === 'pending' ? 'pending' : 'upcoming';
                        
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        const dueDate = new Date(deal.payment_expected_date);
                        dueDate.setHours(0, 0, 0, 0);
                        const diffTime = dueDate.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const daysOverdue = diffDays < 0 ? Math.abs(diffDays) : undefined;
                        const daysLeft = diffDays >= 0 ? diffDays : undefined;

                        return (
                          <EnhancedPaymentCard
                            key={deal.id}
                            deal={deal}
                            status={status}
                            daysOverdue={daysOverdue}
                            daysLeft={daysLeft}
                            onSendReminder={(d) => {
                              setSelectedDealForReminder(d);
                              setIsSendPaymentReminderDialogOpen(true);
                            }}
                            onMarkPaid={(d) => toast.info(`Mark ${d.brand_name} as paid coming soon!`)}
                            onViewDetails={(d) => navigate(`/creator-contracts/${d.id}`)}
                          />
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Protection Tab */}
          {activeTab === 'protection' && (
            <div className="space-y-4">
              <ProtectionDashboardHeader 
                originalContent={originalContentList || []}
                matches={copyrightMatches || []}
                scansThisMonth={0}
              />
              <CreatorCopyrightScanner />
            </div>
          )}

        </div>

        <QuickActionsFAB
          onAddDeal={handleAddBrandDeal}
          onLogPayment={() => navigate('/creator-payments')}
          onScanContent={() => setActiveTab('protection')}
          onUploadContract={() => {
            setEditingBrandDeal(null);
            setIsBrandDealFormOpen(true);
          }}
          onCalculateRate={() => navigate('/rate-calculator')}
        />
      </div>

      {/* Dialogs - Same as before */}
      <Dialog open={isBrandDealFormOpen} onOpenChange={setIsBrandDealFormOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card text-foreground border-border h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingBrandDeal ? 'Edit Brand Deal' : 'Add New Brand Deal'}</DialogTitle>
            <DialogDescription>
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

      <Dialog open={isAIScanDialogOpen} onOpenChange={setIsAIScanDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card text-foreground border-border">
          <DialogHeader>
            <DialogTitle>AI Contract Scan</DialogTitle>
            <DialogDescription>Select a contract to analyze for potential risks and insights.</DialogDescription>
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
                  {brandDeals?.filter(deal => deal.contract_file_url).map((deal) => (
                    <SelectItem key={deal.id} value={deal.contract_file_url!}>
                      {deal.brand_name} - {deal.deliverables}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handlePerformAIScan}
              disabled={!selectedContractForAIScan || scanContractMutation.isPending}
              className="w-full"
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
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" /> AI Scan Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  <p className="text-sm text-muted-foreground">{aiScanResults.summary}</p>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIScanDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSendPaymentReminderDialogOpen} onOpenChange={setIsSendPaymentReminderDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border">
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
            <DialogDescription>Select a brand deal to send a payment reminder for.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="selectDealForReminder">Select Deal</Label>
              <Select
                onValueChange={(value) => setSelectedDealForReminder(brandDeals?.find(deal => deal.id === value) || null)}
                value={selectedDealForReminder?.id || ''}
                disabled={sendPaymentReminderMutation.isPending || !brandDeals || brandDeals.length === 0}
              >
                <SelectTrigger id="selectDealForReminder">
                  <SelectValue placeholder="Choose a deal" />
                </SelectTrigger>
                <SelectContent>
                  {brandDeals?.filter(deal => deal.status === 'Payment Pending').map((deal) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.brand_name} - ₹{deal.deal_amount.toLocaleString('en-IN')} (Due: {new Date(deal.payment_expected_date).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSendReminderFromDialog}
              disabled={!selectedDealForReminder || sendPaymentReminderMutation.isPending}
              className="w-full"
            >
              {sendPaymentReminderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                'Send Reminder'
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendPaymentReminderDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSendTakedownNoticeDialogOpen} onOpenChange={setIsSendTakedownNoticeDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card text-foreground border-border">
          <DialogHeader>
            <DialogTitle>Send Takedown Notice</DialogTitle>
            <DialogDescription>Fill in details to send a formal DMCA takedown notice.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="takedownContentUrl">Your Original Content URL *</Label>
              <Input
                id="takedownContentUrl"
                type="url"
                value={takedownNoticeDetails.contentUrl}
                onChange={(e) => setTakedownNoticeDetails(prev => ({ ...prev, contentUrl: e.target.value }))}
                placeholder="e.g., https://youtube.com/watch?v=your_original_video_id"
              />
            </div>
            <div>
              <Label htmlFor="takedownPlatform">Platform of Infringement *</Label>
              <Select
                onValueChange={(value) => setTakedownNoticeDetails(prev => ({ ...prev, platform: value }))}
                value={takedownNoticeDetails.platform}
              >
                <SelectTrigger id="takedownPlatform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {['YouTube', 'Instagram', 'TikTok', 'Facebook', 'Other Web'].map((platform) => (
                    <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="takedownInfringingUrl">Infringing Content URL *</Label>
              <Input
                id="takedownInfringingUrl"
                type="url"
                value={takedownNoticeDetails.infringingUrl}
                onChange={(e) => setTakedownNoticeDetails(prev => ({ ...prev, infringingUrl: e.target.value }))}
                placeholder="e.g., https://youtube.com/watch?v=infringing_video_id"
              />
            </div>
            <Button
              onClick={handleSendTakedownFromDialog}
              disabled={!takedownNoticeDetails.contentUrl.trim() || !takedownNoticeDetails.platform.trim() || !takedownNoticeDetails.infringingUrl.trim() || sendTakedownNoticeMutation.isPending}
              className="w-full"
            >
              {sendTakedownNoticeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                'Send Takedown Notice'
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendTakedownNoticeDialogOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreatorDashboard;
