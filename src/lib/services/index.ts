/**
 * Services Index
 * 
 * Central export point for all domain services.
 * Import services from here for consistency.
 */

// Base types and utilities
export * from './types';

// Domain services
export { dealService, DealService } from './dealService';
export type { 
  IDealService,
  DealStatus,
  DealStage,
  CreateDealInput,
  UpdateDealInput,
  DealFilters,
  DealQueryOptions,
  DealStats,
} from './dealService';

export { creatorService, CreatorService } from './creatorService';
export type {
  ICreatorService,
  CreatorProfile,
  UpdateCreatorInput,
  CreatorStats,
  PlatformConnection,
} from './creatorService';

export { brandService, BrandService } from './brandService';
export type {
  IBrandService,
  BrandProfile,
  BrandReviewInput,
  BrandFilters,
  BrandQueryOptions,
  OpportunityInput,
  OpportunityFilters,
  OpportunityQueryOptions,
  BrandInteraction,
} from './brandService';

export { authService, AuthService } from './authService';
export type {
  IAuthService,
  AuthUser,
  AuthSession,
  SignInInput,
  SignUpInput,
  OAuthSignInInput,
  ResetPasswordInput,
  UpdatePasswordInput,
  AuthState,
} from './authService';

// Existing services (keep for backwards compatibility)
export * from './fileService';
export * from './invoiceService';
export * from './searchService';
