/**
 * useContractAnalysis - Hook for managing contract analysis state
 * Extracted from ContractUploadFlow.tsx
 */

import { useState, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/utils/api';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import type { ContractAnalysisResult } from '@/lib/contract/types';

export interface UseContractAnalysisOptions {
  onAnalysisComplete?: (result: ContractAnalysisResult) => void;
  onAnalysisError?: (error: string) => void;
}

export interface UseContractAnalysisReturn {
  // State
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisResult: ContractAnalysisResult | null;
  analysisError: string | null;
  
  // Actions
  analyze: (contractUrl: string, accessToken: string, options?: {
    dealType?: 'contract' | 'barter';
    creatorId?: string;
    brandName?: string;
  }) => Promise<ContractAnalysisResult | null>;
  reset: () => void;
}

export function useContractAnalysis(options: UseContractAnalysisOptions = {}): UseContractAnalysisReturn {
  const { onAnalysisComplete, onAnalysisError } = options;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<ContractAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const analyze = useCallback(async (
    contractUrl: string,
    accessToken: string,
    analyzeOptions?: {
      dealType?: 'contract' | 'barter';
      creatorId?: string;
      brandName?: string;
    }
  ): Promise<ContractAnalysisResult | null> => {
    if (!contractUrl) {
      setAnalysisError('No contract URL provided');
      return null;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisError(null);
    triggerHaptic(HapticPatterns.medium);

    try {
      const apiBaseUrl = getApiBaseUrl();
      
      // Simulate progress during API call
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch(`${apiBaseUrl}/api/analyze-contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          contractUrl,
          dealType: analyzeOptions?.dealType || 'contract',
          creatorId: analyzeOptions?.creatorId,
          brandName: analyzeOptions?.brandName,
        }),
      });

      clearInterval(progressInterval);
      setAnalysisProgress(95);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      setAnalysisProgress(100);
      setAnalysisResult(result);
      triggerHaptic(HapticPatterns.success);
      
      toast.success('Contract analysis complete!');
      onAnalysisComplete?.(result);
      
      return result;
    } catch (error: any) {
      const errorMessage = error?.message || 'Analysis failed';
      setAnalysisError(errorMessage);
      toast.error(errorMessage);
      onAnalysisError?.(errorMessage);
      triggerHaptic(HapticPatterns.error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [onAnalysisComplete, onAnalysisError]);

  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setAnalysisProgress(0);
    setAnalysisResult(null);
    setAnalysisError(null);
  }, []);

  return {
    isAnalyzing,
    analysisProgress,
    analysisResult,
    analysisError,
    analyze,
    reset,
  };
}
