/**
 * Auth Service
 * 
 * Handles all authentication and session management including:
 * - Sign in / Sign up
 * - Session management
 * - Password reset
 * - OAuth providers
 * - User context
 */

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';
import { User, Session, AuthError } from '@supabase/supabase-js';
import {
  ServiceResult,
  ok,
  fail,
  mapSupabaseError,
} from './types';

// ============================================
// Types
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  role: 'creator' | 'brand' | 'admin' | 'lawyer' | 'chartered_accountant' | 'client';
  emailVerified: boolean;
  createdAt: string;
  lastSignInAt: string | null;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  role?: AuthUser['role'];
  firstName?: string;
  lastName?: string;
}

export interface OAuthSignInInput {
  provider: 'google' | 'apple';
  redirectTo?: string;
}

export interface ResetPasswordInput {
  email: string;
  redirectTo?: string;
}

export interface UpdatePasswordInput {
  currentPassword?: string;
  newPassword: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  session: Session | null;
}

// ============================================
// Auth Service Interface
// ============================================

export interface IAuthService {
  // Authentication
  signIn(input: SignInInput): Promise<ServiceResult<AuthSession>>;
  signUp(input: SignUpInput): Promise<ServiceResult<AuthSession>>;
  signOut(): Promise<ServiceResult<void>>;
  
  // OAuth
  signInWithOAuth(input: OAuthSignInInput): Promise<ServiceResult<{ provider: string }>>;
  
  // Password Management
  resetPassword(input: ResetPasswordInput): Promise<ServiceResult<void>>;
  updatePassword(input: UpdatePasswordInput): Promise<ServiceResult<void>>;
  
  // Session Management
  getSession(): Promise<ServiceResult<AuthSession | null>>;
  refreshSession(): Promise<ServiceResult<AuthSession>>;
  getUser(): Promise<ServiceResult<AuthUser | null>>;
  
  // User Context
  getAuthState(): Promise<AuthState>;
  onAuthStateChange(callback: (state: AuthState) => void): () => void;
  
  // Role Management
  getUserRole(): Promise<ServiceResult<AuthUser['role'] | null>>;
  hasRole(role: AuthUser['role']): Promise<boolean>;
}

// ============================================
// Auth Service Implementation
// ============================================

export class AuthService implements IAuthService {
  private supabase;

  constructor(supabaseClient?: typeof supabase) {
    this.supabase = supabaseClient ?? supabase;
  }

  // ----------------------------------------
  // Authentication
  // ----------------------------------------

  async signIn(input: SignInInput): Promise<ServiceResult<AuthSession>> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      return this.handleAuthError(error);
    }

    if (!data.session || !data.user) {
      return fail('UNKNOWN_ERROR', 'Sign in failed - no session returned');
    }

    return this.transformSession(data.session, data.user);
  }

  async signUp(input: SignUpInput): Promise<ServiceResult<AuthSession>> {
    const { data, error } = await this.supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          role: input.role || 'creator',
          first_name: input.firstName,
          last_name: input.lastName,
        },
      },
    });

    if (error) {
      return this.handleAuthError(error);
    }

    // Note: User may need to verify email before session is created
    if (!data.session || !data.user) {
      // Return partial success indicating email verification needed
      return {
        success: true,
        data: {
          user: {
            id: data.user!.id,
            email: data.user!.email || input.email,
            role: (data.user!.user_metadata?.role as AuthUser['role']) || 'creator',
            emailVerified: false,
            createdAt: data.user!.created_at,
            lastSignInAt: data.user!.last_sign_in_at || null,
          },
          accessToken: '',
          refreshToken: '',
          expiresAt: 0,
        },
      };
    }

    // Create profile if new user
    if (data.user) {
      await this.ensureProfile(data.user);
    }

    return this.transformSession(data.session, data.user);
  }

  async signOut(): Promise<ServiceResult<void>> {
    const { error } = await this.supabase.auth.signOut();

    // Ignore "session missing" errors - user is already signed out
    if (error && 
        error.message !== 'Auth session missing!' && 
        error.message !== 'Invalid Refresh Token: Refresh Token Not Found') {
      return this.handleAuthError(error);
    }

    // Clear local storage
    this.clearLocalStorage();

    return ok(undefined);
  }

  // ----------------------------------------
  // OAuth
  // ----------------------------------------

  async signInWithOAuth(input: OAuthSignInInput): Promise<ServiceResult<{ provider: string }>> {
    const redirectTo = input.redirectTo || 
      (typeof window !== 'undefined' 
        ? `${window.location.origin}/creator-dashboard`
        : undefined);

    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: input.provider,
      options: {
        redirectTo,
      },
    });

    if (error) {
      return this.handleAuthError(error);
    }

    return ok({ provider: data.provider });
  }

  // ----------------------------------------
  // Password Management
  // ----------------------------------------

  async resetPassword(input: ResetPasswordInput): Promise<ServiceResult<void>> {
    const redirectTo = input.redirectTo ||
      (typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined);

    const { error } = await this.supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo,
    });

    if (error) {
      return this.handleAuthError(error);
    }

    return ok(undefined);
  }

  async updatePassword(input: UpdatePasswordInput): Promise<ServiceResult<void>> {
    const { error } = await this.supabase.auth.updateUser({
      password: input.newPassword,
    });

    if (error) {
      return this.handleAuthError(error);
    }

    return ok(undefined);
  }

  // ----------------------------------------
  // Session Management
  // ----------------------------------------

  async getSession(): Promise<ServiceResult<AuthSession | null>> {
    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      return this.handleAuthError(error);
    }

    if (!data.session) {
      return ok(null);
    }

    return this.transformSession(data.session, data.session.user);
  }

  async refreshSession(): Promise<ServiceResult<AuthSession>> {
    const { data, error } = await this.supabase.auth.refreshSession();

    if (error) {
      return this.handleAuthError(error);
    }

    if (!data.session) {
      return fail('UNKNOWN_ERROR', 'Failed to refresh session');
    }

    return this.transformSession(data.session, data.session.user);
  }

  async getUser(): Promise<ServiceResult<AuthUser | null>> {
    const { data, error } = await this.supabase.auth.getUser();

    if (error) {
      if (error.message === 'Auth session missing!') {
        return ok(null);
      }
      return this.handleAuthError(error);
    }

    if (!data.user) {
      return ok(null);
    }

    return ok(this.transformUser(data.user));
  }

  // ----------------------------------------
  // User Context
  // ----------------------------------------

  async getAuthState(): Promise<AuthState> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();

      if (error || !session) {
        return {
          isAuthenticated: false,
          isLoading: false,
          user: null,
          session: null,
        };
      }

      return {
        isAuthenticated: true,
        isLoading: false,
        user: this.transformUser(session.user),
        session,
      };
    } catch {
      return {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null,
      };
    }
  }

  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    const { data } = this.supabase.auth.onAuthStateChange(async (event, session) => {
      const state: AuthState = {
        isAuthenticated: !!session,
        isLoading: false,
        user: session ? this.transformUser(session.user) : null,
        session,
      };
      callback(state);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }

  // ----------------------------------------
  // Role Management
  // ----------------------------------------

  async getUserRole(): Promise<ServiceResult<AuthUser['role'] | null>> {
    const userResult = await this.getUser();

    if (!userResult.success) {
      return { success: false, error: userResult.error };
    }

    return ok(userResult.data?.role || null);
  }

  async hasRole(role: AuthUser['role']): Promise<boolean> {
    const result = await this.getUserRole();
    return result.success && result.data === role;
  }

  // ----------------------------------------
  // Private Helpers
  // ----------------------------------------

  private transformUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      role: (user.user_metadata?.role as AuthUser['role']) || 'creator',
      emailVerified: user.email_confirmed_at !== null,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at || null,
    };
  }

  private transformSession(session: Session, user: User): ServiceResult<AuthSession> {
    return ok({
      user: this.transformUser(user),
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at || 0,
    });
  }

  private handleAuthError<T>(error: AuthError): ServiceResult<T> {
    // Map common auth errors to service errors
    const message = error.message.toLowerCase();

    if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
      return fail('VALIDATION_ERROR', 'Invalid email or password');
    }
    if (message.includes('email not confirmed')) {
      return fail('VALIDATION_ERROR', 'Please verify your email before signing in');
    }
    if (message.includes('user already registered')) {
      return fail('VALIDATION_ERROR', 'An account with this email already exists');
    }
    if (message.includes('password')) {
      return fail('VALIDATION_ERROR', 'Password does not meet requirements');
    }
    if (message.includes('rate limit')) {
      return fail('NETWORK_ERROR', 'Too many attempts. Please try again later.');
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        originalError: error,
      },
    };
  }

  private async ensureProfile(user: User): Promise<void> {
    // Check if profile exists
    const { data: existingProfile } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      // Create profile
      await this.supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'creator',
        first_name: user.user_metadata?.first_name,
        last_name: user.user_metadata?.last_name,
      });
    }
  }

  private clearLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase.auth') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // Ignore storage errors
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

export const authService = new AuthService();
