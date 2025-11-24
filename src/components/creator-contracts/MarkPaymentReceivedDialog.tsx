"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, IndianRupee, CalendarDays, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DialogFooter } from '@/components/ui/dialog';
import { BrandDeal } from '@/types';
import { useUpdateBrandDeal } from '@/lib/hooks/useBrandDeals';
import { useSession } from '@/contexts/SessionContext';
import { triggerConfetti } from '@/lib/utils/confetti';
import { triggerHaptic } from '@/lib/utils/haptics';

interface MarkPaymentReceivedDialogProps {
  deal: BrandDeal;
  onSaveSuccess: () => void;
  onClose: () => void;
}

const MarkPaymentReceivedDialog: React.FC<MarkPaymentReceivedDialogProps> = ({ deal, onSaveSuccess, onClose }) => {
  const { profile } = useSession();
  const [utrNumber, setUtrNumber] = useState(deal.utr_number || '');
  const [paymentReceivedDate, setPaymentReceivedDate] = useState(deal.payment_received_date ? deal.payment_received_date.split('T')[0] : new Date().toISOString().split('T')[0]);

  const updateBrandDealMutation = useUpdateBrandDeal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) {
      toast.error('Creator profile not found.');
      return;
    }

    if (!paymentReceivedDate) {
        toast.error('Payment received date is required.');
        return;
    }

    try {
      await updateBrandDealMutation.mutateAsync({
        id: deal.id,
        creator_id: profile.id,
        status: 'Completed', // Force status to Completed
        utr_number: utrNumber.trim() || null,
        payment_received_date: paymentReceivedDate,
        // Pass original file URLs to prevent accidental deletion if they exist
        original_contract_file_url: deal.contract_file_url,
        original_invoice_file_url: deal.invoice_file_url,
      });
      
      toast.success(`Payment for ${deal.brand_name} marked as received!`);
      triggerConfetti({ type: 'celebration' });
      triggerHaptic([50, 30, 50]);
      onSaveSuccess();
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  const isSubmitting = updateBrandDealMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-secondary rounded-lg border border-border">
        <p className="text-sm font-medium text-foreground">Brand: {deal.brand_name}</p>
        <p className="text-xs text-muted-foreground">Amount: ₹{deal.deal_amount.toLocaleString('en-IN')}</p>
      </div>
      
      <div>
        <Label htmlFor="paymentReceivedDate">Payment Received Date *</Label>
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="paymentReceivedDate"
            type="date"
            value={paymentReceivedDate}
            onChange={(e) => setPaymentReceivedDate(e.target.value)}
            disabled={isSubmitting}
            className="pl-9"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="utrNumber">UTR / Transaction ID (Optional)</Label>
        <div className="relative">
          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="utrNumber"
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., 1234567890ABC"
            className="pl-9"
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !paymentReceivedDate}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Marking...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default MarkPaymentReceivedDialog;