/**
 * Auth Context
 * 
 * Manages authentication state, OAuth flows, and session management.
 * This is a focused context that only handles auth - profile data is in ProfileContext.
 * 
 * @module domains/auth/contexts/AuthContext
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { AuthStatus, AuthContextType, LoginCredentials, SignupCredentials, OAuthProvider } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 * 
 * Handles:
 * - Session initialization and monitoring
 * - Email/password authentication
 * - OAuth flows (Google, Apple)
 * - Magic link authentication
 * - Password reset
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] Error getting session:', error);
          // Handle invalid refresh token
          if (error.message.includes('Refresh Token Not Found') || 
              error.message.includes('Invalid Refresh Token')) {
            await supabase.auth.signOut();
          }
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setAuthStatus(initialSession ? 'authenticated' : 'unauthenticated');
          setIsInitializing(false);
        }
      } catch (err) {
        console.error('[AuthContext] Initialization error:', err);
        if (mounted) {
          setAuthStatus('unauthenticated');
          setIsInitializing(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[AuthContext] Auth state change:', event);
        
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setAuthStatus(newSession ? 'authenticated' : 'unauthenticated');
        setIsInitializing(false);

        // Handle specific events
        if (event === 'SIGNED_OUT') {
          // Clear any cached data
          sessionStorage.removeItem('oauth_intended_route');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email/password
  const signIn = useCallback(async (credentials: LoginCredentials) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  // Sign up with email/password
  const signUp = useCallback(async (credentials: SignupCredentials) => {
    try {
      if (credentials.password !== credentials.confirmPassword) {
        return { success: false, error: 'Passwords do not match' };
      }

      const { error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName,
            role: credentials.role || 'creator',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('[AuthContext] Sign out error:', err);
    }
  }, [navigate]);

  // Sign in with OAuth
  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    } catch (err) {
      console.error('[AuthContext] OAuth error:', err);
    }
  }, []);

  // Send magic link
  const sendMagicLink = useCallback(async (email: string, redirectTo?: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  // Memoize context value
  const value = useMemo<AuthContextType>(() => ({
    session,
    user,
    authStatus,
    isInitializing,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    sendMagicLink,
    resetPassword,
  }), [
    session,
    user,
    authStatus,
    isInitializing,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    sendMagicLink,
    resetPassword,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * 
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;
