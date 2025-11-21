"use client";

import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { 
  Search, 
  Loader2,
  Bot,
  Briefcase,
  CheckCircle,
  DollarSign,
  ArrowRight,
  TrendingUp as TrendingUpIcon,
  Bell,
  Menu,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useCreatorDashboardData } from '@/lib/hooks/useCreatorDashboardData';
import ActionCenter from '@/components/creator-dashboard/ActionCenter';
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
import ChatWindow from '@/components/ChatWindow';
import TrialBanner from '@/components/trial/TrialBanner';
import UpgradeModal from '@/components/trial/UpgradeModal';
import { useDashboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { QuickSearch } from '@/components/dashboard/QuickSearch';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';

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

// Pill Tab Button Component - Clean & Organized
const PillTabButton = ({ 
  label, 
  isActive, 
  onClick, 
  count 
}: { 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
  count?: number;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-6 py-3 text-base font-medium transition-all duration-300 border-b-2 border-transparent",
        isActive
          ? "text-white border-white"
          : "text-white/60 hover:text-white/80"
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn(
          "ml-2 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm",
          isActive 
            ? "bg-white/20 text-white border border-white/30" 
            : "bg-white/5 text-white/50 border border-white/10"
        )}>
          {count}
        </span>
      )}
    </button>
  );
};

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, loading: sessionLoading, isCreator, trialStatus } = useSession();
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  
  // URL-based tab navigation
  const validTabs: Array<'overview' | 'deals' | 'payments' | 'protection'> = ['overview', 'deals', 'payments', 'protection'];
  const tabFromUrl = searchParams.get('tab') as 'overview' | 'deals' | 'payments' | 'protection' | null;
  const activeTab = (tabFromUrl && validTabs.includes(tabFromUrl)) ? tabFromUrl : 'overview';
  
  
  const setActiveTab = (tab: 'overview' | 'deals' | 'payments' | 'protection') => {
    setSearchParams({ tab }, { replace: true });
  };
  
  // Sync URL on mount if no tab param or invalid tab
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    // Only set default if there's no tab or an invalid tab
    if (!currentTab || !validTabs.includes(currentTab as any)) {
      setSearchParams({ tab: 'overview' }, { replace: true });
    }
  }, []); // Only run once on mount to set default
  
  // Keyboard shortcuts
  useDashboardShortcuts();
  
  // Handle Cmd+K for quick search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
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
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [messageReceiverId, setMessageReceiverId] = useState<string | null>(null);
  const [messageReceiverName, setMessageReceiverName] = useState<string>('');
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);

  // Filter states for deals tab
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  
  // Filter states for payments tab
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
  const [paymentQuickFilter, setPaymentQuickFilter] = useState<string | null>(null);

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

  // Check if trial is locked and redirect to billing or show modal
  useEffect(() => {
    if (!sessionLoading && profile && trialStatus.trialLocked) {
      // Redirect to billing page if trial is locked
      navigate('/creator-profile?tab=billing', { replace: true });
      setShowExpiredModal(true);
    }
  }, [sessionLoading, profile, trialStatus.trialLocked, navigate]);


  // Demo data for when brandDeals is empty
  const demoBrandDeals: BrandDeal[] = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return [
      {
        id: 'demo-1',
        creator_id: profile?.id || '',
        brand_name: 'Levi\'s',
        platform: 'Instagram',
        deal_amount: 1000,
        status: 'Drafting',
        payment_expected_date: new Date(currentYear, currentMonth, 25).toISOString(),
        created_at: new Date(currentYear, currentMonth, 15).toISOString(),
        deliverables: JSON.stringify([{ type: 'Reel', count: 1 }]),
        due_date: new Date(currentYear, currentMonth, 25).toISOString(),
      },
      {
        id: 'demo-2',
        creator_id: profile?.id || '',
        brand_name: 'Ajio',
        platform: 'Instagram',
        deal_amount: 14500,
        status: 'Payment Pending',
        payment_expected_date: new Date(currentYear, currentMonth, 22).toISOString(),
        created_at: new Date(currentYear, currentMonth - 1, 20).toISOString(),
        deliverables: JSON.stringify([{ type: 'Reel', count: 1 }, { type: 'Stories', count: 3 }]),
      },
      {
        id: 'demo-3',
        creator_id: profile?.id || '',
        brand_name: 'Nike',
        platform: 'YouTube',
        deal_amount: 20000,
        status: 'Payment Pending',
        payment_expected_date: new Date(currentYear, currentMonth, 30).toISOString(),
        created_at: new Date(currentYear, currentMonth - 1, 15).toISOString(),
        deliverables: JSON.stringify([{ type: 'Integration', count: 1 }]),
      },
      {
        id: 'demo-4',
        creator_id: profile?.id || '',
        brand_name: 'Mamaearth',
        platform: 'Instagram',
        deal_amount: 4254,
        status: 'Payment Pending',
        payment_expected_date: new Date(currentYear, currentMonth, 20).toISOString(),
        created_at: new Date(currentYear, currentMonth - 1, 10).toISOString(),
        deliverables: JSON.stringify([{ type: 'Carousel', count: 1 }, { type: 'Stories', count: 1 }]),
      },
      {
        id: 'demo-5',
        creator_id: profile?.id || '',
        brand_name: 'boAt',
        platform: 'Instagram',
        deal_amount: 12000,
        status: 'Payment Pending',
        payment_expected_date: new Date(currentYear, currentMonth - 1, 10).toISOString(), // Overdue
        created_at: new Date(currentYear, currentMonth - 2, 15).toISOString(),
        deliverables: JSON.stringify([{ type: 'Reel', count: 1 }, { type: 'Stories', count: 2 }]),
      },
      {
        id: 'demo-6',
        creator_id: profile?.id || '',
        brand_name: 'Zepto',
        platform: 'Instagram',
        deal_amount: 8500,
        status: 'Payment Pending',
        payment_expected_date: new Date(currentYear, currentMonth + 1, 4).toISOString(),
        created_at: new Date(currentYear, currentMonth - 1, 5).toISOString(),
        deliverables: JSON.stringify([{ type: 'Reel', count: 1 }]),
      },
    ] as BrandDeal[];
  }, [profile?.id]);

  // Calculate dashboard data
  const dashboardData = useMemo(() => {
    // Use demo data if brandDeals is empty or has very few items
    const dealsToUse = (!brandDeals || brandDeals.length < 3) ? demoBrandDeals : brandDeals;
    if (!dealsToUse || dealsToUse.length === 0) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthEarnings = dealsToUse
      .filter(deal => {
        if (!deal.payment_received_date) return false;
        const receivedDate = new Date(deal.payment_received_date);
        return receivedDate.getMonth() === currentMonth && 
               receivedDate.getFullYear() === currentYear &&
               deal.status === 'Completed';
      })
      .reduce((sum, deal) => sum + deal.deal_amount, 0);

    const lastMonthEarnings = dealsToUse
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
      lastReminderSentDays?: number;
    }> = [];
    
    const overduePayments = dealsToUse.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 0;
    });
    
    overduePayments.forEach(deal => {
      const dueDate = new Date(deal.payment_expected_date);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      // Demo: Calculate last reminder sent days (in real app, fetch from payment_reminders table)
      // For demo, assume a reminder was sent 5 days ago if overdue for more than 7 days
      const lastReminderSentDays = daysOverdue > 7 ? 5 : undefined;
      urgentActions.push({
        type: 'payment_overdue' as const,
        title: `${deal.brand_name} Payment Overdue`,
        amount: deal.deal_amount,
        daysOverdue,
        dueDate: deal.payment_expected_date,
        brand: deal.brand_name,
        dealId: deal.id,
        platform: deal.platform || 'N/A',
        lastReminderSentDays,
      });
    });

    const contractsNeedingReview = dealsToUse.filter(deal => 
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

    const pendingPayments = dealsToUse
      .filter(deal => deal.status === 'Payment Pending')
      .reduce((sum, deal) => sum + deal.deal_amount, 0);
    
    const pendingBrandCount = new Set(
      dealsToUse
        .filter(deal => deal.status === 'Payment Pending')
        .map(deal => deal.brand_name)
    ).size;

    const oneWeekFromNow = new Date(now);
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    const dueThisWeek = dealsToUse
      .filter(deal => {
        if (deal.status !== 'Payment Pending') return false;
        const dueDate = new Date(deal.payment_expected_date);
        return dueDate >= now && dueDate <= oneWeekFromNow;
      })
      .reduce((sum, deal) => sum + deal.deal_amount, 0);
    
    const dueThisWeekCount = dealsToUse.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate >= now && dueDate <= oneWeekFromNow;
    }).length;

    const activeCampaigns = dealsToUse.filter(deal => 
      deal.status === 'Approved' || deal.status === 'Drafting'
    ).length;

    const deliverablesDue = dealsToUse.filter(deal => {
      return deal.status === 'Approved';
    }).length;

    const completedThisMonth = dealsToUse.filter(deal => {
      if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
      const receivedDate = new Date(deal.payment_received_date);
      return receivedDate.getMonth() === currentMonth && 
             receivedDate.getFullYear() === currentYear;
    }).length;

    const dealsClosedThisMonth = completedThisMonth;
    const dealsClosedLastMonth = dealsToUse.filter(deal => {
      if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
      const receivedDate = new Date(deal.payment_received_date);
      return receivedDate.getMonth() === lastMonth && 
             receivedDate.getFullYear() === lastMonthYear;
    }).length;

    const         avgDealValue = completedThisMonth > 0
      ? dealsToUse
          .filter(deal => {
            if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
            const receivedDate = new Date(deal.payment_received_date);
            return receivedDate.getMonth() === currentMonth && 
                   receivedDate.getFullYear() === currentYear;
          })
          .reduce((sum, deal) => sum + deal.deal_amount, 0) / completedThisMonth
      : 0;

    const upcomingDeadlines = dealsToUse
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
  }, [brandDeals, demoBrandDeals]);

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

    if (paymentQuickFilter === 'overdue') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      filtered = filtered.filter(deal => {
        if (deal.status !== 'Payment Pending') return false;
        const dueDate = new Date(deal.payment_expected_date);
        return dueDate < now;
      });
    } else if (paymentQuickFilter === 'due_this_week') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      filtered = filtered.filter(deal => {
        if (deal.status !== 'Payment Pending') return false;
        const dueDate = new Date(deal.payment_expected_date);
        return dueDate >= now && dueDate <= sevenDaysFromNow;
      });
    } else if (paymentQuickFilter === 'pending') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      filtered = filtered.filter(deal => {
        if (deal.status !== 'Payment Pending') return false;
        const dueDate = new Date(deal.payment_expected_date);
        return dueDate >= now;
      });
    } else if (paymentQuickFilter === 'paid') {
      filtered = filtered.filter(deal => 
        deal.status === 'Completed' && deal.payment_received_date
      );
    }

    // Apply search filter
    if (paymentSearchTerm) {
      const searchLower = paymentSearchTerm.toLowerCase();
      filtered = filtered.filter(deal => 
        deal.brand_name.toLowerCase().includes(searchLower) ||
        deal.platform?.toLowerCase().includes(searchLower) ||
        deal.deal_amount.toString().includes(searchLower)
      );
    }

    return filtered;
  }, [brandDeals, paymentQuickFilter, paymentSearchTerm]);

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


  const handleCloseMessageDialog = () => {
    setIsMessageDialogOpen(false);
    setMessageReceiverId(null);
    setMessageReceiverName('');
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
      <div className="min-h-screen text-white relative">
        {/* Header removed - now using Navbar from Layout component */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
          {/* Breadcrumbs - Show for non-overview tabs */}
          {activeTab !== 'overview' && (
            <div className="mb-6">
              <Breadcrumbs />
            </div>
          )}
          
          {/* Overview Tab */}
              {activeTab === 'overview' && (
                <>
                  <TrialBanner />

              {/* Hero Section - Liquid Glass */}
              <div className="mb-12">
                <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-semibold mb-2 text-white tracking-tight leading-tight">
                      Hey, {profile?.first_name || 'Creator'}! 👋
                    </h1>
                    <p className="text-base text-white/60">
                      Content Creator
                        </p>
                      </div>
                  </div>

                {/* Liquid Glass Earnings Card */}
                <div className="flex justify-center">
                  <div className="relative w-full max-w-lg">
                    <div className="relative bg-white/[0.08] backdrop-blur-[40px] border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.1] via-transparent to-transparent pointer-events-none" />
                      
                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-white" />
                          </div>
                          <span className="text-sm font-medium text-white/80">Earnings</span>
                        </div>
                        <div className="text-5xl font-semibold text-white mb-3 tracking-tight">
                          ₹{dashboardData?.earnings.current.toLocaleString('en-IN') || '0'}
                        </div>
                        <div className="text-base text-white/60">
                          This Month
                          {dashboardData?.earnings.previous && (
                            <span className="ml-2 text-[#FF4DAA] font-medium">
                              +{Math.round(((dashboardData.earnings.current - dashboardData.earnings.previous) / dashboardData.earnings.previous) * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}


          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Financial Overview Section */}
              <section className="mb-12">
                <h2 className="text-2xl font-semibold text-white mb-6">Financial Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Pending Invoices */}
                  <Card className="bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.08] transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-white/50 mb-2 font-medium">Pending Invoices</p>
                          <p className="text-2xl font-semibold text-white">
                            ₹{dashboardData?.moneyOverview.pendingPayments.toLocaleString('en-IN') || '0'}
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-yellow-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tax Liability */}
                  <Card className="bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.08] transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-white/50 mb-2 font-medium">Tax Liability (Q3)</p>
                          <p className="text-2xl font-semibold text-white">
                            ₹85,000
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-orange-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Recent Activity Section */}
              <section className="mb-12">
                <h2 className="text-2xl font-semibold text-white mb-6">Recent Activity</h2>
                <Card className="bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                  <CardContent className="space-y-4 p-6">
                    {brandDeals && brandDeals.length > 0 ? (
                      <div className="space-y-3">
                        {brandDeals
                          .filter(deal => deal.status === 'Approved' || deal.status === 'Completed')
                          .slice(0, 3)
                          .map((deal) => {
                            const isCompleted = deal.status === 'Completed';
                            const timeAgo = deal.payment_received_date 
                              ? new Date(deal.payment_received_date)
                              : new Date(deal.created_at);
                            const hoursAgo = Math.floor((Date.now() - timeAgo.getTime()) / (1000 * 60 * 60));
                            
                            return (
                              <div key={deal.id} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all border border-white/10">
                                <div className="h-10 w-10 rounded-xl bg-green-500/20 backdrop-blur-sm flex items-center justify-center border border-green-500/30">
                                  <CheckCircle className="h-5 w-5 text-green-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-white">
                                    {deal.brand_name} collaboration agreement
                                  </p>
                                  <p className="text-xs text-white/60">
                                    {isCompleted ? 'Approved' : 'Contract Reviewed'} • {hoursAgo} hours ago
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Demo Activity Items */}
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all border border-white/10">
                          <div className="h-10 w-10 rounded-xl bg-green-500/20 backdrop-blur-sm flex items-center justify-center border border-green-500/30">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              Mamaearth collaboration agreement
                            </p>
                            <p className="text-xs text-white/60">
                              Approved • 2 hours ago
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all border border-white/10">
                          <div className="h-10 w-10 rounded-xl bg-blue-500/20 backdrop-blur-sm flex items-center justify-center border border-blue-500/30">
                            <Briefcase className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              boAt brand deal signed
                            </p>
                            <p className="text-xs text-white/60">
                              Contract Reviewed • 5 hours ago
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all border border-white/10">
                          <div className="h-10 w-10 rounded-xl bg-purple-500/20 backdrop-blur-sm flex items-center justify-center border border-purple-500/30">
                            <DollarSign className="h-5 w-5 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              Payment received from Zepto
                            </p>
                            <p className="text-xs text-white/60">
                              Completed • 1 day ago
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Actions & Alerts */}
              <section className="mb-12">
                <h2 className="text-2xl font-semibold text-white mb-6">Actions & Alerts</h2>
                  <ErrorBoundary>
                  <div className="rounded-2xl overflow-hidden">
                    <ActionCenter
                      urgentActions={dashboardData.urgentActions || []}
                      brandDeals={brandDeals}
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
                    />
                  </div>
                  </ErrorBoundary>
                </section>

              {/* More Insights */}
              <section className="mb-12">
                <h2 className="text-2xl font-semibold text-white mb-6">More Insights</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Analytics & Performance */}
                  <Card 
                    variant="default" 
                    interactive
                    onClick={() => navigate('/insights')}
                    className="cursor-pointer bg-white/[0.06] backdrop-blur-[40px] border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[#FF4DAA]/20 backdrop-blur-sm border border-[#FF4DAA]/30">
                          <TrendingUpIcon className="h-6 w-6 text-[#FF4DAA]" />
                </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-white mb-1">Analytics & Performance</h3>
                          <p className="text-sm text-white/50">Weekly performance, projections, goals</p>
                </div>
                        <ArrowRight className="h-5 w-5 text-white/40" />
                </div>
                    </CardContent>
                  </Card>

                  {/* Payments & Recovery */}
                  <Card 
                    variant="default" 
                    interactive
                    onClick={() => navigate('/creator-payments')}
                    className="cursor-pointer bg-white/[0.06] backdrop-blur-[40px] border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-green-500/20 backdrop-blur-sm border border-green-500/30">
                          <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-white mb-1">Payments & Recovery</h3>
                          <p className="text-sm text-white/50">Track payments, send reminders</p>
                    </div>
                        <ArrowRight className="h-5 w-5 text-white/40" />
                  </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* ============================================ */}
              {/* FOOTER */}
              {/* ============================================ */}
              <footer className="mt-6 pb-6 text-center">
                <p className="text-[10px] sm:text-xs text-white/30">
                  Powered by NoticeBazaar • Secure Legal Portal ©2025
                </p>
              </footer>
            </>
          )}

          {/* Deals Tab */}
          {activeTab === 'deals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Deals</h2>
                <Button 
                  onClick={handleAddBrandDeal} 
                  className="bg-white/20 backdrop-blur-[20px] border border-white/30 text-white hover:bg-white/30 active:scale-[0.98] rounded-2xl px-6 py-3 font-medium shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-200"
                >
                  <Briefcase className="w-4 h-4 mr-2" /> Add New Deal
                </Button>
              </div>

              <div className="flex gap-3 flex-wrap">
                <PillTabButton
                  label="All"
                  isActive={quickFilter === null}
                  onClick={() => setQuickFilter(null)}
                  count={brandDeals?.length || 0}
                />
                <PillTabButton
                  label="Active"
                  isActive={quickFilter === 'active'}
                  onClick={() => setQuickFilter('active')}
                  count={brandDeals?.filter(d => d.status === 'Approved' || d.status === 'Drafting').length || 0}
                />
                <PillTabButton
                  label="Pending Payment"
                  isActive={quickFilter === 'pending_payment'}
                  onClick={() => setQuickFilter('pending_payment')}
                  count={brandDeals?.filter(d => d.status === 'Payment Pending').length || 0}
                />
                <PillTabButton
                  label="Completed"
                  isActive={quickFilter === 'completed'}
                  onClick={() => setQuickFilter('completed')}
                  count={brandDeals?.filter(d => d.status === 'Completed').length || 0}
                />
              </div>

              <Input
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md bg-white/5 backdrop-blur-[20px] border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:bg-white/8 rounded-2xl px-4 py-3 transition-all duration-200"
              />

              <div className="space-y-3">
                {filteredDeals.length === 0 ? (
                  <Card className="p-8 text-center bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                    <p className="text-white/50">No deals found</p>
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
                        onViewContract={async (d) => {
                          const { openContractFile } = await import('@/lib/utils');
                          openContractFile(d.contract_file_url, (error) => {
                            toast.error(error);
                          });
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4 relative min-h-[600px]">
              <div className="relative z-10 space-y-4">
              {/* Summary Cards */}
              <FinancialOverviewHeader allDeals={brandDeals || []} />

              {/* Payments Title */}
              <h2 className="text-lg md:text-xl font-bold mt-2">Payments</h2>

              {/* Filters */}
              <PaymentQuickFilters
                allDeals={brandDeals || []}
                activeFilter={paymentQuickFilter}
                onFilterChange={setPaymentQuickFilter}
              />

              {/* Search Bar */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                <Input
                  placeholder="Search payments..."
                  value={paymentSearchTerm}
                  onChange={(e) => setPaymentSearchTerm(e.target.value)}
                  className="pl-10 rounded-2xl bg-white/5 backdrop-blur-[20px] border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:bg-white/8 transition-all duration-200"
                />
              </div>

              {/* Payments List Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                <div className="text-xs text-white/60 tracking-wide">Payments List — {filteredPayments.length} items</div>
                <div className="px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-xs text-white/50">
                  Sort: Due date
                </div>
              </div>

              {/* Payments List */}
              <div className="space-y-4">
                {filteredPayments.length === 0 ? (
                  <Card className="p-8 text-center bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                    <p className="text-white/60">No payments found</p>
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
              </div>
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

      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={handleCloseMessageDialog}>
        <DialogContent 
          className="sm:max-w-[600px] h-[80vh] flex flex-col bg-card text-foreground border-border"
          aria-labelledby="send-message-title"
          aria-describedby="send-message-description"
        >
          <DialogHeader>
            <DialogTitle id="send-message-title">Send Message</DialogTitle>
            <DialogDescription id="send-message-description" className="text-muted-foreground">
              Start a secure conversation with {messageReceiverName}.
            </DialogDescription>
          </DialogHeader>
          {messageReceiverId && (
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                receiverId={messageReceiverId}
                receiverName={messageReceiverName}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Trial Expired Modal */}
      <UpgradeModal
        open={showExpiredModal}
        onOpenChange={setShowExpiredModal}
        reason="trial_expired"
      />

      {/* Quick Search Modal - Controlled by Cmd+K */}
      <QuickSearch
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        onSelect={(result) => {
          if (result.type === 'deal') {
            navigate(`/creator-contracts/${result.id}`);
          } else if (result.type === 'payment') {
            navigate('/creator-payments');
          }
          setIsQuickSearchOpen(false);
        }}
      />
    </>
  );
};

export default CreatorDashboard;
