"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint, FaceId } from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

interface BiometricLoginProps {
  onSuccess: () => void;
}

const BiometricLogin: React.FC<BiometricLoginProps> = ({ onSuccess }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleBiometricAuth = async () => {
    if (!window.PublicKeyCredential) {
      toast.error('Biometric authentication not supported in this browser');
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

      // Create credential request
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: 'NoticeBazaar',
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(16),
            name: 'user@noticebazaar.com',
            displayName: 'NoticeBazaar User',
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
          attestation: 'direct',
        },
      });

      if (credential) {
        triggerHaptic(HapticPatterns.success);
        toast.success('Biometric authentication successful!');
        onSuccess();
      }
    } catch (error: any) {
      if (error.name !== 'NotAllowedError') {
        toast.error('Biometric authentication failed');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const Icon = isIOS ? FaceId : Fingerprint;

  return (
    <Button
      onClick={handleBiometricAuth}
      disabled={isAuthenticating}
      variant="outline"
      className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 min-h-[56px]"
    >
      <Icon className="w-5 h-5 mr-2" />
      {isAuthenticating ? 'Authenticating...' : `Continue with ${isIOS ? 'Face ID' : 'Fingerprint'}`}
    </Button>
  );
};

export default BiometricLogin;

