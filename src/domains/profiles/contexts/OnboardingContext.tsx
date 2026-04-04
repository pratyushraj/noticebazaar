/**
 * Onboarding Context
 * 
 * Manages user onboarding state and progress.
 * Extracted from SessionContext for single responsibility.
 * 
 * @module domains/profiles/contexts/OnboardingContext
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../../auth';

/**
 * Onboarding step types
 */
export type OnboardingStep = 
  | 'profile_setup'
  | 'role_selection'
  | 'social_accounts'
  | 'niche_selection'
  | 'rate_card'
  | 'portfolio'
  | 'verification'
  | 'completed';

/**
 * Onboarding step configuration
 */
export interface OnboardingStepConfig {
  id: OnboardingStep;
  title: string;
  description: string;
  required: boolean;
  order: number;
}

/**
 * Onboarding progress
 */
export interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  skippedSteps: OnboardingStep[];
  percentage: number;
}

/**
 * Onboarding state
 */
export interface OnboardingState {
  isOnboarding: boolean;
  isLoading: boolean;
  progress: OnboardingProgress;
  steps: OnboardingStepConfig[];
}

/**
 * Context type
 */
export interface OnboardingContextType extends OnboardingState {
  startOnboarding: () => Promise<void>;
  completeStep: (step: OnboardingStep) => Promise<void>;
  skipStep: (step: OnboardingStep) => Promise<void>;
  goToStep: (step: OnboardingStep) => void;
  resetOnboarding: () => Promise<void>;
  isStepCompleted: (step: OnboardingStep) => boolean;
  isStepSkipped: (step: OnboardingStep) => boolean;
  getNextStep: () => OnboardingStep | null;
  getPreviousStep: () => OnboardingStep | null;
}

/**
 * Default onboarding steps configuration
 */
const DEFAULT_ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    id: 'role_selection',
    title: 'Choose Your Role',
    description: 'Are you a creator, brand, or lawyer?',
    required: true,
    order: 1,
  },
  {
    id: 'profile_setup',
    title: 'Complete Your Profile',
    description: 'Add your basic information',
    required: true,
    order: 2,
  },
  {
    id: 'social_accounts',
    title: 'Connect Social Accounts',
    description: 'Link your social media accounts',
    required: false,
    order: 3,
  },
  {
    id: 'niche_selection',
    title: 'Select Your Niche',
    description: 'Choose your content categories',
    required: false,
    order: 4,
  },
  {
    id: 'rate_card',
    title: 'Set Your Rates',
    description: 'Define your pricing for collaborations',
    required: false,
    order: 5,
  },
  {
    id: 'portfolio',
    title: 'Build Your Portfolio',
    description: 'Showcase your best work',
    required: false,
    order: 6,
  },
  {
    id: 'verification',
    title: 'Get Verified',
    description: 'Verify your identity for trust',
    required: false,
    order: 7,
  },
  {
    id: 'completed',
    title: 'All Done!',
    description: 'Your profile is ready',
    required: true,
    order: 8,
  },
];

/**
 * Default progress
 */
const DEFAULT_PROGRESS: OnboardingProgress = {
  currentStep: 'role_selection',
  completedSteps: [],
  skippedSteps: [],
  percentage: 0,
};

/**
 * Context
 */
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

/**
 * Provider component
 */
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Local state for current step navigation
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('role_selection');

  // Fetch onboarding progress from database
  const { data: onboardingData, isLoading } = useQuery({
    queryKey: ['onboarding', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('onboarding_completed, onboarding_step, onboarding_data')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as {
        onboarding_completed: boolean | null;
        onboarding_step: string | null;
        onboarding_data: { completedSteps?: string[]; skippedSteps?: string[] } | null;
      } | null;
    },
    enabled: !!user?.id,
  });

  // Calculate progress
  const progress: OnboardingProgress = React.useMemo(() => {
    if (!onboardingData) return DEFAULT_PROGRESS;

    const completedSteps = (onboardingData.onboarding_data?.completedSteps || []) as OnboardingStep[];
    const skippedSteps = (onboardingData.onboarding_data?.skippedSteps || []) as OnboardingStep[];
    const savedStep = onboardingData.onboarding_step as OnboardingStep;

    // Calculate percentage
    const totalRequiredSteps = DEFAULT_ONBOARDING_STEPS.filter(s => s.required).length;
    const completedRequiredSteps = completedSteps.filter(step =>
      DEFAULT_ONBOARDING_STEPS.find(s => s.id === step)?.required
    ).length;
    const percentage = Math.round((completedRequiredSteps / totalRequiredSteps) * 100);

    return {
      currentStep: savedStep || currentStep,
      completedSteps,
      skippedSteps,
      percentage,
    };
  }, [onboardingData, currentStep]);

  // Determine if onboarding is active
  const isOnboarding = !onboardingData?.onboarding_completed && !!user;

  // Update onboarding in database
  const updateOnboardingMutation = useMutation({
    mutationFn: async (data: {
      step?: OnboardingStep;
      completedSteps?: OnboardingStep[];
      skippedSteps?: OnboardingStep[];
      completed?: boolean;
    }) => {
      if (!user?.id) throw new Error('No user');

      const updateData: any = {};
      
      if (data.step) {
        updateData.onboarding_step = data.step;
      }
      
      if (data.completedSteps || data.skippedSteps) {
        updateData.onboarding_data = {
          ...onboardingData?.onboarding_data,
          completedSteps: data.completedSteps || progress.completedSteps,
          skippedSteps: data.skippedSteps || progress.skippedSteps,
        };
      }
      
      if (data.completed !== undefined) {
        updateData.onboarding_completed = data.completed;
      }

      const { error } = await (supabase as any)
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', user?.id] });
    },
  });

  // Start onboarding
  const startOnboarding = useCallback(async () => {
    setCurrentStep('role_selection');
    await updateOnboardingMutation.mutateAsync({
      step: 'role_selection',
      completed: false,
    });
  }, [updateOnboardingMutation]);

  // Complete a step
  const completeStep = useCallback(async (step: OnboardingStep) => {
    const newCompletedSteps = [...new Set([...progress.completedSteps, step])];
    const newSkippedSteps = progress.skippedSteps.filter(s => s !== step);
    
    const nextStep = getNextStepAfter(step);
    
    await updateOnboardingMutation.mutateAsync({
      step: nextStep || 'completed',
      completedSteps: newCompletedSteps,
      skippedSteps: newSkippedSteps,
      completed: nextStep === null,
    });

    if (nextStep) {
      setCurrentStep(nextStep);
    }
  }, [progress, updateOnboardingMutation]);

  // Skip a step
  const skipStep = useCallback(async (step: OnboardingStep) => {
    const stepConfig = DEFAULT_ONBOARDING_STEPS.find(s => s.id === step);
    if (stepConfig?.required) {
      throw new Error('Cannot skip required step');
    }

    const newSkippedSteps = [...new Set([...progress.skippedSteps, step])];
    const nextStep = getNextStepAfter(step);

    await updateOnboardingMutation.mutateAsync({
      step: nextStep || 'completed',
      skippedSteps: newSkippedSteps,
      completed: nextStep === null,
    });

    if (nextStep) {
      setCurrentStep(nextStep);
    }
  }, [progress, updateOnboardingMutation]);

  // Go to specific step
  const goToStep = useCallback((step: OnboardingStep) => {
    setCurrentStep(step);
  }, []);

  // Reset onboarding
  const resetOnboarding = useCallback(async () => {
    await updateOnboardingMutation.mutateAsync({
      step: 'role_selection',
      completedSteps: [],
      skippedSteps: [],
      completed: false,
    });
    setCurrentStep('role_selection');
  }, [updateOnboardingMutation]);

  // Check if step is completed
  const isStepCompleted = useCallback((step: OnboardingStep) => {
    return progress.completedSteps.includes(step);
  }, [progress.completedSteps]);

  // Check if step is skipped
  const isStepSkipped = useCallback((step: OnboardingStep) => {
    return progress.skippedSteps.includes(step);
  }, [progress.skippedSteps]);

  // Get next step
  const getNextStep = useCallback((): OnboardingStep | null => {
    return getNextStepAfter(currentStep);
  }, [currentStep]);

  // Get previous step
  const getPreviousStep = useCallback((): OnboardingStep | null => {
    const currentIndex = DEFAULT_ONBOARDING_STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex <= 0) return null;
    return DEFAULT_ONBOARDING_STEPS[currentIndex - 1].id;
  }, [currentStep]);

  // Helper to get next step after a given step
  function getNextStepAfter(step: OnboardingStep): OnboardingStep | null {
    const currentIndex = DEFAULT_ONBOARDING_STEPS.findIndex(s => s.id === step);
    if (currentIndex === -1 || currentIndex === DEFAULT_ONBOARDING_STEPS.length - 1) return null;
    return DEFAULT_ONBOARDING_STEPS[currentIndex + 1].id;
  }

  const value: OnboardingContextType = {
    isOnboarding,
    isLoading,
    progress,
    steps: DEFAULT_ONBOARDING_STEPS,
    startOnboarding,
    completeStep,
    skipStep,
    goToStep,
    resetOnboarding,
    isStepCompleted,
    isStepSkipped,
    getNextStep,
    getPreviousStep,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

/**
 * Hook to use onboarding context
 */
export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

export default OnboardingContext;
