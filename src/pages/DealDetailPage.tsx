"use client";

import { useState, useCallback, lazy, Suspense, useMemo, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Download, Flag, Loader2, Building2, Calendar, FileText, CheckCircle, Clock, Trash2, AlertCircle, XCircle, Bell, Mail, MessageSquare, Phone, Edit, X, Check, Share2, Copy, Link2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useDeal, DealProvider } from '@/contexts/DealContext';
import { useQueryClient } from '@tanstack/react-query';
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

// Safari-compatible clipboard copy helper
const copyToClipboard = async (text: string): Promise<boolean> => {
  // Check for secure context (required for clipboard API)
  const isSecureContext = typeof window !== 'undefined' && 
    (window.isSecureContext || 
     window.location.protocol === 'https:' || 
     window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1');
  
  // Try modern Clipboard API first (works in most browsers)
  if (navigator.clipboard && isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (clipboardError: any) {
      // If clipboard API fails, fall back to execCommand
      console.warn('[DealDetailPage] Clipboard API failed, trying fallback:', clipboardError);
    }
  }
  
  // Fallback for Safari and older browsers: use execCommand
  // This works better in Safari which has stricter clipboard permissions
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  textArea.setAttribute('readonly', '');
  document.body.appendChild(textArea);
  
  // Select and copy
  textArea.select();
  textArea.setSelectionRange(0, text.length); // For mobile devices
  
  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (execError) {
    document.body.removeChild(textArea);
    return false;
  }
};

// Main content component
function DealDetailPageContent() {
  const navigate = useNavigate();
  const { dealId } = useParams<{ dealId: string }>();
  const { profile, session } = useSession();
  
  // Hooks
  const { deal, isLoadingDeal, refreshAll } = useDeal();
  const queryClient = useQueryClient();
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
  const [brandReplyLink, setBrandReplyLink] = useState<string | null>(null);
  
  
  // Brand phone edit state
  const [isEditingBrandPhone, setIsEditingBrandPhone] = useState(false);
  const [brandPhoneInput, setBrandPhoneInput] = useState('+91 ');
  const updateBrandDealMutation = useUpdateBrandDeal();
  
  // PDF generation state
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [protectionReport, setProtectionReport] = useState<any>(null);
  const [protectionIssues, setProtectionIssues] = useState<any[]>([]);
  const signedContractInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingSignedContract, setIsUploadingSignedContract] = useState(false);
  
  // Final contract generation state
  const [isGeneratingSafeContract, setIsGeneratingSafeContract] = useState(false);
  const [showMarkSignedModal, setShowMarkSignedModal] = useState(false);
  const [contractJustGenerated, setContractJustGenerated] = useState(false);
  // Removed tempSafeContractUrl and contractHtml state - DOCX-first architecture
  const [contractGenerationError, setContractGenerationError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  
  // Brand details submission state
  const [brandSubmissionDetails, setBrandSubmissionDetails] = useState<any>(null);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);
  const [hasReviewedDetails, setHasReviewedDetails] = useState(false);
  
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
  
  // Helper to create a secure brand reply link token for this deal
  const generateBrandReplyLink = async (targetDealId: string): Promise<string | null> => {
    try {
      if (!session?.access_token) {
        console.warn('[DealDetailPage] Cannot generate brand reply link: no session');
        return null;
      }

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com')
          ? 'https://api.noticebazaar.com'
          : 'http://localhost:3001');

      const response = await fetch(`${apiBaseUrl}/api/brand-reply-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dealId: targetDealId, expiresAt: null }),
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.token?.id) {
        console.error('[DealDetailPage] Failed to create brand reply token:', data);
        return null;
      }

      const baseUrl =
        typeof window !== 'undefined' ? window.location.origin : 'https://noticebazaar.com';
      const link = `${baseUrl}/#/brand-reply/${data.token.id}`;
      setBrandReplyLink(link);
      return link;
    } catch (error) {
      console.error('[DealDetailPage] Brand reply token error:', error);
      return null;
    }
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

  // Extract requested contract clarifications - useMemo must be called unconditionally
  const requestedClarifications = useMemo(() => {
    const clarifications: string[] = [];
    
    // First, try to get from deal.requested_changes if it exists
    const dealRequestedChanges = (deal as any)?.requested_changes;
    if (dealRequestedChanges && Array.isArray(dealRequestedChanges)) {
      dealRequestedChanges.forEach((item: any) => {
        const text = item.title || item.text || item.description;
        if (text && typeof text === 'string') {
          // Convert to short, creator-friendly one-line string
          const shortText = text.length > 100 ? text.substring(0, 100) + '...' : text;
          clarifications.push(shortText);
        }
      });
    }
    
      // If no clarifications from deal.requested_changes, derive from protection issues
      if (clarifications.length === 0) {
        // Helper function to convert issue to creator-friendly string
        const convertIssueToClarification = (issue: any): string | null => {
          if (!issue.title) return null;
          
          let text = issue.title;
          // Remove severity labels and technical prefixes
          text = text.replace(/\[(HIGH|MEDIUM|WARNING)\s*PRIORITY\]/gi, '').trim();
          text = text.replace(/^Category:\s*/i, '').trim();
          text = text.replace(/^Issue:\s*/i, '').trim();
          
          // Convert common technical terms to creator-friendly language
          text = text.replace(/payment terms?/gi, 'payment amount and payment timeline');
          text = text.replace(/exclusivity/gi, 'exclusivity duration and scope');
          text = text.replace(/usage rights?|ip rights?|content ownership/gi, 'content usage rights duration');
          text = text.replace(/termination/gi, 'termination notice period');
          
          // Capitalize first letter
          text = text.charAt(0).toUpperCase() + text.slice(1);
          
          // Take first sentence or truncate to 100 chars
          const firstSentence = text.split(/[.!?]/)[0].trim();
          if (firstSentence.length > 0 && firstSentence.length <= 100) {
            return firstSentence;
          }
          return text.length > 100 ? text.substring(0, 100).trim() + '...' : text.trim();
        };
        
        // Try from protectionIssues (already fetched)
        if (protectionIssues && Array.isArray(protectionIssues)) {
          protectionIssues
            .filter((issue: any) => issue.severity && issue.severity !== 'low')
            .forEach((issue: any) => {
              const clarification = convertIssueToClarification(issue);
              if (clarification && !clarifications.includes(clarification)) {
                clarifications.push(clarification);
              }
            });
        }
        
        // If still empty, try from analysis_json issues
        if (clarifications.length === 0 && protectionReport?.analysis_json?.issues) {
          const analysisIssues = protectionReport.analysis_json.issues;
          if (Array.isArray(analysisIssues)) {
            analysisIssues
              .filter((issue: any) => issue.severity && issue.severity !== 'low')
              .forEach((issue: any) => {
                const clarification = convertIssueToClarification(issue);
                if (clarification && !clarifications.includes(clarification)) {
                  clarifications.push(clarification);
                }
              });
          }
        }
      
      // If still empty, check for missing key terms
      if (clarifications.length === 0 && protectionReport?.analysis_json?.keyTerms) {
        const keyTerms = protectionReport.analysis_json.keyTerms;
        const missingTerms: string[] = [];
        
        // Check for common missing terms
        if (!keyTerms.dealValue || keyTerms.dealValue === 'Not specified') {
          missingTerms.push('Clarify payment amount and payment timeline');
        }
        if (!keyTerms.exclusivity || keyTerms.exclusivity === 'Not specified' || 
            (typeof keyTerms.exclusivity === 'string' && keyTerms.exclusivity.toLowerCase().includes('unlimited'))) {
          missingTerms.push('Limit exclusivity duration and scope');
        }
        if (!keyTerms.usageRights || keyTerms.usageRights === 'Not specified') {
          missingTerms.push('Clarify content usage rights duration');
        }
        if (!keyTerms.termination || keyTerms.termination === 'Not specified') {
          missingTerms.push('Add reasonable termination notice period');
        }
        
        clarifications.push(...missingTerms);
      }
    }
    
    return clarifications;
  }, [deal, protectionIssues, protectionReport]);

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
  const dealTitle = useMemo(() => {
    if (!deal?.brand_name) return 'Collaboration Agreement';
    return `${deal.brand_name} · Collaboration Agreement`;
  }, [deal?.brand_name]);
  const contractFileName = useMemo(() => deal?.contract_file_url ? getFilenameFromUrl(deal.contract_file_url) : null, [deal?.contract_file_url]);
  
  // Extract deal status fields (must be defined before getContractStatus)
  const signedContractUrl = (deal as any)?.signed_contract_url as string | null | undefined;
  const signedContractUploadedAt = (deal as any)?.signed_contract_uploaded_at as string | null | undefined;
  const dealExecutionStatus = (deal as any)?.deal_execution_status as string | null | undefined;
  const brandResponseStatus = (deal as any)?.brand_response_status as string | null | undefined;
  // Use temporary URL if available, otherwise fall back to deal data
  // Prioritize safe_contract_url (v2) over contract_file_url (legacy)
  // v2 contracts have all fixes applied (currency, artifacts, jurisdiction, etc.)
  // DOCX contract URL (primary source)
  const contractDocxUrl = deal?.contract_file_url as string | null | undefined;
  
  console.log('[DealDetailPage] Contract URL resolution:', {
    contractDocxUrl,
    contractVersion: (deal as any)?.contract_version,
    hasContract: !!contractDocxUrl
  });
  const contractVersion = (deal as any)?.contract_version as string | null | undefined;
  const signedAt = (deal as any)?.signed_at as string | null | undefined;
  const signedVia = (deal as any)?.signed_via as string | null | undefined;
  
  // Map deal status to display status (shared logic)
  const getContractStatus = useCallback((): string => {
    // Check signed contract status first
    if (dealExecutionStatus === 'signed' || dealExecutionStatus === 'completed') {
      return 'Signed';
    }
    
    // Check brand response status
    if (brandResponseStatus === 'accepted_verified') {
      return 'Approved';
    }
    if (brandResponseStatus === 'accepted') {
      return 'Approved';
    }
    if (brandResponseStatus === 'sent') {
      return 'Shared';
    }
    if (brandResponseStatus === 'negotiating') {
      return 'Draft';
    }
    if (brandResponseStatus === 'rejected') {
      return 'Draft';
    }
    
    // Check deal status
    const statusLower = deal?.status?.toLowerCase() || '';
    if (statusLower.includes('signed') || statusLower.includes('completed')) {
      return 'Signed';
    }
    if (statusLower.includes('approved') || statusLower.includes('accepted')) {
      return 'Approved';
    }
    if (statusLower.includes('sent') || statusLower.includes('shared')) {
      return 'Shared';
    }
    
    // Default to Draft
    return 'Draft';
  }, [deal?.status, dealExecutionStatus, brandResponseStatus]);

  // Compute clean display name for contract (UI-only, doesn't change stored filename)
  // Status is shown separately as a badge, so we don't include it in the name
  const displayContractName = useMemo(() => {
    if (!deal?.contract_file_url || !deal?.brand_name) return null;
    
    // Get creator name
    const creatorFirstName = profile?.first_name || '';
    const creatorLastName = profile?.last_name || '';
    const creatorName = `${creatorFirstName} ${creatorLastName}`.trim() || 'Creator';
    
    const contractType = 'Collaboration Agreement';
    
    // Format: {Brand} × {Creator} — Collaboration Agreement
    // Status is shown separately as a badge
    return `${deal.brand_name} × ${creatorName} — ${contractType}`;
  }, [deal?.contract_file_url, deal?.brand_name, profile?.first_name, profile?.last_name]);

  // Get contract status for badge display
  const contractStatus = useMemo(() => getContractStatus(), [getContractStatus]);
  const showContractExecutionSection =
    !!deal &&
    (brandResponseStatus === 'accepted_verified' ||
      !!signedContractUrl ||
      !!dealExecutionStatus);

  // ALL HANDLERS MUST BE DEFINED BEFORE EARLY RETURNS
  // Handlers (must be useCallback and defined before early returns)
  const handlePreviewContract = useCallback(() => {
    // Check for HTML contract first (primary source)
    const contractDocxUrl = deal?.contract_file_url as string | null | undefined;
    
    if (contractDocxUrl && deal?.id) {
      // Download DOCX contract
      const link = document.createElement('a');
      link.href = contractDocxUrl;
      link.download = `Contract_${deal.id}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      trackEvent('contract_downloaded', { 
        dealId: deal.id,
        dealTitle: deal.brand_name,
        contractType: 'html',
      });
      
      window.open(viewUrl, '_blank');
      return;
    }
    
    // Fallback to PDF preview if HTML not available
    if (!deal?.contract_file_url) {
      toast.error('No contract available');
      return;
    }
    
    trackEvent('contract_preview_opened', { 
      dealId: deal.id,
      dealTitle: deal.brand_name,
      contractType: 'pdf',
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
    // Use active contract URL (prioritizes v2 contract with all fixes)
    const contractUrl = contractDocxUrl;
    if (!contractUrl) {
      toast.error('No contract file available');
      return;
    }

    setIsDownloading(true);
    const progressToast = toast.loading('Downloading contract...');

    try {
      const filename = getFilenameFromUrl(contractUrl);
      await downloadFile(contractUrl, filename);
      
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

  // Upload final signed contract PDF (Phase 2 - storage only, no e-sign)
  const handleSignedContractUpload = useCallback(
    async (file: File) => {
      if (!deal?.id) {
        toast.error('Deal not available. Please reopen this page.');
        return;
      }

      if (!session?.access_token) {
        toast.error('Please log in to upload the signed contract.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('Signed contract must be under 10 MB.');
        return;
      }

      const isPdf =
        file.type === 'application/pdf' ||
        file.type === 'application/x-pdf' ||
        file.name.toLowerCase().endsWith('.pdf');

      if (!isPdf) {
        toast.error('Please upload a PDF file.');
        return;
      }

      try {
        setIsUploadingSignedContract(true);
        const apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL ||
          (typeof window !== 'undefined' &&
          window.location.origin.includes('creatorarmour.com')
            ? 'https://api.creatorarmour.com'
            : 'https://noticebazaar-api.onrender.com');

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
          `${apiBaseUrl}/api/deals/${deal.id}/upload-signed-contract`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: formData,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to upload signed contract.');
        }

        toast.success('Signed contract stored for your records.');
        triggerHaptic(HapticPatterns.success);
        refreshAll();
      } catch (error: any) {
        console.error('[DealDetailPage] Upload signed contract error:', error);
        toast.error(error.message || 'Failed to upload signed contract.');
        triggerHaptic(HapticPatterns.error);
      } finally {
        setIsUploadingSignedContract(false);
      }
    },
    [deal?.id, session?.access_token, refreshAll]
  );

  const handleSignedContractFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleSignedContractUpload(file);
    }
    // Allow selecting the same file twice
    event.target.value = '';
  };

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

  // Fetch brand submission details if deal was created via form
  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      if (!deal?.id || !session?.access_token) return;
      
      const createdVia = (deal as any)?.created_via;
      const status = deal?.status?.toLowerCase();
      
      // Only fetch if deal was created via deal_details_form and status indicates brand details submitted
      if (createdVia === 'deal_details_form' && (status === 'brand_details_submitted' || status?.includes('brand'))) {
        setIsLoadingSubmission(true);
        try {
          const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL ||
            (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
              ? 'https://api.creatorarmour.com'
              : typeof window !== 'undefined' && window.location.hostname === 'localhost'
              ? 'http://localhost:3001'
              : 'https://noticebazaar-api.onrender.com');

          const response = await fetch(`${apiBaseUrl}/api/deal-details-tokens/deal/${deal.id}`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setBrandSubmissionDetails(data.formData);
            }
          }
        } catch (error) {
          console.error('[DealDetailPage] Error fetching submission details:', error);
        } finally {
          setIsLoadingSubmission(false);
        }
      }
    };

    fetchSubmissionDetails();
  }, [deal?.id, deal?.status, (deal as any)?.created_via, session?.access_token]);

  // Note: We trust that if the deal exists in the UI (loaded via useBrandDealById),
  // it's safe to generate and share the brand reply link.
  // The deal verification was causing false negatives due to timing/replication delays.

  // Loading state - EARLY RETURNS AFTER ALL HOOKS
  if (isLoadingDeal) {
    return (
      <>
        <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900" />
        <NativeLoadingSheet isOpen={true} message="Loading deal details..." />
      </>
    );
  }

  // Deal not found
  if (!deal) {
    return (
      <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center p-4">
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
    <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
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
        {/* Page Subtitle */}
        <p className="text-sm text-white/70 text-center mb-4 px-2">
          Everything about this collaboration, organized and protected in one place.
        </p>
        
        {/* Brand Details Review Section - Show if deal was created via form */}
        {brandSubmissionDetails && !hasReviewedDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border-2 border-green-400/30 rounded-2xl p-4 md:p-6 shadow-lg shadow-green-500/10"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/30 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="text-xl font-bold flex-1">New Collaboration Request</h2>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/30 text-green-300 border border-green-400/50 whitespace-nowrap">
                    New
                  </span>
                </div>
                <p className="text-white/80 text-sm mb-1.5 font-medium">
                  {brandSubmissionDetails.brandName || 'The brand'} has shared their collaboration details
                </p>
                <p className="text-white/60 text-sm mb-4 leading-relaxed">
                  Review the details below, then we'll help you create a protected contract.
                </p>
              </div>
            </div>

            {/* Details Display */}
            <div className="bg-white/5 rounded-xl p-4 md:p-5 space-y-4 mb-4 border border-white/5">
              <div className="border-b border-white/10 pb-3">
                <div className="text-sm text-white/60 mb-1">Brand Name</div>
                <div className="text-white font-medium">{brandSubmissionDetails.brandName || 'Not provided'}</div>
              </div>
              
              {brandSubmissionDetails.campaignName && (
                <div className="border-b border-white/10 pb-3">
                  <div className="text-sm text-white/60 mb-1">Campaign Name</div>
                  <div className="text-white font-medium">{brandSubmissionDetails.campaignName}</div>
                </div>
              )}

              <div className="border-b border-white/10 pb-3">
                <div className="text-sm text-white/60 mb-1">Deal Type</div>
                <div className="text-white font-medium capitalize">{brandSubmissionDetails.dealType || 'paid'}</div>
              </div>

              {brandSubmissionDetails.dealType === 'paid' && brandSubmissionDetails.paymentAmount && (
                <div className="border-b border-white/10 pb-3">
                  <div className="text-sm text-white/60 mb-1">Payment Amount</div>
                  <div className="text-white font-semibold text-lg">₹{parseFloat(brandSubmissionDetails.paymentAmount).toLocaleString('en-IN')}</div>
                </div>
              )}

              {brandSubmissionDetails.deliverables && brandSubmissionDetails.deliverables.length > 0 && (
                <div className="border-b border-white/10 pb-3">
                  <div className="text-sm text-white/60 mb-1">Deliverables</div>
                  <ul className="list-disc list-inside space-y-1">
                    {brandSubmissionDetails.deliverables.map((d: string, idx: number) => (
                      <li key={idx} className="text-white">{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {brandSubmissionDetails.deadline && (
                <div className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <div className="text-sm text-white/60 mb-1">Timeline / Deadline</div>
                  <div className="text-white font-medium">
                    {(() => {
                      try {
                        const date = new Date(brandSubmissionDetails.deadline);
                        return date.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        });
                      } catch {
                        return brandSubmissionDetails.deadline;
                      }
                    })()}
                  </div>
                </div>
              )}

              {brandSubmissionDetails.usageRights && (
                <div className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <div className="text-sm text-white/60 mb-1">Usage Rights</div>
                  <div className="text-white font-medium">{brandSubmissionDetails.usageRights}</div>
                </div>
              )}

              {brandSubmissionDetails.exclusivity && (
                <div className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <div className="text-sm text-white/60 mb-1">Exclusivity Period</div>
                  <div className="text-white font-medium">{brandSubmissionDetails.exclusivity}</div>
                </div>
              )}

              {brandSubmissionDetails.revisions && (
                <div className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <div className="text-sm text-white/60 mb-1">Revisions</div>
                  <div className="text-white font-medium">{brandSubmissionDetails.revisions}</div>
                </div>
              )}
            </div>

            {/* Review Button */}
            <button
              onClick={async () => {
                triggerHaptic(HapticPatterns.medium);
                setHasReviewedDetails(true);
                
                // Update deal status to draft after review
                try {
                  const { error } = await supabase
                    .from('brand_deals')
                    .update({ status: 'Draft' })
                    .eq('id', deal.id);

                  if (error) throw error;

                  toast.success('Details reviewed. You can now generate the draft contract.');
                  refreshAll();
                } catch (error: any) {
                  console.error('[DealDetailPage] Error updating deal status:', error);
                  toast.error('Failed to update status');
                }
              }}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-[0.98]"
            >
              <CheckCircle className="w-5 h-5" />
              I've Reviewed — Create Contract
            </button>
            <p className="text-xs text-white/50 text-center mt-3 leading-relaxed">
              We'll generate a protected contract based on these details. Takes under 60 seconds.
            </p>
          </motion.div>
        )}
        
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
            <div className="text-xs text-white/50 mt-1">(Protected)</div>
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
                      const success = await copyToClipboard(fullText);
                      if (success) {
                      toast.success('Deal details copied to clipboard');
                      trackEvent('deal_shared', {
                        dealId: deal.id,
                        method: 'copy',
                      });
                      }
                    }
                  }
                } else {
                  // Fallback: Copy to clipboard
                  const fullText = `${shareText}\n\nView deal: ${shareUrl}`;
                  const success = await copyToClipboard(fullText);
                  if (success) {
                  toast.success('Deal details copied to clipboard');
                  trackEvent('deal_shared', {
                    dealId: deal.id,
                    method: 'copy',
                  });
                  }
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
              onClick={async () => {
                // Allow deletion of draft deals regardless of brand response status
                // Only prevent deletion if deal is actually signed/completed
                const contractStatus = getContractStatus();
                const isSignedOrCompleted = contractStatus === 'Signed' || 
                                          dealExecutionStatus === 'signed' || 
                                          dealExecutionStatus === 'completed' ||
                                          (deal?.status?.toLowerCase()?.includes('signed') || 
                                           deal?.status?.toLowerCase()?.includes('completed'));
                
                if (isSignedOrCompleted) {
                  toast.error('Cannot delete a deal that has been signed or completed');
                  return;
                }
                
                triggerHaptic(HapticPatterns.medium);
                setShowDeleteConfirm(true);
              }}
              whileTap={animations.microTap}
              disabled={deleteDeal.isPending}
              className="flex flex-col items-center justify-center gap-2 p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete deal"
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
                  // Generate secure brand reply link (token-based)
                  const link = await generateBrandReplyLink(deal.id);
                  if (!link) {
                    toast.error('Could not generate brand reply link. Please try again.');
                    setIsSendingReminder(false);
                    return;
                  }
                  
                  // Reminder message template
                  const reminderMessage = `Hi, just following up on the contract revisions sent earlier.

Please review and confirm your decision here:

${link}`;
                  
                  // Try native share API first
                  let sharePlatform: string | null = null;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: 'Contract Review Reminder',
                        text: reminderMessage,
                        url: link,
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
                      const success = await copyToClipboard(`${reminderMessage}\n\n${link}`);
                      if (success) {
                      toast.success('Share message copied');
                      } else {
                        throw new Error('Copy failed');
                      }
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
              
              // Handle copy link with Safari compatibility
              const handleCopyLink = async () => {
                if (!deal || !dealId) {
                  toast.error('Deal information not available');
                  return;
                }
                
                try {
          const link = brandReplyLink || (await generateBrandReplyLink(deal.id));
          if (!link) {
            toast.error('Could not generate brand reply link. Please try again.');
            return;
          }
                  
                  const success = await copyToClipboard(link);
                  if (success) {
                  triggerHaptic(HapticPatterns.light);
                  toast.success('Link copied to clipboard');
                  } else {
                    throw new Error('Copy failed');
                  }
                } catch (error) {
                  console.error('[DealDetailPage] Copy link failed:', error);
                  toast.error('Failed to copy link. Please try again.');
                }
              };
              
              // Normalize response status - treat accepted_verified as final, accepted as intermediate
              const normalizedStatus = responseStatus === 'accepted_verified' ? 'accepted_verified' :
                                     responseStatus === 'accepted' ? 'accepted' :
                                     responseStatus === 'negotiating' ? 'negotiating' :
                                     responseStatus === 'rejected' ? 'rejected' :
                                     'pending';
              
              const statusConfig = {
                pending: {
                  icon: Clock,
                  label: 'Waiting for brand response',
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
                accepted_verified: {
                  icon: CheckCircle,
                  label: '✅ Brand Accepted (OTP Verified)',
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
              
              const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.pending;
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
                      {normalizedStatus === 'pending' && (
                        <div className="text-xs text-white/60 mt-2">
                          The brand has received the link. We'll notify you as soon as they respond.
                        </div>
                      )}
                      {/* Show OTP verification date for accepted_verified */}
                      {normalizedStatus === 'accepted_verified' && (deal as any)?.otp_verified_at && (
                        <div className="text-xs text-green-300/80 mt-1">
                          Verified on {new Date((deal as any).otp_verified_at).toLocaleDateString('en-US', { 
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
                  
                  {/* Next Step Highlight for accepted_verified */}
                  {normalizedStatus === 'accepted_verified' && (
                    <div className="mt-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-emerald-300 mb-1">
                            Next Step: Finalize Contract & Proceed
                          </div>
                          <p className="text-xs text-white/70">
                            The brand has accepted and verified. You can now generate the final contract and proceed with content creation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Remind Brand Button - Only show if status is pending (NOT accepted_verified) */}
                  {normalizedStatus === 'pending' && deal && deal.id && (() => {
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
                    const link = brandReplyLink;
                    
                    // Test link handler - verify deal exists before sharing
                    const handleTestLink = async () => {
                      if (!deal || !deal.id) {
                        toast.error('Deal information not available. Please refresh the page.');
                        return;
                      }
                      
                      const finalLink = link || (await generateBrandReplyLink(deal.id));
                      if (!finalLink) {
                        toast.error('Could not generate brand reply link. Please try again.');
                        return;
                      }
                      
                      window.open(finalLink, '_blank');
                      toast.success('✅ Opening brand reply link');
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
                            value={link || 'Link will be generated when you share.'}
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
                          <p className="text-xs text-white/50">Brands usually respond within 24–48 hours.</p>
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
                  
                  {/* OTP Verification Status - Only show for accepted (not verified yet) */}
                  {normalizedStatus === 'accepted' && !(deal as any)?.otp_verified && (
                    <div className="mt-4">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border",
                        "bg-yellow-500/20 border-yellow-500/30"
                      )}>
                        <span className="text-sm font-semibold text-yellow-400">
                          ⏳ Awaiting OTP Verification
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Requested Contract Clarifications - Only show if brand reply link exists or brand_response_status exists */}
        {(() => {
          // Check if we should show this section
          // Show if brand reply link has been generated (or can be generated) OR brand_response_status exists
          const hasBrandReplyLink = !!brandReplyLink || (deal?.id && brandResponseStatus);
          const hasBrandResponseStatus = !!brandResponseStatus && 
            ['sent', 'accepted', 'accepted_verified', 'negotiating', 'rejected'].includes(brandResponseStatus);
          
          // Must have clarifications to show
          if (requestedClarifications.length === 0) {
            return null;
          }
          
          // Show if either condition is met
          const shouldShow = hasBrandReplyLink || hasBrandResponseStatus;
          
          if (!shouldShow) {
            return null;
          }
          
          // Get status indicator text - treat accepted_verified as final
          const getStatusText = () => {
            if (!brandResponseStatus) return null;
            // Normalize status - treat accepted_verified as final, never show "waiting"
            const normalizedStatus = brandResponseStatus === 'accepted_verified' ? 'accepted_verified' :
                                     brandResponseStatus === 'accepted' ? 'accepted' :
                                     brandResponseStatus;
            
            switch (normalizedStatus) {
              case 'sent':
              case 'pending':
                return '⏳ Awaiting brand response';
              case 'accepted_verified':
                return '✅ Brand Accepted (OTP Verified)';
              case 'accepted':
                return '✅ Accepted by brand';
              case 'negotiating':
                return '🔁 In discussion';
              case 'rejected':
                return '⚠️ Brand chose to proceed without updates';
              default:
                return null;
            }
          };
          
          const statusText = getStatusText();
          
          return (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/20">
              <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                Requested Contract Clarifications
              </h2>
              <p className="text-sm text-white/60 mb-4">
                These points were shared with the brand for alignment.
              </p>
              
              {/* Clarifications List */}
              <div className="space-y-2 mb-4">
                {requestedClarifications.map((clarification, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/90 flex-1">{clarification}</span>
                  </div>
                ))}
              </div>
              
              {/* Status Indicator */}
              {statusText && (
                <div className="pt-3 border-t border-white/10">
                  <p className="text-sm text-white/60">{statusText}</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Deliverables */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20">
              <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Deliverables
              </h2>
              <p className="text-xs text-white/60 mb-4">
                These will be automatically tracked and marked completed based on due dates.
              </p>
              
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
                    Add to Calendar
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
                <h3 className="font-semibold text-lg mb-2">Action Log</h3>
                <p className="text-xs text-white/60 mb-4">
                  A complete timeline of everything that happens in this deal.
                </p>
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
                          <span className="text-xs">No phone added (optional)</span>
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
            {contractDocxUrl && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Contract
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Clean display name with status badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base text-white/95 break-words flex-1 min-w-0">
                          {displayContractName || contractFileName}
                        </h3>
                        {/* Status badge */}
                        {contractStatus && displayContractName && (
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 whitespace-nowrap",
                            contractStatus === 'Signed' && "bg-green-500/20 text-green-400 border border-green-500/30",
                            contractStatus === 'Approved' && "bg-blue-500/20 text-blue-400 border border-blue-500/30",
                            contractStatus === 'Shared' && "bg-purple-500/20 text-purple-400 border border-purple-500/30",
                            contractStatus === 'Draft' && "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          )}>
                            {contractStatus}
                          </span>
                        )}
                      </div>
                      {/* Original filename as secondary metadata - truncated */}
                      {contractFileName && displayContractName && (
                        <div className="text-xs text-white/50 truncate" title={contractFileName}>
                          Original file: <span className="font-mono">{contractFileName}</span>
                        </div>
                      )}
                      {/* Upload date */}
                      {deal.created_at && (
                        <div className="text-xs text-white/60">
                          Uploaded {new Date(deal.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
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

            {/* Contract Execution - Signed Contract Storage */}
            {showContractExecutionSection && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  Contract Execution
                </h2>
                <p className="text-xs text-white/60 mb-3">
                  Upload the final signed contract once both parties have signed. This file is stored securely for your records.
                </p>

                {(!signedContractUrl || dealExecutionStatus === 'pending_signature') && (
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isUploadingSignedContract}
                      onClick={() => signedContractInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-sm font-medium shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingSignedContract ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Signed Contract (PDF)
                        </>
                      )}
                    </motion.button>
                    <p className="text-[11px] text-white/60">
                      PDF only, up to 10 MB. This does not change deal status automatically.
                    </p>
                  </div>
                )}

                {signedContractUrl && dealExecutionStatus === 'signed' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          Signed contract uploaded
                        </p>
                        {signedContractUploadedAt && (
                          <p className="text-xs text-white/60">
                            Uploaded on {new Date(signedContractUploadedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (signedContractUrl) {
                            window.open(signedContractUrl, '_blank');
                          }
                        }}
                        className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/25 text-sm font-medium text-white flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Signed PDF
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isUploadingSignedContract}
                        onClick={() => signedContractInputRef.current?.click()}
                        className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-sm font-medium text-purple-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit className="w-4 h-4" />
                        Replace Contract
                      </motion.button>
                    </div>
                    <p className="text-[11px] text-white/60">
                      Updated files replace the previous version for your records.
                    </p>
                  </div>
                )}

                {signedContractUrl && dealExecutionStatus === 'completed' && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          Execution complete
                        </p>
                        {signedContractUploadedAt && (
                          <p className="text-xs text-white/60">
                            Signed contract stored on{' '}
                            {new Date(signedContractUploadedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-white/60">
                      You can view the signed PDF from here whenever needed.
                    </p>
                  </div>
                )}

                {/* Hidden input used by both Upload and Replace buttons */}
                <input
                  ref={signedContractInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleSignedContractFileChange}
                />
              </div>
            )}

            {/* Final Contract Section - Show when deal is Approved */}
            {brandResponseStatus === 'accepted_verified' && (
              <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-xl border-2 border-emerald-400/30 rounded-2xl p-6 shadow-lg shadow-emerald-500/10">
                <h2 className="font-semibold text-xl mb-2 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-emerald-400" />
                  {(() => {
                    const contractDocxUrl = deal?.contract_file_url as string | null | undefined;
                    return contractDocxUrl ? 'Send Contract for Signature' : 'Final Contract';
                  })()}
                </h2>
                
                {(() => {
                  // Debug logging
                  const contractDocxUrl = deal?.contract_file_url as string | null | undefined;
                  if (typeof window !== 'undefined') {
                    console.log('[DealDetailPage] Final Contract Section Debug:', {
                      hasContractDocx: !!contractDocxUrl,
                      contractDocxUrl,
                      contractJustGenerated,
                      dealId: deal?.id,
                      brandResponseStatus,
                      hasContract: !!contractDocxUrl,
                      dealSafeContractUrl: (deal as any)?.safe_contract_url,
                      dealContractFileUrl: (deal as any)?.contract_file_url,
                      dealObject: deal ? Object.keys(deal) : null,
                    });
                  }
                  return null;
                })()}
                
                {(() => {
                  // Check for DOCX contract (stored in contract_file_url)
                  const contractDocxUrl = deal?.contract_file_url as string | null | undefined;
                  const hasContract = !!contractDocxUrl;
                  return !hasContract && !contractJustGenerated;
                })() ? (
                  <>
                    {/* Validation Error Banner */}
                    {contractGenerationError && (
                      <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-300 mb-2">
                              Missing Required Information
                            </p>
                            <div className="space-y-1 mb-3">
                              {missingFields.length > 0 && (
                                <ul className="text-xs text-red-200/80 list-disc list-inside space-y-1">
                                  {missingFields.map((field, idx) => (
                                    <li key={idx}>{field}</li>
                                  ))}
                                </ul>
                              )}
                              <p className="text-xs text-white/70 mt-2">
                                {contractGenerationError}
                              </p>
                            </div>
                            {missingFields.some(f => f.toLowerCase().includes('creator')) && (
                              <motion.button
                                onClick={() => navigate('/creator-profile')}
                                whileTap={{ scale: 0.98 }}
                                className="mt-2 px-4 py-2 bg-red-600/30 hover:bg-red-600/40 border border-red-500/50 rounded-lg text-sm font-medium text-white transition-colors"
                              >
                                Update Profile Address →
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-sm text-white/70 mb-4">
                      Generate the final brand-safe contract with all accepted clarifications incorporated.
                    </p>
                    
                    {(() => {
                      // Check for DOCX contract
                      const contractDocxUrl = deal?.contract_file_url as string | null | undefined;
                      return !contractDocxUrl && !contractJustGenerated;
                    })() ? (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-amber-400 text-sm">!</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-300 mb-1">
                              No original contract found
                            </p>
                            <p className="text-xs text-white/60">
                              Generate a brand-safe contract using AI, or upload an existing contract to modify.
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <motion.button
                            onClick={async () => {
                              if (!deal || !deal.id || !session?.access_token) {
                                toast.error('Missing required information');
                                return;
                              }

                              setIsGeneratingSafeContract(true);
                              setContractGenerationError(null);
                              setMissingFields([]);
                              triggerHaptic(HapticPatterns.medium);

                              try {
                                const apiBaseUrl =
                                  import.meta.env.VITE_API_BASE_URL ||
                                  (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
                                    ? 'https://api.creatorarmour.com'
                                    : typeof window !== 'undefined' && window.location.hostname === 'localhost'
                                    ? 'http://localhost:3001'
                                    : 'https://noticebazaar-api.onrender.com');

                                const response = await fetch(`${apiBaseUrl}/api/protection/generate-contract-from-scratch`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${session.access_token}`,
                                  },
                                  body: JSON.stringify({
                                    dealId: deal.id,
                                  }),
                                });

                                if (!response.ok) {
                                  const errorData = await response.json();
                                  
                                  // Handle validation errors with missing fields
                                  if (response.status === 400 && errorData.missingFields && Array.isArray(errorData.missingFields)) {
                                    setMissingFields(errorData.missingFields);
                                    const missingFieldsList = errorData.missingFields.join(', ');
                                    const needsProfileUpdate = errorData.missingFields.some((field: string) => 
                                      field.toLowerCase().includes('creator')
                                    );
                                    
                                    let errorMessage = `Missing required information: ${missingFieldsList}.`;
                                    if (needsProfileUpdate) {
                                      errorMessage += ` Please update your profile address in Profile → Settings before generating the contract.`;
                                    } else {
                                      errorMessage += ` Please update the deal details before generating the contract.`;
                                    }
                                    
                                    setContractGenerationError(errorMessage);
                                    throw new Error(errorMessage);
                                  }
                                  
                                  // Handle other validation errors
                                  if (response.status === 400 && errorData.error) {
                                    const errorMsg = errorData.error;
                                    if (errorMsg.includes('Creator address') || errorMsg.includes('creator address')) {
                                      setMissingFields(['Creator address']);
                                      const msg = `Missing creator address. Please update your profile address in Profile → Settings, then try again.`;
                                      setContractGenerationError(msg);
                                      throw new Error(msg);
                                    }
                                    setContractGenerationError(errorMsg);
                                    throw new Error(errorMsg);
                                  }
                                  
                                  const errorMsg = errorData.message || errorData.error || 'Failed to generate contract';
                                  setContractGenerationError(errorMsg);
                                  throw new Error(errorMsg);
                                }

                                const data = await response.json();
                                
                                if (data.success && data.contractDocxUrl) {
                                  toast.success('Contract generated successfully!');
                                  
                                  // Clear any previous errors
                                  setContractGenerationError(null);
                                  setMissingFields([]);
                                  
                                  // Directly update the React Query cache with new DOCX URL
                                  if (deal?.id && profile?.id) {
                                    const queryKey = ['brand_deal', deal.id, profile.id];
                                    
                                    queryClient.setQueryData(
                                      queryKey,
                                      (oldData: any) => {
                                        const updated = {
                                          ...oldData,
                                          contract_file_url: data.contractDocxUrl, // PRIMARY - DOCX URL
                                          contract_version: data.contractVersion || 'v3',
                                        };
                                        if (!oldData) {
                                          return { id: deal.id, ...updated };
                                        }
                                        
                                        console.log('[DealDetailPage] Cache update:', {
                                          hasContractDocx: !!updated.contract_file_url,
                                          contractVersion: updated.contract_version,
                                        });
                                        
                                        return updated;
                                      }
                                    );
                                    
                                    console.log('[DealDetailPage] Updated cache with DOCX contract:', {
                                      hasContractDocx: !!data.contractDocxUrl,
                                      dealId: deal.id,
                                      queryKey,
                                    });
                                  }
                                  
                                  // Handle database update status
                                  const dbUpdateSucceeded = data.databaseUpdated !== false;
                                  
                                  if (dbUpdateSucceeded) {
                                    setTimeout(() => {
                                        refreshAll();
                                    }, 1500);
                                          } else {
                                    console.warn('[DealDetailPage] Database update may have failed');
                                          }
                                } else {
                                  throw new Error('Unexpected response format: contractDocxUrl is required');
                                }
                              } catch (error: any) {
                                console.error('[DealDetailPage] Generate contract from scratch error:', error);
                                // Error message already set in state above, just show toast
                                toast.error(error.message || 'Failed to generate contract');
                              } finally {
                                setIsGeneratingSafeContract(false);
                              }
                            }}
                            disabled={isGeneratingSafeContract}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGeneratingSafeContract ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4" />
                                Generate Contract with AI
                              </>
                            )}
                          </motion.button>
                          
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            id="upload-original-contract"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file || !deal?.id) return;

                              try {
                                const progressToast = toast.loading('Uploading contract...');
                                
                                // Upload to Supabase Storage
                                const fileExtension = file.name.split('.').pop();
                                const sanitizedBrandName = deal.brand_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'deal';
                                const creatorId = deal.creator_id || profile?.id || session?.user?.id;
                                if (!creatorId) {
                                  throw new Error('Creator ID not found');
                                }
                                const filePath = `${creatorId}/brand_deals/${sanitizedBrandName}-contract-${Date.now()}.${fileExtension}`;

                                const { error: uploadError } = await supabase.storage
                                  .from('creator-assets')
                                  .upload(filePath, file, {
                                    cacheControl: '3600',
                                    upsert: false,
                                  });

                                if (uploadError) {
                                  throw new Error(`Upload failed: ${uploadError.message}`);
                                }

                                const { data: publicUrlData } = supabase.storage
                                  .from('creator-assets')
                                  .getPublicUrl(filePath);

                                if (!publicUrlData?.publicUrl) {
                                  throw new Error('Failed to get public URL');
                                }

                                // Update deal with contract URL
                                await updateBrandDealMutation.mutateAsync({
                                  id: deal.id,
                                  contract_file_url: publicUrlData.publicUrl,
                                });

                                toast.success('Contract uploaded successfully!', { id: progressToast });
                                triggerHaptic(HapticPatterns.success);
                                refreshAll();
                              } catch (error: any) {
                                console.error('[DealDetailPage] Upload contract error:', error);
                                toast.error(error.message || 'Failed to upload contract');
                              } finally {
                                // Reset input
                                e.target.value = '';
                              }
                            }}
                          />
                          <motion.button
                            onClick={() => {
                              document.getElementById('upload-original-contract')?.click();
                            }}
                            disabled={updateBrandDealMutation.isPending}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-white/10 hover:bg-white/15 border border-white/20 px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-white text-sm font-medium disabled:opacity-50"
                          >
                            {updateBrandDealMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                Upload Original Contract Instead
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    ) : null}
                    
                    <motion.button
                      onClick={async () => {
                        console.log('[DealDetailPage] Generate Brand-Safe Contract button clicked', {
                          dealId: deal?.id,
                          contract_file_url: deal?.contract_file_url,
                          contract_file_url: contractDocxUrl,
                          contractJustGenerated,
                          hasSession: !!session?.access_token,
                          isGenerating: isGeneratingSafeContract
                        });
                        
                        if (!deal || !deal.id || !session?.access_token) {
                          toast.error('Missing required information');
                          return;
                        }

                        if (!deal.contract_file_url) {
                          toast.error('Original contract URL is required. Please upload the contract file first.');
                          return;
                        }
                        
                        if (contractJustGenerated) {
                          toast.info('A contract was just generated. The page will refresh shortly to show the new contract.');
                          setTimeout(() => window.location.reload(), 1000);
                          return;
                        }

                        setIsGeneratingSafeContract(true);
                        triggerHaptic(HapticPatterns.medium);

                        try {
                          const apiBaseUrl =
                            import.meta.env.VITE_API_BASE_URL ||
                            (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
                              ? 'https://api.creatorarmour.com'
                              : typeof window !== 'undefined' && window.location.hostname === 'localhost'
                              ? 'http://localhost:3001'
                              : 'https://noticebazaar-api.onrender.com');

                          // Get reportId and original contract path
                          const reportId = protectionReport?.id || null;
                          const originalContractPath = deal.contract_file_url || '';

                          if (!originalContractPath) {
                            throw new Error('Original contract URL is required');
                          }

                          const response = await fetch(`${apiBaseUrl}/api/protection/generate-safe-contract`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${session.access_token}`,
                            },
                            body: JSON.stringify({
                              reportId,
                              originalFilePath: originalContractPath,
                              dealId: deal.id,
                            }),
                          });

                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Failed to generate safe contract');
                          }

                          const data = await response.json();
                          
                          if (data.success && data.contractDocxUrl) {
                            toast.success('Contract generated successfully!');

                            // Clear any previous errors
                            setContractGenerationError(null);
                            setMissingFields([]);

                            // Directly update the React Query cache with new DOCX URL
                            if (deal?.id && profile?.id) {
                              const queryKey = ['brand_deal', deal.id, profile.id];

                              queryClient.setQueryData(
                                queryKey,
                                (oldData: any) => {
                                  const updated = {
                                    ...oldData,
                                    contract_file_url: data.contractDocxUrl, // PRIMARY - DOCX URL
                                    contract_version: data.contractVersion || 'v3',
                                  };
                                  return updated;
                                }
                              );
                            }
                            setContractJustGenerated(true);
                            setTimeout(() => {
                            refreshAll();
                              setContractJustGenerated(false);
                            }, 1500);
                          } else {
                            throw new Error('Unexpected response format: contractDocxUrl is required');
                          }
                        } catch (error: any) {
                          console.error('[DealDetailPage] Generate safe contract error:', error);
                          toast.error(error.message || 'Failed to generate safe contract');
                        } finally {
                          setIsGeneratingSafeContract(false);
                        }
                      }}
                      disabled={isGeneratingSafeContract || !deal.contract_file_url || contractJustGenerated}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingSafeContract ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating Contract...
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5" />
                          Generate Brand-Safe Contract
                        </>
                      )}
                    </motion.button>
                  </>
                ) : (
                  <>
                    {/* Execution Status Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      {signedContractUrl ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1.5">
                          <span className="text-sm">🟢</span>
                          Signed & Stored
                        </span>
                      ) : signedAt ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1.5">
                          <span className="text-sm">🟢</span>
                          Signed (Externally)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1.5">
                          <span className="text-sm">🟡</span>
                          Pending Signature
                        </span>
                      )}
                    </div>

                    {/* Regenerate Contract Button - Always visible when deal is approved */}
                          <motion.button
                            onClick={async () => {
                        if (!deal || !deal.id || !session?.access_token) {
                          toast.error('Missing required information');
                          return;
                        }

                        setIsGeneratingSafeContract(true);
                        setContractGenerationError(null);
                        setMissingFields([]);
                        triggerHaptic(HapticPatterns.medium);
                              
                              try {
                          const apiBaseUrl =
                            import.meta.env.VITE_API_BASE_URL ||
                            (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
                              ? 'https://api.creatorarmour.com'
                              : typeof window !== 'undefined' && window.location.hostname === 'localhost'
                              ? 'http://localhost:3001'
                              : 'https://noticebazaar-api.onrender.com');

                          const response = await fetch(`${apiBaseUrl}/api/protection/generate-contract-from-scratch`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${session.access_token}`,
                            },
                            body: JSON.stringify({
                              dealId: deal.id,
                            }),
                          });

                          if (!response.ok) {
                            const errorData = await response.json();
                            
                            // Handle validation errors with missing fields
                            if (response.status === 400 && errorData.missingFields && Array.isArray(errorData.missingFields)) {
                              setMissingFields(errorData.missingFields);
                              const missingFieldsList = errorData.missingFields.join(', ');
                              const needsProfileUpdate = errorData.missingFields.some((field: string) => 
                                field.toLowerCase().includes('creator')
                              );
                              
                              let errorMessage = `Missing required information: ${missingFieldsList}.`;
                              if (needsProfileUpdate) {
                                errorMessage += ` Please update your profile address in Profile → Settings before generating the contract.`;
                              } else {
                                errorMessage += ` Please update the deal details before generating the contract.`;
                              }
                              
                              setContractGenerationError(errorMessage);
                              throw new Error(errorMessage);
                            }
                            
                            // Handle other validation errors
                            if (response.status === 400 && errorData.error) {
                              const errorMsg = errorData.error;
                              if (errorMsg.includes('Creator address') || errorMsg.includes('creator address')) {
                                setMissingFields(['Creator address']);
                                const msg = `Missing creator address. Please update your profile address in Profile → Settings, then try again.`;
                                setContractGenerationError(msg);
                                throw new Error(msg);
                              }
                              setContractGenerationError(errorMsg);
                              throw new Error(errorMsg);
                            }
                            
                            throw new Error(errorData.error || 'Failed to generate contract');
                          }

                          const data = await response.json();
                          
                          if (data.success && data.contractDocxUrl) {
                            toast.success('Contract regenerated successfully!');
                            
                            // Update cache immediately (DOCX is primary)
                            if (deal?.id && profile?.id) {
                              const queryKey = ['brand_deal', deal.id, profile.id];
                              queryClient.setQueryData(queryKey, (oldData: any) => {
                                const updated = {
                                  ...oldData,
                                  contract_file_url: data.contractDocxUrl, // PRIMARY - DOCX URL
                                  contract_version: data.contractVersion || 'v3',
                                };
                                if (!oldData) {
                                  return { id: deal.id, ...updated };
                                }
                                return updated;
                              });
                            }
                            
                            setContractJustGenerated(true);
                            setTimeout(() => {
                              refreshAll();
                              setContractJustGenerated(false);
                            }, 2000);
                          } else {
                            throw new Error('Unexpected response format: contractDocxUrl is required');
                          }
                        } catch (error: any) {
                          console.error('[DealDetailPage] Generate contract from scratch error:', error);
                          toast.error(error.message || 'Failed to generate contract');
                        } finally {
                          setIsGeneratingSafeContract(false);
                              }
                            }}
                      disabled={isGeneratingSafeContract || contractJustGenerated}
                            whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                    >
                      {isGeneratingSafeContract ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Regenerating Contract...
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5" />
                          {contractDocxUrl ? 'Regenerate Contract' : 'Generate Contract'}
                        </>
                      )}
                          </motion.button>
                          
                    {/* Validation Error Banner */}
                    {contractGenerationError && (
                      <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-300 mb-2">
                              Missing Required Information
                            </p>
                            <div className="space-y-1 mb-3">
                              {missingFields.length > 0 && (
                                <ul className="text-xs text-red-200/80 list-disc list-inside space-y-1">
                                  {missingFields.map((field, idx) => (
                                    <li key={idx}>{field}</li>
                                  ))}
                                </ul>
                              )}
                              <p className="text-xs text-white/70 mt-2">
                                {contractGenerationError}
                              </p>
                            </div>
                            {missingFields.some(f => f.toLowerCase().includes('creator')) && (
                              <motion.button
                                onClick={() => navigate('/creator-profile')}
                                whileTap={{ scale: 0.98 }}
                                className="mt-2 px-4 py-2 bg-red-600/30 hover:bg-red-600/40 border border-red-500/50 rounded-lg text-sm font-medium text-white transition-colors"
                              >
                                Update Profile Address →
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* View & Download Contract Buttons - Primary Actions */}
                    {(() => {
                      // Check for DOCX contract (stored in contract_file_url)
                      const contractDocxUrl = deal?.contract_file_url as string | null | undefined;
                      const hasContract = !!contractDocxUrl;
                      
                      return hasContract ? (
                        <>
                          <div className="space-y-2 mb-4">
                            {/* Download Contract as Word (DOCX) - Primary Action */}
                          <motion.button
                            onClick={() => {
                                if (!contractDocxUrl) return;
                              triggerHaptic(HapticPatterns.light);
                                
                                // Trigger download
                                const link = document.createElement('a');
                                link.href = contractDocxUrl;
                                link.download = `Contract_${deal.id || 'contract'}.docx`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            whileTap={{ scale: 0.98 }}
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-white font-semibold"
                          >
                              <FileText className="w-5 h-5" />
                              Download Contract (DOCX)
                          </motion.button>
                            
                            <p className="text-xs text-white/60 text-center">
                              Open the downloaded DOCX file in Microsoft Word or Google Docs to view, edit, and sign the contract.
                          </p>
                          </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        {/* Validation Error Banner */}
                        {contractGenerationError && (
                          <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-5 h-5 rounded-full bg-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-red-300 mb-2">
                                  Missing Required Information
                                </p>
                                <div className="space-y-1 mb-3">
                                  {missingFields.length > 0 && (
                                    <ul className="text-xs text-red-200/80 list-disc list-inside space-y-1">
                                      {missingFields.map((field, idx) => (
                                        <li key={idx}>{field}</li>
                                      ))}
                                    </ul>
                                  )}
                                  <p className="text-xs text-white/70 mt-2">
                                    {contractGenerationError}
                                  </p>
                                </div>
                                {missingFields.some(f => f.toLowerCase().includes('creator')) && (
                                  <motion.button
                                    onClick={() => navigate('/creator-profile')}
                                    whileTap={{ scale: 0.98 }}
                                    className="mt-2 px-4 py-2 bg-red-600/30 hover:bg-red-600/40 border border-red-500/50 rounded-lg text-sm font-medium text-white transition-colors"
                                  >
                                    Update Profile Address →
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                          <p className="text-sm text-amber-300 mb-2 font-medium">
                            Final contract not yet generated
                          </p>
                          <p className="text-xs text-white/60 mb-3">
                            Generate the final contract to enable download and signing options.
                          </p>
                          
                          {/* Show generation options directly here if no contract exists */}
                          {!deal?.contract_file_url ? (
                            <motion.button
                              onClick={async () => {
                                if (!deal || !deal.id || !session?.access_token) {
                                  toast.error('Missing required information');
                                  return;
                                }

                                setIsGeneratingSafeContract(true);
                                setContractGenerationError(null);
                                setMissingFields([]);
                                triggerHaptic(HapticPatterns.medium);

                                try {
                                  const apiBaseUrl =
                                    import.meta.env.VITE_API_BASE_URL ||
                                    (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
                                      ? 'https://api.creatorarmour.com'
                                      : typeof window !== 'undefined' && window.location.hostname === 'localhost'
                                      ? 'http://localhost:3001'
                                      : 'https://noticebazaar-api.onrender.com');

                                  const response = await fetch(`${apiBaseUrl}/api/protection/generate-contract-from-scratch`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${session.access_token}`,
                                    },
                                    body: JSON.stringify({
                                      dealId: deal.id,
                                    }),
                                  });

                                  if (!response.ok) {
                                    const errorData = await response.json();
                                    
                                    // Handle validation errors with missing fields
                                    if (response.status === 400 && errorData.missingFields && Array.isArray(errorData.missingFields)) {
                                      setMissingFields(errorData.missingFields);
                                      const missingFieldsList = errorData.missingFields.join(', ');
                                      const needsProfileUpdate = errorData.missingFields.some((field: string) => 
                                        field.toLowerCase().includes('creator')
                                      );
                                      
                                      let errorMessage = `Missing required information: ${missingFieldsList}.`;
                                      if (needsProfileUpdate) {
                                        errorMessage += ` Please update your profile address in Profile → Settings before generating the contract.`;
                                      } else {
                                        errorMessage += ` Please update the deal details before generating the contract.`;
                                      }
                                      
                                      setContractGenerationError(errorMessage);
                                      throw new Error(errorMessage);
                                    }
                                    
                                    // Handle other validation errors
                                    if (response.status === 400 && errorData.error) {
                                      const errorMsg = errorData.error;
                                      if (errorMsg.includes('Creator address') || errorMsg.includes('creator address')) {
                                        setMissingFields(['Creator address']);
                                        const msg = `Missing creator address. Please update your profile address in Profile → Settings, then try again.`;
                                        setContractGenerationError(msg);
                                        throw new Error(msg);
                                      }
                                      setContractGenerationError(errorMsg);
                                      throw new Error(errorMsg);
                                    }
                                    
                                    const errorMsg = errorData.error || 'Failed to generate contract';
                                    setContractGenerationError(errorMsg);
                                    throw new Error(errorMsg);
                                  }

                                  const data = await response.json();
                                  
                          if (data.success && data.contractDocxUrl) {
                            toast.success('Contract generated successfully!');

                            // Clear any previous errors
                            setContractGenerationError(null);
                            setMissingFields([]);

                            // Directly update the React Query cache with new DOCX URL
                            if (deal?.id && profile?.id) {
                              const queryKey = ['brand_deal', deal.id, profile.id];

                              queryClient.setQueryData(
                                queryKey,
                                (oldData: any) => {
                                  const updated = {
                                    ...oldData,
                                    contract_file_url: data.contractDocxUrl, // PRIMARY - DOCX URL
                                    contract_version: data.contractVersion || 'v3',
                                  };
                                  return updated;
                                }
                              );
                            }
                            setContractJustGenerated(true);
                            setTimeout(() => {
                                    refreshAll();
                              setContractJustGenerated(false);
                            }, 1500);
                                  } else {
                            throw new Error('Unexpected response format: contractDocxUrl is required');
                                  }
                                } catch (error: any) {
                                  console.error('[DealDetailPage] Generate contract from scratch error:', error);
                                  toast.error(error.message || 'Failed to generate contract');
                                } finally {
                                  setIsGeneratingSafeContract(false);
                                }
                              }}
                              disabled={isGeneratingSafeContract}
                              whileTap={{ scale: 0.98 }}
                              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isGeneratingSafeContract ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <FileText className="w-4 h-4" />
                                  Generate Contract with AI
                                </>
                              )}
                            </motion.button>
                          ) : (
                            <motion.button
                              onClick={async () => {
                                if (!deal || !deal.id || !session?.access_token) {
                                  toast.error('Missing required information');
                                  return;
                                }

                                if (!deal.contract_file_url) {
                                  toast.error('Original contract URL is required');
                                  return;
                                }

                                setIsGeneratingSafeContract(true);
                                triggerHaptic(HapticPatterns.medium);

                                try {
                                  const apiBaseUrl =
                                    import.meta.env.VITE_API_BASE_URL ||
                                    (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
                                      ? 'https://api.creatorarmour.com'
                                      : typeof window !== 'undefined' && window.location.hostname === 'localhost'
                                      ? 'http://localhost:3001'
                                      : 'https://noticebazaar-api.onrender.com');

                                  const reportId = protectionReport?.id || null;
                                  const originalContractPath = deal.contract_file_url || '';

                                  if (!originalContractPath) {
                                    throw new Error('Original contract URL is required');
                                  }

                                  const response = await fetch(`${apiBaseUrl}/api/protection/generate-safe-contract`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${session.access_token}`,
                                    },
                                    body: JSON.stringify({
                                      reportId,
                                      originalFilePath: originalContractPath,
                                      dealId: deal.id,
                                    }),
                                  });

                                  if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(errorData.error || 'Failed to generate safe contract');
                                  }

                                  const data = await response.json();
                                  
                                  if (data.success && data.contractDocxUrl) {
                                    toast.success('Contract generated successfully!');

                                    // Clear any previous errors
                                    setContractGenerationError(null);
                                    setMissingFields([]);

                                    // Directly update the React Query cache with new DOCX URL
                                    if (deal?.id && profile?.id) {
                                      const queryKey = ['brand_deal', deal.id, profile.id];

                                      queryClient.setQueryData(
                                        queryKey,
                                        (oldData: any) => {
                                          const updated = {
                                            ...oldData,
                                            contract_file_url: data.contractDocxUrl, // PRIMARY - DOCX URL
                                            contract_version: data.contractVersion || 'v3',
                                          };
                                          return updated;
                                        }
                                      );
                                    }
                                    setContractJustGenerated(true);
                                    setTimeout(() => {
                                    refreshAll();
                                      setContractJustGenerated(false);
                                    }, 1500);
                                  } else {
                                    throw new Error('Unexpected response format: contractDocxUrl is required');
                                  }
                                } catch (error: any) {
                                  console.error('[DealDetailPage] Generate safe contract error:', error);
                                  toast.error(error.message || 'Failed to generate safe contract');
                                } finally {
                                  setIsGeneratingSafeContract(false);
                                }
                              }}
                              disabled={isGeneratingSafeContract}
                              whileTap={{ scale: 0.98 }}
                              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isGeneratingSafeContract ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <FileText className="w-4 h-4" />
                                  Generate Brand-Safe Contract
                                </>
                              )}
                            </motion.button>
                          )}
                        </div>
                      </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}

            {/* Confirm Signed Contract Received Modal */}
            <Dialog open={showMarkSignedModal} onOpenChange={setShowMarkSignedModal}>
              <DialogContent className="bg-purple-900/95 backdrop-blur-xl border border-white/10 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">Confirm Signed Contract Received</DialogTitle>
                  <DialogDescription className="text-white/70">
                    Have you received the signed contract from both parties?
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <p className="text-sm text-white/80">
                    This will update the deal status to "Signed" for organizational purposes. This is not a legal validation.
                  </p>
                  
                  {/* Optional: Upload signed contract */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/70">
                      Upload Signed Contract (Optional)
                    </label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !deal?.id) return;

                        try {
                          setIsUploadingSignedContract(true);
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('dealId', deal.id);

                          const apiBaseUrl =
                            import.meta.env.VITE_API_BASE_URL ||
                            (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
                              ? 'https://api.creatorarmour.com'
                              : typeof window !== 'undefined' && window.location.hostname === 'localhost'
                              ? 'http://localhost:3001'
                              : 'https://noticebazaar-api.onrender.com');

                          const response = await fetch(`${apiBaseUrl}/api/deals/${deal.id}/signed-contract`, {
                            method: 'POST',
                            headers: {
                              Authorization: `Bearer ${session?.access_token}`,
                            },
                            body: formData,
                          });

                          if (!response.ok) {
                            throw new Error('Failed to upload signed contract');
                          }

                          toast.success('Signed contract uploaded');
                        } catch (error: any) {
                          console.error('[DealDetailPage] Upload signed contract error:', error);
                          toast.error('Failed to upload signed contract');
                        } finally {
                          setIsUploadingSignedContract(false);
                        }
                      }}
                      className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-purple-500/20 file:text-purple-200 hover:file:bg-purple-500/30"
                    />
                    <p className="text-xs text-white/50 mt-1">
                      PDF only. This helps with records and audits.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        if (!deal?.id) return;
                        
                        try {
                          const updateData: any = {
                            status: 'Signed',
                            contract_version: 'signed',
                            signed_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                          };

                          // Keep existing signed_via if already set
                          if (!signedVia) {
                            updateData.signed_via = null; // Will be set when user clicks signing button
                          }

                          const { error } = await supabase
                            .from('brand_deals')
                            .update(updateData)
                            .eq('id', deal.id);

                          if (error) throw error;

                          toast.success('Signed contract confirmed');
                          setShowMarkSignedModal(false);
                          refreshAll();
                        } catch (error: any) {
                          console.error('[DealDetailPage] Confirm signed error:', error);
                          toast.error('Failed to update status');
                        }
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-medium transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowMarkSignedModal(false)}
                      className="flex-1 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>


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
                  
                  if (!deal?.id) {
                    toast.error('Deal not found');
                    return;
                  }
                  
                  triggerHaptic(HapticPatterns.medium);
                  
                  try {
                    // Double-check deal status before deletion
                    const contractStatus = getContractStatus();
                    const isSignedOrCompleted = contractStatus === 'Signed' || 
                                              dealExecutionStatus === 'signed' || 
                                              dealExecutionStatus === 'completed';
                    
                    if (isSignedOrCompleted) {
                      toast.error('Cannot delete a deal that has been signed or completed');
                      setShowDeleteConfirm(false);
                      return;
                    }
                    
                    await deleteDeal.mutateAsync({
                      id: deal.id,
                      creator_id: profile.id,
                      contract_file_url: deal.contract_file_url || null,
                      invoice_file_url: deal.invoice_file_url || null,
                    });
                    
                    toast.success('Deal deleted successfully');
                    setShowDeleteConfirm(false);
                    navigate('/creator-contracts');
                  } catch (error: any) {
                    console.error('[DealDetailPage] Delete error:', error);
                    const errorMessage = error?.message || error?.error || 'Failed to delete deal';
                    toast.error(errorMessage);
                    // Keep dialog open on error so user can retry
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
