import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';

interface ScanContractAIVariables {
  contract_file_url: string;
  brand_name: string;
}

interface AIScanResult {
  summary: string;
  insights: { type: string; description: string }[];
  recommendations: string;
}

export const useScanContractAI = () => {
  return useSupabaseMutation<AIScanResult, Error, ScanContractAIVariables>(
    async ({ contract_file_url, brand_name }) => {
      const { data, error } = await supabase.functions.invoke('scan-contract-ai', {
        body: { contract_file_url, brand_name },
      });

      if (error) {
        throw new Error(error.message);
      }
      if (data && (data as any).error) {
        throw new Error((data as any).error);
      }
      
      return data.analysis as AIScanResult;
    },
    {
      errorMessage: 'Failed to perform AI contract scan',
    }
  );
};