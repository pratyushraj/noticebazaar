import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery } from './useSupabaseQuery';

interface ClientDashboardMetrics {
  documentsUploadedThisMonth: number;
  consultationsCompletedThisMonth: number;
}

export const useClientDashboardMetrics = (clientId: string | undefined, enabled: boolean = true) => {
  return useSupabaseQuery<ClientDashboardMetrics, Error>(
    ['clientDashboardMetrics', clientId],
    async () => {
      if (!clientId) {
        return { documentsUploadedThisMonth: 0, consultationsCompletedThisMonth: 0 };
      }

      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

      // Documents uploaded this month
      const { count: documentsCount, error: documentsError } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .gte('uploaded_at', firstDayOfMonth)
        .lte('uploaded_at', lastDayOfMonth);

      if (documentsError) throw documentsError;

      // Consultations completed this month
      const { count: consultationsCount, error: consultationsError } = await supabase
        .from('consultations')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('status', 'Completed')
        .gte('created_at', firstDayOfMonth)
        .lte('created_at', lastDayOfMonth);

      if (consultationsError) throw consultationsError;

      return {
        documentsUploadedThisMonth: documentsCount || 0,
        consultationsCompletedThisMonth: consultationsCount || 0,
      };
    },
    {
      enabled: enabled && !!clientId,
      errorMessage: 'Failed to load client dashboard metrics',
    }
  );
};