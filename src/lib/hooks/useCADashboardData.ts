import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery } from './useSupabaseQuery';

interface CADashboardData {
  clientCount: number;
  documentsToReviewCount: number;
  pendingConsultationCount: number;
}

export const useCADashboardData = (enabled: boolean = true) => {
  return useSupabaseQuery<CADashboardData, Error>(
    ['caDashboardData'],
    async () => {
      // 1. Fetch Client Count (assuming CA manages all clients)
      const { count: clients, error: clientsError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'client');
      if (clientsError) throw clientsError;

      // 2. Fetch Documents Awaiting Review
      const { count: documentsToReview, error: documentsError } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Awaiting Review');
      if (documentsError) throw documentsError;

      // 3. Fetch Pending Consultations
      const { count: pendingConsultations, error: consultationsError } = await supabase
        .from('consultations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Pending');
      if (consultationsError) throw consultationsError;

      return {
        clientCount: clients || 0,
        documentsToReviewCount: documentsToReview || 0,
        pendingConsultationCount: pendingConsultations || 0,
      };
    },
    {
      enabled: enabled,
      errorMessage: 'Failed to load CA dashboard data',
    }
  );
};