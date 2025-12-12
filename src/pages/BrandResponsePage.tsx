"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';

interface RequestedChange {
  title: string;
  severity: 'high' | 'medium' | 'warning';
  category: string;
  description: string;
}

const BrandResponsePage = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const [selectedStatus, setSelectedStatus] = useState<'accepted' | 'negotiating' | 'rejected' | null>(null);
  const [message, setMessage] = useState('');
  const [brandTeamName, setBrandTeamName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dealInfo, setDealInfo] = useState<{
    brand_name: string;
    response_status: string;
    deal_amount?: number;
    deliverables?: string | string[];
  } | null>(null);
  const [requestedChanges, setRequestedChanges] = useState<RequestedChange[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showNegotiateModal, setShowNegotiateModal] = useState(false);
  const [negotiationPoints, setNegotiationPoints] = useState<string[]>([]);
  const [otherNegotiationText, setOtherNegotiationText] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isContractSummaryExpanded, setIsContractSummaryExpanded] = useState(false);
  
  // OTP Modal State
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [brandPhone, setBrandPhone] = useState<string>('');
  const [brandPhoneInput, setBrandPhoneInput] = useState<string>('+91 ');

  // Brand Summary Card Component - matches mockup exactly
  const BrandSummaryCard = ({ 
    dealValue, 
    deliverables 
  }: { 
    dealValue?: number | string | null; 
    deliverables?: string | string[] | null; 
  }) => {
    // Parse deliverables - handle JSON string or array
    let deliverablesList: string[] = [];
    if (deliverables) {
      if (typeof deliverables === 'string') {
        try {
          const parsed = JSON.parse(deliverables);
          deliverablesList = Array.isArray(parsed) ? parsed : [deliverables];
        } catch {
          deliverablesList = [deliverables];
        }
      } else if (Array.isArray(deliverables)) {
        deliverablesList = deliverables;
      }
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto mt-6 mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg text-white space-y-4"
      >
        {/* Title Row */}
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>📄</span> Summary of Requested Updates
        </h2>

        {/* Deal Value Row */}
        {dealValue && (
          <div className="flex justify-between text-sm">
            <span className="text-white/80">Deal Value</span>
            <span className="font-semibold text-green-300">
              ₹{Number(dealValue).toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Deliverables Section */}
        {deliverablesList.length > 0 && (
          <div className="text-sm">
            <span className="font-medium text-white/80">Deliverables:</span>
            <ul className="mt-1 space-y-1 list-none">
              {deliverablesList.map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#d8caff] mt-1">▪</span>
                  <span className="text-white/90">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Expected Outcome Card */}
        <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-xl text-sm">
          <div className="flex items-start gap-2 mb-1">
            <span className="text-yellow-300">⭐</span>
            <span className="font-medium text-white">Expected Outcome:</span>
          </div>
          <p className="text-white/80 text-xs mt-1">
            Most brands accept these revisions and send a clarified contract.
          </p>
        </div>
      </motion.div>
    );
  };

  // Full Contract Summary Component
  const FullContractSummary = () => {
    if (!analysisData) return null;

    const parties = analysisData.parties || {};
    const extractedTerms = analysisData.extractedTerms || {};
    const keyTerms = analysisData.keyTerms || {};

    // Extract values with fallbacks
    const brandName = parties.brandName || dealInfo?.brand_name || 'Not specified';
    const dealValue = keyTerms.dealValue || extractedTerms.paymentTerms || dealInfo?.deal_amount || null;
    const duration = keyTerms.duration || 'Not specified';
    const paymentTerms = extractedTerms.paymentTerms || keyTerms.paymentSchedule || 'Not specified';
    const usageRights = extractedTerms.usageRights || 'Not specified';
    const exclusivity = extractedTerms.exclusivity || keyTerms.exclusivity || 'Not specified';
    const termination = extractedTerms.termination || 'Not specified';

    // Parse deliverables
    let deliverablesList: string[] = [];
    const deliverablesText = extractedTerms.deliverables || keyTerms.deliverables || dealInfo?.deliverables;
    if (deliverablesText) {
      if (typeof deliverablesText === 'string') {
        try {
          const parsed = JSON.parse(deliverablesText);
          deliverablesList = Array.isArray(parsed) ? parsed : [deliverablesText];
        } catch {
          deliverablesList = [deliverablesText];
        }
      } else if (Array.isArray(deliverablesText)) {
        deliverablesList = deliverablesText;
      }
    }

    // Download PDF function
    const downloadFullSummaryPDF = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        // Get the summary content element
        const summaryElement = document.getElementById('full-contract-summary-content');
        if (!summaryElement) {
          toast.error('Could not find summary content');
          return;
        }

        toast.loading('Generating PDF...', { id: 'pdf-generate' });

        // Create canvas from the summary content
        const canvas = await html2canvas(summaryElement, {
          backgroundColor: '#1e1b4b', // Purple background
          scale: 2,
          useCORS: true,
          logging: false,
        });

        // Create PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Download PDF
        const fileName = `Contract_Summary_${dealInfo?.brand_name || 'Deal'}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

        toast.success('PDF downloaded successfully', { id: 'pdf-generate' });
        triggerHaptic(HapticPatterns.success);
      } catch (error: any) {
        console.error('[BrandResponsePage] PDF generation error:', error);
        toast.error('Failed to generate PDF. Please try again.', { id: 'pdf-generate' });
        triggerHaptic(HapticPatterns.error);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg text-white space-y-4"
      >
        {/* Title Row with Chevron */}
        <button
          onClick={() => setIsContractSummaryExpanded(!isContractSummaryExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex flex-col items-start gap-1">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              {isContractSummaryExpanded ? (
                <ChevronDown className="w-5 h-5 text-white/60" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white/60 rotate-[-90deg]" />
              )}
              Full Contract Summary
            </h2>
            <p className="text-xs text-white/60 ml-7">
              View complete contract details extracted by AI
            </p>
          </div>
          <motion.div
            animate={{ rotate: isContractSummaryExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-white/60" />
          </motion.div>
        </button>

        {/* Collapsible Content */}
        <AnimatePresence>
          {isContractSummaryExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div id="full-contract-summary-content" className="pt-4 space-y-4 border-t border-white/10">
                {/* Brand Name */}
                <div>
                  <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Brand Name</div>
                  <div className="text-white font-medium">{brandName}</div>
                </div>

                {/* Deal Value */}
                {dealValue && (
                  <div>
                    <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Deal Value</div>
                    <div className="text-white font-medium">
                      {typeof dealValue === 'number' 
                        ? `₹${Number(dealValue).toLocaleString('en-IN')}`
                        : dealValue}
                    </div>
                  </div>
                )}

                {/* Deliverables */}
                {deliverablesList.length > 0 && (
                  <div>
                    <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Deliverables</div>
                    <ul className="text-white/80 list-disc list-inside space-y-1">
                      {deliverablesList.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Timeline / Duration */}
                {duration !== 'Not specified' && (
                  <div>
                    <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Timeline / Duration</div>
                    <div className="text-white font-medium">{duration}</div>
                  </div>
                )}

                {/* Payment Terms */}
                {paymentTerms !== 'Not specified' && (
                  <div>
                    <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Payment Terms</div>
                    <div className="text-white font-medium">{paymentTerms}</div>
                  </div>
                )}

                {/* Usage Rights */}
                {usageRights !== 'Not specified' && (
                  <div>
                    <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Usage Rights</div>
                    <div className="text-white font-medium">{usageRights}</div>
                  </div>
                )}

                {/* Exclusivity Terms */}
                {exclusivity !== 'Not specified' && (
                  <div>
                    <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Exclusivity Terms</div>
                    <div className="text-white font-medium">{exclusivity}</div>
                  </div>
                )}

                {/* Termination Clause */}
                {termination !== 'Not specified' && (
                  <div>
                    <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Termination Clause</div>
                    <div className="text-white font-medium">{termination}</div>
                  </div>
                )}

                {/* Download PDF Button */}
                <div className="pt-4 mt-4 border-t border-white/10 flex justify-end">
                  <button
                    onClick={downloadFullSummaryPDF}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-medium text-white shadow-lg shadow-purple-500/20 active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4" />
                    Download Full Summary PDF
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Extract negotiation points from requested changes
  const availableNegotiationPoints = requestedChanges
    .map(change => change.title)
    .filter((title, index, self) => self.indexOf(title) === index)
    .slice(0, 10); // Limit to 10 most relevant

  // Fetch deal info and requested changes on mount
  useEffect(() => {
    const fetchDealInfo = async () => {
      if (!dealId) {
        toast.error('Invalid deal ID');
        setIsLoading(false);
        return;
      }

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
          (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
            ? 'https://api.noticebazaar.com' 
            : 'http://localhost:3001');
        
        const response = await fetch(`${apiBaseUrl}/api/brand-response/${dealId}`);
        const data = await response.json();

        if (!response.ok || !data.success || !data.deal) {
          setDealInfo(null);
          setRequestedChanges([]);
          setAnalysisData(null);
          setIsSubmitted(false);
          return;
        }

        setDealInfo(data.deal);
        if (data.requested_changes && Array.isArray(data.requested_changes)) {
          setRequestedChanges(data.requested_changes);
        }
        if (data.analysis_data) {
          setAnalysisData(data.analysis_data);
        }
        if (data.deal.response_status !== 'pending') {
          setIsSubmitted(true);
        }
        // Extract brand phone for OTP
        if (data.deal.brand_phone) {
          setBrandPhone(data.deal.brand_phone);
        }
      } catch (error: any) {
        console.error('[BrandResponsePage] Fetch error:', error);
        toast.error('Failed to load deal information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDealInfo();
  }, [dealId]);

  // OTP Functions
  const sendOTP = async () => {
    if (!dealId) {
      toast.error('Invalid deal ID');
      return;
    }

    // Use input phone if provided, otherwise use deal's brand_phone
    let phoneToUse = brandPhoneInput.trim() || brandPhone;
    
    // Ensure +91 prefix is present
    if (phoneToUse && !phoneToUse.startsWith('+91')) {
      phoneToUse = '+91 ' + phoneToUse.replace(/^\+91\s*/, '').trim();
    }
    
    // Validate phone number (must have +91 and at least 10 digits)
    const digitsOnly = phoneToUse.replace(/\D/g, '');
    if (!phoneToUse || phoneToUse.trim() === '' || phoneToUse === '+91' || phoneToUse === '+91 ' || digitsOnly.length < 12) {
      toast.error('Please enter a valid 10-digit phone number (with +91 prefix).');
      return;
    }

    setIsSendingOTP(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
        (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
          ? 'https://api.noticebazaar.com' 
          : 'http://localhost:3001');
      
      const response = await fetch(`${apiBaseUrl}/api/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          dealId,
          phone: phoneToUse, // Send phone number
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('OTP sent successfully!');
        triggerHaptic(HapticPatterns.success);
        // Set 30 second cooldown
        setOtpResendCooldown(30);
        const interval = setInterval(() => {
          setOtpResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        throw new Error(data.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('[BrandResponsePage] OTP send error:', error);
      toast.error(error.message || 'Failed to send OTP. Please try again.');
      triggerHaptic(HapticPatterns.error);
    } finally {
      setIsSendingOTP(false);
    }
  };

  const verifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    if (!dealId) {
      toast.error('Invalid deal ID');
      return;
    }

    setIsVerifyingOTP(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
        (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
          ? 'https://api.noticebazaar.com' 
          : 'http://localhost:3001');
      
      const response = await fetch(`${apiBaseUrl}/api/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dealId, otp: otpString }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('OTP verified successfully!');
        triggerHaptic(HapticPatterns.success);
        // Close OTP modal and submit the response
        setShowOTPModal(false);
        await submitBrandResponse();
      } else {
        throw new Error(data.error || 'Invalid OTP');
      }
    } catch (error: any) {
      console.error('[BrandResponsePage] OTP verify error:', error);
      toast.error(error.message || 'Invalid OTP. Please try again.');
      triggerHaptic(HapticPatterns.error);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const submitBrandResponse = async () => {
    if (!selectedStatus) {
      toast.error('Please select a decision');
      return;
    }

    if (!dealId) {
      toast.error('Invalid deal ID');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic(HapticPatterns.medium);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
        (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
          ? 'https://api.noticebazaar.com' 
          : 'http://localhost:3001');
      
      // Build message with negotiation points if negotiating
      let finalMessage = message.trim();
      if (selectedStatus === 'negotiating' && (negotiationPoints.length > 0 || otherNegotiationText.trim())) {
        const pointsList = negotiationPoints.map(point => `• ${point}`).join('\n');
        const otherText = otherNegotiationText.trim() ? `\n• Other: ${otherNegotiationText.trim()}` : '';
        if (pointsList || otherText) {
          finalMessage = `Points to negotiate:\n${pointsList}${otherText}${finalMessage ? '\n\nAdditional comments:\n' + finalMessage : ''}`;
        }
      }
      
      const response = await fetch(`${apiBaseUrl}/api/brand-response/${dealId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedStatus === 'accepted' ? 'accepted_verified' : selectedStatus,
          message: finalMessage || undefined,
          brand_team_name: brandTeamName.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        toast.success('Response submitted successfully!');
        triggerHaptic(HapticPatterns.success);
      } else {
        throw new Error(data.error || 'Failed to submit response');
      }
    } catch (error: any) {
      console.error('[BrandResponsePage] Submit error:', error);
      toast.error(error.message || 'Failed to submit response. Please try again.');
      triggerHaptic(HapticPatterns.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStatus) {
      toast.error('Please select a decision');
      triggerHaptic(HapticPatterns.error);
      return;
    }

    if (!dealId) {
      toast.error('Invalid deal ID');
      return;
    }

    // If accepting, validate phone number first
    if (selectedStatus === 'accepted') {
      let phoneToUse = brandPhoneInput.trim() || brandPhone;
      
      // Ensure +91 prefix is present
      if (phoneToUse && !phoneToUse.startsWith('+91')) {
        phoneToUse = '+91 ' + phoneToUse.replace(/^\+91\s*/, '').trim();
      }
      
      // Validate phone number (must have +91 and at least 10 digits)
      const digitsOnly = phoneToUse.replace(/\D/g, '');
      if (!phoneToUse || phoneToUse.trim() === '' || phoneToUse === '+91' || phoneToUse === '+91 ' || digitsOnly.length < 12) {
        toast.error('Please enter a valid 10-digit phone number (with +91 prefix).');
        return;
      }
      
      setShowOTPModal(true);
      // Auto-send OTP when modal opens
      await sendOTP();
      return;
    }

    // For negotiate/reject, submit directly
    await submitBrandResponse();
  };

  const handleStatusSelect = (status: 'accepted' | 'negotiating' | 'rejected') => {
    setSelectedStatus(status);
    triggerHaptic(HapticPatterns.light);
    
    if (status === 'negotiating') {
      setShowNegotiateModal(true);
    } else {
      setShowNegotiateModal(false);
    }
  };

  const toggleNegotiationPoint = (point: string) => {
    setNegotiationPoints(prev => 
      prev.includes(point) 
        ? prev.filter(p => p !== point)
        : [...prev, point]
    );
  };

  // OTP Input Handlers
  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      // Focus last input
      const lastInput = document.getElementById(`otp-input-5`);
      lastInput?.focus();
    }
  };

  // Mask phone number for display
  const getMaskedPhone = () => {
    const phoneToUse = brandPhoneInput.trim() || brandPhone;
    if (!phoneToUse) return '****';
    const cleaned = phoneToUse.replace(/[\s\-+()]/g, '');
    if (cleaned.length >= 4) {
      return cleaned.slice(-4);
    }
    return '****';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (!dealInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Deal Not Found</h1>
          <p className="text-white/70 mb-6">
            The deal you're looking for doesn't exist or has been removed.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-white/60">
              This could happen if:
            </p>
            <ul className="text-sm text-white/50 text-left space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>The deal link has expired or was invalid</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>The deal was deleted or never created</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>The deal ID in the URL is incorrect</span>
              </li>
            </ul>
            <p className="text-sm text-white/70">
              Please contact the creator to request a new link, or check if you have the correct deal ID.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white pb-8 md:pb-12">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* 1. TOP HEADER SECTION */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            NoticeBazaar
          </h1>
          <div className="h-0.5 w-32 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 mx-auto rounded-full mb-4" />
          <h2 className="text-2xl md:text-3xl font-semibold mb-2">
            {dealInfo.brand_name} Collaboration
          </h2>
          <p className="text-white/70 text-sm md:text-base">
            Please confirm your decision on the requested contract updates
          </p>
        </motion.div>

        {!isSubmitted ? (
          <div className="space-y-4">
            {/* Brand Summary Card */}
            <BrandSummaryCard 
              dealValue={dealInfo?.deal_amount}
              deliverables={dealInfo?.deliverables}
            />

            {/* Full Contract Summary */}
            <FullContractSummary />

            {/* 2. DECISION CARD COMPONENTS */}
            {/* Accept All Changes */}
            <motion.button
              onClick={() => handleStatusSelect('accepted')}
              className={cn(
                "w-full rounded-xl p-5 md:p-6 text-left transition-all duration-300",
                "border-2 backdrop-blur-xl shadow-lg",
                selectedStatus === 'accepted'
                  ? "bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-400 shadow-green-500/20"
                  : "bg-white/5 border-white/20 hover:border-white/30 hover:bg-white/10"
              )}
              whileHover={selectedStatus !== 'accepted' ? { scale: 1.01 } : {}}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all",
                  selectedStatus === 'accepted'
                    ? "bg-green-500/30 border-green-400"
                    : "bg-white/10 border-white/30"
                )}>
                  <CheckCircle className={cn(
                    "w-6 h-6",
                    selectedStatus === 'accepted' ? "text-green-300" : "text-white/60"
                  )} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-semibold mb-1">Accept All Changes</h3>
                  <p className="text-white/70 text-sm md:text-base mb-1">
                    I agree to all requested contract revisions
                  </p>
                  <p className="text-white/50 text-xs md:text-sm italic">
                    Most creators request these standard safety updates
                  </p>
                </div>
              </div>
            </motion.button>

            {/* Want to Negotiate */}
            <motion.button
              onClick={() => handleStatusSelect('negotiating')}
              className={cn(
                "w-full rounded-xl p-5 md:p-6 text-left transition-all duration-300",
                "border-2 backdrop-blur-xl shadow-lg",
                selectedStatus === 'negotiating'
                  ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-400 shadow-blue-500/20"
                  : "bg-white/5 border-white/20 hover:border-white/30 hover:bg-white/10"
              )}
              whileHover={selectedStatus !== 'negotiating' ? { scale: 1.01 } : {}}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all",
                  selectedStatus === 'negotiating'
                    ? "bg-blue-500/30 border-blue-400"
                    : "bg-white/10 border-white/30"
                )}>
                  <AlertCircle className={cn(
                    "w-6 h-6",
                    selectedStatus === 'negotiating' ? "text-blue-300" : "text-white/60"
                  )} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-semibold mb-1">Want to Negotiate</h3>
                  <p className="text-white/70 text-sm md:text-base mb-1">
                    I'd like to discuss some of the requested changes
                  </p>
                  <p className="text-white/50 text-xs md:text-sm italic">
                    You can discuss specific points after submitting
                  </p>
                </div>
              </div>
            </motion.button>

            {/* Reject Changes */}
            <motion.button
              onClick={() => handleStatusSelect('rejected')}
              className={cn(
                "w-full rounded-xl p-5 md:p-6 text-left transition-all duration-300",
                "border-2 backdrop-blur-xl shadow-lg",
                selectedStatus === 'rejected'
                  ? "bg-gradient-to-br from-red-500/20 to-rose-500/10 border-red-400 shadow-red-500/20"
                  : "bg-white/5 border-white/20 hover:border-white/30 hover:bg-white/10"
              )}
              whileHover={selectedStatus !== 'rejected' ? { scale: 1.01 } : {}}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all",
                  selectedStatus === 'rejected'
                    ? "bg-red-500/30 border-red-400"
                    : "bg-white/10 border-white/30"
                )}>
                  <XCircle className={cn(
                    "w-6 h-6",
                    selectedStatus === 'rejected' ? "text-red-300" : "text-white/60"
                  )} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-semibold mb-1">Reject Changes</h3>
                  <p className="text-white/70 text-sm md:text-base mb-1">
                    I cannot accept the requested revisions
                  </p>
                  <p className="text-white/50 text-xs md:text-sm italic">
                    You may continue the deal, but some unclear terms may remain
                  </p>
                </div>
              </div>
            </motion.button>

            {/* 3. NAME + COMMENTS SECTION */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-5 md:p-6 border border-white/20 shadow-lg space-y-5">
              {/* Phone Number Input - Required for OTP if accepting - Show FIRST when accepting */}
              {selectedStatus === 'accepted' && (
                <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-400/30 rounded-xl p-4 space-y-2">
                  <label className="block text-sm font-semibold mb-2 text-white">
                    📱 Phone Number <span className="text-red-400">*</span>
                    <span className="text-xs font-normal text-white/60 ml-2">(Required for OTP verification)</span>
                  </label>
                  <input
                    type="tel"
                    value={brandPhoneInput}
                    onChange={(e) => {
                      let value = e.target.value;
                      
                      // Ensure +91 prefix is always present
                      if (!value.startsWith('+91')) {
                        // If user deletes the prefix, restore it
                        if (value.trim() === '' || value === '+') {
                          value = '+91 ';
                        } else if (!value.startsWith('+91 ')) {
                          // If user types something without +91, prepend it
                          value = '+91 ' + value.replace(/^\+91\s*/, '');
                        }
                      }
                      
                      // Allow only digits, spaces, +, -, and () after +91
                      value = value.replace(/[^\d\s\+\-\(\)]/g, '');
                      
                      // Ensure +91 is followed by a space
                      if (value.startsWith('+91') && value.length > 3 && value[3] !== ' ') {
                        value = '+91 ' + value.substring(3).replace(/\s+/g, '');
                      }
                      
                      setBrandPhoneInput(value);
                    }}
                    onFocus={(e) => {
                      // If field is empty or just +91, ensure +91 is there
                      if (!e.target.value || e.target.value === '+91') {
                        setBrandPhoneInput('+91 ');
                      }
                    }}
                    placeholder="+91 98765 43210"
                    className="w-full p-4 rounded-xl bg-white/10 border-2 border-purple-400/50 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg font-medium"
                    maxLength={18}
                    autoFocus
                  />
                  <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                    <span className="text-yellow-400">⚠️</span>
                    We'll send a 6-digit OTP to this number to verify your acceptance
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-white/90">
                  Your Name / Team (Optional)
                </label>
                <input
                  type="text"
                  value={brandTeamName}
                  onChange={(e) => setBrandTeamName(e.target.value)}
                  placeholder="e.g. Aditi – Brand Partnerships Team"
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white/90">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add any additional notes or questions..."
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none min-h-[120px] transition-all"
                  maxLength={1000}
                  style={{ 
                    minHeight: '120px',
                    height: message ? `${Math.max(120, message.split('\n').length * 24 + 32)}px` : '120px'
                  }}
                />
                <div className="text-xs text-white/50 mt-2 text-right">
                  {message.length}/1000
                </div>
              </div>
            </div>

            {/* 4. TRUST NOTES SECTION */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 md:p-5 border border-white/20 shadow-lg">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/80">Your reply will be shared with the creator</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/80">You can update your response later</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/80">This decision does not legally bind you</p>
                </div>
              </div>
            </div>

            {/* 5. BOTTOM CTA BUTTON */}
            <motion.button
              onClick={handleSubmit}
              disabled={!selectedStatus || isSubmitting}
              whileHover={selectedStatus && !isSubmitting ? { scale: 1.02 } : {}}
              whileTap={selectedStatus && !isSubmitting ? { scale: 0.98 } : {}}
              className={cn(
                "w-full py-4 rounded-xl font-semibold transition-all duration-300",
                "flex items-center justify-center gap-2 min-h-[56px] shadow-xl",
                selectedStatus === 'accepted' && !isSubmitting
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  : selectedStatus === 'negotiating' && !isSubmitting
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                  : selectedStatus === 'rejected' && !isSubmitting
                  ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                  : "bg-white/10 text-white/50 cursor-not-allowed border border-white/20"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : selectedStatus === 'accepted' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Confirm Acceptance
                </>
              ) : selectedStatus === 'negotiating' ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Submit Negotiation Request
                </>
              ) : selectedStatus === 'rejected' ? (
                <>
                  <XCircle className="w-5 h-5" />
                  Submit Rejection
                </>
              ) : (
                'Select a decision to continue'
              )}
            </motion.button>
          </div>
        ) : (
          /* POST-SUBMISSION CONFIRMATION */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 md:p-12 border border-white/20 shadow-xl text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mb-6"
            >
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-4">Response Submitted Successfully!</h3>
            
            <div className="space-y-3 mb-6 text-left max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-white/90 text-sm">Response sent securely</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-white/90 text-sm">Creator notified instantly</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-white/90 text-sm">This response is legally time-stamped</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 6. NEGOTIATION MODAL */}
        <AnimatePresence>
          {showNegotiateModal && selectedStatus === 'negotiating' && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNegotiateModal(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full z-50 bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-blue-600/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">What would you like to negotiate?</h4>
                  <button
                    onClick={() => setShowNegotiateModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  {availableNegotiationPoints.length > 0 ? (
                    availableNegotiationPoints.map((point) => (
                      <label
                        key={point}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={negotiationPoints.includes(point)}
                          onChange={() => toggleNegotiationPoint(point)}
                          className="w-5 h-5 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent"
                        />
                        <span className="text-white/90 text-sm">{point}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-white/60 text-sm text-center py-4">
                      No specific negotiation points available
                    </p>
                  )}
                  
                  {/* Other field */}
                  <div className="pt-2 border-t border-white/10">
                    <label className="block text-sm font-medium mb-2 text-white/90">
                      Other
                    </label>
                    <input
                      type="text"
                      value={otherNegotiationText}
                      onChange={(e) => setOtherNegotiationText(e.target.value)}
                      placeholder="Specify other points to negotiate..."
                      className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                  </div>
                </div>
                
                <button
                  onClick={() => setShowNegotiateModal(false)}
                  className="mt-4 w-full py-3 bg-blue-500/30 hover:bg-blue-500/40 rounded-xl text-sm font-medium transition-colors"
                >
                  Done
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 7. OTP VERIFICATION MODAL */}
        <AnimatePresence>
          {showOTPModal && selectedStatus === 'accepted' && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!isVerifyingOTP && !isSendingOTP) {
                    setShowOTPModal(false);
                    setOtp(['', '', '', '', '', '']);
                  }
                }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full z-50 bg-gradient-to-br from-purple-500/20 via-indigo-500/10 to-purple-600/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/30 shadow-2xl"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold mb-2">Verify your acceptance</h3>
                  <p className="text-white/70 text-sm">
                    Enter the 6-digit OTP sent to your phone ending in <span className="font-medium text-white">{getMaskedPhone()}</span>
                  </p>
                </div>

                {/* OTP Input Boxes */}
                <div className="flex justify-center gap-2 mb-6">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-input-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      onPaste={index === 0 ? handleOTPPaste : undefined}
                      className="w-12 h-14 text-center text-2xl font-semibold bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-all"
                      disabled={isVerifyingOTP || isSendingOTP}
                    />
                  ))}
                </div>

                {/* Resend OTP Button */}
                <div className="text-center mb-4">
                  <button
                    onClick={sendOTP}
                    disabled={isSendingOTP || otpResendCooldown > 0}
                    className={cn(
                      "text-sm text-purple-300 hover:text-purple-200 transition-colors",
                      (isSendingOTP || otpResendCooldown > 0) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isSendingOTP ? (
                      'Sending...'
                    ) : otpResendCooldown > 0 ? (
                      `Resend OTP in ${otpResendCooldown}s`
                    ) : (
                      'Resend OTP'
                    )}
                  </button>
                </div>

                {/* Verify Button */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowOTPModal(false);
                      setOtp(['', '', '', '', '', '']);
                    }}
                    disabled={isVerifyingOTP || isSendingOTP}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={verifyOTP}
                    disabled={isVerifyingOTP || isSendingOTP || otp.join('').length !== 6}
                    className={cn(
                      "flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                      !isVerifyingOTP && !isSendingOTP && otp.join('').length === 6 && "shadow-lg shadow-purple-500/20"
                    )}
                  >
                    {isVerifyingOTP ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify OTP'
                    )}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BrandResponsePage;
