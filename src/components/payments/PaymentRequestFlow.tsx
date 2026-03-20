"use client";

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  FileText, 
  Mail, 
  Loader2,
  Briefcase,
  Calendar,
  IndianRupee,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { logger } from '@/lib/utils/logger';
import { usePaymentRequest } from '@/lib/hooks/usePaymentRequest';
import { generateInvoiceNumber, downloadInvoice, InvoiceData } from '@/lib/services/invoiceService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PaymentRequestFlowProps {
  onClose: () => void;
  initialDealId?: string;
}

type Step = 'select-deal' | 'generate-invoice' | 'customize-message' | 'review' | 'success';

export function PaymentRequestFlow({ onClose, initialDealId }: PaymentRequestFlowProps) {
  const navigate = useNavigate();
  const { profile, user } = useSession();
  const [currentStep, setCurrentStep] = useState<Step>(initialDealId ? 'generate-invoice' : 'select-deal');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(initialDealId || null);
  const [customMessage, setCustomMessage] = useState('');
  const [generateInvoice, setGenerateInvoice] = useState(true);
  const [invoiceNotes, setInvoiceNotes] = useState('');

  const { data: brandDeals = [] } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  const { sendPaymentRequest, isSending } = usePaymentRequest();

  // Get pending payment deals
  const pendingDeals = useMemo(() => {
    return brandDeals.filter(deal => 
      deal.status === 'Payment Pending' || 
      (!deal.payment_received_date && deal.payment_expected_date)
    );
  }, [brandDeals]);

  const selectedDeal = useMemo(() => {
    return selectedDealId ? brandDeals.find(d => d.id === selectedDealId) : null;
  }, [selectedDealId, brandDeals]);

  const steps: { key: Step; title: string; description: string }[] = [
    { key: 'select-deal', title: 'Select Deal', description: 'Choose the deal to request payment for' },
    { key: 'generate-invoice', title: 'Invoice', description: 'Generate and review invoice' },
    { key: 'customize-message', title: 'Message', description: 'Customize your payment request message' },
    { key: 'review', title: 'Review', description: 'Review before sending' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  const handleNext = () => {
    if (currentStep === 'select-deal' && !selectedDealId) {
      toast.error('Please select a deal');
      return;
    }
    
    if (currentStep === 'review') {
      handleSend();
      return;
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const handleSend = async () => {
    if (!selectedDeal) {
      toast.error('Please select a deal');
      return;
    }

    try {
      await sendPaymentRequest({
        dealId: selectedDeal.id,
        deal: selectedDeal,
        customMessage: customMessage.trim() || undefined,
        generateInvoice,
        invoiceNotes: invoiceNotes.trim() || undefined,
      });

      setCurrentStep('success');
    } catch (error: any) {
      // Error is handled by the hook
      logger.error('Payment request error', error);
    }
  };

  const handlePreviewInvoice = async () => {
    if (!selectedDeal || !profile || !user) return;

    try {
      const invoiceDate = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const dueDate = new Date(selectedDeal.payment_expected_date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const invoiceData: InvoiceData = {
        deal: selectedDeal,
        creatorName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Creator',
        creatorEmail: user.email,
        creatorPhone: profile.phone || undefined,
        creatorAddress: profile.location || undefined,
        invoiceNumber: generateInvoiceNumber(selectedDeal.id),
        invoiceDate,
        dueDate,
        notes: invoiceNotes.trim() || undefined,
      };

      await downloadInvoice(invoiceData);
    } catch (error: any) {
      toast.error('Failed to generate invoice preview', {
        description: error.message,
      });
    }
  };

  const getDefaultMessage = () => {
    if (!selectedDeal) return '';
    const overdueDays = selectedDeal.payment_expected_date
      ? Math.max(0, Math.ceil((new Date().getTime() - new Date(selectedDeal.payment_expected_date).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    
    if (overdueDays > 0) {
      return `Hi ${selectedDeal.brand_name} Team,\n\nThis is a friendly reminder for the pending payment of ₹${selectedDeal.deal_amount?.toLocaleString('en-IN') || '0'} for our collaboration.\n\nDeliverables have been completed and submitted. The payment was expected on ${new Date(selectedDeal.payment_expected_date).toLocaleDateString('en-IN')} (${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue).\n\nKindly release the payment at the earliest.\n\nThank you!`;
    } else {
      return `Hi ${selectedDeal.brand_name} Team,\n\nThis is a reminder for the upcoming payment of ₹${selectedDeal.deal_amount?.toLocaleString('en-IN') || '0'} for our collaboration.\n\nDeliverables have been completed. Payment is expected by ${new Date(selectedDeal.payment_expected_date).toLocaleDateString('en-IN')}.\n\nPlease let me know if you need any additional information.\n\nThank you!`;
    }
  };

  if (currentStep === 'success') {
    return (
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-indigo-900/95 backdrop-blur-xl border border-white/20 rounded-[24px] p-6 shadow-2xl"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-10 h-10 text-green-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Request Sent!</h2>
            <p className="text-white/70 mb-6">
              Your payment request has been sent to {selectedDeal?.brand_name || 'the brand'}.
              {generateInvoice && ' An invoice has been generated and attached.'}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/creator-payments')}
                className="flex-1 bg-white/10 text-white hover:bg-white/20"
              >
                View Payments
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
              >
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-indigo-900/95 backdrop-blur-xl border border-white/20 rounded-[24px] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Request Payment</h2>
            <p className="text-sm text-white/60 mt-1">
              {steps[currentStepIndex]?.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                      index <= currentStepIndex
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-white/40"
                    )}
                  >
                    {index < currentStepIndex ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <p className={cn(
                    "text-xs mt-2 text-center",
                    index <= currentStepIndex ? "text-white" : "text-white/40"
                  )}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "h-0.5 flex-1 mx-2 transition-colors",
                    index < currentStepIndex ? "bg-purple-600" : "bg-white/10"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {currentStep === 'select-deal' && (
              <motion.div
                key="select-deal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-white/70 mb-4">Select a deal with pending payment:</p>
                {pendingDeals.length === 0 ? (
                  <Card className="bg-white/5 border-white/10 p-8 text-center">
                    <Briefcase className="w-12 h-12 mx-auto mb-4 text-white/40" />
                    <p className="text-white/60">No pending payments found</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {pendingDeals.map((deal) => (
                      <Card
                        key={deal.id}
                        onClick={() => setSelectedDealId(deal.id)}
                        className={cn(
                          "bg-white/[0.08] border-white/15 cursor-pointer transition-all hover:bg-white/[0.12]",
                          selectedDealId === deal.id && "ring-2 ring-purple-500"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white mb-1">{deal.brand_name}</h3>
                              <div className="flex items-center gap-4 text-sm text-white/60">
                                <span className="flex items-center gap-1">
                                  <IndianRupee className="w-4 h-4" />
                                  {deal.deal_amount?.toLocaleString('en-IN') || '0'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Due: {new Date(deal.payment_expected_date).toLocaleDateString('en-IN')}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/40" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 'generate-invoice' && selectedDeal && (
              <motion.div
                key="generate-invoice"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Invoice Details</h3>
                    <p className="text-sm text-white/60">Invoice will be auto-generated from deal information</p>
                  </div>
                  <Button
                    onClick={handlePreviewInvoice}
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </div>

                <Card className="bg-white/[0.08] border-white/15">
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white/60 text-sm">Invoice Number</Label>
                        <p className="text-white font-mono text-sm mt-1">
                          {generateInvoiceNumber(selectedDeal.id)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-white/60 text-sm">Amount</Label>
                        <p className="text-white font-semibold mt-1">
                          ₹{selectedDeal.deal_amount?.toLocaleString('en-IN') || '0'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-white/60 text-sm mb-2 block">Additional Notes (Optional)</Label>
                      <Textarea
                        value={invoiceNotes}
                        onChange={(e) => setInvoiceNotes(e.target.value)}
                        placeholder="Add any additional notes for the invoice..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="generate-invoice-check"
                        checked={generateInvoice}
                        onChange={(e) => setGenerateInvoice(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5"
                      />
                      <Label htmlFor="generate-invoice-check" className="text-white/80 cursor-pointer">
                        Generate and attach invoice PDF
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 'customize-message' && selectedDeal && (
              <motion.div
                key="customize-message"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Customize Message</h3>
                  <p className="text-sm text-white/60">Personalize your payment request message</p>
                </div>

                <Card className="bg-white/[0.08] border-white/15">
                  <CardContent className="p-4">
                    <Label className="text-white/60 text-sm mb-2 block">Message</Label>
                    <Textarea
                      value={customMessage || getDefaultMessage()}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Enter your message..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[200px]"
                    />
                    <Button
                      onClick={() => setCustomMessage(getDefaultMessage())}
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-white/60 hover:text-white"
                    >
                      Reset to default
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 'review' && selectedDeal && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Review & Send</h3>
                  <p className="text-sm text-white/60">Review your payment request before sending</p>
                </div>

                <Card className="bg-white/[0.08] border-white/15">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <Label className="text-white/60 text-sm">Recipient</Label>
                      <p className="text-white mt-1">{selectedDeal.brand_name}</p>
                      {selectedDeal.brand_email && (
                        <p className="text-white/60 text-sm mt-1">{selectedDeal.brand_email}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-white/60 text-sm">Amount</Label>
                      <p className="text-white font-semibold text-lg mt-1">
                        ₹{selectedDeal.deal_amount?.toLocaleString('en-IN') || '0'}
                      </p>
                    </div>

                    {generateInvoice && (
                      <div>
                        <Label className="text-white/60 text-sm">Invoice</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <FileText className="w-4 h-4 text-white/60" />
                          <p className="text-white text-sm">
                            {generateInvoiceNumber(selectedDeal.id)}.pdf
                          </p>
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                            Will be attached
                          </Badge>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-white/60 text-sm">Message Preview</Label>
                      <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-white/80 text-sm whitespace-pre-wrap">
                          {customMessage || getDefaultMessage()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <Button
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={isSending || (currentStep === 'select-deal' && !selectedDealId)}
            className="bg-purple-600 text-white hover:bg-purple-700 min-w-[120px]"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : currentStep === 'review' ? (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Request
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

