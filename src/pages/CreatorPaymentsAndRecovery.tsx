"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, IndianRupee, MessageSquare, Send, Eye, FileText, CalendarDays, AlertTriangle, Mail } from 'lucide-react';
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

const CreatorPaymentsAndRecovery = () => {
  const { profile, loading: sessionLoading, isCreator } = useSession();
  const [statusFilter, setStatusFilter] = useState<BrandDeal['status'] | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [selectedDealForReminder, setSelectedDealForReminder] = useState<BrandDeal | null>(null);
  const [messageType, setMessageType] = useState<'email' | 'whatsapp'>('email'); // NEW state
  const [customMessage, setCustomMessage] = useState(''); // NEW state
  const pageSize = 10;

  const { currentPage, totalPages, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
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

  const getStatusBadgeVariant = (status: BrandDeal['status']) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Drafting': return 'secondary';
      case 'Payment Pending': return 'accent';
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

  if (sessionLoading || isLoadingBrandDeals) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading payments and recovery data...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">My Payments & Recovery</h1>

      <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <IndianRupee className="h-5 w-5 mr-2 text-green-500" /> Financial Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col p-4 rounded-lg bg-secondary border border-border">
            <p className="text-sm text-muted-foreground">Total Income Tracked (Completed Deals)</p>
            <p className="text-3xl font-bold text-foreground mt-1">₹{totalIncome.toLocaleString('en-IN')}</p>
          </div>
          <div className="flex flex-col p-4 rounded-lg bg-secondary border border-border">
            <p className="text-sm text-muted-foreground">Estimated Tax Liability (Mock)</p>
            <p className="text-3xl font-bold text-foreground mt-1">₹{(totalIncome * 0.15).toLocaleString('en-IN')}</p> {/* Mock 15% tax */}
          </div>
        </div>
      </section>

      <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Payment Tracking</h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by brand or deliverables..."
              className="pl-9 bg-input text-foreground border-border"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Select onValueChange={(value: BrandDeal['status'] | 'All') => {
            setStatusFilter(value);
            setCurrentPage(1);
          }} value={statusFilter}>
            <SelectTrigger className="w-[180px] bg-input text-foreground border-border">
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
                          <AlertTriangle className="h-4 w-4 text-destructive ml-2" title="Overdue" />
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
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || isLoadingBrandDeals}
                className="text-primary border-border hover:bg-accent hover:text-foreground"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {calculatedTotalPages}
              </span>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage === calculatedTotalPages || isLoadingBrandDeals}
                className="text-primary border-border hover:bg-accent hover:text-foreground"
              >
                Next
              </Button>
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
    </>
  );
};

export default CreatorPaymentsAndRecovery;