"use client";

import { useState, useCallback, lazy, Suspense, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Download, Flag, Loader2, Building2, Calendar, FileText, CheckCircle, Clock, Trash2 } from 'lucide-react';
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
import { useUpdateDealProgress, DealStage, STAGE_TO_PROGRESS, useDeleteBrandDeal } from '@/lib/hooks/useBrandDeals';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { animations, iconSizes } from '@/lib/design-system';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { NativeLoadingSheet } from '@/components/mobile/NativeLoadingSheet';

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
  const { profile } = useSession();
  
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
      const parsed = typeof deal.deliverables === 'string' 
        ? JSON.parse(deal.deliverables) 
        : deal.deliverables;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [deal?.deliverables]);

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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Brand Contact
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-white/80">
                  <span className="font-medium">{deal.brand_name}</span>
                </div>
                {deal.brand_email && (
                  <div className="flex items-center gap-2 text-white/60 break-words">
                    <span>{deal.brand_email}</span>
                  </div>
                )}
                {deal.contact_person && (
                  <div className="flex items-center gap-2 text-white/60">
                    <span>Contact: {deal.contact_person}</span>
                  </div>
                )}
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
