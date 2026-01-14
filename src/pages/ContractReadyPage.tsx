"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Loader2,
  FileText,
  Mail,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

const ContractReadyPage = () => {
  const { token } = useParams<{ token: string }>();
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
        let apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL ||
          (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
            ? 'https://api.creatorarmour.com'
            : typeof window !== 'undefined' && window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : 'https://noticebazaar-api.onrender.com');

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
            window.location.href = `/#/contract-ready/${data.redirectToToken}`;
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
              window.location.href = `/#/contract-ready/${dealDetailsData.contractReadyToken}`;
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
              window.location.href = `/#/deal/${token}`;
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
          : 'http://localhost:3001');

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
          : 'http://localhost:3001');

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
          ? 'http://localhost:3001'
          : 'https://noticebazaar-api.onrender.com');

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
          : 'http://localhost:3001');

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
    return (
      <div className="nb-screen-height bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-white">Thank You!</h2>
          <p className="text-white/80 text-lg mb-2">
            Your response has been received and {creatorName} has been notified.
          </p>
          <p className="text-white/60 text-sm">
            You will receive an email confirmation shortly.
          </p>
        </motion.div>
      </div>
    );
  }

  const deliverablesList = parseDeliverables();

  return (
    <div className="nb-screen-height bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white pb-8 md:pb-12">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Header */}
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
            Review & Sign Collaboration Agreement
          </h2>
          <p className="text-white/60 text-xs md:text-sm">
            This agreement will become legally binding once signed by both parties.
          </p>
        </motion.div>

        {/* Contract Summary - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-xl border border-purple-400/30 rounded-2xl p-6 shadow-lg space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-purple-300" />
            <h3 className="text-lg font-semibold text-white">Contract Summary</h3>
          </div>
          <p className="text-white/50 text-xs mb-4">
            This is a summary. The full legal agreement will be generated after verification.
          </p>
          
          {/* Amount */}
          {dealInfo.deal_amount && (
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-white/70 text-sm font-medium">Amount</span>
              <span className="font-bold text-green-400 text-lg">
                ₹{Number(dealInfo.deal_amount).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {/* Deliverables */}
          {deliverablesList.length > 0 && (
            <div className="py-3 border-b border-white/10">
              <span className="text-white/70 text-sm font-medium block mb-2">Deliverables</span>
              <ul className="space-y-2 list-none">
                {deliverablesList.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-300 mt-1">▪</span>
                    <span className="text-white/90 text-sm">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rights & Usage */}
          {(dealInfo.usage_rights_duration || dealInfo.paid_ads_allowed !== undefined || dealInfo.whitelisting_allowed !== undefined) && (
            <div className="py-3 border-b border-white/10">
              <span className="text-white/70 text-sm font-medium block mb-2">Rights & Usage</span>
              <div className="space-y-1.5 text-sm">
                {dealInfo.usage_rights_duration && (
                  <p className="text-white/90">
                    <span className="text-white/70">Duration: </span>
                    {dealInfo.usage_rights_duration === '1_month' ? '1 Month' :
                     dealInfo.usage_rights_duration === '3_months' ? '3 Months' :
                     dealInfo.usage_rights_duration === '6_months' ? '6 Months' :
                     dealInfo.usage_rights_duration === '12_months' ? '12 Months' :
                     dealInfo.usage_rights_duration === 'perpetual' ? 'Perpetual' :
                     dealInfo.usage_rights_duration}
                  </p>
                )}
                {dealInfo.paid_ads_allowed !== undefined && (
                  <p className="text-white/90">
                    <span className="text-white/70">Paid Ads: </span>
                    {dealInfo.paid_ads_allowed ? 'Allowed' : 'Not Allowed'}
                  </p>
                )}
                {dealInfo.whitelisting_allowed !== undefined && (
                  <p className="text-white/90">
                    <span className="text-white/70">Whitelisting: </span>
                    {dealInfo.whitelisting_allowed ? 'Allowed' : 'Not Allowed'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment Timeline */}
          {dealInfo.payment_timeline && (
            <div className="py-3 border-b border-white/10">
              <span className="text-white/70 text-sm font-medium block mb-2">Payment Timeline</span>
              <p className="text-white/90 text-sm">
                {dealInfo.payment_timeline === 'on_delivery' ? 'On Delivery' :
                 dealInfo.payment_timeline === '7_days' ? 'Within 7 days of delivery' :
                 dealInfo.payment_timeline === '15_days' ? 'Within 15 days of delivery' :
                 dealInfo.payment_timeline === '30_days' ? 'Within 30 days of delivery' :
                 dealInfo.payment_timeline}
              </p>
            </div>
          )}

          {/* Deadline */}
          {dealInfo.due_date && (
            <div className="flex justify-between items-center py-3">
              <span className="text-white/70 text-sm font-medium">Deadline</span>
              <span className="text-white/90 text-sm font-medium">
                {new Date(dealInfo.due_date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          )}
        </motion.div>

        {/* Brand Legal Details */}
        {dealInfo.brand_address && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold mb-4">Brand Legal Details (Signing Party)</h3>
            <div className="space-y-2 text-sm">
              <p className="text-white/90">{dealInfo.brand_name}</p>
              <p className="text-white/70">{dealInfo.brand_address}</p>
              {dealInfo.brand_email && (
                <p className="text-white/70">{dealInfo.brand_email}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Creator Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-4">Creator Details (Content Creator)</h3>
            <div className="space-y-2 text-sm">
              {creatorName && creatorName !== 'Creator' && (
                <p className="text-white/90">{creatorName}</p>
              )}
              {creatorAddress && (
                <p className="text-white/70">{creatorAddress}</p>
              )}
              {creatorEmail && (
                <p className="text-white/70">{creatorEmail}</p>
              )}
              {(!creatorName || creatorName === 'Creator') && !creatorAddress && !creatorEmail && (
                <p className="text-white/60 italic">Creator information not available</p>
              )}
              {creatorName === 'Creator' && (creatorAddress || creatorEmail) && (
                <p className="text-white/60 italic text-xs mt-2">Name not available</p>
              )}
            </div>
        </motion.div>

        {/* Safety Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4"
        >
          <p className="text-white/80 text-sm text-center">
            <strong>No legal obligation yet.</strong> The agreement becomes legally binding only after OTP verification and signature.
          </p>
        </motion.div>

        {/* Signing Card - Show if OTP verified and not signed */}
        {isOTPVerified && !signature?.signed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Sign Agreement
                </h3>
                
                {/* Authorization Checkbox */}
                <div className="bg-white/5 rounded-xl p-4 mb-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAuthorizedToSign}
                      onChange={(e) => setIsAuthorizedToSign(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-white/30 bg-white/10 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 focus:ring-offset-transparent"
                    />
                    <span className="text-white/90 text-sm">
                      I confirm that I am authorized to sign on behalf of the brand and agree to the terms above.
                    </span>
                  </label>
                </div>

                <button
                  onClick={handleSign}
                  disabled={isSigning || !isOTPVerified || !isAuthorizedToSign}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {isSigning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirm & Sign Agreement
                    </>
                  )}
                </button>
                
                <p className="text-white/60 text-xs text-center mt-3">
                  This action is legally binding and will be recorded with timestamp, IP address, and device details.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Signed Successfully Card */}
        {signature?.signed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-green-500/30 text-green-400 rounded-full text-xs font-semibold">
                    Signed Successfully
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-white/90">
                    <strong>Signed By:</strong> {signature.signerName || dealInfo.brand_name}
                  </p>
                  <p className="text-white/90">
                    <strong>Signed On:</strong> {signature.signedAt 
                      ? new Date(signature.signedAt).toLocaleString('en-IN', {
                          dateStyle: 'long',
                          timeStyle: 'short'
                        })
                      : 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => setShowSignatureDetails(true)}
                  className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-all"
                >
                  View Acceptance Record
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* OTP Verification Section */}
        {!isOTPVerified && !signature?.signed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Verify & Sign Agreement
            </h3>
            <p className="text-white/60 text-sm mb-4">
              We'll verify your identity before allowing you to sign this agreement.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Email Address</label>
                <input
                  type="email"
                  value={brandEmailInput}
                  onChange={(e) => setBrandEmailInput(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-white/50 text-xs mt-2">
                  Use your official business email. This will be recorded in the contract audit trail.
                </p>
              </div>
              
              <button
                onClick={sendOTP}
                disabled={isSendingOTP || otpResendCooldown > 0}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all"
              >
                {isSendingOTP ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </span>
                ) : otpResendCooldown > 0 ? (
                  `Resend OTP in ${otpResendCooldown}s`
                ) : (
                  'Send OTP to Verify & Sign'
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
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1 text-white">Contract Document</h3>
                <p className="text-white/70 text-sm">Review the full contract document before signing</p>
              </div>
              <a
                href={dealInfo.contract_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                View Contract
              </a>
            </div>
          </motion.div>
        )}

        {/* OTP Modal */}
        {showOTPModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-purple-900 border border-purple-700 rounded-2xl p-6 max-w-md w-full overflow-hidden"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Enter OTP</h3>
                <button
                  onClick={() => setShowOTPModal(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <p className="text-white/70 text-sm mb-4">
                We've sent a 6-digit code to {brandEmail || brandEmailInput}
              </p>
              
              <div className="flex gap-2 mb-4 justify-center flex-wrap">
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
                    className="w-12 h-12 text-center text-xl font-semibold bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 flex-shrink-0"
                  />
                ))}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={verifyOTP}
                  disabled={isVerifyingOTP || otp.join('').length !== 6}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all"
                >
                  {isVerifyingOTP ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    'Verify OTP'
                  )}
                </button>
                <button
                  onClick={sendOTP}
                  disabled={isSendingOTP || otpResendCooldown > 0}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-all"
                >
                  {otpResendCooldown > 0 ? `${otpResendCooldown}s` : 'Resend'}
                </button>
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

