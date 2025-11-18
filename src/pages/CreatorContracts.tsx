"use client";

import { useState, useEffect, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { useBrandDeals, useDeleteBrandDeal } from '@/lib/hooks/useBrandDeals';
import { usePagination } from '@/lib/hooks/usePagination';
import { BrandDeal } from '@/types';
import BrandDealForm from '@/components/forms/BrandDealForm';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, openContractFile } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import DealStatusBadge, { DealStage } from '@/components/creator-contracts/DealStatusBadge';
import DealActionsMenu from '@/components/creator-contracts/DealActionsMenu';
import BrandLogo from '@/components/creator-contracts/BrandLogo';
import DeliverablesBadge from '@/components/creator-contracts/DeliverablesBadge';
import FiltersBar from '@/components/creator-contracts/FiltersBar';
import MobileFiltersAccordion from '@/components/creator-contracts/MobileFiltersAccordion';
import DealsHeader from '@/components/creator-contracts/DealsHeader';
import QuickFilterChips from '@/components/creator-contracts/QuickFilterChips';
import ProjectDealCard from '@/components/creator-contracts/ProjectDealCard';
import EmptyDealsState from '@/components/creator-contracts/EmptyDealsState';
import { PaymentStatus } from '@/components/creator-contracts/DealStatusBadge';

// Helper function to map old status to new project-focused stage
const getDealStage = (deal: BrandDeal): DealStage => {
  // Project-focused stages
  if (deal.status === 'Drafting') return 'draft';
  if (deal.status === 'Approved' && !deal.payment_received_date) {
    // Check if deliverables are due
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(deal.due_date || deal.payment_expected_date);
    dueDate.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 0) return 'deliverables_due';
    if (daysUntilDue <= 7) return 'deliverables_due';
    return 'in_progress';
  }
  // If payment is pending but deliverables are done, it's in review
  if (deal.status === 'Payment Pending' && deal.payment_received_date === null) {
    return 'review_pending';
  }
  if (deal.status === 'Completed' || deal.payment_received_date) return 'completed';
  return 'draft';
};

// Helper to get payment status (secondary info)
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
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<DealStage | 'All'>('All');
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('All');
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
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

    // Quick filter (applied first)
    if (quickFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (quickFilter) {
        case 'active':
          filtered = filtered.filter(deal => {
            const stage = getDealStage(deal);
            return stage === 'in_progress' || stage === 'awaiting_approval';
          });
          break;
        case 'pending_payment':
          filtered = filtered.filter(deal => {
            const paymentStatus = getPaymentStatus(deal);
            return paymentStatus === 'pending' || paymentStatus === 'overdue';
          });
          break;
        case 'expiring_soon':
          const sevenDaysFromNow = new Date(today);
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
          filtered = filtered.filter(deal => {
            const dueDate = new Date(deal.payment_expected_date || deal.due_date);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate >= today && dueDate <= sevenDaysFromNow;
          });
          break;
        case 'completed':
          filtered = filtered.filter(deal => {
            const stage = getDealStage(deal);
            return stage === 'completed';
          });
          break;
        default:
          break;
      }
    }

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
  }, [allBrandDeals, searchTerm, brandFilter, statusFilter, platformFilter, dateRangeFilter, quickFilter]);

  const { currentPage, totalPages, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
    totalCount: filteredAndSearchedDeals.length,
    pageSize: pageSize,
  });

  const paginatedDeals = filteredAndSearchedDeals.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Debug: Check what's actually rendered after state updates
  useEffect(() => {
    if (paginatedDeals.length > 0) {
      setTimeout(() => {
        const mobileView = document.querySelector('[data-mobile-view="true"]');
        const desktopView = document.querySelector('[data-desktop-view="true"]');
        console.log(`[CreatorContracts Debug] isMobile=${isMobile}, Mobile view: ${mobileView ? 'RENDERED' : 'NOT RENDERED'}, Desktop view: ${desktopView ? 'RENDERED' : 'NOT RENDERED'}`);
      }, 100);
    }
  }, [isMobile, paginatedDeals.length]);

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

  const handleClearFilters = () => {
    setSearchTerm('');
    setBrandFilter('All');
    setStatusFilter('All');
    setPlatformFilter('All');
    setDateRangeFilter('All');
    setQuickFilter(null);
    setCurrentPage(1);
  };

  const handleExport = () => {
    toast.info('Export feature coming soon!');
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
    <div className="w-full max-w-full overflow-x-hidden pb-[80px] px-4 md:px-6 antialiased">
      {/* New Header with Quick Stats */}
      <div className="mb-6">
        <DealsHeader
          allDeals={allBrandDeals || []}
          onAddDeal={handleAddBrandDeal}
          onExport={handleExport}
          onFilterClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        />
      </div>

      {/* Quick Filter Chips */}
      {allBrandDeals && allBrandDeals.length > 0 && (
        <div className="mb-6">
          <QuickFilterChips
            allDeals={allBrandDeals}
            activeFilter={quickFilter}
            onFilterChange={(filter) => {
              setQuickFilter(filter);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Old Quick Filter Chips - Keep for backward compatibility */}
      {allBrandDeals && allBrandDeals.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant={dateRangeFilter === 'due_soon' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setDateRangeFilter(dateRangeFilter === 'due_soon' ? 'All' : 'due_soon');
              setCurrentPage(1);
            }}
            className="text-xs h-7"
          >
            Expiring Soon
          </Button>
          <Button
            variant={dateRangeFilter === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setDateRangeFilter(dateRangeFilter === 'overdue' ? 'All' : 'overdue');
              setCurrentPage(1);
            }}
            className="text-xs h-7"
          >
            Overdue
          </Button>
          <Button
            variant={statusFilter === 'deliverables_due' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter(statusFilter === 'deliverables_due' ? 'All' : 'deliverables_due');
              setCurrentPage(1);
            }}
            className="text-xs h-7"
          >
            Deliverables Due
          </Button>
          <Button
            variant={statusFilter === 'draft' || statusFilter === 'in_progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (statusFilter === 'draft' || statusFilter === 'in_progress') {
                setStatusFilter('All');
              } else {
                setStatusFilter('in_progress');
              }
              setCurrentPage(1);
            }}
            className="text-xs h-7"
          >
            In Progress
          </Button>
        </div>
      )}

      {/* Main Content Card */}
      <Card className="bg-card border-border/40 shadow-sm">
        <CardContent className="p-4 md:p-6">
          {/* Header Section - text-lg on mobile per design system */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-4 md:mt-8 mb-4">
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

          {/* Mobile Filters Accordion (< 768px) - gap-4 spacing */}
          {isMobile && (
          <div className="mb-4">
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

          {/* Desktop Filters Bar (>= 768px) - gap-4 spacing */}
          {!isMobile && (
          <div className="mb-4">
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

          {/* Empty State */}
          {paginatedDeals.length === 0 && allBrandDeals && allBrandDeals.length === 0 ? (
            <EmptyDealsState
              onAddDeal={handleAddBrandDeal}
            />
          ) : paginatedDeals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No brand deals found matching your criteria.</p>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              {/* Project-Focused Deal Cards - Grid Layout */}
              <div className={cn(
                "grid gap-4 mb-6",
                isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              )}>
                {paginatedDeals.map((deal) => {
                  const stage = getDealStage(deal);
                  const paymentStatus = getPaymentStatus(deal);

                  return (
                    <ProjectDealCard
                      key={deal.id}
                      deal={deal}
                      stage={stage}
                      paymentStatus={paymentStatus}
                      onView={handleViewDeal}
                      onEdit={handleEditBrandDeal}
                      onManageDeliverables={(deal) => {
                        toast.info('Deliverables management coming soon!');
                        // Navigate to deal detail page with deliverables tab
                        navigate(`/creator-contracts/${deal.id}?tab=deliverables`);
                      }}
                      onUploadContent={(deal) => {
                        toast.info('Content upload coming soon!');
                        // Navigate to deal detail page with upload tab
                        navigate(`/creator-contracts/${deal.id}?tab=upload`);
                      }}
                      onContactBrand={(deal) => {
                        navigate('/messages');
                        toast.info(`Opening messages to contact ${deal.brand_name}`);
                      }}
                      onViewContract={(deal) => {
                        openContractFile(deal.contract_file_url, (error) => {
                          toast.error(error);
                        });
                      }}
                      onDelete={handleDeleteBrandDeal}
                      isDeleting={deleteBrandDealMutation.isPending && deleteBrandDealMutation.variables?.id === deal.id}
                    />
                  );
                })}
              </div>

              {/* Desktop Table Layout - visible on screens >= 768px */}
              {!isMobile ? (
              <div className="w-full overflow-x-auto" data-desktop-view="true">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="text-sm font-semibold text-muted-foreground h-12 px-4">Brand</TableHead>
                      <TableHead className="text-sm font-semibold text-muted-foreground h-12 px-4">Amount</TableHead>
                      <TableHead className="text-sm font-semibold text-muted-foreground h-12 px-4 hidden md:table-cell">Platform</TableHead>
                      <TableHead className="text-sm font-semibold text-muted-foreground h-12 px-4 hidden lg:table-cell">Deliverables</TableHead>
                      <TableHead className="text-sm font-semibold text-muted-foreground h-12 px-4">Stage</TableHead>
                      <TableHead className="text-sm font-semibold text-muted-foreground h-12 px-4 hidden sm:table-cell">Due Date Status</TableHead>
                      <TableHead className="text-sm font-semibold text-muted-foreground h-12 px-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDeals.map((deal) => {
                      const stage = getDealStage(deal);
                      const paymentStatus = getPaymentStatus(deal);
                      const dueDateStatus = getDueDateStatus(deal.payment_expected_date || deal.due_date);
                      const isOverdue = paymentStatus === 'overdue';

                      return (
                        <TableRow 
                          key={deal.id} 
                          className={cn(
                            "border-border/40 cursor-pointer hover:bg-accent/20 transition-colors",
                            isOverdue && 'bg-red-500/5'
                          )}
                          onClick={() => handleViewDeal(deal)}
                        >
                          <TableCell className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <BrandLogo 
                                brandName={deal.brand_name} 
                                brandLogo={null}
                                size="sm"
                              />
                              <span className="font-medium text-base text-foreground">{deal.brand_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <span className="text-base font-semibold text-foreground">
                              ₹{deal.deal_amount.toLocaleString('en-IN')}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-4 text-muted-foreground hidden md:table-cell">
                            <span className="text-sm">{deal.platform || 'N/A'}</span>
                          </TableCell>
                          <TableCell className="px-4 py-4 hidden lg:table-cell">
                            <DeliverablesBadge deliverables={deal.deliverables} maxDisplay={2} />
                          </TableCell>
                          <TableCell className="px-4 py-4 overflow-visible">
                            <DealStatusBadge stage={stage} />
                          </TableCell>
                          <TableCell className="px-4 py-4 hidden sm:table-cell">
                            <Badge 
                              variant={isOverdue ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {dueDateStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <DealActionsMenu
                              deal={deal}
                              onView={handleViewDeal}
                              onEdit={handleEditBrandDeal}
                              onManageDeliverables={(deal) => {
                                toast.info('Deliverables management coming soon!');
                                navigate(`/creator-contracts/${deal.id}?tab=deliverables`);
                              }}
                              onUploadContent={(deal) => {
                                toast.info('Content upload coming soon!');
                                navigate(`/creator-contracts/${deal.id}?tab=upload`);
                              }}
                              onContactBrand={(deal) => {
                                navigate('/messages');
                                toast.info('Opening messages to contact brand');
                              }}
                              onViewContract={(deal) => {
                                openContractFile(deal.contract_file_url, (error) => {
                                  toast.error(error);
                                });
                              }}
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

              {/* Pagination - Load More or Previous/Next */}
              {totalPages > 1 && (
                <div className="flex flex-col md:flex-row justify-center items-center gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || isLoadingBrandDeals}
                    className="w-full md:w-auto"
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
                    className="w-full md:w-auto"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Brand Deal Form Dialog */}
      <Dialog open={isBrandDealFormOpen} onOpenChange={setIsBrandDealFormOpen}>
        <DialogContent 
          className="sm:max-w-[600px] bg-card text-foreground border-border/40 rounded-xl shadow-lg backdrop-blur-sm h-[90vh] flex flex-col"
          aria-labelledby="brand-deal-form-title"
          aria-describedby="brand-deal-form-description"
        >
          <DialogHeader className="space-y-2">
            <DialogTitle id="brand-deal-form-title" className="text-xl font-semibold">
              {editingBrandDeal ? 'Edit Brand Deal' : 'Add New Brand Deal'}
            </DialogTitle>
            <DialogDescription id="brand-deal-form-description" className="text-sm text-muted-foreground">
              {editingBrandDeal ? 'Update the details for this brand collaboration.' : 'Enter the details for your new brand collaboration.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 p-4">
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

    </div>
  );
};

export default CreatorContracts;
