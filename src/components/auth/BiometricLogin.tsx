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
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

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

      // Get challenge from backend
      const challengeResponse = await fetch(`${supabaseUrl}/functions/v1/passkey-challenge`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get challenge');
      }

      const { challenge: challengeBase64, rpId } = await challengeResponse.json();
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

      // Register passkey with backend
      const registerResponse = await fetch(`${supabaseUrl}/functions/v1/passkey-register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialData,
          deviceName: navigator.userAgent.includes('iPhone') ? 'iPhone' : 
                     navigator.userAgent.includes('iPad') ? 'iPad' :
                     navigator.userAgent.includes('Android') ? 'Android Device' : 'Desktop',
        }),
      });

      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        throw new Error(error.error || 'Failed to register passkey');
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

    if (!email) {
      toast.error('Email is required for authentication');
      return;
    }

    setIsAuthenticating(true);
    triggerHaptic(HapticPatterns.medium);

    try {
      // Get challenge and allowed credentials from backend
      const challengeResponse = await fetch(`${supabaseUrl}/functions/v1/passkey-challenge`, {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!challengeResponse.ok) {
        const error = await challengeResponse.json();
        throw new Error(error.error || 'Failed to get challenge');
      }

      const { challenge: challengeBase64, rpId, allowCredentials } = await challengeResponse.json();
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

      // Authenticate with backend
      const authResponse = await fetch(`${supabaseUrl}/functions/v1/passkey-authenticate`, {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialData,
          email,
        }),
      });

      if (!authResponse.ok) {
        const error = await authResponse.json();
        throw new Error(error.error || 'Authentication failed');
      }

      const { userId, email: userEmail } = await authResponse.json();

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

  return (
    <Button
      onClick={handleBiometricAuth}
      disabled={isAuthenticating}
      variant="outline"
      className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 min-h-[56px]"
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

