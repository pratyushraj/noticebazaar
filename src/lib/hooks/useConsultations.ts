import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Consultation } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery'; // Import new hook
import { useSupabaseMutation } from './useSupabaseMutation'; // Import new hook

interface UseConsultationsOptions {
  clientId?: string;
  status?: Consultation['status'] | 'All';
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  joinProfile?: boolean;
  limit?: number;
}

export const useConsultations = (options?: UseConsultationsOptions) => {
  const { clientId, status, enabled = true, page, pageSize, joinProfile = true, limit } = options || {};

  return useSupabaseQuery<{ data: Consultation[], count: number | null }, Error>(
    ['consultations', clientId, status, page, pageSize, limit, joinProfile],
    async () => {
      const selectStatement = joinProfile ? '*, profiles!client_id(first_name, last_name)' : '*';

      let query = supabase
        .from('consultations')
        .select(selectStatement, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      if (status && status !== 'All') {
        query = query.eq('status', status);
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
      return { data: data as Consultation[], count };
    },
    {
      enabled: enabled,
      errorMessage: 'Failed to fetch consultations',
    }
  );
};

export const useConsultationById = (consultationId: string | undefined, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {};

  return useSupabaseQuery<Consultation, Error>(
    ['consultation', consultationId],
    async () => {
      if (!consultationId) {
        throw new Error('Consultation ID is required');
      }
      const { data, error } = await supabase
        .from('consultations')
        .select('*, profiles!client_id(first_name, last_name)')
        .eq('id', consultationId)
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as Consultation;
    },
    {
      enabled: enabled && !!consultationId,
      errorMessage: 'Failed to fetch consultation details',
    }
  );
};

export const useUpdateConsultationStatus = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, { id: string; status: Consultation['status'] }>(
    async ({ id, status }) => {
      const { error } = await supabase
        .from('consultations')
        .update({ status })
        .eq('id', id);
      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['consultations'] });
      },
      errorMessage: 'Failed to update consultation status',
    }
  );
};

export const useDeleteConsultation = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, string>(
    async (id) => {
      const { error } = await supabase
        .from('consultations')
        .delete()
        .eq('id', id);
      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['consultations'] });
      },
      errorMessage: 'Failed to delete consultation',
    }
  );
};

export const useBookConsultation = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, { client_id: string; preferred_date: string; preferred_time: string; topic: string | null }>(
    async (newConsultation) => {
      const { error } = await supabase
        .from('consultations')
        .insert(newConsultation);
      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['consultations'] });
        queryClient.invalidateQueries({ queryKey: ['activity_log'] }); // Invalidate activity log as well
      },
      errorMessage: 'Failed to book consultation',
    }
  );
};