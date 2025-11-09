"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Edit, Trash2, FileText, Download, Eye, MessageSquare, CalendarDays, DollarSign, Mail, ReceiptText, IndianRupee, ArrowDownWideNarrow, ArrowUpWideNarrow, AlertTriangle, Bot, Lightbulb } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useBrandDeals, useDeleteBrandDeal } from '@/lib/hooks/useBrandDeals';
import { usePagination } from '@/lib/hooks/usePagination';
import { BrandDeal } from '@/types';
import BrandDealForm from '@/components/forms/BrandDealForm';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import BrandDealsStats from '@/components/creator-contracts/BrandDealsStats'; // NEW
import MarkPaymentReceivedDialog from '@/components/creator-contracts/MarkPaymentReceivedDialog'; // NEW
import { cn } from '@/lib/utils';

const PLATFORM_OPTIONS = ['Instagram', 'YouTube', 'TikTok', 'Facebook', 'LinkedIn', 'Twitter', 'Other'];
const DEAL_STATUS_OPTIONS = ['Drafting', 'Approved', 'Payment Pending', 'Completed', 'Cancelled'];
const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest' },
  { value: 'deal_amount', label: 'Highest Payment' },
  { value: 'payment_expected_date', label: 'Payment Expected Date' },
];

const CreatorContracts = () => {
  const { profile, loading: sessionLoading, isCreator } = useSession();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingBrandDeal, setEditingBrandDeal] = useState<BrandDeal | null>(null);
  const [statusFilter, setStatusFilter] = useState<BrandDeal['status'] | 'All'>('All');
  const [platformFilter, setPlatformFilter] = useState<string | 'All'>('All'); // NEW: Platform filter
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'deal_amount' | 'payment_expected_date'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isPaymentDialog, setIsPaymentDialog] = useState(false); // NEW: Payment dialog state
  const [selectedDealForPayment, setSelectedDealForPayment] = useState<BrandDeal | null>(null); // NEW: Deal for payment

  const pageSize = 10;

  // Fetch all deals based on filters (DB filtering for status/platform/sort, client-side for search)
  const { data: allBrandDeals, isLoading: isLoadingBrandDeals, error: brandDealsError, refetch: refetchBrandDeals } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !sessionLoading && isCreator && !!profile?.id,
    statusFilter: statusFilter,
    platformFilter: platformFilter, // Pass platform filter
    sortBy: sortBy,
    sortOrder: sortOrder,
    limit: undefined, // Fetch all for client-side search/pagination
  });

  const deleteBrandDealMutation = useDeleteBrandDeal();

  const filteredAndSearchedDeals = useMemo(() => {
    const deals = allBrandDeals || [];
    return deals.filter(deal => {
      const matchesSearch = searchTerm ? deal.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        deal.deliverables.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      return matchesSearch;
    });
  }, [allBrandDeals, searchTerm]);

  const { currentPage, totalPages, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
    totalCount: filteredAndSearchedDeals.length,
    pageSize: pageSize,
  });

  const paginatedDeals = filteredAndSearchedDeals.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const calculatedTotalPages = Math.ceil(filteredAndSearchedDeals.length / pageSize);

  useEffect(() => {
    if (brandDealsError) {
      toast.error('Error fetching brand deals', { description: brandDealsError.message });
    }
  }, [brandDealsError]);

  const handleOpenFormDialog = (deal?: BrandDeal, focusInvoice: boolean = false) => {
    setEditingBrandDeal(deal || null);
    setIsFormDialogOpen(true);
    // Note: We can't easily focus a field in the modal from here, but setting the state is enough.
  };

  const handleOpenPaymentDialog = (deal: BrandDeal) => {
    setSelectedDealForPayment(deal);
    setIsPaymentDialog(true);
  };

  const handleDeleteBrandDeal = async (deal: BrandDeal) => {
    if (!profile?.id) {
      toast.error('Creator profile not found. Cannot delete brand deal.');
      return;
    }
    try {
      await deleteBrandDealMutation.mutateAsync({
        id: deal.id,
        creator_id: profile.id,
        contract_file_url: deal.contract_file_url,
        invoice_file_url: deal.invoice_file_url,
      });
      toast.success(`Brand deal with ${deal.brand_name} deleted successfully!`);
      refetchBrandDeals();
    } catch (error: any) {
      toast.error('Failed to delete brand deal', { description: error.message });
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
        <p className="mt-3 text-muted-foreground">Loading your brand deals...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Brand Deals & Contracts</h1>
        <Button onClick={() => handleOpenFormDialog()} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Deal
        </Button>
      </div>

      {/* 1. Top Stats Overview */}
      <BrandDealsStats allDeals={allBrandDeals || []} isLoading={isLoadingBrandDeals} />

      {/* 2. Filters & Sorting and 3. Brand Deals Table */}
      <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">All Deals ({filteredAndSearchedDeals.length})</h2>
        
        {/* Filters & Sorting */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              {DEAL_STATUS_OPTIONS.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select onValueChange={(value: string | 'All') => {
            setPlatformFilter(value);
            setCurrentPage(1);
          }} value={platformFilter}>
            <SelectTrigger className="w-[180px] bg-input text-foreground border-border">
              <SelectValue placeholder="Filter by Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Platforms</SelectItem>
              {PLATFORM_OPTIONS.map(platform => (
                <SelectItem key={platform} value={platform}>{platform}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => {
            const [newSortBy, newSortOrder] = value.split('|') as [typeof sortBy, typeof sortOrder];
            setSortBy(newSortBy);
            setSortOrder(newSortOrder);
            setCurrentPage(1);
          }} value={`${sortBy}|${sortOrder}`}>
            <SelectTrigger className="w-[180px] bg-input text-foreground border-border">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={`${option.value}|desc`} value={`${option.value}|desc`}>
                  {option.label} (Desc)
                </SelectItem>
              ))}
              {SORT_OPTIONS.map(option => (
                <SelectItem key={`${option.value}|asc`} value={`${option.value}|asc`}>
                  {option.label} (Asc)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {paginatedDeals.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Brand</TableHead>
                  <TableHead className="text-muted-foreground">Platform</TableHead>
                  <TableHead className="text-muted-foreground">Amount (₹)</TableHead>
                  <TableHead className="text-muted-foreground">Due Date</TableHead>
                  <TableHead className="text-muted-foreground">Payment Expected</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDeals.map((deal) => (
                  <TableRow key={deal.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{deal.brand_name}</TableCell>
                    <TableCell className="text-muted-foreground">{deal.platform || 'N/A'}</TableCell>
                    <TableCell className="text-foreground font-semibold">₹{deal.deal_amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(deal.due_date).toLocaleDateString()}</TableCell>
                    <TableCell className={cn("text-muted-foreground", isOverdue(deal.payment_expected_date) && deal.status === 'Payment Pending' && 'text-destructive font-semibold')}>
                      <div className="flex items-center">
                        {new Date(deal.payment_expected_date).toLocaleDateString()}
                        {isOverdue(deal.payment_expected_date) && deal.status === 'Payment Pending' && (
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
                      {deal.status === 'Payment Pending' && (
                        <Button variant="success" size="sm" onClick={() => handleOpenPaymentDialog(deal)} className="bg-green-600 hover:bg-green-700 text-white">
                          <IndianRupee className="h-4 w-4 mr-1" /> Paid
                        </Button>
                      )}
                      {deal.invoice_file_url ? (
                        <Button variant="outline" size="sm" asChild className="text-primary border-border hover:bg-accent hover:text-foreground">
                          <a href={deal.invoice_file_url} target="_blank" rel="noopener noreferrer" title="View Invoice">
                            <ReceiptText className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleOpenFormDialog(deal, true)} className="text-primary border-border hover:bg-accent hover:text-foreground" title="Upload Invoice">
                          <ReceiptText className="h-4 w-4" />
                        </Button>
                      )}
                      {deal.contract_file_url && (
                        <Button variant="outline" size="sm" asChild className="text-primary border-border hover:bg-accent hover:text-foreground">
                          <a href={deal.contract_file_url} target="_blank" rel="noopener noreferrer" title="View Contract">
                            <FileText className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleOpenFormDialog(deal)} disabled={deleteBrandDealMutation.isPending} className="text-primary border-border hover:bg-accent hover:text-foreground">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={deleteBrandDealMutation.isPending && deleteBrandDealMutation.variables?.id === deal.id}>
                            {deleteBrandDealMutation.isPending && deleteBrandDealMutation.variables?.id === deal.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card text-foreground border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              This action cannot be undone. This will permanently delete the brand deal
                              "{deal.brand_name}" and all associated files.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-foreground border-border hover:bg-accent">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteBrandDeal(deal)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
          <p className="text-muted-foreground text-center py-8">No brand deals found matching your criteria.</p>
        )}
      </section>
      
      {/* 5. AI Insights Panel (Placeholder) */}
      <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Bot className="h-5 w-5 mr-2 text-blue-500" /> AI Insights & Recommendations
        </h2>
        <div className="space-y-4">
          <Card className="bg-secondary p-4 border-l-4 border-yellow-500">
            <CardContent className="p-0 flex items-start">
              <Lightbulb className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0 mt-1" />
              <p className="text-sm text-muted-foreground">
                **Smart Recommendation:** Your average payment cycle is 54 days — 15 days slower than the industry average for your niche. Consider adding a late payment clause to your next 3 contracts.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-secondary p-4 border-l-4 border-red-500">
            <CardContent className="p-0 flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-1" />
              <p className="text-sm text-muted-foreground">
                **Risk Alert:** Brand "MamaEarth" has 2 overdue payments in your history. Consider sending a formal legal notice if payment is not received within 7 days.
              </p>
            </CardContent>
          </Card>
          <Button variant="link" className="p-0 text-primary hover:text-primary/80">
            View Full AI Risk Report <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Brand Deal Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
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
                setIsFormDialogOpen(false);
                setEditingBrandDeal(null);
              }}
              onClose={() => {
                setIsFormDialogOpen(false);
                setEditingBrandDeal(null);
              }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Mark Payment Received Dialog */}
      <Dialog open={isPaymentDialog} onOpenChange={setIsPaymentDialog}>
        <DialogContent 
          className="sm:max-w-[425px] bg-card text-foreground border-border"
          aria-labelledby="mark-payment-title"
          aria-describedby="mark-payment-description"
        >
          <DialogHeader>
            <DialogTitle id="mark-payment-title">Mark Payment Received</DialogTitle>
            <DialogDescription id="mark-payment-description" className="text-muted-foreground">
              Confirm the payment details for this deal.
            </DialogDescription>
          </DialogHeader>
          {selectedDealForPayment && (
            <MarkPaymentReceivedDialog
              deal={selectedDealForPayment}
              onSaveSuccess={() => {
                refetchBrandDeals();
                setIsPaymentDialog(false);
                setSelectedDealForPayment(null);
              }}
              onClose={() => setIsPaymentDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreatorContracts;