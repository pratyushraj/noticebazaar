"use client";

import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { WifiOff, ArrowLeft, CheckCircle, AlertCircle, FileText, Edit, Trash2, Eye, Loader2, Download, Upload, X, MessageSquare, Info, ShieldCheck } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDealById, useUpdateBrandDeal } from '@/lib/hooks/useBrandDeals';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/utils/analytics';
import { extractTaxInfo, getTaxDisplayMessage, calculateFinalAmount } from '@/lib/utils/taxExtraction';
import { calculatePaymentRiskLevel, getPaymentRiskConfig, getPaymentRiskTooltip } from '@/lib/utils/paymentRisk';
import { supabase } from '@/integrations/supabase/client';
import { CREATOR_ASSETS_BUCKET } from '@/lib/constants/storage';
import { FilePreview } from '@/components/payments/FilePreview';
import { NativeLoadingSheet } from '@/components/mobile/NativeLoadingSheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PaymentDetailPage = () => {
  const navigate = useNavigate();
  const { paymentId } = useParams<{ paymentId: string }>();
  const { profile } = useSession();
  const updateProfileMutation = useUpdateProfile();

  // Fetch the deal data (paymentId is actually the dealId)
  const { data: brandDeal, isLoading, error } = useBrandDealById(paymentId, profile?.id);
  const updateDealMutation = useUpdateBrandDeal();

  // State for optional enhancements
  const [notes, setNotes] = useState<string>('');
  const [proofOfPaymentFile, setProofOfPaymentFile] = useState<File | null>(null);
  const [proofOfPaymentUrl, setProofOfPaymentUrl] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingUpi, setPendingUpi] = useState(profile?.bank_upi || '');
  const [isSavingUpi, setIsSavingUpi] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Undo payment state
  const [undoDeadline, setUndoDeadline] = useState<Date | null>(null);
  const [undoToastId, setUndoToastId] = useState<string | number | null>(null);
  const [previousPaymentState, setPreviousPaymentState] = useState<{
    status: string;
    payment_received_date: string | null;
    payment_received_amount: number | null;
    payment_proof_url: string | null;
    utr_number: string | null;
  } | null>(null);

  // Transform deal data to payment format
  const paymentData = useMemo(() => {
    if (!brandDeal) return null;

    const amount = brandDeal.deal_amount || 0;
    const paymentReceivedDate = brandDeal.payment_received_date ? new Date(brandDeal.payment_received_date) : null;
    const paymentExpectedDate = brandDeal.payment_expected_date ? new Date(brandDeal.payment_expected_date) : null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Determine status
    let status: 'received' | 'pending' | 'overdue' = 'pending';
    if (paymentReceivedDate) {
      status = 'received';
    } else if (paymentExpectedDate && paymentExpectedDate < now) {
      status = 'overdue';
    }

    // Calculate days
    let daysInfo = '';
    if (status === 'received') {
      daysInfo = 'Paid';
    } else if (paymentExpectedDate) {
      const diffTime = paymentExpectedDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        daysInfo = `${Math.abs(diffDays)} days overdue`;
      } else if (diffDays === 0) {
        daysInfo = 'Due today';
      } else {
        daysInfo = `${diffDays} days left`;
      }
    }

    // Extract tax information from contract text
    const contractText = brandDeal.deliverables || '';
    const taxInfo = extractTaxInfo(contractText);
    const taxDisplay = getTaxDisplayMessage(taxInfo);
    
    // Calculate final amount after GST and TDS (if applicable)
    const finalAmountCalc = calculateFinalAmount(
      amount,
      taxInfo.gstRate,
      taxInfo.gstIncluded,
      taxInfo.tdsRate
    );

    // Generate or extract invoice number
    let invoiceNumber = (brandDeal as any).invoice_number;
    if (!invoiceNumber) {
      const invoicePatterns = [
        /invoice\s*(?:number|#|no\.?|id)?\s*:?\s*([A-Z0-9\-]+)/i,
        /inv\s*(?:number|#|no\.?|id)?\s*:?\s*([A-Z0-9\-]+)/i,
        /invoice\s+([A-Z0-9\-]+)/i,
        /(?:invoice|inv)[\s:]+([A-Z0-9]{6,})/i,
      ];

      let extractedInvoice: string | null = null;
      for (const pattern of invoicePatterns) {
        const match = contractText.match(pattern);
        if (match && match[1]) {
          const candidate = match[1].trim().toUpperCase();
          if (/^[A-Z0-9\-]+$/.test(candidate) && candidate.length >= 4) {
            extractedInvoice = candidate;
            break;
          }
        }
      }

      if (extractedInvoice) {
        invoiceNumber = extractedInvoice;
      } else {
        const year = new Date().getFullYear();
        const shortId = brandDeal.id.substring(0, 8).toUpperCase();
        const random4 = Math.floor(1000 + Math.random() * 9000);
        invoiceNumber = `INV-${year}-${shortId}-${random4}`;
      }
    }

    // Calculate risk level using new priority-based logic
    // Only calculate for pending payments (not received)
    let finalRiskLevel: 'low' | 'moderate' | 'overdue' = 'low';
    if (status !== 'received') {
      finalRiskLevel = calculatePaymentRiskLevel(
        paymentExpectedDate,
        taxInfo.riskScore,
        now
      );
    }

    return {
      id: brandDeal.id,
      amount,
      netAmount: finalAmountCalc.finalAmount,
      tax: taxInfo.gstRate ? (amount * taxInfo.gstRate / 100) : 0,
      status,
      riskLevel: finalRiskLevel,
      daysInfo,
      brandName: brandDeal.brand_name || 'Unknown Brand',
      contractName: `${brandDeal.brand_name} Campaign`,
      platform: brandDeal.platform || 'Multiple',
      paymentMethod: 'Bank Transfer', // Default, could be from deal data
      category: brandDeal.platform || 'Brand Partnership',
      invoiceNumber,
      invoiceFileUrl: (brandDeal as any).invoice_file_url,
      createdDate: brandDeal.created_at ? new Date(brandDeal.created_at) : new Date(),
      expectedDate: paymentExpectedDate,
      receivedDate: paymentReceivedDate,
      receivedAt: paymentReceivedDate, // New field for timeline
      utrNumber: brandDeal.utr_number,
      taxInfo: taxDisplay,
      taxDetails: taxInfo,
      notes: (brandDeal as any).payment_notes || '',
      proofOfPaymentUrl: (brandDeal as any).proof_of_payment_url || null,
    };
  }, [brandDeal]);

  // Initialize notes and proof of payment URL when data loads
  useEffect(() => {
    if (paymentData) {
      setNotes(paymentData.notes || '');
      setProofOfPaymentUrl(paymentData.proofOfPaymentUrl);
    }
  }, [paymentData]);

  useEffect(() => {
    setPendingUpi(profile?.bank_upi || '');
  }, [profile?.bank_upi]);

  const hasSavedUpi = Boolean(String(profile?.bank_upi || '').trim());

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle undo deadline expiration
  useEffect(() => {
    if (!undoDeadline) return;

    const checkExpiration = setInterval(() => {
      const now = new Date();
      if (now >= undoDeadline) {
        // Undo window expired
        if (undoToastId) {
          toast.dismiss(undoToastId);
        }
        setUndoDeadline(null);
        setUndoToastId(null);
        setPreviousPaymentState(null);
      }
    }, 1000); // Check every second

    return () => clearInterval(checkExpiration);
  }, [undoDeadline, undoToastId]);

  // Handle mark as received (opens confirmation modal)
  const handleMarkAsReceived = () => {
    if (!String(profile?.bank_upi || '').trim()) {
      toast.error('Add your UPI ID before closing this payment');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleSaveUpi = async () => {
    if (!profile?.id) return;
    const normalizedUpi = pendingUpi.trim().toLowerCase();
    if (!/^[a-z0-9.\-_]{2,}@[a-z]{2,}$/i.test(normalizedUpi)) {
      toast.error('Enter a valid UPI ID');
      return;
    }

    try {
      setIsSavingUpi(true);
      await updateProfileMutation.mutateAsync({
        id: profile.id,
        bank_upi: normalizedUpi,
      } as any);
      toast.success('UPI saved');
    } catch (error: any) {
      toast.error(error?.message || 'Could not save your UPI ID');
    } finally {
      setIsSavingUpi(false);
    }
  };

  // Confirm and mark as received
  const handleConfirmMarkAsReceived = async () => {
    if (!brandDeal || !profile?.id || !paymentData) {
      toast.error('Cannot mark payment as received: Missing data');
      setShowConfirmModal(false);
      return;
    }

    // Store previous state for undo
    setPreviousPaymentState({
      status: brandDeal.status || 'Payment Pending',
      payment_received_date: brandDeal.payment_received_date || null,
      payment_received_amount: (brandDeal as any).payment_received_amount || null,
      payment_proof_url: (brandDeal as any).proof_of_payment_url || null,
      utr_number: brandDeal.utr_number || null,
    });

    setShowConfirmModal(false);

    try {
      const now = new Date().toISOString();
      
      await updateDealMutation.mutateAsync({
        id: brandDeal.id,
        creator_id: profile.id,
        status: 'Payment Received',
        payment_received_date: now,
        // Note: payment_received_amount column doesn't exist - amount is stored in deal_amount
        proof_of_payment_url: proofOfPaymentUrl,
        utr_number: null, // Can be added separately
        // updated_at will be automatically updated by trigger
      });

      void trackEvent('payment_confirmed', {
        creator_id: profile.id,
        deal_id: brandDeal.id,
        amount: paymentData.amount,
      });

      // Set undo deadline (5 minutes from now)
      const deadline = new Date();
      deadline.setMinutes(deadline.getMinutes() + 5);
      setUndoDeadline(deadline);

      // Show success toast
      const toastId = toast.success('Payment marked as received', {
        description: 'Undo within 5 minutes.',
        duration: 5000, // Show for 5 seconds, but allow undo for 5 minutes
        action: {
          label: 'Undo',
          onClick: handleUndoPayment,
        },
      });

      setUndoToastId(toastId);
    } catch (error: any) {
      console.error('Error marking payment as received:', error);
      toast.error('Failed to mark payment as received', {
        description: error.message || 'Please try again.',
      });
      setPreviousPaymentState(null);
    }
  };

  // Handle undo payment
  const handleUndoPayment = async () => {
    if (!brandDeal || !profile?.id || !previousPaymentState) {
      toast.error('Cannot undo: Previous state not available');
      return;
    }

    // Check if undo window is still valid
    if (undoDeadline && new Date() >= undoDeadline) {
      toast.error('Undo window has expired', {
        description: 'You can only undo within 5 minutes of marking as received.',
      });
      return;
    }

    try {
      await updateDealMutation.mutateAsync({
        id: brandDeal.id,
        creator_id: profile.id,
        status: previousPaymentState.status,
        payment_received_date: previousPaymentState.payment_received_date,
        // Note: payment_received_amount column doesn't exist - amount is stored in deal_amount
        proof_of_payment_url: previousPaymentState.payment_proof_url,
        utr_number: previousPaymentState.utr_number,
      });

      // Clear undo state
      if (undoToastId) {
        toast.dismiss(undoToastId);
      }
      setUndoDeadline(null);
      setUndoToastId(null);
      setPreviousPaymentState(null);

      toast.success('Payment status reverted', {
        description: 'The payment has been marked as pending again.',
      });
    } catch (error: any) {
      console.error('Error undoing payment:', error);
      toast.error('Failed to undo payment', {
        description: error.message || 'Please try again.',
      });
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900" />
        <NativeLoadingSheet isOpen={true} message="Loading payment details..." />
      </>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-foreground flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-foreground/80 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Payment Not Found</h2>
          <p className="text-foreground/60 mb-4">The payment you're looking for doesn't exist.</p>
          <button type="button"
            onClick={() => navigate('/creator-payments')}
            className="bg-gradient-to-r from-[#A06BFF] to-[#7C3AED] hover:from-[#8F5AFF] hover:to-[#6D28D9] px-6 py-3 rounded-xl transition-all active:scale-[0.97] shadow-lg shadow-purple-900/40"
          >
            Back to Payments
          </button>
        </div>
      </div>
    );
  }

  // Handle proof of payment file selection
  const handleProofFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (images and PDFs)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Please upload an image (JPG, PNG, WebP) or PDF file.',
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File too large', {
        description: 'Please upload a file smaller than 10MB.',
      });
      return;
    }

    setProofOfPaymentFile(file);
  };

  // Handle proof of payment upload
  const handleUploadProof = async () => {
    if (!proofOfPaymentFile || !profile?.id || !paymentData) return;

    setIsUploadingProof(true);
    try {
      const fileExtension = proofOfPaymentFile.name.split('.').pop();
      const sanitizedBrandName = paymentData.brandName.trim().replace(/\s/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
      const filePath = `${profile.id}/payments/${sanitizedBrandName}-proof-${Date.now()}.${fileExtension}`;

      // Delete old proof if exists
      if (proofOfPaymentUrl) {
        try {
          const urlMatch = proofOfPaymentUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
          if (urlMatch) {
            await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([urlMatch[1].split('?')[0]]);
          }
        } catch (deleteError) {
          console.warn('Could not delete old proof of payment:', deleteError);
        }
      }

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from(CREATOR_ASSETS_BUCKET)
        .upload(filePath, proofOfPaymentFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(CREATOR_ASSETS_BUCKET)
        .getPublicUrl(filePath);

      // Update deal with proof of payment URL
      await updateDealMutation.mutateAsync({
        id: paymentData.id,
        creator_id: profile.id,
        proof_of_payment_url: publicUrl,
      } as any);

      setProofOfPaymentUrl(publicUrl);
      setProofOfPaymentFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success('Proof of payment uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading proof of payment:', error);
      toast.error('Upload failed', {
        description: error.message || 'Failed to upload proof of payment. Please try again.',
      });
    } finally {
      setIsUploadingProof(false);
    }
  };

  // Handle notes save
  const handleSaveNotes = async () => {
    if (!profile?.id || !paymentData) return;

    setIsSavingNotes(true);
    try {
      await updateDealMutation.mutateAsync({
        id: paymentData.id,
        creator_id: profile.id,
        payment_notes: notes.trim() || null,
      } as any);

      toast.success('Notes saved successfully!');
    } catch (error: any) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 px-4 pb-32 text-foreground relative">
      {/* Page Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-indigo-900/95 backdrop-blur-xl border-b border-border shadow-xl">
        <div className="flex items-center gap-4 px-4 md:px-6 py-4 max-w-4xl mx-auto">
          <button type="button"
            onClick={() => navigate('/creator-payments')}
            className="p-2 hover:bg-secondary/50 rounded-xl transition-colors active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-2xl font-semibold">Payment Details</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-warning text-foreground px-4 py-2.5 flex items-center gap-2 text-sm font-bold shadow-lg">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            You're offline — changes will sync when you reconnect
          </div>
        )}
        {/* Deal Complete Celebration Banner */}
        {paymentData.status === 'received' && paymentData.receivedAt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-primary/30 rounded-2xl p-4 md:p-5 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Deal Complete! 🎉</p>
                <p className="text-xs text-foreground/70 mt-0.5">You earned ₹{paymentData.amount.toLocaleString('en-IN')} from {paymentData.brandName}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 1: Payment Status Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative bg-secondary/50 backdrop-blur-xl rounded-2xl p-5 md:p-6 border border-border"
        >
          <div className="mb-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
              {/* Large Amount */}
              <div className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                ₹{paymentData.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>

              {/* Single Status Badge */}
              <div className="mb-3">
                {paymentData.status === 'received' ? (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    Received
                  </span>
                ) : paymentData.status === 'overdue' ? (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-destructive/20 text-destructive border border-destructive/30">
                    Overdue
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    Pending
                  </span>
                )}
              </div>

              {/* Helper Line */}
                <div className="text-sm text-foreground/70">
                {paymentData.status === 'received' && paymentData.receivedAt ? (
                  `Payment received on ${paymentData.receivedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                ) : paymentData.status === 'overdue' && paymentData.expectedDate ? (
                  `Payment overdue by ${Math.abs(Math.ceil((new Date().getTime() - paymentData.expectedDate.getTime()) / (1000 * 60 * 60 * 24)))} days`
                ) : paymentData.expectedDate ? (
                  `Payment expected by ${paymentData.expectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                ) : (
                  'Payment date pending'
                )}
                </div>
              </div>
            </div>

            {/* Subtle Risk Level (Left-aligned, positioned below) */}
            {paymentData.status !== 'received' && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs text-foreground/50 whitespace-nowrap">Risk Level</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-foreground/40 hover:text-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-gray-900 border-gray-700 text-foreground text-xs">
                        <p>{getPaymentRiskTooltip()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {(() => {
                  const riskConfig = getPaymentRiskConfig(paymentData.riskLevel);
                  return (
                <div className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap inline-block",
                      riskConfig.bgColor,
                      riskConfig.color
                )}>
                      {riskConfig.label}
                </div>
                  );
                })()}
              </div>
            )}
          </div>
        </motion.div>

        {/* Sticky bottom bar — shown when brand marked payment sent, creator hasn't confirmed */}
        {paymentData.status === 'pending' && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black via-black/95 to-transparent md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-4 shadow-lg shadow-green-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">Confirm when you receive payment</p>
                    <p className="text-xs text-foreground/70">Tap only after the money reaches your account</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleMarkAsReceived}
                    className="shrink-0 px-4 py-2 bg-card text-primary font-black text-xs rounded-xl shadow"
                  >
                    I Got It
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How to get paid — shown only when payment is pending */}
        {paymentData.status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            className="relative rounded-2xl border border-border bg-card p-5"
          >
            <p className="text-[11px] font-black uppercase tracking-widest text-foreground/50 mb-3">How you'll get paid</p>
            <div className="space-y-3">
              {[
                { step: '1', title: 'Brand transfers to your UPI', desc: 'They pay directly — outside Creator Armour' },
                { step: '2', title: 'Brand marks payment sent', desc: 'You get notified automatically' },
                { step: '3', title: 'You confirm receipt', desc: 'Tap "I received payment" to close the deal' },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-black text-secondary flex-shrink-0 mt-0.5">{item.step}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-foreground/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Payment protection messaging */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Contract-backed payment</p>
                  <p className="text-[11px] text-foreground/50 mt-0.5">If payment is 7+ days late, you can escalate and we'll help you take action — including sending a legal notice.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment overdue warning with escalation */}
        {paymentData.status === 'overdue' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            className="relative rounded-2xl border border-destructive/30 bg-destructive/10 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-destructive/20 p-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Payment is overdue</p>
                <p className="mt-1 text-sm text-foreground/70">
                  Contact the brand directly first. If they don't respond within 48 hours, you can:
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-foreground/60">
                    <span className="w-5 h-5 rounded-full bg-secondary/50 flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Send a payment reminder</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/60">
                    <span className="w-5 h-5 rounded-full bg-secondary/50 flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Report the issue — we'll contact the brand</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/60">
                    <span className="w-5 h-5 rounded-full bg-secondary/50 flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>After 30 days: request a legal notice (automated)</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {!paymentData.receivedAt && !hasSavedUpi && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            className="relative rounded-2xl border border-warning/20 bg-warning/10 p-5 md:p-6"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-warning/20 p-2">
                <AlertCircle className="h-4 w-4 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Add your UPI only when payment is near</p>
                <p className="mt-1 text-sm text-foreground/70">
                  This keeps onboarding short. Save it now so you can confirm payment in one tap later.
                </p>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="payment-upi" className="text-xs uppercase tracking-[0.18em] text-foreground/60">
                    UPI ID
                  </Label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      id="payment-upi"
                      value={pendingUpi}
                      onChange={(e) => setPendingUpi(e.target.value)}
                      placeholder="name@oksbi"
                      className="border-border bg-card text-foreground placeholder:text-foreground/30"
                    />
                    <button
                      type="button"
                      onClick={handleSaveUpi}
                      disabled={isSavingUpi}
                      className="h-11 shrink-0 rounded-xl bg-card text-muted-foreground px-4 text-sm font-semibold hover:bg-secondary/90 disabled:opacity-60"
                    >
                      {isSavingUpi ? 'Saving...' : 'Save UPI'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 2: Primary Action Bar (Sticky) */}
        <div className="sticky top-[73px] z-40 bg-background/95 backdrop-blur-xl border-b border-border -mx-4 px-4 py-3 mb-6 safe-area-top">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3">
            {paymentData.status === 'pending' ? (
              <>
                <motion.button
                  onClick={handleMarkAsReceived}
                  disabled={updateDealMutation.isPending || !hasSavedUpi}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-foreground font-semibold px-4 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updateDealMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">
                        {hasSavedUpi ? 'Confirm payment received' : 'Add UPI to confirm'}
                      </span>
                    </>
                  )}
                </motion.button>
                <motion.button
                  onClick={async () => {
                    try {
                      const { error } = await supabase.from('notifications').insert({
                        user_id: paymentData.brandId,
                        title: 'Payment reminder sent',
                        body: `Creator ${paymentData.creatorName || ''} sent you a payment reminder for deal #${String(paymentData.dealId || '').slice(0,8)}. Please process payment.`,
                        type: 'payment_reminder',
                        deal_id: paymentData.dealId,
                      });
                      if (error) throw error;
                      toast.success('Reminder sent to brand!');
                    } catch {
                      toast.error('Failed to send reminder');
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-4 py-3 bg-secondary/50 hover:bg-secondary/15 border border-border text-foreground rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Remind brand</span>
                </motion.button>
              </>
            ) : paymentData.status === 'overdue' ? (
              <>
                <motion.button
                  onClick={async () => {
                    try {
                      const { error } = await supabase.from('notifications').insert({
                        user_id: paymentData.brandId,
                        title: 'Payment overdue — action required',
                        body: `Payment for deal #${String(paymentData.dealId || '').slice(0,8)} is overdue. Please process immediately.`,
                        type: 'payment_reminder',
                        deal_id: paymentData.dealId,
                      });
                      if (error) throw error;
                      toast.success('Urgent reminder sent to brand!');
                    } catch {
                      toast.error('Failed to send reminder');
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-foreground font-semibold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Send Payment Reminder</span>
                </motion.button>
                <motion.button
                  onClick={handleMarkAsReceived}
                  disabled={updateDealMutation.isPending || !hasSavedUpi}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-4 py-3 bg-secondary/50 hover:bg-secondary/15 border border-border text-foreground rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {updateDealMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">
                        {hasSavedUpi ? 'Confirm payment received' : 'Add UPI to confirm'}
                      </span>
                    </>
                  )}
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  onClick={() => {
                    if (paymentData.proofOfPaymentUrl) {
                      setShowPreviewModal(true);
                    } else {
                      toast.info('No receipt uploaded yet');
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-foreground font-semibold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">View Receipt</span>
                </motion.button>
                {paymentData.invoiceFileUrl && (
                  <motion.button
                    onClick={() => {
                      if (paymentData.invoiceFileUrl) {
                        const link = document.createElement('a');
                        link.href = paymentData.invoiceFileUrl;
                        link.download = `invoice-${paymentData.invoiceNumber}.pdf`;
                        link.click();
                      }
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto px-4 py-3 bg-secondary/50 hover:bg-secondary/15 border border-border text-foreground rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Download className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Download Invoice</span>
                  </motion.button>
                )}
              </>
            )}
          </div>
          <div className="max-w-4xl mx-auto mt-2">
            <p className="text-xs text-foreground/70">
              {paymentData.status === 'pending' || paymentData.status === 'overdue'
                ? hasSavedUpi
                  ? 'Tap this only after the money reaches your bank account.'
                  : 'Add your UPI first. We only ask for it when payment is close.'
                : 'This deal is completed. You can download the invoice and share your collab page for more deals.'}
            </p>
          </div>
        </div>

        {/* SECTION 3: Overview (Compact Grid) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="relative bg-secondary/50 backdrop-blur-xl rounded-2xl p-5 md:p-6 border border-border"
        >
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div>
              <div className="text-xs text-foreground/60 mb-1">Contract Name</div>
              <div className="text-sm font-semibold text-foreground">{paymentData.contractName}</div>
            </div>
            <div>
              <div className="text-xs text-foreground/60 mb-1">Brand Name</div>
              <div className="text-sm font-semibold text-foreground">{paymentData.brandName}</div>
            </div>
            <div>
              <div className="text-xs text-foreground/60 mb-1">Payment Method</div>
              <div className="text-sm font-semibold text-foreground">{paymentData.paymentMethod}</div>
            </div>
            <div>
              <div className="text-xs text-foreground/60 mb-1">Created Date</div>
              <div className="text-sm font-semibold text-foreground">
                {paymentData.createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div>
              <div className="text-xs text-foreground/60 mb-1">Payment trigger</div>
              <div className="text-sm font-semibold text-foreground">On Approval</div>
            </div>
            <div>
              <div className="text-xs text-foreground/60 mb-1">Payment window</div>
              <div className="text-sm font-semibold text-foreground">Within 7 days</div>
            </div>
          </div>
        </motion.div>

        {/* SECTION 4: Payment Timeline (Only if not received) */}
        {paymentData.status !== 'received' && paymentData.expectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="relative bg-secondary/50 backdrop-blur-xl rounded-2xl p-5 md:p-6 border border-border"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">When payment is due</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-foreground/60 mb-1">Expected Date</div>
                  <div className="text-base font-semibold text-foreground">
                    {paymentData.expectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-foreground/60 mb-1">Countdown</div>
                  <div className={cn(
                    "text-lg font-bold",
                    paymentData.status === 'overdue' ? 'text-destructive' : 'text-yellow-400'
                  )}>
                    {paymentData.daysInfo}
                  </div>
                </div>

                {/* Thin accent divider */}
                <div className={cn(
                  "h-0.5 rounded-full",
                  paymentData.status === 'overdue' ? 'bg-destructive/30' : 'bg-yellow-500/30'
                )} />
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 5: Payment History (Minimal Timeline) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="relative bg-secondary/50 backdrop-blur-xl rounded-2xl p-5 md:p-6 border border-border"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Payment updates</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-secondary/40 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">Payment created</div>
                <div className="text-xs text-foreground/50 group-hover:text-foreground/70">
                  {paymentData.createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
            {paymentData.invoiceFileUrl && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary/40 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Invoice generated</div>
                  <div className="text-xs text-foreground/50 group-hover:text-foreground/70">
                    {paymentData.createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
            )}
            {paymentData.status === 'received' && paymentData.receivedAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-green-400">Payment confirmed by creator</div>
                  <div className="text-xs text-foreground/50 group-hover:text-foreground/70">
                    {paymentData.receivedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* SECTION: Invoice Details (Simplified) */}
        {paymentData.invoiceFileUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="relative bg-secondary/50 backdrop-blur-xl rounded-2xl p-5 md:p-6 border border-border"
          >
          <div className="space-y-4">
            {/* Invoice Number */}
            <div>
              <div className="text-sm text-foreground/60 mb-2">Invoice Number</div>
              <div className="flex items-center gap-3">
                <div className="text-xl font-bold text-foreground">{paymentData.invoiceNumber}</div>
                {paymentData.invoiceFileUrl && (
                  <FileText className="w-5 h-5 text-foreground/40" />
                )}
              </div>
            </div>

            {/* Tax Information */}
            <div>
              <div className="text-sm text-foreground/60 mb-2">Tax</div>
              {paymentData.taxInfo ? (
                <div className={cn(
                  "text-sm font-medium",
                  paymentData.taxInfo.riskLevel === 'high' || paymentData.taxInfo.riskLevel === 'medium'
                    ? 'text-[#FFCD4D]'
                    : 'text-green-400'
                )}>
                  {paymentData.taxInfo.message}
                </div>
              ) : (
                <div className="text-sm font-medium text-[#FFCD4D]">
                  Not Mentioned — Confirm with Brand
                </div>
              )}
            </div>

          </div>
        </motion.div>
        )}


        {/* SECTION 6: Proof of Payment (Optional) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="relative bg-secondary/50 backdrop-blur-xl rounded-2xl p-5 md:p-6 border border-border"
        >
          <div className="relative z-10 space-y-4">
            <div>
              <div className="text-sm font-medium text-foreground mb-1">Payment Proof (Optional)</div>
              <div className="text-xs text-foreground/60 mb-3">
                Upload UTR or payment screenshot for your records.
              </div>
            </div>

            {proofOfPaymentUrl ? (
              <FilePreview
                fileURL={proofOfPaymentUrl}
                fileName={proofOfPaymentUrl.split('/').pop() || 'Proof of Payment'}
                onRemove={async () => {
                  setProofOfPaymentUrl(null);
                  setProofOfPaymentFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                  // Update deal to remove proof URL
                  if (brandDeal && profile?.id) {
                    try {
                      await updateDealMutation.mutateAsync({
                        id: brandDeal.id,
                        creator_id: profile.id,
                        proof_of_payment_url: null,
                      });
                      toast.success('Proof of payment removed');
                    } catch (error: any) {
                      toast.error('Failed to remove proof', {
                        description: error.message || 'Please try again.',
                      });
                    }
                  }
                }}
                onPreview={() => setShowPreviewModal(true)}
              />
            ) : (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleProofFileSelect}
                  className="hidden"
                  id="proof-of-payment-upload"
                />
                <label
                  htmlFor="proof-of-payment-upload"
                  className="flex items-center justify-center gap-2 p-3 border border-dashed border-border rounded-lg cursor-pointer hover:border-border hover:bg-card transition-colors"
                >
                  <Upload className="w-4 h-4 text-foreground/50" />
                  <span className="text-xs text-foreground/60">
                    {proofOfPaymentFile ? proofOfPaymentFile.name : 'Click to upload'}
                  </span>
                </label>
                {paymentData.status === 'received' && !proofOfPaymentUrl && (
                  <div className="text-xs text-foreground/40 text-center mt-2">
                    No payment proof uploaded (optional)
                  </div>
                )}
                {proofOfPaymentFile && (
                  <button type="button"
                    onClick={handleUploadProof}
                    disabled={isUploadingProof}
                    className={cn(
                      "w-full bg-secondary/50 hover:bg-secondary/15 border border-border rounded-xl px-4 py-3",
                      "transition-colors active:scale-[0.98] flex items-center justify-center gap-2 text-sm font-medium",
                      isUploadingProof && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isUploadingProof ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Proof
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* SECTION 7: Internal Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="relative bg-secondary/50 backdrop-blur-xl rounded-2xl p-5 md:p-6 border border-border"
        >
          <div className="relative z-10 space-y-4">
            <div>
              <div className="text-sm font-medium text-foreground mb-1">Notes (only visible to you)</div>
              <div className="text-xs text-foreground/60 mb-3">
                Brand said they'll pay next week
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes here..."
              rows={4}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-border resize-none"
            />

            <button type="button"
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className={cn(
                "w-full bg-card hover:bg-secondary/50 border border-border rounded-lg px-4 py-2.5",
                "transition-colors active:scale-[0.98] flex items-center justify-center gap-2 text-sm font-medium text-foreground/70",
                isSavingNotes && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSavingNotes ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Notes'
              )}
            </button>
          </div>
        </motion.div>

        {/* SECTION 8: Advanced Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="space-y-3 pt-6 border-t border-border"
        >
          <div className="text-xs text-foreground/50 mb-3">Advanced</div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button"
              onClick={() => {
                toast.info('Edit Payment feature coming soon');
              }}
              className={cn(
                "bg-card border border-border rounded-lg px-4 py-3",
                "text-foreground/60 hover:text-foreground hover:bg-secondary/50",
                "transition-colors active:scale-[0.98]",
                "flex items-center justify-center gap-2 text-sm font-medium"
              )}
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
                  toast.info('Delete Payment feature coming soon');
                }
              }}
              className={cn(
                "bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3",
                "text-destructive hover:text-destructive hover:bg-destructive/20",
                "transition-colors active:scale-[0.98]",
                "flex items-center justify-center gap-2 text-sm font-medium"
              )}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </motion.div>
      </div>

      {/* Full-Screen Preview Modal */}
      {showPreviewModal && proofOfPaymentUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-secondary/50 backdrop-blur-xl rounded-2xl border border-border shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Proof of Payment</h3>
              <button type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
                aria-label="Close preview"
              >
                <X className="w-5 h-5 text-foreground/60" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {/\.(png|jpg|jpeg|gif|webp)$/i.test(proofOfPaymentUrl) ? (
                <img
                  src={proofOfPaymentUrl}
                  alt="Proof of Payment"
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <iframe
                  src={proofOfPaymentUrl}
                  className="w-full h-[600px] rounded-lg"
                  title="Proof of Payment"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full border border-border shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Confirm payment received</h3>
              </div>
            </div>
            
            <p className="text-foreground/80 mb-4">
              Confirm only after checking your bank account. Make sure the received amount matches:
            </p>
            <div className="bg-card border border-border rounded-xl p-4 mb-6">
              <div className="text-xs text-foreground/50 mb-1">Expected amount</div>
              <div className="text-2xl font-black text-foreground">₹{paymentData.amount.toLocaleString('en-IN')}</div>
              <div className="text-xs text-foreground/50 mt-1">from {paymentData.brandName}</div>
            </div>
            <div className="flex gap-3">
              <button type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                }}
                disabled={updateDealMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-secondary/50 hover:bg-secondary/15 border border-border text-foreground rounded-xl font-medium transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleConfirmMarkAsReceived}
                disabled={updateDealMutation.isPending}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-foreground rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updateDealMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Yes, I Got It'
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PaymentDetailPage;
