/**
 * Profiles Domain
 * 
 * Handles user profiles, onboarding, settings, and role-based access.
 * 
 * @module domains/profiles
 */

// Contexts
export { ProfileProvider, useProfile } from './contexts/ProfileContext';
export { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';

// Types
export type {
  UserRole,
  CreatorStage,
  ProfileContextType,
  OnboardingContextType,
  SubscriptionContextType,
  TrialStatus,
  Subscription,
  ProfileUpdateInput,
  CreatorProfileUpdateInput,
  BrandProfileUpdateInput,
  ProfileCompletionStatus
} from './types';

// Onboarding types
export type {
  OnboardingStep,
  OnboardingStepConfig,
  OnboardingProgress,
} from './contexts/OnboardingContext';
