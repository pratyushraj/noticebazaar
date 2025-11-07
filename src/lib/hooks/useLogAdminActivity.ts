import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client'; // Import the client for invoking edge functions
import { useSupabaseMutation } from './useSupabaseMutation'; // Import useSupabaseMutation

interface LogAdminActivityVariables {
  description: string;
  client_id: string | null; // Can be null for admin-specific logs
}

export const useLogAdminActivity = () => {
  const queryClient = useQueryClient();

  return useSupabaseMutation<void, Error, LogAdminActivityVariables>(
    async ({ description, client_id }) => {
      // Invoke the Edge Function
      const { data, error } = await supabase.functions.invoke('log-admin-activity', {
        body: { description, client_id },
      });

      if (error) {
        throw new Error(error.message);
      }
      if (data && data.error) {
        throw new Error(data.error);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['activity_log'] }); // Invalidate activity log to refetch
      },
      errorMessage: 'Failed to log admin activity',
    }
  );
};