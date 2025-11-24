"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

interface BiometricLoginProps {
  onSuccess: () => void;
  mode?: 'register' | 'authenticate'; // New: support both registration and authentication
  email?: string; // Required for authentication mode
}

// Helper function to convert Base64URL to ArrayBuffer
function base64URLToArrayBuffer(base64URL: string): ArrayBuffer {
  const base64 = base64URL.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper function to convert ArrayBuffer to Base64URL
function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const BiometricLogin: React.FC<BiometricLoginProps> = ({ 
  onSuccess, 
  mode = 'register',
  email 
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { session, user } = useSession();

  const handleRegisterPasskey = async () => {
    if (!window.PublicKeyCredential) {
      toast.error('Passkeys not supported in this browser');
      return;
    }

    if (!session || !user) {
      toast.error('Please sign in first to register a passkey');
      return;
    }

    setIsAuthenticating(true);
    triggerHaptic(HapticPatterns.medium);

    try {
      // Check if WebAuthn is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      if (!available) {
        toast.error('Biometric authentication not available on this device');
        setIsAuthenticating(false);
        return;
      }

      // Get challenge from backend using Supabase client
      // For GET requests, we pass an empty body
      const { data: challengeData, error: challengeError } = await supabase.functions.invoke('passkey-challenge', {
        body: {},
      });

      if (challengeError) {
        const errorStr = String(challengeError.message || challengeError || '').toLowerCase();
        const errorStatus = (challengeError as any).status || (challengeError as any).statusCode;
        
        if (errorStatus === 404 || errorStr.includes('not found') || errorStr.includes('404')) {
          throw new Error('Passkey registration is not available yet. Please try again later.');
        }
        
        throw new Error(challengeError.message || 'Failed to get registration challenge');
      }

      if (!challengeData || (challengeData as any).error) {
        throw new Error((challengeData as any).error || 'Failed to get challenge');
      }

      const { challenge: challengeBase64, rpId } = challengeData as any;
      const challenge = base64URLToArrayBuffer(challengeBase64);

      // Get user ID as Uint8Array
      const userIdBytes = new TextEncoder().encode(user.id);

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'NoticeBazaar',
            id: rpId || window.location.hostname,
          },
          user: {
            id: userIdBytes,
            name: user.email || 'user@noticebazaar.com',
            displayName: user.email || 'NoticeBazaar User',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
          attestation: 'direct',
        },
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      // Convert credential to JSON-serializable format
      const credentialData = {
        id: credential.id,
        rawId: arrayBufferToBase64URL(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: arrayBufferToBase64URL(
            (credential.response as AuthenticatorAttestationResponse).clientDataJSON
          ),
          attestationObject: arrayBufferToBase64URL(
            (credential.response as AuthenticatorAttestationResponse).attestationObject
          ),
        },
      };

      // Register passkey with backend using Supabase client
      const { data: registerData, error: registerError } = await supabase.functions.invoke('passkey-register', {
        body: {
          credential: credentialData,
          deviceName: navigator.userAgent.includes('iPhone') ? 'iPhone' : 
                     navigator.userAgent.includes('iPad') ? 'iPad' :
                     navigator.userAgent.includes('Android') ? 'Android Device' : 'Desktop',
        },
      });

      if (registerError) {
        const errorStr = String(registerError.message || registerError || '').toLowerCase();
        const errorStatus = (registerError as any).status || (registerError as any).statusCode;
        
        if (errorStatus === 404 || errorStr.includes('not found') || errorStr.includes('404')) {
          throw new Error('Passkey registration is not available yet. Please try again later.');
        }
        
        throw new Error(registerError.message || 'Failed to register passkey');
      }

      if (!registerData || (registerData as any).error) {
        throw new Error((registerData as any).error || 'Failed to register passkey');
      }

      triggerHaptic(HapticPatterns.success);
      toast.success('Passkey registered successfully!');
      onSuccess();
    } catch (error: any) {
      if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
        console.error('Passkey registration error:', error);
        toast.error(error.message || 'Failed to register passkey');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAuthenticateWithPasskey = async () => {
    if (!window.PublicKeyCredential) {
      toast.error('Passkeys not supported in this browser');
      return;
    }

    // Validate email format
    if (!email || !email.trim()) {
      toast.error('Email is required for authentication', {
        description: 'Please enter your email address to sign in with Face ID',
      });
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address', {
        description: 'The email format is incorrect',
      });
      return;
    }

    setIsAuthenticating(true);
    triggerHaptic(HapticPatterns.medium);

    try {
      // Get challenge and allowed credentials from backend using Supabase client
      const { data: challengeData, error: challengeError } = await supabase.functions.invoke('passkey-challenge', {
        body: { email: email.trim() },
      });

      if (challengeError) {
        // Check if Edge Function is not deployed
        const errorStr = String(challengeError.message || challengeError || '').toLowerCase();
        const errorStatus = (challengeError as any).status || (challengeError as any).statusCode;
        const errorContext = (challengeError as any).context;
        
        // Try to extract more detailed error message
        let errorMessage = challengeError.message || 'Failed to get authentication challenge';
        if (errorContext?.body) {
          try {
            const body = typeof errorContext.body === 'string' ? JSON.parse(errorContext.body) : errorContext.body;
            errorMessage = body.error || body.message || errorMessage;
          } catch (e) {
            // Ignore parse errors
          }
        }
        
        if (errorStatus === 404 || errorStr.includes('not found') || errorStr.includes('404')) {
          throw new Error('Passkey authentication is not available yet. Please sign in with Google or email.');
        }
        
        if (errorStatus === 404 || errorStr.includes('user not found')) {
          throw new Error('No account found with this email. Please sign up first.');
        }
        
        if (errorStatus === 500 || errorStr.includes('server error') || errorStr.includes('configuration')) {
          throw new Error('Server error. Please try again later or use another sign-in method.');
        }
        
        throw new Error(errorMessage);
      }

      if (!challengeData || (challengeData as any).error) {
        throw new Error((challengeData as any).error || 'Failed to get challenge');
      }

      const { challenge: challengeBase64, rpId, allowCredentials } = challengeData as any;
      const challenge = base64URLToArrayBuffer(challengeBase64);

      // Convert allowCredentials to ArrayBuffer format
      const allowCredentialsArray = allowCredentials?.map((cred: any) => ({
        id: base64URLToArrayBuffer(cred.id),
        type: cred.type,
      })) || [];

      // Get credential (authentication)
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: rpId || window.location.hostname,
          allowCredentials: allowCredentialsArray,
          userVerification: 'required',
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to authenticate');
      }

      // Convert credential to JSON-serializable format
      const credentialData = {
        id: credential.id,
        rawId: arrayBufferToBase64URL(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: arrayBufferToBase64URL(
            (credential.response as AuthenticatorAssertionResponse).clientDataJSON
          ),
          authenticatorData: arrayBufferToBase64URL(
            (credential.response as AuthenticatorAssertionResponse).authenticatorData
          ),
          signature: arrayBufferToBase64URL(
            (credential.response as AuthenticatorAssertionResponse).signature
          ),
          userHandle: credential.response.userHandle ? 
            arrayBufferToBase64URL(credential.response.userHandle) : null,
        },
      };

      // Authenticate with backend using Supabase client
      const { data: authData, error: authError } = await supabase.functions.invoke('passkey-authenticate', {
        body: {
          credential: credentialData,
          email: email.trim(),
        },
      });

      if (authError) {
        const errorStr = String(authError.message || authError || '').toLowerCase();
        const errorStatus = (authError as any).status || (authError as any).statusCode;
        
        if (errorStatus === 404 || errorStr.includes('not found') || errorStr.includes('404')) {
          throw new Error('Passkey authentication is not available yet. Please sign in with Google or email.');
        }
        
        if (errorStr.includes('invalid passkey') || errorStr.includes('401')) {
          throw new Error('Passkey verification failed. Please try again or use another sign-in method.');
        }
        
        throw new Error(authError.message || 'Authentication failed');
      }

      if (!authData || (authData as any).error) {
        throw new Error((authData as any).error || 'Authentication failed');
      }

      const { userId, email: userEmail } = authData as any;

      // Create a session by signing in with passwordless OTP
      // This will send a magic link to the user's email
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: userEmail || email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        // Still show success since passkey was verified
        toast.success('Passkey verified! Please check your email to complete sign-in.');
      } else {
        triggerHaptic(HapticPatterns.success);
        toast.success('Passkey verified! Please check your email to complete sign-in.');
        // Wait a moment for the email to be sent
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Call onSuccess to allow the parent component to handle navigation
      onSuccess();
    } catch (error: any) {
      if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
        console.error('Passkey authentication error:', error);
        toast.error(error.message || 'Biometric authentication failed');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleBiometricAuth = () => {
    if (mode === 'authenticate') {
      handleAuthenticateWithPasskey();
    } else {
      handleRegisterPasskey();
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const Icon = isIOS ? ScanLine : Fingerprint;

  // For authentication mode, check if email is valid
  const isEmailValid = mode === 'authenticate' 
    ? email && email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    : true;

  const isDisabled = isAuthenticating || (mode === 'authenticate' && !isEmailValid);

  return (
    <Button
      onClick={handleBiometricAuth}
      disabled={isDisabled}
      variant="outline"
      className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon className="w-5 h-5 mr-2" />
      {isAuthenticating 
        ? (mode === 'authenticate' ? 'Authenticating...' : 'Registering...')
        : mode === 'authenticate'
          ? `Sign in with ${isIOS ? 'Face ID' : 'Fingerprint'}`
          : `Register ${isIOS ? 'Face ID' : 'Fingerprint'} Passkey`
      }
    </Button>
  );
};

export default BiometricLogin;

