/**
 * useContractNegotiation - Hook for managing contract negotiation state
 * Extracted from ContractUploadFlow.tsx
 */

import { useState, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/utils/api';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import type { NegotiationState } from '@/lib/contract/types';

export interface NegotiationRequest {
  issueIds: string[];
  requestedChanges: string;
  reasoning: string;
  tone: 'professional' | 'friendly' | 'firm';
}

export interface UseContractNegotiationOptions {
  onNegotiationGenerated?: (message: string) => void;
  onError?: (error: string) => void;
}

export interface UseContractNegotiationReturn {
  // State
  negotiationState: NegotiationState;
  isGenerating: boolean;
  generatedMessage: string | null;
  
  // Actions
  generateMessage: (request: NegotiationRequest, accessToken: string) => Promise<string | null>;
  updateState: (updates: Partial<NegotiationState>) => void;
  reset: () => void;
}

const initialNegotiationState: NegotiationState = {
  selectedIssues: [],
  requestedChanges: [],
  customMessage: '',
  tone: 'professional',
  isEditing: false,
};

export function useContractNegotiation(options: UseContractNegotiationOptions = {}): UseContractNegotiationReturn {
  const { onNegotiationGenerated, onError } = options;

  const [negotiationState, setNegotiationState] = useState<NegotiationState>(initialNegotiationState);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);

  const generateMessage = useCallback(async (
    request: NegotiationRequest,
    accessToken: string
  ): Promise<string | null> => {
    if (!request.issueIds.length) {
      toast.error('Please select at least one issue to negotiate');
      return null;
    }

    setIsGenerating(true);
    triggerHaptic(HapticPatterns.medium);

    try {
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/generate-negotiation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate negotiation message');
      }

      const data = await response.json();
      const message = data.message || data.generatedMessage || '';
      
      setGeneratedMessage(message);
      triggerHaptic(HapticPatterns.success);
      
      toast.success('Negotiation message generated!');
      onNegotiationGenerated?.(message);
      
      return message;
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to generate message';
      toast.error(errorMessage);
      onError?.(errorMessage);
      triggerHaptic(HapticPatterns.error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [onNegotiationGenerated, onError]);

  const updateState = useCallback((updates: Partial<NegotiationState>) => {
    setNegotiationState(prev => ({ ...prev, ...updates }));
  }, []);

  const reset = useCallback(() => {
    setNegotiationState(initialNegotiationState);
    setGeneratedMessage(null);
    setIsGenerating(false);
  }, []);

  return {
    negotiationState,
    isGenerating,
    generatedMessage,
    generateMessage,
    updateState,
    reset,
  };
}
