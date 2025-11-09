"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Edit, Trash2, FileText, Download, Eye, MessageSquare, CalendarDays, DollarSign, Mail, ReceiptText, IndianRupee, ArrowDownWideNarrow, ArrowUpWideNarrow, AlertTriangle, Bot, Lightbulb, Search } from 'lucide-react';
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
import BrandDealsStats from '@/components/creator-contracts/BrandDealsStats';
import MarkPaymentReceivedDialog from '@/components/creator-contracts/MarkPaymentReceivedDialog';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DEAL_STATUS_OPTIONS = ['Drafting', 'Approved', 'Payment Pending', 'Completed', 'Cancelled'];

const CreatorContracts = () => {
  const { profile, loading: sessionLoading, isCreator } = useSession();
  const creatorId = profile?.id;
  const [isBrandDealFormOpen, setIsBrandDealFormOpen] = useState(false);
  const [editingBrandDeal, setEditingBrandDeal] = useState<BrandDeal | null>(null);
  const [isMarkPaymentDialogOpen, setIsMarkPaymentDialogOpen] = useState(false);
  const [dealToMarkPaid, setDealToMarkPaid] = useState<BrandDeal | null>(null);
  const [statusFilter, setStatusFilter] = useState<BrandDeal['status'] | 'All'>('All');
  const [platformFilter, setPlatformFilter] = useState<string | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'payment_expected_date' | 'deal_amount'>('payment_expected_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const pageSize = 10;

  // --- Data Hooks ---
  const { data: allBrandDeals, isLoading: isLoadingBrandDeals, error: brandDealsError, refetch: refetchBrandDeals } = useBrandDeals({
    creatorId: creatorId,
    enabled: !sessionLoading && isCreator && !!creatorId,
    statusFilter: statusFilter,
    platformFilter: platformFilter,
    sortBy: sortBy,
    sortOrder: sortOrder,
  });

  const deleteBrandDealMutation = useDeleteBrandDeal();

  useEffect(() => {
    if (brandDealsError) {
      toast.error('Error fetching brand deals', { description: brandDealsError.message });
    }
  }, [brandDealsError]);

  // --- Filtering and Pagination ---
  const filteredAndSearchedDeals = useMemo(() => {
    return (allBrandDeals || []).filter(deal => {
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

  // --- Handlers ---
  const handleAddBrandDeal = () => {
    setEditingBrandDeal(null);
    setIsBrandDealFormOpen(true);
  };

  const handleEditBrandDeal = (deal: BrandDeal) => {
    setEditingBrandDeal(deal);
    setIsBrandDealFormOpen(true);
  };

  const handleDeleteBrandDeal = async (deal: BrandDeal) => {
    if (!creatorId) return;
    try {
      await deleteBrandDealMutation.mutateAsync({ 
        id: deal.id, 
        creator_id: creatorId, 
        contract_file_url: deal.contract_file_url,
        invoice_file_url: deal.invoice_file_url,
      });
      refetchBrandDeals();
    } catch (error) {
      // Handled by hook
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
        <p className="mt-3 text-muted-foreground">Loading brand deals...</p>
      </div>
    );
  }

  const uniquePlatforms = Array.from(new Set((allBrandDeals || []).map(d => d.platform).filter(p => p)));

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">Brand Deals & Contracts</h1>

      {/* Stats Section */}
      <BrandDealsStats allDeals={allBrandDeals || []} isLoading={isLoadingBrandDeals} />

      <section className="bg-card p-6 rounded-lg shadow-sm border border-border mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">All Brand Deals ({filteredAndSearchedDeals.length})</h2>
          <Button onClick={handleAddBrandDeal} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Deal
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              {DEAL_STATUS_OPTIONS.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
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
              {uniquePlatforms.map(platform => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => {
            const [newSortBy, newSortOrder] = value.split('|');
            setSortBy(newSortBy as any);
            setSortOrder(newSortOrder as any);
            setCurrentPage(1);
          }} value={`${sortBy}|${sortOrder}`}>
            <SelectTrigger className="w-[180px] bg-input text-foreground border-border">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="payment_expected_date|asc">Payment Due (Soonest)</SelectItem>
              <SelectItem value="deal_amount|desc">Amount (High to Low)</SelectItem>
              <SelectItem value="created_at|desc">Date Added (Newest)</SelectItem>
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
                  <TableHead className="text-muted-foreground">Platform</TableHead>
                  <TableHead className="text-muted-foreground">Payment Due</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDeals.map((deal) => (
                  <TableRow key={deal.id} className={cn("border-border", isOverdue(deal.payment_expected_date) && deal.status === 'Payment Pending' && 'bg-red-500/10')}>
                    <TableCell className="font-medium text-foreground">{deal.brand_name}</TableCell>
                    <TableCell className="text-muted-foreground">₹{deal.deal_amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-muted-foreground">{deal.platform || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground">
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
                      {deal.contract_file_url && (
                        <Button variant="outline" size="sm" asChild className="text-primary border-border hover:bg-accent hover:text-foreground">
                          <a href={deal.contract_file_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {deal.invoice_file_url && (
                        <Button variant="outline" size="sm" asChild className="text-primary border-border hover:bg-accent hover:text-foreground">
                          <a href={deal.invoice_file_url} target="_blank" rel="noopener noreferrer">
                            <ReceiptText className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {deal.status === 'Payment Pending' && (
                        <Button variant="default" size="sm" onClick={() => handleMarkPaymentReceived(deal)} className="bg-green-600 hover:bg-green-700 text-white">
                          <IndianRupee className="h-4 w-4 mr-1" /> Paid
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleEditBrandDeal(deal)} disabled={deleteBrandDealMutation.isPending} className="text-primary border-border hover:bg-accent hover:text-foreground">
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
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || isLoadingBrandDeals}
                className="text-primary border-border hover:bg-accent hover:text-foreground"
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">No brand deals found matching your criteria.</p>
        )}
      </section>

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

      {/* Mark Payment Received Dialog */}
      <Dialog open={isMarkPaymentDialogOpen} onOpenChange={setIsMarkPaymentDialogOpen}>
        <DialogContent 
          className="sm:max-w-[425px] bg-card text-foreground border-border"
          aria-labelledby="mark-payment-title"
          aria-describedby="mark-payment-description"
        >
          <DialogHeader>
            <DialogTitle id="mark-payment-title">Mark Payment Received</DialogTitle>
            <DialogDescription id="mark-payment-description" className="text-muted-foreground">
              Confirm the payment details for this deal. This will mark the deal as 'Completed'.
            </DialogDescription>
          </DialogHeader>
          {dealToMarkPaid && (
            <MarkPaymentReceivedDialog
              deal={dealToMarkPaid}
              onSaveSuccess={handlePaymentSuccess}
              onClose={() => setIsMarkPaymentDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreatorContracts;