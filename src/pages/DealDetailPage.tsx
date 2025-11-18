"use client";

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, IndianRupee, FileText, ReceiptText, CheckCircle2 } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { BrandDeal } from '@/types';
import BrandLogo from '@/components/creator-contracts/BrandLogo';
import DealStatusBadge, { DealStage } from '@/components/creator-contracts/DealStatusBadge';
import { cn } from '@/lib/utils';
import MarkPaymentReceivedDialog from '@/components/creator-contracts/MarkPaymentReceivedDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

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
const getDueDateStatus = (dueDate: string): { text: string; variant: 'default' | 'destructive' | 'secondary' } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)} days overdue`, variant: 'destructive' };
  } else if (diffDays === 0) {
    return { text: 'Due today', variant: 'destructive' };
  } else if (diffDays <= 7) {
    return { text: `${diffDays} days left`, variant: 'secondary' };
  } else {
    return { text: `${diffDays} days left`, variant: 'default' };
  }
};

const DealDetailPage: React.FC = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const { profile, isCreator } = useSession();
  const creatorId = profile?.id;

  const [isMarkPaymentDialogOpen, setIsMarkPaymentDialogOpen] = useState(false);

  const { data: allBrandDeals, isLoading, refetch } = useBrandDeals({
    creatorId: creatorId,
    enabled: !!creatorId && isCreator,
  });

  const deal = useMemo(() => {
    return allBrandDeals?.find(d => d.id === dealId) || null;
  }, [allBrandDeals, dealId]);

  const stage = deal ? getDealStage(deal) : 'draft';
  const dueDateStatus = deal ? getDueDateStatus(deal.payment_expected_date || deal.due_date) : null;

  // Parse deliverables
  const deliverables = useMemo(() => {
    if (!deal) return [];
    try {
      if (typeof deal.deliverables === 'string') {
        const parsed = JSON.parse(deal.deliverables);
        return Array.isArray(parsed) ? parsed : [deal.deliverables];
      }
      return Array.isArray(deal.deliverables) ? deal.deliverables : [deal.deliverables];
    } catch {
      return typeof deal.deliverables === 'string' 
        ? deal.deliverables.split(',').map(d => d.trim())
        : [];
    }
  }, [deal]);

  if (isLoading) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading deal details...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <p className="text-muted-foreground">Deal not found</p>
        <Button onClick={() => navigate('/creator-contracts')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Deals
        </Button>
      </div>
    );
  }

  const handlePaymentSuccess = () => {
    refetch();
    setIsMarkPaymentDialogOpen(false);
    toast.success('Payment marked as received');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/creator-contracts')}
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <BrandLogo brandName={deal.brand_name} brandLogo={null} size="lg" className="flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{deal.brand_name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <DealStatusBadge stage={stage} />
                {dueDateStatus && (
                  <Badge variant={dueDateStatus.variant} className="text-xs">
                    {dueDateStatus.text}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button
          onClick={() => navigate(`/creator-contracts?edit=${deal.id}`)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto flex-shrink-0"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Deal
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deal Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{deal.deal_amount.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payment Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-foreground">
              {new Date(deal.payment_expected_date || deal.due_date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
            {dueDateStatus && (
              <Badge variant={dueDateStatus.variant} className="mt-2 text-xs">
                {dueDateStatus.text}
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-foreground">
              {deal.platform || 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-foreground">
              {new Date(deal.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          <TabsTrigger value="payment">Payment History</TabsTrigger>
          <TabsTrigger value="contract">Contract</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Brand Name</label>
                  <p className="text-foreground font-semibold mt-1">{deal.brand_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                  <p className="text-foreground font-semibold mt-1">{deal.contact_person || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Brand Email</label>
                  <p className="text-foreground font-semibold mt-1">{deal.brand_email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Platform</label>
                  <p className="text-foreground font-semibold mt-1">{deal.platform || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Deal Amount</label>
                  <p className="text-foreground font-semibold mt-1">
                    ₹{deal.deal_amount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <DealStatusBadge stage={stage} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deliverables Tab */}
        <TabsContent value="deliverables" className="space-y-4">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>Deliverables</CardTitle>
              <CardDescription>List of deliverables for this deal</CardDescription>
            </CardHeader>
            <CardContent>
              {deliverables.length > 0 ? (
                <div className="space-y-2">
                  {deliverables.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No deliverables specified</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Payment details and transaction history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-semibold text-foreground">Expected Payment</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(deal.payment_expected_date || deal.due_date).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      ₹{deal.deal_amount.toLocaleString('en-IN')}
                    </p>
                    <Badge variant={stage === 'paid' || stage === 'completed' ? 'default' : 'secondary'}>
                      {stage === 'paid' || stage === 'completed' ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                </div>

                {deal.payment_received_date && (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div>
                      <p className="font-semibold text-foreground">Payment Received</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(deal.payment_received_date).toLocaleDateString('en-IN')}
                      </p>
                      {deal.utr_number && (
                        <p className="text-xs text-muted-foreground mt-1">UTR: {deal.utr_number}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-400">
                        ₹{deal.deal_amount.toLocaleString('en-IN')}
                      </p>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Paid
                      </Badge>
                    </div>
                  </div>
                )}

                {stage === 'payment_pending' || stage === 'overdue' ? (
                  <Button
                    onClick={() => setIsMarkPaymentDialogOpen(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <IndianRupee className="mr-2 h-4 w-4" />
                    Mark Payment as Received
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contract Tab */}
        <TabsContent value="contract" className="space-y-4">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>Contract Documents</CardTitle>
              <CardDescription>Contract and invoice files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deal.contract_file_url ? (
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">Contract Document</p>
                      <p className="text-sm text-muted-foreground">View or download the contract</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      const { openContractFile } = await import('@/lib/utils');
                      openContractFile(deal.contract_file_url, (error) => {
                        toast.error(error);
                      });
                    }}
                  >
                    View
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">No contract document uploaded</p>
              )}

              {deal.invoice_file_url ? (
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <ReceiptText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">Invoice Document</p>
                      <p className="text-sm text-muted-foreground">View or download the invoice</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={deal.invoice_file_url} target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">No invoice document uploaded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Additional notes and comments about this deal</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notes feature coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mark Payment Dialog */}
      <Dialog open={isMarkPaymentDialogOpen} onOpenChange={setIsMarkPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border">
          <DialogHeader>
            <DialogTitle>Mark Payment Received</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Confirm the payment details for this deal.
            </DialogDescription>
          </DialogHeader>
          <MarkPaymentReceivedDialog
            deal={deal}
            onSaveSuccess={handlePaymentSuccess}
            onClose={() => setIsMarkPaymentDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DealDetailPage;

