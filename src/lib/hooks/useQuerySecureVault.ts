import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';

interface QuerySecureVaultVariables {
  query: string;
}

interface QuerySecureVaultResponse {
  response: string;
}

export const useQuerySecureVault = () => {
  return useSupabaseMutation<QuerySecureVaultResponse, Error, QuerySecureVaultVariables>(
    async ({ query }) => {
      const { data, error } = await supabase.functions.invoke('query-secure-vault', {
        body: { query },
      });

      if (error) {
        throw new Error(error.message);
      }
      if (data && (data as any).error) {
        throw new Error((data as any).error);
      }
      
      return data as QuerySecureVaultResponse;
    },
    {
      errorMessage: 'Failed to query Secure Vault',
    }
  );
};