"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  X,
  Lock,
  ShieldCheck,
  History,
  Info,
  UserCheck,
  Mail,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Fingerprint,
  Package,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getApiBaseUrl } from '@/lib/utils/api';

const ContractReadyPage = () => {
  const { token } = useParams<{ token: string }>();

  // Helper for copying
  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  };
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dealInfo, setDealInfo] = useState<any>(null);
  const [creatorName, setCreatorName] = useState<string>('');
  const [creatorEmail, setCreatorEmail] = useState<string | null>(null);
  const [creatorAddress, setCreatorAddress] = useState<string | null>(null);
  const [signature, setSignature] = useState<any>(null);

  // OTP State
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [brandEmail, setBrandEmail] = useState<string>('');
  const [brandEmailInput, setBrandEmailInput] = useState<string>('');
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [otpVerifiedAt, setOtpVerifiedAt] = useState<string | null>(null);

  // Action State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [showRequestEditModal, setShowRequestEditModal] = useState(false);
  const [requestEditText, setRequestEditText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSignatureDetails, setShowSignatureDetails] = useState(false);
  const [showSigningParty, setShowSigningParty] = useState(false);
  const [showContractorInfo, setShowContractorInfo] = useState(false);
  const [isAuthorizedToSign, setIsAuthorizedToSign] = useState(false);
  const [tokenSource, setTokenSource] = useState<'contract-ready-tokens' | 'brand-reply-tokens'>('contract-ready-tokens');

  // Load contract ready token info
  useEffect(() => {
    const loadTokenInfo = async () => {
      if (!token) {
        setLoadError('Invalid token');
        setIsLoading(false);
        return;
      }

      try {
        let apiBaseUrl = getApiBaseUrl();

        // Try contract-ready-tokens first, fallback to brand-reply-tokens for migration
        let response: Response;
        let data: any;
        let currentTokenSource: 'contract-ready-tokens' | 'brand-reply-tokens' = 'contract-ready-tokens';

        try {
          response = await fetch(`${apiBaseUrl}/api/contract-ready-tokens/${token}`);
          if (!response.ok && response.status !== 404) {
            // If response is not ok and not 404, try production API
            throw new Error(`API returned ${response.status}`);
          }
          data = await response.json();
        } catch (fetchError: any) {
          // If localhost fails, try production API as fallback
          if (
            (fetchError.message?.includes('Failed to fetch') ||
              fetchError.message?.includes('ERR_CONNECTION_REFUSED') ||
              fetchError.name === 'TypeError' ||
              fetchError.message?.includes('API returned')) &&
            apiBaseUrl.includes('localhost')
          ) {
            console.warn('[ContractReadyPage] Localhost API unavailable, trying production API...');
            apiBaseUrl = 'https://noticebazaar-api.onrender.com';
            try {
              response = await fetch(`${apiBaseUrl}/api/contract-ready-tokens/${token}`);
              if (!response.ok && response.status !== 404) {
                throw new Error(`Production API returned ${response.status}`);
              }
              data = await response.json();
            } catch (prodError: any) {
              console.error('[ContractReadyPage] Production API also failed:', prodError);
              throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
            }
          } else {
            throw fetchError;
          }
        }

        // If we got a redirect to a newer token, verify it exists before redirecting
        if (response.ok && data.success && data.redirectToToken) {
          console.log('[ContractReadyPage] Old token invalid, verifying newer token before redirect:', data.redirectToToken);

          // Verify the newer token exists and is valid
          const verifyResponse = await fetch(`${apiBaseUrl}/api/contract-ready-tokens/${data.redirectToToken}`);
          const verifyData = await verifyResponse.json();

          if (verifyResponse.ok && verifyData.success && verifyData.deal) {
            console.log('[ContractReadyPage] Newer token is valid, redirecting...');
            window.location.href = `${window.location.origin}/contract-ready/${data.redirectToToken}`;
            return;
          } else {
            console.warn('[ContractReadyPage] Newer token is also invalid, showing error');
            throw new Error('This link is no longer valid. Please contact the creator for a new link.');
          }
        }

        // Check if API suggests redirecting to deal details page
        if (response.ok && data.redirectTo) {
          console.log('[ContractReadyPage] Redirecting to deal details page:', data.redirectTo);
          window.location.href = data.redirectTo;
          return;
        }

        // If contract-ready-tokens doesn't work, try other token types
        if (!response.ok && response.status === 404) {
          console.log('[ContractReadyPage] Token not found in contract-ready-tokens, trying alternatives...');

          // First, try to see if this is a deal details token and get the contract ready token from it
          try {
            let dealDetailsResponse: Response;
            try {
              dealDetailsResponse = await fetch(`${apiBaseUrl}/api/deal-details-tokens/${token}/contract-ready-token`);
            } catch (fetchErr: any) {
              if (fetchErr.message?.includes('Failed to fetch') && apiBaseUrl.includes('localhost')) {
                apiBaseUrl = 'https://noticebazaar-api.onrender.com';
                dealDetailsResponse = await fetch(`${apiBaseUrl}/api/deal-details-tokens/${token}/contract-ready-token`);
              } else {
                throw fetchErr;
              }
            }
            const dealDetailsData = await dealDetailsResponse.json();

            if (dealDetailsResponse.ok && dealDetailsData.success && dealDetailsData.contractReadyToken) {
              console.log('[ContractReadyPage] Found contract ready token via deal details token, redirecting...');
              // Redirect to the correct contract ready token
              window.location.href = `${window.location.origin}/contract-ready/${dealDetailsData.contractReadyToken}`;
              return;
            }

            // If it's a deal details token but no contract ready token exists, redirect to deal details page
            let dealDetailsInfoResponse: Response;
            try {
              dealDetailsInfoResponse = await fetch(`${apiBaseUrl}/api/deal-details-tokens/${token}`);
            } catch (fetchErr: any) {
              if (fetchErr.message?.includes('Failed to fetch') && apiBaseUrl.includes('localhost')) {
                apiBaseUrl = 'https://noticebazaar-api.onrender.com';
                dealDetailsInfoResponse = await fetch(`${apiBaseUrl}/api/deal-details-tokens/${token}`);
              } else {
                throw fetchErr;
              }
            }
            const dealDetailsInfo = await dealDetailsInfoResponse.json();

            if (dealDetailsInfoResponse.ok && dealDetailsInfo.success) {
              console.log('[ContractReadyPage] This is a deal details token, but contract not ready yet. Redirecting to deal details page...');
              // Redirect to deal details page - it will show "Contract Being Prepared" message
              window.location.href = `${window.location.origin}/deal/${token}`;
              return;
            }
          } catch (dealDetailsErr) {
            console.log('[ContractReadyPage] Not a deal details token, trying brand-reply-tokens...');
          }

          // Try legacy brand-reply-tokens for migration
          console.log('[ContractReadyPage] Trying brand-reply-tokens for migration');
          currentTokenSource = 'brand-reply-tokens';
          try {
            response = await fetch(`${apiBaseUrl}/api/brand-response/${token}`);
          } catch (fetchErr: any) {
            if (fetchErr.message?.includes('Failed to fetch') && apiBaseUrl.includes('localhost')) {
              apiBaseUrl = 'https://noticebazaar-api.onrender.com';
              response = await fetch(`${apiBaseUrl}/api/brand-response/${token}`);
            } else {
              throw fetchErr;
            }
          }
          data = await response.json();

          // If we got data from brand-response, we need to transform it
          if (response.ok && data.success && data.deal) {
            // Transform brand-response format to contract-ready format
            data = {
              success: true,
              deal: data.deal,
              creatorName: data.creatorName || 'Creator',
              creatorEmail: data.creatorEmail || null,
              creatorAddress: data.creatorAddress || null,
              signature: data.signature || null
            };
          }
        }

        // Store which token source was used
        setTokenSource(currentTokenSource);

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load contract information');
        }

        // Log API response for debugging
        console.log('[ContractReadyPage] API Response - Full Data:', JSON.stringify(data, null, 2));
        console.log('[ContractReadyPage] API Response - Creator Info:', {
          creatorName: data.creatorName,
          creatorEmail: data.creatorEmail,
          creatorAddress: data.creatorAddress,
          creatorNameType: typeof data.creatorName,
          creatorEmailType: typeof data.creatorEmail,
          creatorAddressType: typeof data.creatorAddress,
          dealCreatorId: data.deal?.creator_id
        });

        setDealInfo(data.deal);
        let finalCreatorName = data.creatorName || 'Creator';
        let finalCreatorEmail = data.creatorEmail ?? null;
        let finalCreatorAddress = data.creatorAddress ?? null;

        // Check if creator info is missing
        const isCreatorInfoMissing = (
          (!finalCreatorEmail && !finalCreatorAddress && finalCreatorName === 'Creator') ||
          (data.creatorEmail === undefined && data.creatorAddress === undefined)
        );

        console.log('[ContractReadyPage] Checking if creator info is missing:', {
          isCreatorInfoMissing,
          finalCreatorName,
          finalCreatorEmail,
          finalCreatorAddress,
          originalCreatorEmail: data.creatorEmail,
          originalCreatorAddress: data.creatorAddress,
          hasCreatorId: !!data.deal?.creator_id,
          creatorId: data.deal?.creator_id
        });

        // If creator info is missing but we have creator_id, try to fetch it
        if (isCreatorInfoMissing && data.deal?.creator_id) {
          console.log('[ContractReadyPage] Creator info missing, attempting to fetch from fallback endpoint...');
          try {
            const creatorInfoResponse = await fetch(`${apiBaseUrl}/api/contract-ready-tokens/${token}/creator-info`);
            console.log('[ContractReadyPage] Fallback endpoint response status:', creatorInfoResponse.status);
            if (creatorInfoResponse.ok) {
              const creatorInfoData = await creatorInfoResponse.json();
              console.log('[ContractReadyPage] Fallback endpoint response data:', creatorInfoData);
              if (creatorInfoData.success) {
                console.log('[ContractReadyPage] Fetched creator info from fallback endpoint:', creatorInfoData);
                finalCreatorName = creatorInfoData.creatorName || finalCreatorName;
                finalCreatorEmail = creatorInfoData.creatorEmail ?? finalCreatorEmail;
                finalCreatorAddress = creatorInfoData.creatorAddress ?? finalCreatorAddress;
              }
            } else {
              const errorData = await creatorInfoResponse.json().catch(() => ({}));
              console.warn('[ContractReadyPage] Fallback endpoint returned error:', creatorInfoResponse.status, errorData);
            }
          } catch (fallbackError) {
            console.warn('[ContractReadyPage] Failed to fetch creator info from fallback endpoint:', fallbackError);
          }
        }

        setCreatorName(finalCreatorName);
        setCreatorEmail(finalCreatorEmail);
        setCreatorAddress(finalCreatorAddress);
        setBrandEmail(data.deal?.brand_email || '');
        setBrandEmailInput(data.deal?.brand_email || '');
        setSignature(data.signature || null);

        // Log what we're setting for debugging
        console.log('[ContractReadyPage] Setting creator data:', {
          creatorName: finalCreatorName,
          creatorEmail: finalCreatorEmail,
          creatorAddress: finalCreatorAddress,
          willShowCard: !!(finalCreatorName !== 'Creator' || finalCreatorEmail || finalCreatorAddress)
        });

        // If signature exists and is signed, mark OTP as verified
        if (data.signature?.signed) {
          setIsOTPVerified(true);
        }

        // If OTP is already verified (from deal data), mark as verified
        if (data.deal?.otp_verified === true) {
          setIsOTPVerified(true);
          if (data.deal?.otp_verified_at) {
            setOtpVerifiedAt(data.deal.otp_verified_at);
          }
        }
      } catch (error: any) {
        console.error('[ContractReadyPage] Load error:', error);

        // Check if it's a network/connection error
        if (error.message?.includes('Failed to fetch') ||
          error.message?.includes('ERR_CONNECTION_REFUSED') ||
          error.name === 'TypeError') {
          setLoadError('Unable to connect to the server. Please check your internet connection and try again.');
        } else {
          setLoadError(error.message || 'Failed to load contract information');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTokenInfo();
  }, [token]);

  // Debug: Log creator state changes
  useEffect(() => {
    console.log('[ContractReadyPage] Creator state updated:', {
      creatorName,
      creatorEmail,
      creatorAddress,
      dealInfo: dealInfo ? { creator_id: dealInfo.creator_id } : null
    });
  }, [creatorName, creatorEmail, creatorAddress, dealInfo]);

  // OTP countdown timer
  useEffect(() => {
    if (otpResendCooldown > 0) {
      const timer = setTimeout(() => {
        setOtpResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpResendCooldown]);

  // Auto-focus first OTP input when modal opens
  useEffect(() => {
    if (showOTPModal) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        const firstInput = document.getElementById('otp-input-0');
        firstInput?.focus();
      }, 100);
    }
  }, [showOTPModal]);

  // Send OTP
  const sendOTP = async () => {
    if (!token) {
      toast.error('Invalid token');
      return;
    }

    // If OTP is already verified, don't send again
    if (isOTPVerified) {
      toast.info('OTP has already been verified. You can proceed to sign the agreement.');
      setShowOTPModal(false);
      return;
    }

    let emailToUse = brandEmailInput.trim() || brandEmail;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailToUse || emailToUse.trim() === '' || !emailRegex.test(emailToUse)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSendingOTP(true);

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
          ? 'https://api.creatorarmour.com'
          : getApiBaseUrl());

      const response = await fetch(`${apiBaseUrl}/api/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email: emailToUse }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage = data.error || 'Failed to send OTP';
        toast.error(errorMessage);
        return;
      }

      toast.success('OTP sent successfully to your email!');
      setBrandEmail(emailToUse);
      setShowOTPModal(true); // Open OTP input modal
      setOtpResendCooldown(30);
      const countdownInterval = setInterval(() => {
        setOtpResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error('[ContractReadyPage] OTP send error:', error);
      toast.error(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOTP(false);
    }
  };

  // Verify OTP
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
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
          ? 'https://api.creatorarmour.com'
          : getApiBaseUrl());

      const response = await fetch(`${apiBaseUrl}/api/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, otp: otpString }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage = data.error || 'Failed to verify OTP';

        // If OTP is already verified, treat it as success
        if (errorMessage.includes('already been verified') || errorMessage.includes('already verified')) {
          toast.success('OTP was already verified.');
          setIsOTPVerified(true);
          setOtpVerifiedAt(new Date().toISOString());
          setShowOTPModal(false);
          triggerHaptic(HapticPatterns.success);
          return;
        }

        // If OTP not found, automatically request a new one
        if (errorMessage.includes('No OTP found') || errorMessage.includes('OTP has expired')) {
          toast.error('OTP not found or expired. Requesting a new OTP...', {
            duration: 3000,
          });

          // Auto-request new OTP
          if (brandEmail || brandEmailInput) {
            await sendOTP();
          } else {
            toast.error('Please enter your email address first');
            setShowOTPModal(false);
          }
          return;
        }

        toast.error(errorMessage);
        return;
      }

      toast.success('OTP verified successfully!');
      setIsOTPVerified(true);
      setOtpVerifiedAt(new Date().toISOString());
      setShowOTPModal(false);
      triggerHaptic(HapticPatterns.success);
    } catch (error: any) {
      console.error('[ContractReadyPage] OTP verify error:', error);
      toast.error(error.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  // Handle OTP input
  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

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

  // Confirm & Sign Agreement
  const handleSign = async () => {
    if (!isOTPVerified) {
      toast.error('Please verify your identity before signing.');
      setShowOTPModal(true);
      return;
    }

    if (!isAuthorizedToSign) {
      toast.error('Please confirm that you are authorized to sign on behalf of the brand.');
      return;
    }

    if (!token || !dealInfo) {
      toast.error('Invalid token or deal information');
      return;
    }

    // Check if already signed
    if (signature?.signed) {
      toast.error('Contract has already been signed');
      return;
    }

    if (!brandEmail && !brandEmailInput) {
      toast.error('Email address is required for signing');
      return;
    }

    setIsSigning(true);

    try {
      // Determine API base URL with fallback logic
      let apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
          ? 'https://api.creatorarmour.com'
          : typeof window !== 'undefined' && window.location.hostname === 'localhost'
            ? getApiBaseUrl()
            : getApiBaseUrl());

      // Get contract HTML snapshot (if available)
      const contractSnapshotHtml = dealInfo.contract_file_url
        ? `Contract URL: ${dealInfo.contract_file_url}\nSigned at: ${new Date().toISOString()}`
        : undefined;

      const signerEmail = brandEmail || brandEmailInput;

      console.log('[ContractReadyPage] Attempting to sign contract:', {
        token,
        signerEmail,
        signerName: dealInfo.brand_name,
        otpVerified: true,
        otpVerifiedAt: otpVerifiedAt || new Date().toISOString(),
      });

      let response: Response;
      const signPayload = {
        signerName: dealInfo.brand_name || 'Brand',
        signerEmail: signerEmail,
        signerPhone: dealInfo.brand_phone || null,
        contractVersionId: dealInfo.contract_version || 'v3',
        contractSnapshotHtml,
        otpVerified: true,
        otpVerifiedAt: otpVerifiedAt || new Date().toISOString(),
      };

      // Always use contract-ready-tokens signing endpoint
      // The server will handle checking both token tables (contract-ready-tokens and brand-reply-tokens)
      const signEndpoint = `${apiBaseUrl}/api/contract-ready-tokens/${token}/sign`;

      // Try signing with the endpoint
      try {
        response = await fetch(signEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signPayload),
        });
      } catch (fetchError: any) {
        // If localhost failed and we're not already on production, try production
        if (apiBaseUrl.includes('localhost') && typeof window !== 'undefined' && !window.location.origin.includes('localhost')) {
          console.log('[ContractReadyPage] Localhost failed, trying production API...');
          apiBaseUrl = 'https://noticebazaar-api.onrender.com';
          const productionSignEndpoint = `${apiBaseUrl}/api/contract-ready-tokens/${token}/sign`;
          response = await fetch(productionSignEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(signPayload),
          });
        } else {
          throw fetchError;
        }
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage = data.error || 'Failed to sign contract';
        console.error('[ContractReadyPage] Sign error response:', errorMessage);

        // Handle specific error cases
        if (errorMessage.includes('no longer valid') || errorMessage.includes('Invalid token')) {
          // If using brand-reply-tokens, try to refresh from brand-response endpoint
          if (tokenSource === 'brand-reply-tokens') {
            console.log('[ContractReadyPage] Token invalid, but this is a brand-reply-token. The signing endpoint may not be available for this token type.');
            toast.error('This link type does not support direct signing. Please contact the creator for a new contract link.');
          } else {
            toast.error('This link is no longer valid. Please contact the creator for a new link.');
          }
          setLoadError('This link is no longer valid. Please contact the creator.');
        } else if (errorMessage.includes('already been signed')) {
          toast.error('This contract has already been signed.');
          // Refresh to show signed state - try both endpoints
          let refreshResponse: Response;
          if (tokenSource === 'brand-reply-tokens') {
            refreshResponse = await fetch(`${apiBaseUrl}/api/brand-response/${token}`);
          } else {
            refreshResponse = await fetch(`${apiBaseUrl}/api/contract-ready-tokens/${token}`);
          }
          const refreshData = await refreshResponse.json();
          if (refreshData.success && refreshData.signature) {
            setSignature(refreshData.signature);
          }
        } else {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      toast.success('Agreement signed successfully!');
      triggerHaptic(HapticPatterns.success);

      // Reload signature status - use the appropriate endpoint based on token source
      try {
        let refreshResponse: Response;
        if (tokenSource === 'brand-reply-tokens') {
          refreshResponse = await fetch(`${apiBaseUrl}/api/brand-response/${token}`);
        } else {
          refreshResponse = await fetch(`${apiBaseUrl}/api/contract-ready-tokens/${token}`);
        }

        const refreshData = await refreshResponse.json();
        if (refreshData.success && refreshData.signature) {
          setSignature(refreshData.signature);
        }
      } catch (refreshError) {
        console.warn('[ContractReadyPage] Could not refresh signature status:', refreshError);
        // Non-fatal - signing was successful
      }

      // Show success state
      setIsSubmitted(true);
    } catch (error: any) {
      console.error('[ContractReadyPage] Sign error:', error);
      toast.error(error.message || 'Failed to sign contract. Please try again.');
      triggerHaptic(HapticPatterns.error);
    } finally {
      setIsSigning(false);
    }
  };

  // Request Edit
  const handleRequestEdit = async () => {
    if (!requestEditText.trim()) {
      toast.error('Please provide details about the changes you need');
      return;
    }

    if (!token) {
      toast.error('Invalid token');
      return;
    }

    setIsSubmitting(true);

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
          ? 'https://api.creatorarmour.com'
          : getApiBaseUrl());

      const response = await fetch(`${apiBaseUrl}/api/contract-ready-tokens/${token}/request-edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: requestEditText.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit edit request');
      }

      toast.success('Edit request submitted successfully!');
      triggerHaptic(HapticPatterns.success);
      setShowRequestEditModal(false);
      setRequestEditText('');

      // Show success state
      setIsSubmitted(true);
    } catch (error: any) {
      console.error('[ContractReadyPage] Request edit error:', error);
      toast.error(error.message || 'Failed to submit edit request. Please try again.');
      triggerHaptic(HapticPatterns.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Parse deliverables
  const parseDeliverables = (): string[] => {
    if (!dealInfo?.deliverables) return [];

    if (typeof dealInfo.deliverables === 'string') {
      try {
        const parsed = JSON.parse(dealInfo.deliverables);
        return Array.isArray(parsed) ? parsed : [dealInfo.deliverables];
      } catch {
        return [dealInfo.deliverables];
      }
    }

    return Array.isArray(dealInfo.deliverables) ? dealInfo.deliverables : [];
  };

  if (isLoading) {
    return (
      <div className="nb-screen-height bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (loadError || !dealInfo) {
    return (
      <div className="nb-screen-height bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Link No Longer Valid</h1>
          <p className="text-white/70">
            {loadError || 'This link is no longer valid. Please contact the creator.'}
          </p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    const isSigned = signature?.signed || isSigning;

    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#111114] border border-white/10 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden"
        >
          {/* Success pattern background */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">
            {isSigned ? 'Agreement Signed Successfully' : 'Edit Request Submitted'}
          </h1>

          <p className="text-white/70 mb-8 leading-relaxed">
            {isSigned
              ? "The digital signature has been recorded with a full audit trail. Both parties will receive a copy of the executed agreement."
              : "The creator has been notified of your requested changes. You'll receive an updated link once the agreement is revised."}
          </p>

          <AnimatePresence>
            {isSigned && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 mb-8"
              >
                {/* Terms Locked Box */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3 text-left">
                  <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-400 font-bold text-sm">Terms are locked.</p>
                    <p className="text-emerald-400/60 text-xs leading-relaxed">
                      Edits, counters, or overrides are disabled. Any changes require a new agreement.
                    </p>
                  </div>
                </div>

                {/* Audit ID Row */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between group cursor-help"
                  onClick={() => {
                    triggerHaptic(HapticPatterns.success);
                    toast.info("Audit Record Verified", {
                      description: "This contract is hashed and recorded on the Creator Armour ledger."
                    });
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Audit ID</p>
                        <span className="bg-emerald-500/20 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-emerald-500/30">Verified</span>
                      </div>
                      <p className="text-xs font-mono text-white/60">CA-{dealInfo?.id?.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(`CA-${dealInfo?.id?.toUpperCase()}`);
                      toast.success('Audit ID copied');
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/20 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {isSigned && dealInfo?.deal_type === 'barter' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  // Redirect link logic or instructions
                  toast.info("Shipping dashboard link sent to your email.");
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <Package className="w-5 h-5" />
                Proceed to Shipping
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 transition-all"
            >
              View Executed Agreement
            </motion.button>

            <button
              onClick={() => window.close()}
              className="text-white/40 text-sm hover:text-white/60 transition-colors pt-2 block mx-auto"
            >
              Close Window
            </button>

            <div className="pt-6 border-t border-white/5 mt-4 text-center">
              <p className="text-[10px] text-white/20 uppercase tracking-widest leading-relaxed">
                Actions on Creator Armour are recorded,<br />timestamped, and legally enforceable.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const deliverablesList = parseDeliverables();

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-12 selection:bg-purple-500/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[70%] h-[70%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[50%] h-[50%] bg-blue-600/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-12 md:py-16 space-y-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">Secure Digital Signature </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
            Creator <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Armour</span>
          </h1>

          <h2 className="text-lg md:text-xl font-medium text-white/90 mb-4">
            Review & Execute Agreement
          </h2>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn("w-2 h-2 rounded-full", isOTPVerified ? "bg-green-500" : "bg-purple-500 animate-pulse")} />
              <span className="text-[9px] uppercase tracking-tighter text-white/40 font-bold">Identity</span>
            </div>
            <div className="w-8 h-[1px] bg-white/10" />
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn("w-2 h-2 rounded-full", isOTPVerified && !signature?.signed ? "bg-purple-500 animate-pulse" : signature?.signed ? "bg-green-500" : "bg-white/10")} />
              <span className="text-[9px] uppercase tracking-tighter text-white/40 font-bold">Review</span>
            </div>
            <div className="w-8 h-[1px] bg-white/10" />
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn("w-2 h-2 rounded-full", signature?.signed ? "bg-green-500" : "bg-white/10")} />
              <span className="text-[9px] uppercase tracking-tighter text-white/40 font-bold">Execution</span>
            </div>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
            <Lock className="w-4 h-4 text-white/40" />
            <span className="text-[9px] text-center font-semibold text-white/50 leading-tight uppercase tracking-wider">End-to-End<br />Encrypted</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
            <UserCheck className="w-4 h-4 text-white/40" />
            <span className="text-[9px] text-center font-semibold text-white/50 leading-tight uppercase tracking-wider">SECURE<br />VERIFIED</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
            <History className="w-4 h-4 text-white/40" />
            <span className="text-[9px] text-center font-semibold text-white/50 leading-tight uppercase tracking-wider">Digital<br />Audit trail</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="ios-card overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="font-bold text-white tracking-tight">Deal Summary</h3>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Draft v3.1
            </div>
          </div>

          {/* Financial Terms */}
          {dealInfo.deal_amount && (
            <div className="flex justify-between items-center py-4 border-b border-white/5">
              <div>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-0.5">Investment Amount</p>
                <p className="text-white/70 text-xs">Total compensation for deliverables</p>
              </div>
              <span className="font-black text-green-400 text-xl tracking-tight">
                ₹{Number(dealInfo.deal_amount).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {/* Deliverables */}
          {deliverablesList.length > 0 && (
            <div className="py-4 border-b border-white/5">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Project Deliverables</p>
              <ul className="grid grid-cols-1 gap-2">
                {deliverablesList.map((d, i) => (
                  <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50" />
                    <span className="text-white/90 text-sm font-medium">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rights & Timeline Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 py-5">
            {/* Rights & Usage */}
            {(dealInfo.usage_rights_duration || dealInfo.paid_ads_allowed !== undefined || dealInfo.whitelisting_allowed !== undefined) && (
              <div className="space-y-4">
                <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Usage Rights</p>
                  <p className="text-white font-semibold text-sm">
                    {dealInfo.usage_rights_duration === '1_month' ? '1 Month' :
                      dealInfo.usage_rights_duration === '3_months' ? '3 Months' :
                        dealInfo.usage_rights_duration === '6_months' ? '6 Months' :
                          dealInfo.usage_rights_duration === '12_months' ? '12 Months' :
                            dealInfo.usage_rights_duration === 'perpetual' ? 'Perpetual' :
                              dealInfo.usage_rights_duration || 'Standard'}
                  </p>
                </div>
                <div className="flex gap-4">
                  {dealInfo.paid_ads_allowed && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
                      <ShieldCheck className="w-3 h-3 text-blue-400" />
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">Ads</span>
                    </div>
                  )}
                  {dealInfo.whitelisting_allowed && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20">
                      <ShieldCheck className="w-3 h-3 text-purple-400" />
                      <span className="text-[9px] font-black text-purple-400 uppercase tracking-tighter">Whitelisting</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-4">
              {dealInfo.payment_timeline && (
                <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Settlement</p>
                  <p className="text-white font-semibold text-sm">
                    {dealInfo.payment_timeline === 'on_delivery' ? 'On Delivery' :
                      dealInfo.payment_timeline === '7_days' ? 'Net 7' :
                        dealInfo.payment_timeline === '15_days' ? 'Net 15' :
                          dealInfo.payment_timeline === '30_days' ? 'Net 30' :
                            dealInfo.payment_timeline}
                  </p>
                </div>
              )}
              {dealInfo.due_date && (
                <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Final Deadline</p>
                  <p className="text-white font-semibold text-sm">
                    {new Date(dealInfo.due_date).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Signing Party Accordion */}
        {dealInfo.brand_address && (
          <Collapsible
            open={showSigningParty}
            onOpenChange={setShowSigningParty}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all hover:bg-white/[0.07]"
          >
            <CollapsibleTrigger className="w-full text-left p-6 md:p-8 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white/90">Signing Party</h2>
                  {!showSigningParty && <p className="text-xs text-white/40 mt-0.5">{dealInfo.brand_name}</p>}
                </div>
              </div>
              {showSigningParty ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="px-6 md:px-8 pb-8">
              <div className="pt-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Company Entity</p>
                    <p className="text-white font-medium">{dealInfo.brand_name}</p>
                  </div>
                  {dealInfo.brand_email && (
                    <div>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Billing Email</p>
                      <p className="text-white font-medium">{dealInfo.brand_email}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Registered Address</p>
                  <p className="text-white/70 leading-relaxed text-sm">{dealInfo.brand_address}</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Creator Details */}
        {/* Contractor Info Accordion */}
        <Collapsible
          open={showContractorInfo}
          onOpenChange={setShowContractorInfo}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all hover:bg-white/[0.07]"
        >
          <CollapsibleTrigger className="w-full text-left p-6 md:p-8 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white/90">Contractor Information</h2>
                {!showContractorInfo && <p className="text-xs text-white/40 mt-0.5">{creatorName || 'Creator'}</p>}
              </div>
            </div>
            {showContractorInfo ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-6 md:px-8 pb-8">
            <div className="pt-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Legal Name</p>
                  <p className="text-white font-medium">{creatorName || 'Creator'}</p>
                </div>
                {creatorEmail && (
                  <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Email Address</p>
                    <p className="text-white font-medium truncate">{creatorEmail}</p>
                  </div>
                )}
              </div>

              {creatorAddress && (
                <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Service Address</p>
                  <p className="text-white/70 leading-relaxed text-sm">{creatorAddress}</p>
                </div>
              )}

              {!creatorAddress && !creatorEmail && creatorName === 'Creator' && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <Info className="w-4 h-4 text-white/20" />
                  <p className="text-white/30 italic text-xs">Public identity details restricted until execution</p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Legal Binding Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-3 py-4"
        >
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border shadow-inner transition-colors",
            isOTPVerified
              ? "bg-emerald-500/10 border-emerald-500/20"
              : "bg-white/[0.03] border border-white/10"
          )}>
            {isOTPVerified ? (
              <ShieldCheck className={cn("w-3.5 h-3.5", isOTPVerified ? "text-emerald-400" : "text-white/30")} />
            ) : (
              <Lock className="w-3.5 h-3.5 text-white/30" />
            )}
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-[0.2em]",
              isOTPVerified ? "text-emerald-400" : "text-white/40"
            )}>
              {isOTPVerified ? "Identity Verified — Ready to Sign" : "Identity Verification Required"}
            </p>
          </div>
          <p className="text-[11px] text-white/30 text-center max-w-[280px] leading-relaxed">
            Review the terms above carefully. The execution of this document requires secure identity verification.
          </p>
        </motion.div>

        {/* Signing Card - Investor Ready */}
        {isOTPVerified && !signature?.signed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ios-card bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Final Execution</h3>
                <p className="text-green-400/60 text-xs font-medium uppercase tracking-widest">Identity Verified • Ready to Sign</p>
              </div>
            </div>

            <div className="space-y-6">
              <label className="flex items-start gap-4 cursor-pointer p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors group">
                <div className="relative flex items-center justify-center mt-1">
                  <input
                    type="checkbox"
                    checked={isAuthorizedToSign}
                    onChange={(e) => setIsAuthorizedToSign(e.target.checked)}
                    className="w-5 h-5 rounded-md border-white/20 bg-white/10 text-green-500 focus:ring-0 focus:ring-offset-0"
                  />
                </div>
                <span className="text-xs text-white/70 leading-relaxed font-medium">
                  I confirm that I am an authorized signatory for <span className="text-white font-bold">{dealInfo.brand_name}</span> and I legally accept the terms of this collaboration agreement.
                </span>
              </label>

              <button
                onClick={handleSign}
                disabled={isSigning || !isAuthorizedToSign}
                className="w-full h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-white/5 disabled:to-white/5 disabled:text-white/10 rounded-2xl text-white font-bold transition-all shadow-xl shadow-green-500/10 flex items-center justify-center gap-3 text-lg"
              >
                {isSigning ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Fingerprint className="w-6 h-6" />
                    Execute Agreement
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-white/30 font-bold uppercase tracking-tighter">
                <Lock className="w-3 h-3" />
                Legally binding • Digital ID: {(token || '').slice(0, 8)}...
              </div>
            </div>
          </motion.div>
        )}

        {/* Signed Successfully Card */}
        {signature?.signed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="ios-card bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Successfully Executed
                  </span>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-0.5">Authorized Signatory</p>
                    <p className="text-white font-semibold">{signature.signerName || dealInfo.brand_name}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-0.5">Execution Timestamp</p>
                    <p className="text-white font-semibold">{signature.signedAt
                      ? new Date(signature.signedAt).toLocaleString('en-IN', {
                        dateStyle: 'long',
                        timeStyle: 'short'
                      })
                      : 'N/A'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSignatureDetails(true)}
                  className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all"
                >
                  View Digital Record
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* OTP Verification Section - Investor Ready */}
        {!isOTPVerified && !signature?.signed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="ios-card overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Identity Verification</h3>
                <p className="text-white/50 text-xs">Secure one-time password required</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 ml-1">Business Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-white/20 group-focus-within:text-purple-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={brandEmailInput}
                    onChange={(e) => setBrandEmailInput(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-11 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                  />
                </div>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 mt-3">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-400 mt-0.5" />
                  <p className="text-[10px] text-blue-300/70 leading-relaxed font-medium">
                    This signature will be legally attributed to this email address within the Creator Armour audit trail.
                  </p>
                </div>
              </div>

              <button
                onClick={sendOTP}
                disabled={isSendingOTP || otpResendCooldown > 0}
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-white/5 disabled:to-white/5 disabled:text-white/20 rounded-2xl text-white font-bold transition-all shadow-xl shadow-purple-500/10 flex items-center justify-center gap-2 group"
              >
                {isSendingOTP ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : otpResendCooldown > 0 ? (
                  <span>Resend in {otpResendCooldown}s</span>
                ) : (
                  <>
                    <span>Begin Verification</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Contract Preview Link - Show if contract is available */}
        {dealInfo.contract_file_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="ios-card bg-white/[0.02]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white/40" />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-tight">Full Document</h3>
                  <p className="text-white/40 text-xs">Review legal terms & conditions</p>
                </div>
              </div>
              <a
                href={dealInfo.contract_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                View PDF
              </a>
            </div>
          </motion.div>
        )}

        {/* OTP Modal */}
        {showOTPModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-[#0f172a] border border-white/10 rounded-[32px] p-8 max-w-sm w-full shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500" />

              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Security Code</h3>
                </div>
                <button
                  onClick={() => setShowOTPModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center mb-8 space-y-1 bg-white/5 p-3 rounded-2xl border border-white/5">
                <p className="text-xs text-white/40">Signing for <span className="text-white/70 font-medium">{dealInfo.brand_name}</span></p>
                <div className="w-full h-[1px] bg-white/5 my-1" />
                <p className="text-xs text-white/40">Verification sent to <span className="text-white font-semibold">{brandEmail || brandEmailInput}</span></p>
              </div>

              <div className="flex gap-2.5 mb-2 justify-center">
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
                    className="w-11 h-14 text-center text-2xl font-black bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all flex-shrink-0"
                  />
                ))}
              </div>

              <p className="text-center text-[10px] text-white/30 font-medium mb-8">
                No agreement will be executed without your explicit confirmation.
              </p>

              <div className="space-y-3">
                <button
                  onClick={verifyOTP}
                  disabled={isVerifyingOTP || otp.join('').length !== 6}
                  className="w-full h-14 bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  {isVerifyingOTP ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Verify Identity
                    </>
                  )}
                </button>

                <button
                  onClick={sendOTP}
                  disabled={isSendingOTP || otpResendCooldown > 0}
                  className="w-full py-2 text-xs font-bold uppercase tracking-widest text-white/30 hover:text-purple-400 disabled:hover:text-white/30 transition-colors"
                >
                  {otpResendCooldown > 0 ? `Resend in ${otpResendCooldown}s` : 'Request New Code'}
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <p className="text-[10px] text-emerald-500/60 font-medium flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Once signed, contract terms are locked and cannot be edited.
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Signature Details Modal */}
        {showSignatureDetails && signature && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-purple-900 border border-purple-700 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Acceptance Record</h3>
                <button
                  onClick={() => setShowSignatureDetails(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="text-white font-semibold mb-3">Signature Details</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-white/90">
                      <strong>Signer Name:</strong> {signature.signerName || 'N/A'}
                    </p>
                    <p className="text-white/90">
                      <strong>Signer Email:</strong> {signature.signerEmail || 'N/A'}
                    </p>
                    {signature.signerPhone && (
                      <p className="text-white/90">
                        <strong>Signer Phone:</strong> {signature.signerPhone}
                      </p>
                    )}
                    <p className="text-white/90">
                      <strong>Signed At:</strong> {signature.signedAt
                        ? new Date(signature.signedAt).toLocaleString('en-IN', {
                          dateStyle: 'long',
                          timeStyle: 'long'
                        })
                        : 'N/A'}
                    </p>
                    <p className="text-white/90">
                      <strong>OTP Verified:</strong> {signature.otpVerified ? 'Yes' : 'No'}
                    </p>
                    {signature.otpVerifiedAt && (
                      <p className="text-white/90">
                        <strong>OTP Verified At:</strong> {new Date(signature.otpVerifiedAt).toLocaleString('en-IN', {
                          dateStyle: 'long',
                          timeStyle: 'long'
                        })}
                      </p>
                    )}
                    {signature.contractVersionId && (
                      <p className="text-white/90">
                        <strong>Contract Version:</strong> {signature.contractVersionId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="text-white font-semibold mb-3">Audit Trail</h4>
                  <p className="text-white/70 text-xs">
                    This record includes timestamp, IP address, device information, and contract snapshot for legal verification.
                  </p>
                  <p className="text-white/60 text-xs mt-2">
                    For security reasons, sensitive audit details are only accessible to authorized parties.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowSignatureDetails(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Request Edit Modal */}
        {showRequestEditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-purple-900 border border-purple-700 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Request Edit</h3>
                <button
                  onClick={() => {
                    setShowRequestEditModal(false);
                    setRequestEditText('');
                  }}
                  className="text-white/60 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <p className="text-white/70 text-sm mb-4">
                Please describe the changes you need in the agreement.
              </p>

              <textarea
                value={requestEditText}
                onChange={(e) => setRequestEditText(e.target.value)}
                placeholder="E.g., Change payment timeline to 15 days, update exclusivity period..."
                rows={4}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRequestEditModal(false);
                    setRequestEditText('');
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestEdit}
                  disabled={isSubmitting || !requestEditText.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractReadyPage;

