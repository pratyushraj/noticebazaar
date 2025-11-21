"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Loader2, IndianRupee, Mail } from 'lucide-react';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { usePagination } from '@/lib/hooks/usePagination';
import { BrandDeal } from '@/types';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSendPaymentReminder } from '@/lib/hooks/useSendPaymentReminder';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import FinancialOverviewHeader from '@/components/payments/FinancialOverviewHeader';
import PaymentQuickFilters from '@/components/payments/PaymentQuickFilters';
import PaymentTimeline from '@/components/payments/PaymentTimeline';
import EnhancedPaymentCard from '@/components/payments/EnhancedPaymentCard';
import PaymentAnalytics from '@/components/payments/PaymentAnalytics';
import TaxSummaryCard from '@/components/payments/TaxSummaryCard';
import MarkPaymentReceivedDialog from '@/components/creator-contracts/MarkPaymentReceivedDialog';
import TopInvoicesDueSoon from '@/components/payments/TopInvoicesDueSoon';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

type SortOption = 'due_date' | 'amount_desc' | 'amount_asc' | 'brand_asc' | 'overdue_first' | 'platform';

const CreatorPaymentsAndRecovery = () => {
  const { profile, loading: sessionLoading, isCreator } = useSession();
  const [statusFilter, setStatusFilter] = useState<BrandDeal['status'] | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('due_date');
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [selectedDealForReminder, setSelectedDealForReminder] = useState<BrandDeal | null>(null);
  const [messageType, setMessageType] = useState<'email' | 'whatsapp'>('email');
  const [customMessage, setCustomMessage] = useState('');
  const [isMarkPaymentDialogOpen, setIsMarkPaymentDialogOpen] = useState(false);
  const [dealToMarkPaid, setDealToMarkPaid] = useState<BrandDeal | null>(null);
  
  // Mobile detection - MUST be before any conditional returns
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const pageSize = 10;

  const { currentPage, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
    totalCount: undefined,
    pageSize: pageSize,
  });

  const { data: brandDealsData, isLoading: isLoadingBrandDeals, error: brandDealsError, refetch: refetchBrandDeals } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !sessionLoading && isCreator && !!profile?.id,
    statusFilter: statusFilter,
    sortBy: 'payment_expected_date',
    sortOrder: 'asc',
  });

  const allBrandDeals = brandDealsData || [];

  // Helper to determine payment status
  const getPaymentStatus = (deal: BrandDeal): 'overdue' | 'pending' | 'upcoming' | 'paid' => {
    if (deal.status === 'Completed' && deal.payment_received_date) return 'paid';
    
    if (deal.status === 'Payment Pending') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const dueDate = new Date(deal.payment_expected_date);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < now) return 'overdue';
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 ? 'pending' : 'upcoming';
    }
    
    return 'upcoming';
  };

  // Helper to calculate days
  const getDaysInfo = (deal: BrandDeal) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueDate = new Date(deal.payment_expected_date);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { daysOverdue: Math.abs(diffDays), daysLeft: undefined };
    }
    return { daysOverdue: undefined, daysLeft: diffDays };
  };

  const filteredAndSearchedDeals = useMemo(() => {
    let filtered = [...allBrandDeals];

    // Quick filter
    if (quickFilter) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      switch (quickFilter) {
        case 'overdue':
          filtered = filtered.filter(deal => {
            if (deal.status !== 'Payment Pending') return false;
            const dueDate = new Date(deal.payment_expected_date);
            return dueDate < now;
          });
          break;
        case 'due_this_week':
          filtered = filtered.filter(deal => {
            if (deal.status !== 'Payment Pending') return false;
            const dueDate = new Date(deal.payment_expected_date);
            return dueDate >= now && dueDate <= sevenDaysFromNow;
          });
          break;
        case 'pending':
          filtered = filtered.filter(deal => {
            if (deal.status !== 'Payment Pending') return false;
            const dueDate = new Date(deal.payment_expected_date);
            return dueDate >= now;
          });
          break;
        case 'paid':
          filtered = filtered.filter(deal => 
            deal.status === 'Completed' && deal.payment_received_date
          );
          break;
        default:
          break;
      }
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(deal => deal.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(deal => 
        deal.brand_name.toLowerCase().includes(searchLower) ||
        deal.deal_amount.toString().includes(searchLower)
      );
    }

    // Sort
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          const dueA = new Date(a.payment_expected_date);
          const dueB = new Date(b.payment_expected_date);
          return dueA.getTime() - dueB.getTime();
        
        case 'amount_desc':
          return b.deal_amount - a.deal_amount;
        
        case 'amount_asc':
          return a.deal_amount - b.deal_amount;
        
        case 'brand_asc':
          return a.brand_name.localeCompare(b.brand_name);
        
        case 'overdue_first':
          const overdueA = new Date(a.payment_expected_date) < now ? 1 : 0;
          const overdueB = new Date(b.payment_expected_date) < now ? 1 : 0;
          if (overdueA !== overdueB) return overdueB - overdueA;
          return new Date(a.payment_expected_date).getTime() - new Date(b.payment_expected_date).getTime();
        
        case 'platform':
          return (a.platform || '').localeCompare(b.platform || '');
        
        default:
          return 0;
      }
    });

    return filtered;
  }, [allBrandDeals, searchTerm, statusFilter, quickFilter, sortBy]);

  const paginatedDeals = filteredAndSearchedDeals.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalFilteredCount = filteredAndSearchedDeals.length;
  const calculatedTotalPages = Math.ceil(totalFilteredCount / pageSize);

  useEffect(() => {
    if (brandDealsError) {
      toast.error('Error fetching brand deals', { description: brandDealsError.message });
    }
  }, [brandDealsError]);

  const sendPaymentReminderMutation = useSendPaymentReminder();

  const handleOpenReminderDialog = (deal: BrandDeal) => {
    setSelectedDealForReminder(deal);
    setMessageType('email'); // Reset to default
    setCustomMessage(''); // Reset custom message
    setIsReminderDialogOpen(true);
  };

  const handleSendReminder = async () => {
    if (!selectedDealForReminder) return;

    try {
      await sendPaymentReminderMutation.mutateAsync({ 
        brandDealId: selectedDealForReminder.id,
        messageType: messageType,
        customMessage: customMessage.trim() || undefined,
      });
      setIsReminderDialogOpen(false);
      setSelectedDealForReminder(null);
      setCustomMessage('');
      setMessageType('email');
      refetchBrandDeals();
    } catch (error: any) {
      // Error handled by hook
    }
  };

  const handleMarkPaymentReceived = (deal: BrandDeal) => {
    setDealToMarkPaid(deal);
    setIsMarkPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    refetchBrandDeals();
    setIsMarkPaymentDialogOpen(false);
    setDealToMarkPaid(null);
  };

  const handleEscalate = (deal: BrandDeal) => {
    toast.info('Escalation feature coming soon!');
  };

  const handleViewDetails = (deal: BrandDeal) => {
    // Navigate to deal details page
    window.location.href = `/creator-contracts/${deal.id}`;
  };

  const handleAddNote = (_deal: BrandDeal) => {
    toast.info('Add note feature coming soon!');
  };

  if (sessionLoading || isLoadingBrandDeals) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading payments and recovery data...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden pb-[80px] px-4 md:px-6 antialiased">
      {/* New Financial Overview Header */}
      <FinancialOverviewHeader allDeals={allBrandDeals} />

      {/* Payment Frequency Insights */}
      {allBrandDeals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-700/40">
            <CardContent className="p-6 py-5">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                Creators like you get paid every <span className="font-semibold text-foreground">32–40 days</span> on average.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Top Invoices Due Soon */}
      {allBrandDeals.length > 0 && (
        <div className="mb-6">
          <TopInvoicesDueSoon brandDeals={allBrandDeals} />
        </div>
      )}

      {/* Quick Filter Chips */}
      {allBrandDeals.length > 0 && (
        <div className="mb-6">
          <PaymentQuickFilters
            allDeals={allBrandDeals}
            activeFilter={quickFilter}
            onFilterChange={(filter) => {
              setQuickFilter(filter);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Payment Timeline */}
      {allBrandDeals.length > 0 && (
        <div className="mb-6">
          <PaymentTimeline allDeals={allBrandDeals} />
        </div>
      )}

      {/* Payment Tracking - Mobile cards, desktop table */}
      <section className="bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold text-white mb-4">Payment Tracking</h2>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-4">
          <div className="relative flex-1">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input
                placeholder="Search by brand, invoice, or amount..."
                className="pl-9 pr-3 bg-white/5 text-white border-white/10 focus:border-blue-400/50 h-[42px] md:h-10 rounded-xl text-sm placeholder:text-white/40"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Search payments"
              />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select onValueChange={(value: BrandDeal['status'] | 'All') => {
              setStatusFilter(value);
              setCurrentPage(1);
            }} value={statusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white/5 text-white border-white/10 h-[42px] md:h-10 rounded-xl">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1C1C1E] border-white/5 text-white">
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Payment Pending">Payment Pending</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value: SortOption) => {
              setSortBy(value);
              setCurrentPage(1);
            }} value={sortBy}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white/5 text-white border-white/10 h-[42px] md:h-10 rounded-xl">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className="bg-[#1C1C1E] border-white/5 text-white">
                <SelectItem value="due_date">Due Date (Soonest)</SelectItem>
                <SelectItem value="amount_desc">Highest Amount</SelectItem>
                <SelectItem value="amount_asc">Lowest Amount</SelectItem>
                <SelectItem value="brand_asc">Brand Name A–Z</SelectItem>
                <SelectItem value="overdue_first">Overdue First</SelectItem>
                <SelectItem value="platform">Platform</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {paginatedDeals.length > 0 ? (
          <>
            {/* Enhanced Payment Cards - Grid Layout */}
            <div className={cn(
              "grid gap-4 mb-6",
              isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}>
              {paginatedDeals.map((deal) => {
                const paymentStatus = getPaymentStatus(deal);
                const daysInfo = getDaysInfo(deal);

                return (
                  <EnhancedPaymentCard
                    key={deal.id}
                    deal={deal}
                    status={paymentStatus}
                    daysOverdue={daysInfo.daysOverdue}
                    daysLeft={daysInfo.daysLeft}
                    onSendReminder={handleOpenReminderDialog}
                    onEscalate={handleEscalate}
                    onMarkPaid={handleMarkPaymentReceived}
                    onViewDetails={handleViewDetails}
                    onAddNote={handleAddNote}
                  />
                );
              })}
            </div>


            {/* Pagination */}
            {calculatedTotalPages > 1 && (
              <div className="flex flex-col md:flex-row justify-center items-center gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || isLoadingBrandDeals}
                  className="w-full md:w-auto bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
                >
                  Previous
                </Button>
                <span className="text-sm text-white/60">
                  Page {currentPage} of {calculatedTotalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={currentPage === calculatedTotalPages || isLoadingBrandDeals}
                  className="w-full md:w-auto bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/60 mb-4">No payment records found matching your criteria.</p>
            {quickFilter && (
              <Button
                variant="outline"
                onClick={() => setQuickFilter(null)}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Payment Analytics & Tax Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PaymentAnalytics allDeals={allBrandDeals} />
        <TaxSummaryCard allDeals={allBrandDeals} />
      </div>

      {/* Mark Payment Received Dialog */}
      {dealToMarkPaid && isMarkPaymentDialogOpen && (
        <MarkPaymentReceivedDialog
          deal={dealToMarkPaid}
          onSaveSuccess={handlePaymentSuccess}
          onClose={() => {
            setIsMarkPaymentDialogOpen(false);
            setDealToMarkPaid(null);
          }}
        />
      )}

      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent 
          className="sm:max-w-[425px] bg-[#1C1C1E] text-white border-white/5 rounded-2xl shadow-2xl"
          aria-labelledby="send-reminder-title"
          aria-describedby="send-reminder-description"
        >
          <DialogHeader>
            <DialogTitle id="send-reminder-title" className="text-white">Send Payment Reminder</DialogTitle>
            <DialogDescription id="send-reminder-description" className="text-white/60">
              Send a reminder to <strong>{selectedDealForReminder?.brand_name}</strong> for <strong>₹{selectedDealForReminder?.deal_amount.toLocaleString('en-IN')}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="messageType" className="text-white">Delivery Method</Label>
              <Select onValueChange={(value: 'email' | 'whatsapp') => setMessageType(value)} value={messageType}>
                <SelectTrigger id="messageType" className="bg-white/5 text-white border-white/10">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1C1E] border-white/5 text-white">
                  <SelectItem value="email">Email (Default Template)</SelectItem>
                  <SelectItem value="whatsapp" disabled>WhatsApp (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="customMessage" className="text-white">Custom Message (Optional)</Label>
              <Input
                id="customMessage"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter a personalized message..."
                disabled={sendPaymentReminderMutation.isPending}
                className="bg-white/5 text-white border-white/10 placeholder:text-white/40"
              />
              <p className="text-xs text-white/60 mt-1">If left blank, a default template will be used.</p>
            </div>
            {selectedDealForReminder && (
              <p className="text-sm text-white/60 flex items-center">
                <Mail className="h-4 w-4 mr-2" /> Recipient: {selectedDealForReminder.brand_email || 'NoticeBazaar Support'}
              </p>
            )}
            <Button
              onClick={handleSendReminder}
              disabled={!selectedDealForReminder || sendPaymentReminderMutation.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
            <Button variant="outline" onClick={() => setIsReminderDialogOpen(false)} className="bg-white/5 border-white/10 text-white hover:bg-white/10">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreatorPaymentsAndRecovery;