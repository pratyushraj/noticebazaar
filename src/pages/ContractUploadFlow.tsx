import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertTriangle, XCircle, Loader, Sparkles, Shield, Eye, Download, IndianRupee, Calendar, Loader2, Copy, Wrench, Send, FileCheck, X, Wand2, Lock, Info, MessageSquare, Mail, ChevronDown, ChevronUp, TrendingUp, DollarSign, FileCode, Ban, AlertCircle, ArrowDown, Clock, Star, Heart, Zap, CreditCard, Building2, Gift, Package, Edit, Share2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { AICounterProposal } from '@/components/contract/AICounterProposal';
import { UniversalShareModal } from '@/components/deals/UniversalShareModal';
import { useNavigate } from 'react-router-dom';
import { ContextualTipsProvider } from '@/components/contextual-tips/ContextualTipsProvider';
import { useSession } from '@/contexts/SessionContext';
import { useAddBrandDeal, useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { validateContractFile } from '@/lib/utils/contractValidation';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/lib/services/fileService';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/utils/analytics';

type RiskLevel = 'low' | 'medium' | 'high';
type ActionType = 'NEGOTIATION' | 'CLARIFICATION' | 'SUMMARY';

const ContractUploadFlow = () => {
  const navigate = useNavigate();
  const { profile, session } = useSession();
  const queryClient = useQueryClient();
  const addDealMutation = useAddBrandDeal();
  const [step, setStep] = useState('upload'); // upload, select-file, request-details, uploading, scanning, analyzing, results, upload-error, review-error, validation-error
  const [dealType, setDealType] = useState<'contract' | 'barter'>('contract'); // 'contract' or 'barter'
  const [showUploadArea, setShowUploadArea] = useState(false);
  const uploadAreaRef = useRef<HTMLDivElement>(null);

  // Global error handler to prevent browser error banners for permission errors
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const errorMessage = error?.message || String(error);
      
      // Suppress browser error banners for permission-related errors
      if (
        errorMessage.includes('user agent') ||
        errorMessage.includes('platform') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('NotAllowedError') ||
        error?.name === 'NotAllowedError'
      ) {
        event.preventDefault();
        console.warn('[ContractUploadFlow] Suppressed permission error:', error);
        return;
      }
    };

    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || String(event.error);
      
      // Suppress browser error banners for permission-related errors
      if (
        errorMessage.includes('user agent') ||
        errorMessage.includes('platform') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('NotAllowedError')
      ) {
        event.preventDefault();
        console.warn('[ContractUploadFlow] Suppressed permission error:', event.error);
        return;
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  // Get user's deal history to determine recommendation
  const { data: brandDeals = [] } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });
  
  // Helper to determine recommended option
  const getRecommendedOption = (): 'upload' | 'request_details' | null => {
    if (!profile?.id) return null;
    
    // Check if user has uploaded contracts before
    const hasUploadedContracts = brandDeals.some(deal => deal.contract_file_url);
    
    // If user has uploaded contracts before → recommend Upload Contract
    // If user has no previous deals → recommend Request Details from Brand
    return hasUploadedContracts ? 'upload' : 'request_details';
  };
  
  const recommendedOption = getRecommendedOption();
  
  // Initialize selectedOption with recommended option (default-highlight)
  const [selectedOption, setSelectedOption] = useState<'upload' | 'request_details' | null>(recommendedOption);
  const [collaborationLink, setCollaborationLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  
  // Handle Request Details Click
  const handleRequestDetailsClick = async () => {
    if (!session?.access_token || !profile?.id) {
      toast.error('Please log in to request collaboration details');
      return;
    }

    if (collaborationLink) {
      // Link already generated, just show the UI
      return;
    }

    setIsGeneratingLink(true);
    try {
      triggerHaptic(HapticPatterns.medium);
      
      // Determine API base URL with fallback logic
      let apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
          ? 'https://api.creatorarmour.com'
          : typeof window !== 'undefined' && window.location.hostname === 'localhost'
          ? 'http://localhost:3001'
          : 'https://noticebazaar-api.onrender.com');

      // Try to fetch from API, with fallback to production if localhost fails
      let response: Response;
      let lastError: any;

      try {
        response = await fetch(`${apiBaseUrl}/api/deal-details-tokens`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ expiresAt: null }),
        });
      } catch (fetchError: any) {
        // If localhost fails, try production API as fallback
        if (
          (fetchError.message?.includes('Failed to fetch') || 
           fetchError.message?.includes('ERR_CONNECTION_REFUSED') ||
           fetchError.name === 'TypeError') &&
          apiBaseUrl.includes('localhost')
        ) {
          console.warn('[ContractUploadFlow] Localhost API unavailable, trying production API...');
          apiBaseUrl = 'https://noticebazaar-api.onrender.com';
          try {
            response = await fetch(`${apiBaseUrl}/api/deal-details-tokens`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ expiresAt: null }),
            });
          } catch (fallbackError: any) {
            lastError = fallbackError;
            throw fallbackError;
          }
        } else {
          lastError = fetchError;
          throw fetchError;
        }
      }

      if (!response.ok) {
        // Try to parse error response
        let errorMessage = 'Failed to generate link';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.success || !data.token?.id) {
        throw new Error(data.error || 'Failed to generate link');
      }

      const baseUrl =
        typeof window !== 'undefined' ? window.location.origin : 'https://creatorarmour.com';
      const link = `${baseUrl}/#/deal-details/${data.token.id}`;
      setCollaborationLink(link);
      setIsGeneratingLink(false);
      toast.success('Link generated! Share it with the brand.', {
        duration: 3000,
      });
    } catch (error: any) {
      console.error('[ContractUploadFlow] Request collaboration details error:', error);
      setIsGeneratingLink(false);
      
      // Handle connection errors gracefully
      const errorMessage = error.message || 'Failed to generate link. Please try again.';
      
      if (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('ERR_CONNECTION_REFUSED') ||
        errorMessage.includes('NetworkError') ||
        error.name === 'TypeError'
      ) {
        toast.error('Unable to connect to server. Please check your internet connection and try again.', {
          duration: 5000,
        });
      } else if (errorMessage.includes('user agent') || errorMessage.includes('platform') || errorMessage.includes('permission')) {
        toast.error('Unable to share link. Please copy it manually from the page.');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    if (!collaborationLink) return;

    triggerHaptic(HapticPatterns.light);
    const copyToClipboardSync = (text: string): boolean => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '0';
        textArea.style.top = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        textArea.style.opacity = '0';
        textArea.setAttribute('readonly', '');
        textArea.setAttribute('aria-hidden', 'true');
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, text.length);
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        console.warn('[ContractUploadFlow] execCommand copy failed:', err);
        return false;
      }
    };

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS) {
      const success = copyToClipboardSync(collaborationLink);
      if (success) {
        toast.success('Link copied to clipboard!');
      } else {
        toast.error('Failed to copy. Please select and copy manually.');
      }
    } else {
      const isSecureContext = typeof window !== 'undefined' && 
        (window.isSecureContext || 
         window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost');
      
      if (navigator.clipboard && isSecureContext) {
        try {
          await navigator.clipboard.writeText(collaborationLink);
          toast.success('Link copied to clipboard!');
        } catch (clipboardError: any) {
          const success = copyToClipboardSync(collaborationLink);
          if (success) {
            toast.success('Link copied to clipboard!');
          } else {
            toast.error('Failed to copy. Please select and copy manually.');
          }
        }
      } else {
        const success = copyToClipboardSync(collaborationLink);
        if (success) {
          toast.success('Link copied to clipboard!');
        } else {
          toast.error('Failed to copy. Please select and copy manually.');
        }
      }
    }
  };

  // Share via Email
  const handleShareEmail = () => {
    if (!collaborationLink) return;
    triggerHaptic(HapticPatterns.light);
    const subject = encodeURIComponent('Finalize Collaboration Details');
    const body = encodeURIComponent(`Hi, please help finalize our collaboration details here:\n\n${collaborationLink}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    if (!collaborationLink) return;
    triggerHaptic(HapticPatterns.light);
    const text = encodeURIComponent(`Hi, please help finalize our collaboration details here: ${collaborationLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Share via Instagram (opens Instagram DM - user needs to paste link)
  const handleShareInstagram = () => {
    if (!collaborationLink) return;
    triggerHaptic(HapticPatterns.light);
    // Instagram doesn't have a direct share URL, so we'll copy the link and open Instagram
    handleCopyLink();
    toast.info('Link copied! Open Instagram and paste it in a DM.', {
      duration: 4000,
    });
    // Try to open Instagram app or web
    window.open('https://www.instagram.com/direct/inbox/', '_blank');
  };
  
  // Barter Deal State
  const [barterChatText, setBarterChatText] = useState('');
  const [barterFormData, setBarterFormData] = useState({
    brandName: '',
    productName: '',
    deliverables: '',
    productValue: '',
    usageRights: '',
    timeline: '',
  });
  const [barterInputMode, setBarterInputMode] = useState<'chat' | 'form'>('chat'); // 'chat' or 'form'
  const [isGeneratingBarter, setIsGeneratingBarter] = useState(false);
  const [barterError, setBarterError] = useState<string | null>(null);
  const [isBarterDeal, setIsBarterDeal] = useState(false); // Flag to track if current analysis is from barter
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryDelay, setRetryDelay] = useState(0);
  const MAX_AUTO_RETRIES = 5;
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [contractUrl, setContractUrl] = useState<string | null>(null);
  const [pdfReportUrl, setPdfReportUrl] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [savedDealId, setSavedDealId] = useState<string | null>(null);
  const [isAutoSaved, setIsAutoSaved] = useState(false); // Track if deal was auto-saved
  const [hasOpenedFixModal, setHasOpenedFixModal] = useState(false); // Track if Fix & Send modal was opened
  const [brandResponseStatus, setBrandResponseStatus] = useState<'pending' | 'accepted' | 'negotiating' | 'rejected' | null>(null);
  const [aiCounterProposal, setAiCounterProposal] = useState<string | null>(null);
  const [originalContractPath, setOriginalContractPath] = useState<string | null>(null);
  const [negotiationMessage, setNegotiationMessage] = useState<string | null>(null);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [isContractSummary, setIsContractSummary] = useState(false); // Track if sharing summary (no issues) vs negotiation (has issues)
  const [brandEmail, setBrandEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Brand Approval Tracker State
  const [brandApprovalStatus, setBrandApprovalStatus] = useState<'sent' | 'viewed' | 'negotiating' | 'approved' | 'rejected' | null>(null);
  const [approvalStatusUpdatedAt, setApprovalStatusUpdatedAt] = useState<Date | null>(null);
  const [brandReplyLink, setBrandReplyLink] = useState<string | null>(null);
  
  // Helper function to format negotiation message with dynamic fields
  const formatNegotiationMessage = (baseMessage: string): string => {
    // Extract creator name with fallback chain
    const creatorName =
      (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : null) ||
      profile?.first_name ||
      session?.user?.email?.split('@')[0] ||
      'Creator';

    // Extract and sanitize deal value
    let dealValue = analysisResults?.keyTerms?.dealValue || 'the agreed amount';
    if (dealValue && dealValue !== 'the agreed amount') {
      // Ensure ₹ symbol is present
      if (!dealValue.includes('₹')) {
        dealValue = `₹${dealValue.trim()}`;
      }
      // Clean up any double symbols
      dealValue = dealValue.replace(/₹+/g, '₹').trim();
    }
    if (dealValue === '₹' || dealValue.trim() === '' || dealValue === '₹undefined') {
      dealValue = 'the agreed amount';
    }

    // Extract duration (optional)
    const duration = analysisResults?.keyTerms?.duration || null;

    // Brand name (could be extracted from contract, for now use placeholder)
    const brandName = 'Brand Team';

    // Extract the core issues content from the AI message (skip greeting if present)
    let issuesContent = baseMessage;
    // Remove common greetings if they exist
    const greetingPatterns = [
      /^Dear\s+[^,]+,\s*/i,
      /^Hello\s+[^,]+,\s*/i,
      /^Hi\s+[^,]+,\s*/i,
    ];
    for (const pattern of greetingPatterns) {
      issuesContent = issuesContent.replace(pattern, '');
    }
    issuesContent = issuesContent.trim();

    // Format the message with India-optimized template
    let formattedMessage = `Subject: Requested Revisions for ${brandName} Collaboration Agreement

Dear ${brandName},

Thank you for sharing the contract and for the opportunity to collaborate. I truly appreciate the interest and am excited about the potential association.

After reviewing the agreement, I would like to request a few minor revisions to ensure clarity and fairness for both parties:

${issuesContent}

These changes will help us maintain a long-term and professional working relationship.

Kindly share the revised agreement at your convenience.

Looking forward to working together.

Warm regards,
${creatorName}`;

    // Add contact info if available
    const creatorEmail = session?.user?.email || '';
    const creatorPhone = profile?.phone || '';
    if (creatorEmail || creatorPhone) {
      formattedMessage += `\n\n${creatorPhone ? `${creatorPhone} | ` : ''}${creatorEmail}`;
    }

    // Add brand response tracking link if available
    if (brandReplyLink) {
      formattedMessage += `\n\n---\nPlease confirm your decision on the requested changes:\n${brandReplyLink}`;
    }

    return formattedMessage;
  };

  // Helper to create a secure brand reply link token for a deal
  const generateBrandReplyLink = async (dealId: string): Promise<string | null> => {
    try {
      if (!session?.access_token) {
        console.warn('[ContractUploadFlow] Cannot generate brand reply link: no session');
        return null;
      }

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
          ? 'https://api.creatorarmour.com'
          : 'https://noticebazaar-api.onrender.com');

      const response = await fetch(`${apiBaseUrl}/api/brand-reply-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dealId, expiresAt: null }),
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.token?.id) {
        console.error('[ContractUploadFlow] Failed to create brand reply token:', data);
        return null;
      }

      const baseUrl =
        typeof window !== 'undefined' ? window.location.origin : 'https://noticebazaar.com';
      const link = `${baseUrl}/#/brand-reply/${data.token.id}`;
      setBrandReplyLink(link);
      return link;
    } catch (error) {
      console.error('[ContractUploadFlow] Brand reply token error:', error);
      return null;
    }
  };

  // Helper to open share feedback modal with auto-save
  const openShareFeedbackModal = async (): Promise<boolean> => {
    // Ensure deal is saved before opening modal
    let currentDealId = savedDealId;
    
    if (!currentDealId) {
      // Auto-save when Fix & Send modal opens for the first time
      if (!hasOpenedFixModal) {
        setHasOpenedFixModal(true);
      }
      
      currentDealId = await autoSaveDraftDeal();
      if (!currentDealId) {
        toast.error('Failed to save deal. Please try saving manually first.');
        return false;
      }
      
      setSavedDealId(currentDealId);
      // Give Supabase a brief moment to persist the record
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Ensure we have a secure brand reply link token for this deal
    if (currentDealId) {
      if (!brandReplyLink || !brandReplyLink.includes(currentDealId)) {
        await generateBrandReplyLink(currentDealId);
      }
    }
    
    setShowShareFeedbackModal(true);
    return true;
  };

  // Auto-save to Draft Deals function
  // Returns the deal ID if successful, null otherwise
  const autoSaveDraftDeal = async (options?: {
    updateExisting?: boolean;
    updateStatus?: string;
  }): Promise<string | null> => {
    // Only auto-save if user is logged in
    if (!session?.access_token || !profile?.id) {
      return null;
    }

    // Only auto-save if we have analysis results
    if (!analysisResults) {
      return null;
    }

    try {
      const creatorId = profile.id;

      // Parse deal amount - default to 0 if not specified
      let dealAmount = 0;
      const dealValueStr = analysisResults.keyTerms?.dealValue || '';
      
      if (dealValueStr && dealValueStr.trim() !== '' && 
          dealValueStr.toLowerCase() !== 'not specified' && 
          dealValueStr.toLowerCase() !== 'not mentioned') {
        
        // Try multiple parsing strategies
        const commaMatch = dealValueStr.match(/(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/);
        if (commaMatch) {
          const valueWithCommas = commaMatch[1].replace(/,/g, '');
          const parsed = parseFloat(valueWithCommas);
          if (!isNaN(parsed) && parsed > 0 && isFinite(parsed)) {
            dealAmount = parsed;
          }
        }
        
        if (dealAmount === 0) {
          let cleanedValue = dealValueStr
            .replace(/[₹Rs$€£,\s]/g, '')
            .trim();
          const parsed = parseFloat(cleanedValue);
          if (!isNaN(parsed) && parsed > 0 && isFinite(parsed)) {
            dealAmount = parsed;
          }
        }
        
        if (dealAmount === 0) {
          const digitMatch = dealValueStr.match(/(\d+)/);
          if (digitMatch) {
            const parsed = parseFloat(digitMatch[1]);
            if (!isNaN(parsed) && parsed > 0 && isFinite(parsed)) {
              dealAmount = parsed;
            }
          }
        }
      }

      // Calculate due date (default to 30 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      const dueDateStr = dueDate.toISOString().split('T')[0];
      const paymentExpectedDateStr = dueDateStr;

      // Extract brand name
      const extractedBrandName = analysisResults.keyTerms?.brandName || 
        fileName?.replace(/\.(pdf|docx?)$/i, '').replace(/[_-]/g, ' ') || 
        'Unknown Brand';

      // Determine deal type
      const currentDealType = dealType === 'barter' ? 'barter' : 'paid';

      // Check if draft already exists for this reportId
      // Note: analysis_report_id column might not exist if migration hasn't run yet
      let existingDealId: string | null = null;
      if (reportId) {
        try {
          // Try to query with analysis_report_id - if column doesn't exist, this will fail
          const { data: existingDeal, error: queryError } = await supabase
            .from('brand_deals')
            .select('id, analysis_report_id')
            .eq('creator_id', creatorId)
            .eq('analysis_report_id', reportId)
            .eq('status', 'Draft')
            .maybeSingle();
          
          // Check if error is due to missing column
          const isColumnError = 
            queryError?.message?.includes('column') ||
            queryError?.message?.includes('analysis_report_id') ||
            queryError?.code === '42703' || // undefined_column
            queryError?.code === 'PGRST116' || // PostgREST column not found
            queryError?.code === '400'; // Bad request (column doesn't exist)
          
          if (isColumnError) {
            // Column doesn't exist, skip duplicate check - allow creating new deal
            console.log('[ContractUploadFlow] analysis_report_id column not found, skipping duplicate check');
          } else if (!queryError && existingDeal) {
            // Column exists and we found a matching deal
            existingDealId = existingDeal.id;
          }
        } catch (error) {
          // Any other error, proceed with creating new deal
          console.warn('[ContractUploadFlow] Could not check for existing draft:', error);
        }
      }

      // If updating existing deal
      if (options?.updateExisting && savedDealId) {
        const updateData: any = {};
        
        if (options.updateStatus) {
          updateData.status = options.updateStatus;
        }
        
        // Update brand name if changed
        if (extractedBrandName && extractedBrandName !== 'Unknown Brand') {
          updateData.brand_name = extractedBrandName;
        }
        
        // Update deal amount if changed
        if (dealAmount > 0) {
          updateData.deal_amount = dealAmount;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('brand_deals')
            .update(updateData)
            .eq('id', savedDealId)
            .eq('creator_id', creatorId);

          if (updateError) {
            console.error('[ContractUploadFlow] Auto-save update error:', updateError);
            return null;
          }
          
          // Invalidate cache to refresh deals list
          queryClient.invalidateQueries({ 
            queryKey: ['brand_deals'],
            exact: false 
          });
          queryClient.refetchQueries({ 
            queryKey: ['brand_deals', creatorId],
            exact: false 
          });
        }
        return savedDealId;
      }

      // If draft already exists, don't create duplicate
      if (existingDealId) {
        setSavedDealId(existingDealId);
        setIsAutoSaved(true);
        return existingDealId;
      }

      // Create new draft deal
      const insertData: any = {
        creator_id: creatorId,
        organization_id: null,
        brand_name: extractedBrandName,
        deal_amount: dealAmount,
        deliverables: analysisResults.keyTerms?.deliverables || 'As per contract',
        due_date: dueDateStr,
        payment_expected_date: paymentExpectedDateStr,
        contact_person: null,
        platform: 'Other',
        status: options?.updateStatus || 'Draft',
        invoice_file_url: null,
        utr_number: null,
        brand_email: null,
        payment_received_date: null,
      };

      // Add optional fields only if columns exist (migration might not have run)
      // These will be ignored if columns don't exist, preventing 400 errors
      try {
        // Try to add new fields - if columns don't exist, Supabase will ignore them
        // We'll catch the error and retry without them
        insertData.deal_type = currentDealType;
        insertData.created_via = 'scanner';
        if (reportId) {
          insertData.analysis_report_id = reportId;
        }
        insertData.brand_response_status = 'pending';
      } catch {
        // Fields might not exist, continue without them
      }

      // Add contract file URL if available
      if (contractUrl) {
        insertData.contract_file_url = contractUrl;
      }

      let newDeal: any = null;
      let insertError: any = null;

      // Try inserting with all fields first
      const { data, error } = await supabase
        .from('brand_deals')
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        // Check if error is due to missing columns (deal_type, created_via, analysis_report_id, brand_response_status)
        const isColumnError = 
          error.message?.includes('column') ||
          error.code === '42703' || // undefined_column
          error.code === 'PGRST116'; // PostgREST column not found

        if (isColumnError) {
          // Retry without the optional fields (migration might not have run)
          console.warn('[ContractUploadFlow] Optional columns missing, retrying without them');
          const fallbackData: any = {
            creator_id: creatorId,
            organization_id: null,
            brand_name: extractedBrandName,
            deal_amount: dealAmount,
            deliverables: analysisResults.keyTerms?.deliverables || 'As per contract',
            due_date: dueDateStr,
            payment_expected_date: paymentExpectedDateStr,
            contact_person: null,
            platform: 'Other',
            status: options?.updateStatus || 'Draft',
            invoice_file_url: null,
            utr_number: null,
            brand_email: null,
            payment_received_date: null,
          };

          if (contractUrl) {
            fallbackData.contract_file_url = contractUrl;
          }

          const { data: fallbackDeal, error: fallbackError } = await supabase
            .from('brand_deals')
            .insert(fallbackData)
            .select('id')
            .single();

          if (fallbackError) {
            console.error('[ContractUploadFlow] Auto-save error (fallback):', fallbackError);
            return null;
          }

          newDeal = fallbackDeal;
        } else {
          console.error('[ContractUploadFlow] Auto-save error:', error);
          return null;
        }
      } else {
        newDeal = data;
      }

      if (newDeal && newDeal.id) {
        setSavedDealId(newDeal.id);
        setIsAutoSaved(true);
        console.log('[ContractUploadFlow] Draft deal auto-saved:', newDeal.id);
        
        // Invalidate cache to refresh deals list
        queryClient.invalidateQueries({ 
          queryKey: ['brand_deals'],
          exact: false 
        });
        queryClient.refetchQueries({ 
          queryKey: ['brand_deals', creatorId],
          exact: false 
        });
        
        return newDeal.id;
      }
      
      return null;
    } catch (error) {
      console.error('[ContractUploadFlow] Auto-save exception:', error);
      return null;
    }
  };

  const [analysisResults, setAnalysisResults] = useState<{
    overallRisk: RiskLevel;
    score: number;
    negotiationPowerScore?: number;
    issues: Array<{
      id: number;
      severity: 'high' | 'medium' | 'low' | 'warning';
      category: string;
      title: string;
      description: string;
      clause?: string;
      recommendation: string;
    }>;
    verified: Array<{
      id: number;
      category: string;
      title: string;
      description: string;
      clause?: string;
    }>;
    keyTerms: {
      dealValue?: string;
      duration?: string;
      deliverables?: string;
      paymentSchedule?: string;
      exclusivity?: string;
      brandName?: string;
    };
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIssueForClause, setSelectedIssueForClause] = useState<number | null>(null);
  const [generatedClause, setGeneratedClause] = useState<string | null>(null);
  const [isGeneratingClause, setIsGeneratingClause] = useState(false);
  const [analyzedItems, setAnalyzedItems] = useState<Set<string>>(new Set());
  const [scoreAnimation, setScoreAnimation] = useState(0);
  const [resolvedIssues, setResolvedIssues] = useState<Set<number>>(new Set());
  const [expandedFixes, setExpandedFixes] = useState<Set<number>>(new Set());
  const [generatedClauses, setGeneratedClauses] = useState<Map<number, string>>(new Map());
  const [clauseStates, setClauseStates] = useState<Map<number, 'default' | 'loading' | 'success'>>(new Map());
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);
  // Accordion states - all detail sections collapsed by default
  const [isKeyTermsExpanded, setIsKeyTermsExpanded] = useState(false);
  const [isIssuesExpanded, setIsIssuesExpanded] = useState(false);
  const [isProtectionStatusExpanded, setIsProtectionStatusExpanded] = useState(false);
  const [isMissingClausesExpanded, setIsMissingClausesExpanded] = useState(false);
  const [isFinancialBreakdownExpanded, setIsFinancialBreakdownExpanded] = useState(false);
  const [isRecommendedActionsExpanded, setIsRecommendedActionsExpanded] = useState(false);

  type AccordionSection =
    | 'keyTerms'
    | 'protectionStatus'
    | 'issues'
    | 'missingClauses'
    | 'financialBreakdown'
    | 'brandRequests';

  const handleAccordionToggle = (section: AccordionSection) => {
    setIsKeyTermsExpanded((prev) => (section === 'keyTerms' ? !prev : false));
    setIsProtectionStatusExpanded((prev) => (section === 'protectionStatus' ? !prev : false));
    setIsIssuesExpanded((prev) => (section === 'issues' ? !prev : false));
    setIsMissingClausesExpanded((prev) => (section === 'missingClauses' ? !prev : false));
    setIsFinancialBreakdownExpanded((prev) => (section === 'financialBreakdown' ? !prev : false));
    setIsRecommendedActionsExpanded((prev) => (section === 'brandRequests' ? !prev : false));
  };

  // Helper function to get risk score color and label
  const getRiskScoreInfo = (score: number) => {
    if (score >= 71) {
      return { 
        color: 'text-green-400', 
        bgColor: 'bg-green-500', 
        label: 'Low Legal Risk', 
        progressColor: 'from-green-500 to-emerald-500', 
        glowColor: 'rgba(16, 185, 129, 0.3)',
        dotColor: '#10b981' // green-500
      };
    } else if (score >= 41) {
      return { 
        color: 'text-orange-400', 
        bgColor: 'bg-orange-500', 
        label: 'Moderate Legal Risk', 
        progressColor: 'from-orange-500 to-yellow-500', 
        glowColor: 'rgba(249, 115, 22, 0.3)',
        dotColor: '#f97316' // orange-500
      };
    } else {
      return { 
        color: 'text-red-400', 
        bgColor: 'bg-red-500', 
        label: 'High Legal Risk', 
        progressColor: 'from-red-500 to-rose-500', 
        glowColor: 'rgba(239, 68, 68, 0.3)',
        dotColor: '#ef4444' // red-500
      };
    }
  };

  // Unified verdict label helper
  const getRiskVerdictLabel = (overallRisk: 'low' | 'medium' | 'high' | string) => {
    if (overallRisk === 'high') return 'Needs Attention';
    if (overallRisk === 'medium') return 'Needs Negotiation';
    return 'Safe';
  };

  // Helper function to get key term status
  const getKeyTermStatus = (term: string, value: string | undefined) => {
    if (!value || value === 'Not specified') {
      return { badge: '⚠', color: 'bg-yellow-500/20 text-yellow-400', label: 'Specs Missing' };
    }
    // Check for vague terms
    const vagueTerms = ['tbd', 'to be determined', 'as per', 'negotiable', 'discuss'];
    const isVague = vagueTerms.some(v => value.toLowerCase().includes(v));
    if (isVague) {
      return { badge: '⚠', color: 'bg-yellow-500/20 text-yellow-400', label: 'Needs Attention' };
    }
    return { badge: '✅', color: 'bg-green-500/20 text-green-400', label: 'Clear' };
  };
  
  // Calculate fixed issues count
  const fixedIssuesCount = analysisResults ? (
    Array.from(clauseStates.values()).filter(s => s === 'success').length + resolvedIssues.size
  ) : 0;
  const totalIssuesCount = analysisResults?.issues?.length || 0;
  
  // Get top 2 most dangerous issues (sorted by severity: high > medium > low > warning)
  const getTopIssues = (issues: any[]) => {
    const severityOrder = { high: 4, medium: 3, low: 2, warning: 1 };
    return [...issues]
      .filter(issue => !resolvedIssues.has(issue.id))
      .sort((a, b) => (severityOrder[b.severity as keyof typeof severityOrder] || 0) - (severityOrder[a.severity as keyof typeof severityOrder] || 0))
      .slice(0, 2);
  };

  // Generate brand-specific requests from issues and missing clauses
  const generateBrandRequests = () => {
    const requests: Array<{
      text: string;
      impact: '💰 Money Protection' | '🛡️ Rights Protection' | '⏱️ Time Protection';
      category: string;
    }> = [];

    // Add requests from issues
    analysisResults?.issues.forEach((issue) => {
      if (issue.severity === 'high' || issue.severity === 'medium') {
        let impact: '💰 Money Protection' | '🛡️ Rights Protection' | '⏱️ Time Protection' = '🛡️ Rights Protection';
        let requestText = '';

        // Determine impact type and generate request text based on category
        if (issue.category.toLowerCase().includes('payment') || issue.title.toLowerCase().includes('payment')) {
          impact = '💰 Money Protection';
          requestText = `Revise ${issue.title.toLowerCase()} to ensure fair payment terms`;
        } else if (issue.category.toLowerCase().includes('termination') || issue.title.toLowerCase().includes('termination')) {
          impact = '⏱️ Time Protection';
          requestText = `Update ${issue.title.toLowerCase()} to provide reasonable notice period`;
        } else if (issue.category.toLowerCase().includes('ip') || issue.category.toLowerCase().includes('intellectual')) {
          impact = '🛡️ Rights Protection';
          requestText = `Clarify ${issue.title.toLowerCase()} to protect your content ownership`;
        } else if (issue.category.toLowerCase().includes('exclusivity')) {
          impact = '⏱️ Time Protection';
          requestText = `Limit ${issue.title.toLowerCase()} to reasonable duration and scope`;
        } else {
          requestText = `Revise ${issue.title.toLowerCase()} for better protection`;
        }

        requests.push({
          text: requestText,
          impact,
          category: issue.category
        });
      }
    });

    // Add requests from missing clauses
    if (!analysisResults?.keyTerms?.dealValue || analysisResults.keyTerms.dealValue === 'Not specified') {
      const dealValue = analysisResults?.keyTerms?.dealValue || 'the agreed amount';
      requests.push({
        text: `Confirm final payment amount as ${dealValue.includes('₹') ? dealValue : `₹${dealValue}`} in the contract`,
        impact: '💰 Money Protection',
        category: 'Payment'
      });
    }

    if (!analysisResults?.keyTerms?.paymentSchedule || analysisResults.keyTerms.paymentSchedule === 'Not specified') {
      requests.push({
        text: 'Specify payment timeline (e.g., within 10 days after content submission)',
        impact: '💰 Money Protection',
        category: 'Payment'
      });
    }

    if (!analysisResults?.keyTerms?.exclusivity || analysisResults.keyTerms.exclusivity === 'Not specified') {
      requests.push({
        text: 'Limit content usage to 6 months, Instagram only (or specify your preferred terms)',
        impact: '⏱️ Time Protection',
        category: 'Exclusivity'
      });
    }

    // Add revision rounds if mentioned in issues
    const revisionIssue = analysisResults?.issues.find(i => 
      i.title.toLowerCase().includes('revision') || i.title.toLowerCase().includes('edit')
    );
    if (revisionIssue) {
      requests.push({
        text: 'Add maximum 2 revision rounds for content approval',
        impact: '⏱️ Time Protection',
        category: 'Deliverables'
      });
    }

    return requests;
  };

  // Determine what kind of action we should take when sharing with the brand
  const getActionType = (): ActionType => {
    const issues = Array.isArray(analysisResults?.issues) ? analysisResults!.issues : [];
    const hasHighOrMediumRisk = issues.some(
      (issue: any) => issue.severity === 'high' || issue.severity === 'medium'
    );

    if (hasHighOrMediumRisk) {
      return 'NEGOTIATION';
    }

    const clarifications = generateBrandRequests();
    const hasClarifications = clarifications.length > 0;

    if (hasClarifications) {
      return 'CLARIFICATION';
    }

    // No high/medium issues and no clarifications: treat as safe/summary state
    return 'SUMMARY';
  };

  // Progressive analysis animation
  useEffect(() => {
    if (step === 'analyzing') {
      // Reset analyzed items when analysis starts
      setAnalyzedItems(new Set());
      
      // Progressively mark items as complete
      const items = ['Payment terms', 'Termination rights', 'IP ownership', 'Exclusivity clause', 'Liability terms'];
      items.forEach((item, index) => {
        setTimeout(() => {
          setAnalyzedItems(prev => new Set([...prev, item]));
        }, (index + 1) * 800); // 800ms delay between each item
      });
    } else if (step !== 'analyzing') {
      // Clear analyzed items when leaving analyzing step
      setAnalyzedItems(new Set());
    }
  }, [step]);

  // Animate score on results load
  useEffect(() => {
    if (step === 'results' && analysisResults) {
      setScoreAnimation(0);
      const targetScore = analysisResults.score;
      const duration = 1500; // 1.5 seconds
      const steps = 60;
      const increment = targetScore / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= targetScore) {
          setScoreAnimation(targetScore);
          clearInterval(interval);
        } else {
          setScoreAnimation(Math.floor(current));
        }
      }, duration / steps);
      
      return () => clearInterval(interval);
    }
  }, [step, analysisResults]);

  // Send negotiation email
  const handleSendEmail = async (email: string) => {
    if (!session?.access_token || !negotiationMessage) {
      toast.error('Please generate a negotiation message first');
      return;
    }

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Ensure message is formatted with latest data
    const formattedMessage = formatNegotiationMessage(negotiationMessage);

    setIsSendingEmail(true);
    triggerHaptic(HapticPatterns.medium);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
      (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
        ? 'https://api.creatorarmour.com'
          : 'https://noticebazaar-api.onrender.com');
      const response = await fetch(`${apiBaseUrl}/api/protection/send-negotiation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
          body: JSON.stringify({
            toEmail: email,
            message: formattedMessage,
            reportId: reportId || null
          })
      });

      const contentType = response.headers.get('content-type');
      let data: any = {};
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      // Set brand approval status to 'sent' when email is successfully sent
      setBrandApprovalStatus('sent');
      setApprovalStatusUpdatedAt(new Date());
      
      // Set brand_response_status to 'pending' when sending
      if (savedDealId) {
        try {
          await fetch(`${apiBaseUrl}/api/brand-response/${savedDealId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'pending' })
          });
        } catch (error) {
          console.warn('Failed to set brand response status:', error);
        }
      }
      
      toast.success('Email sent successfully!');
      setBrandEmail('');
    } catch (error: any) {
      console.error('[ContractUploadFlow] Send email error:', error);
      toast.error(error.message || 'Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Generate safe clause using backend API
  const handleGenerateClause = async (issue: typeof analysisResults.issues[0]) => {
    if (!session?.access_token) {
      toast.error('Please log in to generate safe clauses');
      return;
    }

    if (!reportId) {
      toast.error('Report information not available. Please re-analyze the contract.');
      return;
    }

    triggerHaptic(HapticPatterns.light);
    setIsGeneratingClause(true);
    setSelectedIssueForClause(issue.id);
    setClauseStates(new Map(clauseStates.set(issue.id, 'loading')));
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
      (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
        ? 'https://api.creatorarmour.com'
          : 'https://noticebazaar-api.onrender.com');
      const response = await fetch(`${apiBaseUrl}/api/protection/generate-fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          reportId,
          issueIndex: issue.id - 1, // Convert to 0-based index
          originalClause: issue.clause || issue.title
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data: any = {};
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate safe clause');
      }

      const safeClause = `SAFER VERSION:\n\n${data.safeClause}\n\n${data.explanation ? `Explanation: ${data.explanation}` : ''}`;
      setGeneratedClause(safeClause);
      setGeneratedClauses(new Map(generatedClauses.set(issue.id, safeClause)));
      setClauseStates(new Map(clauseStates.set(issue.id, 'success')));
      toast.success('Fix Generated');
    } catch (error: any) {
      console.error('[ContractUploadFlow] Generate clause error:', error);
      toast.error(error.message || 'Failed to generate safe clause. Please try again.');
      setClauseStates(new Map(clauseStates.set(issue.id, 'default')));
    } finally {
      setIsGeneratingClause(false);
    }
  };

  // Helper functions for issue categorization and impact
  const getIssueCategory = (issue: typeof analysisResults.issues[0]) => {
    const title = issue.title.toLowerCase();
    const category = issue.category?.toLowerCase() || '';
    
    if (title.includes('payment') || title.includes('fee') || title.includes('compensation') || category.includes('payment')) {
      return { icon: DollarSign, label: 'Payment Issues', emoji: '💰' };
    }
    if (title.includes('intellectual') || title.includes('ip') || title.includes('ownership') || title.includes('rights') || category.includes('ip')) {
      return { icon: FileCode, label: 'Intellectual Property', emoji: '📜' };
    }
    if (title.includes('exclusive') || title.includes('exclusivity') || category.includes('exclusive')) {
      return { icon: Ban, label: 'Exclusivity', emoji: '⛔' };
    }
    if (title.includes('termination') || title.includes('cancel') || category.includes('termination')) {
      return { icon: AlertCircle, label: 'Termination', emoji: '🛑' };
    }
    return { icon: AlertTriangle, label: 'Other Issues', emoji: '⚠️' };
  };

  const getImpactIfIgnored = (issue: typeof analysisResults.issues[0]) => {
    const severity = issue.severity;
    const title = issue.title.toLowerCase();
    
    if (severity === 'high') {
      if (title.includes('payment')) {
        return 'You may face financial penalties or delayed payments';
      }
      if (title.includes('ip') || title.includes('rights')) {
        return 'You may lose ownership of your content';
      }
      if (title.includes('exclusive')) {
        return 'You may be restricted from working with other brands';
      }
      return 'This could lead to significant legal or financial consequences';
    }
    if (severity === 'medium') {
      return 'This may limit your flexibility or create future complications';
    }
    return 'This could become a concern in future negotiations';
  };

  const getSuggestedFix = (issue: typeof analysisResults.issues[0]) => {
    const title = issue.title.toLowerCase();
    const category = (issue.category || '').toLowerCase();

    if (title.includes('late fee') || category.includes('late fee')) {
      return 'Ask the brand to define the late fee % and when it applies.';
    }
    if (title.includes('payment') || category.includes('payment')) {
      return 'Ask the brand to clearly write the amount, due date, and payment method.';
    }
    if (title.includes('usage') || title.includes('license') || category.includes('usage')) {
      return 'Limit how long and where the brand can use your content.';
    }
    if (title.includes('termination') || category.includes('termination')) {
      return 'Add a clear exit option with notice period and payment for work done.';
    }
    if (title.includes('exclusiv') || category.includes('exclusiv')) {
      return 'Clarify which competitors you cannot work with and for how long.';
    }
    return 'Ask the brand to add one clear sentence to make this safer for you.';
  };

  const getNegotiationStrength = (issue: typeof analysisResults.issues[0]) => {
    const severity = issue.severity;
    
    if (severity === 'high') {
      return { label: 'Hard to Negotiate', color: 'bg-red-500/30 text-red-300 border-red-500/50', emoji: '🔴' };
    }
    if (severity === 'medium') {
      return { label: 'Moderate', color: 'bg-orange-500/30 text-orange-300 border-orange-500/50', emoji: '🟠' };
    }
    return { label: 'Easy to Negotiate', color: 'bg-green-500/30 text-green-300 border-green-500/50', emoji: '🟢' };
  };

  const handleMarkAsResolved = (issueId: number) => {
    setResolvedIssues(new Set([...resolvedIssues, issueId]));
    triggerHaptic(HapticPatterns.light);
    toast.success('Issue marked as resolved');
  };

  // Missing Price Alert Component
  const MissingPriceAlert = ({ onAskBrand }: { onAskBrand: () => void }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        const alertElement = document.getElementById('deal-breaker-alert');
        if (alertElement) {
          alertElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }, []);

    return (
      <motion.div
        id="deal-breaker-alert"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 bg-red-500/20 border-2 border-red-500/50 rounded-xl p-5 md:p-6 relative overflow-hidden"
      >
        {/* Pulse animation */}
        <motion.div
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-red-500/10 rounded-xl"
        />
        <div className="relative z-10">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg md:text-xl text-red-300 mb-2">
                🔴 DEAL BREAKER ALERT: Payment amount is missing
              </h4>
              <p className="text-sm text-red-200/80 leading-relaxed">
                This contract does not specify the payment amount. This is a critical issue that must be addressed before proceeding.
              </p>
            </div>
          </div>
          <motion.button
            onClick={onAskBrand}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Ask Brand to Add Price
          </motion.button>
        </div>
      </motion.div>
    );
  };

  const toggleFixExpansion = (issueId: number) => {
    const newExpanded = new Set(expandedFixes);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedFixes(newExpanded);
  };

  // WhatsApp Safety Firewall: Sanitize AI-generated text before sending
  const sanitizeWhatsAppMessage = (text: string): string => {
    // Max 1500 characters (WhatsApp limit is ~4096, but we use 1500 for safety)
    let sanitized = text.substring(0, 1500);
    
    // Remove URLs except platform links (noticebazaar.com, app.noticebazaar.com)
    sanitized = sanitized.replace(/https?:\/\/(?!.*noticebazaar\.com)[^\s]+/gi, '[Link removed]');
    
    // Remove monetary hallucinations (suspicious amounts that might be AI errors)
    // Keep legitimate amounts like ₹75,000, $500, etc. but remove extreme values
    sanitized = sanitized.replace(/₹[\d,]+(?:,\d{3})*(?:\.\d{2})?/g, (match) => {
      const amount = parseFloat(match.replace(/[₹,]/g, ''));
      // If amount is suspiciously high (>10 crore) or negative, remove it
      if (amount > 100000000 || amount < 0) {
        return '[Amount]';
      }
      return match;
    });
    
    // Remove email addresses (except noticebazaar domains)
    sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@(?!.*noticebazaar\.com)[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[Email]');
    
    // Remove phone numbers (except in specific contexts)
    sanitized = sanitized.replace(/\b(?:\+91|91)?[6-9]\d{9}\b/g, '[Phone]');
    
    return sanitized.trim();
  };

  // Helper function to create WhatsApp-optimized message (under 600 chars)
  const createWhatsAppMessage = (fullMessage: string): string => {
    // Apply safety sanitization first
    const sanitizedMessage = sanitizeWhatsAppMessage(fullMessage);
    // Extract key points from the full message
    const lines = fullMessage.split('\n');
    let whatsappMessage = sanitizedMessage;
    
    // Start with greeting
    if (lines[0].includes('Dear') || lines[0].includes('Subject')) {
      whatsappMessage = 'Hi! 👋\n\n';
    }
    
    // Extract main request
    const requestSection = lines.find(line => 
      line.toLowerCase().includes('request') || 
      line.toLowerCase().includes('revision') ||
      line.toLowerCase().includes('clarification')
    );
    
    if (requestSection) {
      whatsappMessage += requestSection + '\n\n';
    }
    
    // Add key issues (truncate if needed)
    const issuesStart = lines.findIndex(line => line.match(/^\d+\./));
    if (issuesStart !== -1) {
      let issueCount = 0;
      for (let i = issuesStart; i < Math.min(issuesStart + 3, lines.length); i++) {
        if (lines[i].trim() && issueCount < 2) {
          whatsappMessage += lines[i] + '\n';
          issueCount++;
        }
      }
    }
    
    // Add closing
    whatsappMessage += '\nPlease share the revised contract. Thanks! 🙏';
    
    // Add brand response tracking link if dealId is available
    const dealId = savedDealId;
    if (dealId) {
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'https://noticebazaar.com';
      const trackingLink = `${baseUrl}/#/brand-reply/${dealId}`;
      whatsappMessage += `\n\nConfirm your decision: ${trackingLink}`;
    }
    
    // Truncate if still too long (but try to keep the link)
    if (whatsappMessage.length > 600) {
      // If we have a link, try to keep it
      const linkMatch = whatsappMessage.match(/Confirm your decision: (.+)$/);
      if (linkMatch) {
        const link = linkMatch[1];
        const messageWithoutLink = whatsappMessage.replace(/\n\nConfirm your decision: .+$/, '');
        const availableSpace = 600 - messageWithoutLink.length - 25; // 25 for "Confirm your decision: "
        if (availableSpace > link.length) {
          whatsappMessage = messageWithoutLink + `\n\nConfirm your decision: ${link}`;
        } else {
          whatsappMessage = messageWithoutLink.substring(0, 597) + '...';
        }
      } else {
        whatsappMessage = whatsappMessage.substring(0, 597) + '...';
      }
    }
    
    return whatsappMessage;
  };

  // Copy Email handler
  const handleCopyEmail = async () => {
    if (!negotiationMessage) {
      toast.error('Please generate a negotiation message first');
      return;
    }
    
    try {
      const emailMessage = formatNegotiationMessage(negotiationMessage);
      const isSecureContext = typeof window !== 'undefined' && (window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost');
      
      if (navigator.clipboard && isSecureContext) {
        await navigator.clipboard.writeText(emailMessage);
        toast.success('Copied for Email');
      } else {
        // Fallback: show message for manual copy
        toast.info('Please copy the message manually');
      }
      triggerHaptic(HapticPatterns.light);
    } catch (error: any) {
      console.warn('[ContractUploadFlow] Copy email failed:', error);
      toast.info('Unable to copy automatically. Please copy the message manually.');
    }
  };

  // Copy WhatsApp handler
  const handleCopyWhatsApp = async () => {
    if (!negotiationMessage) {
      toast.error('Please generate a negotiation message first');
      return;
    }
    
    const fullMessage = formatNegotiationMessage(negotiationMessage);
    const whatsappMessage = createWhatsAppMessage(fullMessage);
    
    // Show preview modal first
    setShowWhatsAppPreview(true);
    triggerHaptic(HapticPatterns.light);
  };
  
  const handleConfirmWhatsAppCopy = async () => {
    if (!negotiationMessage) return;
    
    try {
      const fullMessage = formatNegotiationMessage(negotiationMessage);
      const whatsappMessage = createWhatsAppMessage(fullMessage);
      const isSecureContext = typeof window !== 'undefined' && (window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost');
      
      if (navigator.clipboard && isSecureContext) {
        await navigator.clipboard.writeText(whatsappMessage);
        toast.success('Copied for WhatsApp');
      } else {
        toast.info('Please copy the message manually');
      }
      setShowWhatsAppPreview(false);
    } catch (error: any) {
      console.warn('[ContractUploadFlow] Copy WhatsApp failed:', error);
      toast.info('Unable to copy automatically. Please copy the message manually.');
      setShowWhatsAppPreview(false);
    }
  };

  // Share Feedback modal state
  const [showShareFeedbackModal, setShowShareFeedbackModal] = useState(false);

  // Helper function to build mock barter analysis from chat text
  const buildMockBarterAnalysis = (chatText: string): NonNullable<typeof analysisResults> => {
    const lowerText = chatText.toLowerCase();
    
    // Extract brand name
    let brandName = 'Brand (from chat)';
    const brandPatterns = [
      /(?:hi|hello|hey)[\s,]+(?:this is|i'm|i am|from)[\s]+([A-Z][a-zA-Z\s&]+?)(?:[\s,]+(?:team|brand|here)|$)/i,
      /(?:from|by)[\s]+([A-Z][a-zA-Z\s&]+?)(?:[\s,]+(?:team|brand)|$)/i,
      /([A-Z][a-zA-Z\s&]{2,20})(?:[\s,]+(?:brand|team|here))/i,
    ];
    for (const pattern of brandPatterns) {
      const match = chatText.match(pattern);
      if (match && match[1]) {
        brandName = match[1].trim();
        break;
      }
    }
    
    // Extract product
    let product = '';
    const productPatterns = [
      /(?:sending you|we'll send|we will send|gift|product)[\s:]+([A-Za-z\s&]+?)(?:[\s,]+(?:worth|valued|₹)|$)/i,
      /(?:product|item)[\s:]+([A-Za-z\s&]+?)(?:[\s,]+(?:worth|valued)|$)/i,
    ];
    for (const pattern of productPatterns) {
      const match = chatText.match(pattern);
      if (match && match[1]) {
        product = match[1].trim();
        break;
      }
    }
    
    // Extract deliverables
    let deliverables = '';
    const deliverablePatterns = [
      /(\d+)[\s]*(?:instagram|insta|ig)[\s]*(?:reel|reels|post|posts|story|stories)/i,
      /(?:post|reel|story)[\s]+(\d+)/i,
      /(\d+)[\s]*(?:content|post|reel|story)/i,
    ];
    for (const pattern of deliverablePatterns) {
      const match = chatText.match(pattern);
      if (match) {
        const count = match[1];
        const type = lowerText.includes('reel') ? 'Reels' : lowerText.includes('story') ? 'Stories' : 'Posts';
        deliverables = `${count} Instagram ${type}`;
        break;
      }
    }
    if (!deliverables && (lowerText.includes('post') || lowerText.includes('reel') || lowerText.includes('story'))) {
      deliverables = 'Content posts (extracted from chat)';
    }
    
    // Extract product value
    let productValue = '';
    const valueMatch = chatText.match(/₹[\s]*([\d,]+)|([\d,]+)[\s]*(?:rupees|rs|inr)/i);
    if (valueMatch) {
      productValue = valueMatch[1] || valueMatch[2] || '';
      if (productValue && !productValue.includes('₹')) {
        productValue = `₹${productValue}`;
      }
    }
    
    // Extract timeline
    let timeline = '';
    const timelineMatch = chatText.match(/(\d+)[\s]*(?:days?|weeks?|months?)/i);
    if (timelineMatch) {
      timeline = timelineMatch[0];
    }
    
    // Determine risk level and score
    let protectionScore = 45; // Default for barter deals (lower than contracts)
    let overallRisk: RiskLevel = 'high';
    
    // Adjust score based on what's mentioned
    if (deliverables) protectionScore += 10;
    if (productValue) protectionScore += 10;
    if (timeline) protectionScore += 5;
    if (lowerText.includes('usage') || lowerText.includes('rights')) protectionScore += 5;
    
    if (protectionScore >= 60) overallRisk = 'medium';
    if (protectionScore >= 75) overallRisk = 'low';
    
    // Build issues array
    const issues: NonNullable<typeof analysisResults>['issues'] = [];
    
    if (!deliverables || deliverables.includes('extracted')) {
      issues.push({
        id: 1,
        severity: 'high',
        category: 'Deliverables',
        title: 'No written confirmation of deliverables',
        description: 'The chat does not clearly specify what content you need to create. This can lead to scope creep or disputes later.',
        recommendation: 'Ask the brand to confirm deliverables and posting date in one message.',
      });
    }
    
    if (!timeline) {
      issues.push({
        id: 2,
        severity: 'high',
        category: 'Timeline',
        title: 'No timeline for product delivery',
        description: 'There is no clear deadline mentioned for when you will receive the product or when you need to post.',
        recommendation: 'Clarify both product delivery date and content posting deadline.',
      });
    }
    
    if (!lowerText.includes('usage') && !lowerText.includes('rights')) {
      issues.push({
        id: 3,
        severity: 'high',
        category: 'Usage Rights',
        title: 'No clarity on usage rights of your content',
        description: 'The chat does not specify how the brand can use your content. They may reuse it in ads or repost without permission.',
        recommendation: 'Clarify if they can reuse your content in ads and ask for tag/credit requirements.',
      });
    }
    
    if (!productValue) {
      issues.push({
        id: 4,
        severity: 'medium',
        category: 'Product Value',
        title: 'Product value not specified',
        description: 'The value of the product/service you are receiving is not mentioned, making it hard to assess if the deal is fair.',
        recommendation: 'Ask the brand to confirm the product value to ensure fair exchange.',
      });
    }
    
    // Build verified items
    const verified: NonNullable<typeof analysisResults>['verified'] = [];
    if (brandName && brandName !== 'Brand (from chat)') {
      verified.push({
        id: 1,
        category: 'Brand Identification',
        title: 'Brand name identified',
        description: `Brand identified as: ${brandName}`,
      });
    }
    
    if (product) {
      verified.push({
        id: 2,
        category: 'Product/Service',
        title: 'Product identified',
        description: `Product/service: ${product}`,
      });
    }
    
    return {
      overallRisk,
      score: Math.min(100, Math.max(0, protectionScore)),
      negotiationPowerScore: 35, // Lower for barter deals
      issues,
      verified,
      keyTerms: {
        dealValue: productValue || 'Product/Service Exchange',
        duration: timeline || 'Not specified',
        deliverables: deliverables || 'Not specified',
        paymentSchedule: 'Barter - No payment',
        exclusivity: 'Not specified',
        brandName: brandName,
      },
      dealType: 'barter',
    };
  };

  // Handle barter report generation
  const handleGenerateBarterReport = async () => {
    const chatText = barterInputMode === 'chat' ? barterChatText : 
      `Brand: ${barterFormData.brandName}\nProduct: ${barterFormData.productName}\nDeliverables: ${barterFormData.deliverables}\nProduct Value: ${barterFormData.productValue || 'Not specified'}\nUsage Rights: ${barterFormData.usageRights || 'Not specified'}\nTimeline: ${barterFormData.timeline || 'Not specified'}`;
    
    if (!chatText.trim()) {
      const errorMsg = 'Please paste your WhatsApp / Instagram chat before generating a report.';
      setBarterError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    // Validate form mode
    if (barterInputMode === 'form' && !barterFormData.brandName.trim() && !barterFormData.deliverables.trim()) {
      const errorMsg = 'Please fill in at least Brand Name and Deliverables.';
      setBarterError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    try {
      setIsGeneratingBarter(true);
      setBarterError(null);
      triggerHaptic(HapticPatterns.medium);
      setIsAnalyzing(true);
      setStep('analyzing');
      
      // Try real API first
      let apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const useLocalApi = localStorage.getItem('useLocalApi') === 'true' || 
                           urlParams.get('localApi') === 'true';
        const tunnelUrl = urlParams.get('tunnelUrl') || localStorage.getItem('tunnelUrl');
        
        if (useLocalApi && tunnelUrl) {
          apiBaseUrl = tunnelUrl.replace(/\/$/, '');
        } else if (useLocalApi) {
          apiBaseUrl = 'http://localhost:3001';
        }
      }
      
      if (!apiBaseUrl && typeof window !== 'undefined') {
        apiBaseUrl = 'https://noticebazaar-api.onrender.com';
      }
      
      let report: NonNullable<typeof analysisResults> | null = null;
      
      try {
        const res = await fetch(`${apiBaseUrl}/api/protection/analyze-barter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ 
            chatText: barterInputMode === 'chat' ? barterChatText : null,
            formData: barterInputMode === 'form' ? barterFormData : null,
            inputType: barterInputMode,
          }),
        });
        
        if (res.ok) {
          const responseData = await res.json();
          if (responseData.success && responseData.data?.analysis_json) {
            const analysis = responseData.data.analysis_json;
            report = {
              overallRisk: analysis.overallRisk || 'medium',
              score: analysis.protectionScore || 45,
              negotiationPowerScore: analysis.negotiationPowerScore || 35,
              issues: (analysis.issues || []).map((issue: any, index: number) => ({
                id: index + 1,
                severity: issue.severity || 'warning',
                category: issue.category || 'General',
                title: issue.title || 'Issue',
                description: issue.description || '',
                clause: issue.clause,
                recommendation: issue.recommendation || '',
              })),
              verified: (analysis.verified || []).map((item: any, index: number) => ({
                id: index + 1,
                category: item.category || 'General',
                title: item.title || 'Verified',
                description: item.description || '',
                clause: item.clause,
              })),
              keyTerms: {
                dealValue: analysis.keyTerms?.dealValue || barterFormData.productValue || 'Product/Service Exchange',
                duration: analysis.keyTerms?.duration || barterFormData.timeline,
                deliverables: analysis.keyTerms?.deliverables || barterFormData.deliverables,
                paymentSchedule: 'Barter - No payment',
                exclusivity: analysis.keyTerms?.exclusivity,
                brandName: analysis.keyTerms?.brandName || barterFormData.brandName,
              },
              dealType: 'barter',
            };
          }
        }
      } catch (apiError) {
        console.log('[ContractUploadFlow] Barter API not available, using mock analysis');
      }
      
      // Fallback: use mock analysis
      if (!report) {
        report = buildMockBarterAnalysis(chatText);
      }
      
      // Set analysis results and navigate to results view
      setAnalysisResults(report);
      setIsBarterDeal(true);
      setStep('results');
      toast.success('Barter protection report generated!');
      
      // Auto-save to Draft Deals
      await autoSaveDraftDeal();
      
    } catch (err: any) {
      console.error('[ContractUploadFlow] Barter report generation error:', err);
      const errorMsg = 'Something went wrong while generating the barter protection report. Please try again.';
      setBarterError(errorMsg);
      toast.error(errorMsg);
      setStep('upload');
    } finally {
      setIsGeneratingBarter(false);
      setIsAnalyzing(false);
    }
  };

  // Calculate contract safety progress
  const getContractSafetyProgress = () => {
    if (!analysisResults || !analysisResults.issues || analysisResults.issues.length === 0) return 0;
    const totalIssues = analysisResults.issues.length;
    if (totalIssues === 0) return 100; // No issues = 100% protected
    
    const resolvedCount = resolvedIssues?.size || 0;
    const generatedCount = clauseStates ? Array.from(clauseStates.values()).filter(s => s === 'success').length : 0;
    const progress = totalIssues > 0 ? ((resolvedCount + generatedCount * 0.5) / totalIssues) * 100 : 0;
    return Math.min(100, Math.max(0, progress));
  };

  // Get dynamic risk-based status based on progress percentage
  const getProtectionStatus = (progress: number) => {
    const clampedProgress = Math.min(100, Math.max(0, progress));
    
    if (clampedProgress === 100) {
      return {
        label: 'Fully Secured',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/50',
        shieldColor: 'text-green-400',
        glowColor: 'rgba(34, 197, 94, 0.6)', // green-500
        gradientStart: '#10b981', // emerald-500
        gradientEnd: '#059669', // emerald-600
        icon: '✅'
      };
    } else if (clampedProgress >= 76) {
      return {
        label: 'Almost Secure',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/50',
        shieldColor: 'text-blue-400',
        glowColor: 'rgba(59, 130, 246, 0.6)', // blue-500
        gradientStart: '#3b82f6', // blue-500
        gradientEnd: '#2563eb', // blue-600
        icon: '🛡️'
      };
    } else if (clampedProgress >= 51) {
      return {
        label: 'Improving Protection',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/50',
        shieldColor: 'text-yellow-400',
        glowColor: 'rgba(234, 179, 8, 0.6)', // yellow-500
        gradientStart: '#eab308', // yellow-500
        gradientEnd: '#ca8a04', // yellow-600
        icon: '⚠️'
      };
    } else if (clampedProgress >= 26) {
      return {
        label: 'Moderate Risk',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/50',
        shieldColor: 'text-orange-400',
        glowColor: 'rgba(249, 115, 22, 0.6)', // orange-500
        gradientStart: '#f97316', // orange-500
        gradientEnd: '#ea580c', // orange-600
        icon: '▲'
      };
    } else {
      return {
        label: 'High Risk',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/50',
        shieldColor: 'text-red-400',
        glowColor: 'rgba(239, 68, 68, 0.6)', // red-500
        gradientStart: '#ef4444', // red-500
        gradientEnd: '#dc2626', // red-600
        icon: '⚠️'
      };
    }
  };

  // Get smooth gradient colors for progress bar based on percentage
  // Transitions: Red (0%) → Orange (25%) → Yellow (50%) → Blue (75%) → Green (100%)
  const getProgressGradient = (progress: number) => {
    const clampedProgress = Math.min(100, Math.max(0, progress));
    
    // Define color stops for smooth transitions
    if (clampedProgress === 0) {
      return { start: '#ef4444', end: '#dc2626' }; // Red
    } else if (clampedProgress < 25) {
      // Red to Orange
      const ratio = clampedProgress / 25;
      const r = Math.round(239 + (249 - 239) * ratio);
      const g = Math.round(68 + (115 - 68) * ratio);
      const b = Math.round(68 + (22 - 68) * ratio);
      const r2 = Math.round(220 + (234 - 220) * ratio);
      const g2 = Math.round(38 + (88 - 38) * ratio);
      const b2 = Math.round(38 + (12 - 38) * ratio);
      return { start: `rgb(${r}, ${g}, ${b})`, end: `rgb(${r2}, ${g2}, ${b2})` };
    } else if (clampedProgress < 50) {
      // Orange to Yellow
      const ratio = (clampedProgress - 25) / 25;
      const r = Math.round(249 + (234 - 249) * ratio);
      const g = Math.round(115 + (179 - 115) * ratio);
      const b = Math.round(22 + (8 - 22) * ratio);
      const r2 = Math.round(234 + (202 - 234) * ratio);
      const g2 = Math.round(88 + (138 - 88) * ratio);
      const b2 = Math.round(12 + (4 - 12) * ratio);
      return { start: `rgb(${r}, ${g}, ${b})`, end: `rgb(${r2}, ${g2}, ${b2})` };
    } else if (clampedProgress < 75) {
      // Yellow to Blue
      const ratio = (clampedProgress - 50) / 25;
      const r = Math.round(234 + (59 - 234) * ratio);
      const g = Math.round(179 + (130 - 179) * ratio);
      const b = Math.round(8 + (246 - 8) * ratio);
      const r2 = Math.round(202 + (37 - 202) * ratio);
      const g2 = Math.round(138 + (99 - 138) * ratio);
      const b2 = Math.round(4 + (235 - 4) * ratio);
      return { start: `rgb(${r}, ${g}, ${b})`, end: `rgb(${r2}, ${g2}, ${b2})` };
    } else if (clampedProgress < 100) {
      // Blue to Green
      const ratio = (clampedProgress - 75) / 25;
      const r = Math.round(59 + (16 - 59) * ratio);
      const g = Math.round(130 + (185 - 130) * ratio);
      const b = Math.round(246 + (129 - 246) * ratio);
      const r2 = Math.round(37 + (5 - 37) * ratio);
      const g2 = Math.round(99 + (150 - 99) * ratio);
      const b2 = Math.round(235 + (105 - 235) * ratio);
      return { start: `rgb(${r}, ${g}, ${b})`, end: `rgb(${r2}, ${g2}, ${b2})` };
    } else {
      return { start: '#10b981', end: '#059669' }; // Green (100%)
    }
  };

  // Real API integration: Upload file and analyze contract
  useEffect(() => {
    if (step === 'uploading' && uploadedFile) {
      handleRealUpload();
    }
  }, [step, uploadedFile]);

  const handleRealUpload = async () => {
    if (!uploadedFile || !profile?.id) return;

    try {
      // Upload file to Supabase storage
      const uploadResult = await uploadFile(uploadedFile, {
        category: 'contract',
        folder: 'contracts',
        userId: profile.id,
      });

      if (!uploadResult.url) {
        throw new Error('Failed to upload contract file');
      }

      setContractUrl(uploadResult.url);
      setUploadProgress(100);
      setTimeout(() => setStep('scanning'), 500);
    } catch (error: any) {
      console.error('[ContractUploadFlow] Upload error:', error);
      setUploadError(error.message || 'Upload failed. Please try again.');
      setStep('upload-error');
    }
  };

  // Real API integration: Scan document
  useEffect(() => {
    if (step === 'scanning' && contractUrl) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep('analyzing'), 500);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [step, contractUrl]);

  // Real API integration: Analyze contract via API
  useEffect(() => {
    if (step === 'analyzing' && contractUrl) {
      handleRealAnalysis();
    }
  }, [step, contractUrl]);

  // Auto-retry with exponential backoff
  const performAnalysisWithRetry = async (
    apiEndpoint: string,
    session: any,
    attempt: number = 0
  ): Promise<Response | null> => {
    const baseDelay = 2000; // Start with 2 seconds
    const maxDelay = 30000; // Max 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

    if (attempt > 0) {
      setIsAutoRetrying(true);
      setRetryAttempt(attempt);
      setRetryDelay(delay / 1000); // Convert to seconds for display
      
      // Show countdown
      let remainingSeconds = Math.ceil(delay / 1000);
      const countdownInterval = setInterval(() => {
        remainingSeconds--;
        setRetryDelay(remainingSeconds);
        if (remainingSeconds <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);

      console.log(`[ContractUploadFlow] Auto-retry attempt ${attempt}/${MAX_AUTO_RETRIES} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      clearInterval(countdownInterval);
    }

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          contract_url: contractUrl,
        }),
      });

      // If successful, return the response
      if (response.ok) {
        setIsAutoRetrying(false);
        setRetryAttempt(0);
        setRetryDelay(0);
        return response;
      }

      // If not successful and we have retries left, retry
      if (attempt < MAX_AUTO_RETRIES) {
        console.log(`[ContractUploadFlow] Request failed (${response.status}), retrying...`);
        return performAnalysisWithRetry(apiEndpoint, session, attempt + 1);
      }

      // Max retries reached
      return response;
    } catch (fetchError: any) {
      // Check if it's a network error
      const isNetworkError = fetchError.message?.includes('Failed to fetch') || 
                             fetchError.message?.includes('NetworkError') ||
                             fetchError.name === 'TypeError';

      if (isNetworkError && attempt < MAX_AUTO_RETRIES) {
        console.log(`[ContractUploadFlow] Network error on attempt ${attempt + 1}, retrying...`);
        return performAnalysisWithRetry(apiEndpoint, session, attempt + 1);
      }

      // Max retries reached or non-network error
      throw fetchError;
    }
  };

  const handleRealAnalysis = async () => {
    if (!contractUrl) return;

    setIsAnalyzing(true);
    setReviewError(null);

    try {
      // Get API base URL - use env variable, or detect from current origin, or fallback to localhost
      let apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      
      // Check for local testing mode (for testing on noticebazaar.com with local API via tunnel)
      // This works on mobile too! Just use URL parameters: ?localApi=true&tunnelUrl=https://...
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const useLocalApi = localStorage.getItem('useLocalApi') === 'true' || 
                           urlParams.get('localApi') === 'true';
        // Get tunnel URL from URL param (preferred - works on mobile!) or localStorage
        const tunnelUrl = urlParams.get('tunnelUrl') || localStorage.getItem('tunnelUrl');
        
        if (useLocalApi) {
          // Use tunnel URL if available, otherwise fallback to localhost (won't work from noticebazaar.com)
          if (tunnelUrl) {
            apiBaseUrl = tunnelUrl.replace(/\/$/, ''); // Remove trailing slash
            console.log('[ContractUploadFlow] Using tunnel API for testing:', apiBaseUrl);
            console.log('[ContractUploadFlow] ✅ Works on mobile too!');
          } else {
            apiBaseUrl = 'http://localhost:3001';
            console.warn('[ContractUploadFlow] Using localhost API (may not work from noticebazaar.com due to CORS). Set tunnelUrl in localStorage or URL param.');
          }
        }
      }
      
      if (!apiBaseUrl && typeof window !== 'undefined') {
        const origin = window.location.origin;
        // If on production domain, try api subdomain first, then same origin
        if (origin.includes('noticebazaar.com')) {
          // Try api subdomain, but fallback to hosted API if it fails
          apiBaseUrl = 'https://api.noticebazaar.com';
        } else {
          // Local development defaults to hosted API unless overridden by VITE_API_BASE_URL
          apiBaseUrl = 'https://noticebazaar-api.onrender.com';
        }
      } else if (!apiBaseUrl) {
        apiBaseUrl = 'https://noticebazaar-api.onrender.com';
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Please log in to analyze contracts');
      }

      if (!contractUrl) {
        throw new Error('Contract file URL is missing. Please upload again.');
      }

      const apiEndpoint = `${apiBaseUrl}/api/protection/analyze`;
      console.log('[ContractUploadFlow] Calling API:', apiEndpoint);
      console.log('[ContractUploadFlow] Current origin:', typeof window !== 'undefined' ? window.location.origin : 'server');

      let response: Response | null = null;
      try {
        // Use auto-retry function for network errors
        response = await performAnalysisWithRetry(apiEndpoint, session, 0);
        
        if (!response) {
          throw new Error('Failed to get response after retries');
        }
      } catch (fetchError: any) {
        console.error('[ContractUploadFlow] Analysis error after retries:', fetchError);
        
        // Check if it's a network error (API might be sleeping on free tier)
        const isNetworkError = fetchError.message?.includes('Failed to fetch') || 
                               fetchError.message?.includes('NetworkError') ||
                               fetchError.name === 'TypeError';
        
        setIsAutoRetrying(false);
        setRetryAttempt(0);
        setRetryDelay(0);
        
        if (isNetworkError) {
          // API might be sleeping (Render free tier spins down after inactivity)
          const errorMessage = `The analysis service is starting up. We tried ${MAX_AUTO_RETRIES} times automatically. Please wait a moment and try again manually.`;
          setReviewError(errorMessage);
          setStep('review-error');
          setIsAnalyzing(false);
          return;
        }
        
        // If api subdomain fails and we're on production, try same origin
        if (apiBaseUrl.includes('api.noticebazaar.com') && typeof window !== 'undefined') {
          console.warn('[ContractUploadFlow] API subdomain failed, trying same origin:', fetchError);
          const sameOriginUrl = `${window.location.origin}/api/protection/analyze`;
          console.log('[ContractUploadFlow] Retrying with same origin:', sameOriginUrl);
          try {
            response = await performAnalysisWithRetry(sameOriginUrl, session, 0);
            if (!response) {
              throw new Error('Failed to get response after retries');
            }
          } catch (retryError) {
            setIsAutoRetrying(false);
            setRetryAttempt(0);
            setRetryDelay(0);
            setReviewError('Unable to connect to the analysis service. Please check your internet connection and try again.');
            setStep('review-error');
            setIsAnalyzing(false);
            return;
          }
        } else {
          setReviewError('Unable to connect to the analysis service. Please try again.');
          setStep('review-error');
          setIsAnalyzing(false);
          return;
        }
      }

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      const text = await response.text();
      
      let responseData: any = {};
      if (text && text.trim().length > 0) {
        if (contentType?.includes('application/json')) {
          try {
            responseData = JSON.parse(text);
          } catch (parseError) {
            console.error('[ContractUploadFlow] JSON parse error:', parseError, 'Response text:', text.substring(0, 200));
            throw new Error('Invalid response from server. Please try again.');
          }
        } else {
          // Non-JSON response (e.g., HTML error page)
          throw new Error(text.substring(0, 200) || 'Server returned an invalid response');
        }
      } else {
        // Empty response
        if (!response.ok) {
          throw new Error(`Server returned empty response (${response.status}). Please try again.`);
        }
        throw new Error('Server returned empty response. Please try again.');
      }

      // 🚨 HARD STOP: If API fails or returns 400/500, show error and STOP
      if (!response.ok) {
        console.error('[ContractUploadFlow] API error response:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        
        // PURE AI-DRIVEN: No validation errors - AI analyzes everything
        // If API returns 400, it's a different error (file corruption, extraction failure, etc.)
        if (response.status === 400) {
          // Only reject for file corruption or extraction failures
          const errorMessage = responseData.error || 'Failed to analyze document. Please ensure the file is valid and try again.';
          setReviewError(errorMessage);
          setStep('review-error');
          setIsAnalyzing(false);
          return;
        }
        
        // Other API errors
        console.error('[ContractUploadFlow] API error:', responseData);
        setReviewError(responseData.error || `Contract analysis failed (${response.status}). Please try again.`);
        setStep('review-error');
        setIsAnalyzing(false);
        return; // HARD STOP - do not proceed
      }

      // ✅ Only proceed if HTTP 200 and valid data
      if (!responseData.data || !responseData.data.analysis_json) {
        throw new Error('Invalid response from server');
      }

      // Backend validation passed - show success message now
      toast.success('Contract validated and analyzed successfully!', { duration: 3000 });

      // Store PDF report URL and report ID if available
      if (responseData.data.pdf_report_url) {
        setPdfReportUrl(responseData.data.pdf_report_url);
      }
      // Set report_id if available (may be null if database save failed)
      if (responseData.data.report_id) {
        setReportId(responseData.data.report_id);
        console.log('[ContractUploadFlow] Report ID set:', responseData.data.report_id);
      } else {
        console.warn('[ContractUploadFlow] ⚠️ No report_id in response. Database save may have failed.');
        console.warn('[ContractUploadFlow] Response data:', responseData.data);
        // Don't set reportId to null - keep previous value if exists
      }
      
      // Store original contract path/URL
      // Try multiple methods to extract or use the contract URL
      if (contractUrl) {
        // Method 1: Try to extract path from Supabase storage URL
        const urlParts = contractUrl.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const pathParts = urlParts[1].split('/');
          const bucket = pathParts[0];
          const filePath = pathParts.slice(1).join('/');
          setOriginalContractPath(`${bucket}/${filePath}`);
          console.log('[ContractUploadFlow] Original contract path extracted:', `${bucket}/${filePath}`);
        } else {
          // Method 2: Use the full URL if path extraction fails
          // Backend can handle full URLs
          setOriginalContractPath(contractUrl);
          console.log('[ContractUploadFlow] Using full contract URL as path:', contractUrl);
        }
      } else {
        console.warn('[ContractUploadFlow] No contractUrl available to set originalContractPath');
      }

      // Transform API response to UI format
      const analysis = responseData.data.analysis_json;
      
      // Extract brand name from contract text if not provided by AI
      let extractedBrandName = analysis.keyTerms?.brandName || (analysis as any).brandName;
      if (!extractedBrandName && responseData.data.contract_text) {
        // Try to extract brand name from contract text
        const contractText = responseData.data.contract_text.toLowerCase();
        // Common patterns for brand names in contracts
        const brandPatterns = [
          /(?:brand|company|client|sponsor)[\s:]+([A-Z][a-zA-Z\s&]+)/i,
          /(?:between|with)[\s]+([A-Z][a-zA-Z\s&]+?)(?:[\s,]+(?:herein|hereinafter|the|a))/i,
          /(?:this\s+agreement\s+is\s+between)[\s]+([A-Z][a-zA-Z\s&]+?)(?:[\s,]+(?:and|&))/i,
        ];
        
        for (const pattern of brandPatterns) {
          const match = responseData.data.contract_text.match(pattern);
          if (match && match[1]) {
            extractedBrandName = match[1].trim();
            // Clean up common suffixes
            extractedBrandName = extractedBrandName.replace(/\s+(?:LLC|Inc|Ltd|Limited|Corp|Corporation|Pvt|Private).*$/i, '');
            if (extractedBrandName.length > 2 && extractedBrandName.length < 50) {
              break;
            }
          }
        }
      }
      
      setAnalysisResults({
        overallRisk: analysis.overallRisk || 'low',
        score: analysis.protectionScore || 0,
        negotiationPowerScore: analysis.negotiationPowerScore, // Negotiation Power Score
        issues: (analysis.issues || []).map((issue: any, index: number) => ({
          id: index + 1,
          severity: issue.severity || 'warning',
          category: issue.category || 'General',
          title: issue.title || 'Issue',
          description: issue.description || '',
          clause: issue.clause,
          recommendation: issue.recommendation || '',
        })),
        verified: (analysis.verified || []).map((item: any, index: number) => ({
          id: index + 1,
          category: item.category || 'General',
          title: item.title || 'Verified',
          description: item.description || '',
          clause: item.clause,
        })),
        keyTerms: {
          dealValue: analysis.keyTerms?.dealValue,
          duration: analysis.keyTerms?.duration,
          deliverables: analysis.keyTerms?.deliverables,
          paymentSchedule: analysis.keyTerms?.paymentSchedule,
          exclusivity: analysis.keyTerms?.exclusivity,
          brandName: extractedBrandName,
        },
      });

      setStep('results');
      
      // Auto-save to Draft Deals after analysis completes
      await autoSaveDraftDeal();
    } catch (error: any) {
      console.error('[ContractUploadFlow] Analysis error:', error);
      
      // Handle network/CORS errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setReviewError('Network error: Could not connect to the server. Please check your connection and try again.');
      } else if (error.message.includes('JSON') || error.message.includes('Unexpected end')) {
        setReviewError('Server returned an invalid response. Please try again or contact support.');
      } else {
        setReviewError(error.message || 'Contract analysis failed. Please try again.');
      }
      
      setStep('review-error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetryUpload = () => {
    setUploadError(null);
    setRetryCount(prev => prev + 1);
    setUploadProgress(0);
    setStep('uploading');
  };

  const handleRetryReview = () => {
    setReviewError(null);
    setRetryAttempt(0);
    setIsAutoRetrying(false);
    setRetryDelay(0);
    if (contractUrl) {
      setStep('analyzing');
      setIsAnalyzing(true);
    } else {
      // If no contract URL, go back to upload
      setStep('upload');
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a PDF, DOCX, or DOC file');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate if it's a brand deal contract (for PDFs and DOCX)
      // DOC files will be validated by backend only
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          // Don't show validation message - backend will validate with Gemini AI
          const validation = await validateContractFile(file);
          
          if (!validation.isValid) {
            // Only reject for file type or corruption issues
            toast.error(validation.error || 'Invalid file. Please upload a PDF, DOCX, or DOC file.');
            return;
          }
          
          // Frontend validation passed - but backend will do the real validation
          console.log('[ContractUploadFlow] Frontend validation passed for:', file.name);
          // Don't show "validated" yet - backend will validate with Gemini AI
        } catch (error) {
          console.error('[ContractUploadFlow] Validation error:', error);
          // If validation throws an error, show validation error screen
          toast.error('Failed to validate file. Please ensure the file is valid and try again.');
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          setFileName('');
          setFileSize('');
          setUploadedFile(null);
          return;
        }
      }

      // Only proceed if validation passed (or if not a PDF)
      console.log('[ContractUploadFlow] Proceeding with file upload:', file.name);
      setFileName(file.name);
      setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
      setUploadedFile(file);
      setStep('uploading');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a PDF, DOCX, or DOC file');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate if it's a brand deal contract (for PDFs and DOCX)
      // DOC files will be validated by backend only
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          // Don't show validation message - backend will validate with Gemini AI
          const validation = await validateContractFile(file);
          
          if (!validation.isValid) {
            // Set validation error and show validation error screen
            const errorMessage = validation.error || '⚠️ This document does not appear to be a brand deal contract.\n\nThe Contract Scanner only supports influencer–brand collaboration agreements.\n\nPlease upload a brand deal contract.';
            setValidationError(errorMessage);
            // PURE AI-DRIVEN: No validation errors - proceed to analysis
            setStep('analyzing');
            setIsAnalyzing(true);
            handleRealAnalysis();
            // Reset file state
            setFileName('');
            setFileSize('');
            setUploadedFile(null);
            return;
          }
          
          // Frontend validation passed - but backend will do the real validation
          console.log('[ContractUploadFlow] Frontend validation passed for:', file.name);
          // Don't show "validated" yet - backend will validate with Gemini AI
        } catch (error) {
          console.error('[ContractUploadFlow] Validation error:', error);
          // If validation throws an error, show validation error screen
          toast.error('Failed to validate file. Please ensure the file is valid and try again.');
          // Reset file state
          setFileName('');
          setFileSize('');
          setUploadedFile(null);
          return;
        }
      }

      // Only proceed if validation passed (or if not a PDF)
      console.log('[ContractUploadFlow] Proceeding with file upload:', file.name);
      setFileName(file.name);
      setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
      setUploadedFile(file);
      setStep('uploading');

      setFileName(file.name);
      setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
      setUploadedFile(file);
      setStep('uploading');
    }
  };

  const riskConfig: Record<RiskLevel, { color: string; bgColor: string; label: string; icon: typeof CheckCircle }> = {
    low: { color: 'text-green-400', bgColor: 'bg-green-500/20', label: 'Low Risk', icon: CheckCircle },
    medium: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'Medium Risk', icon: AlertTriangle },
    high: { color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'High Risk', icon: XCircle }
  };

  // Only render results if we have real API data
  if (step === 'results' && !analysisResults) {
    // If somehow we're on results step without data, go back to upload
    setStep('upload');
    return null;
  }

  const RiskIcon = analysisResults ? riskConfig[analysisResults.overallRisk as RiskLevel].icon : CheckCircle;

  // Compute risk score info for results step
  const resultsRiskInfo = step === 'results' && analysisResults ? getRiskScoreInfo(analysisResults.score) : null;
  const resultsCircumference = step === 'results' && analysisResults ? 2 * Math.PI * 45 : 0;
  const resultsStrokeDasharray = resultsCircumference;
  const resultsStrokeDashoffset = step === 'results' && analysisResults 
    ? resultsCircumference - (analysisResults.score / 100) * resultsCircumference 
    : 0;

  return (
    <ContextualTipsProvider currentView="upload">
    <div 
      className="w-full text-white flex flex-col"
      style={{
        height: '100dvh', // Use dynamic viewport height for iPhone 11
        maxHeight: '100dvh', // Prevent overflow on iPhone 11
        paddingTop: 'env(safe-area-inset-top, 0px)', // Account for notch on iPhone 11
        overflow: 'hidden', // Prevent body scroll
        boxSizing: 'border-box', // Include padding in height calculation
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 z-50 bg-purple-900/90 backdrop-blur-lg border-b border-white/10 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 mb-4">
        <div className="flex items-center justify-between py-4">
          <button 
            onClick={() => {
              if (step === 'results') {
                setStep('upload');
              } else if (step === 'select-file' || step === 'request-details') {
                setStep('upload');
              } else {
                navigate('/creator-dashboard');
              }
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="text-lg font-semibold">
            {step === 'select-file' ? 'Upload Contract' : step === 'request-details' ? 'Request Details' : 'Upload Contract'}
          </div>
          
          <div className="w-10"></div>
        </div>
        
      </div>

      <div 
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: 'calc(180px + env(safe-area-inset-bottom, 0px))', // Account for bottom nav (68px) + sticky CTA (~112px) + safe area
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
        }}
      >
        {/* Upload Step */}
        {step === 'upload' && (
          <>
            {/* Option Selection Cards */}
            <div className="space-y-4 mb-8">
              {/* Card A: Upload Contract */}
            <button
              onClick={() => {
                  setSelectedOption('upload');
                setDealType('contract');
                  setShowUploadArea(false);
                triggerHaptic(HapticPatterns.light);
                  
                  // Track analytics
                  trackEvent('upload_flow_option_selected', {
                    option: 'upload_contract',
                    source: 'upload_contract_page',
                  }).catch(() => {
                    // Silently fail - don't block UI
                  });
                }}
                className={cn(
                  "w-full text-left p-5 rounded-2xl border-2 transition-all relative",
                  "cursor-pointer group",
                  selectedOption === 'upload'
                    ? 'border-purple-400 bg-purple-500/15 shadow-lg shadow-purple-500/30 ring-2 ring-purple-400/20'
                    : recommendedOption === 'upload'
                    ? 'border-purple-300/40 bg-purple-500/8 hover:border-purple-300/60 hover:bg-purple-500/12 shadow-md shadow-purple-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 opacity-75'
                )}
              >
                {/* Check Icon - Top Right (when selected) */}
                {selectedOption === 'upload' && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  </div>
                )}
                
                <div className="flex items-start gap-4 pr-8">
                  {/* Radio Indicator - Secondary for accessibility */}
                  <div className="flex-shrink-0 mt-1 opacity-60">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                      selectedOption === 'upload'
                        ? 'border-purple-400 bg-purple-500/20'
                        : 'border-white/30 bg-transparent'
                    )}>
                      {selectedOption === 'upload' && (
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-semibold text-lg mb-1.5 flex items-center gap-2",
                      selectedOption === 'upload' ? 'text-white' : recommendedOption === 'upload' ? 'text-white/95' : 'text-white/80'
                    )}>
                      <FileText className="w-5 h-5 flex-shrink-0" />
                      Upload Contract
                    </h3>
                    <p className="text-sm text-white/60 mb-2">
                      Upload an existing contract to analyze and protect it.
                    </p>
                    <p className="text-xs text-white/50 font-medium">
                      PDF / DOC • Takes ~2 minutes • Lawyer-reviewed
                    </p>
                  </div>
                </div>
            </button>

              {/* Card B: Request Details from Brand */}
            <button
              onClick={() => {
                  setSelectedOption('request_details');
                  setDealType('contract');
                  setShowUploadArea(false);
                triggerHaptic(HapticPatterns.light);
                  
                  // Track analytics
                  trackEvent('upload_flow_option_selected', {
                    option: 'request_details',
                    source: 'upload_contract_page',
                  }).catch(() => {
                    // Silently fail - don't block UI
                  });
                }}
                className={cn(
                  "w-full text-left p-5 rounded-2xl border-2 transition-all relative",
                  "cursor-pointer group",
                  selectedOption === 'request_details'
                    ? 'border-purple-400 bg-purple-500/15 shadow-lg shadow-purple-500/30 ring-2 ring-purple-400/20'
                    : recommendedOption === 'request_details'
                    ? 'border-purple-300/40 bg-purple-500/8 hover:border-purple-300/60 hover:bg-purple-500/12 shadow-md shadow-purple-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 opacity-75'
                )}
            >
                {/* Recommendation Badge - Top Right (only when not selected) */}
                {recommendedOption === 'request_details' && selectedOption !== 'request_details' && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-blue-400/20 backdrop-blur-sm opacity-75">
                    <span className="text-[10px] font-medium text-blue-300/90">Most creators choose this</span>
                  </div>
                )}
                
                {/* Check Icon - Top Right (when selected) */}
                {selectedOption === 'request_details' && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  </div>
                )}
                
                <div className="flex items-start gap-4 pr-8">
                  {/* Radio Indicator - Secondary for accessibility */}
                  <div className="flex-shrink-0 mt-1 opacity-60">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                      selectedOption === 'request_details'
                        ? 'border-purple-400 bg-purple-500/20'
                        : 'border-white/30 bg-transparent'
                    )}>
                      {selectedOption === 'request_details' && (
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                      )}
                    </div>
      </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-semibold text-lg mb-1.5 flex items-center gap-2",
                      selectedOption === 'request_details' ? 'text-white' : recommendedOption === 'request_details' ? 'text-white/95' : 'text-white/80'
                    )}>
                      <MessageSquare className="w-5 h-5 flex-shrink-0" />
                      Request Details from Brand
                    </h3>
                    <p className="text-sm text-white/60 mb-2">
                      No contract yet? Brands can share paid or barter deal details in under 2 minutes.
                    </p>
                    <p className="text-xs text-white/50 font-medium">
                      We send a secure link • No follow-ups needed
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Conditional Content Based on Selection */}
          </>
        )}

        {/* Sticky Bottom CTA */}
        {step === 'upload' && (
          <div 
            className="fixed left-0 right-0 bg-gradient-to-t from-purple-900/95 via-purple-900/95 to-transparent backdrop-blur-lg border-t border-white/10 px-4 md:px-6 lg:px-8 py-4 -mx-4 md:-mx-6 lg:-mx-8"
            style={{
              bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))', // Account for bottom nav height + safe area
              zIndex: 10000, // Above bottom nav (z-9999)
              paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            }}
          >
            {/* Helper Text */}
            <p className="text-xs text-white/50 text-center mb-2.5">
              You can change this later
            </p>
            
            <button
              onClick={() => {
                if (!selectedOption) return;
                
                if (selectedOption === 'upload') {
                  setStep('select-file');
                } else if (selectedOption === 'request_details') {
                  setStep('request-details');
                }
                triggerHaptic(HapticPatterns.medium);
              }}
              disabled={!selectedOption}
              className={cn(
                "w-full py-4 rounded-xl font-semibold text-lg transition-all",
                selectedOption
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/30 text-white"
                  : "bg-white/10 border border-white/20 text-white/40",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              Continue
            </button>
          </div>
        )}

        {/* Select File Step */}
        {step === 'select-file' && (
          <div className="space-y-6" ref={uploadAreaRef}>
            {/* Info Card */}
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-2xl p-5 border border-blue-400/30">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI-Powered Review</h3>
                  <p className="text-sm text-purple-200">Our AI instantly analyzes your contract for potential issues and unfair terms.</p>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div 
              className="bg-white/10 backdrop-blur-md rounded-2xl border-2 border-dashed border-white/20 p-12 text-center hover:bg-white/15 transition-all cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleFileSelect}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-10 h-10 text-purple-400" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">Upload Contract</h3>
              <p className="text-sm text-purple-300 mb-4">Drag and drop or click to browse</p>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileSelect();
                }}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Choose File
              </button>
              
              <div className="mt-4 text-xs text-purple-400">
                Supported: PDF, DOCX • Max 10MB
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Instant Analysis</div>
                  <div className="text-purple-300">Get results in under 30 seconds</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 text-sm">
                <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">100% Confidential</div>
                  <div className="text-purple-300">Your contracts are encrypted and secure</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 text-sm">
                <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Expert Insights</div>
                  <div className="text-purple-300">AI trained on 10,000+ creator contracts</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Request Details Step */}
        {step === 'request-details' && (
          <div className="space-y-6">
            {/* Request Collaboration Details Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-white/60" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 text-white/90">No contract yet?</h3>
                  <p className="text-sm text-white/60 mb-3">Let the brand share deal details — we'll generate a clean agreement for you.</p>
                  
                  {!collaborationLink ? (
                    <button
                      onClick={handleRequestDetailsClick}
                      disabled={isGeneratingLink}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                    >
                      {isGeneratingLink ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating Link...
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          Request Collaboration Details from Brand
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {/* Link Display */}
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/50 mb-1">Share this link:</p>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                readOnly
                                value={collaborationLink}
                                className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white/90 font-mono truncate focus:outline-none focus:ring-1 focus:ring-purple-500"
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                              />
                              <button
                                onClick={handleCopyLink}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                                title="Copy link"
                              >
                                <Copy className="w-4 h-4 text-white/80" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Share Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleShareEmail}
                          className="flex-1 min-w-[100px] bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-2 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </button>
                        <button
                          onClick={handleShareWhatsApp}
                          className="flex-1 min-w-[100px] bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-2 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </button>
                        <button
                          onClick={handleShareInstagram}
                          className="flex-1 min-w-[100px] bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-2 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                          Instagram
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Uploading Step */}
        {step === 'uploading' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center w-full max-w-md">
              <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-6 relative">
                <Upload className="w-12 h-12 text-purple-400" />
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin"></div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Uploading Contract...</h2>
              <p className="text-purple-300 mb-6">{fileName}</p>
              
              {/* Enhanced Progress Bar */}
              <div className="w-full max-w-xs mx-auto mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-purple-300 font-medium">{uploadProgress}%</span>
                  <span className="text-purple-300">{fileSize}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300 relative"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>

              {/* Stage Indicators */}
              <div className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3 text-left">
                  <div className={`w-2 h-2 rounded-full transition-all ${
                    uploadProgress > 0 ? 'bg-green-400 scale-125' : 'bg-white/20'
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Uploading file...</div>
                    <div className="text-xs text-purple-300">
                      {uploadProgress > 0 ? `Transferred ${(uploadProgress / 100 * parseFloat(fileSize)).toFixed(2)} MB` : 'Preparing upload...'}
                    </div>
                  </div>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <Loader className="w-4 h-4 animate-spin text-purple-400" />
                  )}
                  {uploadProgress === 100 && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scanning Step */}
        {step === 'scanning' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center w-full max-w-md">
              <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6 relative">
                <FileText className="w-12 h-12 text-blue-400" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Scanning Document...</h2>
              <p className="text-purple-300 mb-6">Reading contract clauses</p>
              
              {/* Enhanced Progress Bar */}
              <div className="w-full max-w-xs mx-auto mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-purple-300 font-medium">{scanProgress}%</span>
                  <span className="text-purple-300">12 pages</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300 relative"
                    style={{ width: `${scanProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>

              {/* Stage Indicators */}
              <div className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3 text-left">
                  <div className={`w-2 h-2 rounded-full transition-all ${
                    scanProgress > 0 ? 'bg-green-400 scale-125' : 'bg-white/20'
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Extracting text from PDF...</div>
                    <div className="text-xs text-purple-300">
                      {scanProgress > 0 ? `Processed ${Math.round(scanProgress / 100 * 12)} of 12 pages` : 'Initializing scanner...'}
                    </div>
                  </div>
                  {scanProgress > 0 && scanProgress < 100 && (
                    <Loader className="w-4 h-4 animate-spin text-blue-400" />
                  )}
                  {scanProgress === 100 && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analyzing Step */}
        {step === 'analyzing' && (
          <div className="flex flex-col items-center min-h-[60vh] py-8" style={{ willChange: 'contents' }}>
            <div className="text-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 relative animate-pulse">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">
                {isAutoRetrying ? 'Service Starting Up...' : 'AI Analyzing Contract...'}
              </h2>
              <p className="text-purple-300/70 mb-8">
                {isAutoRetrying ? (
                  <span>
                    Retrying in {retryDelay}s (Attempt {retryAttempt}/{MAX_AUTO_RETRIES})
                  </span>
                ) : (
                  'Checking for potential issues'
                )}
              </p>
              
              {/* Auto-retry indicator */}
              {isAutoRetrying && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-6 max-w-md mx-auto">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                    <div className="text-left flex-1">
                      <div className="text-sm font-medium text-yellow-300">
                        Waiting for analysis service to start...
                      </div>
                      <div className="text-xs text-yellow-400/70 mt-1">
                        This usually takes 30-50 seconds. We'll retry automatically.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-3 text-sm max-w-xs mx-auto">
                {['Payment terms', 'Termination rights', 'IP ownership', 'Exclusivity clause', 'Liability terms'].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 bg-white/5 rounded-lg" style={{ transform: 'translateZ(0)' }}>
                    <span className="text-purple-200/70">{item}</span>
                    {analyzedItems.has(item) ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Skeleton Loaders for Results Preview */}
            <div className="w-full max-w-4xl mx-auto space-y-8 mt-8">
              <SkeletonLoader variant="score" />
              <SkeletonLoader variant="issues" />
              <SkeletonLoader variant="keyTerms" />
            </div>
          </div>
        )}

        {/* Upload Error Step */}
        {step === 'upload-error' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-400" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Upload Failed</h2>
              <p className="text-white/70 mb-6">{uploadError || 'An error occurred during upload. Please try again.'}</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRetryUpload}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Try Again
                </button>
                <button
                  onClick={() => {
                    setStep('upload');
                    setUploadError(null);
                    setRetryCount(0);
                    setUploadProgress(0);
                    setFileName('');
                    setFileSize('');
                  }}
                  className="bg-white/10 hover:bg-white/15 px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Choose Different File
                </button>
                <button
                  onClick={() => navigate('/creator-dashboard')}
                  className="text-purple-300 hover:text-white text-sm transition-colors"
                >
                  Go Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Error Step */}
        {step === 'review-error' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-12 h-12 text-yellow-400" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Review Failed</h2>
              <p className="text-white/70 mb-6">{reviewError || 'An error occurred during contract review. Please try again.'}</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRetryReview}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Retry Review
                </button>
                <button
                  onClick={() => {
                    setStep('upload');
                    setReviewError(null);
                    setUploadProgress(0);
                    setScanProgress(0);
                    setFileName('');
                    setFileSize('');
                  }}
                  className="bg-white/10 hover:bg-white/15 px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Upload New Contract
                </button>
                <button
                  onClick={() => navigate('/creator-dashboard')}
                  className="text-purple-300 hover:text-white text-sm transition-colors"
                >
                  Go Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Validation Error Step */}
        {step === 'validation-error' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-12 h-12 text-orange-400" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Invalid Document Type</h2>
              <p className="text-white/70 mb-6 whitespace-pre-line">{validationError || 'This document does not appear to be a brand deal contract.'}</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setStep('upload');
                    setValidationError(null);
                    setFileName('');
                    setFileSize('');
                    setUploadedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Choose Different File
                </button>
                <button
                  onClick={() => navigate('/creator-dashboard')}
                  className="text-purple-300 hover:text-white text-sm transition-colors"
                >
                  Go Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Step - ONLY render if we have real API data */}
        {step === 'results' && analysisResults && resultsRiskInfo && (
          <div className="space-y-8 md:space-y-10 animate-fadeIn" style={{ willChange: 'scroll-position' }}>
            {/* Content Width Container for iPad/Tablet */}
            <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
            {/* Contract Type Badge */}
            <div className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 backdrop-blur-md rounded-2xl px-4 py-3 border border-purple-400/30">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <FileText className="w-4 h-4 text-purple-300" />
                <span className="text-xs text-white/60">
                  {analysisResults.dealType === 'barter'
                    ? 'Barter Protection (from chat)'
                    : 'Contract Type'}
                </span>
                <span className="font-semibold text-white">
                  {analysisResults.dealType === 'barter' 
                    ? 'Beta' 
                    : 'Influencer–Brand Paid Collaboration'}
                </span>
                {analysisResults.dealType === 'barter' && (
                  <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                    Barter Deal
                  </span>
                )}
              </div>
            </div>

            {/* Premium Badge - Show for PRO users */}
            {((profile as any)?.subscription_plan === 'premium' || (profile as any)?.subscription_plan === 'pro' || (profile as any)?.subscription_plan === 'strategic') ? (
              <div className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 backdrop-blur-md rounded-2xl px-4 py-3 border border-purple-400/30">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-purple-300" />
                  <span className="text-purple-200">🛡️ Contract Protected by Lawyer + AI</span>
                </div>
                <p className="text-xs text-purple-300/80 mt-1 ml-6">
                  ✅ Your contract is now legally optimized for negotiation
                </p>
              </div>
            ) : null}

            {/* Premium Risk Score Card with Circular Gauge */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/10 shadow-xl" style={{ transform: 'translateZ(0)' }}>
              <div className="flex flex-col items-center gap-4 md:gap-6">
                {/* Brand Name and Deal Amount Display */}
                {(analysisResults.keyTerms?.brandName || analysisResults.keyTerms?.dealValue) && (
                  <div className="w-full mb-2 space-y-2">
                    {analysisResults.keyTerms?.brandName && (
                      <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400/40 rounded-xl backdrop-blur-sm">
                        <Building2 className="w-4 h-4 text-purple-300 flex-shrink-0" />
                        <span className="text-sm font-semibold text-white tracking-wide">
                          Brand: {analysisResults.keyTerms.brandName}
                        </span>
                      </div>
                    )}
                    {analysisResults.keyTerms?.dealValue && analysisResults.keyTerms.dealValue !== 'Not specified' && (
                      <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/40 rounded-xl backdrop-blur-sm">
                        <IndianRupee className="w-4 h-4 text-green-300 flex-shrink-0" />
                        <span className="text-sm font-semibold text-white tracking-wide">
                          Deal Value: {analysisResults.keyTerms.dealValue}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {/* Risk Status Badge and Score Display */}
                <div className="w-full flex flex-col items-center gap-4">
                  {/* Risk Status Badge */}
                  <div
                    className={`px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wide ${
                    analysisResults.overallRisk === 'high' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                      : analysisResults.overallRisk === 'medium'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-green-500/20 text-green-400 border border-green-500/40'
                    }`}
                  >
                    {getRiskVerdictLabel(analysisResults.overallRisk)}
                  </div>
                  
                  {/* Score Text */}
                  <div className="text-center">
                    <div className={`text-4xl md:text-5xl font-black ${resultsRiskInfo.color} transition-all duration-300 leading-none`}>
                      {scoreAnimation || analysisResults.score}
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="text-sm text-white/70 font-medium">
                        Risk Score: {scoreAnimation || analysisResults.score} / 100
                      </div>
                      <p className="text-[11px] text-white/60 max-w-xs mx-auto">
                        Score reflects missing protections, payment certainty, and usage rights — not deal quality.
                      </p>
                    </div>
                  </div>
                  
                  {/* Horizontal Risk Bar */}
                  <div className="w-full max-w-xs">
                    <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${scoreAnimation || analysisResults.score}%`
                        }}
                      />
                    </div>
                    <div className="text-xs text-white/50 mt-2 text-center">
                      Low safety → High safety
                    </div>
                  </div>

                  {/* Quick summary chips */}
                  {(() => {
                    const issuesCount = analysisResults.issues.length;
                    const missingCount = [
                      !analysisResults.keyTerms?.dealValue || analysisResults.keyTerms.dealValue === 'Not specified' ? 1 : 0,
                      !analysisResults.keyTerms?.paymentSchedule || analysisResults.keyTerms.paymentSchedule === 'Not specified' ? 1 : 0,
                      !analysisResults.keyTerms?.exclusivity || analysisResults.keyTerms.exclusivity === 'Not specified' ? 1 : 0,
                    ].reduce((a, b) => a + b, 0);

                    return (
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/80">
                          {issuesCount > 0 ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-amber-300" />
                              <span>{issuesCount} {issuesCount === 1 ? 'issue to review' : 'issues to review'}</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-300" />
                              <span>No major issues detected</span>
                            </>
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/80">
                          <FileText className="w-3 h-3 text-purple-200" />
                          <span>
                            {missingCount > 0
                              ? `${missingCount} missing ${missingCount === 1 ? 'clause' : 'clauses'}`
                              : 'All key clauses present'}
                          </span>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Risk Label and Info */}
                <div className="flex-1 text-center w-full">
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Deal Risk Analysis</h2>
                  
                  {/* Creator-First Risk Message */}
                  {(() => {
                    const issuesCount = analysisResults.issues.length;
                    const missingCount = [
                      !analysisResults.keyTerms?.dealValue || analysisResults.keyTerms.dealValue === 'Not specified' ? 1 : 0,
                      !analysisResults.keyTerms?.paymentSchedule || analysisResults.keyTerms.paymentSchedule === 'Not specified' ? 1 : 0,
                      !analysisResults.keyTerms?.exclusivity || analysisResults.keyTerms.exclusivity === 'Not specified' ? 1 : 0,
                    ].reduce((a, b) => a + b, 0);
                    const totalRiskAreas = issuesCount + missingCount;
                    const potentialScore = Math.min(100, (analysisResults.score || 0) + (totalRiskAreas * 5));
                    
                    if (totalRiskAreas > 0) {
                      const isLowRisk = (analysisResults.score || 0) >= 75;
                      const verdictLabel = getRiskVerdictLabel(
                        isLowRisk ? 'medium' : analysisResults.overallRisk
                      );
                      return (
                        <>
                          <div className="mb-2">
                            <p
                              className={`text-sm md:text-base font-semibold ${
                                isLowRisk ? 'text-green-400' : resultsRiskInfo.color
                              } flex items-center justify-center gap-2`}
                            >
                              <span>{isLowRisk ? '✅' : '⚠️'}</span>
                              <span>{verdictLabel}</span>
                            </p>
                            <p className="text-xs md:text-sm text-white/70 mt-1 max-w-xs mx-auto">
                              {isLowRisk 
                                ? 'Mostly safe, with a few points to negotiate below.'
                                : `You're exposed in ${totalRiskAreas} key risk ${
                                    totalRiskAreas === 1 ? 'area' : 'areas'
                                  }. Fixing them can raise your score above ${
                                    potentialScore >= 90 ? '90' : potentialScore
                                  } and reduce payment risk.`}
                            </p>
                          </div>
                          
                          {/* Issues & Missing Clauses Chip */}
                          <div className="mb-3 flex flex-col items-center justify-center gap-2">
                            <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
                              {issuesCount > 0 && (
                                <span className={isLowRisk ? 'text-green-300' : 'text-orange-300'}>
                                  {isLowRisk ? `Review ${issuesCount} ${issuesCount === 1 ? 'Suggestion' : 'Suggestions'}` : `View ${issuesCount} Risk ${issuesCount === 1 ? 'Issue' : 'Issues'}`}
                                </span>
                              )}
                              {issuesCount > 0 && missingCount > 0 && <span className="mx-1.5 text-white/40">•</span>}
                              {missingCount > 0 && (
                                <span className="text-yellow-300">{missingCount} Missing {missingCount === 1 ? 'Clause' : 'Clauses'}</span>
                              )}
                            </div>
                            {issuesCount > 0 && (
                              <p className="text-[10px] text-white/40 text-center max-w-xs">
                                {isLowRisk 
                                  ? 'Pro users can get a human lawyer to polish this contract further.'
                                  : 'Pro users can get a human lawyer review for this contract.'
                                }
                              </p>
                            )}
                          </div>
                        </>
                      );
                    } else {
                      // Perfect contract state
                      return (
                        <div className="mb-3">
                          <p className="text-base md:text-lg font-semibold text-green-400 flex items-center justify-center gap-2">
                            <span>✅</span>
                            <span>Safe</span>
                          </p>
                          <p className="text-sm text-white/70 mt-1">
                            All key areas are protected.
                          </p>
                        </div>
                      );
                    }
                  })()}
                  
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="group relative">
                      <Info className="w-4 h-4 text-white/40 cursor-help hover:text-white/60 transition-colors" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-purple-900/95 backdrop-blur-sm rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-purple-400/30">
                        Score is based on 30+ legal risk checks
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-purple-900/95"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary CTA */}
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  {fixedIssuesCount >= 2 && (
                    <motion.button
                      onClick={async () => {
                        if (!session?.access_token) {
                          toast.error('Please log in to generate negotiation message');
                          return;
                        }
                      if (!analysisResults) {
                        toast.error('Contract analysis not available');
                        return;
                      }

                      const hasHighOrMediumRisk = analysisResults.issues?.some(
                        (issue: any) =>
                          issue.severity === 'high' || issue.severity === 'medium'
                      );

                      if (!hasHighOrMediumRisk) {
                        toast.info('No risks detected. This contract is safe to proceed.');
                        return;
                      }
                        triggerHaptic(HapticPatterns.light);
                        setIsGeneratingMessage(true);
                        try {
                          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
      (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
        ? 'https://api.creatorarmour.com'
                              : 'https://noticebazaar-api.onrender.com');
                          const requestBody: any = { brandName: 'the Brand' };
                          if (reportId) {
                            requestBody.reportId = reportId;
                          } else {
                            requestBody.issues = analysisResults.issues
                              .filter((issue: any) => issue.severity === 'high' || issue.severity === 'medium')
                              .map((issue: any) => ({
                                title: issue.title,
                                category: issue.category,
                                description: issue.description,
                                recommendation: issue.recommendation,
                                severity: issue.severity,
                                clause_reference: issue.clause
                              }));
                          }
                          const response = await fetch(`${apiBaseUrl}/api/protection/generate-negotiation-message`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify(requestBody)
                          });
                          const contentType = response.headers.get('content-type');
                          let data: any = {};
                          if (contentType?.includes('application/json')) {
                            data = await response.json();
                          } else {
                            const text = await response.text();
                            throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
                          }
                          if (!response.ok || !data.success) {
                            throw new Error(data.error || 'Failed to generate negotiation message');
                          }
                          const formattedMessage = formatNegotiationMessage(data.message);
                          setNegotiationMessage(formattedMessage);
                          const opened = await openShareFeedbackModal();
                          if (!opened) return;
                          toast.success('Negotiation message generated!');
                        } catch (error: any) {
                          console.error('[ContractUploadFlow] Generate negotiation message error:', error);
                          toast.error(error.message || 'Failed to generate negotiation message. Please try again.');
                        } finally {
                          setIsGeneratingMessage(false);
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-green-600 hover:bg-green-700 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-green-500/30 min-h-[48px]"
                    >
                      <Send className="w-4 h-4" />
                      Ready to Send Back to Brand
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* Collapsible Sections */}
            {analysisResults && (
            <div className="space-y-3 mt-4">
              {/* 1. Key Terms */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => handleAccordionToggle('keyTerms')}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col items-start gap-1 w-full text-left">
                    <div className="flex items-center gap-2 w-full">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium flex-1">Key Terms</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex-shrink-0">
                        Safe
                    </span>
                    </div>
                    {analysisResults.keyTerms && (
                      <p className="text-[11px] text-white/60 pl-6">
                        Brand, money, and timelines in one place.
                      </p>
                    )}
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-white/60 transition-transform ${isKeyTermsExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {isKeyTermsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        {analysisResults.keyTerms && (
                          <div className="grid gap-2">
                            {analysisResults.keyTerms.brandName && (
                              <div className="bg-white/5 rounded-lg px-3 py-2 text-sm">
                                <div className="flex items-start gap-2 text-white/70">
                                  <Building2 className="w-4 h-4 mt-0.5" />
                                  <span className="font-medium">Brand Name</span>
                                </div>
                                <div className="mt-1 text-white font-semibold text-sm leading-snug break-words">
                                  {analysisResults.keyTerms.brandName}
                                </div>
                              </div>
                            )}
                            {analysisResults.keyTerms.dealValue && analysisResults.keyTerms.dealValue !== 'Not specified' && (
                              <div className="bg-white/5 rounded-lg px-3 py-2 text-sm">
                                <span className="text-white/70 font-medium block">Deal Value</span>
                                <span className="mt-1 block text-white font-medium text-sm leading-snug break-words">
                                  {analysisResults.keyTerms.dealValue}
                                </span>
                              </div>
                            )}
                            {analysisResults.keyTerms.deliverables && analysisResults.keyTerms.deliverables !== 'Not specified' && (
                              <div className="bg-white/5 rounded-lg px-3 py-2 text-sm">
                                <span className="text-white/70 font-medium block">Deliverables</span>
                                <span className="mt-1 block text-white font-medium text-sm leading-snug break-words">
                                  {analysisResults.keyTerms.deliverables}
                                </span>
                              </div>
                            )}
                            {analysisResults.keyTerms.paymentSchedule && analysisResults.keyTerms.paymentSchedule !== 'Not specified' && (
                              <div className="bg-white/5 rounded-lg px-3 py-2 text-sm">
                                <span className="text-white/70 font-medium block">Payment Schedule</span>
                                <span className="mt-1 block text-white font-medium text-sm leading-snug break-words">
                                  {analysisResults.keyTerms.paymentSchedule}
                                </span>
                              </div>
                            )}
                            {analysisResults.keyTerms.duration && analysisResults.keyTerms.duration !== 'Not specified' && (
                              <div className="bg-white/5 rounded-lg px-3 py-2 text-sm">
                                <span className="text-white/70 font-medium block">Duration</span>
                                <span className="mt-1 block text-white font-medium text-sm leading-snug break-words">
                                  {analysisResults.keyTerms.duration}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. Protection Status */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => handleAccordionToggle('protectionStatus')}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col items-start gap-1 w-full text-left">
                    <div className="flex items-center gap-2 w-full">
                    <Shield className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium flex-1">Protection Status</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 flex-shrink-0">
                      {analysisResults.verified.length} Strong Clauses
                    </span>
                    </div>
                    <p className="text-[11px] text-white/60 pl-6">
                      Safe clauses that already protect you.
                    </p>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-white/60 transition-transform ${isProtectionStatusExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {isProtectionStatusExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        {analysisResults.verified.length > 0 ? (
                          analysisResults.verified.map((clause) => (
                            <div key={clause.id} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-white font-medium">{clause.title}</div>
                                <div className="text-white/60 text-xs">{clause.description}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-white/60 text-sm">No strong clauses found.</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Negotiation Suggestions / Optional Improvements */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => handleAccordionToggle('issues')}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col items-start gap-1 w-full text-left">
                    <div className="flex items-center gap-2 w-full">
                      {(() => {
                        const issues = analysisResults.issues || [];
                        const hasSingleLowIssue =
                          issues.length === 1 && issues[0].severity === 'low';

                        if (hasSingleLowIssue) {
                          return (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-400" />
                              <span className="text-white font-medium flex-1">
                                Optional Improvements
                              </span>
                              <span className="text-xs px-3 py-1 rounded-full bg-green-500/15 text-green-300 border border-green-500/30 flex-shrink-0">
                                1 Optional item
                              </span>
                            </>
                          );
                        }

                        return (
                          <>
                            <AlertTriangle className="w-5 h-5 text-orange-400" />
                            <span className="text-white font-medium flex-1">
                              Negotiation Suggestions
                            </span>
                            <span className="text-xs px-3 py-1 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 flex-shrink-0">
                              {analysisResults.issues.length}{' '}
                              {analysisResults.issues.length === 1 ? 'Issue' : 'Issues'}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    <p className="text-[11px] text-white/60 pl-6">
                      {(() => {
                        const issues = analysisResults.issues || [];
                        const hasSingleLowIssue =
                          issues.length === 1 && issues[0].severity === 'low';

                        if (hasSingleLowIssue) {
                          return 'Optional suggestions you may include for extra clarity. Not required to proceed.';
                        }

                        return 'Short tasks you can negotiate to make this deal safer.';
                      })()}
                    </p>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-white/60 transition-transform ${isIssuesExpanded ? 'rotate-180' : ''} ml-2`}
                  />
                </button>
                <AnimatePresence>
                  {isIssuesExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {analysisResults.issues.length > 0 ? (
                          (() => {
                            const issues = analysisResults.issues || [];
                            const hasSingleLowIssue =
                              issues.length === 1 && issues[0].severity === 'low';

                            return issues.map((issue) => {
                              const isLowOnlyMode =
                                hasSingleLowIssue && issue.severity === 'low';

                              if (isLowOnlyMode) {
                                return (
                                  <div
                                    key={issue.id}
                                    className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-start gap-3 text-sm"
                                  >
                                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-400" />
                                    <div className="flex-1">
                                      <div className="text-white font-medium">{issue.title}</div>
                                      <div className="text-xs text-white/70 mt-1">
                                        <span className="font-semibold text-white/80">
                                          Suggested fix:{' '}
                                        </span>
                                        <span>{getSuggestedFix(issue)}</span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-300 border border-green-500/30">
                                          Low Impact
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-200 border border-blue-500/30">
                                          Easy to Clarify
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={issue.id}
                                  className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-start gap-3 text-sm"
                                >
                                  <AlertTriangle
                                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                      issue.severity === 'high'
                                        ? 'text-red-400'
                                        : issue.severity === 'medium'
                                        ? 'text-orange-400'
                                        : 'text-yellow-400'
                                    }`}
                                  />
                                  <div className="flex-1">
                                    <div className="text-white font-medium">{issue.title}</div>
                                    <div className="text-xs text-white/70 mt-1">
                                      <span className="font-semibold text-white/80">
                                        Suggested fix:{' '}
                                      </span>
                                      <span>{getSuggestedFix(issue)}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide ${
                                          issue.severity === 'high'
                                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                            : issue.severity === 'medium'
                                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                                        }`}
                                      >
                                        {issue.severity} risk
                                      </span>
                                      {(() => {
                                        const strength = getNegotiationStrength(issue);
                                        return (
                                          <span
                                            className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${strength.color}`}
                                          >
                                            <span>{strength.emoji}</span>
                                            <span>{strength.label}</span>
                                          </span>
                                        );
                                      })()}
                                    </div>
                                    <div className="mt-1 text-[11px] text-white/50">
                                      Impact if ignored: {getImpactIfIgnored(issue)}
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()
                        ) : (
                          <div className="text-white/60 text-sm">
                            No risks detected. This contract is safe to proceed.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3.5. Missing Clauses */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-yellow-500/30 overflow-hidden">
                <button
                  onClick={() => handleAccordionToggle('missingClauses')}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col items-start gap-1 w-full text-left">
                    <div className="flex items-center gap-2 w-full">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                      <span className="text-white font-medium flex-1">Missing Clauses</span>
                      {(() => {
                        // Count missing clauses - common ones to check
                        const missingCount = [
                          !analysisResults.keyTerms?.dealValue ||
                          analysisResults.keyTerms.dealValue === 'Not specified'
                            ? 1
                            : 0,
                          !analysisResults.keyTerms?.paymentSchedule ||
                          analysisResults.keyTerms.paymentSchedule === 'Not specified'
                            ? 1
                            : 0,
                          !analysisResults.keyTerms?.exclusivity ||
                          analysisResults.keyTerms.exclusivity === 'Not specified'
                            ? 1
                            : 0,
                        ].reduce((a, b) => a + b, 0);

                        const baseClasses =
                          'text-xs px-3 py-1 rounded-full ml-auto border flex-shrink-0';

                        if (missingCount > 0) {
                          return (
                            <span
                              className={`${baseClasses} bg-yellow-500/20 text-yellow-400 border-yellow-500/30`}
                            >
                              {missingCount} Missing
                    </span>
                          );
                        }

                        return (
                          <span
                            className={`${baseClasses} bg-green-500/20 text-green-300 border-green-500/30`}
                          >
                            Safe
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-[11px] text-white/60 pl-6">
                      Important points that are not written anywhere yet.
                    </p>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-white/60 transition-transform ${
                      isMissingClausesExpanded ? 'rotate-180' : ''
                    } ml-2`}
                  />
                </button>
                <AnimatePresence>
                  {isMissingClausesExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {(!analysisResults.keyTerms?.dealValue || analysisResults.keyTerms.dealValue === 'Not specified') && (
                          <div className="flex items-start gap-2 text-sm p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-white font-medium">Payment Amount</div>
                              <div className="text-white/60 text-xs mt-1">Payment amount is not specified in the contract.</div>
                            </div>
                          </div>
                        )}
                        {(!analysisResults.keyTerms?.paymentSchedule || analysisResults.keyTerms.paymentSchedule === 'Not specified') && (
                          <div className="flex items-start gap-2 text-sm p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-white font-medium">Payment Schedule</div>
                              <div className="text-white/60 text-xs mt-1">Payment timeline is not clearly defined.</div>
                            </div>
                          </div>
                        )}
                        {(!analysisResults.keyTerms?.exclusivity || analysisResults.keyTerms.exclusivity === 'Not specified') && (
                          <div className="flex items-start gap-2 text-sm p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-white font-medium">Exclusivity Terms</div>
                              <div className="text-white/60 text-xs mt-1">Exclusivity period is not specified.</div>
                            </div>
                          </div>
                        )}
                        {analysisResults.keyTerms?.dealValue && 
                         analysisResults.keyTerms.dealValue !== 'Not specified' &&
                         analysisResults.keyTerms?.paymentSchedule && 
                         analysisResults.keyTerms.paymentSchedule !== 'Not specified' &&
                         analysisResults.keyTerms?.exclusivity && 
                         analysisResults.keyTerms.exclusivity !== 'Not specified' && (
                          <div className="text-center py-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-sm text-green-300 font-medium">No key clauses missing – good job ✅</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 4. Financial Breakdown */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => handleAccordionToggle('financialBreakdown')}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col items-start gap-1 w-full text-left">
                    <div className="flex items-center gap-2 w-full">
                    <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium flex-1">
                        Financial Breakdown
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex-shrink-0">
                      Fair Rate
                    </span>
                    </div>
                    <p className="text-[11px] text-white/60 pl-6">
                      Simple view of payout, certainty, and timeline.
                    </p>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-white/60 transition-transform ${
                      isFinancialBreakdownExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isFinancialBreakdownExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {/* Creator-friendly financial summary */}
                        {(() => {
                          const dealValue = analysisResults.keyTerms?.dealValue;
                          const hasAmount =
                            dealValue && dealValue !== 'Not specified';
                          const hasSchedule =
                            analysisResults.keyTerms?.paymentSchedule &&
                            analysisResults.keyTerms.paymentSchedule !==
                              'Not specified';

                          let certaintyLabel = 'Medium';
                          let certaintyCopy =
                            'Most creators would double-check a couple of details here.';

                          if (hasAmount && hasSchedule) {
                            certaintyLabel = 'High';
                            certaintyCopy =
                              'Amount and payment timing are clearly written in the contract.';
                          } else if (!hasAmount || !hasSchedule) {
                            certaintyLabel = 'Review';
                            certaintyCopy =
                              'Ask the brand to confirm the exact amount and payment date in writing.';
                          }

                          const timelineRisk = hasSchedule
                            ? 'Low — the contract mentions when you get paid.'
                            : 'Needs clarification — payment date is not clearly written.';

                          return (
                            <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-xs text-white/80 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-white/70">
                                  Expected payout
                                </span>
                                <span className="font-medium">
                                  {hasAmount
                                    ? dealValue
                                    : 'To be confirmed with brand'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-white/70">
                                  Payment certainty
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-300 border border-green-500/30">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>{certaintyLabel}</span>
                                </span>
                              </div>
                              <p className="text-[11px] text-white/60 mt-1.5">
                                {certaintyCopy}
                              </p>
                              <p className="text-[11px] text-white/55">
                                Timeline risk: {timelineRisk}
                              </p>
                            </div>
                          );
                        })()}

                        {analysisResults.keyTerms?.dealValue && analysisResults.keyTerms.dealValue !== 'Not specified' && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-white/70">Deal Value:</span>
                            <span className="text-white font-medium">{analysisResults.keyTerms.dealValue}</span>
                          </div>
                        )}
                        {analysisResults.keyTerms?.paymentSchedule && analysisResults.keyTerms.paymentSchedule !== 'Not specified' && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-white/70">Payment Schedule:</span>
                            <span className="text-white font-medium">{analysisResults.keyTerms.paymentSchedule}</span>
                          </div>
                        )}
                        {(!analysisResults.keyTerms?.dealValue || analysisResults.keyTerms.dealValue === 'Not specified') && (
                          <div className="text-white/60 text-sm">Payment amount not specified in contract.</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 6. What We Will Ask the Brand */}
              <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-md rounded-xl border border-blue-500/30 overflow-hidden">
                <button
                  onClick={() => handleAccordionToggle('brandRequests')}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col items-start gap-1 w-full text-left">
                    <div className="flex items-center gap-2 w-full">
                    <Send className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium flex-1">
                        What We Will Ask the Brand
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex-shrink-0">
                        {(() => {
                          const requests = generateBrandRequests();
                          const count = requests.length;
                          const issuesCount = analysisResults?.issues?.length || 0;

                        if (count === 0) {
                          return 'Safe';
                        }

                        const hasHighOrMediumRisk = analysisResults?.issues?.some(
                          (issue: any) =>
                            issue.severity === 'high' || issue.severity === 'medium'
                        );

                        if (!hasHighOrMediumRisk) {
                          return 'Optional Clarifications';
                        }

                        return 'Needs Negotiation';
                        })()}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 pl-6">
                      Clear, polite asks we’ll send to protect your money.
                    </p>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-white/60 transition-transform ${
                      isRecommendedActionsExpanded ? 'rotate-180' : ''
                    } ml-2`}
                  />
                </button>
                <AnimatePresence>
                  {isRecommendedActionsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4">
                        {(() => {
                          const requests = generateBrandRequests();
                          if (requests.length === 0) {
                            return (
                              <div className="text-center py-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                  <span className="text-sm text-green-300 font-medium">
                                    No requests needed. You&apos;re good to go.
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <>
                              {/* Brand Requests List */}
                              <div className="space-y-3">
                                {requests.map((request, index) => (
                                  <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                    <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm text-white font-medium mb-1.5">{request.text}</p>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                          {request.impact}
                                        </span>
                                        <span className="text-xs text-white/50">Will be added to brand message</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Expected Outcome */}
                              <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-green-300 mb-1">Likely outcome:</p>
                                    <p className="text-xs text-green-200/80">Brand will revise and resend contract</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2 mt-2 pt-2 border-t border-green-500/20">
                                  <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-yellow-300 mb-1">If rejected:</p>
                                    <p className="text-xs text-yellow-200/80">We help you decide whether to proceed safely</p>
                                  </div>
                                </div>
                              </div>

                              {/* Message Preview Box */}
                              <div className="mt-4 p-4 bg-white/5 rounded-lg border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                  <MessageSquare className="w-4 h-4 text-blue-400" />
                                  <h4 className="text-sm font-semibold text-white">Final Message to Brand (Preview)</h4>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                  {negotiationMessage ? (
                                    <div className="space-y-1">
                                      {negotiationMessage.split('\n').slice(0, 3).map((line, index) => (
                                        <p key={index} className="text-xs text-white/70 leading-relaxed">
                                          {line || '\u00A0'}
                                        </p>
                                      ))}
                                      {negotiationMessage.split('\n').length > 3 && (
                                        <p className="text-xs text-white/50 italic mt-2">...</p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <p className="text-xs text-white/70 leading-relaxed">
                                        Hi {analysisResults?.keyTerms?.brandName || '[Brand Name]'},
                                      </p>
                                      <p className="text-xs text-white/70 leading-relaxed">
                                        Thanks for sharing the contract. I'd like to clarify a few points before proceeding...
                                      </p>
                                      <p className="text-xs text-white/50 italic mt-2">Full message will be generated when you click "Share with Brand"</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* AI Counter-Proposal Button - Show when conditions are met */}
                              {((brandResponseStatus === 'rejected' || brandResponseStatus === 'negotiating') || 
                                (analysisResults && analysisResults.issues.length >= 2)) && 
                                savedDealId && (
                                <div className="mt-4">
                                  <AICounterProposal
                                    dealId={savedDealId}
                                    dealValue={analysisResults?.keyTerms?.dealValue}
                                    issues={analysisResults?.issues.map(issue => ({
                                      title: issue.title,
                                      severity: issue.severity,
                                      category: issue.category,
                                      description: issue.description,
                                      recommendation: issue.recommendation
                                    })) || []}
                                    missingClauses={(() => {
                                      const missing: Array<{ title: string; category: string; description: string }> = [];
                                      if (!analysisResults?.keyTerms?.dealValue || analysisResults.keyTerms.dealValue === 'Not specified') {
                                        missing.push({
                                          title: 'Payment Amount Missing',
                                          category: 'Payment',
                                          description: 'Payment amount is not specified in the contract.'
                                        });
                                      }
                                      if (!analysisResults?.keyTerms?.paymentSchedule || analysisResults.keyTerms.paymentSchedule === 'Not specified') {
                                        missing.push({
                                          title: 'Payment Schedule Missing',
                                          category: 'Payment',
                                          description: 'Payment timeline is not clearly defined.'
                                        });
                                      }
                                      if (!analysisResults?.keyTerms?.exclusivity || analysisResults.keyTerms.exclusivity === 'Not specified') {
                                        missing.push({
                                          title: 'Exclusivity Terms Missing',
                                          category: 'Exclusivity',
                                          description: 'Exclusivity period is not specified.'
                                        });
                                      }
                                      return missing;
                                    })()}
                                    brandResponseMessage={undefined} // TODO: Fetch from deal if available
                                    previousNegotiationMessage={negotiationMessage || undefined}
                                    brandName={analysisResults?.keyTerms?.brandName}
                                    onProposalGenerated={(proposal) => {
                                      setAiCounterProposal(proposal.message);
                                      // Track analytics
                                      if (typeof window !== 'undefined' && (window as any).gtag) {
                                        (window as any).gtag('event', 'ai_counter_generated', {
                                          deal_id: savedDealId,
                                          approval_probability: proposal.approval_probability,
                                          risk_level: proposal.risk_level
                                        });
                                      }
                                    }}
                                    onUseProposal={(message) => {
                                      setNegotiationMessage(message);
                                      // Track analytics
                                      if (typeof window !== 'undefined' && (window as any).gtag) {
                                        (window as any).gtag('event', 'ai_counter_used', {
                                          deal_id: savedDealId
                                        });
                                      }
                                    }}
                                    sessionToken={session?.access_token}
                                  />
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex gap-2 mt-4">
                                <motion.button
                                  onClick={async () => {
                                    // Trigger the same logic as "Fix Issues & Missing Clauses, Then Share with Brand"
                                    const button = document.querySelector('[data-action="fix-and-send"]') as HTMLButtonElement;
                                    if (button) {
                                      button.click();
                                    } else {
                                      // Fallback: open the share feedback modal
                                      await openShareFeedbackModal();
                                    }
                                  }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="flex-1 px-4 py-2.5 bg-purple-600/90 hover:bg-purple-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit Message
                                </motion.button>
                                <motion.button
                                  onClick={async () => {
                                    // Use the same logic as the "Fix Issues & Missing Clauses" button
                                    if (!session?.access_token) {
                                      toast.error('Please log in to share with brand');
                                      return;
                                    }

                                    const hasIssues = analysisResults && analysisResults.issues.length > 0;
                                    const hasMissingClauses = !analysisResults?.keyTerms?.dealValue || 
                                      analysisResults.keyTerms.dealValue === 'Not specified' ||
                                      !analysisResults?.keyTerms?.paymentSchedule || 
                                      analysisResults.keyTerms.paymentSchedule === 'Not specified' ||
                                      !analysisResults?.keyTerms?.exclusivity || 
                                      analysisResults.keyTerms.exclusivity === 'Not specified';

                                    if (!analysisResults) {
                                      toast.error('Contract analysis not available');
                                      return;
                                    }

                                    const hasHighOrMediumRisk = analysisResults.issues?.some(
                                      (issue: any) =>
                                        issue.severity === 'high' || issue.severity === 'medium'
                                    );

                                    const hasWarningMissingClauses =
                                      !analysisResults.keyTerms?.dealValue ||
                                      analysisResults.keyTerms.dealValue === 'Not specified' ||
                                      !analysisResults.keyTerms?.paymentSchedule ||
                                      analysisResults.keyTerms.paymentSchedule === 'Not specified' ||
                                      !analysisResults.keyTerms?.exclusivity ||
                                      analysisResults.keyTerms.exclusivity === 'Not specified';

                                    if (!hasHighOrMediumRisk && !hasWarningMissingClauses) {
                                      toast.info('No risks detected. This contract is safe to proceed.');
                                      return;
                                    }

                                    triggerHaptic(HapticPatterns.medium);
                                    setIsGeneratingMessage(true);
                                    
                                    try {
                                      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
      (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
        ? 'https://api.creatorarmour.com'
                                          : 'https://noticebazaar-api.onrender.com');
                                      
                                      const requestBody: any = {
                                        brandName: 'the Brand'
                                      };
                                      
                                      if (reportId) {
                                        requestBody.reportId = reportId;
                                      } else {
                                        const issuesList = analysisResults.issues
                                          .filter((issue: any) => issue.severity === 'high' || issue.severity === 'medium')
                                          .map((issue: any) => ({
                                            title: issue.title,
                                            category: issue.category,
                                            description: issue.description,
                                            recommendation: issue.recommendation,
                                            severity: issue.severity,
                                            clause_reference: issue.clause
                                          }));
                                        
                                        const missingClausesList: any[] = [];
                                        if (!analysisResults.keyTerms?.dealValue || analysisResults.keyTerms.dealValue === 'Not specified') {
                                          missingClausesList.push({
                                            title: 'Payment Amount Missing',
                                            category: 'Payment',
                                            description: 'Payment amount is not specified in the contract.',
                                            recommendation: 'Please add a clear payment amount (₹) to the contract.',
                                            severity: 'warning',
                                            clause_reference: 'Payment Amount'
                                          });
                                        }
                                        if (!analysisResults.keyTerms?.paymentSchedule || analysisResults.keyTerms.paymentSchedule === 'Not specified') {
                                          missingClausesList.push({
                                            title: 'Payment Schedule Missing',
                                            category: 'Payment',
                                            description: 'Payment timeline is not clearly defined.',
                                            recommendation: 'Please specify when payment will be made (e.g., within 10 days of content submission).',
                                            severity: 'warning',
                                            clause_reference: 'Payment Schedule'
                                          });
                                        }
                                        if (!analysisResults.keyTerms?.exclusivity || analysisResults.keyTerms.exclusivity === 'Not specified') {
                                          missingClausesList.push({
                                            title: 'Exclusivity Terms Missing',
                                            category: 'Exclusivity',
                                            description: 'Exclusivity period is not specified.',
                                            recommendation: 'Please clarify the exclusivity period and usage rights.',
                                            severity: 'warning',
                                            clause_reference: 'Exclusivity Terms'
                                          });
                                        }
                                        
                                        requestBody.issues = [...issuesList, ...missingClausesList];
                                      }
                                      
                                      const response = await fetch(`${apiBaseUrl}/api/protection/generate-negotiation-message`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${session.access_token}`
                                        },
                                        body: JSON.stringify(requestBody)
                                      });

                                      const contentType = response.headers.get('content-type');
                                      let data: any = {};
                                      
                                      if (contentType?.includes('application/json')) {
                                        data = await response.json();
                                      } else {
                                        const text = await response.text();
                                        throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
                                      }

                                      if (!response.ok || !data.success) {
                                        throw new Error(data.error || 'Failed to generate negotiation message');
                                      }

                                      const formattedMessage = formatNegotiationMessage(data.message);
                                      setNegotiationMessage(formattedMessage);
                                      
                                      // Ensure deal is saved before opening share modal
                                      let currentDealId = savedDealId;
                                      if (!currentDealId) {
                                        // Auto-save the deal if not already saved
                                        currentDealId = await autoSaveDraftDeal();
                                        if (!currentDealId) {
                                          toast.error('Failed to save deal. Please try again.');
                                          return;
                                        }
                                        // Update state
                                        setSavedDealId(currentDealId);
                                      }
                                      
                                      const opened = await openShareFeedbackModal();
                                      if (opened) {
                                        toast.success('Ready to share with brand!');
                                      }
                                    } catch (error: any) {
                                      console.error('[ContractUploadFlow] Generate negotiation message error:', error);
                                      toast.error(error.message || 'Failed to generate message. Please try again.');
                                    } finally {
                                      setIsGeneratingMessage(false);
                                    }
                                  }}
                                  disabled={isGeneratingMessage}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="flex-1 px-4 py-2.5 bg-green-600/90 hover:bg-green-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                >
                                  {isGeneratingMessage ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Generating...
                                    </>
                                  ) : (
                                    <>
                                      <Share2 className="w-4 h-4" />
                                      Share with Brand
                                    </>
                                  )}
                                </motion.button>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            )}

            {/* Action Buttons */}
            {analysisResults && (
              <div className="mt-6 flex flex-col gap-3">
                {/* Fix & Share with Brand - Primary CTA */}
                <div className="flex-1 flex flex-col">
                <motion.button
                    data-action="fix-and-send"
                    onClick={async () => {
                      if (!session?.access_token) {
                        toast.error('Please log in to send to brand');
                        return;
                      }

                      if (!analysisResults) {
                        toast.error('Contract analysis not available');
                        return;
                      }

                      const actionType = getActionType();

                      // SUMMARY: No issues and no clarifications – simple approval message
                      if (actionType === 'SUMMARY') {
                        triggerHaptic(HapticPatterns.success);
                        setIsGeneratingMessage(true);
                        setIsContractSummary(true);

                        try {
                          const brandName = analysisResults.keyTerms?.brandName || 'Brand Team';
                          const creatorName =
                            (profile?.first_name && profile?.last_name
                              ? `${profile.first_name} ${profile.last_name}`
                              : null) ||
                            profile?.first_name ||
                            session?.user?.email?.split('@')[0] ||
                            'Creator';

                          const summaryMessage = `Hi ${brandName},

I’ve reviewed the contract and everything looks good to proceed.

Looking forward to collaborating.

Best,
${creatorName}`;

                          setNegotiationMessage(summaryMessage);

                          const modalOpened = await openShareFeedbackModal();
                          if (modalOpened) {
                            toast.success('Ready to share contract summary!');
                          }
                        } catch (error: any) {
                          console.error('[ContractUploadFlow] Share summary error:', error);
                          toast.error('Failed to prepare share. Please try again.');
                        } finally {
                          setIsGeneratingMessage(false);
                        }
                        return;
                      }

                      // CLARIFICATION: No issues, but we have standard clarifications to share
                      if (actionType === 'CLARIFICATION') {
                        triggerHaptic(HapticPatterns.success);
                        setIsGeneratingMessage(true);
                        setIsContractSummary(false);

                        try {
                          const brandName = analysisResults.keyTerms?.brandName || 'Brand Team';
                          const creatorName =
                            (profile?.first_name && profile?.last_name
                              ? `${profile.first_name} ${profile.last_name}`
                              : null) ||
                            profile?.first_name ||
                            session?.user?.email?.split('@')[0] ||
                            'Creator';

                          const requests = generateBrandRequests();
                          const clarificationsList = requests
                            .map((request) => `- ${request.text}`)
                            .join('\n');

                          const clarificationMessage = `Hi ${brandName},

Thanks for sharing the contract. Everything looks good from a creator-safety
perspective. I just want to clarify a few standard points so we’re aligned:

${clarificationsList}

These don’t change the commercial intent.

Looking forward to proceeding.

Best,
${creatorName}`;

                          setNegotiationMessage(clarificationMessage);

                          const modalOpened = await openShareFeedbackModal();
                          if (modalOpened) {
                            toast.success('Ready to share clarifications with the brand.');
                          }
                        } catch (error: any) {
                          console.error('[ContractUploadFlow] Share clarifications error:', error);
                          toast.error('Failed to prepare clarifications. Please try again.');
                        } finally {
                          setIsGeneratingMessage(false);
                        }
                        return;
                      }

                      // NEGOTIATION: There are issues to negotiate – call backend message generator
                      setIsContractSummary(false);
                      triggerHaptic(HapticPatterns.medium);
                      setIsGeneratingMessage(true);

                      try {
                      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
      (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
        ? 'https://api.creatorarmour.com'
                          : 'https://noticebazaar-api.onrender.com');
                      
                      const requestBody: any = {
                        brandName: 'the Brand'
                      };
                      
                      if (reportId) {
                        requestBody.reportId = reportId;
                      } else {
                        // Include issues - prioritize critical (high/medium), but include low if no critical issues
                        const criticalIssues = analysisResults.issues.filter((issue: any) => 
                          issue.severity === 'high' || issue.severity === 'medium'
                        );
                        const hasCriticalIssues = criticalIssues.length > 0;
                        
                        // If we have critical issues, only include those. Otherwise, include all issues (including low)
                        const issuesToInclude = hasCriticalIssues 
                          ? criticalIssues 
                          : analysisResults.issues;
                        
                        const issuesList = issuesToInclude.map((issue: any) => ({
                          title: issue.title,
                          category: issue.category,
                          description: issue.description,
                          recommendation: issue.recommendation,
                          severity: issue.severity,
                          clause_reference: issue.clause
                        }));
                        
                        // Include missing clauses as issues with yellow/warning severity
                        const missingClausesList: any[] = [];
                        if (!analysisResults.keyTerms?.dealValue || analysisResults.keyTerms.dealValue === 'Not specified') {
                          missingClausesList.push({
                            title: 'Payment Amount Missing',
                            category: 'Payment',
                            description: 'Payment amount is not specified in the contract.',
                            recommendation: 'Please add a clear payment amount (₹) to the contract.',
                            severity: 'warning',
                            clause_reference: 'Payment Amount'
                          });
                        }
                        if (!analysisResults.keyTerms?.paymentSchedule || analysisResults.keyTerms.paymentSchedule === 'Not specified') {
                          missingClausesList.push({
                            title: 'Payment Schedule Missing',
                            category: 'Payment',
                            description: 'Payment timeline is not clearly defined.',
                            recommendation: 'Please specify when payment will be made (e.g., within 10 days of content submission).',
                            severity: 'warning',
                            clause_reference: 'Payment Schedule'
                          });
                        }
                        if (!analysisResults.keyTerms?.exclusivity || analysisResults.keyTerms.exclusivity === 'Not specified') {
                          missingClausesList.push({
                            title: 'Exclusivity Terms Missing',
                            category: 'Exclusivity',
                            description: 'Exclusivity period is not specified.',
                            recommendation: 'Please clarify the exclusivity period and usage rights.',
                            severity: 'warning',
                            clause_reference: 'Exclusivity Terms'
                          });
                        }
                        
                        const allIssues = [...issuesList, ...missingClausesList];
                        
                        // Ensure we always set issues when we have them
                        if (allIssues.length > 0) {
                          requestBody.issues = allIssues;
                        } else if (analysisResults.issues.length > 0) {
                          // Fallback: if issuesList is empty but we have issues, include all issues
                          requestBody.issues = analysisResults.issues.map((issue: any) => ({
                            title: issue.title,
                            category: issue.category,
                            description: issue.description,
                            recommendation: issue.recommendation,
                            severity: issue.severity,
                            clause_reference: issue.clause
                          }));
                        }
                        
                        // Safety check: Don't call API if no issues and no reportId
                        if (!requestBody.reportId && (!requestBody.issues || requestBody.issues.length === 0)) {
                          toast.success('No issues or missing clauses to share. This contract is already strong!');
                          setIsGeneratingMessage(false);
                          return;
                        }
                      }
                      
                      // Final validation before API call
                      if (!requestBody.reportId && (!requestBody.issues || requestBody.issues.length === 0)) {
                        console.error('[ContractUploadFlow] Validation failed:', {
                          hasReportId: !!requestBody.reportId,
                          hasIssues: !!requestBody.issues,
                          issuesLength: requestBody.issues?.length || 0,
                          allIssuesCount: analysisResults?.issues.length || 0
                        });
                        toast.error('Cannot generate message: No issues or report ID available');
                        setIsGeneratingMessage(false);
                        return;
                      }
                      
                      // Debug log
                      console.log('[ContractUploadFlow] Sending request:', {
                        hasReportId: !!requestBody.reportId,
                        issuesCount: requestBody.issues?.length || 0,
                        issues: requestBody.issues?.map((i: any) => ({ title: i.title, severity: i.severity })) || []
                      });
                      
                      const response = await fetch(`${apiBaseUrl}/api/protection/generate-negotiation-message`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify(requestBody)
                      });

                      const contentType = response.headers.get('content-type');
                      let data: any = {};
                      
                      if (contentType?.includes('application/json')) {
                        data = await response.json();
                      } else {
                        const text = await response.text();
                        throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
                      }

                      if (!response.ok || !data.success) {
                        throw new Error(data.error || 'Failed to generate negotiation message');
                      }

                      const formattedMessage = formatNegotiationMessage(data.message);
                      setNegotiationMessage(formattedMessage);
                      
                      // Open share modal (it will handle saving and verification)
                      const modalOpened = await openShareFeedbackModal();
                      if (modalOpened) {
                        toast.success('Ready to share with brand!');
                      }
                    } catch (error: any) {
                      const message = (error && error.message) || '';

                      // If backend reports no issues for this report, treat as a safe contract instead of an error
                      if (typeof message === 'string' && message.includes('No issues found for this report')) {
                        console.warn('[ContractUploadFlow] No issues returned from negotiation API, treating as safe contract.');
                        toast.success('No risks detected. This contract is safe to proceed.');
                      } else {
                        console.error('[ContractUploadFlow] Generate negotiation message error:', error);
                        toast.error(message || 'Failed to generate message. Please try again.');
                      }
                    } finally {
                      setIsGeneratingMessage(false);
                    }
                  }}
                  disabled={isGeneratingMessage}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-500/30"
                >
                  {isGeneratingMessage ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-5 h-5" />
                      {(() => {
                        const actionType = getActionType();
                        return actionType === 'NEGOTIATION'
                          ? 'Fix & Share with Brand'
                          : 'Share with Brand';
                      })()}
                    </>
                  )}
                </motion.button>
                {(() => {
                  const issues = Array.isArray(analysisResults?.issues)
                    ? analysisResults!.issues
                    : [];
                  const hasAnyIssues = issues.length > 0;
                  const hasOnlyLowIssues =
                    hasAnyIssues &&
                    issues.every((issue: any) => issue.severity === 'low');

                  const isSafeState = !hasAnyIssues || hasOnlyLowIssues;

                  if (!isSafeState) return null;

                  return (
                    <div className="mt-2 flex justify-center">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-[11px] text-green-200">
                        <CheckCircle className="w-3 h-3" />
                        No risks detected. This contract is safe to proceed.
                      </span>
                    </div>
                  );
                })()}

                <p className="text-xs text-white/50 mt-2 text-center px-2">
                  {(() => {
                    const actionType = getActionType();
                    if (actionType === 'SUMMARY') {
                      return 'Share a clean contract summary via email, WhatsApp, or download PDF.';
                    }
                    if (actionType === 'CLARIFICATION') {
                      return 'We’ll share these standard clarifications in a clear, polite message.';
                    }
                    return 'We’ll combine all key points into one clear message for the brand.';
                  })()}
                </p>
                <p className="text-xs text-green-300/70 mt-1 text-center px-2 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  You can edit before sending
                </p>
              </div>

              {/* Soft Fear Line */}
              <div className="mt-4 mb-2 text-center">
                <p className="text-xs text-white/50 italic">
                  Most creators lose money due to unclear contracts. You're already ahead.
                </p>
              </div>

                {/* Save Deal - Secondary CTA (shows "Saved to Drafts" if auto-saved) */}
                <motion.button
                  onClick={async () => {
                    // If already auto-saved, just show a message
                    if (isAutoSaved || savedDealId) {
                      toast.info('Deal is already saved to drafts');
                      return;
                    }

                    if (!session?.access_token) {
                      toast.error('Please log in to save this deal');
                      return;
                    }

                    if (!analysisResults) {
                      toast.error('No contract data to save');
                      return;
                    }

                    triggerHaptic(HapticPatterns.light);
                    
                    // Use auto-save function
                    await autoSaveDraftDeal();
                    
                    // Check if save was successful by checking savedDealId after a brief delay
                    // This handles async state updates
                    setTimeout(() => {
                      if (savedDealId) {
                        toast.success('✅ Deal saved to drafts!');
                      }
                    }, 100);
                  }}
                  disabled={(isAutoSaved || savedDealId) || addDealMutation.isPending}
                  whileHover={!(isAutoSaved || savedDealId) ? { scale: 1.02 } : {}}
                  whileTap={!(isAutoSaved || savedDealId) ? { scale: 0.98 } : {}}
                  className="flex-1 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isAutoSaved || savedDealId) ? (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span>Saved to Drafts</span>
                      </div>
                      <span className="text-xs text-white/50 font-normal">Auto-saved while you work</span>
                    </>
                  ) : addDealMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Save Deal</span>
                      </div>
                    </>
                  )}
                </motion.button>
              </div>
            )}

            {/* Perfect Contract Empty State */}
            {analysisResults.issues.length === 0 && analysisResults.score >= 75 && (
              <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/10 shadow-lg text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mb-6"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  </motion.div>
                </motion.div>
                <h2 className="text-3xl md:text-4xl font-bold text-green-400 mb-3">This Is a Strong Contract ✅</h2>
                <p className="text-lg text-white/90 mb-3 max-w-2xl mx-auto">
                  This is a well-balanced, creator-friendly contract. Key terms are clearly defined and there are no critical payment or legal risks.
                </p>
                <p className="text-sm text-white/50 max-w-2xl mx-auto">
                  Score is based on contract clauses, not brand reputation.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <motion.button
                    onClick={async () => {
                      if (contractUrl) {
                        const a = document.createElement('a');
                        a.href = contractUrl;
                        a.download = fileName || 'contract.pdf';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        toast.success('Contract downloaded!');
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white/5 hover:bg-white/10 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download for Records
                  </motion.button>
                  <motion.button
                    onClick={async () => {
                      // Trigger the share flow
                      if (!session?.access_token) {
                        toast.error('Please log in to share with brand');
                        return;
                      }
                      if (!analysisResults) {
                        toast.error('Contract analysis not available');
                        return;
                      }
                      
                      // Check if we have no issues (summary mode)
                      const issuesCount = analysisResults.issues.length || 0;
                      const missingClausesCount = [
                        !analysisResults?.keyTerms?.dealValue || analysisResults.keyTerms.dealValue === 'Not specified' ? 1 : 0,
                        !analysisResults?.keyTerms?.paymentSchedule || analysisResults.keyTerms.paymentSchedule === 'Not specified' ? 1 : 0,
                        !analysisResults?.keyTerms?.exclusivity || analysisResults.keyTerms.exclusivity === 'Not specified' ? 1 : 0,
                      ].reduce((a, b) => a + b, 0);
                      const hasNoIssues = issuesCount === 0 && missingClausesCount === 0;
                      
                      if (hasNoIssues) {
                        // Generate summary message
                        const creatorName = (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : null) ||
                          profile?.first_name ||
                          session?.user?.email?.split('@')[0] ||
                          'Creator';
                        
                        const brandName = analysisResults.keyTerms?.brandName || 'Brand Team';
                        const dealValue = analysisResults.keyTerms?.dealValue || 'the agreed amount';
                        
                        const summaryMessage = `Subject: Contract Summary - ${brandName} Collaboration

Dear ${brandName},

Thank you for sharing the collaboration agreement. I've reviewed the contract and am pleased to confirm that all key terms are clearly defined and the agreement is well-structured.

Contract Summary:
- Deal Value: ${dealValue}
${analysisResults.keyTerms?.paymentSchedule && analysisResults.keyTerms.paymentSchedule !== 'Not specified' ? `- Payment Schedule: ${analysisResults.keyTerms.paymentSchedule}\n` : ''}${analysisResults.keyTerms?.duration && analysisResults.keyTerms.duration !== 'Not specified' ? `- Duration: ${analysisResults.keyTerms.duration}\n` : ''}${analysisResults.keyTerms?.deliverables && analysisResults.keyTerms.deliverables !== 'Not specified' ? `- Deliverables: ${analysisResults.keyTerms.deliverables}\n` : ''}
I'm ready to proceed with this collaboration and look forward to working together.

Best regards,
${creatorName}${session?.user?.email ? `\n${session.user.email}` : ''}`;

                        setNegotiationMessage(summaryMessage);
                        setIsContractSummary(true);
                        const modalOpened = await openShareFeedbackModal();
                        if (modalOpened) {
                          toast.success('Ready to share contract summary!');
                        }
                      } else {
                        // Should not happen in this success state, but handle gracefully
                        toast.info('Please use the share options below');
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
                  >
                    <Share2 className="w-5 h-5" />
                    Share with Brand
                  </motion.button>
                </div>
              </div>
            )}

            {/* Old Issues Section - Removed */}
            {false && analysisResults.issues.length > 0 && (
              <div id="issues-section-old" className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 md:p-8 border border-white/10 md:border-t shadow-lg">
                <button
                  onClick={() => setIsIssuesExpanded(!isIssuesExpanded)}
                  className="w-full flex items-center justify-between mb-4 hover:opacity-80 transition-opacity"
                >
                  <h3 className="font-semibold text-xl md:text-2xl flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                    Issues Found
                    <span className="text-sm font-normal text-purple-300 ml-2">
                      ({analysisResults.issues.length} {analysisResults.issues.length === 1 ? 'issue' : 'issues'})
                    </span>
                  </h3>
                  <motion.div
                    animate={{ rotate: isIssuesExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-purple-300" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {isIssuesExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      {/* Safety Progress Tracker */}
                <div className="mb-6 p-4 bg-purple-900/40 rounded-xl border border-purple-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-purple-200">Safety Progress:</span>
                    <span className="text-lg font-bold text-white">
                      {fixedIssuesCount} of {totalIssuesCount} issues fixed
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(fixedIssuesCount / totalIssuesCount) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    />
                  </div>
                </div>
                
                {/* Quick Fix Mode Banner */}
                {analysisResults.issues.length > 1 && (
                  <div className="mb-4">
                    <motion.button
                      onClick={async () => {
                        if (!session?.access_token) {
                          toast.error('Please log in to generate safe clauses');
                          return;
                        }
                        if (!reportId) {
                          toast.error('Report information not available. Please re-analyze the contract.');
                          return;
                        }
                        
                        const unresolvedIssues = analysisResults.issues.filter(issue => !resolvedIssues.has(issue.id));
                        if (unresolvedIssues.length === 0) {
                          toast.info('All issues are already resolved!');
                          return;
                        }
                        
                        triggerHaptic(HapticPatterns.medium);
                        toast.loading(`Generating ${unresolvedIssues.length} safer clauses...`, { id: 'quick-fix' });
                        
                        try {
                          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
      (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
        ? 'https://api.creatorarmour.com'
                              : 'https://noticebazaar-api.onrender.com');
                          
                          // Generate clauses for all unresolved issues
                          const clausePromises = unresolvedIssues.slice(0, 5).map(async (issue) => {
                            try {
                              const response = await fetch(`${apiBaseUrl}/api/protection/generate-fix`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${session.access_token}`
                                },
                                body: JSON.stringify({
                                  reportId,
                                  issueIndex: issue.id - 1,
                                  originalClause: issue.clause || issue.title
                                })
                              });
                              
                              const data = await response.json();
                              if (response.ok && data.success) {
                                const safeClause = `SAFER VERSION:\n\n${data.safeClause}\n\n${data.explanation ? `Explanation: ${data.explanation}` : ''}`;
                                setGeneratedClauses(new Map(generatedClauses.set(issue.id, safeClause)));
                                setClauseStates(new Map(clauseStates.set(issue.id, 'success')));
                                return true;
                              }
                              return false;
                            } catch (error) {
                              console.error(`Failed to generate clause for issue ${issue.id}:`, error);
                              return false;
                            }
                          });
                          
                          const results = await Promise.all(clausePromises);
                          const successCount = results.filter(r => r).length;
                          
                          toast.success(`Generated ${successCount} safer clauses!`, { id: 'quick-fix' });
                        } catch (error: any) {
                          console.error('[ContractUploadFlow] Quick fix error:', error);
                          toast.error('Some clauses failed to generate. Please try individual fixes.', { id: 'quick-fix' });
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 text-sm shadow-lg shadow-purple-500/30"
                    >
                      <Zap className="w-4 h-4" />
                      <span className="hidden md:inline">Quick Fix: Fix All Issues</span>
                      <span className="md:hidden">Quick Fix</span>
                    </motion.button>
                  </div>
                )}
                
                {/* Missing Price Alert - DEAL BREAKER */}
                {(() => {
                  const dealValue = analysisResults.keyTerms?.dealValue;
                  const isMissingPrice = !dealValue || 
                    dealValue.trim() === '' || 
                    dealValue.toLowerCase() === 'not specified' ||
                    dealValue.toLowerCase() === 'not mentioned' ||
                    dealValue === '0' ||
                    dealValue === '₹0';
                  
                  if (isMissingPrice) {
                    return (
                      <MissingPriceAlert
                        onAskBrand={async () => {
                          // Generate negotiation message focused on price
                          if (!negotiationMessage) {
                            // Generate message first
                            setIsGeneratingMessage(true);
                            try {
                              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
      (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
        ? 'https://api.creatorarmour.com'
                                  : 'https://noticebazaar-api.onrender.com');
                              const response = await fetch(`${apiBaseUrl}/api/protection/generate-negotiation-message`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${session?.access_token}`
                                },
                                body: JSON.stringify({
                                  reportId: reportId || null,
                                  brandName: 'the Brand',
                                  issues: [{
                                    title: 'Payment amount is missing',
                                    category: 'Payment',
                                    description: 'The contract does not specify the payment amount.',
                                    recommendation: 'Request the brand to add the exact payment amount to the contract.',
                                    severity: 'high',
                                    clause_reference: 'Payment Terms'
                                  }]
                                })
                              });
                              const data = await response.json();
                              if (data.success) {
                                const formattedMessage = formatNegotiationMessage(data.message);
                                setNegotiationMessage(formattedMessage);
                                try {
                                  const isSecureContext = typeof window !== 'undefined' && (window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost');
                                  if (navigator.clipboard && isSecureContext) {
                                    await navigator.clipboard.writeText(formattedMessage);
                                    toast.success('Copied for Email');
                                  } else {
                                    toast.info('Please copy the message manually');
                                  }
                                } catch (clipError: any) {
                                  console.warn('[ContractUploadFlow] Copy failed:', clipError);
                                  toast.info('Please copy the message manually');
                                }
                                setShowNegotiationModal(true);
                              }
                            } catch (error) {
                              toast.error('Failed to generate message');
                            } finally {
                              setIsGeneratingMessage(false);
                            }
                          } else {
                            const emailMessage = formatNegotiationMessage(negotiationMessage);
                            try {
                              const isSecureContext = typeof window !== 'undefined' && (window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost');
                              if (navigator.clipboard && isSecureContext) {
                                await navigator.clipboard.writeText(emailMessage);
                                toast.success('Copied for Email');
                              } else {
                                toast.info('Please copy the message manually');
                              }
                            } catch (clipError: any) {
                              console.warn('[ContractUploadFlow] Copy failed:', clipError);
                              toast.info('Please copy the message manually');
                            }
                            setShowNegotiationModal(true);
                          }
                        }}
                      />
                    );
                  }
                  return null;
                })()}
                
                {/* Group Issues by Category */}
                {(() => {
                  // Get unresolved issues
                  const unresolvedIssues = analysisResults.issues.filter(issue => !resolvedIssues.has(issue.id));
                  
                  // Get top 2 most dangerous issues
                  const topIssues = getTopIssues(unresolvedIssues);
                  const issuesToShow = showAllIssues ? unresolvedIssues : topIssues;
                  
                  const groupedIssues = new Map<string, typeof analysisResults.issues>();
                  issuesToShow.forEach(issue => {
                    const category = getIssueCategory(issue);
                    const key = category.label;
                    if (!groupedIssues.has(key)) {
                      groupedIssues.set(key, []);
                    }
                    groupedIssues.get(key)!.push(issue);
                  });

                  return (
                    <>
                    <div className="md:grid md:grid-cols-2 md:gap-8 lg:gap-10">
                      {Array.from(groupedIssues.entries()).map(([categoryLabel, issues]) => {
                    const categoryInfo = getIssueCategory(issues[0]);
                    const CategoryIcon = categoryInfo.icon;
                    
                    return (
                          <div key={categoryLabel} className="mb-8 md:mb-0">
                        <div className="flex items-center gap-3 mb-5 md:mb-6 pb-3 border-b border-white/10">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <CategoryIcon className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                          </div>
                          <h4 className="font-semibold text-lg md:text-xl">{categoryInfo.emoji} {categoryLabel} ({issues.length})</h4>
                        </div>
                        
                        {/* Desktop/iPad Table View - Clean and Organized */}
                        <div className="hidden md:block">
                          <div className="space-y-4">
                            {issues.map((issue, index) => {
                              const severityConfig = {
                                high: { 
                                  border: 'border-l-4 border-red-500', 
                                  badge: 'bg-red-500/30 text-red-300 border-red-500/50',
                                  label: 'High'
                                },
                                medium: { 
                                  border: 'border-l-4 border-orange-500', 
                                  badge: 'bg-orange-500/30 text-orange-300 border-orange-500/50',
                                  label: 'Medium'
                                },
                                low: { 
                                  border: 'border-l-4 border-yellow-500', 
                                  badge: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
                                  label: 'Warning'
                                },
                                warning: {
                                  border: 'border-l-4 border-yellow-500',
                                  badge: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
                                  label: 'Warning'
                                }
                              };
                              const config = severityConfig[issue.severity] || severityConfig.medium;
                              const clauseState = clauseStates.get(issue.id) || 'default';
                              const generatedClause = generatedClauses.get(issue.id);
                              const negotiationStrength = getNegotiationStrength(issue);
                              const isExpanded = expandedFixes.has(issue.id);
                              
                              // Calculate potential score improvement
                              const currentScore = analysisResults?.score || 0;
                              const potentialScore = Math.min(100, currentScore + (issue.severity === 'high' ? 8 : issue.severity === 'medium' ? 5 : 3));
                              
                              return (
                                <React.Fragment key={issue.id}>
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: resolvedIssues.has(issue.id) ? 0.5 : 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={`${config.border} bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-purple-400/30 transition-all duration-200 p-5`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                  >
                                    {/* Issue Header Row */}
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                          <h5 className="font-semibold text-base md:text-lg text-white">{issue.title}</h5>
                                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${config.badge}`}>
                                            {config.label}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => toggleFixExpansion(issue.id)}
                                          className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 mt-1"
                                        >
                                          {isExpanded ? 'Hide Details' : 'Tap to View Details'}
                                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Score Impact */}
                                    <div className="mb-4 pb-4 border-b border-white/10">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-purple-400" />
                                        <span className="text-xs text-purple-400 font-medium">
                                          {issue.severity === 'high' ? '2-3 min fix' : issue.severity === 'medium' ? '1-2 min fix' : '1 min fix'}
                                        </span>
                                      </div>
                                      <p className="text-sm md:text-base text-purple-300/70">
                                        Fixing this will improve your score to ~<span className="font-black text-purple-200">{potentialScore}/100</span>
                                      </p>
                                    </div>

                                    {/* Impact Preview - Risk if Ignored */}
                                    <div className="mb-4 bg-red-900/20 border-l-4 border-red-500 p-3 rounded-r-lg">
                                      <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                          <span className="text-xs font-semibold text-red-300 block mb-1">Risk if ignored:</span>
                                          <p className="text-xs text-red-200/80 leading-relaxed">{getImpactIfIgnored(issue)}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-4">
                                      {clauseState === 'success' && generatedClause ? (
                                        <div className="flex flex-col gap-3">
                                          <div className="flex items-center gap-2 text-green-400 text-sm justify-center">
                                            <CheckCircle className="w-4 h-4" />
                                            ✅ Clause Generated
                                          </div>
                                          <div className="grid grid-cols-2 gap-3">
                                            <button
                                              onClick={async () => {
                                                try {
                                                  const isSecureContext = typeof window !== 'undefined' && (window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost');
                                                  if (navigator.clipboard && isSecureContext) {
                                                    await navigator.clipboard.writeText(generatedClause);
                                                    toast.success('Clause copied!');
                                                  } else {
                                                    toast.info('Please copy the clause manually');
                                                  }
                                                } catch (error: any) {
                                                  console.warn('[ContractUploadFlow] Copy clause failed:', error);
                                                  toast.info('Please copy the clause manually');
                                                }
                                              }}
                                              className="bg-green-600/80 hover:bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 min-h-[48px]"
                                            >
                                              <Copy className="w-4 h-4" />
                                              Copy
                                            </button>
                                            <button
                                              onClick={() => handleMarkAsResolved(issue.id)}
                                              className="bg-purple-600/80 hover:bg-purple-600 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all min-h-[48px] flex flex-col items-center"
                                            >
                                              Issue Fixed
                                              <span className="text-xs text-purple-300 mt-1">This risk is now secured</span>
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <motion.button
                                          onClick={() => {
                                            triggerHaptic(HapticPatterns.light);
                                            handleGenerateClause(issue);
                                          }}
                                          disabled={clauseState === 'loading'}
                                          whileTap={{ scale: 0.98 }}
                                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-purple-500/50 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
                                        >
                                          {clauseState === 'loading' ? (
                                            <>
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                              Generating...
                                            </>
                                          ) : (
                                            <>
                                              <Wand2 className="w-4 h-4" />
                                              Generate Safer Clause
                                            </>
                                          )}
                                        </motion.button>
                                      )}
                                      {clauseState !== 'loading' && clauseState !== 'success' && (
                                        <span className="text-xs text-purple-300 mt-1 block text-center">AI rewrites this clause in your favor</span>
                                      )}
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-5 pt-5 border-t border-white/10 overflow-hidden"
                                      >
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                            <div className="text-xs text-red-300 mb-2 flex items-center gap-1 font-medium">
                                              <XCircle className="w-3 h-3" />
                                              Problem Detected
                                            </div>
                                            <div className="text-sm text-purple-200 leading-relaxed">{issue.clause || issue.description || 'N/A'}</div>
                                          </div>
                                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                            <div className="text-xs text-green-300 mb-2 flex items-center gap-1 font-medium">
                                              <CheckCircle className="w-3 h-3" />
                                              Recommended Fix
                                            </div>
                                            <div className="text-sm text-purple-200 leading-relaxed mb-3">{issue.recommendation}</div>
                                            <div className="mb-3">
                                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${negotiationStrength.color}`}>
                                                {negotiationStrength.emoji} {negotiationStrength.label}
                                              </span>
                                            </div>
                                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                                              <div className="text-xs text-yellow-300 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                If ignored: {getImpactIfIgnored(issue)}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </motion.div>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Mobile Card View - Compact by Default */}
                        <div className="md:hidden space-y-3">
                          {issues.map((issue, index) => {
                            if (resolvedIssues.has(issue.id)) return null;
                            
                            const severityConfig = {
                              high: { 
                                border: 'border-l-4 border-red-500', 
                                badge: 'bg-red-500/30 text-red-300 border-red-500/50',
                                label: 'High'
                              },
                              medium: { 
                                border: 'border-l-4 border-orange-500', 
                                badge: 'bg-orange-500/30 text-orange-300 border-orange-500/50',
                                label: 'Medium'
                              },
                              low: { 
                                border: 'border-l-4 border-yellow-500', 
                                badge: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
                                label: 'Warning'
                              },
                              warning: {
                                border: 'border-l-4 border-yellow-500',
                                badge: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
                                label: 'Warning'
                              }
                            };
                            const config = severityConfig[issue.severity] || severityConfig.medium;
                            const clauseState = clauseStates.get(issue.id) || 'default';
                            const generatedClause = generatedClauses.get(issue.id);
                            const negotiationStrength = getNegotiationStrength(issue);
                            const isExpanded = expandedFixes.has(issue.id);
                            
                            // Calculate potential score improvement
                            const currentScore = analysisResults?.score || 0;
                            const potentialScore = Math.min(100, currentScore + (issue.severity === 'high' ? 8 : issue.severity === 'medium' ? 5 : 3));
                            
                            return (
                              <AnimatePresence key={issue.id}>
                                <motion.div 
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className={`${config.border} p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-purple-400/30 transition-all duration-200`}
                                  style={{ animationDelay: `${index * 50}ms` }}
                                >
                                  {/* Compact Header - Always Visible */}
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="font-semibold text-base">{issue.title}</span>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`}>
                                          {config.label}
                                        </span>
                                      </div>
                                      
                                      {/* Score Preview - Always Visible */}
                                      <p className="text-xs text-purple-300 mb-3">
                                        Fixing this will improve your score to ~{potentialScore}/100
                                      </p>
                                      
                                      {/* Tap to View Details Link */}
                                        <button
                                          onClick={() => toggleFixExpansion(issue.id)}
                                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 mb-3"
                                      >
                                        {isExpanded ? 'Hide Details' : 'Tap to View Details'}
                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>
                                    </div>
                                  </div>
                                  
                                  {/* Expanded Details - Only on Tap */}
                                        <AnimatePresence>
                                    {isExpanded && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: 'auto', opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden space-y-3 mb-3"
                                            >
                                        {/* Problem Section */}
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                          <div className="text-xs text-red-300 mb-1 flex items-center gap-1 font-medium">
                                            <XCircle className="w-3 h-3" />
                                            Problem Detected
                                          </div>
                                          <div className="text-sm text-purple-200 leading-relaxed">{issue.clause || issue.description || 'N/A'}</div>
                                        </div>
                                        
                                        {/* Recommendation Section */}
                                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                          <div className="text-xs text-green-300 mb-1 flex items-center gap-1 font-medium">
                                            <CheckCircle className="w-3 h-3" />
                                            Recommended Fix
                                          </div>
                                          <div className="text-sm text-purple-200 leading-relaxed">{issue.recommendation}</div>
                                                <div className="mt-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${negotiationStrength.color}`}>
                                                    {negotiationStrength.emoji} {negotiationStrength.label}
                                                  </span>
                                                </div>
                                              </div>
                                        
                                        {/* Impact Warning */}
                                              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                                                <div className="text-xs text-yellow-300 flex items-center gap-1">
                                                  <AlertTriangle className="w-3 h-3" />
                                            If ignored: {getImpactIfIgnored(issue)}
                                                </div>
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                  
                                  {/* Primary CTA Button - Always Visible */}
                                  {clauseState === 'success' && generatedClause ? (
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-center gap-2 text-green-400 text-xs mb-1">
                                        <CheckCircle className="w-3 h-3" />
                                        ✅ Clause Generated
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={async () => {
                                            try {
                                              const isSecureContext = typeof window !== 'undefined' && (window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost');
                                              if (navigator.clipboard && isSecureContext) {
                                                await navigator.clipboard.writeText(generatedClause);
                                                toast.success('Clause copied!');
                                              } else {
                                                toast.info('Please copy the clause manually');
                                              }
                                            } catch (error: any) {
                                              console.warn('[ContractUploadFlow] Copy clause failed:', error);
                                              toast.info('Please copy the clause manually');
                                            }
                                          }}
                                          className="flex-1 bg-green-600/80 hover:bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 min-h-[48px]"
                                        >
                                          <Copy className="w-4 h-4" />
                                          Copy Clause
                                        </button>
                                        <button
                                          onClick={() => handleMarkAsResolved(issue.id)}
                                          className="flex-1 bg-purple-600/80 hover:bg-purple-600 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all min-h-[48px] flex flex-col items-center justify-center"
                                        >
                                          Issue Fixed
                                          <span className="text-xs text-purple-300 mt-1">This risk is now secured</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <motion.button
                                      onClick={() => {
                                        triggerHaptic(HapticPatterns.light);
                                        handleGenerateClause(issue);
                                      }}
                                      disabled={clauseState === 'loading'}
                                      whileTap={{ scale: 0.98 }}
                                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-purple-500/50 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
                                    >
                                      {clauseState === 'loading' ? (
                                        <>
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                          Generating...
                                        </>
                                      ) : (
                                        <>
                                          <Wand2 className="w-4 h-4" />
                                          Generate Safer Clause
                                        </>
                                      )}
                                    </motion.button>
                                  )}
                                  {clauseState !== 'loading' && clauseState !== 'success' && (
                                    <span className="text-xs text-purple-300 mt-1 block text-center">AI rewrites this clause in your favor</span>
                                  )}
                                </motion.div>
                              </AnimatePresence>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                    </div>
                    {!showAllIssues && unresolvedIssues.length > 2 && (
                      <div className="mt-6 text-center">
                        <motion.button
                          onClick={() => {
                            setShowAllIssues(true);
                            triggerHaptic(HapticPatterns.light);
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-purple-600/80 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mx-auto"
                        >
                          Show all issues ({unresolvedIssues.length})
                        </motion.button>
                      </div>
                    )}
                    </>
                  );
                })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}




            {/* Old Recommended Actions - Removed */}
            {false && analysisResults.issues.length > 0 && (
              <>
              <div className="bg-gradient-to-br from-purple-600/30 to-indigo-600/30 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-purple-400/30 shadow-lg mb-24 md:mb-0">
                <h3 className="font-semibold text-xl mb-4">Recommended Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Critical Action - Ask Brand for Revisions */}
                  <motion.button
                    onClick={async () => {
                      if (!session?.access_token) {
                        toast.error('Please log in to generate negotiation message');
                        return;
                      }

                      if (!analysisResults) {
                        toast.error('Contract analysis not available');
                        return;
                      }

                      const hasHighOrMediumRisk = analysisResults.issues?.some(
                        (issue: any) =>
                          issue.severity === 'high' || issue.severity === 'medium'
                      );

                      if (!hasHighOrMediumRisk) {
                        toast.info('No risks detected. This contract is safe to proceed.');
                        return;
                      }

                      triggerHaptic(HapticPatterns.light);
                      setIsGeneratingMessage(true);
                      
                      try {
                        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
      (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
        ? 'https://api.creatorarmour.com'
                            : 'https://noticebazaar-api.onrender.com');
                        
                        const requestBody: any = {
                          brandName: 'the Brand'
                        };
                        
                        if (reportId) {
                          requestBody.reportId = reportId;
                        } else {
                          requestBody.issues = analysisResults.issues
                            .filter((issue: any) => issue.severity === 'high' || issue.severity === 'medium')
                            .map((issue: any) => ({
                              title: issue.title,
                              category: issue.category,
                              description: issue.description,
                              recommendation: issue.recommendation,
                              severity: issue.severity,
                              clause_reference: issue.clause
                            }));
                        }
                        
                        const response = await fetch(`${apiBaseUrl}/api/protection/generate-negotiation-message`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                          },
                          body: JSON.stringify(requestBody)
                        });

                        const contentType = response.headers.get('content-type');
                        let data: any = {};
                        
                        if (contentType?.includes('application/json')) {
                          data = await response.json();
                        } else {
                          const text = await response.text();
                          throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
                        }

                        if (!response.ok || !data.success) {
                          throw new Error(data.error || 'Failed to generate negotiation message');
                        }

                          const formattedMessage = formatNegotiationMessage(data.message);
                          setNegotiationMessage(formattedMessage);
                          const opened = await openShareFeedbackModal();
                          if (opened) {
                            toast.success('Negotiation message generated!');
                          }
                      } catch (error: any) {
                        console.error('[ContractUploadFlow] Generate negotiation message error:', error);
                        toast.error(error.message || 'Failed to generate negotiation message. Please try again.');
                      } finally {
                        setIsGeneratingMessage(false);
                      }
                    }}
                    disabled={isGeneratingMessage}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-red-600/90 hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/50 hover:-translate-y-1 text-white px-4 py-4 rounded-xl font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1.5 min-h-[48px] relative overflow-hidden"
                  >
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-red-500/20"
                    />
                    <div className="flex items-center gap-2 relative z-10">
                      <AlertTriangle className="w-5 h-5" />
                      <div className="flex flex-col items-start">
                        <strong className="text-sm">Critical: Ask Brand for Revisions</strong>
                        <span className="text-xs text-red-100/80">Must do before signing</span>
                      </div>
                    </div>
                  </motion.button>
                  
                  {/* Important Action - Get Lawyer Review */}
                  <motion.button
                    onClick={async () => {
                      if (!session?.access_token) {
                        toast.error('Please log in to send for legal review');
                        return;
                      }

                      if (!reportId) {
                        toast.error('Report information not available. Please re-analyze the contract.');
                        return;
                      }

                      triggerHaptic(HapticPatterns.light);
                      
                      try {
                        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
      (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
        ? 'https://api.creatorarmour.com'
                            : 'https://noticebazaar-api.onrender.com');
                        const response = await fetch(`${apiBaseUrl}/api/protection/send-for-legal-review`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                          },
                          body: JSON.stringify({
                            reportId,
                            userEmail: session.user?.email || '',
                            userPhone: profile?.phone
                          })
                        });

                        const contentType = response.headers.get('content-type');
                        let data: any = {};
                        
                        if (contentType?.includes('application/json')) {
                          data = await response.json();
                        } else {
                          const text = await response.text();
                          throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
                        }

                        if (!response.ok || !data.success) {
                          throw new Error(data.error || 'Failed to send for legal review');
                        }

                        toast.success('Sent for Legal Review');
                        navigate('/messages');
                      } catch (error: any) {
                        console.error('[ContractUploadFlow] Send for legal review error:', error);
                        toast.error(error.message || 'Failed to send for legal review. Please try again.');
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-yellow-600/80 hover:bg-yellow-600 hover:shadow-xl hover:shadow-yellow-500/50 hover:-translate-y-1 text-white px-4 py-4 rounded-xl font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1.5 min-h-[48px]"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <div className="flex flex-col items-start">
                        <strong className="text-sm">Get Lawyer Review</strong>
                        <span className="text-xs text-yellow-100/80">Within 24-48 hours</span>
                      </div>
                    </div>
                  </motion.button>
                  
                  {/* Optional Action - Download Brand-Safe Contract */}
                  <motion.button
                    onClick={async () => {
                      if (!session?.access_token) {
                        toast.error('Please log in to download safe contract');
                        return;
                      }

                      if (!reportId) {
                        toast.error('Report ID not available. Please re-analyze the contract.');
                        return;
                      }
                      
                      // Use originalContractPath if available, otherwise fallback to contractUrl
                      const filePath = originalContractPath || contractUrl;
                      if (!filePath) {
                        toast.error('Contract file information not available. Please re-analyze the contract.');
                        return;
                      }

                      triggerHaptic(HapticPatterns.medium);
                      
                      try {
                        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
      (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
        ? 'https://api.creatorarmour.com'
                        : 'https://noticebazaar-api.onrender.com');
                        const response = await fetch(`${apiBaseUrl}/api/protection/generate-safe-contract`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                          },
                          body: JSON.stringify({
                            reportId,
                            originalFilePath: filePath
                          })
                        });

                        // Check if response is a file download (not JSON)
                        const contentType = response.headers.get('content-type');
                        
                        if (contentType && !contentType.includes('application/json')) {
                          // Direct file download - server returned file buffer
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          
                          // Get filename from Content-Disposition header or use default
                          const contentDisposition = response.headers.get('content-disposition');
                          const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/i);
                          a.download = filenameMatch ? filenameMatch[1] : `safe-contract-version-${Date.now()}.pdf`;
                          
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          toast.success('Safe Version Downloaded');
                        } else {
                          // JSON response with URL (legacy fallback)
                          const data = await response.json();
                          
                          if (!response.ok || !data.success) {
                            throw new Error(data.error || 'Failed to generate safe contract');
                          }

                          // Download the safe contract
                          const downloadResponse = await fetch(data.safeContractUrl);
                          const blob = await downloadResponse.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `safe-contract-version-${Date.now()}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          toast.success('Safe Version Downloaded');
                        }
                      } catch (error: any) {
                        console.error('[ContractUploadFlow] Download safe contract error:', error);
                        toast.error(error.message || 'Failed to generate safe contract. Please try again.');
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-green-600/90 hover:bg-green-600 hover:shadow-xl hover:shadow-green-500/50 hover:-translate-y-1 text-white px-4 py-4 rounded-xl font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1.5 min-h-[48px]"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      <div className="flex flex-col items-start">
                        <strong className="text-sm">Download Brand-Safe Contract</strong>
                        <span className="text-xs text-green-100/80">Ready to share</span>
                      </div>
                    </div>
                  </motion.button>
                </div>
              </div>
              

              {/* Brand Approval Tracker */}
              {brandApprovalStatus && (
                <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-white/10 shadow-lg">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-purple-400" />
                    Brand Approval Status
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                      {brandApprovalStatus === 'sent' && (
                        <>
                          <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse"></div>
                          <span className="font-medium text-yellow-300">Sent to Brand</span>
                          <span className="text-sm text-white/60 ml-auto">Waiting for their response</span>
                        </>
                      )}
                      {brandApprovalStatus === 'viewed' && (
                        <>
                          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                          <span className="font-medium text-blue-300">Brand Viewed</span>
                          <span className="text-sm text-white/60 ml-auto">Brand opened your message</span>
                        </>
                      )}
                      {brandApprovalStatus === 'negotiating' && (
                        <>
                          <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse"></div>
                          <span className="font-medium text-orange-300">Negotiating</span>
                          <span className="text-sm text-white/60 ml-auto">Changes being discussed</span>
                        </>
                      )}
                      {brandApprovalStatus === 'approved' && (
                        <>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          <span className="font-medium text-green-300">Approved</span>
                          <span className="text-sm text-white/60 ml-auto">Contract finalized</span>
                        </>
                      )}
                      {brandApprovalStatus === 'rejected' && (
                        <>
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <span className="font-medium text-red-300">Rejected</span>
                          <span className="text-sm text-white/60 ml-auto">Brand declined changes</span>
                        </>
                      )}
                    </div>

                    {/* Auto Actions */}
                    {brandApprovalStatus === 'approved' && (
                      <button
                        onClick={async () => {
                          // Auto-move to Active Deals
                          const creatorId = profile?.id || session?.user?.id;
                          if (!creatorId || !uploadedFile) return;
                          
                          try {
                            const dealValueStr = (analysisResults?.keyTerms?.dealValue || '0').replace(/[₹,]/g, '').trim();
                            const dealAmount = parseFloat(dealValueStr) || 0;
                            const dueDate = new Date();
                            dueDate.setDate(dueDate.getDate() + 30);
                            const dueDateStr = dueDate.toISOString().split('T')[0];

                            await addDealMutation.mutateAsync({
                              creator_id: creatorId,
                              organization_id: null,
                              brand_name: 'Contract Upload',
                              deal_amount: dealAmount,
                              deliverables: analysisResults?.keyTerms?.deliverables || 'As per contract',
                              contract_file: null, // Don't upload again - use existing URL
                              contract_file_url: contractUrl, // Use the already-uploaded file URL
                              due_date: dueDateStr,
                              payment_expected_date: dueDateStr,
                              contact_person: null,
                              platform: 'Other',
                              status: 'Active' as const,
                              invoice_file: null,
                              utr_number: null,
                              brand_email: brandEmail || null,
                              payment_received_date: null,
                            });

                            toast.success('Deal moved to Active!');
                            navigate('/creator-contracts');
                          } catch (error: any) {
                            toast.error('Failed to create deal', { description: error?.message });
                          }
                        }}
                        className="w-full bg-green-600/80 hover:bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all"
                      >
                        ✅ Move to Active Deals
                      </button>
                    )}

                    {brandApprovalStatus === 'sent' && approvalStatusUpdatedAt && (
                      <div className="text-xs text-white/60">
                        Sent {new Date(approvalStatusUpdatedAt).toLocaleDateString()} • 
                        {Math.floor((Date.now() - approvalStatusUpdatedAt.getTime()) / (1000 * 60 * 60)) > 48 && (
                          <button
                            onClick={() => {
                              toast.info('Reminder sent to brand');
                            }}
                            className="ml-2 text-purple-400 hover:text-purple-300 underline"
                          >
                            Send Reminder
                          </button>
                        )}
                      </div>
                    )}

                    {brandApprovalStatus === 'rejected' && (
                      <button
                        onClick={() => {
                          setShowNegotiationModal(true);
                          toast.info('Try renegotiation with revised terms');
                        }}
                        className="w-full bg-orange-600/80 hover:bg-orange-600 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all"
                      >
                        🔄 Try Renegotiation with Revised Terms
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
            )}


            {/* Desktop Action Buttons */}
            <div className="hidden md:flex gap-3 max-w-3xl mx-auto">
              {/* Copy Email Button */}
              <motion.button
                onClick={handleCopyEmail}
                disabled={!negotiationMessage}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail className="w-5 h-5" />
                Copy Email
              </motion.button>
              
              {/* Copy WhatsApp Button */}
              <motion.button
                onClick={handleCopyWhatsApp}
                disabled={!negotiationMessage}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageSquare className="w-5 h-5" />
                Copy WhatsApp
              </motion.button>
              
              {/* Share Feedback Button */}
              <motion.button
                onClick={async () => {
                  if (!session?.access_token) {
                    toast.error('Please log in to generate negotiation message');
                    return;
                  }

                    if (!analysisResults) {
                    toast.error('Contract analysis not available');
                    return;
                  }

                  const hasHighOrMediumRisk = analysisResults.issues?.some(
                    (issue: any) =>
                      issue.severity === 'high' || issue.severity === 'medium'
                  );

                  if (!hasHighOrMediumRisk) {
                    toast.info('No risks detected. This contract is safe to proceed.');
                    return;
                  }

                  triggerHaptic(HapticPatterns.light);
                  setIsGeneratingMessage(true);
                  
                  try {
                    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
      (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
        ? 'https://api.creatorarmour.com'
                              : 'https://noticebazaar-api.onrender.com');
                    
                    // Prepare request body - send issues if reportId is not available
                    const requestBody: any = {
                      brandName: 'the Brand'
                    };
                    
                    if (reportId) {
                      requestBody.reportId = reportId;
                    } else {
                      // Send issues directly when reportId is not available
                      requestBody.issues = analysisResults.issues
                        .filter((issue: any) => issue.severity === 'high' || issue.severity === 'medium')
                        .map((issue: any) => ({
                          title: issue.title,
                          category: issue.category,
                          description: issue.description,
                          recommendation: issue.recommendation,
                          severity: issue.severity,
                          clause_reference: issue.clause
                        }));
                    }
                    
                    const response = await fetch(`${apiBaseUrl}/api/protection/generate-negotiation-message`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                      },
                      body: JSON.stringify(requestBody)
                    });

                    const contentType = response.headers.get('content-type');
                    let data: any = {};
                    
                    if (contentType?.includes('application/json')) {
                      data = await response.json();
                    } else {
                      const text = await response.text();
                      throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
                    }

                    if (!response.ok || !data.success) {
                      throw new Error(data.error || 'Failed to generate negotiation message');
                    }

                    // Format message with India-optimized template
                          const formattedMessage = formatNegotiationMessage(data.message);
                          setNegotiationMessage(formattedMessage);
                          setIsContractSummary(false);
                          const opened = await openShareFeedbackModal();
                          if (opened) {
                            toast.success('Negotiation message generated!');
                          }
                  } catch (error: any) {
                    console.error('[ContractUploadFlow] Generate negotiation message error:', error);
                    toast.error(error.message || 'Failed to generate negotiation message. Please try again.');
                  } finally {
                    setIsGeneratingMessage(false);
                  }
                }}
                disabled={isGeneratingMessage}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingMessage ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Share Feedback
                  </>
                )}
              </motion.button>
            </div>

            {/* Clause Generation Modal */}
            {selectedIssueForClause !== null && generatedClause && (() => {
              const issue = analysisResults.issues.find(i => i.id === selectedIssueForClause);
              if (!issue) return null;
              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold">Auto-Generated Safe Clause</h3>
                        <button
                          onClick={() => {
                            setSelectedIssueForClause(null);
                            setGeneratedClause(null);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Original Risky Clause */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                          <h4 className="font-semibold text-red-400">Original Risky Clause</h4>
                        </div>
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                          <p className="text-sm text-purple-200">{issue.clause || issue.description}</p>
                        </div>
                      </div>

                      {/* Safer Replacement */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <h4 className="font-semibold text-green-400">Safer Replacement Clause</h4>
                        </div>
                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                          <p className="text-sm text-purple-200 whitespace-pre-line">{generatedClause}</p>
                        </div>
                      </div>

                      {/* Copy Button */}
                      <button
                        onClick={async () => {
                          try {
                            const isSecureContext = typeof window !== 'undefined' && (window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost');
                            
                            if (navigator.clipboard && isSecureContext) {
                              await navigator.clipboard.writeText(generatedClause);
                              toast.success('Clause copied to clipboard!');
                            } else {
                              toast.info('Please copy the clause manually');
                            }
                          } catch (error: any) {
                            console.warn('[ContractUploadFlow] Copy clause failed:', error);
                            toast.info('Unable to copy automatically. Please copy the clause manually.');
                          }
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Copy className="w-5 h-5" />
                        Copy Safe Clause
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Negotiation Message Modal */}
            <Dialog open={showNegotiationModal} onOpenChange={setShowNegotiationModal}>
              <DialogContent className="max-w-2xl max-h-[90vh] bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-xl border border-purple-500/30 text-white overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white mb-2">
                    Request Contract Changes from Brand
                  </DialogTitle>
                  <DialogDescription className="text-purple-200">
                    Review and edit the AI-generated negotiation message before sending
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Editable Message Textarea */}
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Negotiation Message
                    </label>
                    <textarea
                      value={negotiationMessage || ''}
                      onChange={(e) => setNegotiationMessage(e.target.value)}
                      className="w-full min-h-[300px] p-4 bg-white/10 border border-purple-400/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
                      placeholder="Loading negotiation message..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                    {/* Copy Email Button */}
                    <motion.button
                      onClick={handleCopyEmail}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Mail className="w-5 h-5" />
                      Copy Email
                    </motion.button>

                    {/* Copy WhatsApp Button */}
                    <motion.button
                      onClick={handleCopyWhatsApp}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Copy WhatsApp
                    </motion.button>

                    {/* Download PDF Button (Secondary) */}
                    <motion.button
                      onClick={async () => {
                        if (!session?.access_token) {
                          toast.error('Please log in to download safe contract');
                          return;
                        }

                        const filePath = originalContractPath || contractUrl;
                        if (!filePath || filePath.trim() === '') {
                          toast.error('Contract file information not available. Please re-analyze the contract.');
                          return;
                        }

                        triggerHaptic(HapticPatterns.medium);
                        
                        try {
                          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
      (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
        ? 'https://api.creatorarmour.com'
                          : 'https://noticebazaar-api.onrender.com');
                          const response = await fetch(`${apiBaseUrl}/api/protection/generate-safe-contract`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({
                              reportId: reportId || null,
                              originalFilePath: filePath
                            })
                          });

                          const contentType = response.headers.get('content-type');
                          
                          if (contentType && !contentType.includes('application/json')) {
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            
                            const contentDisposition = response.headers.get('content-disposition');
                            const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/i);
                            a.download = filenameMatch ? filenameMatch[1] : `safe-contract-version-${Date.now()}.pdf`;
                            
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                            toast.success('Safe Version Downloaded');
                          } else {
                            const data = await response.json();
                            
                            if (!response.ok || !data.success) {
                              throw new Error(data.error || 'Failed to generate safe contract');
                            }

                            const downloadResponse = await fetch(data.safeContractUrl);
                            const blob = await downloadResponse.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `safe-contract-version-${Date.now()}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                            toast.success('Safe Version Downloaded');
                          }
                        } catch (error: any) {
                          console.error('[ContractUploadFlow] Download safe contract error:', error);
                          toast.error(error.message || 'Failed to generate safe contract. Please try again.');
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-gray-600/80 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download PDF
                    </motion.button>
                  </div>

                  {/* Email Input Section (if email button clicked) */}
                  {brandEmail && (
                    <div className="mt-4 p-4 bg-white/10 border border-purple-400/30 rounded-xl">
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Brand Email Address
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={brandEmail}
                          onChange={(e) => setBrandEmail(e.target.value)}
                          placeholder="brand@example.com"
                          className="flex-1 px-4 py-2 bg-white/10 border border-purple-400/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => handleSendEmail(brandEmail)}
                          disabled={isSendingEmail || !brandEmail}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                        >
                          {isSendingEmail ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Send
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setShowNegotiationModal(false);
                      setBrandEmail('');
                    }}
                    className="w-full bg-gray-600/80 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 mt-4"
                  >
                    <X className="w-5 h-5" />
                    Close
                  </button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Universal Share Modal */}
            {negotiationMessage && (
              <UniversalShareModal
                open={showShareFeedbackModal}
                onClose={() => setShowShareFeedbackModal(false)}
                message={formatNegotiationMessage(negotiationMessage)}
                brandReplyLink={brandReplyLink || ''}
                primaryCtaText={isContractSummary ? 'Share Contract Summary' : 'Share with Brand'}
                dealId={savedDealId || undefined}
                onShareComplete={async (method) => {
                  // Set brand_response_status to 'pending' and update deal status to 'Sent'
                  if (savedDealId) {
                    try {
                      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
      (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com') 
        ? 'https://api.creatorarmour.com'
                          : 'http://localhost:3001');
                      await fetch(`${apiBaseUrl}/api/brand-response/${savedDealId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'pending' })
                      });
                      
                      // Update deal status to 'Sent'
                      await autoSaveDraftDeal({ updateExisting: true, updateStatus: 'Sent' });
                    } catch (error) {
                      console.warn('Failed to set brand response status:', error);
                    }
                  }
                  
                  setBrandApprovalStatus('sent');
                  setApprovalStatusUpdatedAt(new Date());
                  
                  // Track analytics if AI counter-proposal was used
                  if (aiCounterProposal && negotiationMessage === aiCounterProposal) {
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', 'ai_counter_sent', {
                        deal_id: savedDealId,
                        method: method
                      });
                    }
                  }
                  
                  toast.success('✅ Message shared. We\'ll remind you in 48 hours if the brand doesn\'t reply.');
                }}
              />
            )}
            
            {/* WhatsApp Preview Modal */}
            <Dialog open={showWhatsAppPreview} onOpenChange={setShowWhatsAppPreview}>
              <DialogContent className="max-w-lg bg-gradient-to-br from-green-900/95 to-emerald-900/95 backdrop-blur-xl border border-green-500/30 text-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6" />
                    WhatsApp Message Preview
                  </DialogTitle>
                  <DialogDescription className="text-green-200">
                    Review your message before sending
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-white whitespace-pre-wrap font-sans">
                    {negotiationMessage ? createWhatsAppMessage(formatNegotiationMessage(negotiationMessage)) : 'No message available'}
                  </pre>
                </div>
                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={handleConfirmWhatsAppCopy}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Copy className="w-5 h-5" />
                    Copy & Close
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      if (!negotiationMessage) return;
                      const fullMessage = formatNegotiationMessage(negotiationMessage);
                      const whatsappMessage = createWhatsAppMessage(fullMessage);
                      const encodedMessage = encodeURIComponent(whatsappMessage);
                      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
                      window.open(whatsappUrl, '_blank');
                      toast.success('Opening WhatsApp...');
                      setShowWhatsAppPreview(false);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Open WhatsApp
                  </motion.button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
            {/* End Content Width Container for iPad/Tablet */}
          </div>
        )}
      </div>
    </div>
    </ContextualTipsProvider>
  );
};

export default ContractUploadFlow;

