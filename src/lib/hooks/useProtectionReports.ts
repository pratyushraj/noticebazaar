import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery } from './useSupabaseQuery';

export interface ProtectionReport {
  id: string;
  deal_id: string | null;
  user_id: string | null;
  contract_file_url: string;
  protection_score: number;
  negotiation_power_score: number | null;
  overall_risk: 'low' | 'medium' | 'high';
  analysis_json: Record<string, unknown>;
  pdf_report_url: string | null;
  safe_contract_url: string | null;
  analyzed_at: string;
  created_at: string;
  updated_at: string;
}

interface UseProtectionReportsOptions {
  userId: string | undefined;
  enabled?: boolean;
}

export const useProtectionReports = (options: UseProtectionReportsOptions) => {
  const { userId, enabled = true } = options;

  return useSupabaseQuery<ProtectionReport[], Error>(
    ['protection_reports', userId],
    async () => {
      if (!userId) throw new Error('userId required');
      const { data, error } = await supabase
        .from('protection_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data as ProtectionReport[]) ?? [];
    },
    { enabled: enabled && !!userId, errorMessage: 'Failed to fetch protection reports' }
  );
};

interface UseProtectionScoreOptions {
  userId: string | undefined;
  enabled?: boolean;
}

/** Returns the average protection_score across all reports for a user (0 if none). */
export const useProtectionScore = (options: UseProtectionScoreOptions) => {
  const { userId, enabled = true } = options;
  const reports = useProtectionReports({ userId, enabled });

  const score = reports.data && reports.data.length > 0
    ? Math.round(
        reports.data.reduce((sum, r) => sum + r.protection_score, 0) / reports.data.length
      )
    : 0;

  return { ...reports, score };
};
