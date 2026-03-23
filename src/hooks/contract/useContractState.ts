/**
 * useContractState - Central state management for contract flow
 * Extracted from ContractUploadFlow.tsx
 */

import { useState, useCallback, useMemo } from 'react';

export type ContractStep = 
  | 'upload'
  | 'select-file'
  | 'request-details'
  | 'uploading'
  | 'scanning'
  | 'analyzing'
  | 'results'
  | 'upload-error'
  | 'review-error'
  | 'validation-error';

export type DealType = 'contract' | 'barter';

export interface ContractFlowState {
  step: ContractStep;
  dealType: DealType;
  showUploadArea: boolean;
  selectedOption: 'upload' | 'request_details' | null;
  collaborationLink: string | null;
  isGeneratingLink: boolean;
}

export interface UseContractStateOptions {
  initialStep?: ContractStep;
  recommendedOption?: 'upload' | 'request_details' | null;
}

export interface UseContractStateReturn {
  // State
  state: ContractFlowState;
  
  // Computed
  isUploadingStep: boolean;
  isAnalysisStep: boolean;
  isResultsStep: boolean;
  isErrorStep: boolean;
  
  // Actions
  setStep: (step: ContractStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setDealType: (type: DealType) => void;
  toggleUploadArea: () => void;
  setSelectedOption: (option: 'upload' | 'request_details' | null) => void;
  setCollaborationLink: (link: string | null) => void;
  setIsGeneratingLink: (isGenerating: boolean) => void;
  reset: () => void;
}

const STEP_ORDER: ContractStep[] = [
  'upload',
  'select-file',
  'request-details',
  'uploading',
  'scanning',
  'analyzing',
  'results',
];

export function useContractState(options: UseContractStateOptions = {}): UseContractStateReturn {
  const { initialStep = 'upload', recommendedOption = null } = options;

  const [state, setState] = useState<ContractFlowState>({
    step: initialStep,
    dealType: 'contract',
    showUploadArea: false,
    selectedOption: recommendedOption,
    collaborationLink: null,
    isGeneratingLink: false,
  });

  // Computed values
  const isUploadingStep = useMemo(() => 
    ['upload', 'select-file', 'uploading'].includes(state.step),
    [state.step]
  );

  const isAnalysisStep = useMemo(() =>
    ['scanning', 'analyzing'].includes(state.step),
    [state.step]
  );

  const isResultsStep = useMemo(() =>
    state.step === 'results',
    [state.step]
  );

  const isErrorStep = useMemo(() =>
    ['upload-error', 'review-error', 'validation-error'].includes(state.step),
    [state.step]
  );

  // Actions
  const setStep = useCallback((step: ContractStep) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      const currentIndex = STEP_ORDER.indexOf(prev.step);
      if (currentIndex < STEP_ORDER.length - 1) {
        return { ...prev, step: STEP_ORDER[currentIndex + 1] };
      }
      return prev;
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => {
      const currentIndex = STEP_ORDER.indexOf(prev.step);
      if (currentIndex > 0) {
        return { ...prev, step: STEP_ORDER[currentIndex - 1] };
      }
      return prev;
    });
  }, []);

  const setDealType = useCallback((dealType: DealType) => {
    setState(prev => ({ ...prev, dealType }));
  }, []);

  const toggleUploadArea = useCallback(() => {
    setState(prev => ({ ...prev, showUploadArea: !prev.showUploadArea }));
  }, []);

  const setSelectedOption = useCallback((selectedOption: 'upload' | 'request_details' | null) => {
    setState(prev => ({ ...prev, selectedOption }));
  }, []);

  const setCollaborationLink = useCallback((collaborationLink: string | null) => {
    setState(prev => ({ ...prev, collaborationLink }));
  }, []);

  const setIsGeneratingLink = useCallback((isGeneratingLink: boolean) => {
    setState(prev => ({ ...prev, isGeneratingLink }));
  }, []);

  const reset = useCallback(() => {
    setState({
      step: initialStep,
      dealType: 'contract',
      showUploadArea: false,
      selectedOption: recommendedOption,
      collaborationLink: null,
      isGeneratingLink: false,
    });
  }, [initialStep, recommendedOption]);

  return {
    state,
    isUploadingStep,
    isAnalysisStep,
    isResultsStep,
    isErrorStep,
    setStep,
    nextStep,
    prevStep,
    setDealType,
    toggleUploadArea,
    setSelectedOption,
    setCollaborationLink,
    setIsGeneratingLink,
    reset,
  };
}
