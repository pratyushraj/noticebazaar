import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CADashboardData {
  clientCount: number;
  documentsToReviewCount: number;
  pendingConsultationCount: number;
}

async function safeCount(table: string, apply?: (q: any) => any): Promise<number> {
  try {
    let q = supabase.from(table).select('id', { count: 'exact', head: true });
    if (apply) q = apply(q);
    const { count, error } = await q;
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

export const useCADashboardData = (enabled: boolean = true) => {
  return useQuery<CADashboardData, Error>({
    queryKey: ['caDashboardData'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Not authenticated');

      // Best-effort counts. These tables/columns can vary across deployments; failures return 0.
      const clientCount = await safeCount('profiles', (q) => q.eq('role', 'client'));
      const documentsToReviewCount = await safeCount('documents', (q) => q.eq('status', 'pending_review'));
      const pendingConsultationCount = await safeCount('consultations', (q) => q.eq('status', 'pending'));

      return { clientCount, documentsToReviewCount, pendingConsultationCount };
    },
    enabled,
    retry: 1,
  });
};

