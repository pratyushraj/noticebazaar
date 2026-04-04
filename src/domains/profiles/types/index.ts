/**
 * Profile Domain Types
 * 
 * Type definitions for user profiles, onboarding, and settings.
 */

import { Profile } from '@/types';

/**
 * User role types
 */
export type UserRole = 'client' | 'admin' | 'chartered_accountant' | 'creator' | 'lawyer' | 'brand';

/**
 * Creator onboarding stage
 */
export type CreatorStage = 'new' | 'priced' | 'link_shared' | 'first_offer' | 'first_deal' | 'active' | 'power';

/**
 * Profile context value
 */
export interface ProfileContextType {
  /** User profile data */
  profile: Profile | null;
  /** True while profile is being fetched */
  loading: boolean;
  /** True if user has admin role */
  isAdmin: boolean;
  /** True if user has creator role */
  isCreator: boolean;
  /** True if user has brand role */
  isBrand: boolean;
  /** True if user has lawyer role */
  isLawyer: boolean;
  /** True if user has CA role */
  isCA: boolean;
  /** User's organization ID if applicable */
  organizationId: string | null;
  /** Refetch profile from server */
  refetchProfile: () => Promise<void>;
  /** Update profile fields */
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Onboarding context value
 */
export interface OnboardingContextType {
  /** Current onboarding step (0-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** True if onboarding is complete */
  isComplete: boolean;
  /** Profile completion percentage (0-100) */
  completionPercentage: number;
  /** Go to next step */
  nextStep: () => void;
  /** Go to previous step */
  prevStep: () => void;
  /** Go to specific step */
  goToStep: (step: number) => void;
  /** Mark onboarding as complete */
  completeOnboarding: () => Promise<void>;
  /** Update onboarding data */
  updateOnboardingData: (data: Record<string, any>) => void;
  /** Current onboarding data */
  onboardingData: Record<string, any>;
}

/**
 * Subscription context value
 */
export interface SubscriptionContextType {
  /** Trial status information */
  trialStatus: TrialStatus;
  /** Current subscription if any */
  subscription: Subscription | null;
  /** True if trial is active */
  isTrialActive: boolean;
  /** Days remaining in trial */
  daysRemaining: number;
  /** True if trial has expired */
  isExpired: boolean;
  /** True if trial is locked due to expiration */
  isLocked: boolean;
}

/**
 * Trial status details
 */
export interface TrialStatus {
  isTrial: boolean;
  isExpired: boolean;
  daysLeft: number;
  trialLocked: boolean;
  trialStartedAt: string | null;
  trialExpiresAt: string | null;
}

/**
 * Subscription details (placeholder - adjust based on actual schema)
 */
export interface Subscription {
  id: string;
  plan: string;
  status: 'active' | 'canceled' | 'expired';
  currentPeriodEnd: string;
}

/**
 * Profile update input
 */
export interface ProfileUpdateInput {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
  bio?: string;
  username?: string;
  instagram_handle?: string;
  youtube_channel_id?: string;
  tiktok_handle?: string;
  twitter_handle?: string;
  website_url?: string;
}

/**
 * Creator profile update input
 */
export interface CreatorProfileUpdateInput extends ProfileUpdateInput {
  creator_category?: string;
  content_niches?: string[];
  open_to_collabs?: boolean;
  avg_rate_reel?: number;
  reel_price?: number;
  story_price?: number;
  post_price?: number;
  barter_min_value?: number;
  delivery_days?: number;
  revisions?: number;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_upi?: string;
  gst_number?: string;
  pan_number?: string;
}

/**
 * Brand profile update input
 */
export interface BrandProfileUpdateInput extends ProfileUpdateInput {
  business_name?: string;
  gstin?: string;
  business_entity_type?: string;
  brand_website?: string;
  brand_description?: string;
}

/**
 * Profile completion status for each section
 */
export interface ProfileCompletionStatus {
  basic: boolean;
  social: boolean;
  pricing: boolean;
  bank: boolean;
  mediaKit: boolean;
  overall: number; // 0-100
}
