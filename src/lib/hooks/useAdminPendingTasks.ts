import { useSupabaseQuery } from './useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';

interface AdminPendingTasks {
  pendingConsultations: number;
  totalDocuments: number;
  // Add other pending tasks here as needed
}

export const useAdminPendingTasks = (enabled: boolean = true) => {
  return useSupabaseQuery<AdminPendingTasks, Error>(
    ['adminPendingTasks'],
    async () => {
      // Fetch count of pending consultations
      const { count: pendingConsultations, error: consultationsError } = await supabase
        .from('consultations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Pending');
      if (consultationsError) throw consultationsError;

      // Fetch total documents count (as a proxy for documents needing review)
      const { count: totalDocuments, error: documentsError } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true });
      if (documentsError) throw documentsError;

      return {
        pendingConsultations: pendingConsultations || 0,
        totalDocuments: totalDocuments || 0,
      };
    },
    {
      enabled: enabled,
      errorMessage: 'Failed to load admin pending tasks',
    }
  );
};