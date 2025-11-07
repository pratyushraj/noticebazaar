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
      const { error } = await supabase.auth.signOut();
      
      // Check if the error is due to a missing session (user already logged out)
      if (error && error.message !== 'Auth session missing!') {
        throw new Error(error.message);
      }
      // If error is 'Auth session missing!', we treat it as a successful sign out
    },
    {
      onSuccess: () => {
        queryClient.clear(); // Clear all React Query cache on sign out
        toast.success('Logged out successfully!');
        navigate('/login');
      },
      errorMessage: 'Logout failed',
    }
  );
};