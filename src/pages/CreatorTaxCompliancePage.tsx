"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarDays, FileText, IndianRupee, Calculator, CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals'; // To get income data
import { usePagination } from '@/lib/hooks/usePagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label'; // <-- ADDED IMPORT

interface TaxFiling {
  id: string;
  type: string;
  dueDate: string;
  status: 'Pending' | 'Filed' | 'Overdue';
  amount?: number;
  details?: string;
}

const CreatorTaxCompliancePage = () => {
  const { profile, loading: sessionLoading, isCreator } = useSession();
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Filed' | 'Overdue'>('All');
  const pageSize = 10;

  const { data: brandDealsData, isLoading: isLoadingBrandDeals, error: brandDealsError } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !sessionLoading && isCreator && !!profile?.id,
    statusFilter: 'Completed', // Only consider completed deals for income
  });

  const totalIncome = useMemo(() => {
    return brandDealsData?.reduce((sum, deal) => sum + deal.deal_amount, 0) || 0;
  }, [brandDealsData]);

  // Mock tax filings and deadlines
  const mockTaxFilings: TaxFiling[] = useMemo(() => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);

    return [
      {
        id: 'gst-q4-2024',
        type: 'GST Q4 Filing',
        dueDate: new Date(today.getFullYear(), 11, 20).toISOString().split('T')[0], // Dec 20 current year
        status: 'Pending',
        details: 'Quarterly GST return for Oct-Dec',
      },
      {
        id: 'itr-2024',
        type: 'Annual ITR Filing',
        dueDate: new Date(today.getFullYear() + 1, 6, 31).toISOString().split('T')[0], // July 31 next year
        status: 'Pending',
        details: 'Income Tax Return for FY 2024-25',
      },
      {
        id: 'tds-q3-2024',
        type: 'TDS Q3 Payment',
        dueDate: new Date(today.getFullYear(), 10, 15).toISOString().split('T')[0], // Nov 15 current year
        status: 'Filed',
        details: 'TDS payment for Oct-Dec',
      },
      {
        id: 'gst-q3-2024',
        type: 'GST Q3 Filing',
        dueDate: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 20).toISOString().split('T')[0],
        status: 'Overdue',
        details: 'Quarterly GST return for Jul-Sep',
      },
    ].map(filing => {
      const dueDate = new Date(filing.dueDate);
      if (filing.status === 'Pending' && dueDate < today) {
        return { ...filing, status: 'Overdue' as const };
      }
      return filing;
    });
  }, []);

  const filteredFilings = useMemo(() => {
    if (filterStatus === 'All') return mockTaxFilings;
    return mockTaxFilings.filter(filing => filing.status === filterStatus);
  }, [mockTaxFilings, filterStatus]);

  const { currentPage, totalPages, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
    totalCount: filteredFilings.length,
    pageSize: pageSize,
  });

  const paginatedFilings = filteredFilings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (brandDealsError) {
      toast.error('Error fetching income data', { description: brandDealsError.message });
    }
  }, [brandDealsError]);

  const getStatusBadgeVariant = (status: TaxFiling['status']) => {
    switch (status) {
      case 'Filed': return 'success';
      case 'Pending': return 'secondary';
      case 'Overdue': return 'destructive';
      default: return 'outline';
    }
  };

  if (sessionLoading || isLoadingBrandDeals) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading tax and compliance data...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">My Taxes & Compliance</h1>

      <section className="bg-card p-6 rounded-lg shadow-sm border border-border mb-8">
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
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Calculator className="h-5 w-5 mr-2 text-yellow-500" /> Tax Filings & Deadlines
        </h2>
        <div className="mb-6 flex items-center space-x-4">
          <Label htmlFor="status-filter" className="text-foreground">Filter by Status:</Label>
          <Select onValueChange={(value: 'All' | 'Pending' | 'Filed' | 'Overdue') => {
            setFilterStatus(value);
            setCurrentPage(1);
          }} value={filterStatus}>
            <SelectTrigger id="status-filter" className="w-[180px] bg-input text-foreground border-border">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Filed">Filed</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paginatedFilings.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Filing Type</TableHead>
                  <TableHead className="text-muted-foreground">Due Date</TableHead>
                  <TableHead className="text-muted-foreground">Details</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFilings.map((filing) => (
                  <TableRow key={filing.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{filing.type}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center">
                        {new Date(filing.dueDate).toLocaleDateString()}
                        {filing.status === 'Overdue' && (
                          <AlertTriangle className="h-4 w-4 text-destructive ml-2" title="Overdue" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{filing.details}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(filing.status)}>
                        {filing.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {filing.status === 'Pending' || filing.status === 'Overdue' ? (
                        <Button variant="default" size="sm" onClick={() => toast.info('Feature coming soon!', { description: 'File your taxes with our CA team.' })}>
                          <FileText className="h-4 w-4 mr-1" /> File Now
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          <CheckCircle className="h-4 w-4 mr-1" /> Filed
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
          <p className="text-muted-foreground text-center py-8">No tax filings or deadlines found.</p>
        )}
      </section>
    </>
  );
};

export default CreatorTaxCompliancePage;