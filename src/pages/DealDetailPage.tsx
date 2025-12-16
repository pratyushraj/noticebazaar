"use client";

import { useState, useCallback, lazy, Suspense, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Download, Flag, Loader2, Building2, Calendar, FileText, CheckCircle, Clock, Trash2, AlertCircle, XCircle, Bell, Mail, MessageSquare, Phone, Edit, X, Check, Share2, Copy, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDeal, DealProvider } from '@/contexts/DealContext';
import { useIssues } from '@/lib/hooks/useIssues';
import { useDealActionLogs } from '@/lib/hooks/useActionLogs';
import { useCreateIssue, useAddIssueHistory } from '@/lib/hooks/useIssues';
import { useCreateActionLog } from '@/lib/hooks/useActionLogs';
import { useSession } from '@/contexts/SessionContext';
import { downloadFile, getFilenameFromUrl } from '@/lib/utils/fileDownload';
import { trackEvent } from '@/lib/utils/analytics';
import { generateIssueMessage, IssueType } from '@/components/deals/IssueTypeModal';
import { createCalendarEvent, downloadEventAsICal, openEventInGoogleCalendar } from '@/lib/utils/createCalendarEvent';
import { DeliverableAutoInfo } from '@/components/deals/DeliverableAutoInfo';
import { MessageBrandModal } from '@/components/brand-messages/MessageBrandModal';
import ProgressUpdateSheet from '@/components/deals/ProgressUpdateSheet';
import { useUpdateDealProgress, DealStage, STAGE_TO_PROGRESS, useDeleteBrandDeal, useUpdateBrandDeal } from '@/lib/hooks/useBrandDeals';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { animations, iconSizes } from '@/lib/design-system';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { NativeLoadingSheet } from '@/components/mobile/NativeLoadingSheet';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { generateContractSummaryPDF, extractBrandContactInfo, ContractSummaryData } from '@/lib/utils/contractSummaryPDF';

// Lazy load heavy components
const ContractPreviewModal = lazy(() => import('@/components/deals/ContractPreviewModal').then(m => ({ default: m.ContractPreviewModal })));
const IssueTypeModal = lazy(() => import('@/components/deals/IssueTypeModal').then(m => ({ default: m.IssueTypeModal })));
const IssueStatusCard = lazy(() => import('@/components/deals/IssueStatusCard').then(m => ({ default: m.IssueStatusCard })));
const ActionLog = lazy(() => import('@/components/deals/ActionLog').then(m => ({ default: m.ActionLog })));
const OverduePaymentCard = lazy(() => import('@/components/deals/OverduePaymentCard').then(m => ({ default: m.OverduePaymentCard })));

// Main content component
function DealDetailPageContent() {
  const navigate = useNavigate();
  const { dealId } = useParams<{ dealId: string }>();
  const { profile, session } = useSession();
  
  // Hooks
  const { deal, isLoadingDeal, refreshAll } = useDeal();
  const { data: issues } = useIssues(dealId);
  const { data: logs } = useDealActionLogs(dealId);
  const createIssue = useCreateIssue();
  const addIssueHistory = useAddIssueHistory();
  const createActionLog = useCreateActionLog();
  
  // State
  const [showContractPreview, setShowContractPreview] = useState(false);
  const [showIssueTypeModal, setShowIssueTypeModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showProgressSheet, setShowProgressSheet] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportIssueMessage, setReportIssueMessage] = useState('');
  
  // Deal progress update
  const updateDealProgress = useUpdateDealProgress();
  const deleteDeal = useDeleteBrandDeal();
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Remind brand state
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  
  
  // Brand phone edit state
  const [isEditingBrandPhone, setIsEditingBrandPhone] = useState(false);
  const [brandPhoneInput, setBrandPhoneInput] = useState('+91 ');
  const updateBrandDealMutation = useUpdateBrandDeal();
  
  // PDF generation state
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [protectionReport, setProtectionReport] = useState<any>(null);
  const [protectionIssues, setProtectionIssues] = useState<any[]>([]);
  
  
  // Get current stage from deal status - helper function
  const getCurrentStage = (status: string | null | undefined, progressPercentage?: number | null): DealStage | undefined => {
    if (!status && progressPercentage === undefined) return undefined;
    
    const statusLower = status?.toLowerCase() || '';
    
    // Map old statuses to new stages
    if (statusLower.includes('draft')) return 'negotiation';
    if (statusLower.includes('review')) return 'signed';
    if (statusLower.includes('negotiation')) return 'negotiation';
    if (statusLower.includes('signed')) return 'signed';
    if (statusLower.includes('content_making') || statusLower.includes('content making')) return 'content_making';
    if (statusLower.includes('content_delivered') || statusLower.includes('content delivered')) return 'content_delivered';
    if (statusLower.includes('completed')) return 'completed';
    
    // Fallback: use progress_percentage if available
    if (progressPercentage !== null && progressPercentage !== undefined) {
      if (progressPercentage >= 100) return 'completed';
      if (progressPercentage >= 90) return 'content_delivered';
      if (progressPercentage >= 80) return 'content_making';
      if (progressPercentage >= 70) return 'signed';
      return 'negotiation';
    }
    
    return undefined;
  };
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // Parse deliverables - useMemo must be called unconditionally
  const deliverables = useMemo(() => {
    if (!deal?.deliverables) return [];
    
    try {
      let parsed: any;
      
      if (typeof deal.deliverables === 'string') {
        // Try to parse as JSON first
        try {
          parsed = JSON.parse(deal.deliverables);
        } catch {
          // If JSON parsing fails, treat as plain string
          // Split by newlines and filter out empty strings
          const lines = deal.deliverables
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0);
          
          // If we have lines, return as array of strings
          // Otherwise, return as single-item array
          return lines.length > 0 
            ? lines.map((line, idx) => ({ title: line, name: line, index: idx }))
            : [{ title: deal.deliverables, name: deal.deliverables }];
        }
      } else {
        parsed = deal.deliverables;
      }
      
      // If parsed is already an array, return it (with proper structure)
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => {
          // If item is already an object with title/name, return as-is
          if (typeof item === 'object' && item !== null) {
            return item;
          }
          // If item is a string, wrap it in an object
          return { title: String(item), name: String(item), index: idx };
        });
      }
      
      // If parsed is a single value (string/number), wrap it
      return [{ title: String(parsed), name: String(parsed) }];
    } catch (error) {
      console.error('[DealDetailPage] Error parsing deliverables:', error);
      // Fallback: if it's a string, return it as a single deliverable
      if (typeof deal.deliverables === 'string' && deal.deliverables.trim().length > 0) {
        return [{ title: deal.deliverables, name: deal.deliverables }];
      }
      return [];
    }
  }, [deal?.deliverables]);

  // Fetch protection report and issues
  useEffect(() => {
    const fetchProtectionData = async () => {
      if (!deal?.id) return;

      try {
        // Try to get analysis_report_id from deal
        const analysisReportId = (deal as any).analysis_report_id;
        let reportId = analysisReportId;

        if (!reportId) {
          // Try to find report by deal_id
          const { data: reports, error: reportError } = await supabase
            .from('protection_reports')
            .select('*')
            .eq('deal_id', deal.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!reportError && reports && reports.length > 0) {
            setProtectionReport(reports[0]);
            reportId = reports[0].id;
          }
        } else {
          // Fetch by analysis_report_id
          const { data: report, error: reportError } = await supabase
            .from('protection_reports')
            .select('*')
            .eq('id', analysisReportId)
            .single();

          if (!reportError && report) {
            setProtectionReport(report);
          }
        }

        // Fetch protection issues if we have a reportId
        if (reportId) {
          const { data: issuesData, error: issuesError } = await supabase
            .from('protection_issues')
            .select('*')
            .eq('report_id', reportId)
            .order('severity', { ascending: false })
            .order('created_at', { ascending: true });

          if (!issuesError && issuesData) {
            setProtectionIssues(issuesData);
          }
        }
      } catch (error) {
        console.error('[DealDetailPage] Error fetching protection data:', error);
      }
    };

    fetchProtectionData();
  }, [deal?.id, (deal as any)?.analysis_report_id]);


  // Get latest issue - useMemo must be called unconditionally
  const latestIssue = useMemo(() => {
    if (!issues || !Array.isArray(issues) || issues.length === 0) return null;
    return issues[0];
  }, [issues]);

  // Transform action logs - useMemo must be called unconditionally
  const actionLogEntries = useMemo(() => {
    // replaced-by-ultra-polish: replaced any[] with proper ActionLog type
    type ActionLogEntryType = {
      id: string;
      action: string;
      type: 'other' | 'payment' | 'upload' | 'complete' | 'invoice' | 'issue' | 'update';
      timestamp: string;
      user: string;
      metadata?: Record<string, unknown>;
    };
    const entries: ActionLogEntryType[] = [];
    
    if (!deal) return entries;
    
    if (deal.created_at) {
      entries.push({
        id: `action-${deal.id}-created`,
        action: 'Deal created',
        type: 'other',
        timestamp: deal.created_at,
        user: profile?.first_name || 'You',
      });
    }

    if (deal.contract_file_url) {
      entries.push({
        id: `action-${deal.id}-contract`,
        action: 'Contract uploaded',
        type: 'upload',
        timestamp: deal.created_at || new Date().toISOString(),
        user: profile?.first_name || 'You',
      });
    }

    if (logs && Array.isArray(logs)) {
      // replaced-by-ultra-polish: replaced any with proper type
      logs.forEach((log: any) => {
        entries.push({
          id: log.id,
          action: log.event?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Action',
          type: 'other' as const,
          timestamp: log.created_at || new Date().toISOString(),
          user: profile?.first_name || 'You',
          metadata: log.metadata,
        });
      });
    }

    return entries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [deal, logs, profile]);

  // Calculate days overdue - useCallback must be called unconditionally
  const calculateDaysOverdue = useCallback(() => {
    if (!deal?.payment_expected_date) return 0;
    const dueDate = new Date(deal.payment_expected_date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [deal?.payment_expected_date]);

  const daysOverdue = calculateDaysOverdue();
  const isPaymentOverdue = daysOverdue > 0 && deal?.status?.toLowerCase().includes('pending');

  // Get current stage - calculated after all hooks
  const currentStage = getCurrentStage(deal?.status, deal?.progress_percentage);

  // Compute deal data for handlers (safe even if deal is undefined)
  const dealAmount = useMemo(() => Number(deal?.deal_amount || 0), [deal?.deal_amount]);
  const dealTitle = useMemo(() => `${deal?.brand_name || ''} ${deal?.platform || 'Partnership'} Agreement`, [deal?.brand_name, deal?.platform]);
  const contractFileName = useMemo(() => deal?.contract_file_url ? getFilenameFromUrl(deal.contract_file_url) : null, [deal?.contract_file_url]);

  // ALL HANDLERS MUST BE DEFINED BEFORE EARLY RETURNS
  // Handlers (must be useCallback and defined before early returns)
  const handlePreviewContract = useCallback(() => {
    if (!deal?.contract_file_url) {
      toast.error('No contract file available');
      return;
    }
    
    trackEvent('contract_preview_opened', { 
      dealId: deal.id,
      dealTitle: deal.brand_name,
    });
    
    setShowContractPreview(true);
  }, [deal?.id, deal?.contract_file_url, deal?.brand_name]);

  // Generate Contract Summary PDF
  const handleDownloadContractSummary = useCallback(async () => {
    if (!deal) {
      toast.error('Deal information not available');
      return;
    }

    setIsGeneratingPDF(true);
    const progressToast = toast.loading('Generating Contract Summary PDF...');
    triggerHaptic(HapticPatterns.medium);

    try {
      // Extract brand contact info from analysis
      const analysisData = protectionReport?.analysis_json || null;
      const brandContactInfo = extractBrandContactInfo(analysisData);

      // Prepare deliverables
      const deliverablesList = deliverables.map((d: any) => 
        typeof d === 'string' ? d : (d.title || d.name || String(d))
      );

      // Separate risks and missing clauses from protection issues
      const risks = protectionIssues
        .filter(issue => issue.severity !== 'warning' && issue.category !== 'missing_clause')
        .map(issue => ({
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          category: issue.category,
        }));

      const missingClauses = protectionIssues
        .filter(issue => issue.category === 'missing_clause' || issue.severity === 'warning')
        .map(issue => ({
          title: issue.title,
          description: issue.description,
          category: issue.category,
        }));

      // Get AI recommendations from analysis
      const aiRecommendations = analysisData?.recommendations || 
                                analysisData?.negotiationPoints || 
                                [];

      // Get creator's fix requests from issues
      const creatorFixRequests = (issues || []).map((issue: any) => ({
        title: issue.title || issue.issue_type || 'Fix Request',
        description: issue.description || issue.message || '',
        issueType: issue.issue_type || 'other',
      }));

      // Prepare PDF data
      const pdfData: ContractSummaryData = {
        dealValue: deal.deal_amount,
        brandName: deal.brand_name,
        deliverables: deliverablesList,
        brandEmail: deal.brand_email || brandContactInfo.brandEmail,
        brandPhone: deal.brand_phone || null,
        brandLegalContact: brandContactInfo.brandLegalContact,
        brandAddress: brandContactInfo.brandAddress,
        risks,
        missingClauses,
        aiRecommendations,
        creatorFixRequests,
        protectionScore: protectionReport?.protection_score,
        overallRisk: protectionReport?.overall_risk,
        analyzedAt: protectionReport?.analyzed_at,
      };

      // Generate PDF
      await generateContractSummaryPDF(pdfData);

      toast.success('Contract Summary PDF downloaded successfully', { id: progressToast });
      triggerHaptic(HapticPatterns.success);
      trackEvent('contract_summary_pdf_downloaded', { dealId: deal.id });
    } catch (error: any) {
      console.error('[DealDetailPage] PDF generation error:', error);
      toast.error(error.message || 'Failed to generate PDF. Please try again.', { id: progressToast });
      triggerHaptic(HapticPatterns.error);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [deal, deliverables, protectionReport, protectionIssues, issues]);

  const handleDownloadContract = useCallback(async () => {
    if (!deal?.contract_file_url) {
      toast.error('No contract file available');
      return;
    }

    setIsDownloading(true);
    const progressToast = toast.loading('Downloading contract...');

    try {
      const filename = getFilenameFromUrl(deal.contract_file_url);
      await downloadFile(deal.contract_file_url, filename);
      
      toast.dismiss(progressToast);
      toast.success('Contract downloaded!', {
        description: `Downloaded ${filename}`,
      });
      
      // Create action log
      if (profile?.id) {
        await createActionLog.mutateAsync({
          deal_id: deal.id,
          event: 'contract_downloaded',
          metadata: { filename },
        });
      }
      
      trackEvent('zip_bundle_downloaded', { dealId: deal.id });
    } catch (error: any) {
      toast.dismiss(progressToast);
      toast.error('Failed to download contract', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsDownloading(false);
    }
  }, [deal?.id, deal?.contract_file_url, profile?.id, createActionLog]);

  const handleReportIssue = useCallback(() => {
    if (!deal) {
      toast.error('Cannot report issue: Deal data not available');
      return;
    }

    trackEvent('issue_reported', { dealId: deal.id });
    setShowIssueTypeModal(true);
  }, [deal?.id]);

  const handleIssueTypeSelect = useCallback(async (type: IssueType) => {
    if (!deal || !profile?.id) {
      toast.error('Cannot create issue: Missing data');
      return;
    }

    // Generate structured message
    const message = generateIssueMessage(
      type,
      dealTitle,
      dealAmount,
      deal.due_date || undefined
    );

    try {
      // Create issue in backend
      const issue = await createIssue.mutateAsync({
        deal_id: deal.id,
        category: type,
        message,
      });

      // Add initial history entry
      await addIssueHistory.mutateAsync({
        issue_id: issue.id,
        action: 'created',
        message: 'Issue reported',
      });

      // Create action log
      await createActionLog.mutateAsync({
        deal_id: deal.id,
        event: 'issue_reported',
        metadata: { issue_id: issue.id, category: type },
      });

      // Track analytics
      trackEvent('issue_reported', { 
        dealId: deal.id, 
        category: type,
        issueId: issue.id,
      });

      // Set message and open MessageBrandModal
      setReportIssueMessage(message);
      setShowIssueTypeModal(false);
      setShowMessageModal(true);
      
      toast.success('Issue reported successfully!', {
        description: "You can now send a message to the brand.",
      });

      // Refresh data
      refreshAll();
    } catch (error: any) {
      console.error('Error creating issue:', error);
      toast.error('Failed to create issue', {
        description: error.message || 'Please try again.',
      });
    }
  }, [deal, profile?.id, dealTitle, dealAmount, createIssue, addIssueHistory, createActionLog, refreshAll]);

  const handleAddToCalendar = useCallback((type: 'deliverable' | 'payment') => {
    if (!deal) return;

    const date = type === 'deliverable' 
      ? deal.due_date 
      : deal.payment_expected_date || deal.due_date;

    if (!date) {
      toast.error(`No ${type} date available`);
      return;
    }

    const event = createCalendarEvent({
      title: type === 'deliverable' 
        ? `Deliverable Due: ${deal.brand_name}`
        : `Payment Due: ${deal.brand_name}`,
      date: new Date(date),
      description: type === 'deliverable'
        ? `Deliverables due for ${deal.brand_name} deal`
        : `Payment of ₹${dealAmount.toLocaleString('en-IN')} expected`,
    });

    // Track analytics
    trackEvent('calendar_sync_added', { 
      dealId: deal.id,
      type,
    });

    // Show options
    const useGoogle = window.confirm('Add to Google Calendar? (Click Cancel for iCal download)');
    if (useGoogle) {
      openEventInGoogleCalendar(event);
      toast.success('Opening Google Calendar...');
    } else {
      downloadEventAsICal(event);
      toast.success('Calendar event downloaded!');
    }
  }, [deal, dealAmount]);

  const handleSendPaymentReminder = useCallback(() => {
    if (!deal) return;

    const reminderMessage = `Hi ${deal.brand_name} team,

I hope this message finds you well. I wanted to follow up regarding the payment for our recent collaboration.

Deal: ${dealTitle}
Amount: ₹${dealAmount.toLocaleString('en-IN')}
Expected Payment Date: ${deal.payment_expected_date ? new Date(deal.payment_expected_date).toLocaleDateString() : 'N/A'}
Days Overdue: ${daysOverdue}

Could you please provide an update on the payment status? I'd appreciate it if you could confirm when I can expect to receive the payment.

Thank you for your attention to this matter.

Best regards`;

    setReportIssueMessage(reminderMessage);
    setShowMessageModal(true);
    
    trackEvent('overdue_payment_reminder_sent', { 
      dealId: deal.id,
      daysOverdue,
    });
  }, [deal, dealTitle, dealAmount, daysOverdue]);

  const handleProgressStageSelect = useCallback(async (stage: DealStage) => {
    if (!deal || !profile?.id) {
      toast.error('Cannot update progress: Missing data');
      return;
    }

    try {
      await updateDealProgress.mutateAsync({
        dealId: deal.id,
        stage,
        creator_id: profile.id,
      });

      trackEvent('deal_progress_updated', {
        dealId: deal.id,
        stage,
        progress: STAGE_TO_PROGRESS[stage],
      });

      // Close sheet with spring animation
      setTimeout(() => {
        setShowProgressSheet(false);
      }, 200);

      toast.success('Progress updated!', {
        description: `Deal moved to ${stage} stage`,
      });

      // Refresh data
      refreshAll();
    } catch (error: any) {
      console.error('Error updating deal progress:', error);
      toast.error('Failed to update progress', {
        description: error.message || 'Please try again.',
      });
    }
  }, [deal?.id, profile?.id, updateDealProgress, refreshAll]);

  // Note: We trust that if the deal exists in the UI (loaded via useBrandDealById),
  // it's safe to generate and share the brand reply link.
  // The deal verification was causing false negatives due to timing/replication delays.

  // Loading state - EARLY RETURNS AFTER ALL HOOKS
  if (isLoadingDeal) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900" />
        <NativeLoadingSheet isOpen={true} message="Loading deal details..." />
      </>
    );
  }

  // Deal not found
  if (!deal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-white/60" />
          <h2 className="text-2xl font-bold mb-2">Deal not found</h2>
          <p className="text-white/60 mb-4">The deal you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/creator-contracts')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors"
          >
            Back to Deals
          </button>
        </div>
      </div>
    );
  }

  // Deal data already computed above in useMemo hooks

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-purple-900/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate('/creator-contracts')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="text-lg font-semibold">Deal Details</div>
          
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 p-4 md:p-6 pb-24">
        
        {/* Header Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/20">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {deal.brand_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold mb-2 leading-tight">{dealTitle}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {deal.status || 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Deal Value */}
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <div className="text-sm text-white/60 mb-1">Total Deal Value</div>
            <div className="text-3xl font-bold text-green-400">₹{Math.round(dealAmount).toLocaleString('en-IN')}</div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <motion.button
              onClick={() => {
                triggerHaptic(HapticPatterns.light);
                setShowProgressSheet(true);
              }}
              whileTap={animations.microTap}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all active:scale-[0.98]"
            >
              <TrendingUp className={iconSizes.md} />
              <span className="text-xs font-medium">Update Progress</span>
            </motion.button>
            <button
              onClick={handlePreviewContract}
              disabled={!deal.contract_file_url}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-5 h-5" />
              <span className="text-xs font-medium">Preview</span>
            </button>
            <button
              onClick={handleDownloadContract}
              disabled={!deal.contract_file_url || isDownloading}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span className="text-xs font-medium">Download</span>
            </button>
            <motion.button
              onClick={async () => {
                if (!deal || !deal.id) {
                  toast.error('Deal information not available');
                  return;
                }
                
                triggerHaptic(HapticPatterns.light);
                
                // Prepare share content
                const shareText = `${dealTitle}\n\nDeal Value: ₹${Math.round(dealAmount).toLocaleString('en-IN')}\nStatus: ${deal.status || 'Active'}\nBrand: ${deal.brand_name}`;
                const shareUrl = `${window.location.origin}${window.location.pathname}`;
                
                // Try Web Share API first
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: `${dealTitle} - CreatorArmour`,
                      text: shareText,
                      url: shareUrl,
                    });
                    toast.success('Shared successfully');
                    trackEvent('deal_shared', {
                      dealId: deal.id,
                      method: 'native',
                    });
                  } catch (error: any) {
                    // User cancelled or share failed, fallback to copy
                    if (error.name !== 'AbortError') {
                      // Only show error if not user cancellation
                      const fullText = `${shareText}\n\nView deal: ${shareUrl}`;
                      await navigator.clipboard.writeText(fullText);
                      toast.success('Deal details copied to clipboard');
                      trackEvent('deal_shared', {
                        dealId: deal.id,
                        method: 'copy',
                      });
                    }
                  }
                } else {
                  // Fallback: Copy to clipboard
                  const fullText = `${shareText}\n\nView deal: ${shareUrl}`;
                  await navigator.clipboard.writeText(fullText);
                  toast.success('Deal details copied to clipboard');
                  trackEvent('deal_shared', {
                    dealId: deal.id,
                    method: 'copy',
                  });
                }
              }}
              whileTap={animations.microTap}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all active:scale-[0.98]"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-xs font-medium">Share</span>
            </motion.button>
            <button
              onClick={handleReportIssue}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all active:scale-[0.98]"
            >
              <Flag className="w-5 h-5" />
              <span className="text-xs font-medium">Report</span>
            </button>
            <motion.button
              onClick={() => {
                triggerHaptic(HapticPatterns.medium);
                setShowDeleteConfirm(true);
              }}
              whileTap={animations.microTap}
              disabled={deleteDeal.isPending}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteDeal.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin text-red-400" />
              ) : (
                <Trash2 className="w-5 h-5 text-red-400" />
              )}
              <span className="text-xs font-medium text-red-400">Delete</span>
            </motion.button>
          </div>
        </div>

        {/* Brand Response Tracker - Only show if deal exists and has brand_response_status */}
        {deal && deal.id && (deal as any)?.brand_response_status && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/20">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Brand Response
            </h2>
            
            {(() => {
              // Double-check that deal exists and has an ID
              if (!deal || !deal.id) {
                return (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                    <p className="text-red-300 text-sm">Deal information not available. Please refresh the page.</p>
                  </div>
                );
              }
              
              const responseStatus = (deal as any).brand_response_status || 'pending';
              const responseMessage = (deal as any).brand_response_message;
              const responseAt = (deal as any).brand_response_at;
              
              // Handle remind brand with universal system share
              const handleRemindBrand = async () => {
                if (!deal || !deal.id || !profile) {
                  toast.error('Deal information not available');
                  return;
                }
                
                // Verify deal exists in database before sharing
                try {
                  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
                    (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
                      ? 'https://api.creatorarmour.com' 
                      : 'http://localhost:3001');
                  
                  const verifyResponse = await fetch(`${apiBaseUrl}/api/brand-response/${deal.id}`, {
                    method: 'GET',
                  });
                  
                  if (!verifyResponse.ok) {
                    const verifyData = await verifyResponse.json();
                    if (verifyData.error === 'Deal not found') {
                      toast.error('Deal not found. Please save the deal first or check the deal ID.');
                      return;
                    }
                  }
                } catch (verifyError) {
                  console.warn('[DealDetailPage] Could not verify deal existence:', verifyError);
                  // Continue anyway - might be a network issue
                }
                
                // Check 24-hour cooldown
                const lastRemindedAt = (deal as any).last_reminded_at;
                if (lastRemindedAt) {
                  const lastReminded = new Date(lastRemindedAt);
                  const now = new Date();
                  const hoursSinceLastReminder = (now.getTime() - lastReminded.getTime()) / (1000 * 60 * 60);
                  
                  if (hoursSinceLastReminder < 24) {
                    const hoursRemaining = Math.ceil(24 - hoursSinceLastReminder);
                    toast.error(`Reminder sent • Try again in ${hoursRemaining}h`);
                    return;
                  }
                }
                
                setIsSendingReminder(true);
                triggerHaptic(HapticPatterns.medium);
                
                try {
                  // Generate brand reply link
                  const baseUrl = typeof window !== 'undefined' 
                    ? window.location.origin 
                    : 'https://noticebazaar.com';
                  const brandReplyLink = `${baseUrl}/#/brand-reply/${deal.id}`;
                  
                  // Reminder message template
                  const reminderMessage = `Hi, just following up on the contract revisions sent earlier.

Please review and confirm your decision here:

${brandReplyLink}`;
                  
                  // Try native share API first
                  let sharePlatform: string | null = null;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: 'Contract Review Reminder',
                        text: reminderMessage,
                        url: brandReplyLink,
                      });
                      sharePlatform = 'native-share';
                    } catch (shareError: any) {
                      // User cancelled or share failed, fall back to clipboard
                      if (shareError.name !== 'AbortError') {
                        console.warn('[DealDetailPage] Share API failed, falling back to clipboard:', shareError);
                      } else {
                        // User cancelled, don't proceed
                        setIsSendingReminder(false);
                        return;
                      }
                    }
                  }
                  
                  // Fallback to clipboard if share API not available or failed
                  if (!sharePlatform) {
                    try {
                      await navigator.clipboard.writeText(`${reminderMessage}\n\n${brandReplyLink}`);
                      toast.success('Share message copied');
                    } catch (clipboardError) {
                      console.error('[DealDetailPage] Clipboard copy failed:', clipboardError);
                      toast.error('Failed to copy message. Please try again.');
                      setIsSendingReminder(false);
                      return;
                    }
                  }
                  
                  // Log reminder to API
                  try {
                    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
                      (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
                        ? 'https://api.noticebazaar.com' 
                        : 'http://localhost:3001');
                    
                    await fetch(`${apiBaseUrl}/api/deals/log-reminder`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`,
                      },
                      body: JSON.stringify({
                        dealId: deal.id,
                        reminder_type: 'system-share',
                        message: reminderMessage,
                        metadata: {
                          channel: 'system-share',
                          platform: sharePlatform || 'clipboard',
                        },
                      }),
                    });
                  } catch (logError) {
                    console.error('[DealDetailPage] Failed to log reminder:', logError);
                    // Don't fail the whole operation if logging fails
                  }
                  
                  // Refresh deal data
                  await refreshAll();
                  
                  if (sharePlatform) {
                    toast.success('✅ Reminder shared');
                  }
                } catch (error: any) {
                  console.error('[DealDetailPage] Remind brand error:', error);
                  toast.error('Failed to share reminder. Please try again.');
                } finally {
                  setIsSendingReminder(false);
                }
              };
              
              // Handle copy link
              const handleCopyLink = async () => {
                if (!deal || !dealId) {
                  toast.error('Deal information not available');
                  return;
                }
                
                try {
                  const baseUrl = typeof window !== 'undefined' 
                    ? window.location.origin 
                    : 'https://noticebazaar.com';
                  const brandReplyLink = `${baseUrl}/#/brand-reply/${deal.id}`;
                  
                  await navigator.clipboard.writeText(brandReplyLink);
                  triggerHaptic(HapticPatterns.light);
                  toast.success('Link copied to clipboard');
                } catch (error) {
                  console.error('[DealDetailPage] Copy link failed:', error);
                  toast.error('Failed to copy link. Please try again.');
                }
              };
              
              const statusConfig = {
                pending: {
                  icon: Clock,
                  label: '⏳ Waiting for brand response',
                  color: 'text-yellow-400',
                  bgColor: 'bg-yellow-500/20',
                  borderColor: 'border-yellow-500/30',
                },
                accepted: {
                  icon: CheckCircle,
                  label: '✅ Accepted',
                  color: 'text-green-400',
                  bgColor: 'bg-green-500/20',
                  borderColor: 'border-green-500/30',
                },
                negotiating: {
                  icon: AlertCircle,
                  label: '🟡 Negotiation in progress',
                  color: 'text-yellow-400',
                  bgColor: 'bg-yellow-500/20',
                  borderColor: 'border-yellow-500/30',
                },
                rejected: {
                  icon: XCircle,
                  label: '❌ Rejected',
                  color: 'text-red-400',
                  bgColor: 'bg-red-500/20',
                  borderColor: 'border-red-500/30',
                },
              };
              
              const config = statusConfig[responseStatus as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = config.icon;
              
              return (
                <div className="space-y-4">
                  <div className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2",
                    config.bgColor,
                    config.borderColor
                  )}>
                    <StatusIcon className={cn("w-6 h-6 flex-shrink-0", config.color)} />
                    <div className="flex-1">
                      <div className={cn("font-semibold", config.color)}>
                        {config.label}
                      </div>
                      {responseAt && (
                        <div className="text-xs text-white/60 mt-1">
                          Responded on {new Date(responseAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {responseMessage && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                      <div className="text-sm font-medium text-purple-300 mb-2">Brand's Message:</div>
                      <div className="text-white/90 whitespace-pre-wrap">{responseMessage}</div>
                      <p className="text-xs text-white/50 mt-1 italic">
                        This response was submitted via your secure NoticeBazaar link and is saved for records.
                      </p>
                    </div>
                  )}
                  
                  {/* Remind Brand Button - Only show if status is pending */}
                  {responseStatus === 'pending' && deal && deal.id && (() => {
                    const lastRemindedAt = (deal as any).last_reminded_at;
                    let canSendReminder = true;
                    let hoursRemaining = 0;
                    
                    if (lastRemindedAt) {
                      const lastReminded = new Date(lastRemindedAt);
                      const now = new Date();
                      const hoursSinceLastReminder = (now.getTime() - lastReminded.getTime()) / (1000 * 60 * 60);
                      
                      if (hoursSinceLastReminder < 24) {
                        canSendReminder = false;
                        hoursRemaining = Math.ceil(24 - hoursSinceLastReminder);
                      }
                    }
                    
                    // Generate brand reply link using actual deal ID (not URL param)
                    const baseUrl = typeof window !== 'undefined' 
                      ? window.location.origin 
                      : 'https://noticebazaar.com';
                    const brandReplyLink = `${baseUrl}/#/brand-reply/${deal.id}`;
                    
                    // Test link handler - verify deal exists before sharing
                    const handleTestLink = async () => {
                      // If deal exists in the current context, trust it and open the link
                      if (deal && deal.id) {
                        // Open link in new tab
                        window.open(brandReplyLink, '_blank');
                        toast.success('✅ Opening brand reply link');
                      } else {
                        toast.error('Deal information not available. Please refresh the page.');
                      }
                    };
                    
                    return (
                      <div className="mt-3 space-y-3">
                        {/* Brand Reply Link Display */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                          <label className="text-xs font-medium text-white/70">Brand Reply Link</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={brandReplyLink}
                              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/90 font-mono truncate focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <motion.button
                              onClick={handleTestLink}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 transition-all"
                              title="Test link"
                            >
                              <Link2 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={handleCopyLink}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-300 transition-all"
                              title="Copy link"
                            >
                              <Copy className="w-4 h-4" />
                            </motion.button>
                          </div>
                          <p className="text-xs text-white/50">Share this link with the brand to get their response</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <motion.button
                            onClick={handleRemindBrand}
                            disabled={isSendingReminder || !canSendReminder}
                            whileHover={!isSendingReminder && canSendReminder ? { scale: 1.02 } : {}}
                            whileTap={!isSendingReminder && canSendReminder ? { scale: 0.98 } : {}}
                            className={cn(
                              "py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
                              !isSendingReminder && canSendReminder
                                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 hover:bg-yellow-500/30"
                                : "bg-yellow-500/10 text-yellow-300/50 border border-yellow-400/20 cursor-not-allowed"
                            )}
                          >
                            {isSendingReminder ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">Sending...</span>
                              </>
                            ) : !canSendReminder ? (
                              <>
                                <Check className="w-5 h-5" />
                                <span className="text-xs">Sent • {hoursRemaining}h</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-5 h-5" />
                                <span className="text-sm">🔗 Share Reminder</span>
                              </>
                            )}
                          </motion.button>
                          
                          <motion.button
                            onClick={handleCopyLink}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-purple-500/20 text-purple-300 border border-purple-400/30 hover:bg-purple-500/30"
                          >
                            <Link2 className="w-5 h-5" />
                            <span className="text-sm">Copy Link</span>
                          </motion.button>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* OTP Verification Status - Show when brand accepted */}
                  {responseStatus === 'accepted' || responseStatus === 'accepted_verified' && (
                    <div className="mt-4 space-y-3">
                      {/* OTP Status Chip */}
                      {(() => {
                        const otpVerified = (deal as any)?.otp_verified;
                        const otpVerifiedAt = (deal as any)?.otp_verified_at;
                        
                        if (responseStatus === 'accepted_verified' && otpVerified) {
                          return (
                            <div className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border",
                              "bg-green-500/20 border-green-500/30"
                            )}>
                              <span className="text-sm font-semibold text-green-400">
                                ✅ Brand Accepted (OTP Verified)
                              </span>
                              {otpVerifiedAt && (
                                <span className="text-xs text-white/60">
                                  Verified on {new Date(otpVerifiedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          );
                        } else if (responseStatus === 'accepted' && !otpVerified) {
                          return (
                            <div className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border",
                              "bg-yellow-500/20 border-yellow-500/30"
                            )}>
                              <span className="text-sm font-semibold text-yellow-400">
                                ⏳ Awaiting OTP Verification
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Deliverables */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Deliverables
              </h2>
              
              {/* Auto-completion info banner */}
              {deliverables.length > 0 && (
                <div className="mb-4">
                  <DeliverableAutoInfo />
                </div>
              )}

              {/* Calendar sync button */}
              {deal.due_date && deliverables.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => handleAddToCalendar('deliverable')}
                    className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm text-white"
                  >
                    <Calendar className="w-4 h-4" />
                    Add Deliverable to Calendar
                  </button>
                </div>
              )}

              {deliverables.length > 0 ? (
                <div className="space-y-3">
                  {deliverables.map((item: any, index: number) => (
                    <div key={index} className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium break-words">{item.title || item.name || `Deliverable ${index + 1}`}</div>
                          {item.dueDate && (
                            <div className="text-xs text-white/60 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span>Due: {item.dueDate}</span>
                            </div>
                          )}
                          {item.status && (
                            <div className="mt-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                item.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {item.status === 'completed' ? 'Completed' :
                                 item.status === 'in_progress' ? 'In Progress' :
                                 'Pending'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-white/60">No deliverables specified</div>
              )}
            </div>

            {/* Action Log */}
            {actionLogEntries.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20">
                <h3 className="font-semibold text-lg mb-4">Action Log</h3>
                <Suspense fallback={<div className="text-white/60 p-4">Loading action log...</div>}>
                  <ActionLog entries={actionLogEntries} />
                </Suspense>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Issue Status Card */}
            {latestIssue && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20">
                <Suspense fallback={<div className="text-white/60 p-4">Loading issue status...</div>}>
                  <IssueStatusCard
                    issue={{
                      id: latestIssue.id,
                      issueType: latestIssue.category,
                      status: latestIssue.status,
                      assignedTeam: latestIssue.assigned_team || undefined,
                      lastUpdated: latestIssue.updated_at,
                      userLastMessage: latestIssue.message.length > 100 
                        ? latestIssue.message.substring(0, 100) + '...' 
                        : latestIssue.message,
                      createdAt: latestIssue.created_at,
                    }}
                    onViewHistory={() => {
                      toast.info('Issue history feature coming soon');
                    }}
                    onUpdateIssue={handleReportIssue}
                  />
                </Suspense>
              </div>
            )}

            {/* Overdue Payment Card */}
            {isPaymentOverdue && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20">
                <Suspense fallback={<div className="text-white/60 p-4">Loading payment info...</div>}>
                  <OverduePaymentCard
                    dealTitle={dealTitle}
                    brandName={deal.brand_name}
                    amount={dealAmount}
                    dueDate={deal.payment_expected_date || deal.due_date || ''}
                    daysOverdue={daysOverdue}
                    onSendReminder={handleSendPaymentReminder}
                  />
                </Suspense>
              </div>
            )}

            {/* Brand Info */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Brand Contact
                </h2>
                {/* Auto-fill button if analysis data exists */}
                {protectionReport?.analysis_json && !deal.brand_email && (
                  <motion.button
                    onClick={async () => {
                      const contactInfo = extractBrandContactInfo(protectionReport.analysis_json);
                      if (contactInfo.brandEmail || contactInfo.brandLegalContact || contactInfo.brandAddress) {
                        try {
                          const updateData: any = {};
                          if (contactInfo.brandEmail && !deal.brand_email) {
                            updateData.brand_email = contactInfo.brandEmail;
                          }
                          
                          await updateBrandDealMutation.mutateAsync({
                            id: deal.id,
                            creator_id: profile?.id || '',
                            ...updateData,
                          });
                          
                          toast.success('Brand contact info auto-filled from contract');
                          await refreshAll();
                        } catch (error: any) {
                          console.error('[DealDetailPage] Auto-fill error:', error);
                          toast.error('Failed to auto-fill contact info');
                        }
                      } else {
                        toast.info('No contact information found in contract analysis');
                      }
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-colors text-purple-300"
                    title="Auto-fill from contract analysis"
                  >
                    ✨ Auto-fill
                  </motion.button>
                )}
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-white/80">
                  <span className="font-medium">{deal.brand_name}</span>
                </div>
                {deal.brand_email && (
                  <div className="flex items-center gap-2 text-white/60 break-words">
                    <Mail className="w-4 h-4 text-white/40 flex-shrink-0" />
                    <span>{deal.brand_email}</span>
                  </div>
                )}
                {(() => {
                  // Show extracted contact info if available
                  const analysisData = protectionReport?.analysis_json;
                  const contactInfo = analysisData ? extractBrandContactInfo(analysisData) : {};
                  
                  return (
                    <>
                      {contactInfo.brandLegalContact && (
                        <div className="flex items-center gap-2 text-white/60">
                          <span className="text-white/40">Legal Contact:</span>
                          <span>{contactInfo.brandLegalContact}</span>
                        </div>
                      )}
                      {contactInfo.brandAddress && (
                        <div className="flex items-start gap-2 text-white/60">
                          <span className="text-white/40 flex-shrink-0">Address:</span>
                          <span className="break-words">{contactInfo.brandAddress}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
                {deal.contact_person && (
                  <div className="flex items-center gap-2 text-white/60">
                    <span>Contact: {deal.contact_person}</span>
                  </div>
                )}
                
                {/* Brand Phone Number */}
                <div className="flex items-center gap-2">
                  {!isEditingBrandPhone ? (
                    <>
                      {deal.brand_phone ? (
                        <div className="flex items-center gap-2 text-white/60 flex-1">
                          <Phone className="w-4 h-4 text-white/40 flex-shrink-0" />
                          <span>{deal.brand_phone}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-white/40 flex-1">
                          <Phone className="w-4 h-4 text-white/30 flex-shrink-0" />
                          <span className="text-xs">No phone number</span>
                        </div>
                      )}
                      <motion.button
                        onClick={() => {
                          // Ensure phone starts with +91 when editing
                          let phoneValue = deal.brand_phone || '';
                          if (phoneValue && !phoneValue.startsWith('+91')) {
                            phoneValue = phoneValue.startsWith('+') ? phoneValue : `+91 ${phoneValue}`;
                          } else if (!phoneValue) {
                            phoneValue = '+91 ';
                          }
                          setBrandPhoneInput(phoneValue);
                          setIsEditingBrandPhone(true);
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Edit phone number"
                      >
                        <Edit className="w-4 h-4 text-white/60" />
                      </motion.button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <Phone className="w-4 h-4 text-white/40 flex-shrink-0" />
                      <input
                        type="tel"
                        value={brandPhoneInput}
                        onChange={(e) => {
                          let value = e.target.value;
                          // Ensure +91 prefix is always present
                          if (!value.startsWith('+91')) {
                            // If user tries to delete +91, restore it
                            if (value.length < 3) {
                              value = '+91 ';
                            } else {
                              // If user pastes or types a number without +91, add it
                              value = '+91 ' + value.replace(/^\+91\s*/, '');
                            }
                          }
                          setBrandPhoneInput(value);
                        }}
                        placeholder="+91 9876543210"
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        autoFocus
                      />
                      <motion.button
                        onClick={async () => {
                          if (!profile?.id) {
                            toast.error('User not found');
                            return;
                          }
                          
                          try {
                            // Clean phone number - validate it has more than just the prefix
                            let phoneValue = brandPhoneInput.trim();
                            if (phoneValue === '+91' || phoneValue === '+91 ' || phoneValue === '') {
                              toast.error('Please enter a valid phone number');
                              return;
                            } else if (!phoneValue.startsWith('+91')) {
                              // If somehow +91 is missing, add it
                              phoneValue = '+91 ' + phoneValue.replace(/^\+91\s*/, '');
                            }
                            
                            // Validate phone has digits after +91
                            const digitsAfterPrefix = phoneValue.replace(/^\+91\s*/, '').replace(/\D/g, '');
                            if (digitsAfterPrefix.length < 10) {
                              toast.error('Please enter a valid 10-digit phone number');
                              return;
                            }
                            
                            await updateBrandDealMutation.mutateAsync({
                              id: deal.id,
                              creator_id: profile.id,
                              brand_phone: phoneValue,
                            });
                            
                            toast.success('Brand phone number updated');
                            setIsEditingBrandPhone(false);
                            await refreshAll();
                          } catch (error: any) {
                            console.error('[DealDetailPage] Update phone error:', error);
                            toast.error(error.message || 'Failed to update phone number');
                          }
                        }}
                        disabled={updateBrandDealMutation.isPending}
                        whileTap={{ scale: 0.95 }}
                        className="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Save"
                      >
                        {updateBrandDealMutation.isPending ? (
                          <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 text-green-400" />
                        )}
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setIsEditingBrandPhone(false);
                          setBrandPhoneInput('');
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contract Info */}
            {deal.contract_file_url && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Contract
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium break-words">{contractFileName}</div>
                      {deal.created_at && (
                        <div className="text-xs text-white/60">
                          Uploaded {new Date(deal.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Download Contract Summary PDF Button */}
                  {(protectionReport || protectionIssues.length > 0) && (
                    <motion.button
                      onClick={handleDownloadContractSummary}
                      disabled={isGeneratingPDF}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium text-white shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingPDF ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download Contract Summary PDF
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            )}


            {/* Invoice Ready */}
            {(deal as any)?.invoice_url && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  🧾 Invoice Ready
                </h2>
                <div className="space-y-3">
                  <p className="text-sm text-white/80">
                    Download your invoice for this campaign
                  </p>
                  {(deal as any)?.invoice_number && (
                    <p className="text-xs text-white/60">
                      Invoice #: {(deal as any).invoice_number}
                    </p>
                  )}
                  <motion.button
                    onClick={() => {
                      if ((deal as any)?.invoice_url) {
                        window.open((deal as any).invoice_url, '_blank');
                        trackEvent('invoice_downloaded', { dealId: deal.id });
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-300 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Invoice
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lazy Modals */}
      <Suspense fallback={null}>
        {showContractPreview && deal.contract_file_url && (
          <ContractPreviewModal
            open={showContractPreview}
            onClose={() => setShowContractPreview(false)}
            fileUrl={deal.contract_file_url}
            fileName={contractFileName || undefined}
            dealTitle={dealTitle}
          />
        )}

        {showIssueTypeModal && (
          <IssueTypeModal
            open={showIssueTypeModal}
            onClose={() => setShowIssueTypeModal(false)}
            onSelect={handleIssueTypeSelect}
            dealTitle={dealTitle}
            dealAmount={dealAmount}
            dueDate={deal.due_date || undefined}
          />
        )}
      </Suspense>

      {/* Message Brand Modal */}
      {showMessageModal && (
        <MessageBrandModal
          open={showMessageModal}
          onClose={() => {
            setShowMessageModal(false);
            setReportIssueMessage('');
          }}
          brandName={deal.brand_name}
          brandEmail={deal.brand_email || undefined}
          dealId={deal.id}
          dealTitle={dealTitle}
          initialMessage={reportIssueMessage}
        />
      )}

      {/* Progress Update Sheet */}
      <ProgressUpdateSheet
        isOpen={showProgressSheet}
        onClose={() => setShowProgressSheet(false)}
        currentStage={currentStage}
        onStageSelect={handleProgressStageSelect}
        isLoading={updateDealProgress.isPending}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Deal</h3>
                <p className="text-sm text-white/60">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-white/80 mb-6">
              Are you sure you want to delete <span className="font-semibold">"{deal.brand_name}"</span>? 
              This will permanently remove the deal and all associated data.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  triggerHaptic(HapticPatterns.light);
                  setShowDeleteConfirm(false);
                }}
                disabled={deleteDeal.isPending}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl font-medium transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                onClick={async () => {
                  if (!profile?.id) {
                    toast.error('User not found');
                    return;
                  }
                  
                  triggerHaptic(HapticPatterns.medium);
                  
                  try {
                    await deleteDeal.mutateAsync({
                      id: deal.id,
                      creator_id: profile.id,
                      contract_file_url: deal.contract_file_url,
                      invoice_file_url: deal.invoice_file_url,
                    });
                    
                    toast.success('Deal deleted successfully');
                    navigate('/creator-contracts');
                  } catch (error: any) {
                    console.error('[DealDetailPage] Delete error:', error);
                    toast.error(error.message || 'Failed to delete deal');
                  }
                }}
                disabled={deleteDeal.isPending}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteDeal.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Deal'
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Main component with DealProvider wrapper
export default function DealDetailPage() {
  const { dealId } = useParams<{ dealId: string }>();

  return (
    <DealProvider dealId={dealId}>
      <DealDetailPageContent />
    </DealProvider>
  );
}
