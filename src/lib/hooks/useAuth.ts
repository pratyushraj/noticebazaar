import { supabase } from '@/integrations/supabase/client';
import { useSupabaseMutation } from './useSupabaseMutation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const useSignOut = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useSupabaseMutation<void, Error, void>(
    async () => {
      try {
        // Sign out from Supabase - this clears the session on the server
        const { error } = await supabase.auth.signOut();
        
        // Check if the error is due to a missing session (user already logged out)
        if (error && error.message !== 'Auth session missing!' && error.message !== 'Invalid Refresh Token: Refresh Token Not Found') {
          throw new Error(error.message);
        }
        // If error is 'Auth session missing!' or 'Invalid Refresh Token', we treat it as a successful sign out
      } catch (err: any) {
        // Even if signOut fails, clear local state
        console.warn('Sign out error (proceeding with cleanup):', err);
      }
      
      // Always clear cache and local storage regardless of signOut result
      queryClient.clear();
      
      // Clear all Supabase-related localStorage keys
      try {
        // Get all localStorage keys
        const keys = Object.keys(localStorage);
        // Find and remove all Supabase auth-related keys
        keys.forEach(key => {
          if (key.includes('supabase.auth') || key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
        
        // Clear other app-specific localStorage items
        localStorage.removeItem('visit_count');
        localStorage.removeItem('add_to_home_dismissed');
        localStorage.removeItem('aiPitchHistory');
      } catch (e) {
        // Ignore localStorage errors
      }
      
      // Verify session is cleared
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // If session still exists, force clear it
        await supabase.auth.signOut({ scope: 'global' });
      }
    },
    {
      onSuccess: () => {
        toast.success('Logged out successfully!');
        // Clear React Query cache again to be safe
        queryClient.clear();
        // Clear any remaining Supabase keys immediately
        try {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.includes('supabase.auth') || key.startsWith('sb-')) {
              localStorage.removeItem(key);
            }
          });
          // Also clear sessionStorage
          sessionStorage.clear();
        } catch (e) {
          // Ignore errors
        }
        // Use hard navigation with loggedOut flag to prevent Login page from redirecting
        // This ensures a clean state reset
        window.location.href = '/#/login?loggedOut=true';
      },
      onError: async () => {
        // Even on error, try to navigate and clear state
        queryClient.clear();
        // Clear Supabase keys
        try {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.includes('supabase.auth') || key.startsWith('sb-')) {
              localStorage.removeItem(key);
            }
          });
        } catch (e) {
          // Ignore errors
        }
        // Force hard navigation to ensure all state is cleared
        window.location.replace('/#/login?loggedOut=true');
      },
      errorMessage: 'Logout failed',
    }
  );
};