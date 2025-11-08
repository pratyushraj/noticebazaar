"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarDays, FileText, IndianRupee, Calculator, CheckCircle, AlertTriangle, Settings, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals'; // To get income data
import { usePagination } from '@/lib/hooks/usePagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TaxFiling, TaxSetting } from '@/types';
import { useTaxFilings, useUpdateTaxFiling } from '@/lib/hooks/useTaxFilings';
import { useTaxSettings, useUpsertTaxSettings } from '@/lib/hooks/useTaxSettings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import FilingUploadForm from '@/components/creator-tax/FilingUploadForm'; // NEW: Import the new form
import TaxProfileSetupForm from '@/components/creator-tax/TaxProfileSetupForm'; // NEW: Import the new setup form

const CreatorTaxCompliancePage = () => {
  const { profile, loading: sessionLoading, isCreator } = useSession();
  const creatorId = profile?.id;
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Filed' | 'Overdue'>('All');
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false); // NEW: State for upload dialog
  const [selectedFiling, setSelectedFiling] = useState<TaxFiling | null>(null); // NEW: State for selected filing
  const pageSize = 10;

  // --- Data Hooks ---
  const { data: brandDealsData, isLoading: isLoadingBrandDeals } = useBrandDeals({
    creatorId: creatorId,
    enabled: !sessionLoading && isCreator && !!creatorId,
    statusFilter: 'Completed', // Only consider completed deals for income
  });

  const { data: taxFilingsData, isLoading: isLoadingFilings, error: filingsError } = useTaxFilings({
    creatorId: creatorId,
    enabled: !sessionLoading && isCreator && !!creatorId,
    statusFilter: filterStatus,
  });

  const { data: taxSettings, isLoading: isLoadingSettings, refetch: refetchTaxSettings } = useTaxSettings({
    creatorId: creatorId,
    enabled: !sessionLoading && isCreator && !!creatorId,
  });

  const updateFilingMutation = useUpdateTaxFiling();

  // --- Derived Data ---
  const totalIncome = useMemo(() => {
    return brandDealsData?.reduce((sum, deal) => sum + deal.deal_amount, 0) || 0;
  }, [brandDealsData]);

  const estimatedTaxRate = taxSettings?.gst_rate || 0.18; // Use GST rate as a proxy for estimated tax liability
  const estimatedTaxLiability = totalIncome * estimatedTaxRate;

  const allFilings = taxFilingsData || [];

  const { currentPage, totalPages, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
    totalCount: allFilings.length,
    pageSize: pageSize,
  });

  const paginatedFilings = allFilings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (filingsError) {
      toast.error('Error fetching tax filings', { description: filingsError.message });
    }
  }, [filingsError]);

  // --- Handlers ---
  const handleOpenUploadDialog = (filing: TaxFiling) => { // NEW: Open dialog instead of direct mutation
    setSelectedFiling(filing);
    setIsUploadDialogOpen(true);
  };

  const handleUploadSuccess = () => { // NEW: Handler to close dialog and refetch
    setIsUploadDialogOpen(false);
    setSelectedFiling(null);
    // Refetch filings to update the table status
    // Invalidation is handled by the mutation hook
  };
  
  const handleSettingsSaveSuccess = () => {
    refetchTaxSettings(); // Refetch settings to update the dashboard view
  };

  const getStatusBadgeVariant = (status: TaxFiling['status']) => {
    switch (status) {
      case 'Filed': return 'success';
      case 'Pending': return 'secondary';
      case 'Overdue': return 'destructive';
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

  if (sessionLoading || isLoadingBrandDeals || isLoadingFilings || isLoadingSettings) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading tax and compliance data...</p>
      </div>
    );
  }
  
  if (!profile) return null;

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">My Taxes & Compliance</h1>

      <section className="bg-card p-6 rounded-lg shadow-sm border border-border mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center">
            <IndianRupee className="h-5 w-5 mr-2 text-green-500" /> Financial Overview
          </h2>
          <Button variant="outline" size="sm" onClick={() => setIsSettingsDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" /> Tax Profile Setup
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col p-4 rounded-lg bg-secondary border border-border">
            <p className="text-sm text-muted-foreground">Total Income Tracked (Completed Deals)</p>
            <p className="text-3xl font-bold text-foreground mt-1">₹{totalIncome.toLocaleString('en-IN')}</p>
          </div>
          <div className="flex flex-col p-4 rounded-lg bg-secondary border border-border">
            <p className="text-sm text-muted-foreground">Estimated Tax Liability (GST @ {Math.round(estimatedTaxRate * 100)}%)</p>
            <p className="text-3xl font-bold text-foreground mt-1">₹{estimatedTaxLiability.toLocaleString('en-IN')}</p>
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

        {allFilings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No tax filings found. If you are a new user, please contact your CA to set up your compliance calendar.</p>
            <Button variant="default" onClick={() => toast.info('Feature coming soon!', { description: 'This will open a form to request CA setup.' })}>
              Request CA Setup
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Filing Type</TableHead>
                  <TableHead className="text-muted-foreground">Due Date</TableHead>
                  <TableHead className="text-muted-foreground">Period</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFilings.map((filing) => (
                  <TableRow key={filing.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{filing.filing_type.toUpperCase().replace(/_/g, ' ')}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center">
                        {new Date(filing.due_date).toLocaleDateString()}
                        {filing.status === 'Overdue' && (
                          <AlertTriangle className="h-4 w-4 text-destructive ml-2" title="Overdue" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(filing.period_start).toLocaleDateString()} - {new Date(filing.period_end).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(filing.status)}>
                        {filing.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                      {filing.filing_document_url && (
                        <Button variant="outline" size="sm" asChild className="text-primary border-border hover:bg-accent hover:text-foreground">
                          <a href={filing.filing_document_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {filing.status === 'Pending' || filing.status === 'Overdue' ? (
                        <Button variant="default" size="sm" onClick={() => handleOpenUploadDialog(filing)} disabled={updateFilingMutation.isPending}>
                          {updateFilingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />} File Now
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
                disabled={currentPage === 1 || isLoadingFilings}
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
                disabled={currentPage === totalPages || isLoadingFilings}
                className="text-primary border-border hover:bg-accent hover:text-foreground"
              >
                Next
              </Button>
            </div>
          </>
        )}
      </section>

      {/* Tax Settings Dialog */}
      <TaxSettingsDialog 
        isOpen={isSettingsDialogOpen} 
        onClose={() => setIsSettingsDialogOpen(false)} 
        initialSettings={taxSettings}
        initialProfile={profile}
        onSaveSuccess={handleSettingsSaveSuccess}
      />
      
      {/* NEW: Upload Filing Document Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent 
          className="sm:max-w-[425px] bg-card text-foreground border-border"
          aria-labelledby="upload-filing-title"
          aria-describedby="upload-filing-description"
        >
          <DialogHeader>
            <DialogTitle id="upload-filing-title">Upload Filing Document</DialogTitle>
            <DialogDescription id="upload-filing-description" className="text-muted-foreground">
              Upload the official document (e.g., acknowledgement receipt) for this tax filing.
            </DialogDescription>
          </DialogHeader>
          {selectedFiling && (
            <FilingUploadForm
              filing={selectedFiling}
              onUploadSuccess={handleUploadSuccess}
              onClose={() => setIsUploadDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreatorTaxCompliancePage;


// --- Tax Settings Dialog Component ---

interface TaxSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings: TaxSetting | null;
  initialProfile: Profile;
  onSaveSuccess: () => void;
}

const TaxSettingsDialog: React.FC<TaxSettingsDialogProps> = ({ isOpen, onClose, initialSettings, initialProfile, onSaveSuccess }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border">
        <DialogHeader>
          <DialogTitle>Tax Profile Setup</DialogTitle>
          <DialogDescription>
            Configure your business identity and estimated tax rates.
          </DialogDescription>
        </DialogHeader>
        <TaxProfileSetupForm
          initialProfile={initialProfile}
          initialTaxSettings={initialSettings}
          onSaveSuccess={onSaveSuccess}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};