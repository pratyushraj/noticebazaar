

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Search, Briefcase, CheckCircle, DollarSign, Calendar, AlertTriangle, FileText, Link2 } from 'lucide-react';
import ProfileCompletionCard from '@/components/creator-dashboard/ProfileCompletionCard';
import ActionCenter from '@/components/creator-dashboard/ActionCenter';
import QuickActionsFAB from '@/components/creator-dashboard/QuickActionsFAB';
import { Card, CardContent } from '@/components/ui/card';
import { BrandDeal } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ProjectDealCard from '@/components/creator-contracts/ProjectDealCard';
import { DealStage } from '@/components/creator-contracts/DealStatusBadge';
import { PaymentStatus } from '@/components/payments/PaymentStatusChip';
import EnhancedPaymentCard from '@/components/payments/EnhancedPaymentCard';
import FinancialOverviewHeader from '@/components/payments/FinancialOverviewHeader';
import PaymentQuickFilters from '@/components/payments/PaymentQuickFilters';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import ProtectionDashboardHeader from '@/components/content-protection/ProtectionDashboardHeader';
import SimplifiedScanner from '@/components/content-protection/SimplifiedScanner';
import ScanHistory from '@/components/content-protection/ScanHistory';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/navbar/Navbar';
import CreatorBottomNav from '@/components/creator-dashboard/CreatorBottomNav';
import { useSidebar } from '@/contexts/SidebarContext';
import { toast } from 'sonner';

import CountUp from 'react-countup';
// New UI features
import MoneyRain from '@/components/celebrations/MoneyRain';
import EarningsHeatmap from '@/components/earnings/EarningsHeatmap';
import TaxSeasonMonster from '@/components/tax/TaxSeasonMonster';
import CreatorScoreBadge from '@/components/creator/CreatorScoreBadge';
import ForexTicker from '@/components/forex/ForexTicker';
import NightOwlBadge from '@/components/achievements/NightOwlBadge';
import DealStreakCounter from '@/components/deals/DealStreakCounter';
import TopBrandsCarousel from '@/components/brands/TopBrandsCarousel';
import ExportMonthlyReport from '@/components/reports/ExportMonthlyReport';
import DealKanban from '@/components/deals/DealKanban';
import { usePratyushMode, PratyushModeOverlay } from '@/components/easter-egg/PratyushMode';

// Helper functions - use canonical status mapping
import { getDealStageFromStatus } from '@/lib/hooks/useBrandDeals';

const getDealStage = (deal: BrandDeal): DealStage => {
  return getDealStageFromStatus(deal.status, deal.progress_percentage);
};

const getPaymentStatus = (deal: BrandDeal): PaymentStatus => {
  if (deal.payment_received_date) return 'received';
  if (deal.status === 'Payment Pending') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(deal.payment_expected_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today ? 'overdue' : 'pending';
  }
  return 'pending';
};

// Pill Tab Button Component
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
    <button type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-info text-foreground shadow-lg shadow-blue-500/30"
          : "bg-card text-foreground/70 hover:bg-secondary/50 hover:text-foreground"
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn(
          "ml-2 px-2 py-0.5 rounded-full text-xs",
          isActive ? "bg-secondary/20" : "bg-secondary/50"
        )}>
          {count}
        </span>
      )}
    </button>
  );
};

const CreatorDashboardPreview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { setIsOpen } = useSidebar();
  
  // Open sidebar by default on desktop
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsOpen(true);
    }
  }, [setIsOpen]);
  
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
    if (!currentTab || !validTabs.includes(currentTab as any)) {
      setSearchParams({ tab: 'overview' }, { replace: true });
    }
  }, []);

  // Filter states for deals tab
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  
  // Filter states for payments tab
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
  const [paymentQuickFilter, setPaymentQuickFilter] = useState<string | null>(null);
  const [dealsView, setDealsView] = useState<'list' | 'kanban'>('list');
  
  // Pratyush mode
  const { isActive: isPratyushMode } = usePratyushMode();
  
  // Demo brand deals data
  const demoBrandDeals: BrandDeal[] = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const baseDeal = {
      creator_id: 'creator-vibe',
      organization_id: 'demo-org',
      brand_email: null,
      contact_person: null,
      contract_file_url: null,
      invoice_file_url: null,
      updated_at: null,
      utr_number: null,
    };
    
    return [
      {
        ...baseDeal,
        id: 'demo-1',
        brand_name: 'Levi\'s',
        platform: 'Instagram',
        deal_amount: 1000,
        status: 'Drafting',
        payment_expected_date: new Date(currentYear, currentMonth, 25).toISOString(),
        created_at: new Date(currentYear, currentMonth, 15).toISOString(),
        deliverables: JSON.stringify([{ type: 'Reel', count: 1 }]),
        due_date: new Date(currentYear, currentMonth, 25).toISOString(),
        payment_received_date: null,
      },
      {
        ...baseDeal,
        id: 'demo-2',
        brand_name: 'Ajio',
        platform: 'Instagram',
        deal_amount: 14500,
        status: 'Payment Pending',
        payment_expected_date: new Date(currentYear, currentMonth, 22).toISOString(),
        created_at: new Date(currentYear, currentMonth - 1, 20).toISOString(),
        deliverables: JSON.stringify([{ type: 'Reel', count: 1 }, { type: 'Stories', count: 3 }]),
        due_date: new Date(currentYear, currentMonth, 22).toISOString(),
        payment_received_date: null,
      },
      {
        ...baseDeal,
        id: 'demo-3',
        brand_name: 'Nike',
        platform: 'YouTube',
        deal_amount: 20000,
        status: 'Payment Pending',
        payment_expected_date: new Date(currentYear, currentMonth, 30).toISOString(),
        created_at: new Date(currentYear, currentMonth - 1, 15).toISOString(),
        deliverables: JSON.stringify([{ type: 'Integration', count: 1 }]),
        due_date: new Date(currentYear, currentMonth, 30).toISOString(),
        payment_received_date: null,
      },
      {
        ...baseDeal,
        id: 'demo-4',
        brand_name: 'Mamaearth',
        platform: 'Instagram',
        deal_amount: 4254,
        status: 'Payment Pending',
        payment_expected_date: new Date(currentYear, currentMonth, 20).toISOString(),
        created_at: new Date(currentYear, currentMonth - 1, 10).toISOString(),
        deliverables: JSON.stringify([{ type: 'Carousel', count: 1 }, { type: 'Stories', count: 1 }]),
        due_date: new Date(currentYear, currentMonth, 20).toISOString(),
        payment_received_date: null,
      },
      {
        ...baseDeal,
        id: 'demo-5',
        brand_name: 'boAt',
        platform: 'Instagram',
        deal_amount: 12000,
        status: 'Payment Pending',
        payment_expected_date: new Date(currentYear, currentMonth - 1, 10).toISOString(), // Overdue
        created_at: new Date(currentYear, currentMonth - 2, 15).toISOString(),
        deliverables: JSON.stringify([{ type: 'Reel', count: 1 }, { type: 'Stories', count: 2 }]),
        due_date: new Date(currentYear, currentMonth - 1, 10).toISOString(),
        payment_received_date: null,
      },
      {
        ...baseDeal,
        id: 'demo-6',
        brand_name: 'Zepto',
        platform: 'Instagram',
        deal_amount: 8500,
        status: 'Completed',
        payment_expected_date: new Date(currentYear, currentMonth + 1, 4).toISOString(),
        created_at: new Date(currentYear, currentMonth - 1, 5).toISOString(),
        deliverables: JSON.stringify([{ type: 'Reel', count: 1 }]),
        due_date: new Date(currentYear, currentMonth + 1, 4).toISOString(),
        payment_received_date: new Date(currentYear, currentMonth, 5).toISOString(),
      },
      {
        ...baseDeal,
        id: 'demo-7',
        brand_name: 'L\'Oreal',
        platform: 'Instagram',
        deal_amount: 25000,
        status: 'Completed',
        payment_expected_date: new Date(currentYear, currentMonth, 10).toISOString(),
        created_at: new Date(currentYear, currentMonth - 1, 1).toISOString(),
        deliverables: JSON.stringify([{ type: 'Reel', count: 2 }, { type: 'Stories', count: 3 }]),
        due_date: new Date(currentYear, currentMonth, 10).toISOString(),
        payment_received_date: new Date(currentYear, currentMonth, 8).toISOString(),
      },
    ] as BrandDeal[];
  }, []);

  // Calculate lifetime earnings
  const lifetimeEarnings = useMemo(() => {
    return demoBrandDeals
      .filter(deal => deal.status === 'Completed' && deal.payment_received_date)
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);
  }, [demoBrandDeals]);

  // Calculate dashboard data
  const dashboardData = useMemo(() => {
    const dealsToUse = demoBrandDeals;
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
               (deal.status === 'Completed' || deal.status === 'Approved');
      })
      .reduce((sum, deal) => sum + deal.deal_amount, 0) || 33500; // Fallback to demo earnings

    const lastMonthEarnings = dealsToUse
      .filter(deal => {
        if (!deal.payment_received_date) return false;
        const receivedDate = new Date(deal.payment_received_date);
        return receivedDate.getMonth() === lastMonth && 
               receivedDate.getFullYear() === lastMonthYear &&
               (deal.status === 'Completed' || deal.status === 'Approved');
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
      if (!deal.payment_expected_date || deal.payment_received_date) return false;
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate < now;
    });

    overduePayments.forEach(deal => {
      const dueDate = new Date(deal.payment_expected_date);
      const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      urgentActions.push({
        type: 'payment_overdue',
        title: `${deal.brand_name} payment overdue`,
        amount: deal.deal_amount,
        daysOverdue,
        dueDate: deal.payment_expected_date,
        brand: deal.brand_name,
        dealId: deal.id,
      });
    });

    const pendingPayments = dealsToUse
      .filter(deal => deal.status === 'Payment Pending' && !deal.payment_received_date)
      .reduce((sum, deal) => sum + deal.deal_amount, 0);

    return {
      earnings: {
        current: currentMonthEarnings,
        previous: lastMonthEarnings,
      },
      moneyOverview: {
        pendingPayments,
        overduePayments: overduePayments.reduce((sum, deal) => sum + deal.deal_amount, 0),
      },
      urgentActions,
    };
  }, [demoBrandDeals]);

  // Filter deals
  const filteredDeals = useMemo(() => {
    let filtered = demoBrandDeals;

    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (deal.platform && deal.platform.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (quickFilter === 'overdue') {
      filtered = filtered.filter(deal => {
        if (!deal.payment_expected_date || deal.payment_received_date) return false;
        return new Date(deal.payment_expected_date) < new Date();
      });
    } else if (quickFilter === 'pending') {
      filtered = filtered.filter(deal => deal.status === 'Payment Pending');
    } else if (quickFilter === 'approved') {
      filtered = filtered.filter(deal => deal.status === 'Approved');
    }

    return filtered;
  }, [demoBrandDeals, searchTerm, quickFilter]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    let filtered = demoBrandDeals.filter(deal => 
      deal.status === 'Payment Pending' || deal.status === 'Approved'
    );

    if (paymentSearchTerm) {
      filtered = filtered.filter(deal =>
        deal.brand_name.toLowerCase().includes(paymentSearchTerm.toLowerCase())
      );
    }

    if (paymentQuickFilter === 'overdue') {
      filtered = filtered.filter(deal => {
        if (!deal.payment_expected_date || deal.payment_received_date) return false;
        return new Date(deal.payment_expected_date) < new Date();
      });
    } else if (paymentQuickFilter === 'pending') {
      filtered = filtered.filter(deal => !deal.payment_received_date);
    } else if (paymentQuickFilter === 'paid') {
      filtered = filtered.filter(deal => !!deal.payment_received_date);
    }

    return filtered;
  }, [demoBrandDeals, paymentSearchTerm, paymentQuickFilter]);

  if (!dashboardData || !demoBrandDeals || demoBrandDeals.length === 0) {
    return (
      <div className="nb-screen-height flex items-center justify-center">
        <div className="text-foreground/60">Loading preview...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <MoneyRain lifetimeEarnings={lifetimeEarnings} />
      <PratyushModeOverlay isActive={isPratyushMode} />
      <div className="relative nb-screen-height overflow-hidden">
        {/* Animated gradient background */}
        <div className="fixed inset-0 animate-gradient-shift" />
        
        {/* Subtle animated orbs for depth */}
        <div className="fixed top-20 left-1/4 w-[500px] h-[500px] bg-info/5 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div 
          className="fixed bottom-20 right-1/4 w-[500px] h-[500px] bg-card rounded-full blur-3xl animate-pulse pointer-events-none" 
          style={{ animationDelay: '2s' }} 
        />
        
        <div className="relative z-10 flex flex-col nb-screen-height">
          {/* Navbar */}
          <Navbar />
          
          <div className="flex flex-1">
            {/* Sidebar */}
            <Sidebar profileRole="creator" />
            
            {/* Main Content */}
            <main className="flex-1 w-full py-6 px-4 md:px-6 lg:px-8 pb-20 md:pb-24 transition-all duration-300 ease-in-out">
              <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs - Show for non-overview tabs */}
          {activeTab !== 'overview' && (
            <div className="mb-6">
              <Breadcrumbs />
            </div>
          )}
          
          {/* Tab Navigation */}
          <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
            <PillTabButton
              label="Overview"
              isActive={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <PillTabButton
              label="Deals"
              isActive={activeTab === 'deals'}
              onClick={() => setActiveTab('deals')}
              count={demoBrandDeals.length}
            />
            <PillTabButton
              label="Payments"
              isActive={activeTab === 'payments'}
              onClick={() => setActiveTab('payments')}
              count={filteredPayments.length}
            />
            <PillTabButton
              label="Protection"
              isActive={activeTab === 'protection'}
              onClick={() => setActiveTab('protection')}
            />
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <TaxSeasonMonster />
              {/* Hero Section - Liquid Glass */}
              <div className="mb-12">
                <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-semibold mb-2 text-foreground tracking-tight leading-tight">
                      Hey, Creator! 👋
                    </h1>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-base text-foreground/60">
                        Content Creator
                      </p>
                      <NightOwlBadge />
                      <DealStreakCounter brandDeals={demoBrandDeals} />
                    </div>
                  </div>
                </div>

                {/* Earnings Card */}
                <div className="flex justify-center">
                  <div className="relative w-full max-w-lg">
                    <div className="relative bg-secondary/[0.08] backdrop-blur-[40px] border border-border rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.1] via-transparent to-transparent pointer-events-none" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-12 w-12 rounded-2xl bg-secondary/50 backdrop-blur-sm border border-border flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground/80">Earnings</span>
                        </div>
                        <div className="text-5xl font-semibold text-foreground mb-3 tracking-tight">
                          <CountUp
                            start={0}
                            end={dashboardData.earnings.current}
                            duration={1.8}
                            separator=","
                            prefix="₹"
                            decimals={0}
                          />
                        </div>
                        <div className="text-base text-foreground/60">
                          This Month
                          {dashboardData.earnings.previous > 0 && (
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

                {/* Financial Overview Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-6">Your Financial Overview</h2>
              <Card className="bg-secondary/[0.06] backdrop-blur-[40px] border-border rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-foreground/50 mb-2 font-medium">Total Earnings</p>
                      <p className="text-2xl font-semibold text-foreground">₹0.00</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-green-500/20 backdrop-blur-sm border border-green-500/30 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-400" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-foreground/70">
                    <p>Complete your profile and share your link to start earning!</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li><CheckCircle className="inline-block h-4 w-4 mr-1 text-green-500" /> Create your Collab Link</li>
                      <li><CheckCircle className="inline-block h-4 w-4 mr-1 text-gray-400" /> Complete your profile (Niche, Portfolio, etc.)</li>
                      <li><CheckCircle className="inline-block h-4 w-4 mr-1 text-gray-400" /> Share your link with brands</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Profile Completion Card */}
            <ProfileCompletionCard />

            {/* Recent Activity Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-6">Recent Activity</h2>
              <Card className="bg-secondary/[0.06] backdrop-blur-[40px] border-border rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2 bg-card rounded-2xl p-2 border border-border/5">
                    <div className={cn("flex items-center gap-3 flex-wrap p-3 rounded-xl transition-all hover:bg-card", "border-b border-border/5")}>
                      <div className="h-10 w-10 rounded-xl bg-green-500/20 backdrop-blur-sm flex items-center justify-center border border-green-500/30">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Mamaearth collaboration agreement</p>
                        <p className="text-xs text-foreground/60">Approved • 2 hours ago</p>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-3 flex-wrap p-3 rounded-xl transition-all hover:bg-card", "border-b border-border/5")}>
                      <div className="h-10 w-10 rounded-xl bg-info/20 backdrop-blur-sm flex items-center justify-center border border-info/30">
                        <Briefcase className="h-5 w-5 text-info" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">boAt brand deal signed</p>
                        <p className="text-xs text-foreground/60">Contract Reviewed • 5 hours ago</p>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-3 flex-wrap p-3 rounded-xl transition-all hover:bg-card", "border-b border-border/5")}>
                      <div className="h-10 w-10 rounded-xl bg-secondary/20 backdrop-blur-sm flex items-center justify-center border border-purple-500/30">
                        <DollarSign className="h-5 w-5 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Payment received from Zepto</p>
                        <p className="text-xs text-foreground/60">Completed • 1 day ago</p>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-3 flex-wrap p-3 rounded-xl transition-all hover:bg-card")}>
                      <div className="h-10 w-10 rounded-xl bg-yellow-500/20 backdrop-blur-sm flex items-center justify-center border border-yellow-500/30">
                        <FileText className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Contract draft sent to L'Oreal</p>
                        <p className="text-xs text-foreground/60">Pending Review • 3 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Actions & Alerts */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-6">Actions & Alerts</h2>
              <div className="rounded-2xl overflow-hidden">
                <ActionCenter
                  urgentActions={dashboardData.urgentActions || []}
                  brandDeals={demoBrandDeals}
                  onSendReminder={(dealId) => {
                    toast.info('Payment reminder feature available after sign in');
                  }}
                  onEscalate={() => {
                    toast.info('Escalation feature available after sign in');
                  }}
                  onAnalyzeContract={(dealId) => {
                    toast.info('AI contract analysis available after sign in');
                  }}
                />
              </div>
            </section>

            {/* New UI Features */}
            <section aria-labelledby="creator-score-heading" className="mb-12">
              <h2 id="creator-score-heading" className="sr-only">Creator Score</h2>
              <CreatorScoreBadge 
                brandDeals={demoBrandDeals}
                protectionScore={85}
                taxFiled={false}
              />
            </section>

            <section aria-labelledby="earnings-heatmap-heading" className="mb-12">
              <h2 id="earnings-heatmap-heading" className="sr-only">Earnings Heatmap</h2>
              <EarningsHeatmap brandDeals={demoBrandDeals} />
            </section>

            <section aria-labelledby="top-brands-heading" className="mb-12">
              <h2 id="top-brands-heading" className="sr-only">Top Brands</h2>
              <TopBrandsCarousel brandDeals={demoBrandDeals} />
            </section>

            <section aria-labelledby="forex-ticker-heading" className="mb-12">
              <h2 id="forex-ticker-heading" className="sr-only">Forex Ticker</h2>
              <ForexTicker brandDeals={demoBrandDeals} />
            </section>
            </>
          )}

          {/* Deals Tab Content */}
          {activeTab === 'deals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-2xl font-semibold text-foreground">All Brand Deals</h2>
              <Button
                onClick={() => setDealsView(prev => prev === 'list' ? 'kanban' : 'list')}
                variant="outline"
                className="bg-card border-border text-foreground hover:bg-secondary/50"
              >
                {dealsView === 'list' ? 'Kanban View' : 'List View'}
              </Button>
            </div>
            
            {dealsView === 'kanban' ? (
              <DealKanban 
                brandDeals={demoBrandDeals}
                onDealUpdate={async () => {
                  toast.info('Deal updates available after sign in');
                }}
              />
            ) : (
              <>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                  <Input
                    placeholder="Search deals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-card text-foreground border-border placeholder:text-foreground/40"
                  />
                </div>
              </div>
              <Select value={quickFilter || 'all'} onValueChange={(value) => setQuickFilter(value === 'all' ? null : value)}>
                <SelectTrigger className="w-[180px] bg-card text-foreground border-border">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/5 text-foreground">
                  <SelectItem value="all">All Deals</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Deals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDeals.map((deal) => (
                <ProjectDealCard
                  key={deal.id}
                  deal={deal}
                  stage={getDealStage(deal)}
                  onView={() => {}}
                  onEdit={() => {}}
                  onManageDeliverables={() => {}}
                  onUploadContent={() => {}}
                  onContactBrand={() => {}}
                  onViewContract={() => {}}
                />
              ))}
            </div>
              </>
            )}
          </div>
          )}

          {/* Payments Tab Content */}
          {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div className="flex-1">
                <FinancialOverviewHeader allDeals={demoBrandDeals} />
              </div>
              <ExportMonthlyReport
                brandDeals={demoBrandDeals}
                earnings={dashboardData.earnings.current}
                month={new Date().toLocaleString('en-IN', { month: 'long' })}
                year={new Date().getFullYear()}
              />
            </div>
            
            {/* Payments Title */}
            <h2 className="text-lg md:text-xl font-bold mt-2 text-foreground">Payments</h2>

            {/* Filters */}
            <PaymentQuickFilters
              allDeals={demoBrandDeals}
              activeFilter={paymentQuickFilter}
              onFilterChange={setPaymentQuickFilter}
            />

            {/* Search Bar */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <Input
                  placeholder="Search payments..."
                  value={paymentSearchTerm}
                  onChange={(e) => setPaymentSearchTerm(e.target.value)}
                  className="pl-9 bg-card text-foreground border-border placeholder:text-foreground/40"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredPayments.map((deal) => {
                const paymentStatus = getPaymentStatus(deal);
                const now = new Date();
                const dueDate = deal.payment_expected_date ? new Date(deal.payment_expected_date) : null;
                const daysOverdue = dueDate && dueDate < now ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined;
                const daysLeft = dueDate && dueDate > now ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : undefined;
                
                let status: 'overdue' | 'pending' | 'upcoming' | 'paid' = 'pending';
                if (paymentStatus === 'received') {
                  status = 'paid';
                } else if (paymentStatus === 'overdue') {
                  status = 'overdue';
                } else if (paymentStatus === 'pending') {
                  status = daysLeft && daysLeft <= 7 ? 'upcoming' : 'pending';
                }
                
                return (
                  <EnhancedPaymentCard
                    key={deal.id}
                    deal={deal}
                    status={status}
                    daysOverdue={daysOverdue}
                    daysLeft={daysLeft}
                    onSendReminder={() => {}}
                    onMarkPaid={() => {}}
                  />
                );
              })}
            </div>
          </div>
          )}

          {/* Protection Tab Content */}
          {activeTab === 'protection' && (
          <div className="space-y-6">
            <ProtectionDashboardHeader
              originalContent={[]}
              matches={[]}
              scansThisMonth={0}
            />
            
            <SimplifiedScanner
              onScan={() => {
                toast.info('Content scanning available after sign in');
              }}
              isScanning={false}
            />
            
            <ScanHistory scans={[]} />
            
            <Card className="bg-secondary/[0.06] backdrop-blur-[40px] border-border rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <p className="text-foreground/60 mb-4">
                    Register your content to start protecting it from copyright violations.
                  </p>
                  <Button
                    onClick={() => {
                      toast.info('Content registration available after sign in');
                    }}
                    className="bg-info hover:bg-info text-foreground"
                  >
                    Register New Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
          
          {/* Quick Actions FAB */}
          <QuickActionsFAB />
          
          {/* Footer */}
          <footer className="mt-6 pb-6 text-center">
            <p className="text-[10px] sm:text-xs text-foreground/30">
              Powered by Creator Armour • Secure Legal Portal ©2025
            </p>
          </footer>
              </div>
            </main>
            
            {/* Bottom Navigation - Primary navigation for creators (all screen sizes) */}
            <CreatorBottomNav />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CreatorDashboardPreview;
