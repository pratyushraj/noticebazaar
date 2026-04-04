/**
 * Auth Domain Hooks
 * 
 * Custom hooks for authentication operations.
 * 
 * @module domains/auth/hooks
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for OAuth authentication flows
 */
export function useOAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Store intended route for post-OAuth redirect
      const currentPath = window.location.pathname;
      if (currentPath && currentPath !== '/' && currentPath !== '/login') {
        sessionStorage.setItem('oauth_intended_route', currentPath);
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        return { success: false, error: oauthError.message };
      }

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'OAuth failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const handleOAuthCallback = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setError(sessionError.message);
          return { success: false, error: sessionError.message };
        }

        // Get intended route from storage
        const intendedRoute = sessionStorage.getItem('oauth_intended_route') || '/creator-dashboard';
        sessionStorage.removeItem('oauth_intended_route');

        navigate(intendedRoute, { replace: true });
        return { success: true };
      }

      return { success: false, error: 'No tokens found in callback' };
    } catch (err: any) {
      const errorMessage = err.message || 'OAuth callback failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  return {
    isLoading,
    error,
    signInWithGoogle,
    handleOAuthCallback,
    clearError: () => setError(null),
  };
}

/**
 * Hook for magic link authentication
 */
export function useMagicLink() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMagicLink = useCallback(async (email: string, redirectTo?: string) => {
    setIsLoading(true);
    setError(null);
    setIsSent(false);

    try {
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo || `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      });

      if (magicLinkError) {
        setError(magicLinkError.message);
        return { success: false, error: magicLinkError.message };
      }

      setIsSent(true);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send magic link';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    isSent,
    error,
    sendMagicLink,
    clearError: () => setError(null),
    resetSent: () => setIsSent(false),
  };
}

/**
 * Hook for session management utilities
 */
export function useSession() {
  const { session, user, authStatus, isInitializing } = useAuth();

  const isAuthenticated = authStatus === 'authenticated';
  const isLoading = authStatus === 'loading' || isInitializing;

  const getUserId = useCallback(() => {
    return user?.id || null;
  }, [user]);

  const getUserEmail = useCallback(() => {
    return user?.email || null;
  }, [user]);

  const getUserMetadata = useCallback(() => {
    return user?.user_metadata || {};
  }, [user]);

  const getSessionToken = useCallback(() => {
    return session?.access_token || null;
  }, [session]);

  return {
    session,
    user,
    authStatus,
    isInitializing,
    isAuthenticated,
    isLoading,
    getUserId,
    getUserEmail,
    getUserMetadata,
    getSessionToken,
  };
}

export default {
  useOAuth,
  useMagicLink,
  useSession,
};
