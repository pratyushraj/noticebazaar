"use client";

import { useState, useCallback, lazy, Suspense, useMemo, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Download, Flag, Loader2, Building2, Calendar, FileText, CheckCircle, Clock, Trash2, AlertCircle, XCircle, Bell, Mail, MessageSquare, Phone, Edit, X, Check, Share2, Copy, Link2, Upload, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
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
import { useUpdateDealProgress, DealStage, STAGE_TO_PROGRESS, useDeleteBrandDeal, useUpdateBrandDeal, getDealStageFromStatus } from '@/lib/hooks/useBrandDeals';
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
  const { profile, session, user } = useSession();
  
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
  
  // Collapsible sections state
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);
  const [showDealSummaryFull, setShowDealSummaryFull] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  
  // Creator signing states
  const [showCreatorSigningModal, setShowCreatorSigningModal] = useState(false);
  const [isSendingCreatorOTP, setIsSendingCreatorOTP] = useState(false);
  const [isVerifyingCreatorOTP, setIsVerifyingCreatorOTP] = useState(false);
  const [creatorOTP, setCreatorOTP] = useState('');
  const [creatorSigningStep, setCreatorSigningStep] = useState<'send' | 'verify'>('send');
  const [isSigningAsCreator, setIsSigningAsCreator] = useState(false);
  const [isCreatorSigned, setIsCreatorSigned] = useState(false);
  const [creatorSignature, setCreatorSignature] = useState<any>(null);
  const [brandSignature, setBrandSignature] = useState<any>(null);
  
  // Get current stage from deal status - uses canonical mapping
  const getCurrentStage = (status: string | null | undefined, progressPercentage?: number | null): DealStage | undefined => {
    return getDealStageFromStatus(status, progressPercentage);
  };
  
  // Helper to validate creator address and phone before contract operations
  const validateCreatorContactInfo = (): { isValid: boolean; message: string; missingFields: string[] } => {
    const missingFields: string[] = [];
    
    // Check address
    const creatorAddress = profile?.location || profile?.address || '';
    const trimmedAddress = creatorAddress?.trim() || '';
    
    if (!trimmedAddress || 
        trimmedAddress === '' || 
        trimmedAddress.toLowerCase() === 'not specified' ||
        trimmedAddress.toLowerCase() === 'n/a' ||
        trimmedAddress.length < 5) {
      missingFields.push('address');
    }
    
    // Check phone
    const creatorPhone = profile?.phone || '';
    const trimmedPhone = creatorPhone?.trim() || '';
    
    // Phone should be at least 10 digits (excluding country code)
    const phoneDigits = trimmedPhone.replace(/\D/g, '');
    if (!trimmedPhone || 
        trimmedPhone === '' || 
        trimmedPhone === '+91' ||
        trimmedPhone === '+91 ' ||
        phoneDigits.length < 10) {
      missingFields.push('phone number');
    }
    
    if (missingFields.length > 0) {
      const fieldsText = missingFields.join(' and ');
      return {
        isValid: false,
        message: `Please add your ${fieldsText} in Profile Settings before generating contracts or sharing links with brands. This information is required for legal contracts.`,
        missingFields
      };
    }
    
    return { isValid: true, message: '', missingFields: [] };
  };
  
  // Helper to create a secure brand reply link token for this deal
  const generateBrandReplyLink = async (targetDealId: string): Promise<string | null> => {
    try {
      // Validate creator address and phone before generating link
      const validation = validateCreatorContactInfo();
      if (!validation.isValid) {
        toast.error(validation.message, {
          duration: 6000,
          action: {
            label: 'Go to Profile',
            onClick: () => navigate('/creator-profile')
          }
        });
        return null;
      }

      if (!session?.access_token) {
        console.warn('[DealDetailPage] Cannot generate brand reply link: no session');
        return null;
      }

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com')
          ? 'https://api.noticebazaar.com'
          : 'http://localhost:3001');

      // Try to create contract-ready token first, fallback to brand-reply-tokens for migration
      let response = await fetch(`${apiBaseUrl}/api/contract-ready-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dealId: targetDealId, expiresAt: null }),
      });

      let data = await response.json();
      
      // If contract-ready-tokens endpoint doesn't exist, try legacy brand-reply-tokens
      if (!response.ok && response.status === 404) {
        console.log('[DealDetailPage] contract-ready-tokens not found, trying brand-reply-tokens for migration');
        response = await fetch(`${apiBaseUrl}/api/brand-reply-tokens`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ dealId: targetDealId, expiresAt: null }),
        });
        data = await response.json();
      }

      if (!response.ok || !data.success || !data.token?.id) {
        console.error('[DealDetailPage] Failed to create contract ready token:', data);
        return null;
      }

      const baseUrl =
        typeof window !== 'undefined' ? window.location.origin : 'https://noticebazaar.com';
      const link = `${baseUrl}/#/contract-ready/${data.token.id}`;
      setBrandReplyLink(link);
      return link;
    } catch (error) {
      console.error('[DealDetailPage] Contract ready token error:', error);
      return null;
    }
  };
  
  // Fetch signatures
  useEffect(() => {
    const fetchSignatures = async () => {
      if (!deal?.id || !session?.access_token) return;

      try {
        // Try to get API base URL with fallback logic
        let apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL ||
          (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com')
            ? 'https://api.noticebazaar.com'
            : typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
              ? 'https://api.creatorarmour.com'
              : 'http://localhost:3001');

        // If localhost, try it first, then fallback to production
        if (apiBaseUrl.includes('localhost')) {
          try {
            const brandResp = await fetch(`${apiBaseUrl}/api/esign/status/${deal.id}`, {
              headers: { Authorization: `Bearer ${session.access_token}` }
            });
            if (brandResp.ok) {
              const brandData = await brandResp.json();
              if (brandData.success && (brandData.status === 'signed' || brandData.meonStatus === 'SIGNED')) {
                setBrandSignature({ signed: true, signedAt: brandData.signedAt });
              }
            }
          } catch (localhostError) {
            console.warn('[DealDetailPage] Localhost API unavailable for signatures, using Supabase only');
            // Continue to Supabase fetch below
          }
        } else {
          // Use production API
          try {
            const brandResp = await fetch(`${apiBaseUrl}/api/esign/status/${deal.id}`, {
              headers: { Authorization: `Bearer ${session.access_token}` }
            });
            if (brandResp.ok) {
              const brandData = await brandResp.json();
              if (brandData.success && (brandData.status === 'signed' || brandData.meonStatus === 'SIGNED')) {
                setBrandSignature({ signed: true, signedAt: brandData.signedAt });
              }
            }
          } catch (apiError) {
            console.warn('[DealDetailPage] API signature fetch failed, using Supabase only');
          }
        }

        // Fetch signatures from our own table (always try this)
        const { data: ourSignatures, error: sigError } = await supabase
          .from('contract_signatures' as any)
          .select('*')
          .eq('deal_id', deal.id);

        if (sigError) {
          if (import.meta.env.DEV) {
            console.warn('[DealDetailPage] Error fetching signatures:', sigError);
          }
          setIsCreatorSigned(false);
        } else if (ourSignatures && Array.isArray(ourSignatures) && ourSignatures.length > 0) {
          const creatorSig = ourSignatures.find((s: any) => s?.signer_role === 'creator' && s?.signed === true);
          const brandSig = ourSignatures.find((s: any) => s?.signer_role === 'brand' && s?.signed === true);

          if (import.meta.env.DEV) {
            console.log('[DealDetailPage] Signature check:', {
              totalSignatures: ourSignatures.length,
              creatorSig: creatorSig ? 'found' : 'not found',
              brandSig: brandSig ? 'found' : 'not found',
              creatorSigned: creatorSig ? (creatorSig as any).signed : false,
              creatorSigDetails: creatorSig ? {
                signer_role: (creatorSig as any).signer_role,
                signed: (creatorSig as any).signed,
                signed_at: (creatorSig as any).signed_at,
                id: (creatorSig as any).id,
              } : null,
              allSignatures: ourSignatures.map((s: any) => ({
                signer_role: s?.signer_role,
                signed: s?.signed,
                id: s?.id,
              })),
            });
          }

          // Only set creator as signed if we have a valid creator signature
          // Must have: creator role, signed === true, AND a valid signed_at timestamp
          const hasCreatorSigRecord = creatorSig && 
            (creatorSig as any).signer_role === 'creator' && 
            (creatorSig as any).signed === true;
          
          // Additional validation: Check if signed_at exists and is valid
          let hasValidCreatorSignature = false;
          if (hasCreatorSigRecord) {
            const signedAt = (creatorSig as any).signed_at;
            if (signedAt) {
              const signedAtDate = new Date(signedAt);
              const now = new Date();
              const isValidTimestamp = signedAtDate.getTime() > 0 && 
                signedAtDate.getTime() <= now.getTime() + 60000 && // Allow 1 minute future tolerance
                signedAtDate.getTime() > new Date('2020-01-01').getTime(); // Must be after 2020
              
              // Also verify the signature email matches the current user's email
              // IMPORTANT: We require currentUserEmail to exist - if it's undefined, we can't verify ownership
              // Email is in auth.users (session.user.email), not in profiles table
              const currentUserEmail = (session?.user?.email || user?.email || profile?.email)?.toLowerCase();
              const signatureEmail = (creatorSig as any).signer_email?.toLowerCase();
              // Email matches only if BOTH emails exist AND they match
              const emailMatches = !!currentUserEmail && !!signatureEmail && currentUserEmail === signatureEmail;
              
              // Verify the signature belongs to this deal
              const dealIdMatches = (creatorSig as any).deal_id === deal?.id;
              
              // Verify OTP was verified (required for valid signatures)
              const otpVerified = (creatorSig as any).otp_verified === true;
              const otpVerifiedAt = (creatorSig as any).otp_verified_at;
              const hasOtpVerifiedAt = otpVerifiedAt && new Date(otpVerifiedAt).getTime() > 0;
              
              // Verify signature has required audit trail fields (indicates real signature, not placeholder)
              const hasIpAddress = !!(creatorSig as any).ip_address;
              const hasUserAgent = !!(creatorSig as any).user_agent;
              
              // Only consider valid if all checks pass
              hasValidCreatorSignature = isValidTimestamp && 
                                        emailMatches && 
                                        dealIdMatches && 
                                        otpVerified && 
                                        hasOtpVerifiedAt &&
                                        hasIpAddress &&
                                        hasUserAgent;
              
              if (import.meta.env.DEV) {
                // Log each check individually for clarity
                console.group('[DealDetailPage] Creator Signature Validation Details');
                console.log('✓ Timestamp valid:', isValidTimestamp, '| signed_at:', signedAt);
                console.log('✓ Email matches:', emailMatches, '| signature:', signatureEmail, '| current:', currentUserEmail);
                console.log('✓ Deal ID matches:', dealIdMatches, '| signature deal_id:', (creatorSig as any).deal_id, '| current deal_id:', deal?.id);
                console.log('✓ OTP verified:', otpVerified, '| otp_verified:', (creatorSig as any).otp_verified);
                console.log('✓ OTP verified_at exists:', hasOtpVerifiedAt, '| otp_verified_at:', (creatorSig as any).otp_verified_at);
                console.log('✓ IP address present:', hasIpAddress, '| ip_address:', (creatorSig as any).ip_address ? 'present' : 'MISSING');
                console.log('✓ User agent present:', hasUserAgent, '| user_agent:', (creatorSig as any).user_agent ? 'present' : 'MISSING');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('🎯 FINAL RESULT: hasValidCreatorSignature =', hasValidCreatorSignature);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.groupEnd();
                
                const validationDetails = {
                  signed_at: signedAt,
                  signedAtDate: signedAtDate.toISOString(),
                  signer_email: (creatorSig as any).signer_email,
                  signer_name: (creatorSig as any).signer_name,
                  currentUserEmail,
                  signatureEmail,
                  emailMatches,
                  isValidTimestamp,
                  deal_id: (creatorSig as any).deal_id,
                  currentDealId: deal?.id,
                  dealIdMatches: (creatorSig as any).deal_id === deal?.id,
                  otp_verified: (creatorSig as any).otp_verified,
                  otpVerified: (creatorSig as any).otp_verified === true,
                  otp_verified_at: (creatorSig as any).otp_verified_at,
                  hasOtpVerifiedAt: hasOtpVerifiedAt,
                  hasIpAddress: hasIpAddress,
                  hasUserAgent: hasUserAgent,
                  ip_address: (creatorSig as any).ip_address ? 'present' : 'missing',
                  user_agent: (creatorSig as any).user_agent ? 'present' : 'missing',
                  hasValidCreatorSignature,
                  validationChecks: {
                    isValidTimestamp,
                    emailMatches,
                    dealIdMatches,
                    otpVerified,
                    hasOtpVerifiedAt,
                    hasIpAddress,
                    hasUserAgent,
                  },
                  timestampCheck: {
                    isPositive: signedAtDate.getTime() > 0,
                    isNotFuture: signedAtDate.getTime() <= now.getTime() + 60000,
                    isAfter2020: signedAtDate.getTime() > new Date('2020-01-01').getTime(),
                  },
                };
                console.log('[DealDetailPage] Creator signature validation (full object):', validationDetails);
                console.log('[DealDetailPage] Full signature object:', JSON.parse(JSON.stringify(creatorSig)));
                
                // If validation is passing but shouldn't, log a warning
                if (hasValidCreatorSignature) {
                  console.warn('[DealDetailPage] ⚠️ Creator signature VALIDATED as signed. If this is incorrect, check the signature record in the database.');
                  console.warn('[DealDetailPage] ⚠️ To allow signing, the signature record needs to be deleted or marked as invalid in the database.');
                }
              }
            } else {
              if (import.meta.env.DEV) {
                console.warn('[DealDetailPage] Creator signature found but has no signed_at timestamp');
              }
            }
          }
          
          if (hasValidCreatorSignature) {
            setIsCreatorSigned(true);
            setCreatorSignature(creatorSig);
          } else {
            // Explicitly set to false if no valid creator signature found
            if (import.meta.env.DEV) {
              if (hasCreatorSigRecord) {
                console.warn('[DealDetailPage] Creator signature found but invalid - treating as unsigned');
              } else {
                console.log('[DealDetailPage] Setting isCreatorSigned to FALSE - no valid creator signature', {
                  hasCreatorSig: !!creatorSig,
                  signer_role: creatorSig ? (creatorSig as any).signer_role : 'none',
                  signed: creatorSig ? (creatorSig as any).signed : false,
                  signed_at: creatorSig ? (creatorSig as any).signed_at : 'none',
                });
              }
            }
            setIsCreatorSigned(false);
          }
          if (brandSig) {
            setBrandSignature(brandSig);
          }
        } else {
          // No signatures found, ensure creator is not marked as signed
          if (import.meta.env.DEV) {
            console.log('[DealDetailPage] No signatures found in database');
          }
          setIsCreatorSigned(false);
        }
      } catch (error) {
        console.error('[DealDetailPage] Error fetching signatures:', error);
        // Don't show error toast - signatures are optional
      }
    };

    fetchSignatures();
  }, [deal?.id, session?.access_token, session?.user?.email, user?.email]);

  const handleSendCreatorOTP = async () => {
    if (!deal?.id || !session?.access_token) return;

    setIsSendingCreatorOTP(true);
    try {
      // Try to get API base URL with fallback logic
      let apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com')
          ? 'https://api.noticebazaar.com'
          : typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
            ? 'https://api.creatorarmour.com'
            : 'http://localhost:3001');

      // If localhost, try it first, then fallback to production
      if (apiBaseUrl.includes('localhost')) {
        try {
          const resp = await fetch(`${apiBaseUrl}/api/otp/send-creator`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ dealId: deal.id }),
          });

          if (resp.ok) {
            const data = await resp.json();
            if (data.success) {
              toast.success('OTP sent to your email');
              setCreatorSigningStep('verify');
              return;
            }
          }
        } catch (localhostError) {
          console.warn('[DealDetailPage] Localhost API unavailable, trying production API...');
          // Fallback to production API
          apiBaseUrl = 'https://noticebazaar-api.onrender.com';
        }
      }

      // Use production API (either as primary or fallback)
      const resp = await fetch(`${apiBaseUrl}/api/otp/send-creator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dealId: deal.id }),
      });

      if (!resp.ok) {
        // Check for CORS errors (status 0 typically indicates CORS failure)
        if (resp.status === 0) {
          throw new Error('CORS_ERROR');
        }
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${resp.status}`);
      }

      const data = await resp.json();
      if (data.success) {
        toast.success('OTP sent to your email');
        setCreatorSigningStep('verify');
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('[DealDetailPage] OTP send error:', error);
      
      // Handle CORS errors specifically
      if (error.message === 'CORS_ERROR' || error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
        toast.error(
          'Cannot connect to API server. Please ensure the local API server is running on port 3001, or configure CORS on the production server.',
          { duration: 5000 }
        );
      } else {
        toast.error(error.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setIsSendingCreatorOTP(false);
    }
  };

  const handleVerifyCreatorOTP = async () => {
    if (!deal?.id || !session?.access_token || !creatorOTP) return;

    setIsVerifyingCreatorOTP(true);
    try {
      // Try to get API base URL with fallback logic
      let apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com')
          ? 'https://api.noticebazaar.com'
          : typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
            ? 'https://api.creatorarmour.com'
            : 'http://localhost:3001');

      // If localhost, try it first, then fallback to production
      if (apiBaseUrl.includes('localhost')) {
        try {
          const resp = await fetch(`${apiBaseUrl}/api/otp/verify-creator`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ dealId: deal.id, otp: creatorOTP }),
          });

          const data = await resp.json();
          if (resp.ok && data.success) {
            toast.success('OTP verified! Now signing contract...');
            await handleSignAsCreator();
            return;
          } else {
            // If OTP is already verified, proceed to signing anyway
            if (data.error && data.error.includes('already been verified')) {
              toast.success('OTP already verified. Signing contract...');
              await handleSignAsCreator();
              return;
            }
          }
        } catch (localhostError) {
          console.warn('[DealDetailPage] Localhost API unavailable, trying production API...');
          // Fallback to production API
          apiBaseUrl = 'https://noticebazaar-api.onrender.com';
        }
      }

      // Use production API (either as primary or fallback)
      const resp = await fetch(`${apiBaseUrl}/api/otp/verify-creator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dealId: deal.id, otp: creatorOTP }),
      });

      const data = await resp.json();
      if (data.success) {
        toast.success('OTP verified! Now signing contract...');
        await handleSignAsCreator();
      } else {
        // If OTP is already verified, proceed to signing anyway
        if (data.error && data.error.includes('already been verified')) {
          toast.success('OTP already verified. Signing contract...');
          await handleSignAsCreator();
        } else {
          toast.error(data.error || 'Invalid OTP');
        }
      }
    } catch (error: any) {
      console.error('[DealDetailPage] OTP verify error:', error);
      toast.error(error.message || 'Failed to verify OTP');
    } finally {
      setIsVerifyingCreatorOTP(false);
    }
  };

  const handleSignAsCreator = async () => {
    if (!deal?.id || !session?.access_token) return;

    setIsSigningAsCreator(true);
    try {
      // Validate deal exists before attempting to sign
      if (!deal?.id) {
        toast.error('Deal information is missing. Please refresh the page and try again.');
        setIsSigningAsCreator(false);
        return;
      }

      console.log('[DealDetailPage] Attempting to sign contract:', {
        dealId: deal.id,
        dealStatus: deal.status,
        contractFileUrl: deal.contract_file_url
      });

      // Try to get API base URL with fallback logic
      let apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com')
          ? 'https://api.noticebazaar.com'
          : typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
            ? 'https://api.creatorarmour.com'
            : 'http://localhost:3001');

      // If localhost, try it first, then fallback to production
      if (apiBaseUrl.includes('localhost')) {
        try {
          const resp = await fetch(`${apiBaseUrl}/api/deals/${deal.id}/sign-creator`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              signerName: profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Creator',
              signerEmail: profile?.email || '',
              contractSnapshotHtml: `Contract URL: ${deal.contract_file_url}\nSigned at: ${new Date().toISOString()}`,
            }),
          });

          if (resp.ok) {
            const data = await resp.json();
            if (data.success) {
              toast.success('Contract signed successfully!');
              setIsCreatorSigned(true);
              setCreatorSignature(data.signature);
              setShowCreatorSigningModal(false);
              refreshAll(); // Refresh deal data to show updated status
              return;
            } else {
              // If localhost returns an error, try production API
              console.warn('[DealDetailPage] Localhost API returned error, trying production API...');
              apiBaseUrl = 'https://noticebazaar-api.onrender.com';
            }
          } else {
            // If localhost returns non-ok status, try production API
            console.warn('[DealDetailPage] Localhost API unavailable (status:', resp.status, '), trying production API...');
            apiBaseUrl = 'https://noticebazaar-api.onrender.com';
          }
        } catch (localhostError) {
          console.warn('[DealDetailPage] Localhost API unavailable, trying production API...');
          // Fallback to production API
          apiBaseUrl = 'https://noticebazaar-api.onrender.com';
        }
      }

      // Use production API (either as primary or fallback)
      const resp = await fetch(`${apiBaseUrl}/api/deals/${deal.id}/sign-creator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          signerName: profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Creator',
          signerEmail: profile?.email || '',
          contractSnapshotHtml: `Contract URL: ${deal.contract_file_url}\nSigned at: ${new Date().toISOString()}`,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ error: `Server error: ${resp.status}` }));
        const errorMessage = errorData.error || `Failed to sign contract: ${resp.status}`;
        const errorDetails = errorData.details || errorData.message || '';
        console.error('[DealDetailPage] Signing failed:', {
          status: resp.status,
          statusText: resp.statusText,
          error: errorMessage,
          details: errorDetails,
          dealId: deal.id,
          apiBaseUrl,
          fullError: errorData
        });
        // Show more detailed error message if available
        const fullErrorMessage = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
        throw new Error(fullErrorMessage);
      }

      const data = await resp.json();
      if (data.success) {
        toast.success('Contract signed successfully!');
        setIsCreatorSigned(true);
        setCreatorSignature(data.signature);
        setShowCreatorSigningModal(false);
        refreshAll(); // Refresh deal data to show updated status
      } else {
        toast.error(data.error || 'Failed to sign contract');
      }
    } catch (error: any) {
      console.error('[DealDetailPage] Signing error:', error);
      toast.error(error.message || 'Failed to sign contract');
    } finally {
      setIsSigningAsCreator(false);
    }
  };
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
    
    if (deal.created_at && deal.id) {
      entries.push({
        id: `action-${deal.id}-created`,
        action: 'Deal created',
        type: 'other',
        timestamp: deal.created_at,
        user: profile?.first_name || 'You',
      });
    }

    if (deal.contract_file_url && deal.id) {
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
  
  const contractUrlInfo = {
    contractDocxUrl: contractDocxUrl || 'null',
    signedContractUrl: signedContractUrl || 'null',
    contractVersion: (deal as any)?.contract_version || 'null',
    hasContract: !!contractDocxUrl,
    hasSignedContract: !!signedContractUrl,
    dealExecutionStatus: dealExecutionStatus || 'null',
    isCreatorSigned,
    dealId: deal?.id,
    canDownload: !!(contractDocxUrl || signedContractUrl)
  };
  console.log('[DealDetailPage] Contract URL resolution:', contractUrlInfo);
  console.log('[DealDetailPage] Can download?', contractUrlInfo.canDownload, 'contractDocxUrl:', contractUrlInfo.contractDocxUrl, 'signedContractUrl:', contractUrlInfo.signedContractUrl);
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
      return 'Declined';
    }
    
    // Check deal status - use canonical mapping
    const statusLower = deal?.status?.toLowerCase() || '';
    
    // New status model - exact matches first
    if (statusLower === 'signed_by_brand' || statusLower.includes('signed_by_brand')) {
      return 'Signed';
    }
    if (statusLower === 'contract_ready' || statusLower.includes('contract_ready')) {
      return 'Contract Ready – Awaiting Brand Signature';
    }
    if (statusLower === 'brand_details_submitted' || statusLower.includes('brand_details_submitted')) {
      return 'Details Submitted';
    }
    if (statusLower === 'needs_changes' || statusLower.includes('needs_changes') || statusLower.includes('brand_requested_changes')) {
      return 'Requires Changes';
    }
    if (statusLower === 'rejected' || statusLower.includes('rejected') || statusLower.includes('declined')) {
      return 'Declined';
    }
    if (statusLower === 'completed' || statusLower.includes('completed')) {
      return 'Completed';
    }
    
    // Legacy status mappings
    if (statusLower.includes('signed_pending_creator')) {
      return 'Signed';
    }
    if (statusLower.includes('agreement_prepared')) {
      return 'Contract Ready – Awaiting Brand Signature';
    }
    if (statusLower.includes('signed') && !statusLower.includes('pending')) {
      return 'Signed';
    }
    if (statusLower.includes('approved') || statusLower.includes('accepted')) {
      return 'Approved';
    }
    if (statusLower.includes('sent') || statusLower.includes('shared')) {
      return 'Shared';
    }
    
    // Default to Details Submitted (new default for form-submitted deals)
    return 'Details Submitted';
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
        contractType: 'docx',
      });
      
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
    // Prioritize signed contract URL if available (after both parties have signed)
    // Otherwise use the regular contract URL
    let contractUrl = signedContractUrl || contractDocxUrl;
    
    console.log('[DealDetailPage] Download clicked:', {
      contractUrl,
      signedContractUrl,
      contractDocxUrl,
      hasContract: !!contractUrl,
      dealId: deal?.id
    });
    
    // If no direct URL, try to use the download-docx API endpoint
    if (!contractUrl && deal?.id) {
      console.log('[DealDetailPage] No direct contract URL, trying download-docx API endpoint...');
      try {
        // Try to get API base URL
        let apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL ||
          (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com')
            ? 'https://api.noticebazaar.com'
            : typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
              ? 'https://api.creatorarmour.com'
              : 'http://localhost:3001');

        // Use the download-docx endpoint
        const downloadUrl = `${apiBaseUrl}/api/protection/contracts/${deal.id}/download-docx`;
        console.log('[DealDetailPage] Using download endpoint:', downloadUrl);
        
        // Trigger download via the API endpoint
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `contract-${deal.id}.docx`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Downloading contract...');
        return;
      } catch (error: any) {
        console.error('[DealDetailPage] Failed to use download endpoint:', error);
        // Fall through to show error message
      }
    }
    
    if (!contractUrl) {
      console.error('[DealDetailPage] No contract URL available for download');
      toast.error('No contract file available', {
        description: 'The contract file is not available. The contract may need to be regenerated. Please contact support.',
      });
      return;
    }

    setIsDownloading(true);
    const progressToast = toast.loading('Downloading contract...');

    try {
      const filename = getFilenameFromUrl(contractUrl) || 
        (signedContractUrl ? 'signed-contract.pdf' : 'contract.docx');
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
          metadata: { filename, isSigned: !!signedContractUrl },
        });
      }
      
      trackEvent('zip_bundle_downloaded', { dealId: deal.id });
    } catch (error: any) {
      toast.dismiss(progressToast);
      console.error('[DealDetailPage] Download error:', error);
      console.error('[DealDetailPage] Download context:', {
        contractUrl,
        signedContractUrl,
        contractDocxUrl,
        hasContract: !!contractUrl,
        dealId: deal?.id
      });
      
      // Provide more helpful error messages
      if (!contractUrl) {
        toast.error('No contract available', {
          description: 'The contract file is not available. Please contact support.',
        });
      } else if (error.message?.includes('CORS') || error.message?.includes('network')) {
        toast.error('Download failed', {
          description: 'Network error. Please check your connection and try again.',
        });
      } else {
        toast.error('Failed to download contract', {
          description: error.message || 'Please try again or contact support.',
        });
      }
          } finally {
      setIsDownloading(false);
    }
  }, [deal?.id, deal?.contract_file_url, signedContractUrl, contractDocxUrl, profile?.id, createActionLog]);

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
      
      // If we already have the data, don't fetch again
      if (brandSubmissionDetails) return;
      
      const createdVia = (deal as any)?.created_via;
      
      // Check if form data is already in the deal object
      if ((deal as any)?.form_data) {
        console.log('[DealDetailPage] Found form_data in deal object:', (deal as any).form_data);
        setBrandSubmissionDetails((deal as any).form_data);
        return;
      }
      
      // Try to fetch submission details for any deal
      // The API will return empty if no data exists
      setIsLoadingSubmission(true);
      try {
        let apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL ||
          (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
            ? 'https://api.creatorarmour.com'
            : typeof window !== 'undefined' && window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : 'https://noticebazaar-api.onrender.com');

        let response: Response;
        try {
          response = await fetch(`${apiBaseUrl}/api/deal-details-tokens/deal/${deal.id}`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
        } catch (fetchError: any) {
          // If localhost fails, try production API as fallback
          if (
            (fetchError.message?.includes('Failed to fetch') || 
             fetchError.message?.includes('ERR_CONNECTION_REFUSED') ||
             fetchError.name === 'TypeError') &&
            apiBaseUrl.includes('localhost')
          ) {
            console.warn('[DealDetailPage] Localhost API unavailable, trying production API...');
            apiBaseUrl = 'https://noticebazaar-api.onrender.com';
            response = await fetch(`${apiBaseUrl}/api/deal-details-tokens/deal/${deal.id}`, {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });
          } else {
            throw fetchError;
          }
        }

        if (response.ok) {
          const data = await response.json();
          console.log('[DealDetailPage] Fetched submission details:', data);
          if (data.success && data.formData) {
            console.log('[DealDetailPage] Setting brand submission details:', data.formData);
            setBrandSubmissionDetails(data.formData);
          } else {
            console.log('[DealDetailPage] No form data found in response:', data);
          }
        } else {
          console.log('[DealDetailPage] Failed to fetch submission details, status:', response.status);
        }
      } catch (error) {
        console.error('[DealDetailPage] Error fetching submission details:', error);
      } finally {
        setIsLoadingSubmission(false);
      }
    };

    fetchSubmissionDetails();
  }, [deal?.id, deal?.status, (deal as any)?.created_via, session?.access_token]);

  // Set hasReviewedDetails based on deal status
  useEffect(() => {
    if (deal?.status) {
      const status = deal.status.toLowerCase();
      // If status is not 'brand_details_submitted' or doesn't include 'brand', it's been reviewed
      setHasReviewedDetails(status !== 'brand_details_submitted' && !status.includes('brand'));
    }
  }, [deal?.status]);

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
          
          <button
            onClick={() => {
              triggerHaptic(HapticPatterns.light);
              setShowDeleteConfirm(true);
            }}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors active:scale-95"
            aria-label="Delete Deal"
          >
            <Trash2 className="w-6 h-6 text-red-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 p-4 md:p-6 pb-24">
        {/* Page Subtitle */}
        <p className="text-sm text-white/70 text-center mb-4 px-2">
          Everything about this collaboration, organized and protected in one place.
        </p>
        
        {/* Contract Generated Banner */}
        {(deal as any)?.contract_status === 'DraftGenerated' && deal?.contract_file_url && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-2xl p-4 md:p-6 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Contract Generated 🎉
                </h3>
                <p className="text-white/80 text-sm mb-2">
                  We've prepared a protected agreement using the brand's submitted collaboration details.
                </p>
                <p className="text-white/60 text-xs mb-4">
                  You can review, sign or request updates anytime.
                </p>
                <button
                  onClick={handlePreviewContract}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-medium transition-all duration-200 text-white active:scale-[0.98]"
                >
                  Review Contract
                </button>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Status Card - Replaces Header Section */}
        {(() => {
          const statusLower = deal?.status?.toLowerCase() || '';
          const isContractReady = statusLower === 'contract_ready' || statusLower.includes('contract_ready');
          const isSigned = statusLower === 'signed_by_brand' || statusLower.includes('signed_by_brand') || 
                          dealExecutionStatus === 'signed' || dealExecutionStatus === 'completed' ||
            contractStatus === 'Signed';
          const hasContract = !!contractDocxUrl;
          const signedAtDate = signedAt || signedContractUploadedAt || (deal as any)?.brand_response_at;
          
          if (isContractReady && !isSigned && hasContract) {
            // CONTRACT_READY and not signed
            return (
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-xl border-2 border-blue-400/30 rounded-2xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-2">Contract Ready for Signature</h2>
                <p className="text-white/70 text-sm mb-6">Brand identity verified. This agreement is ready to be signed.</p>
                
                <div className="space-y-3">
            <motion.button
                    onClick={async () => {
                      if (!deal?.id) return;
                      const link = brandReplyLink || (await generateBrandReplyLink(deal.id));
                      if (link) {
                        window.open(link, '_blank');
                      }
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-6 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    Sign Contract
            </motion.button>
                  
            <button
                    onClick={handleDownloadContract}
                    disabled={(!contractDocxUrl && !signedContractUrl && !deal?.id) || isDownloading}
                    className="w-full text-sm text-white/70 hover:text-white transition-colors underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloading ? 'Downloading...' : 'View Contract PDF'}
            </button>
                </div>
              </div>
            );
          } else if (isSigned && isCreatorSigned) {
            // SIGNED / AGREEMENT EXECUTED - Final state
            return (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-2 leading-tight">Collaboration Agreement — Signed</h1>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Legally Executed
                      </span>
                    </div>
                    <p className="text-sm text-white/60">
                      This agreement has been legally executed. CreatorArmour provides verification and audit records.
                    </p>
                  </div>
                </div>

                {/* Deal Value - Prominent */}
                <div className="bg-white/5 rounded-xl p-4 mb-4">
                  <div className="text-sm text-white/60 mb-1">Total Deal Value</div>
                  <div className="text-3xl font-bold text-green-400">₹{Math.round(dealAmount).toLocaleString('en-IN')}</div>
                </div>

                {/* Brand Identity Verified Badge */}
                {(deal as any)?.brand_response_status === 'accepted_verified' && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-white/80">Brand Identity Verified</div>
                    </div>
                  </div>
                )}

                {/* Signed Timestamp - Small, Muted */}
                {signedAtDate && (
                  <div className="text-xs text-white/50 mt-2">
                    Signed on {new Date(signedAtDate).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                      year: 'numeric'
                    })}
                    </div>
                  )}
              </div>
            );
          } else {
            // Default status card for other states
            return (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/20">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                    {deal.brand_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold mb-2 leading-tight">{dealTitle}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {contractStatus || deal.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deal Value */}
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-sm text-white/60 mb-1">Total Deal Value</div>
                  <div className="text-3xl font-bold text-green-400">₹{Math.round(dealAmount).toLocaleString('en-IN')}</div>
                  <div className="text-xs text-white/50 mt-1">(Protected)</div>
                </div>
              </div>
            );
          }
        })()}

        {/* Brand Response Tracker - Only show for pending/negotiating/rejected (not verified) */}
        {deal && deal.id && (deal as any)?.brand_response_status && (deal as any)?.brand_response_status !== 'accepted_verified' && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/20">
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
              const lastRemindedAt = (deal as any).last_reminded_at;
              
              // Normalize response status - treat accepted_verified as final, accepted as intermediate
              const normalizedStatus = responseStatus === 'accepted_verified' ? 'accepted_verified' :
                                     responseStatus === 'accepted' ? 'accepted' :
                                     responseStatus === 'negotiating' ? 'negotiating' :
                                     responseStatus === 'rejected' ? 'rejected' :
                                     'pending';
              
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
              
              // Check if link has been shared (either reminder sent or link exists)
              const hasBeenShared = !!lastRemindedAt || !!brandReplyLink;
              
              // Determine if we're BEFORE or AFTER sharing
              const isBeforeSharing = normalizedStatus === 'pending' && !hasBeenShared;
              const isAfterSharing = normalizedStatus === 'pending' && hasBeenShared;
              
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
                  {/* Header - Different content for BEFORE vs AFTER sharing */}
                  {isBeforeSharing ? (
                    <>
                      <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Share2 className="w-5 h-5" />
                        Share with Brand to Finalize
                      </h2>
                      <p className="text-sm text-white/70 mb-4">
                        Send this secure link so the brand can confirm details and proceed.
                      </p>
                    </>
                  ) : isAfterSharing ? (
                    <>
                      <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Waiting for Brand Response
                      </h2>
                      <p className="text-sm text-white/70 mb-2">
                        The brand has received the agreement. We'll notify you as soon as they respond.
                      </p>
                      <p className="text-xs text-white/60 mb-4">
                        Brands usually reply within 24–48 hours.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <StatusIcon className={cn("w-5 h-5", config.color)} />
                        {config.label}
                      </h2>
                      {responseAt && (
                        <p className="text-sm text-white/70 mb-4">
                          Responded on {new Date(responseAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </>
                  )}
                  
                  {/* Status indicator card - only show for non-pending or after sharing */}
                  {!isBeforeSharing && (
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
                  )}
                  
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
                  
                  {/* Share/Remind Brand Buttons - Show different content for BEFORE vs AFTER sharing */}
                  {normalizedStatus === 'pending' && deal && deal.id && (() => {
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
                    
                    // Show different UI for BEFORE vs AFTER sharing
                    if (isBeforeSharing) {
                      // BEFORE Sharing - Show share button
                      return (
                        <div className="mt-4 space-y-3">
                          <motion.button
                            onClick={handleRemindBrand}
                            disabled={isSendingReminder}
                            whileHover={!isSendingReminder ? { scale: 1.02 } : {}}
                            whileTap={!isSendingReminder ? { scale: 0.98 } : {}}
                            className={cn(
                              "w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
                              !isSendingReminder
                                ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                                : "bg-purple-500/20 text-purple-300/50 border border-purple-400/20 cursor-not-allowed"
                            )}
                          >
                            {isSendingReminder ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">Generating link...</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-5 h-5" />
                                <span className="text-sm">Share with Brand</span>
                              </>
                            )}
                          </motion.button>
                          <p className="text-xs text-white/50 text-center">
                            This reply does not legally bind you until approved.
                          </p>
                        </div>
                      );
                    } else {
                      // AFTER Sharing - Show reminder and copy link buttons
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
                                  <span className="text-sm">Share Reminder</span>
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
                          
                          <p className="text-xs text-white/50 text-center mt-3">
                            This reply does not legally bind you until approved.
                          </p>
                        </div>
                      );
                    }
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
                return '✅ Brand Identity Verified';
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

        {/* Final Contract Section - Moved above Deliverables */}
        {brandResponseStatus === 'accepted_verified' && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg shadow-black/20 mb-6">
            {(() => {
              const contractDocxUrl = deal?.contract_file_url as string | null | undefined;
              const isContractSigned = dealExecutionStatus === 'signed' || dealExecutionStatus === 'completed' || 
                                     signedContractUrl || signedAt ||
                                     (deal?.status?.toLowerCase()?.includes('signed'));
              
              // Determine signing status
              const isBrandSigned = brandSignature?.signed || isContractSigned;
              const bothSigned = isBrandSigned && isCreatorSigned;
              
              return (
                <>
                  <h2 className="font-semibold text-xl mb-2 flex items-center gap-2">
                    {bothSigned ? (
                      <CheckCircle className="w-6 h-6 text-purple-400" />
                    ) : (
                      <FileText className="w-6 h-6 text-purple-400" />
                    )}
                    {bothSigned ? 'Final Contract' : 'Final Agreement'}
                  </h2>
                  <p className="text-sm text-white/70 mb-4">
                    {bothSigned
                      ? 'This agreement has been legally executed. CreatorArmour provides verification and audit records.'
                      : !isBrandSigned && !isCreatorSigned
                      ? 'This contract has been generated based on confirmed details. Both parties need to sign to finalize the deal.'
                      : !isBrandSigned
                      ? 'Please share the signing link with the brand to complete the agreement.'
                      : 'The brand has signed the agreement. Please review and sign to finalize the deal.'}
                  </p>

                  <div className="flex flex-col gap-3">
                    {/* Sign as Creator - Always show */}
                    {isCreatorSigned ? (
                      <div className="w-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 px-6 py-3 rounded-xl flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="font-semibold text-white">Signed as Creator</span>
                      </div>
                    ) : (
                      <motion.button
                        onClick={() => setShowCreatorSigningModal(true)}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
                      >
                        <FileText className="w-5 h-5" />
                        Sign as Creator
                      </motion.button>
                    )}

                    {/* Sign as Brand - Always show */}
                    {isBrandSigned ? (
                      <div className="w-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 px-6 py-3 rounded-xl flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="font-semibold text-white">Signed as Brand</span>
                      </div>
                    ) : (
                      <motion.button
                        onClick={async () => {
                          if (!deal?.id) return;
                          const link = brandReplyLink || (await generateBrandReplyLink(deal.id));
                          if (link) {
                            window.open(link, '_blank');
                          }
                        }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-6 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
                      >
                        <FileText className="w-5 h-5" />
                        Sign as Brand
                      </motion.button>
                    )}

                    {/* Download and Audit Trail - Show if both signed */}
                    {bothSigned && (
                      <>
                        <motion.button
                          onClick={handleDownloadContract}
                          disabled={(!contractDocxUrl && !signedContractUrl && !deal?.id) || isDownloading}
                          whileTap={{ scale: 0.98 }}
                          className="w-full px-6 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-5 h-5" />
                              Download Signed Agreement
                            </>
                          )}
                        </motion.button>
                        
                        <button
                          onClick={() => setShowAuditTrail(true)}
                          className="w-full text-sm text-white/70 hover:text-white transition-colors underline text-center py-2"
                        >
                          View Audit Trail
                        </button>
                        
                        <p className="text-xs text-white/50 mt-2 text-center">
                          Includes OTP verification, IP address, timestamp, and device record.
                        </p>
                      </>
                    )}

                    {/* Download button - Show if at least one party has signed but not both */}
                    {(isBrandSigned || isCreatorSigned) && !bothSigned && (
                      <motion.button
                        onClick={handleDownloadContract}
                        disabled={(!contractDocxUrl && !signedContractUrl && !deal?.id) || isDownloading}
                        whileTap={{ scale: 0.98 }}
                        className="w-full px-6 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-white/10 hover:bg-white/20 border border-white/20"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5" />
                            Download Agreement PDF
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Deliverables */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/20">
              <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-white/70" />
                Deliverables
              </h2>
              <p className="text-xs text-white/50 mb-4">
                Deliverables are auto-tracked and marked completed on their due dates.
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
                <>
                  <div className="space-y-2">
                  {deliverables.map((item: any, index: number) => (
                      <div key={index} className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white/90 break-words mb-1">
                            {item.title || item.name || `Deliverable ${index + 1}`}
                          </div>
                          {item.dueDate && (
                            <div className="text-xs text-white/60 mt-1.5 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Due: {item.dueDate}</span>
                            </div>
                          )}
                          {item.status && (
                              <div className="mt-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                item.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
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
                </>
              ) : (
                <div className="text-sm text-white/60 py-4">No deliverables specified</div>
              )}
            </div>

            {/* Audit Trail (Advanced) - Collapsed by default */}
            {actionLogEntries.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/20">
                <Collapsible open={showAuditTrail} onOpenChange={setShowAuditTrail}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between">
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">Audit Trail & Verification</h3>
                        <p className="text-xs text-white/50 mt-1">For legal review, disputes, or compliance.</p>
                      </div>
                      {showAuditTrail ? (
                        <ChevronUp className="w-5 h-5 text-white/60" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white/60" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <p className="text-sm text-white/70 mb-6 mt-2">
                      Complete timeline of system events and actions.
                    </p>
                    <Suspense fallback={<div className="text-white/60 p-4">Loading audit trail...</div>}>
                      <ActionLog entries={actionLogEntries.filter(entry => 
                        entry.action?.toLowerCase().includes('signed') || 
                        entry.action?.toLowerCase().includes('verified') ||
                        entry.action?.toLowerCase().includes('brand verified')
                      )} />
                </Suspense>
                  </CollapsibleContent>
                </Collapsible>
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
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-lg shadow-black/20">
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
              
              <p className="text-xs text-white/60 mb-4">
                Verified brand contact details used for this agreement.
              </p>
              
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2 text-white/80">
                  <span className="font-medium">{deal.brand_name}</span>
                </div>
                {deal.brand_email && (
                  <div className="flex items-center gap-2 text-white/60 break-words">
                    <Mail className="w-4 h-4 text-white/40 flex-shrink-0" />
                    <span className="flex-1">{deal.brand_email}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                      Verified
                    </span>
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
                      {(() => {
                        // Check all possible sources for phone number
                        // 1. Direct field on deal (if it exists in DB)
                        // 2. From brand submission details
                        // 3. From form_data nested in deal
                        const phoneNumber = 
                          (deal as any)?.brand_phone || 
                          brandSubmissionDetails?.companyPhone ||
                          (deal as any)?.form_data?.companyPhone ||
                          (deal as any)?.form_data?.brandPhone ||
                          null;
                        
                        // Debug log in development
                        if (import.meta.env.DEV && !phoneNumber) {
                          console.log('[DealDetailPage] Phone number sources:', {
                            'deal.brand_phone': (deal as any)?.brand_phone,
                            'brandSubmissionDetails?.companyPhone': brandSubmissionDetails?.companyPhone,
                            'deal.form_data?.companyPhone': (deal as any)?.form_data?.companyPhone,
                            'deal.form_data?.brandPhone': (deal as any)?.form_data?.brandPhone,
                            'hasBrandSubmissionDetails': !!brandSubmissionDetails,
                            'hasFormData': !!(deal as any)?.form_data,
                          });
                        }
                        
                        return phoneNumber ? (
                        <div className="flex items-center gap-2 text-white/60 flex-1">
                          <Phone className="w-4 h-4 text-white/40 flex-shrink-0" />
                            <span>{phoneNumber}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-white/40 flex-1">
                          <Phone className="w-4 h-4 text-white/30 flex-shrink-0" />
                          <span className="text-xs">No phone added (optional)</span>
                        </div>
                        );
                      })()}
                      <motion.button
                        onClick={() => {
                          // Check all possible sources for phone number
                          let phoneValue = 
                            (deal as any)?.brand_phone || 
                            brandSubmissionDetails?.companyPhone ||
                            (deal as any)?.form_data?.companyPhone ||
                            (deal as any)?.form_data?.brandPhone ||
                            '';
                          
                          // Ensure phone starts with +91 when editing
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

                  </div>
                      </div>

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

        {/* Brand Submission Details - Show at the end */}
        {brandSubmissionDetails && (
          <div className="space-y-6">
            {/* Deal Summary Card - Collapsible by default */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 shadow-lg shadow-black/20">
              <Collapsible open={showDealSummaryFull} onOpenChange={setShowDealSummaryFull}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                <span className="text-xl">📌</span>
                <h3 className="font-semibold text-lg">Deal Summary</h3>
              </div>
                    {showDealSummaryFull ? (
                      <ChevronUp className="w-5 h-5 text-white/60" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/60" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-white/60 mb-1">Brand</div>
                  <div className="text-white font-medium">{brandSubmissionDetails.brandName || 'Not provided'}</div>
                </div>
                {brandSubmissionDetails.campaignName && (
                  <div>
                    <div className="text-sm text-white/60 mb-1">Campaign</div>
                    <div className="text-white font-medium">{brandSubmissionDetails.campaignName}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-white/60 mb-1">Deal Type</div>
                  <div className="text-white font-medium capitalize">{brandSubmissionDetails.dealType || 'paid'}</div>
                </div>
                <div>
                  <div className="text-sm text-white/60 mb-1">Deal Value</div>
                  <div className="text-white font-semibold text-lg">
                    {brandSubmissionDetails.dealType === 'paid' && brandSubmissionDetails.paymentAmount
                      ? `₹${parseFloat(brandSubmissionDetails.paymentAmount.toString()).toLocaleString('en-IN')}`
                      : brandSubmissionDetails.dealType === 'barter'
                      ? 'Barter Deal'
                      : 'Not specified'}
                  </div>
                </div>
                {brandSubmissionDetails.deadline && (
                  <div className="md:col-span-2">
                    <div className="text-sm text-white/60 mb-1">Timeline</div>
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
              </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Payment Details Card - Moved to position 4 */}
            {brandSubmissionDetails.dealType === 'paid' && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 shadow-lg shadow-black/20">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">💰</span>
                  <h3 className="font-semibold text-lg">Payment Details</h3>
                </div>
                <div className="space-y-3">
                  {brandSubmissionDetails.paymentAmount && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Amount</div>
                      <div className="text-white font-semibold text-lg">₹{parseFloat(brandSubmissionDetails.paymentAmount).toLocaleString('en-IN')}</div>
                    </div>
                  )}
                  {brandSubmissionDetails.paymentTrigger && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Payment Trigger</div>
                      <div className="text-white font-medium capitalize">
                        {brandSubmissionDetails.paymentTrigger.replace(/_/g, ' ')}
                      </div>
                    </div>
                  )}
                  {brandSubmissionDetails.paymentTimeline && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Payment Timeline</div>
                      <div className="text-white font-medium capitalize">
                        {brandSubmissionDetails.paymentTimeline.replace(/_/g, ' ')}
                      </div>
                    </div>
                  )}
                  {brandSubmissionDetails.paymentMethod && brandSubmissionDetails.paymentMethod.length > 0 && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Method</div>
                      <div className="text-white font-medium">{brandSubmissionDetails.paymentMethod.join(', ')}</div>
                    </div>
                  )}
            </div>
          </div>
        )}

            {/* Rights & Usage Card - Moved to position 5 */}
            {(brandSubmissionDetails.usageRightsDuration || brandSubmissionDetails.paidAdsAllowed !== undefined || brandSubmissionDetails.whitelistingAllowed !== undefined || brandSubmissionDetails.exclusivityPeriod || brandSubmissionDetails.exclusivity || brandSubmissionDetails.usageRights || brandSubmissionDetails.cancellationTerms) && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 shadow-lg shadow-black/20">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🧾</span>
                  <h3 className="font-semibold text-lg">Rights & Usage</h3>
                </div>
                <div className="space-y-3">
                  {brandSubmissionDetails.usageRightsDuration && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Usage Duration</div>
                      <div className="text-white font-medium capitalize">
                        {brandSubmissionDetails.usageRightsDuration.replace(/_/g, ' ')}
                      </div>
                    </div>
                  )}
                  {brandSubmissionDetails.usageRights && !brandSubmissionDetails.usageRightsDuration && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Usage Rights</div>
                      <div className="text-white font-medium">{brandSubmissionDetails.usageRights}</div>
                    </div>
                  )}
                  {brandSubmissionDetails.paidAdsAllowed !== undefined && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Paid Ads Allowed?</div>
                      <div className="text-white font-medium">{brandSubmissionDetails.paidAdsAllowed ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                  {brandSubmissionDetails.whitelistingAllowed !== undefined && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Whitelisting Allowed?</div>
                      <div className="text-white font-medium">{brandSubmissionDetails.whitelistingAllowed ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                  {(brandSubmissionDetails.exclusivityPeriod || brandSubmissionDetails.exclusivity) && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Exclusivity Period</div>
                      <div className="text-white font-medium capitalize">
                        {brandSubmissionDetails.exclusivityPeriod === 'none' ? 'None' :
                          brandSubmissionDetails.exclusivityPeriod ? brandSubmissionDetails.exclusivityPeriod.replace(/_/g, ' ') :
                            brandSubmissionDetails.exclusivity}
                      </div>
                    </div>
                  )}
                  {brandSubmissionDetails.cancellationTerms && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Cancellation Terms</div>
                      <div className="text-white font-medium capitalize">
                        {brandSubmissionDetails.cancellationTerms.replace(/_/g, ' ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Approvals & Revisions Card - Moved to position 6 */}
            {(brandSubmissionDetails.approvalProcess || brandSubmissionDetails.numberOfRevisions || brandSubmissionDetails.approvalTurnaroundTime || brandSubmissionDetails.revisions || brandSubmissionDetails.postingWindow) && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 shadow-lg shadow-black/20">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🛡️</span>
                  <h3 className="font-semibold text-lg">Approvals & Revisions</h3>
                </div>
                <div className="space-y-3">
                  {brandSubmissionDetails.approvalProcess && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Approval Rule</div>
                      <div className="text-white font-medium capitalize">
                        {brandSubmissionDetails.approvalProcess.replace(/_/g, ' ')}
                      </div>
                    </div>
                  )}
                  {brandSubmissionDetails.approvalTurnaroundTime && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Turnaround Time</div>
                      <div className="text-white font-medium capitalize">
                        {brandSubmissionDetails.approvalTurnaroundTime.replace(/_/g, ' ')}
                      </div>
                    </div>
                  )}
                  {(brandSubmissionDetails.numberOfRevisions || brandSubmissionDetails.revisions) && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Revisions Count</div>
                      <div className="text-white font-medium">
                        {brandSubmissionDetails.numberOfRevisions || brandSubmissionDetails.revisions}
                      </div>
                    </div>
                  )}
                  {brandSubmissionDetails.postingWindow && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Posting Window</div>
                      <div className="text-white font-medium">{brandSubmissionDetails.postingWindow}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Barter Details Card */}
            {brandSubmissionDetails.dealType === 'barter' && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 shadow-lg shadow-black/20">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🎁</span>
                  <h3 className="font-semibold text-lg">Barter Details</h3>
                </div>
                <div className="space-y-3">
                  {brandSubmissionDetails.productDescription && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Product Description</div>
                      <div className="text-white font-medium">{brandSubmissionDetails.productDescription}</div>
                    </div>
                  )}
                  {brandSubmissionDetails.barterValue && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Barter Value</div>
                      <div className="text-white font-medium">{brandSubmissionDetails.barterValue}</div>
                    </div>
                  )}
                  {brandSubmissionDetails.barterApproximateValue && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Approximate Value</div>
                      <div className="text-white font-medium">{brandSubmissionDetails.barterApproximateValue}</div>
                    </div>
                  )}
                  {brandSubmissionDetails.barterShippingResponsibility && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Shipping Responsibility</div>
                      <div className="text-white font-medium">{brandSubmissionDetails.barterShippingResponsibility}</div>
                    </div>
                  )}
                  {brandSubmissionDetails.barterReplacementAllowed !== undefined && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Replacement Allowed</div>
                      <div className="text-white font-medium">{brandSubmissionDetails.barterReplacementAllowed ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Legal Card */}
            {(brandSubmissionDetails.governingLaw || brandSubmissionDetails.companyState) && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 shadow-lg shadow-black/20">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">⚖️</span>
                  <h3 className="font-semibold text-lg">Legal</h3>
                </div>
                <div className="space-y-3">
                  {brandSubmissionDetails.governingLaw && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Jurisdiction Country</div>
                      <div className="text-white font-medium">{brandSubmissionDetails.governingLaw}</div>
                    </div>
                  )}
                  {brandSubmissionDetails.companyState && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">State</div>
                      <div className="text-white font-medium">{brandSubmissionDetails.companyState}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Brand Details Card */}
            {(brandSubmissionDetails.companyLegalName || brandSubmissionDetails.companyGstin || brandSubmissionDetails.companyAddress || brandSubmissionDetails.authorizedSignatoryName || brandSubmissionDetails.companyEmail || brandSubmissionDetails.companyPhone) && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 shadow-lg shadow-black/20">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🏢</span>
                  <h3 className="font-semibold text-lg">Brand Details</h3>
                  {brandSubmissionDetails.companyGstin && (
                    <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                      Verified via GST
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  {brandSubmissionDetails.companyGstin && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">GSTIN</div>
                      <div className="text-white font-medium font-mono">{brandSubmissionDetails.companyGstin}</div>
                    </div>
                  )}
                  {brandSubmissionDetails.companyLegalName && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Legal Company Name</div>
                      <div className="text-white font-medium">{brandSubmissionDetails.companyLegalName}</div>
                    </div>
                  )}
                  {brandSubmissionDetails.companyAddress && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Registered Address</div>
                      <div className="text-white font-medium whitespace-pre-line">{brandSubmissionDetails.companyAddress}</div>
                    </div>
                  )}
                  {brandSubmissionDetails.authorizedSignatoryName && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Authorized Signatory Name</div>
                      <div className="text-white font-medium">{brandSubmissionDetails.authorizedSignatoryName}</div>
                    </div>
                  )}
                  {brandSubmissionDetails.companyEmail && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Contact Email</div>
                      <div className="text-white font-medium">{brandSubmissionDetails.companyEmail}</div>
                    </div>
                  )}
                  {brandSubmissionDetails.companyPhone && (
                    <div>
                      <div className="text-sm text-white/60 mb-1">Phone Number</div>
                      <div className="text-white font-medium">{brandSubmissionDetails.companyPhone}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next Steps - For Signed Agreements */}
            {isCreatorSigned && (dealExecutionStatus === 'signed' || dealExecutionStatus === 'completed' || signedContractUrl || signedAt || (deal?.status?.toLowerCase()?.includes('signed'))) && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 shadow-lg shadow-black/20 mt-6">
                <h3 className="font-semibold text-lg mb-4 text-white/90">Next steps:</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li className="flex items-start gap-2">
                    <span className="text-white/50 mt-0.5">•</span>
                    <span>Creator delivers content as per agreed timeline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/50 mt-0.5">•</span>
                    <span>Brand completes payment as agreed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/50 mt-0.5">•</span>
                    <span>Audit trail remains available for disputes or compliance</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )
        }
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
      {/* Creator Signing Modal */}
      <Dialog open={showCreatorSigningModal} onOpenChange={setShowCreatorSigningModal}>
        <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Sign Agreement
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              {creatorSigningStep === 'send'
                ? 'We will send a secure OTP to your registered email to verify your identity and sign the contract.'
                : 'Enter the 6-digit code sent to your email to complete the signing process.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {creatorSigningStep === 'send' ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-400">OTP Verification</p>
                    <p className="text-xs text-blue-400/70 mt-1">
                      Signing as: <span className="text-white">{profile?.email}</span>
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={handleSendCreatorOTP}
                  disabled={isSendingCreatorOTP}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:bg-neutral-800 disabled:text-neutral-500"
                >
                  {isSendingCreatorOTP ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Send OTP to Email
                    </>
                  )}
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-2 block">Enterprise OTP Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={creatorOTP}
                    onChange={(e) => setCreatorOTP(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:border-blue-500 outline-none transition-all placeholder:text-neutral-600 placeholder:tracking-normal"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <motion.button
                    onClick={handleVerifyCreatorOTP}
                    disabled={isVerifyingCreatorOTP || creatorOTP.length !== 6 || isSigningAsCreator}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:bg-neutral-800 disabled:text-neutral-500"
                  >
                    {isVerifyingCreatorOTP || isSigningAsCreator ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isSigningAsCreator ? 'Signing Contract...' : 'Verifying...'}
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Verify & Sign
                      </>
                    )}
                  </motion.button>

                  <button
                    onClick={() => {
                      setCreatorSigningStep('send');
                      setCreatorOTP('');
                    }}
                    disabled={isVerifyingCreatorOTP || isSigningAsCreator}
                    className="text-xs text-neutral-500 hover:text-neutral-300 py-2 transition-all uppercase tracking-wider font-bold"
                  >
                    Change Method / Resend OTP
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-neutral-500 border-t border-neutral-800 pt-4 mt-2">
            <Lock className="w-3 h-3" />
            <span>Secure Enterprise-grade E-signature powered by NoticeBazaar Armor</span>
          </div>
        </DialogContent>
      </Dialog>
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

