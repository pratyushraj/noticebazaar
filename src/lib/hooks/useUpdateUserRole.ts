import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface UpdateUserRoleVariables {
  email: string;
  newRole: string;
}

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<any, Error, UpdateUserRoleVariables>(
    async ({ email, newRole }) => {
      const { data, error } = await supabase.functions.invoke('update-user-role-by-email', {
        body: { email, newRole },
      });

      if (error) {
        throw new Error(error.message);
      }
      if (data && (data as any).error) {
        throw new Error((data as any).error);
      }
      return data;
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['profiles'] }); // Invalidate all profiles
        queryClient.invalidateQueries({ queryKey: ['userProfile'] }); // Invalidate current user's profile if it changed
        queryClient.invalidateQueries({ queryKey: ['adminDashboardData'] }); // Invalidate dashboard data if roles affect counts
        queryClient.invalidateQueries({ queryKey: ['caDashboardData'] }); // Invalidate CA dashboard data
      },
      errorMessage: 'Failed to update user role',
    }
  );
};