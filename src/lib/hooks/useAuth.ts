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
        // Sign out from Supabase
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
      
      // Clear any local storage items
      try {
        localStorage.removeItem('visit_count');
        localStorage.removeItem('add_to_home_dismissed');
        localStorage.removeItem('aiPitchHistory');
      } catch (e) {
        // Ignore localStorage errors
      }
    },
    {
      onSuccess: () => {
        toast.success('Logged out successfully!');
        // Use replace to prevent back navigation
        navigate('/login', { replace: true });
        // Force a page reload to ensure all state is cleared
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      },
      onError: () => {
        // Even on error, try to navigate and clear state
        queryClient.clear();
        navigate('/login', { replace: true });
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      },
      errorMessage: 'Logout failed',
    }
  );
};