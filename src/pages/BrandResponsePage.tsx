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
  Download,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/utils/api';

interface RequestedChange {
  title: string;
  severity: 'high' | 'medium' | 'warning';
  category: string;
  description: string;
}

const BrandResponsePage = () => {
  const { token } = useParams<{ token: string }>();
  const [selectedStatus, setSelectedStatus] = useState<'accepted' | 'negotiating' | 'rejected' | null>(null);
  const [message, setMessage] = useState('');
  const [brandTeamName, setBrandTeamName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dealInfo, setDealInfo] = useState<{
    brand_name: string;
    response_status: string;
    deal_amount?: number;
    deliverables?: string | string[];
    signed_contract_url?: string | null;
    deal_execution_status?: string | null;
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
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [requestChangesText, setRequestChangesText] = useState('');
  const [requiresConfirmation, setRequiresConfirmation] = useState<boolean | null>(null);
  const [isPreparingContract, setIsPreparingContract] = useState(false);
  const [acceptedJourneyPhase, setAcceptedJourneyPhase] = useState(0);

  // Check if clarifications are required (fallback logic if API doesn't provide flag)
  const requiresClarifications = () => {
    // Check if there are requested changes
    if (requestedChanges && requestedChanges.length > 0) {
      return true;
    }

    // Check if there are safeguards/clarifications in analysis data
    if (analysisData) {
      const keyTerms = analysisData.keyTerms || {};
      const issues = Array.isArray(analysisData.issues) ? analysisData.issues : [];

      // Check for missing critical terms that would require clarification
      const hasMissingTerms =
        (!keyTerms?.usageRights || keyTerms.usageRights === 'Not specified') ||
        (!keyTerms?.exclusivity || keyTerms.exclusivity === 'Not specified') ||
        (!keyTerms?.paymentSchedule || keyTerms.paymentSchedule === 'Not specified') ||
        (!keyTerms?.termination || keyTerms.termination === 'Not specified');

      // Check if there are high/medium severity issues
      const hasImportantIssues = issues.some((issue: any) =>
        issue.severity === 'high' || issue.severity === 'medium'
      );

      return hasMissingTerms || hasImportantIssues;
    }

    return false;
  };

  // Use API flag as primary source, fallback to local logic
  const hasClarifications = requiresConfirmation !== null
    ? requiresConfirmation
    : requiresClarifications();

  const isAcceptedResponse = Boolean(
    dealInfo && (dealInfo.response_status === 'accepted_verified' || dealInfo.response_status === 'accepted')
  );

  useEffect(() => {
    if (!isSubmitted || !isAcceptedResponse) {
      setAcceptedJourneyPhase(0);
      return;
    }

    setAcceptedJourneyPhase(0);
    const timers = [
      window.setTimeout(() => setAcceptedJourneyPhase(1), 240),
      window.setTimeout(() => setAcceptedJourneyPhase(2), 680),
      window.setTimeout(() => setAcceptedJourneyPhase(3), 1220),
      window.setTimeout(() => setAcceptedJourneyPhase(4), 1780),
    ];

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [isSubmitted, isAcceptedResponse]);

  // Brand Confirmation Page Component (when no clarifications needed)
  const BrandConfirmationPage = () => {
    // Parse deliverables
    let deliverablesList: string[] = [];
    if (dealInfo?.deliverables) {
      if (typeof dealInfo.deliverables === 'string') {
        try {
          const parsed = JSON.parse(dealInfo.deliverables);
          deliverablesList = Array.isArray(parsed) ? parsed : [dealInfo.deliverables];
        } catch {
          deliverablesList = [dealInfo.deliverables];
        }
      } else if (Array.isArray(dealInfo.deliverables)) {
        deliverablesList = dealInfo.deliverables;
      }
    }

    // Extract contract details from analysis data if available
    const keyTerms = analysisData?.keyTerms || {};
    const extractedTerms = analysisData?.extractedTerms || {};
    const dealValue = dealInfo?.deal_amount || keyTerms.dealValue || extractedTerms.paymentTerms || null;
    const timeline = keyTerms.duration || extractedTerms.timeline || 'Not specified';
    const paymentTerms = extractedTerms.paymentTerms || keyTerms.paymentSchedule || 'Not specified';
    const usageRights = extractedTerms.usageRights || keyTerms.usageRights || 'Not specified';
    const exclusivity = extractedTerms.exclusivity || keyTerms.exclusivity || 'Not specified';
    const brandName = dealInfo?.brand_name || 'Brand';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Review & Confirm Collaboration
          </h2>
          <p className="text-white/80 text-base mb-2">
            This helps ensure both parties are aligned before we finalize your agreement.
          </p>
          <p className="text-white/60 text-sm">
            This does not legally bind you yet.
          </p>
        </div>

        {/* Deal Summary Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg space-y-4"
        >
          <h3 className="text-lg font-semibold mb-4">Deal Summary</h3>

          {/* Deal Value */}
          {dealValue && (
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/70 text-sm">Deal Value</span>
              <span className="font-medium text-green-400/80 text-sm">
                ₹{Number(dealValue).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {/* Deliverables */}
          {deliverablesList.length > 0 && (
            <div className="py-2 border-b border-white/10">
              <span className="text-white/70 text-sm block mb-2">Deliverables</span>
              <ul className="space-y-1.5 list-none">
                {deliverablesList.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#d8caff] mt-1">▪</span>
                    <span className="text-white/90 text-sm">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timeline */}
          {timeline !== 'Not specified' && (
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/70 text-sm">Timeline / Posting Deadline</span>
              <span className="text-white/90 text-sm">{timeline}</span>
            </div>
          )}

          {/* Payment Terms */}
          {paymentTerms !== 'Not specified' && (
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/70 text-sm">Payment Terms</span>
              <span className="text-white/90 text-sm">{paymentTerms}</span>
            </div>
          )}

          {/* Usage Rights */}
          {usageRights !== 'Not specified' && (
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/70 text-sm">Usage Rights</span>
              <span className="text-white/90 text-sm">{usageRights}</span>
            </div>
          )}

          {/* Exclusivity */}
          {exclusivity !== 'Not specified' && (
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/70 text-sm">Exclusivity</span>
              <span className="text-white/90 text-sm">{exclusivity}</span>
            </div>
          )}

          {/* Brand Details */}
          <div className="flex justify-between items-center py-2">
            <span className="text-white/70 text-sm">Brand Details</span>
            <span className="text-white/90 text-sm">{brandName}</span>
          </div>

          {/* Reassurance line */}
          <p className="text-xs text-white/60 mt-4 pt-4 border-t border-white/10">
            If anything looks unclear, you can request an update.
          </p>
        </motion.div>

        {/* Decision Options */}
        <div className="space-y-4">
          {/* Option 1: Confirm & Continue */}
          <motion.button
            onClick={() => handleStatusSelect('accepted')}
            className={cn(
              "w-full rounded-xl p-5 md:p-6 text-left transition-all duration-200 relative",
              "border-2 backdrop-blur-xl",
              selectedStatus === 'accepted'
                ? "bg-white/10 border-green-400/70 shadow-[0_0_0_1px_rgba(34,197,94,0.35)]"
                : "bg-white/5 border-white/20 hover:border-white/40 hover:bg-white/10",
              selectedStatus && selectedStatus !== 'accepted' && "opacity-60"
            )}
            whileHover={selectedStatus !== 'accepted' ? { scale: 1.02 } : {}}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-200",
                selectedStatus === 'accepted'
                  ? "bg-green-500/20 border-green-400"
                  : "bg-white/10 border-white/30"
              )}>
                {selectedStatus === 'accepted' ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-white/40" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg md:text-xl font-semibold mb-1.5">
                    Confirm & Continue
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/25 text-[10px] font-medium text-green-200">
                    <CheckCircle className="w-3 h-3" />
                    Recommended
                  </span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Everything looks correct. Proceed with this agreement.
                </p>
              </div>
            </div>
          </motion.button>

          {/* Option 2: Request Changes */}
          <motion.button
            onClick={() => setShowRequestChangesModal(true)}
            className={cn(
              "w-full rounded-xl p-5 md:p-6 text-left transition-all duration-200",
              "border-2 backdrop-blur-xl",
              selectedStatus === 'negotiating'
                ? "bg-white/10 border-blue-400/60 shadow-sm"
                : "bg-white/4 border-white/15 hover:border-white/30 hover:bg-white/8"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-200",
                selectedStatus === 'negotiating'
                  ? "bg-blue-500/20 border-blue-400"
                  : "bg-white/10 border-white/30"
              )}>
                {selectedStatus === 'negotiating' ? (
                  <CheckCircle className="w-6 h-6 text-blue-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-white/40" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-semibold mb-1.5">
                  Request Changes
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  We need to adjust details before finalizing.
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Friendly Reassurance Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/3 backdrop-blur-xl rounded-xl p-4 md:p-5 border border-white/10"
        >
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400/70 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-white/50">Your response will be shared with the creator</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400/70 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-white/50">You can update your response later</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400/70 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-white/50">This step does not legally bind you</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Brand Summary Card Component
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

    // Derive a concise checklist of suggested updates for the brand
    const getClarificationChecklist = (): string[] => {
      const checklist: string[] = [];

      // 1) Prefer backend-requested changes (titles are already creator-facing)
      if (requestedChanges && requestedChanges.length > 0) {
        requestedChanges.forEach((change) => {
          if (!change?.title) return;
          checklist.push(change.title.trim());
        });
        // Keep it light: show at most 4 items
        return checklist.slice(0, 4);
      }

      // 2) Fallback: derive from analysis data key terms (missing clarifications)
      const keyTerms = analysisData?.keyTerms || {};
      const issues = Array.isArray(analysisData?.issues) ? analysisData.issues : [];

      const usageMissing =
        !keyTerms?.usageRights || keyTerms.usageRights === 'Not specified';
      const exclusivityMissing =
        !keyTerms?.exclusivity || keyTerms.exclusivity === 'Not specified';
      const paymentMissing =
        !keyTerms?.paymentSchedule || keyTerms.paymentSchedule === 'Not specified';
      const terminationMissing =
        !keyTerms?.termination || keyTerms.termination === 'Not specified';

      if (usageMissing) {
        checklist.push('Clarify usage rights to specific platforms');
      }
      if (exclusivityMissing) {
        checklist.push('Limit exclusivity to a reasonable duration');
      }
      if (paymentMissing) {
        checklist.push('Confirm payment timeline and method');
      }
      if (terminationMissing) {
        checklist.push('Add notice period for termination');
      }

      if (checklist.length > 0) {
        return checklist.slice(0, 4);
      }

      // 3) Final fallback: top issues from analysis, sorted by severity
      if (issues && issues.length > 0) {
        const severityOrder: Record<string, number> = {
          high: 3,
          medium: 2,
          warning: 1,
          low: 0,
        };

        issues
          .slice()
          .sort(
            (a: any, b: any) =>
              (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
          )
          .slice(0, 4)
          .forEach((issue: any) => {
            if (issue?.title) {
              checklist.push(String(issue.title).trim());
            }
          });
      }

      return checklist.slice(0, 4);
    };

    const transformClarificationTitle = (title: string): string => {
      const lower = title.toLowerCase();

      if (lower.includes('usage rights') || lower.includes('unlimited usage')) {
        return 'Confirm content usage duration and platforms';
      }

      if (
        lower.includes('payment') &&
        (lower.includes('not specified') || lower.includes('missing') || lower.includes('unclear'))
      ) {
        return 'Clarify payment amount and payment timeline';
      }

      if (lower.includes('exclusivity')) {
        return 'Clarify exclusivity duration and competitors covered';
      }

      if (lower.includes('termination')) {
        return 'Align termination notice period for both parties';
      }

      if (lower.includes('revision') || lower.includes('edit')) {
        return 'Confirm number of revision rounds for approval';
      }

      return title;
    };

    const clarificationItems = getClarificationChecklist();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto mt-6 mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg text-white space-y-4"
      >
        {/* Title Row */}
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>📄</span> Creator Suggested an Adjustment
        </h2>

        {/* Deal Value Row */}
        {dealValue && (
          <div className="flex justify-between items-center py-2">
            <span className="text-white/70 text-sm">Deal Value</span>
            <span className="font-medium text-green-400/80 text-sm">
              ₹{Number(dealValue).toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Deliverables Section */}
        {deliverablesList.length > 0 ? (
          <div className="text-sm space-y-2">
            <span className="font-medium text-white/80 block">Deliverables:</span>
            <ul className="space-y-1.5 list-none">
              {deliverablesList.map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#d8caff] mt-1">▪</span>
                  <span className="text-white/90">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-sm">
            <span className="font-medium text-white/80">Deliverables:</span>
            <span className="text-white/60 ml-2">To be mutually confirmed</span>
          </div>
        )}

        {/* Clarifications Checklist (one-line items) */}
        {clarificationItems.length > 0 && (
          <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-white">
                Creator Suggested an Adjustment
              </p>
              <p className="text-xs text-white/60">
                These are common clarifications creators request to avoid confusion later. They
                do not change the commercial intent of the deal.
              </p>
            </div>
            <ul className="mt-1.5 space-y-1.5 text-xs md:text-sm">
              {clarificationItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✔</span>
                  <span className="text-white/80">
                    {transformClarificationTitle(item)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Expected Outcome Card */}
        <div className="mt-3 p-3 bg-green-500/10 border border-green-400/20 rounded-xl text-sm">
          <div className="flex items-start gap-2 mb-1">
            <span className="text-green-400">✓</span>
            <span className="font-medium text-white">Expected Outcome</span>
          </div>
          <p className="text-white/80 text-xs mt-1">
            Most brands approve these standard updates and proceed smoothly without delaying the
            campaign.
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
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-medium text-white active:scale-[0.98]"
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
        const apiBaseUrl = getApiBaseUrl();

        const response = await fetch(`${apiBaseUrl}/api/brand-response/${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          // Handle token validation errors - show error message to user
          const errorMessage = data.error || 'Failed to load deal information';
          console.error('[BrandResponsePage] API error:', errorMessage, 'Status:', response.status);

          // Set error state
          setDealInfo(null);
          setRequestedChanges([]);
          setAnalysisData(null);
          setIsSubmitted(false);
          setLoadError(errorMessage);
          return;
        }

        // Validate that we have deal data
        if (!data.deal) {
          console.error('[BrandResponsePage] No deal data in response');
          setDealInfo(null);
          setRequestedChanges([]);
          setAnalysisData(null);
          setIsSubmitted(false);
          setLoadError('Failed to load deal information');
          return;
        }

        // Clear any previous errors
        setLoadError(null);

        // Check if deal is already accepted/accepted_verified BEFORE setting state
        const responseStatus = data.deal?.response_status || data.deal?.brand_response_status || 'pending';
        console.log('[BrandResponsePage] Response status:', responseStatus, 'Full deal data:', data.deal);

        // Set deal info first
        setDealInfo(data.deal);
        if (data.requested_changes && Array.isArray(data.requested_changes)) {
          setRequestedChanges(data.requested_changes);
        }
        if (data.analysis_data) {
          setAnalysisData(data.analysis_data);
        }

        // Set requires_confirmation flag from API (primary source of truth)
        if (typeof data.requires_confirmation === 'boolean') {
          setRequiresConfirmation(data.requires_confirmation);
        }

        // Check status and set submitted state
        if (responseStatus && responseStatus !== 'pending') {
          console.log('[BrandResponsePage] Deal already has response status:', responseStatus, '- showing success page');
          setIsSubmitted(true);
          // Store the response status for display
          if (responseStatus === 'accepted_verified' || responseStatus === 'accepted') {
            setSelectedStatus('accepted');
          } else if (responseStatus === 'negotiating') {
            setSelectedStatus('negotiating');
          } else if (responseStatus === 'rejected') {
            setSelectedStatus('rejected');
          }
        } else {
          console.log('[BrandResponsePage] Deal is pending - showing form');
          setIsSubmitted(false);
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
      const apiBaseUrl = getApiBaseUrl();

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
        // Check if error is about API key configuration (server-side issue)
        const errorMessage = data.error || 'Failed to send OTP';
        if (errorMessage.includes('Resend API key') || errorMessage.includes('RESEND_API_KEY')) {
          // This is a server configuration issue - show user-friendly message
          throw new Error('Email service is temporarily unavailable. Please contact the creator or try again later.');
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('[BrandResponsePage] OTP send error:', error);

      // Provide user-friendly error messages
      let userMessage = error.message || 'Failed to send OTP. Please try again.';

      // Hide technical server configuration errors from users
      if (error.message && (
        error.message.includes('Resend API key') ||
        error.message.includes('RESEND_API_KEY') ||
        error.message.includes('server/.env')
      )) {
        userMessage = 'Email service is temporarily unavailable. Please contact the creator or try again later.';
      }

      toast.error(userMessage, {
        duration: 5000,
      });
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
      const apiBaseUrl = getApiBaseUrl();

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
        // Close OTP modal
        setShowOTPModal(false);

        // After OTP verification, the deal status is already set to 'accepted_verified'
        // So we should refresh the deal info instead of trying to submit again
        // Only submit if user has selected a status and it's different from accepted_verified
        if (selectedStatus && selectedStatus !== 'accepted') {
          // User selected a different status, submit it
          await submitBrandResponse();
        } else {
          // OTP verification already set status to accepted_verified
          // Refresh deal info to show success state
          setIsSubmitted(true);
          setSelectedStatus('accepted');

          // Refresh deal info from server
          try {
            const apiBaseUrl = getApiBaseUrl();

            const refreshResponse = await fetch(`${apiBaseUrl}/api/brand-response/${token}`);
            const refreshData = await refreshResponse.json();

            if (refreshResponse.ok && refreshData.success && refreshData.deal) {
              setDealInfo(refreshData.deal);
              if (refreshData.requested_changes && Array.isArray(refreshData.requested_changes)) {
                setRequestedChanges(refreshData.requested_changes);
              }
              if (refreshData.analysis_data) {
                setAnalysisData(refreshData.analysis_data);
              }
            }
          } catch (refreshError) {
            console.error('[BrandResponsePage] Error refreshing deal info:', refreshError);
            // Non-fatal - we already set the success state
          }
        }
      } else {
        // Check if OTP is already verified - if so, refresh deal info
        if (data.error && data.error.includes('already been verified')) {
          toast.success('OTP was already verified.');
          triggerHaptic(HapticPatterns.success);
          setShowOTPModal(false);

          // Refresh deal info to show current state
          setIsSubmitted(true);
          setSelectedStatus('accepted');

          try {
            const apiBaseUrl = getApiBaseUrl();

            const refreshResponse = await fetch(`${apiBaseUrl}/api/brand-response/${token}`);
            const refreshData = await refreshResponse.json();

            if (refreshResponse.ok && refreshData.success && refreshData.deal) {
              setDealInfo(refreshData.deal);
              if (refreshData.requested_changes && Array.isArray(refreshData.requested_changes)) {
                setRequestedChanges(refreshData.requested_changes);
              }
              if (refreshData.analysis_data) {
                setAnalysisData(refreshData.analysis_data);
              }
            }
          } catch (refreshError) {
            console.error('[BrandResponsePage] Error refreshing deal info:', refreshError);
          }
          return;
        }
        const errorMessage = data.error || 'Invalid OTP';

        // If OTP not found or expired, automatically request a new one
        if (errorMessage.includes('No OTP found') || errorMessage.includes('OTP has expired')) {
          toast.error('OTP not found or expired. Requesting a new OTP...', {
            duration: 3000,
          });

          // Auto-request new OTP if email is available
          if (brandEmail || brandEmailInput) {
            await sendOTP();
          } else {
            toast.error('Please enter your email address first');
            setShowOTPModal(false);
          }
          return;
        }

        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('[BrandResponsePage] OTP verify error:', error);

      // Check if error is about OTP not found or expired
      if (error.message && (error.message.includes('No OTP found') || error.message.includes('OTP has expired'))) {
        toast.error('OTP not found or expired. Requesting a new OTP...', {
          duration: 3000,
        });

        // Auto-request new OTP if email is available
        if (brandEmail || brandEmailInput) {
          await sendOTP();
        } else {
          toast.error('Please enter your email address first');
          setShowOTPModal(false);
        }
        return;
      }

      // Check if error is about OTP already being verified
      if (error.message && error.message.includes('already been verified')) {
        toast.success('OTP was already verified.');
        triggerHaptic(HapticPatterns.success);
        setShowOTPModal(false);

        // Refresh deal info instead of submitting
        setIsSubmitted(true);
        setSelectedStatus('accepted');

        try {
          const apiBaseUrl = getApiBaseUrl();

          const refreshResponse = await fetch(`${apiBaseUrl}/api/brand-response/${token}`);
          const refreshData = await refreshResponse.json();

          if (refreshResponse.ok && refreshData.success && refreshData.deal) {
            setDealInfo(refreshData.deal);
            if (refreshData.requested_changes && Array.isArray(refreshData.requested_changes)) {
              setRequestedChanges(refreshData.requested_changes);
            }
            if (refreshData.analysis_data) {
              setAnalysisData(refreshData.analysis_data);
            }
          }
        } catch (refreshError) {
          console.error('[BrandResponsePage] Error refreshing deal info:', refreshError);
        }
        return;
      }
      toast.error(error.message || 'Invalid OTP. Please try again.');
      triggerHaptic(HapticPatterns.error);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const submitBrandResponse = async () => {
    // If deal is already accepted_verified (from OTP), don't submit again
    if (dealInfo?.response_status === 'accepted_verified') {
      console.log('[BrandResponsePage] Deal already accepted_verified, skipping submission');
      setIsSubmitted(true);
      setSelectedStatus('accepted');
      return;
    }

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
      const apiBaseUrl = getApiBaseUrl();

      // Build message with negotiation points if negotiating
      let finalMessage = message.trim();
      if (selectedStatus === 'negotiating' && (negotiationPoints.length > 0 || otherNegotiationText.trim())) {
        const pointsList = negotiationPoints.map(point => `• ${point}`).join('\n');
        const otherText = otherNegotiationText.trim() ? `\n• Other: ${otherNegotiationText.trim()}` : '';
        if (pointsList || otherText) {
          finalMessage = `Points to negotiate:\n${pointsList}${otherText}${finalMessage ? '\n\nAdditional comments:\n' + finalMessage : ''}`;
        }
      }

      // For confirmation page (no clarifications), use brand_confirmed status
      // For clarification page, use the existing status flow
      const statusToSubmit = hasClarifications
        ? (selectedStatus === 'accepted' ? 'accepted_verified' : selectedStatus)
        : (selectedStatus === 'accepted' ? 'brand_confirmed' : 'brand_requested_changes');

      // If requesting changes from confirmation page, include the request text
      if (!hasClarifications && selectedStatus === 'negotiating' && requestChangesText.trim()) {
        finalMessage = `Requested Changes:\n${requestChangesText.trim()}${finalMessage ? '\n\nAdditional comments:\n' + finalMessage : ''}`;
      }

      const response = await fetch(`${apiBaseUrl}/api/brand-response/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: statusToSubmit,
          message: finalMessage || undefined,
          brand_team_name: brandTeamName.trim() || undefined,
          brand_feedback: (!hasClarifications && selectedStatus === 'negotiating' && requestChangesText.trim()) ? requestChangesText.trim() : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Handle token validation errors
        const errorMessage = data.error || 'Failed to submit response';
        console.error('[BrandResponsePage] Submit error:', errorMessage);

        // If token is invalid/expired, show error and reset state
        if (response.status === 404 || response.status === 403 || errorMessage.includes('no longer valid')) {
          setLoadError(errorMessage);
          setIsSubmitted(false);
          setDealInfo(null);
          toast.error(errorMessage);
          return;
        }

        toast.error(errorMessage);
        return;
      }

      if (!response.ok || !data.success) {
        // Handle token validation errors
        const errorMessage = data.error || 'Failed to submit response';
        console.error('[BrandResponsePage] Submit error:', errorMessage, 'Status:', response.status);

        // If token is invalid/expired, show error and reset state
        if (response.status === 404 || response.status === 403 || errorMessage.includes('no longer valid') || errorMessage.includes('expired')) {
          setLoadError(errorMessage);
          setIsSubmitted(false);
          setDealInfo(null);
          setSelectedStatus(null);
          toast.error(errorMessage);
          triggerHaptic(HapticPatterns.error);
          return;
        }

        toast.error(errorMessage);
        triggerHaptic(HapticPatterns.error);
        return;
      }

      if (data.success) {
        setIsSubmitted(true);

        // If contract was auto-generated, show special message
        if (data.contract_generated) {
          setIsPreparingContract(true);
          toast.success('Contract is being prepared!', {
            description: 'We\'ve generated a protected contract based on your submitted details. Redirecting...',
            duration: 5000
          });
          triggerHaptic(HapticPatterns.success);

          // Redirect brand to success page (they can't access creator dashboard)
          setTimeout(() => {
            // Show success message that contract was generated
            // Brand will receive email with link
          }, 2000);
        } else {
          toast.success('Response submitted successfully!');
          triggerHaptic(HapticPatterns.success);
        }
      }
    } catch (error: any) {
      console.error('[BrandResponsePage] Submit error:', error);
      const errorMessage = error.message || 'Failed to submit response. Please try again.';

      // Check if it's a token-related error
      if (errorMessage.includes('no longer valid') || errorMessage.includes('expired') || errorMessage.includes('404')) {
        setLoadError('This link is no longer valid. Please contact the creator.');
        setIsSubmitted(false);
        setDealInfo(null);
        setSelectedStatus(null);
      }

      toast.error(errorMessage);
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

    if (!token) {
      toast.error('Invalid token');
      triggerHaptic(HapticPatterns.error);
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
      // If OTP sending failed, keep modal open but user can try resending
      return;
    }

    // For negotiate/reject, submit directly
    await submitBrandResponse();
  };

  const handleStatusSelect = (status: 'accepted' | 'negotiating' | 'rejected') => {
    setSelectedStatus(status);
    triggerHaptic(HapticPatterns.light);

    if (status === 'negotiating') {
      if (hasClarifications) {
        // Show negotiation modal for clarification page
        setShowNegotiateModal(true);
      } else {
        // Show request changes modal for confirmation page
        setShowRequestChangesModal(true);
      }
    } else {
      setShowNegotiateModal(false);
      setShowRequestChangesModal(false);
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

  if (isLoading || isPreparingContract) {
    return (
      <div className="nb-screen-height bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/70">
            {isPreparingContract ? 'Preparing your agreement...' : 'Loading...'}
          </p>
          {isPreparingContract && (
            <p className="text-white/50 text-sm mt-2">
              We're generating a protected contract based on your submitted details
            </p>
          )}
        </div>
      </div>
    );
  }

  if (loadError || !dealInfo) {
    return (
      <div className="nb-screen-height bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Link No Longer Valid</h1>
          <p className="text-white/70 mb-6">
            {loadError || 'This link is no longer valid. Please contact the creator.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="nb-screen-height bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white pb-8 md:pb-12 flex flex-col">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6 flex-1 w-full">
        {/* 1. TOP HEADER SECTION */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            Creator Armour
          </h1>
          <div className="h-0.5 w-32 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 mx-auto rounded-full mb-3" />
          <h2 className="text-xl md:text-2xl font-semibold mb-1">
            {dealInfo.brand_name} Collaboration
          </h2>
          {hasClarifications ? (
            <p className="text-white/60 text-xs md:text-sm">
              Review and confirm the collaboration details
            </p>
          ) : (
            <p className="text-white/60 text-xs md:text-sm">
              Review and confirm the collaboration details
            </p>
          )}
        </motion.div>

        {/* Clarification Mode Banner */}
        {!isSubmitted && hasClarifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 rounded-2xl p-4 md:p-6 shadow-lg mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Creator Suggested an Adjustment
                </h3>
                <p className="text-white/80 text-sm mb-2">
                  Everything looks close — align these details to finalize smoothly.
                </p>
                <p className="text-white/60 text-xs">
                  This doesn't legally bind you yet.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {!isSubmitted ? (
          <div className="space-y-5">
            {hasClarifications ? (
              <>
                {/* Brand Summary Card - Only show for clarification page */}
                <BrandSummaryCard
                  dealValue={dealInfo?.deal_amount}
                  deliverables={dealInfo?.deliverables}
                />

                {/* Full Contract Summary */}
                <FullContractSummary />
              </>
            ) : (
              /* Show Brand Confirmation Page when no clarifications needed */
              <BrandConfirmationPage />
            )}

            {hasClarifications && (
              <>
                {/* 2. DECISION CARD COMPONENTS - Radio Style (Only for clarification page) */}
                <p className="text-xs text-white/60 mt-1">
                  Choose the option that best fits your internal approval process.
                </p>
                <p className="text-[11px] text-white/60">
                  These updates do not change pricing or deliverables — they only clarify rights, timelines, and payment protection.
                </p>
              </>
            )}

            {/* Accept All Changes / Confirm & Continue - Show based on page type */}
            {hasClarifications && (
              <>
                {/* Accept All Changes */}
                <motion.button
                  onClick={() => handleStatusSelect('accepted')}
                  className={cn(
                    "w-full rounded-xl p-5 md:p-6 text-left transition-all duration-200 relative",
                    "border-2 backdrop-blur-xl",
                    selectedStatus === 'accepted'
                      ? "bg-white/10 border-green-400/70 shadow-[0_0_0_1px_rgba(34,197,94,0.35)]"
                      : "bg-white/5 border-white/20 hover:border-white/40 hover:bg-white/10",
                    selectedStatus && selectedStatus !== 'accepted' && "opacity-60"
                  )}
                  whileHover={selectedStatus !== 'accepted' ? { scale: 1.02 } : {}}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-200",
                      selectedStatus === 'accepted'
                        ? "bg-green-500/20 border-green-400"
                        : "bg-white/10 border-white/30"
                    )}>
                      {selectedStatus === 'accepted' ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-white/40" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg md:text-xl font-semibold mb-1.5">
                          Accept
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/25 text-[10px] font-medium text-green-200">
                          <CheckCircle className="w-3 h-3" />
                          Recommended
                        </span>
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed">
                        Proceed with all requested clarifications and safety updates.
                      </p>
                    </div>
                  </div>
                </motion.button>

                {/* Want to Negotiate */}
                <motion.button
                  onClick={() => handleStatusSelect('negotiating')}
                  className={cn(
                    "w-full rounded-xl p-5 md:p-6 text-left transition-all duration-200",
                    "border-2 backdrop-blur-xl",
                    selectedStatus === 'negotiating'
                      ? "bg-white/10 border-blue-400/60 shadow-sm"
                      : "bg-white/4 border-white/15 hover:border-white/30 hover:bg-white/8",
                    selectedStatus && selectedStatus !== 'negotiating' && "opacity-60"
                  )}
                  whileHover={selectedStatus !== 'negotiating' ? { scale: 1.02 } : {}}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-200",
                      selectedStatus === 'negotiating'
                        ? "bg-blue-500/20 border-blue-400"
                        : "bg-white/10 border-white/30"
                    )}>
                      {selectedStatus === 'negotiating' ? (
                        <CheckCircle className="w-6 h-6 text-blue-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-white/40" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-semibold mb-1.5">Adjust Again</h3>
                      <p className="text-white/70 text-sm leading-relaxed">
                        Discuss specific points before finalizing.
                      </p>
                    </div>
                  </div>
                </motion.button>

                {/* Reject Changes */}
                <motion.button
                  onClick={() => handleStatusSelect('rejected')}
                  className={cn(
                    "w-full rounded-xl p-5 md:p-6 text-left transition-all duration-200",
                    "border-2 backdrop-blur-xl",
                    selectedStatus === 'rejected'
                      ? "bg-red-500/5 border-red-300/60 shadow-sm"
                      : "bg-white/4 border-white/15 hover:border-white/30 hover:bg-white/8",
                    selectedStatus && selectedStatus !== 'rejected' && "opacity-60"
                  )}
                  whileHover={selectedStatus !== 'rejected' ? { scale: 1.02 } : {}}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-200",
                      selectedStatus === 'rejected'
                        ? "bg-red-500/15 border-red-300"
                        : "bg-white/8 border-white/25"
                    )}>
                      {selectedStatus === 'rejected' ? (
                        <CheckCircle className="w-6 h-6 text-red-300" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-white/40" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-semibold mb-1.5">
                        Decline
                      </h3>
                      <p className="text-white/70 text-sm leading-relaxed">
                        Proceed with the original contract terms. Creator may request safeguards later.
                      </p>
                      {selectedStatus === 'rejected' && (
                        <p className="mt-2 text-[11px] text-white/50">
                          The creator can still follow up to confirm protections if needed.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.button>
              </>
            )}

            {/* 3. NAME + COMMENTS SECTION - Show only after decision selected */}
            <AnimatePresence>
              {selectedStatus && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white/5 backdrop-blur-xl rounded-xl p-5 md:p-6 border border-white/20 shadow-lg space-y-5"
                >
                  {/* Email Input - Required for OTP if accepting - Show FIRST when accepting */}
                  {selectedStatus === 'accepted' && (
                    <div className="bg-white/5 border border-white/20 rounded-xl p-4 space-y-2">
                      <label className="block text-sm font-semibold mb-2 text-white">
                        📧 Email Address <span className="text-red-400">*</span>
                        <span className="text-xs font-normal text-white/60 ml-2">(Required for OTP verification)</span>
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
                        className="w-full p-4 rounded-xl bg-white/10 border-2 border-white/30 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-lg font-medium"
                        autoFocus
                      />
                      <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                        <span className="text-yellow-400">⚠️</span>
                        We'll send a 6-digit OTP to this email address to verify your acceptance
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
                      placeholder="Aditi – Brand Partnerships"
                      className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
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
                      placeholder="Optional notes for the creator…"
                      className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none min-h-[120px] transition-all duration-200"
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* 4. TRUST NOTES SECTION - Only show for clarification page */}
            {hasClarifications && (
              <div className="bg-white/3 backdrop-blur-xl rounded-xl p-4 md:p-5 border border-white/10">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400/70 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-white/50">Your reply will be shared with the creator</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400/70 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-white/50">You can update your response later</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400/70 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-white/50">This decision does not legally bind you</p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. BOTTOM CTA BUTTON */}
            <motion.button
              onClick={handleSubmit}
              disabled={!selectedStatus || isSubmitting}
              whileHover={selectedStatus && !isSubmitting ? { scale: 1.01 } : {}}
              whileTap={selectedStatus && !isSubmitting ? { scale: 0.99 } : {}}
              transition={{ duration: 0.15 }}
              className={cn(
                "w-full py-4 rounded-xl font-semibold transition-all duration-200",
                "flex items-center justify-center gap-2 min-h-[56px]",
                selectedStatus === 'accepted' && !isSubmitting
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : selectedStatus === 'negotiating' && !isSubmitting
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : selectedStatus === 'rejected' && !isSubmitting
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
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
                  {hasClarifications ? 'Confirm & Proceed' : 'Confirm & Continue'}
                </>
              ) : selectedStatus === 'negotiating' ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  {hasClarifications ? 'Submit for Discussion' : 'Submit Request'}
                </>
              ) : selectedStatus === 'rejected' ? (
                <>
                  <XCircle className="w-5 h-5" />
                  Send Decision
                </>
              ) : (
                'Confirm Response'
              )}
            </motion.button>
            <p className="mt-2 text-xs text-white/60 text-center">
              You can revise this later.
            </p>
          </div>
        ) : (
          /* POST-SUBMISSION CONFIRMATION / ALREADY ACCEPTED */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 md:p-12 border border-white/20 shadow-xl text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mb-4"
            >
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
            </motion.div>

            {dealInfo && (dealInfo.response_status === 'accepted_verified' || dealInfo.response_status === 'accepted') ? (
              <>
                <div className="relative rounded-2xl border border-white/20 bg-white/[0.04] p-4 md:p-5 overflow-hidden">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: acceptedJourneyPhase >= 2 ? 0.08 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-black pointer-events-none"
                  />
                  <AnimatePresence mode="wait">
                    {acceptedJourneyPhase === 0 ? (
                      <motion.p
                        key="under-review"
                        initial={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22 }}
                        className="text-sm font-medium text-violet-100/90"
                      >
                        Under Review
                      </motion.p>
                    ) : (
                      <motion.p
                        key="accepted"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22 }}
                        className="text-sm font-semibold text-emerald-300"
                      >
                        Accepted
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.div
                    animate={acceptedJourneyPhase >= 1 ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto mt-3 mb-2 h-14 w-14 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white font-semibold"
                  >
                    {(dealInfo.brand_name || 'B').trim().charAt(0).toUpperCase()}
                  </motion.div>

                  <AnimatePresence>
                    {acceptedJourneyPhase >= 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.28 }}
                        className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-4 text-left"
                      >
                        <h4 className="text-base font-semibold text-emerald-200">Creator has accepted your offer</h4>
                        <p className="text-sm text-violet-100/85 mt-1">Preparing secure collaboration setup</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Collaboration Locked
                </h3>
                <p className="text-white/90 text-base max-w-md mx-auto mb-4">
                  Both parties are now aligned. Secure contract setup begins.
                </p>

                <AnimatePresence>
                  {acceptedJourneyPhase >= 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-xl border border-white/15 bg-white/[0.03] p-4 text-left space-y-2"
                    >
                      {[
                        'Terms confirmed',
                        'Contract being generated',
                        'Deal moving to secure stage',
                      ].map((item, idx) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.12, duration: 0.2 }}
                          className="flex items-center gap-2 text-sm text-violet-100/90"
                        >
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span>{item}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {acceptedJourneyPhase >= 4 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="rounded-xl border border-violet-300/20 bg-violet-500/10 p-4 text-left"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white">Payment Setup Initiated</h4>
                        <motion.div
                          initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Lock className="h-4 w-4 text-emerald-300" />
                        </motion.div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-violet-100/80 mb-2">
                        <span>Agreement ✓</span>
                        <span>Contract ✓</span>
                        <span>Payment Setup •</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-white/15 overflow-hidden mb-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                          className="h-full rounded-full bg-emerald-400"
                        />
                      </div>
                      <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="inline-flex items-center gap-2 text-xs text-emerald-200"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Funds will be secured before content delivery.
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                  <p className="text-sm text-green-300 font-medium mb-1">OTP Verified</p>
                  <p className="text-xs text-white/70">
                    Your email verification was successful. The creator has been notified of your acceptance.
                  </p>
                </div>
                <p className="text-white/60 text-sm max-w-md mx-auto">
                  The creator will proceed with finalizing the contract details. You'll be notified of any updates.
                </p>
              </>
            ) : dealInfo && dealInfo.response_status === 'negotiating' ? (
              <>
                <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Negotiation Requested
                </h3>
                <p className="text-white/90 text-base max-w-md mx-auto mb-4">
                  Your negotiation request has been shared with the creator.
                </p>
                <p className="text-white/60 text-sm max-w-md mx-auto">
                  The creator will review your points and get back to you soon.
                </p>
              </>
            ) : dealInfo && dealInfo.response_status === 'rejected' ? (
              <>
                <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  Response Received
                </h3>
                <p className="text-white/90 text-base max-w-md mx-auto mb-4">
                  Your response has been shared with the creator.
                </p>
                <p className="text-white/60 text-sm max-w-md mx-auto">
                  The creator has been notified of your decision.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-2">Response shared with the creator</h3>
                <p className="text-white/80 text-sm max-w-md mx-auto">
                  You can revisit or revise this decision anytime.
                </p>
              </>
            )}
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

        {/* 6.5. REQUEST CHANGES MODAL (for confirmation page) */}
        <AnimatePresence>
          {showRequestChangesModal && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowRequestChangesModal(false);
                  setRequestChangesText('');
                }}
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
                  <h4 className="text-lg font-semibold">Request Changes</h4>
                  <button
                    onClick={() => {
                      setShowRequestChangesModal(false);
                      setRequestChangesText('');
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/90">
                      What changes would you like to request?
                    </label>
                    <textarea
                      value={requestChangesText}
                      onChange={(e) => setRequestChangesText(e.target.value)}
                      placeholder="Please describe the changes you'd like to make..."
                      className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none min-h-[120px] transition-all duration-200"
                      maxLength={1000}
                    />
                    <div className="text-xs text-white/50 mt-2 text-right">
                      {requestChangesText.length}/1000
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowRequestChangesModal(false);
                      setRequestChangesText('');
                    }}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!requestChangesText.trim()) {
                        toast.error('Please describe the changes you\'d like to request');
                        return;
                      }
                      setSelectedStatus('negotiating');
                      setShowRequestChangesModal(false);
                      toast.success('Changes request prepared');
                    }}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium transition-all duration-200 text-white"
                  >
                    Continue
                  </button>
                </div>
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

      {/* Signed Contract Confirmation (read-only for brand) */}
      {dealInfo?.signed_contract_url && (
        <div className="mt-4 px-4">
          <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-xl border border-green-500/25 rounded-2xl p-4 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-white">
                  Final contract signed and stored
                </p>
                <p className="text-xs text-white/70 mt-1">
                  This collaboration is now fully executed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trust Footer */}
      <div className="mt-4 pb-4 px-4 text-center text-[11px] text-white/50 space-y-1">
        <p>Only the creator you’re collaborating with can view this response.</p>
        <p>Prepared by CreatorArmour — used by creators and brands across India</p>
      </div>
    </div>
  );
};

export default BrandResponsePage;
