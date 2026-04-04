/**
 * Auth Domain Types
 * 
 * Type definitions for authentication domain.
 */

import { User, Session } from '@supabase/supabase-js';

/**
 * Authentication status
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * Supported OAuth providers
 */
export type OAuthProvider = 'google' | 'apple';

/**
 * Login credentials for email/password auth
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Signup credentials
 */
export interface SignupCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
  role?: 'creator' | 'brand';
}

/**
 * Magic link request
 */
export interface MagicLinkRequest {
  email: string;
  redirectTo?: string;
}

/**
 * OAuth callback result
 */
export interface OAuthCallbackResult {
  success: boolean;
  user: User | null;
  session: Session | null;
  error?: string;
  intendedRoute?: string;
}

/**
 * Auth context value
 */
export interface AuthContextType {
  /** Current Supabase session */
  session: Session | null;
  /** Current authenticated user */
  user: User | null;
  /** Current authentication status */
  authStatus: AuthStatus;
  /** True while initial auth check is in progress */
  isInitializing: boolean;
  /** Sign in with email/password */
  signIn: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  /** Sign up with email/password */
  signUp: (credentials: SignupCredentials) => Promise<{ success: boolean; error?: string }>;
  /** Sign out current user */
  signOut: () => Promise<void>;
  /** Sign in with OAuth provider */
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  /** Send magic link to email */
  sendMagicLink: (email: string, redirectTo?: string) => Promise<{ success: boolean; error?: string }>;
  /** Reset password */
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Auth state change event
 */
export interface AuthStateChangeEvent {
  event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'PASSWORD_RECOVERY' | 'INITIAL_SESSION';
  session: Session | null;
}
