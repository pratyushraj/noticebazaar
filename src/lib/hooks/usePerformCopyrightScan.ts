import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';

interface CopyrightScanAlert {
  id: string;
  description: string;
  platform: string;
  infringingUrl: string;
  infringingUser: string;
  originalContentUrl: string;
  similarity_score?: number; // 0-1 scale
  screenshot_url?: string | null; // Thumbnail URL
}

interface PerformCopyrightScanVariables {
  query: string;
  platforms: string[];
}

interface PerformCopyrightScanResponse {
  alerts: CopyrightScanAlert[];
}

export const usePerformCopyrightScan = () => {
  return useSupabaseMutation<PerformCopyrightScanResponse, Error, PerformCopyrightScanVariables>(
    async ({ query, platforms }) => {
      const { data, error } = await supabase.functions.invoke('perform-copyright-scan', {
        body: { query, platforms },
      });

      if (error) {
        throw new Error(error.message);
      }
      if (data && (data as any).error) {
        throw new Error((data as any).error);
      }
      
      return data as PerformCopyrightScanResponse;
    },
    {
      errorMessage: 'Failed to perform copyright scan',
    }
  );
};