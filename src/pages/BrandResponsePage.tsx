"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Loader2,
  X,
  ChevronDown,
  Download,
  Info,
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
  const { token } = useParams<{ token: string }>();
  const [selectedStatus, setSelectedStatus] = useState<
    'accepted' | 'negotiating' | 'rejected' | null
  >('accepted');
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
  const [brandEmail, setBrandEmail] = useState<string>('');
  const [brandEmailInput, setBrandEmailInput] = useState<string>('');

  // Brand Summary Card Component - Deal Snapshot only
  const BrandSummaryCard = ({
    dealValue,
    deliverables,
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
        className="w-full max-w-2xl mx-auto mt-4 mb-4 rounded-2xl border border-purple-900/70 bg-[#080021]/90 p-5 md:p-6 text-violet-50 space-y-4"
      >
        {/* Deal snapshot */}
        <div className="space-y-3">
          <div className="flex flex-col items-start gap-1">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-violet-300/80">
              Deal snapshot
            </p>
            <p className="text-xs text-violet-200/80">
              Quick view of value and deliverables for this collaboration.
            </p>
          </div>

          {/* Deal Value Row */}
          {dealValue && (
            <div className="flex justify-between items-center py-1.5 text-sm">
              <span className="text-violet-100/90">Deal value</span>
              <span className="font-medium text-emerald-300">
                ₹{Number(dealValue).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {/* Deliverables Section */}
          {deliverablesList.length > 0 ? (
            <div className="space-y-1.5 text-sm">
              <span className="font-medium text-violet-50 block">
                Deliverables
              </span>
              <ul className="space-y-1.5 list-none">
                {deliverablesList.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-violet-100 text-xs md:text-sm"
                  >
                    <span className="mt-[3px] text-violet-400/80">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-sm">
              <span className="font-medium text-violet-50">Deliverables</span>
              <span className="ml-2 text-violet-200/80">
                To be mutually confirmed
              </span>
            </div>
          )}
        </div>

      </motion.div>
    );
  };

  // Helper to derive a friendly "Reason" label for requested changes
  const getReasonLabel = (change: RequestedChange) => {
    const title = change.title.toLowerCase();
    const category = (change.category || '').toLowerCase();

    if (
      category.includes('payment') ||
      title.includes('payment') ||
      title.includes('fee') ||
      title.includes('payout')
    ) {
      return 'Reason: payment clarity';
    }

    if (
      category.includes('timeline') ||
      category.includes('schedule') ||
      title.includes('timeline') ||
      title.includes('schedule') ||
      title.includes('deadline')
    ) {
      return 'Reason: timeline clarity';
    }

    return 'Reason: overall clarity';
  };

  // Requested Updates / Clarifications card
  const RequestedUpdatesCard = ({
    requestedChanges,
  }: {
    requestedChanges: RequestedChange[];
  }) => {
    const hasRequests = requestedChanges && requestedChanges.length > 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto rounded-2xl border border-purple-900/70 bg-[#080021]/90 p-5 md:p-6 text-violet-50 space-y-3"
      >
        <div className="space-y-1">
          <h2 className="text-sm md:text-base font-semibold text-violet-50">
            Requested Contract Clarifications
          </h2>
          <p className="text-xs text-violet-200/80">
            These clarifications help avoid confusion later without changing the
            commercial intent of the deal.
          </p>
        </div>

        {!hasRequests ? (
          <div className="mt-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2.5 text-xs md:text-sm text-emerald-50">
            <p className="font-medium">No changes requested. Contract looks good.</p>
          </div>
        ) : (
          <ul className="mt-2 space-y-2">
            {requestedChanges.map((change, index) => (
              <li
                key={`${change.title}-${index}`}
                className="flex items-start gap-3 rounded-xl border border-purple-900/70 bg-[#090024] px-3 py-2.5"
              >
                <div className="mt-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs md:text-sm text-violet-50 truncate">
                    {change.title}
                  </p>
                  <p className="text-[0.7rem] text-violet-300/85">
                    {getReasonLabel(change)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    );
  };

  // Expected Outcome card - confidence builder
  const ExpectedOutcomeCard = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 md:px-6 md:py-5 text-emerald-50 space-y-1"
      >
        <p className="text-sm md:text-base font-semibold">Expected Outcome</p>
        <p className="text-xs md:text-sm text-emerald-100/90">
          Most brands approve these standard clarifications and proceed smoothly.
        </p>
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
          backgroundColor: '#020617', // Match calm dark background
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
        className="w-full max-w-2xl mx-auto mb-6 rounded-2xl border border-purple-900/70 bg-[#080021]/90 p-5 md:p-6 text-violet-50 space-y-4"
      >
        {/* Title Row with Chevron */}
        <button
          onClick={() => setIsContractSummaryExpanded(!isContractSummaryExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex flex-col items-start gap-1">
            <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
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
            <ChevronDown className="w-5 h-5 text-slate-400" />
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
              <div
                id="full-contract-summary-content"
                className="pt-4 space-y-4 border-t border-slate-800"
              >
                {/* Brand Name */}
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                    Brand Name
                  </div>
                  <div className="text-slate-50 font-medium">{brandName}</div>
                </div>

                {/* Deal Value */}
                {dealValue && (
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                      Deal Value
                    </div>
                    <div className="text-slate-50 font-medium">
                      {typeof dealValue === 'number'
                        ? `₹${Number(dealValue).toLocaleString('en-IN')}`
                        : dealValue}
                    </div>
                  </div>
                )}

                {/* Deliverables */}
                {deliverablesList.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                      Deliverables
                    </div>
                    <ul className="text-slate-200 list-disc list-inside space-y-1">
                      {deliverablesList.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Timeline / Duration */}
                {duration !== 'Not specified' && (
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                      Timeline / Duration
                    </div>
                    <div className="text-slate-50 font-medium">{duration}</div>
                  </div>
                )}

                {/* Payment Terms */}
                {paymentTerms !== 'Not specified' && (
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                      Payment Terms
                    </div>
                    <div className="text-slate-50 font-medium">
                      {paymentTerms}
                    </div>
                  </div>
                )}

                {/* Usage Rights */}
                {usageRights !== 'Not specified' && (
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                      Usage Rights
                    </div>
                    <div className="text-slate-50 font-medium">
                      {usageRights}
                    </div>
                  </div>
                )}

                {/* Exclusivity Terms */}
                {exclusivity !== 'Not specified' && (
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                      Exclusivity Terms
                    </div>
                    <div className="text-slate-50 font-medium">
                      {exclusivity}
                    </div>
                  </div>
                )}

                {/* Termination Clause */}
                {termination !== 'Not specified' && (
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                      Termination Clause
                    </div>
                    <div className="text-slate-50 font-medium">
                      {termination}
                    </div>
                  </div>
                )}

                {/* Download PDF Button */}
                <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={downloadFullSummaryPDF}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all duration-200 flex items-center gap-2 text-sm font-medium text-slate-50 active:scale-[0.98]"
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
      if (!token) {
        toast.error('Invalid token');
        setIsLoading(false);
        return;
      }

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
          (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
            ? 'https://api.creatorarmour.com' 
            : 'https://noticebazaar-api.onrender.com');
        
        const response = await fetch(`${apiBaseUrl}/api/brand-response/${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          // Handle token validation errors
          if (data.errorType === 'token_not_found' || data.errorType === 'token_revoked' || data.errorType === 'token_expired') {
          setDealInfo(null);
          setRequestedChanges([]);
          setAnalysisData(null);
          setIsSubmitted(false);
          return;
          }
          
          if (!data.deal) {
            setDealInfo(null);
            setRequestedChanges([]);
            setAnalysisData(null);
            setIsSubmitted(false);
            return;
          }
        }

        setDealInfo(data.deal);

        if (data.requested_changes && Array.isArray(data.requested_changes)) {
          setRequestedChanges(data.requested_changes);
        }

        if (data.analysis_data) {
          setAnalysisData(data.analysis_data);

          // Fallback: if backend has no requested_changes, derive from analysis issues
          if (
            (!data.requested_changes ||
              !Array.isArray(data.requested_changes) ||
              data.requested_changes.length === 0) &&
            Array.isArray(data.analysis_data.issues)
          ) {
            const derived = data.analysis_data.issues
              .filter(
                (issue: any) =>
                  issue &&
                  ['high', 'medium', 'warning'].includes(
                    String(issue.severity || '').toLowerCase()
                  )
              )
              .map((issue: any) => ({
                title: issue.title || 'Requested clarification',
                severity: (issue.severity || 'medium') as
                  | 'high'
                  | 'medium'
                  | 'warning',
                category: issue.category || '',
                description: issue.description || '',
              }));

            if (derived.length > 0) {
              setRequestedChanges(derived);
            }
          }
        }
        if (data.deal.response_status !== 'pending') {
          setIsSubmitted(true);
        }
        // Extract brand email for OTP
        if (data.deal.brand_email) {
          setBrandEmail(data.deal.brand_email);
          setBrandEmailInput(data.deal.brand_email);
        }
      } catch (error: any) {
        console.error('[BrandResponsePage] Fetch error:', error);
        toast.error('Failed to load deal information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDealInfo();
  }, [token]);

  // OTP Functions
  const sendOTP = async () => {
    if (!token) {
      toast.error('Invalid token');
      return;
    }

    // Use input email if provided, otherwise use deal's brand_email
    let emailToUse = brandEmailInput.trim() || brandEmail;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailToUse || emailToUse.trim() === '' || !emailRegex.test(emailToUse)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSendingOTP(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
        (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
          ? 'https://api.creatorarmour.com' 
          : 'https://noticebazaar-api.onrender.com');
      
      const response = await fetch(`${apiBaseUrl}/api/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          email: emailToUse, // Send email address
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('OTP sent successfully to your email!');
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

    if (!token) {
      toast.error('Invalid token');
      return;
    }

    setIsVerifyingOTP(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
        (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
          ? 'https://api.creatorarmour.com' 
          : 'https://noticebazaar-api.onrender.com');
      
      const response = await fetch(`${apiBaseUrl}/api/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, otp: otpString }),
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

    if (!token) {
      toast.error('Invalid token');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic(HapticPatterns.medium);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
        (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
          ? 'https://api.creatorarmour.com' 
          : 'https://noticebazaar-api.onrender.com');
      
      // Build message with negotiation points if negotiating
      let finalMessage = message.trim();
      if (selectedStatus === 'negotiating' && (negotiationPoints.length > 0 || otherNegotiationText.trim())) {
        const pointsList = negotiationPoints.map(point => `• ${point}`).join('\n');
        const otherText = otherNegotiationText.trim() ? `\n• Other: ${otherNegotiationText.trim()}` : '';
        if (pointsList || otherText) {
          finalMessage = `Points to negotiate:\n${pointsList}${otherText}${finalMessage ? '\n\nAdditional comments:\n' + finalMessage : ''}`;
        }
      }
      
      const response = await fetch(`${apiBaseUrl}/api/brand-response/${token}`, {
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

    // If accepting, validate email first
    if (selectedStatus === 'accepted') {
      let emailToUse = brandEmailInput.trim() || brandEmail;
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailToUse || emailToUse.trim() === '' || !emailRegex.test(emailToUse)) {
        toast.error('Please enter a valid email address.');
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

  // Mask email for display
  const getMaskedEmail = () => {
    const emailToUse = brandEmailInput.trim() || brandEmail;
    if (!emailToUse) return '****';
    const [localPart, domain] = emailToUse.split('@');
    if (localPart && domain) {
      const maskedLocal = localPart.length > 2 
        ? localPart.substring(0, 2) + '***' 
        : '***';
      return `${maskedLocal}@${domain}`;
    }
    return '****';
  };

  if (isLoading) {
    return (
      <div className="nb-screen-height bg-[#050019] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-100 mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!dealInfo) {
    return (
      <div className="nb-screen-height bg-[#050019] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-50 mb-2">
            Link No Longer Valid
          </h1>
          <p className="text-slate-400 mb-6">
            This link is no longer valid. Please contact the creator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="nb-screen-height bg-[#050019] text-slate-50 pb-8 md:pb-12">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* 1. TOP HEADER SECTION */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-3 space-y-3"
        >
          <div className="space-y-1">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-violet-300/90">
              Creator Armour
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold text-violet-50">
              Collaboration Response
            </h1>
          </div>
          <p className="text-sm md:text-base font-medium text-violet-100">
            {dealInfo.brand_name} × Creator Collaboration
          </p>
          <p className="text-xs md:text-sm text-violet-200/80 max-w-md mx-auto">
            This response helps finalize collaboration terms clearly and
            professionally.
          </p>
        </motion.div>

        {/* 2. Calm reassurance / context card */}
        <div className="w-full max-w-2xl mx-auto rounded-2xl border border-emerald-400/25 bg-emerald-500/7 px-4 py-3 md:px-5 md:py-4 text-left text-xs md:text-sm text-emerald-50/90 flex gap-3">
          <div className="mt-0.5">
            <Info className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-emerald-100 text-sm">
              What this response is (and isn&apos;t)
            </p>
            <ul className="space-y-1">
              <li className="flex items-start gap-2">
                <span className="mt-[3px] h-1 w-1 rounded-full bg-emerald-300" />
                <span>Standard creator-safety clarifications</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[3px] h-1 w-1 rounded-full bg-emerald-300" />
                <span>Not a legal notice or payment escalation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[3px] h-1 w-1 rounded-full bg-emerald-300" />
                <span>Commonly accepted by brands</span>
              </li>
            </ul>
          </div>
        </div>

        {!isSubmitted ? (
          <div className="space-y-6">
            {/* Deal Snapshot */}
            <BrandSummaryCard
              dealValue={dealInfo?.deal_amount}
              deliverables={dealInfo?.deliverables}
            />

            {/* Requested clarifications */}
            <RequestedUpdatesCard requestedChanges={requestedChanges} />

            {/* Expected outcome */}
            <ExpectedOutcomeCard />

            {/* Optional full summary */}
            <FullContractSummary />

            {/* 3. DECISION SECTION */}
            <div className="space-y-3">
              <h2 className="text-base md:text-lg font-semibold text-slate-50">
                How would you like to proceed?
              </h2>
              <p className="text-xs md:text-sm text-slate-400">
                Choose how you&apos;d like to respond to these suggested
                updates.
              </p>
            </div>

            {/* Accept All Updates (Recommended) */}
            <motion.button
              onClick={() => handleStatusSelect('accepted')}
              className={cn(
                'w-full rounded-2xl p-5 md:p-6 text-left transition-all duration-200',
                'border bg-[#080021]/90',
                selectedStatus === 'accepted'
                  ? 'border-emerald-400/70 shadow-[0_0_0_1px_rgba(16,185,129,0.5)]'
                  : 'border-purple-900/70 hover:border-purple-700'
              )}
              whileHover={selectedStatus !== 'accepted' ? { scale: 1.01 } : {}}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border transition-all duration-200',
                    selectedStatus === 'accepted'
                      ? 'border-emerald-400 bg-emerald-500/10'
                      : 'border-purple-700 bg-[#0b0128]'
                  )}
                >
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-semibold mb-1.5">
                    Accept All Updates (Recommended)
                  </h3>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                    Proceed with all suggested clarifications. Fastest way to
                    finalize this collaboration.
                  </p>
                </div>
              </div>
            </motion.button>

            {/* Want to Negotiate */}
            <motion.button
              onClick={() => handleStatusSelect('negotiating')}
              className={cn(
                'w-full rounded-2xl p-5 md:p-6 text-left transition-all duration-200',
                'border bg-[#080021]/90',
                selectedStatus === 'negotiating'
                  ? 'border-amber-300/70 bg-amber-500/5'
                  : 'border-purple-900/70 hover:border-purple-700'
              )}
              whileHover={
                selectedStatus !== 'negotiating' ? { scale: 1.01 } : {}
              }
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 border transition-all duration-200',
                    selectedStatus === 'negotiating'
                      ? 'border-amber-300 bg-amber-500/10'
                      : 'border-purple-700 bg-[#0b0128]'
                  )}
                >
                  <span className="text-sm font-semibold text-amber-200">
                    …
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-semibold mb-1.5">
                    Want to Negotiate
                  </h3>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                    Discuss specific points before finalizing.
                  </p>
                </div>
              </div>
            </motion.button>

            {/* Reject Updates */}
            <motion.button
              onClick={() => handleStatusSelect('rejected')}
              className={cn(
                'w-full rounded-2xl p-5 md:p-6 text-left transition-all duration-200',
                'border bg-[#080021]/90',
                selectedStatus === 'rejected'
                  ? 'border-red-300/70 bg-red-500/5'
                  : 'border-purple-900/70 hover:border-purple-700'
              )}
              whileHover={selectedStatus !== 'rejected' ? { scale: 1.01 } : {}}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 border transition-all duration-200',
                    selectedStatus === 'rejected'
                      ? 'border-red-300 bg-red-500/10'
                      : 'border-purple-700 bg-[#0b0128]'
                  )}
                >
                  <XCircle className="w-5 h-5 text-red-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-semibold mb-1.5">
                    Reject Updates
                  </h3>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                    Proceed without these clarifications.
                  </p>
                </div>
              </div>
            </motion.button>

            {/* 4. NAME + COMMENTS SECTION - Show only after decision selected */}
            <AnimatePresence>
              {selectedStatus && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl border border-purple-900/70 bg-[#080021]/90 p-5 md:p-6 space-y-5"
                >
                  <p className="text-xs text-violet-200/80">
                    This response is shared instantly and can be updated later.
                  </p>

                  {/* Email Input - Required for OTP if accepting - Show FIRST when accepting */}
                  {selectedStatus === 'accepted' && (
                    <div className="rounded-xl border border-purple-900/70 bg-[#0b0128]/90 p-4 space-y-2">
                      <label className="block text-sm font-semibold mb-2 text-slate-100">
                        Email Address{' '}
                        <span className="text-red-400">*</span>
                        <span className="text-xs font-normal text-slate-400 ml-2">
                          (Required for OTP verification)
                        </span>
                      </label>
                      <input
                        type="email"
                        value={brandEmailInput}
                        onChange={(e) => {
                          setBrandEmailInput(e.target.value);
                        }}
                        onFocus={(e) => {
                          // Auto-fill if empty and we have brand email
                          if (!e.target.value && brandEmail) {
                            setBrandEmailInput(brandEmail);
                          }
                        }}
                        placeholder="brand@example.com"
                        className="w-full p-3.5 rounded-xl bg-[#090024] border border-purple-800 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-purple-500/70 transition-all duration-200 text-sm md:text-base"
                        autoFocus
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        We&apos;ll send a 6-digit OTP to this email address to
                        verify your acceptance.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-100">
                      Your Name / Team (Optional)
                    </label>
                    <input
                      type="text"
                      value={brandTeamName}
                      onChange={(e) => setBrandTeamName(e.target.value)}
                      placeholder="Aditi – Brand Partnerships"
                      className="w-full p-3.5 rounded-xl bg-[#090024] border border-purple-800 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-purple-500/70 transition-all duration-200 text-sm md:text-base"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-100">
                      Additional Comments (Optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Optional notes for the creator…"
                      className="w-full p-3.5 rounded-xl bg-[#090024] border border-purple-800 text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/70 focus:border-purple-500/70 resize-none min-h-[120px] transition-all duration-200 text-sm md:text-base"
                      maxLength={1000}
                      style={{
                        minHeight: '120px',
                        height: message
                          ? `${Math.max(
                              120,
                              message.split('\n').length * 24 + 32
                            )}px`
                          : '120px',
                      }}
                    />
                    <div className="text-xs text-slate-500 mt-2 text-right">
                      {message.length}/1000
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 5. TRUST REASSURANCE SECTION */}
            <div className="rounded-2xl border border-purple-900/70 bg-[#080021]/90 p-4 md:p-5">
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-start gap-2">
                  <span className="mt-[2px] text-emerald-400">✓</span>
                  <p>Your response is shared with the creator instantly</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-[2px] text-emerald-400">✓</span>
                  <p>You can revise your response later</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-[2px] text-emerald-400">✓</span>
                  <p>This does not legally bind you</p>
                </div>
              </div>
            </div>

            {/* 6. FINAL CTA */}
            <div className="space-y-2">
              <motion.button
                onClick={handleSubmit}
                disabled={!selectedStatus || isSubmitting}
                whileHover={
                  selectedStatus && !isSubmitting ? { scale: 1.01 } : {}
                }
                whileTap={
                  selectedStatus && !isSubmitting ? { scale: 0.99 } : {}
                }
                transition={{ duration: 0.15 }}
                className={cn(
                  'w-full py-3.5 rounded-xl font-semibold transition-all duration-200',
                  'flex items-center justify-center min-h-[52px]',
                  selectedStatus && !isSubmitting
                    ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white shadow-md hover:brightness-110'
                    : 'bg-[#12052f] text-slate-400 cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="ml-2">Submitting...</span>
                  </>
                ) : (
                  'Confirm & Send Response'
                )}
              </motion.button>
              <p className="text-xs text-slate-500 text-center">
                This does not legally bind you.
              </p>
            </div>
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
                className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full z-50 bg-white/8 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 shadow-lg"
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
                  className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium transition-all duration-200 text-white"
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
                className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full z-50 bg-white/8 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/30 shadow-lg"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold mb-2">Verify your acceptance</h3>
                  <p className="text-white/70 text-sm">
                    Enter the 6-digit OTP sent to <span className="font-medium text-white">{getMaskedEmail()}</span>
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
                      "flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white"
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
