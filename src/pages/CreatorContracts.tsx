"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Edit, Trash2, FileText, Download, Eye, MessageSquare, CalendarDays, DollarSign, Mail, ReceiptText } from 'lucide-react';
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

const CreatorContracts = () => {
  const { profile, loading: sessionLoading, isCreator } = useSession();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingBrandDeal, setEditingBrandDeal] = useState<BrandDeal | null>(null);
  const [statusFilter, setStatusFilter] = useState<BrandDeal['status'] | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 10;

  const { currentPage, totalPages, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
    totalCount: undefined,
    pageSize: pageSize,
  });

  const { data: brandDealsData, isLoading: isLoadingBrandDeals, error: brandDealsError, refetch: refetchBrandDeals } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !sessionLoading && isCreator && !!profile?.id,
    statusFilter: statusFilter,
  });

  const allBrandDeals = brandDealsData || [];

  const filteredAndSearchedDeals = allBrandDeals.filter(deal => {
    const matchesSearch = searchTerm ? deal.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      deal.deliverables.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    return matchesSearch;
  });

  const paginatedDeals = filteredAndSearchedDeals.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalFilteredCount = filteredAndSearchedDeals.length;
  const calculatedTotalPages = Math.ceil(totalFilteredCount / pageSize);

  useEffect(() => {
    if (brandDealsError) {
      toast.error('Error fetching brand deals', { description: brandDealsError.message });
    }
  }, [brandDealsError]);

  const deleteBrandDealMutation = useDeleteBrandDeal();

  const handleOpenFormDialog = (deal?: BrandDeal) => {
    setEditingBrandDeal(deal || null);
    setIsFormDialogOpen(true);
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

      <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">All Brand Deals</h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
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
              <SelectItem value="Drafting">Drafting</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Payment Pending">Payment Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
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
                    <TableCell className="text-muted-foreground">₹{deal.deal_amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{deal.deliverables}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(deal.due_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(deal.payment_expected_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(deal.status)}>
                        {deal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                      {deal.contract_file_url && (
                        <Button variant="outline" size="sm" asChild className="text-primary border-border hover:bg-accent hover:text-foreground">
                          <a href={deal.contract_file_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
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
          <p className="text-muted-foreground text-center py-8">No brand deals found. Add your first deal!</p>
        )}
      </section>

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
    </>
  );
};

export default CreatorContracts;