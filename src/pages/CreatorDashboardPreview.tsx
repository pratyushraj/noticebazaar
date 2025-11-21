"use client";

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Briefcase,
  CheckCircle,
  DollarSign,
  Calendar,
  AlertTriangle,
  FileText,
  Info
} from 'lucide-react';
import ActionCenter from '@/components/creator-dashboard/ActionCenter';
import { Card, CardContent } from '@/components/ui/card';
import { BrandDeal } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ProjectDealCard from '@/components/creator-contracts/ProjectDealCard';
import { DealStage, PaymentStatus } from '@/components/creator-contracts/DealStatusBadge';
import EnhancedPaymentCard from '@/components/payments/EnhancedPaymentCard';
import FinancialOverviewHeader from '@/components/payments/FinancialOverviewHeader';
import PaymentQuickFilters from '@/components/payments/PaymentQuickFilters';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { Link } from 'react-router-dom';

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
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
          : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn(
          "ml-2 px-2 py-0.5 rounded-full text-xs",
          isActive ? "bg-white/20" : "bg-white/10"
        )}>
          {count}
        </span>
      )}
    </button>
  );
};

const CreatorDashboardPreview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
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

  // Demo brand deals data
  const demoBrandDeals: BrandDeal[] = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const baseDeal = {
      creator_id: 'demo-creator',
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
      .reduce((sum, deal) => sum + deal.deal_amount, 0);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Loading preview...</div>
      </div>
    );
  }

  return (
    <>
      {/* Preview Banner */}
      <div className="bg-blue-500/20 border-b border-blue-500/30 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Info className="h-5 w-5 text-blue-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              Dashboard Preview
            </p>
            <p className="text-xs text-white/60">
              This is a demo version. <Link to="/login" className="underline hover:text-white">Sign in</Link> to access your real dashboard.
            </p>
          </div>
          <Link to="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      <div className="min-h-screen text-white relative">
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
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
              {/* Hero Section - Liquid Glass */}
              <div className="mb-12">
                <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-semibold mb-2 text-white tracking-tight leading-tight">
                      Hey, Creator! 👋
                    </h1>
                    <p className="text-base text-white/60">
                      Content Creator
                    </p>
                  </div>
                </div>

                {/* Earnings Card */}
                <div className="flex justify-center">
                  <div className="relative w-full max-w-lg">
                    <div className="relative bg-white/[0.08] backdrop-blur-[40px] border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.1] via-transparent to-transparent pointer-events-none" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-white" />
                          </div>
                          <span className="text-sm font-medium text-white/80">Earnings</span>
                        </div>
                        <div className="text-5xl font-semibold text-white mb-3 tracking-tight">
                          ₹{dashboardData.earnings.current.toLocaleString('en-IN')}
                        </div>
                        <div className="text-base text-white/60">
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
            {/* Financial Overview Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-6">Financial Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card className="bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.08] transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/50 mb-2 font-medium">Pending Invoices</p>
                        <p className="text-2xl font-semibold text-white">
                          ₹{dashboardData.moneyOverview.pendingPayments.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-2xl bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.08] transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/50 mb-2 font-medium">Tax Liability (Q3)</p>
                        <p className="text-2xl font-semibold text-white">₹85,000</p>
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
                  <div className="space-y-2 bg-white/5 rounded-2xl p-2 border border-white/5">
                    <div className={cn("flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5", "border-b border-white/5")}>
                      <div className="h-10 w-10 rounded-xl bg-green-500/20 backdrop-blur-sm flex items-center justify-center border border-green-500/30">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Mamaearth collaboration agreement</p>
                        <p className="text-xs text-white/60">Approved • 2 hours ago</p>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5", "border-b border-white/5")}>
                      <div className="h-10 w-10 rounded-xl bg-blue-500/20 backdrop-blur-sm flex items-center justify-center border border-blue-500/30">
                        <Briefcase className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">boAt brand deal signed</p>
                        <p className="text-xs text-white/60">Contract Reviewed • 5 hours ago</p>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5", "border-b border-white/5")}>
                      <div className="h-10 w-10 rounded-xl bg-purple-500/20 backdrop-blur-sm flex items-center justify-center border border-purple-500/30">
                        <DollarSign className="h-5 w-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Payment received from Zepto</p>
                        <p className="text-xs text-white/60">Completed • 1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5">
                      <div className="h-10 w-10 rounded-xl bg-yellow-500/20 backdrop-blur-sm flex items-center justify-center border border-yellow-500/30">
                        <FileText className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Contract draft sent to L'Oreal</p>
                        <p className="text-xs text-white/60">Pending Review • 3 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Actions & Alerts */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-6">Actions & Alerts</h2>
              <div className="rounded-2xl overflow-hidden">
                <ActionCenter
                  urgentActions={dashboardData.urgentActions || []}
                  brandDeals={demoBrandDeals}
                  onSendReminder={() => {}}
                  onEscalate={() => {}}
                  onAnalyzeContract={() => {}}
                />
              </div>
            </section>
            </>
          )}

          {/* Deals Tab Content */}
          {activeTab === 'deals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-2xl font-semibold text-white">All Brand Deals</h2>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    placeholder="Search deals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white/5 text-white border-white/10 placeholder:text-white/40"
                  />
                </div>
              </div>
              <Select value={quickFilter || 'all'} onValueChange={(value) => setQuickFilter(value === 'all' ? null : value)}>
                <SelectTrigger className="w-[180px] bg-white/5 text-white border-white/10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1C1E] border-white/5 text-white">
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
          </div>
          )}

          {/* Payments Tab Content */}
          {activeTab === 'payments' && (
          <div className="space-y-6">
            <FinancialOverviewHeader allDeals={demoBrandDeals} />
            
            {/* Payments Title */}
            <h2 className="text-lg md:text-xl font-bold mt-2 text-white">Payments</h2>

            {/* Filters */}
            <PaymentQuickFilters
              allDeals={demoBrandDeals}
              activeFilter={paymentQuickFilter}
              onFilterChange={setPaymentQuickFilter}
            />

            {/* Search Bar */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search payments..."
                  value={paymentSearchTerm}
                  onChange={(e) => setPaymentSearchTerm(e.target.value)}
                  className="pl-9 bg-white/5 text-white border-white/10 placeholder:text-white/40"
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
                if (paymentStatus === 'paid') {
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
            <h2 className="text-2xl font-semibold text-white">Content Protection</h2>
            <Card className="bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <CardContent className="p-6">
                <p className="text-white/60">
                  Content protection features are available after signing in.
                </p>
              </CardContent>
            </Card>
          </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CreatorDashboardPreview;

