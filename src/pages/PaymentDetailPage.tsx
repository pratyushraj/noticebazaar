"use client";

import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Calendar, FileText, Building2, CreditCard, Tag, Edit, Trash2, Eye, Loader2, Download, IndianRupee, Upload, X, MessageSquare } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDealById, useUpdateBrandDeal } from '@/lib/hooks/useBrandDeals';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { extractTaxInfo, getTaxDisplayMessage, calculateFinalAmount } from '@/lib/utils/taxExtraction';
import { supabase } from '@/integrations/supabase/client';
import { CREATOR_ASSETS_BUCKET } from '@/lib/constants/storage';

const PaymentDetailPage = () => {
  const navigate = useNavigate();
  const { paymentId } = useParams<{ paymentId: string }>();
  const { profile } = useSession();

  // Fetch the deal data (paymentId is actually the dealId)
  const { data: brandDeal, isLoading, error } = useBrandDealById(paymentId, profile?.id);
  const updateDealMutation = useUpdateBrandDeal();

  // State for optional enhancements
  const [notes, setNotes] = useState<string>('');
  const [proofOfPaymentFile, setProofOfPaymentFile] = useState<File | null>(null);
  const [proofOfPaymentUrl, setProofOfPaymentUrl] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
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
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (status === 'received') {
      daysInfo = 'Paid';
    } else if (paymentExpectedDate) {
      const diffTime = paymentExpectedDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        daysInfo = `${Math.abs(diffDays)} days overdue`;
        riskLevel = diffDays < -7 ? 'high' : 'medium';
      } else if (diffDays === 0) {
        daysInfo = 'Due today';
        riskLevel = 'medium';
      } else if (diffDays <= 7) {
        daysInfo = `${diffDays} days left`;
        riskLevel = 'medium';
      } else {
        daysInfo = `${diffDays} days left`;
        riskLevel = 'low';
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

    return {
      id: brandDeal.id,
      amount,
      netAmount: finalAmountCalc.finalAmount,
      tax: taxInfo.gstRate ? (amount * taxInfo.gstRate / 100) : 0,
      status,
      riskLevel: taxInfo.riskScore >= 25 ? 'high' : taxInfo.riskScore >= 15 ? 'high' : taxInfo.riskScore > 0 ? 'medium' : riskLevel,
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

  // Handle mark as received
  const handleMarkAsReceived = async () => {
    if (!brandDeal || !profile?.id || !paymentData) {
      toast.error('Cannot mark payment as received: Missing data');
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

    try {
      const now = new Date().toISOString();
      await updateDealMutation.mutateAsync({
        id: brandDeal.id,
        creator_id: profile.id,
        status: 'Payment Received',
        payment_received_date: now,
        payment_received_amount: paymentData.amount,
        proof_of_payment_url: proofOfPaymentUrl,
        utr_number: null, // Can be added separately
      });

      // Set undo deadline (5 minutes from now)
      const deadline = new Date();
      deadline.setMinutes(deadline.getMinutes() + 5);
      setUndoDeadline(deadline);

      // Show undo toast
      const toastId = toast.success('Payment marked as received — Undo?', {
        description: 'You have 5 minutes to undo this action.',
        duration: 300000, // 5 minutes
        action: {
          label: 'Undo',
          onClick: handleUndoPayment,
        },
        cancel: {
          label: 'Dismiss',
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
        payment_received_amount: previousPaymentState.payment_received_amount,
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
      <div className="min-h-screen bg-gradient-to-br from-[#2B0B4C] via-[#3E0C72] to-[#2B0B4C] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2B0B4C] via-[#3E0C72] to-[#2B0B4C] text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-white/80 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Payment Not Found</h2>
          <p className="text-white/60 mb-4">The payment you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/creator-payments')}
            className="bg-gradient-to-r from-[#A06BFF] to-[#7C3AED] hover:from-[#8F5AFF] hover:to-[#6D28D9] px-6 py-3 rounded-xl transition-all active:scale-[0.97] shadow-lg shadow-purple-900/40"
          >
            Back to Payments
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    received: {
      label: 'Received',
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
      icon: CheckCircle,
      timelineColor: 'text-green-400',
      chipColor: 'bg-green-500/20 text-green-400',
    },
    pending: {
      label: 'Pending',
      color: 'bg-[#FFCD4D]/20 text-[#FFCD4D] border-[#FFCD4D]/30',
      icon: Clock,
      timelineColor: 'text-[#FFCD4D]',
      chipColor: 'bg-[#FFCD4D]/20 text-[#FFCD4D]',
    },
    overdue: {
      label: 'Overdue',
      color: 'bg-[#FF4D4D]/20 text-[#FF4D4D] border-[#FF4D4D]/30',
      icon: AlertCircle,
      timelineColor: 'text-[#FF4D4D]',
      chipColor: 'bg-[#FF4D4D]/20 text-[#FF4D4D]',
    },
  };

  const riskConfig = {
    low: { 
      label: 'Low Risk', 
      chipColor: 'bg-green-500/20 text-green-400',
    },
    medium: { 
      label: 'Medium Risk', 
      chipColor: 'bg-[#FFCD4D]/20 text-[#FFCD4D]',
    },
    high: { 
      label: 'High Risk', 
      chipColor: 'bg-[#FF4D4D]/20 text-[#FF4D4D]',
    },
  };

  const StatusIcon = statusConfig[paymentData.status].icon;

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
    <div className="min-h-screen bg-gradient-to-br from-[#2B0B4C] via-[#3E0C72] to-[#2B0B4C] px-4 pb-32 text-white relative">
      {/* Page Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-[#2B0B4C]/95 via-[#3E0C72]/95 to-[#2B0B4C]/95 backdrop-blur-xl border-b border-white/10 shadow-xl">
        <div className="flex items-center gap-4 px-4 md:px-6 py-4 max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/creator-payments')}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-2xl font-semibold">Payment Details</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* SECTION 1: Payment Summary (Hero Card) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-white/10 cursor-pointer transition-all duration-200 hover:bg-white/7 hover:border-white/15 shadow-lg shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:rounded-3xl before:pointer-events-none"
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                {/* Large Amount */}
                <div className="flex items-baseline gap-3 mb-4">
                  <IndianRupee className="w-8 h-8 text-white" />
                  <div className="text-4xl font-bold text-white">
                    {(paymentData.amount / 1000).toFixed(1)}K
                  </div>
                </div>

                {/* Status Badges - Glass Style Neon */}
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <div className={cn(
                    "px-3 py-1.5 rounded-full border text-sm font-semibold flex items-center gap-2",
                    statusConfig[paymentData.status].chipColor,
                    "border-white/20"
                  )}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig[paymentData.status].label}
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-white/10 text-white text-xs border border-white/20">
                    {paymentData.category}
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div>
                    <div className="text-xs text-white/60 mb-1">Brand Name</div>
                    <div className="text-sm font-medium text-white">{paymentData.brandName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/60 mb-1">Payment Method</div>
                    <div className="text-sm font-medium text-white">{paymentData.paymentMethod}</div>
                  </div>
                  {paymentData.expectedDate && (
                    <div>
                      <div className="text-xs text-white/60 mb-1">Expected Date</div>
                      <div className="text-sm font-medium text-white">
                        {paymentData.expectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-white/60 mb-1">Risk Level</div>
                    <div className={cn("text-sm font-medium inline-block px-2 py-0.5 rounded-full", riskConfig[paymentData.riskLevel].chipColor)}>
                      {riskConfig[paymentData.riskLevel].label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section Title: Overview */}
        <div className="text-sm font-medium text-white/50 tracking-wider uppercase mb-3">Overview</div>

        {/* SECTION 2: Overview (Glass Card) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-white/10 cursor-pointer transition-all duration-200 hover:bg-white/7 hover:border-white/15 shadow-lg shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:rounded-3xl before:pointer-events-none"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/20">
                  <FileText className="w-5 h-5 text-white/80" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white/60 mb-1">Contract Name</div>
                  <div className="text-base font-medium text-white">{paymentData.contractName}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/20">
                  <Building2 className="w-5 h-5 text-white/80" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white/60 mb-1">Brand / Agency</div>
                  <div className="text-base font-medium text-white">{paymentData.brandName}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/20">
                  <Tag className="w-5 h-5 text-white/80" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white/60 mb-1">Category</div>
                  <div className="text-base font-medium text-white">{paymentData.category}</div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/20">
                  <CreditCard className="w-5 h-5 text-white/80" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white/60 mb-1">Payment Method</div>
                  <div className="text-base font-medium text-white">{paymentData.paymentMethod}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/20">
                  <Calendar className="w-5 h-5 text-white/80" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white/60 mb-1">Created Date</div>
                  <div className="text-base font-medium text-white">
                    {paymentData.createdDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Purple Neon Divider */}
        <div className="h-px w-full bg-white/10 my-4" />

        {/* Section Title: Status Timeline */}
        <div className="text-sm font-medium text-white/50 tracking-wider uppercase mb-3">Status Timeline</div>

        {/* SECTION 3: Status Timeline (Glass Card) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-white/10 cursor-pointer transition-all duration-200 hover:bg-white/7 hover:border-white/15 shadow-lg shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:rounded-3xl before:pointer-events-none"
        >
          <div className="relative pl-6">
            {/* Vertical Line */}
            <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-white/10" />
            
            <div className="space-y-6">
              {/* Created */}
              <div className="relative flex items-start gap-4">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-4 h-4 bg-green-500/30 border border-green-400 rounded-full flex-shrink-0" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-5 w-[2px] h-12 bg-gradient-to-b from-green-400/50 to-transparent" />
                </div>
                <div className="flex-1 pt-0">
                  <div className="text-base font-medium text-white mb-1">Created</div>
                  <div className="text-sm text-white/60">
                    {paymentData.createdDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Expected Payment Date */}
              {paymentData.expectedDate && (
                <div className="relative flex items-start gap-4">
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={cn(
                      "w-4 h-4 rounded-full flex-shrink-0 border",
                      paymentData.status === 'received' 
                        ? "bg-green-500/30 border-green-400"
                        : paymentData.status === 'overdue'
                        ? "bg-[#FF4D4D]/30 border-[#FF4D4D]"
                        : "bg-[#FFCD4D]/30 border-[#FFCD4D]"
                    )} />
                    {paymentData.status !== 'received' && (
                      <div className={cn(
                        "absolute left-1/2 -translate-x-1/2 top-5 w-[2px] h-12 bg-gradient-to-b to-transparent",
                        paymentData.status === 'overdue' 
                          ? "from-[#FF4D4D]/50"
                          : "from-[#FFCD4D]/50"
                      )} />
                    )}
                  </div>
                  <div className="flex-1 pt-0">
                    <div className="text-base font-medium text-white mb-1">Expected Payment Date</div>
                    <div className="text-sm text-white/60">
                      {paymentData.expectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    {paymentData.status !== 'received' && (
                      <div className={cn(
                        "text-xs mt-1 font-medium",
                        paymentData.status === 'overdue' ? 'text-[#FF4D4D]' : 'text-[#FFCD4D]'
                      )}>
                        {paymentData.daysInfo}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Received */}
              {paymentData.receivedDate && (
                <div className="relative flex items-start gap-4">
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-4 h-4 bg-green-500/30 border border-green-400 rounded-full flex-shrink-0" />
                  </div>
                  <div className="flex-1 pt-0">
                    <div className="text-base font-medium text-white mb-1">Payment Received</div>
                    <div className="text-sm text-white/60">
                      {paymentData.receivedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    {paymentData.utrNumber && (
                      <div className="text-xs text-green-400 mt-1">UTR: {paymentData.utrNumber}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Purple Neon Divider */}
        <div className="h-px w-full bg-white/10 my-4" />

        {/* Section Title: Invoice Details */}
        <div className="text-sm font-medium text-white/50 tracking-wider uppercase mb-3">Invoice Details</div>

        {/* SECTION 4: Invoice Details (Glass Card) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-white/10 cursor-pointer transition-all duration-200 hover:bg-white/7 hover:border-white/15 shadow-lg shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:rounded-3xl before:pointer-events-none"
        >
          <div className="space-y-4">
            {/* Invoice Number */}
            <div>
              <div className="text-sm text-white/60 mb-2">Invoice Number</div>
              <div className="flex items-center gap-3">
                <div className="text-xl font-bold text-white">{paymentData.invoiceNumber}</div>
                {paymentData.invoiceFileUrl && (
                  <FileText className="w-5 h-5 text-white/40" />
                )}
              </div>
            </div>

            {/* Tax Information */}
            <div>
              <div className="text-sm text-white/60 mb-2">Tax</div>
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

            {/* Invoice Actions */}
            {paymentData.invoiceFileUrl && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    if (paymentData.invoiceFileUrl) {
                      window.open(paymentData.invoiceFileUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-4 py-3 transition-colors active:scale-[0.98] flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  View Invoice
                </button>
                <button
                  onClick={() => {
                    if (paymentData.invoiceFileUrl) {
                      const link = document.createElement('a');
                      link.href = paymentData.invoiceFileUrl;
                      link.download = `invoice-${paymentData.invoiceNumber}.pdf`;
                      link.click();
                    }
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-4 py-3 transition-colors active:scale-[0.98] flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Section Title: Expected Payment */}
        {paymentData.status !== 'received' && paymentData.expectedDate && (
          <>
            <div className="text-sm font-medium text-white/50 tracking-wider uppercase mb-3">Expected Payment</div>

            {/* SECTION 5: Expected Payment (Glass Card) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-white/10 cursor-pointer transition-all duration-200 hover:bg-white/7 hover:border-white/15 shadow-lg shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:rounded-3xl before:pointer-events-none"
            >
              <div className="space-y-4">
                {/* Large Date */}
                <div>
                  <div className="text-sm text-white/60 mb-2">Expected Date</div>
                  <div className="text-2xl font-bold text-white">
                    {paymentData.expectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                {/* Countdown & Risk */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/60 mb-2">Time Remaining</div>
                    <div className="text-xl font-bold text-[#FFE770]">
                      {paymentData.daysInfo}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-white/60 mb-2">Risk Level</div>
                    <div className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-semibold",
                      riskConfig[paymentData.riskLevel].chipColor,
                      "border border-white/20"
                    )}>
                      {riskConfig[paymentData.riskLevel].label}
                    </div>
                  </div>
                </div>

                {/* Neon Yellow Progress Bar */}
                <div className="pt-2">
                  <div className="h-1 bg-[#FFE770]/60 rounded-full mt-3"></div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Section Title: Additional Information */}
        <div className="text-sm font-medium text-white/50 tracking-wider uppercase mb-3">Additional Information</div>

        {/* SECTION 6: Proof of Payment Upload (Optional) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.3 }}
          className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-white/10 cursor-pointer transition-all duration-200 hover:bg-white/7 hover:border-white/15 shadow-lg shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:rounded-3xl before:pointer-events-none"
        >
          <div className="relative z-10 space-y-4">
            <div>
              <div className="text-sm font-medium text-white mb-1">Proof of Payment (Optional)</div>
              <div className="text-xs text-white/60 mb-3">
                Upload payment screenshot or UTR for record-keeping
              </div>
            </div>

            {proofOfPaymentUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <FileText className="w-5 h-5 text-white/60 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">Proof of Payment</div>
                    <div className="text-xs text-white/60">Uploaded</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(proofOfPaymentUrl, '_blank', 'noopener,noreferrer')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      aria-label="View proof"
                    >
                      <Eye className="w-4 h-4 text-white/60" />
                    </button>
                    <button
                      onClick={() => {
                        setProofOfPaymentUrl(null);
                        setProofOfPaymentFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                        // TODO: Delete file from storage and update deal
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      aria-label="Remove proof"
                    >
                      <X className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                </div>
              </div>
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
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-white/30 hover:bg-white/5 transition-colors"
                >
                  <Upload className="w-5 h-5 text-white/60" />
                  <span className="text-sm text-white/70">
                    {proofOfPaymentFile ? proofOfPaymentFile.name : 'Click to upload screenshot or UTR'}
                  </span>
                </label>
                {proofOfPaymentFile && (
                  <button
                    onClick={handleUploadProof}
                    disabled={isUploadingProof}
                    className={cn(
                      "w-full bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-4 py-3",
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

        {/* SECTION 7: Notes / Comments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-white/10 cursor-pointer transition-all duration-200 hover:bg-white/7 hover:border-white/15 shadow-lg shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:rounded-3xl before:pointer-events-none"
        >
          <div className="relative z-10 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-white/60" />
                <div className="text-sm font-medium text-white">Notes / Comments</div>
              </div>
              <div className="text-xs text-white/60 mb-3">
                Add notes like "Brand said they'll pay next week"
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes here..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 resize-none"
            />

            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className={cn(
                "w-full bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-4 py-3",
                "transition-colors active:scale-[0.98] flex items-center justify-center gap-2 text-sm font-medium",
                isSavingNotes && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSavingNotes ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save Notes
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* SECTION 8: Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          className="space-y-3"
        >
          {/* Primary CTA - Neon Purple */}
          {paymentData.status !== 'received' && (
            <button
              onClick={handleMarkAsReceived}
              disabled={updateDealMutation.isPending}
              className={cn(
                "w-full rounded-xl py-4 bg-gradient-to-r from-[#A06BFF] to-[#7C3AED]",
                "text-white font-medium shadow-lg shadow-purple-900/40",
                "hover:from-[#8F5AFF] hover:to-[#6D28D9]",
                "transition-all duration-200 active:scale-[0.97]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {updateDealMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Marking as received...</span>
                </>
              ) : (
                'Mark as Received'
              )}
            </button>
          )}

          {/* Secondary Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                toast.info('Edit Payment feature coming soon');
                // TODO: Navigate to edit payment page
              }}
              className={cn(
                "bg-white/10 border border-white/20 rounded-xl px-4 py-3",
                "text-white/70 hover:text-white hover:bg-white/15",
                "transition-colors active:scale-[0.98]",
                "flex items-center justify-center gap-2 text-sm font-medium"
              )}
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this payment record?')) {
                  toast.info('Delete Payment feature coming soon');
                  // TODO: Implement delete functionality
                }
              }}
              className={cn(
                "bg-[#FF4D4D]/20 border border-[#FF4D4D]/30 rounded-xl px-4 py-3",
                "text-[#FF4D4D] hover:text-[#FF6B6B] hover:bg-[#FF4D4D]/30",
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
    </div>
  );
};

export default PaymentDetailPage;