import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'; // Import useCallback
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { useSupabaseQuery } from '@/lib/hooks/useSupabaseQuery'; // Import useSupabaseQuery

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isCreator: boolean; // New: Add isCreator
  refetchProfile: () => void; // Add refetchProfile to the context type
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Use useSupabaseQuery to fetch the profile, leveraging React Query's caching and stability
  const profileQueryFn = useCallback(async () => { // Memoize queryFn here
    if (!user?.id) return null; // Don't fetch if no user ID
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role, updated_at, business_name, gstin, business_entity_type, onboarding_complete') // Include new profile fields
      .eq('id', user.id)
      .single();

    if (error && (error as any).code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
      console.error('SessionContext: Error fetching profile:', error);
      return null;
    }
    return data as Profile | null;
  }, [user?.id]); // Dependency for useCallback

  const { data: profile, isLoading: isLoadingProfile, refetch: refetchProfileQuery } = useSupabaseQuery<Profile | null, Error>( // Destructure refetch
    ['userProfile', user?.id], // Query key depends on user ID
    profileQueryFn, // Pass memoized queryFn
    {
      enabled: !!user?.id, // Only enable query if user ID is available
      staleTime: 5 * 60 * 1000, // Profile data can be considered fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Keep profile data in cache for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch profile on window focus by default
      errorMessage: 'Failed to load user profile',
    }
  );

  const isAdmin = profile?.role === 'admin';
  const isCreator = profile?.role === 'creator'; // New: Define isCreator
  // Overall loading state: true if initial session load is not complete OR profile is still loading
  const loading = !initialLoadComplete || isLoadingProfile;

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error.message);
        } else {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
      } catch (e: any) {
        console.error("Critical error initializing session:", e.message);
      } finally {
        setInitialLoadComplete(true); // Mark initial load as complete
      }
    };

    initializeSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setInitialLoadComplete(true); // Ensure this is set after any auth change
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to run only once on mount

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    isAdmin,
    isCreator, // New: Include isCreator
    refetchProfile: refetchProfileQuery, // Expose refetch function
  }), [session, user, profile, loading, isAdmin, isCreator, refetchProfileQuery]);

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};