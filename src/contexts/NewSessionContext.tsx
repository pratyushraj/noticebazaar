/**
 * Session Context - Compatibility Layer
 * 
 * This is a compatibility layer that bridges the new domain-based contexts
 * (AuthContext, ProfileContext) with the existing SessionContext API.
 * 
 * This allows gradual migration without breaking existing code.
 * 
 * @module contexts/SessionContext
 * @deprecated Use AuthContext and ProfileContext from domains/auth and domains/profiles
 */

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '@/types';
import { AuthProvider, useAuth } from '@/domains/auth';
import { ProfileProvider, useProfile } from '@/domains/profiles';
import { getTrialStatus, TrialStatus } from '@/lib/trial';

/**
 * Legacy SessionContext type for backward compatibility
 */
interface LegacySessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  authStatus: 'loading' | 'authenticated' | 'unauthenticated';
  isAuthInitializing: boolean;
  isAdmin: boolean;
  isCreator: boolean;
  isBrand: boolean;
  organizationId: string | null;
  refetchProfile: () => void;
  trialStatus: TrialStatus;
}

const LegacySessionContext = createContext<LegacySessionContextType | undefined>(undefined);

/**
 * Internal component that combines auth and profile contexts
 * for backward compatibility
 */
function LegacySessionProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const profileContext = useProfile();

  // Calculate trial status from profile
  const trialStatus = useMemo(() => {
    return getTrialStatus(profileContext.profile);
  }, [profileContext.profile]);

  // Combine loading states
  const loading = auth.authStatus === 'loading' || (auth.authStatus === 'authenticated' && profileContext.loading);
  const isAuthInitializing = auth.isInitializing;

  // Create legacy context value
  const value = useMemo<LegacySessionContextType>(() => ({
    session: auth.session,
    user: auth.user,
    profile: profileContext.profile,
    loading,
    authStatus: auth.authStatus,
    isAuthInitializing,
    isAdmin: profileContext.isAdmin,
    isCreator: profileContext.isCreator,
    isBrand: profileContext.isBrand,
    organizationId: profileContext.organizationId,
    refetchProfile: profileContext.refetchProfile,
    trialStatus,
  }), [
    auth.session,
    auth.user,
    auth.authStatus,
    auth.isInitializing,
    profileContext.profile,
    profileContext.loading,
    profileContext.isAdmin,
    profileContext.isCreator,
    profileContext.isBrand,
    profileContext.organizationId,
    profileContext.refetchProfile,
    trialStatus,
    loading,
  ]);

  return (
    <LegacySessionContext.Provider value={value}>
      {children}
    </LegacySessionContext.Provider>
  );
}

/**
 * SessionContextProvider - Main Provider
 * 
 * Wraps AuthProvider and ProfileProvider for the new domain-based architecture.
 * Provides backward compatibility through the legacy useSession hook.
 */
export function SessionContextProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <LegacySessionProvider>
          {children}
        </LegacySessionProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

/**
 * useSession - Legacy Hook
 * 
 * Provides backward compatibility with existing code that uses useSession.
 * 
 * @deprecated Use useAuth() and useProfile() from domains/auth and domains/profiles
 * 
 * @example
 * // Old way (deprecated but still works)
 * const { user, profile, isAdmin } = useSession();
 * 
 * // New way (recommended)
 * import { useAuth } from '@/domains/auth';
 * import { useProfile } from '@/domains/profiles';
 * 
 * const { user } = useAuth();
 * const { profile, isAdmin } = useProfile();
 */
export function useSession(): LegacySessionContextType {
  const context = useContext(LegacySessionContext);
  
  if (context === undefined) {
    // Return a safe fallback to prevent crashes during migration
    console.warn(
      '[useSession] Context is undefined. This may indicate a component is outside SessionContextProvider. ' +
      'Consider using useAuth() and useProfile() from domains/auth and domains/profiles instead.'
    );
    
    return {
      session: null,
      user: null,
      profile: null,
      loading: true,
      authStatus: 'loading',
      isAuthInitializing: true,
      isAdmin: false,
      isCreator: false,
      isBrand: false,
      organizationId: null,
      refetchProfile: () => {},
      trialStatus: { 
        isTrial: false, 
        isExpired: false, 
        daysLeft: 0, 
        trialLocked: false, 
        trialStartedAt: null, 
        trialExpiresAt: null 
      },
    };
  }
  
  return context;
}

// Re-export for backward compatibility
export default SessionContextProvider;
