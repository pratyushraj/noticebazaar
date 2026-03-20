import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Case } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery'; // Import new hook
import { useSupabaseMutation } from './useSupabaseMutation'; // Import new hook

interface UseCasesOptions {
  clientId?: string;
  enabled?: boolean;
  page?: number; // New: current page number (1-indexed)
  pageSize?: number; // New: number of items per page
  limit?: number; // New: limit the number of results
  joinProfile?: boolean; // New option to control joining
}

export const useCases = (options?: UseCasesOptions) => {
  const { clientId, enabled = true, page, pageSize, limit, joinProfile = true } = options || {};

  return useSupabaseQuery<{ data: Case[], count: number | null }, Error>(
    ['cases', clientId, page, pageSize, limit, joinProfile],
    async () => {
      const selectStatement = joinProfile ? '*, profiles!client_id(first_name, last_name)' : '*';

      let query = supabase
        .from('cases')
        .select(selectStatement, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (limit && !page && !pageSize) {
        query = query.limit(limit);
      } else if (page && pageSize) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }
      return { data: data as Case[], count };
    },
    {
      enabled: enabled,
      errorMessage: 'Failed to fetch cases',
    }
  );
};

export const useCaseById = (caseId: string | undefined, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {};

  return useSupabaseQuery<Case, Error>(
    ['case', caseId],
    async () => {
      if (!caseId) {
        throw new Error('Case ID is required');
      }
      const { data, error } = await supabase
        .from('cases')
        .select('*, profiles!client_id(first_name, last_name)')
        .eq('id', caseId)
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as Case;
    },
    {
      enabled: enabled && !!caseId,
      errorMessage: 'Failed to fetch case details',
    }
  );
};

interface CaseMutationVariables {
  title: string;
  status: string;
  deadline: string | null;
  client_id: string;
}

export const useAddCase = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, CaseMutationVariables>(
    async (newCase) => {
      const { error } = await supabase
        .from('cases')
        .insert(newCase);
      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['cases'] });
        queryClient.invalidateQueries({ queryKey: ['adminDashboardData'] }); // Invalidate dashboard data
        queryClient.invalidateQueries({ queryKey: ['activity_log'] }); // Invalidate activity log
      },
      successMessage: 'Case added successfully!',
      errorMessage: 'Failed to add case',
    }
  );
};

export const useUpdateCase = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, CaseMutationVariables & { id: string }>(
    async ({ id, ...updatedCase }) => {
      const { error } = await supabase
        .from('cases')
        .update(updatedCase)
        .eq('id', id);
      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['cases'] });
        queryClient.invalidateQueries({ queryKey: ['adminDashboardData'] }); // Invalidate dashboard data
        queryClient.invalidateQueries({ queryKey: ['activity_log'] }); // Invalidate activity log
      },
      successMessage: 'Case updated successfully!',
      errorMessage: 'Failed to update case',
    }
  );
};

export const useDeleteCase = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, string>(
    async (id) => {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', id);
      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['cases'] });
        queryClient.invalidateQueries({ queryKey: ['adminDashboardData'] }); // Invalidate dashboard data
        queryClient.invalidateQueries({ queryKey: ['activity_log'] }); // Invalidate activity log
      },
      successMessage: 'Case deleted successfully!',
      errorMessage: 'Failed to delete case',
    }
  );
};