import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Activity } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery'; // Import new hook
import { useSupabaseMutation } from './useSupabaseMutation'; // Import new hook
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient

interface UseActivityLogOptions {
  clientId?: string | null;
  limit?: number;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  joinProfile?: boolean;
}

export const useActivityLog = (options?: UseActivityLogOptions) => {
  const { clientId, limit, enabled = true, page, pageSize, joinProfile = true } = options || {};

  return useSupabaseQuery<{ data: Activity[], count: number | null }, Error>(
    ['activity_log', clientId, limit, page, pageSize, joinProfile],
    async () => {
      const selectStatement = joinProfile ? '*, profiles!client_id(first_name, last_name)' : '*';

      let query = supabase
        .from('activity_log')
        .select(selectStatement, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      } else if (clientId === null) {
        // For admin view, we fetch all.
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
      return { data: data as Activity[], count };
    },
    {
      enabled: enabled,
      errorMessage: 'Failed to fetch activity log',
    }
  );
};

interface AddActivityLogVariables {
  description: string;
  client_id: string | null;
}

export const useAddActivityLog = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, AddActivityLogVariables>(
    async (newActivity) => {
      const { error } = await supabase.from('activity_log').insert(newActivity);
      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      },
      errorMessage: 'Failed to log activity',
    }
  );
};