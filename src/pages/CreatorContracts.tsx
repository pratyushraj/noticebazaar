"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import BrandDealsStats from '@/components/creator-contracts/BrandDealsStats';
import MarkPaymentReceivedDialog from '@/components/creator-contracts/MarkPaymentReceivedDialog';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import BrandLogo from '@/components/creator-contracts/BrandLogo';
import DealStatusBadge, { DealStage } from '@/components/creator-contracts/DealStatusBadge';
import DeliverablesBadge from '@/components/creator-contracts/DeliverablesBadge';
import DealActionsMenu from '@/components/creator-contracts/DealActionsMenu';
import FiltersBar from '@/components/creator-contracts/FiltersBar';
import MobileFiltersAccordion from '@/components/creator-contracts/MobileFiltersAccordion';
import DealCard from '@/components/creator-contracts/DealCard';

// Helper function to map old status to new stage
const getDealStage = (deal: BrandDeal): DealStage => {
  if (deal.status === 'Drafting') return 'draft';
  if (deal.status === 'Approved') return 'active';
  if (deal.status === 'Payment Pending') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(deal.payment_expected_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today ? 'overdue' : 'payment_pending';
  }
  if (deal.status === 'Completed') return 'completed';
  if (deal.payment_received_date) return 'paid';
  return 'draft';
};

// Helper to calculate days until due or overdue
const getDueDateStatus = (dueDate: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else {
    return `${diffDays} days left`;
  }
};

const CreatorContracts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, loading: sessionLoading, isCreator } = useSession();
  const creatorId = profile?.id;
  
  // Mobile detection - initialize with actual window width if available
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      setIsMobile(mobile);
      // Debug log (remove in production if needed)
      console.log(`[CreatorContracts] Screen width: ${width}px, isMobile: ${mobile}`);
    };
    // Check immediately
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const [isBrandDealFormOpen, setIsBrandDealFormOpen] = useState(false);
  const [editingBrandDeal, setEditingBrandDeal] = useState<BrandDeal | null>(null);
  const [isMarkPaymentDialogOpen, setIsMarkPaymentDialogOpen] = useState(false);
  const [dealToMarkPaid, setDealToMarkPaid] = useState<BrandDeal | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<DealStage | 'All'>('All');
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('All');
  
  const pageSize = 10;

  // --- Data Hooks ---
  const { data: allBrandDeals, isLoading: isLoadingBrandDeals, error: brandDealsError, refetch: refetchBrandDeals } = useBrandDeals({
    creatorId: creatorId,
    enabled: !sessionLoading && isCreator && !!creatorId,
  });

  // Check if edit param is in URL
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && allBrandDeals) {
      const deal = allBrandDeals.find(d => d.id === editId);
      if (deal) {
        setEditingBrandDeal(deal);
        setIsBrandDealFormOpen(true);
      }
    }
  }, [searchParams, allBrandDeals]);

  const deleteBrandDealMutation = useDeleteBrandDeal();

  useEffect(() => {
    if (brandDealsError) {
      toast.error('Error fetching brand deals', { description: brandDealsError.message });
    }
  }, [brandDealsError]);

  // --- Filtering Logic ---
  const filteredAndSearchedDeals = useMemo(() => {
    if (!allBrandDeals) return [];

    let filtered = [...allBrandDeals];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(deal => 
        deal.brand_name.toLowerCase().includes(searchLower) ||
        deal.deliverables.toLowerCase().includes(searchLower) ||
        deal.deal_amount.toString().includes(searchLower)
      );
    }

    // Brand filter
    if (brandFilter !== 'All') {
      filtered = filtered.filter(deal => deal.brand_name === brandFilter);
    }

    // Status filter (using new stage system)
    if (statusFilter !== 'All') {
      filtered = filtered.filter(deal => getDealStage(deal) === statusFilter);
    }

    // Platform filter
    if (platformFilter !== 'All') {
      filtered = filtered.filter(deal => deal.platform === platformFilter);
    }

    // Date range filter
    if (dateRangeFilter !== 'All') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(deal => {
        const dueDate = new Date(deal.payment_expected_date || deal.due_date);
        dueDate.setHours(0, 0, 0, 0);
        
        switch (dateRangeFilter) {
          case 'today':
            return dueDate.getTime() === today.getTime();
          case 'this_week':
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return dueDate >= today && dueDate <= weekFromNow;
          case 'this_month':
            const monthFromNow = new Date(today);
            monthFromNow.setMonth(monthFromNow.getMonth() + 1);
            return dueDate >= today && dueDate <= monthFromNow;
          case 'this_quarter':
            const quarterFromNow = new Date(today);
            quarterFromNow.setMonth(quarterFromNow.getMonth() + 3);
            return dueDate >= today && dueDate <= quarterFromNow;
          case 'overdue':
            return dueDate < today;
          case 'due_soon':
            const sevenDaysFromNow = new Date(today);
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            return dueDate >= today && dueDate <= sevenDaysFromNow;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [allBrandDeals, searchTerm, brandFilter, statusFilter, platformFilter, dateRangeFilter]);

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

  const handleViewDeal = (deal: BrandDeal) => {
    navigate(`/creator-contracts/${deal.id}`);
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
      toast.success('Deal deleted successfully');
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

  const handleClearFilters = () => {
    setSearchTerm('');
    setBrandFilter('All');
    setStatusFilter('All');
    setPlatformFilter('All');
    setDateRangeFilter('All');
    setCurrentPage(1);
  };

  if (sessionLoading || isLoadingBrandDeals) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading brand deals...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4 md:mb-6">Brand Deals & Contracts</h1>
      {/* Mobile card layout active on screens < 768px */}

      {/* Stats Section */}
      <BrandDealsStats allDeals={allBrandDeals || []} isLoading={isLoadingBrandDeals} />

      <Card className="bg-card border-border/50 mt-6 md:mt-8">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              All Brand Deals ({filteredAndSearchedDeals.length})
            </h2>
            <Button 
              onClick={handleAddBrandDeal} 
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full md:w-auto"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Deal
            </Button>
          </div>

          {/* Mobile Filters Accordion (< 768px) */}
          {isMobile && (
          <div className="mb-6">
            <MobileFiltersAccordion
              searchTerm={searchTerm}
              onSearchChange={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              brandFilter={brandFilter}
              onBrandFilterChange={(value) => {
                setBrandFilter(value);
                setCurrentPage(1);
              }}
              statusFilter={statusFilter}
              onStatusFilterChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              platformFilter={platformFilter}
              onPlatformFilterChange={(value) => {
                setPlatformFilter(value);
                setCurrentPage(1);
              }}
              dateRangeFilter={dateRangeFilter}
              onDateRangeFilterChange={(value) => {
                setDateRangeFilter(value);
                setCurrentPage(1);
              }}
              allDeals={allBrandDeals || []}
              onClearFilters={handleClearFilters}
            />
          </div>
          )}

          {/* Desktop Filters Bar (>= 768px) */}
          {!isMobile && (
          <div className="mb-6">
            <FiltersBar
              searchTerm={searchTerm}
              onSearchChange={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              brandFilter={brandFilter}
              onBrandFilterChange={(value) => {
                setBrandFilter(value);
                setCurrentPage(1);
              }}
              statusFilter={statusFilter}
              onStatusFilterChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              platformFilter={platformFilter}
              onPlatformFilterChange={(value) => {
                setPlatformFilter(value);
                setCurrentPage(1);
              }}
              dateRangeFilter={dateRangeFilter}
              onDateRangeFilterChange={(value) => {
                setDateRangeFilter(value);
                setCurrentPage(1);
              }}
              allDeals={allBrandDeals || []}
              onClearFilters={handleClearFilters}
            />
          </div>
          )}

          {/* Mobile Card Layout (< 768px) */}
          {paginatedDeals.length > 0 ? (
            <>
              {/* Mobile Cards - visible on screens < 768px */}
              {isMobile ? (
              <div className="flex flex-col w-full" data-mobile-view="true">
                {paginatedDeals.map((deal) => {
                  const stage = getDealStage(deal);
                  const dueDateStatus = getDueDateStatus(deal.payment_expected_date || deal.due_date);
                  const isOverdue = stage === 'overdue';

                  return (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      stage={stage}
                      dueDateStatus={dueDateStatus}
                      isOverdue={isOverdue}
                      onView={handleViewDeal}
                      onEdit={handleEditBrandDeal}
                      onMarkPaid={handleMarkPaymentReceived}
                      onDelete={handleDeleteBrandDeal}
                      isDeleting={deleteBrandDealMutation.isPending && deleteBrandDealMutation.variables?.id === deal.id}
                    />
                  );
                })}
              </div>
              ) : null}

              {/* Desktop Table Layout - visible on screens >= 768px */}
              {!isMobile ? (
              <div className="block overflow-x-auto -mx-6 px-6 overflow-visible w-full" data-desktop-view="true">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="text-muted-foreground min-w-[150px]">Brand</TableHead>
                      <TableHead className="text-muted-foreground min-w-[100px]">Amount</TableHead>
                      <TableHead className="text-muted-foreground hidden md:table-cell min-w-[100px]">Platform</TableHead>
                      <TableHead className="text-muted-foreground hidden lg:table-cell min-w-[150px]">Deliverables</TableHead>
                      <TableHead className="text-muted-foreground min-w-[110px] md:min-w-[130px]">Stage</TableHead>
                      <TableHead className="text-muted-foreground hidden sm:table-cell min-w-[130px]">Due Date Status</TableHead>
                      <TableHead className="text-right text-muted-foreground min-w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDeals.map((deal) => {
                      const stage = getDealStage(deal);
                      const dueDateStatus = getDueDateStatus(deal.payment_expected_date || deal.due_date);
                      const isOverdue = stage === 'overdue';

                      return (
                        <TableRow 
                          key={deal.id} 
                          className={cn(
                            "border-border/50 cursor-pointer hover:bg-accent/30 transition-colors",
                            isOverdue && 'bg-red-500/5'
                          )}
                          onClick={() => handleViewDeal(deal)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <BrandLogo 
                                brandName={deal.brand_name} 
                                brandLogo={null}
                                size="sm"
                              />
                              <span className="font-medium text-foreground">{deal.brand_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground">
                            ₹{deal.deal_amount.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden md:table-cell">
                            {deal.platform || 'N/A'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <DeliverablesBadge deliverables={deal.deliverables} maxDisplay={2} />
                          </TableCell>
                          <TableCell className="overflow-visible min-w-[110px] md:min-w-[130px]">
                            <DealStatusBadge stage={stage} />
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge 
                              variant={isOverdue ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {dueDateStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DealActionsMenu
                              deal={deal}
                              onView={handleViewDeal}
                              onEdit={handleEditBrandDeal}
                              onMarkPaid={handleMarkPaymentReceived}
                              onDelete={handleDeleteBrandDeal}
                              isDeleting={deleteBrandDealMutation.isPending && deleteBrandDealMutation.variables?.id === deal.id}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              ) : null}

              {/* Pagination */}
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-6">
                <div className="order-2 md:order-1">
                  <Button
                    variant="outline"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || isLoadingBrandDeals}
                    className="text-foreground border-border/50 hover:bg-accent/50 w-full md:w-auto"
                  >
                    Previous
                  </Button>
                </div>
                <span className="order-1 md:order-2 text-sm text-muted-foreground text-center">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="order-3">
                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || isLoadingBrandDeals}
                    className="text-foreground border-border/50 hover:bg-accent/50 w-full md:w-auto"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No brand deals found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brand Deal Form Dialog */}
      <Dialog open={isBrandDealFormOpen} onOpenChange={setIsBrandDealFormOpen}>
        <DialogContent 
          className="sm:max-w-[600px] bg-card text-foreground border-border/50 h-[90vh] flex flex-col"
          aria-labelledby="brand-deal-form-title"
          aria-describedby="brand-deal-form-description"
        >
          <DialogHeader>
            <DialogTitle id="brand-deal-form-title">
              {editingBrandDeal ? 'Edit Brand Deal' : 'Add New Brand Deal'}
            </DialogTitle>
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
          className="sm:max-w-[425px] bg-card text-foreground border-border/50"
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
    </div>
  );
};

export default CreatorContracts;
