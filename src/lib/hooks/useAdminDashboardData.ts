import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery } from './useSupabaseQuery'; // Import new hook

interface AdminDashboardData {
  clientCount: number;
  caseCount: number;
  documentCount: number;
  consultationCount: number;
  subscriptionCount: number; // New: subscription count
}

export const useAdminDashboardData = (enabled: boolean = true) => {
  return useSupabaseQuery<AdminDashboardData, Error>(
    ['adminDashboardData'],
    async () => {
      // Fetch Client Count
      const { count: clients, error: clientsError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'client');
      if (clientsError) throw clientsError;

      // Fetch Case Count
      const { count: cases, error: casesError } = await supabase
        .from('cases')
        .select('id', { count: 'exact', head: true });
      if (casesError) throw casesError;

      // Fetch Document Count
      const { count: documents, error: documentsError } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true });
      if (documentsError) throw documentsError;

      // Fetch Consultation Count
      const { count: consultations, error: consultationsError } = await supabase
        .from('consultations')
        .select('id', { count: 'exact', head: true });
      if (consultationsError) throw consultationsError;

      // Fetch Subscription Count (New)
      const { count: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true });
      if (subscriptionsError) throw subscriptionsError;

      return {
        clientCount: clients || 0,
        caseCount: cases || 0,
        documentCount: documents || 0,
        consultationCount: consultations || 0,
        subscriptionCount: subscriptions || 0, // Include in return
      };
    },
    {
      enabled: enabled,
      errorMessage: 'Failed to load admin dashboard data',
    }
  );
};