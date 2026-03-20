import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';
import { DealActionLog, CreateActionLogInput } from '@/types/issues';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Fetch action logs for a specific deal
 */
export function useDealActionLogs(dealId: string | undefined, enabled = true) {
  return useSupabaseQuery<DealActionLog[]>(
    ['deal-action-logs', dealId],
    async () => {
      if (!dealId) {
        return [];
      }

      const query = supabase
        .from('deal_action_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .eq('deal_id', dealId);

      const { data, error } = await query;

      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        const errorCode = (error as any)?.code;
        const errorStatus = (error as any)?.status;
        if (
          errorCode === 'PGRST116' ||
          errorCode === '42P01' ||
          errorStatus === 404 ||
          String(error.message || '').toLowerCase().includes('does not exist') ||
          String(error.message || '').toLowerCase().includes('relation')
        ) {
          return [];
        }
        throw error;
      }

      return (data || []) as DealActionLog[];
    },
    {
      enabled: enabled && !!dealId,
      errorMessage: 'Failed to fetch action logs',
    }
  );
}

/**
 * Create a new action log entry
 */
export function useCreateActionLog() {
  const queryClient = useQueryClient();

  return useSupabaseMutation<DealActionLog, CreateActionLogInput>(
    async (variables) => {
      const { data, error } = await supabase
        .from('deal_action_logs')
        .insert(variables)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as DealActionLog;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['deal-action-logs', data.deal_id] });
      },
      errorMessage: 'Failed to create action log',
    }
  );
}

