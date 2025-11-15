"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, IndianRupee, Send, FileText, CalendarDays, AlertTriangle, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { usePagination } from '@/lib/hooks/usePagination';
import { BrandDeal } from '@/types';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSendPaymentReminder } from '@/lib/hooks/useSendPaymentReminder'; // Import the new hook
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import BrandLogo from '@/components/creator-contracts/BrandLogo';
import { cn } from '@/lib/utils';

const CreatorPaymentsAndRecovery = () => {
  const { profile, loading: sessionLoading, isCreator } = useSession();
  const [statusFilter, setStatusFilter] = useState<BrandDeal['status'] | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [selectedDealForReminder, setSelectedDealForReminder] = useState<BrandDeal | null>(null);
  const [messageType, setMessageType] = useState<'email' | 'whatsapp'>('email'); // NEW state
  const [customMessage, setCustomMessage] = useState(''); // NEW state
  
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

  const filteredAndSearchedDeals = useMemo(() => {
    return allBrandDeals.filter(deal => {
      const matchesSearch = searchTerm ? deal.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        deal.deliverables.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      return matchesSearch;
    });
  }, [allBrandDeals, searchTerm]);

  const paginatedDeals = filteredAndSearchedDeals.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalFilteredCount = filteredAndSearchedDeals.length;
  const calculatedTotalPages = Math.ceil(totalFilteredCount / pageSize);

  // Calculate total income from completed deals
  const totalIncome = useMemo(() => {
    return allBrandDeals.filter(deal => deal.status === 'Completed').reduce((sum, deal) => sum + deal.deal_amount, 0) || 0;
  }, [allBrandDeals]);

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
        messageType: messageType, // Pass state
        customMessage: customMessage.trim() || undefined, // Pass state
      });
      toast.success('Payment reminder sent!');
      setIsReminderDialogOpen(false);
      setSelectedDealForReminder(null);
      setCustomMessage(''); // Reset
      setMessageType('email'); // Reset
      refetchBrandDeals();
    } catch (error: any) {
      toast.error('Failed to send reminder', { description: error.message });
    }
  };

  const getStatusBadgeVariant = (status: BrandDeal['status']): 'default' | 'secondary' | 'success' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Drafting': return 'secondary';
      case 'Payment Pending': return 'secondary';
      case 'Completed': return 'success';
      case 'Cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const isOverdue = (paymentExpectedDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expectedDate = new Date(paymentExpectedDate);
    expectedDate.setHours(0, 0, 0, 0);
    return expectedDate < today;
  };

  // Handle deliverables array/string
  const getDeliverablesArray = (deal: BrandDeal): string[] => {
    if (Array.isArray(deal.deliverables)) return deal.deliverables;
    if (typeof deal.deliverables === 'string') {
      return deal.deliverables.split(',').map(d => d.trim()).filter(Boolean);
    }
    return [];
  };

  if (sessionLoading || isLoadingBrandDeals) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading payments and recovery data...</p>
      </div>
    );
  }

  // Handle deliverables array/string
  const getDeliverablesArray = (deal: BrandDeal): string[] => {
    if (Array.isArray(deal.deliverables)) return deal.deliverables;
    if (typeof deal.deliverables === 'string') {
      return deal.deliverables.split(',').map(d => d.trim()).filter(Boolean);
    }
    return [];
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden pb-[80px] px-4 md:px-6 antialiased">
      {/* Page Title - text-2xl on mobile per design system */}
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">My Payments & Recovery</h1>

      {/* Financial Overview - Gradient background, large values, tiny labels */}
      <section className="bg-gradient-to-br from-card to-card/80 p-4 md:p-6 rounded-[12px] shadow-sm shadow-black/20 border border-border/40 mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4 flex items-center">
          <IndianRupee className="h-5 w-5 mr-2 text-green-500" /> Financial Overview
        </h2>
        <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-6">
          <div className="flex flex-col p-4 rounded-[12px] bg-secondary/50 border border-border/40">
            <p className="text-[11px] md:text-sm uppercase tracking-wide text-muted-foreground">Total Income Tracked (Completed Deals)</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">₹{totalIncome.toLocaleString('en-IN')}</p>
          </div>
          <div className="flex flex-col p-4 rounded-[12px] bg-secondary/50 border border-border/40">
            <p className="text-[11px] md:text-sm uppercase tracking-wide text-muted-foreground">Estimated Tax Liability (Mock)</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">₹{(totalIncome * 0.15).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </section>

      {/* Payment Tracking - Mobile cards, desktop table */}
      <section className="bg-card p-4 md:p-6 rounded-[12px] shadow-sm shadow-black/20 border border-border/40">
        <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4">Payment Tracking</h2>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-4">
          <div className="relative flex-1">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by brand or deliverables..."
              className="pl-9 pr-3 bg-background text-foreground border-border/40 focus:border-primary/50 h-[42px] md:h-10 rounded-[14px] md:rounded-md text-sm placeholder:text-muted-foreground/70"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Search payments"
            />
          </div>
          <Select onValueChange={(value: BrandDeal['status'] | 'All') => {
            setStatusFilter(value);
            setCurrentPage(1);
          }} value={statusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background text-foreground border-border/40 h-[42px] md:h-10 rounded-[14px] md:rounded-md">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Payment Pending">Payment Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paginatedDeals.length > 0 ? (
          <>
            {/* Mobile Card Layout (< 768px) */}
            {isMobile ? (
              <div className="flex flex-col gap-3">
                {paginatedDeals.map((deal, index) => {
                  const deliverablesArray = getDeliverablesArray(deal);
                  const isOverdueDeal = isOverdue(deal.payment_expected_date);
                  return (
                    <article
                      key={deal.id}
                      className={cn(
                        "bg-card rounded-[12px] p-4 border border-border/40 shadow-sm shadow-black/20",
                        index < paginatedDeals.length - 1 && "border-b border-border/30",
                        isOverdueDeal && 'border-red-500/30 bg-red-500/5'
                      )}
                    >
                      {/* Brand Row: Logo + Name */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <BrandLogo 
                            brandName={deal.brand_name} 
                            brandLogo={null} 
                            size="sm" 
                            className="flex-shrink-0" 
                          />
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {deal.brand_name}
                          </h3>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xl font-bold text-foreground">
                            ₹{deal.deal_amount.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      {/* Deliverables or Platform */}
                      <div className="mb-3">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Deliverables</div>
                        <div className="flex flex-wrap gap-2">
                          {deliverablesArray.slice(0, 2).map((item: string, idx: number) => (
                            <span 
                              key={idx}
                              className="text-[11px] bg-muted px-2 py-1 rounded-full text-foreground border border-border/40"
                            >
                              {item}
                            </span>
                          ))}
                          {deliverablesArray.length > 2 && (
                            <span className="text-[11px] bg-muted px-2 py-1 rounded-full text-muted-foreground border border-border/40">
                              +{deliverablesArray.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Payment Expected + Status Row */}
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/30">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {new Date(deal.payment_expected_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          {isOverdueDeal && (
                            <AlertTriangle className="h-4 w-4 text-destructive" aria-label="Overdue" />
                          )}
                        </div>
                        <Badge variant={getStatusBadgeVariant(deal.status)} className="text-[11px]">
                          {deal.status}
                        </Badge>
                      </div>

                      {/* Actions Row */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                        {deal.invoice_file_url && (
                          <Button variant="outline" size="sm" asChild className="text-primary border-border hover:bg-accent hover:text-foreground h-[36px] flex-1">
                            <a href={deal.invoice_file_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 mr-1" /> Invoice
                            </a>
                          </Button>
                        )}
                        {deal.status === 'Payment Pending' && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenReminderDialog(deal)}
                              disabled={sendPaymentReminderMutation.isPending}
                              className="text-secondary-foreground border-border hover:bg-secondary/80 h-[36px] flex-1"
                            >
                              <Send className="h-4 w-4 mr-1" /> Reminder
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => toast.info('Feature coming soon!', { description: 'Advanced recovery options will be available here.' })}
                              className="bg-accent-gold text-accent-gold-foreground hover:bg-accent-gold/90 h-[36px] flex-1"
                            >
                              <IndianRupee className="h-4 w-4 mr-1" /> Recover
                            </Button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* Desktop Table Layout (>= 768px) */
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Brand</TableHead>
                    <TableHead className="text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-muted-foreground">Deliverables</TableHead>
                    <TableHead className="text-muted-foreground">Payment Expected</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDeals.map((deal) => (
                    <TableRow key={deal.id} className="border-border">
                      <TableCell className="font-medium text-foreground">{deal.brand_name}</TableCell>
                      <TableCell className="text-muted-foreground">₹{deal.deal_amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{deal.deliverables}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center">
                          {new Date(deal.payment_expected_date).toLocaleDateString()}
                          {isOverdue(deal.payment_expected_date) && (
                            <AlertTriangle className="h-4 w-4 text-destructive ml-2" aria-label="Overdue" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(deal.status)}>
                          {deal.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right flex justify-end space-x-2">
                        {deal.invoice_file_url && (
                          <Button variant="outline" size="sm" asChild className="text-primary border-border hover:bg-accent hover:text-foreground">
                            <a href={deal.invoice_file_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {deal.status === 'Payment Pending' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenReminderDialog(deal)}
                            disabled={sendPaymentReminderMutation.isPending}
                            className="text-secondary-foreground border-border hover:bg-secondary/80"
                          >
                            <Send className="h-4 w-4 mr-1" /> Reminder
                          </Button>
                        )}
                        {deal.status === 'Payment Pending' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => toast.info('Feature coming soon!', { description: 'Advanced recovery options will be available here.' })}
                            className="bg-accent-gold text-accent-gold-foreground hover:bg-accent-gold/90"
                          >
                            <IndianRupee className="h-4 w-4 mr-1" /> Recover
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination - Mobile: h-[40px] w-full text-sm, center page text */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-3 mt-4">
              <div className="w-full md:w-auto md:order-1">
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || isLoadingBrandDeals}
                  className="w-full md:w-auto text-foreground border-border/50 hover:bg-accent/50 h-[40px] md:h-9 text-sm rounded-[10px] md:rounded-md"
                >
                  Previous
                </Button>
              </div>
              <span className="hidden md:inline-flex order-2 text-xs md:text-sm text-muted-foreground text-center">
                Page {currentPage} of {calculatedTotalPages}
              </span>
              <div className="w-full md:w-auto md:order-3">
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={currentPage === calculatedTotalPages || isLoadingBrandDeals}
                  className="w-full md:w-auto text-foreground border-border/50 hover:bg-accent/50 h-[40px] md:h-9 text-sm rounded-[10px] md:rounded-md"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-center py-8">No payment records found. Add brand deals to track payments.</p>
        )}
      </section>

      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent 
          className="sm:max-w-[425px] bg-card text-foreground border-border"
          aria-labelledby="send-reminder-title"
          aria-describedby="send-reminder-description"
        >
          <DialogHeader>
            <DialogTitle id="send-reminder-title">Send Payment Reminder</DialogTitle>
            <DialogDescription id="send-reminder-description" className="text-muted-foreground">
              Send a reminder to <strong>{selectedDealForReminder?.brand_name}</strong> for <strong>₹{selectedDealForReminder?.deal_amount.toLocaleString('en-IN')}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="messageType">Delivery Method</Label>
              <Select onValueChange={(value: 'email' | 'whatsapp') => setMessageType(value)} value={messageType}>
                <SelectTrigger id="messageType">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email (Default Template)</SelectItem>
                  <SelectItem value="whatsapp" disabled>WhatsApp (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="customMessage">Custom Message (Optional)</Label>
              <Input
                id="customMessage"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter a personalized message..."
                disabled={sendPaymentReminderMutation.isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">If left blank, a default template will be used.</p>
            </div>
            {selectedDealForReminder && (
              <p className="text-sm text-muted-foreground flex items-center">
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
            <Button variant="outline" onClick={() => setIsReminderDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreatorPaymentsAndRecovery;