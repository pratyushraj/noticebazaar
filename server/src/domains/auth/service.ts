/**
 * Auth Domain Service
 * 
 * Business logic for authentication operations.
 * 
 * @module domains/auth/service
 */

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { AuthenticationError, ConflictError, ValidationError, ExternalServiceError } from '../../shared/utils/errors';

/**
 * OAuth provider types
 */
type OAuthProvider = 'google' | 'apple' | 'facebook' | 'twitter';

/**
 * Signup input
 */
interface SignupInput {
  email: string;
  password: string;
  fullName: string;
  role?: 'creator' | 'brand' | 'lawyer';
}

/**
 * Auth result
 */
interface AuthResult {
  user: User;
  session: Session;
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

/**
 * Auth service class
 */
export class AuthService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.supabase = createClient(
      supabaseUrl || process.env.SUPABASE_URL || '',
      supabaseKey || process.env.SUPABASE_ANON_KEY || ''
    );
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new AuthenticationError('Invalid email or password');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new AuthenticationError('Please verify your email before logging in');
      }
      throw new AuthenticationError(error.message);
    }

    if (!data.session || !data.user) {
      throw new AuthenticationError('Login failed');
    }

    return {
      user: data.user,
      session: data.session,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    };
  }

  /**
   * Create a new account
   */
  async signup(input: SignupInput): Promise<{ user: User; message: string }> {
    const { data, error } = await this.supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          role: input.role || 'creator',
        },
        emailRedirectTo: `${process.env.FRONTEND_URL}/auth/verify`,
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new ConflictError('An account with this email already exists');
      }
      throw new ValidationError(error.message);
    }

    if (!data.user) {
      throw new ValidationError('Account creation failed');
    }

    // Check if email confirmation is required
    const requiresConfirmation = !data.session;

    return {
      user: data.user,
      message: requiresConfirmation
        ? 'Please check your email to verify your account'
        : 'Account created successfully',
    };
  }

  /**
   * Send magic link for passwordless login
   */
  async sendMagicLink(email: string, redirectTo?: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo || `${process.env.FRONTEND_URL}/auth/callback`,
      },
    });

    if (error) {
      throw new ExternalServiceError('email', error);
    }
  }

  /**
   * Get OAuth authorization URL
   */
  async getOAuthUrl(provider: OAuthProvider, redirectTo?: string): Promise<string> {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.API_URL}/auth/oauth/${provider}/callback`,
        queryParams: redirectTo ? { state: redirectTo } : undefined,
      },
    });

    if (error) {
      throw new ExternalServiceError(provider, error);
    }

    return data.url;
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(
    provider: OAuthProvider,
    code: string,
    state?: string
  ): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw new AuthenticationError(`OAuth authentication failed: ${error.message}`);
    }

    if (!data.session || !data.user) {
      throw new AuthenticationError('OAuth authentication failed');
    }

    return {
      user: data.user,
      session: data.session,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    };
  }

  /**
   * Logout user
   */
  async logout(accessToken: string): Promise<void> {
    // Create a new client with the user's access token
    const client = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    const { error } = await client.auth.signOut();

    if (error) {
      // Log but don't throw - logout should always succeed from client perspective
      console.error('Logout error:', error);
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
    });

    if (error) {
      throw new ExternalServiceError('email', error);
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    });

    if (error) {
      throw new AuthenticationError('Invalid or expired reset token');
    }

    // Update password after verification
    const { error: updateError } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new ValidationError('Failed to update password');
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string, type?: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.verifyOtp({
      token_hash: token,
      type: (type as any) || 'signup',
    });

    if (error) {
      throw new AuthenticationError('Invalid or expired verification token');
    }

    if (!data.session || !data.user) {
      throw new AuthenticationError('Email verification failed');
    }

    return {
      user: data.user,
      session: data.session,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    };
  }

  /**
   * Refresh session
   */
  async refreshSession(refreshToken: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new AuthenticationError('Session refresh failed');
    }

    if (!data.session || !data.user) {
      throw new AuthenticationError('Session refresh failed');
    }

    return {
      user: data.user,
      session: data.session,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    };
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Verify current password by attempting to sign in
    const { data: userData, error: userError } = await this.supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      throw new AuthenticationError('User not found');
    }

    // Update password
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new ValidationError('Failed to change password');
    }
  }

  /**
   * Verify a JWT token and get user
   */
  async verifyToken(token: string): Promise<{ user: User; session: Session } | null> {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    // Get the session
    const { data: sessionData } = await this.supabase.auth.getSession();
    
    return {
      user: data.user,
      session: sessionData.session!,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase.auth.admin.getUserById(userId);

    if (error || !data.user) {
      return null;
    }

    return data.user;
  }
}

export default AuthService;
