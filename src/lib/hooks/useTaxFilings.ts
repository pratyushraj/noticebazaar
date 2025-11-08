import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaxFiling } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';

interface UseTaxFilingsOptions {
  creatorId: string | undefined;
  enabled?: boolean;
  statusFilter?: TaxFiling['status'] | 'All';
  limit?: number;
}

export const useTaxFilings = (options: UseTaxFilingsOptions) => {
  const { creatorId, enabled = true, statusFilter, limit } = options;

  return useSupabaseQuery<TaxFiling[], Error>(
    ['tax_filings', creatorId, statusFilter, limit],
    async () => {
      if (!creatorId) return [];

      let query = supabase
        .from('tax_filings')
        .select('*')
        .eq('creator_id', creatorId)
        .order('due_date', { ascending: true });

      if (statusFilter && statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase Error in useTaxFilings:', error.message);
        return [];
      }
      return data as TaxFiling[];
    },
    {
      enabled: enabled && !!creatorId,
      errorMessage: 'Failed to fetch tax filings',
      retry: false,
    }
  );
};

interface UpdateTaxFilingVariables {
  id: string;
  creator_id: string;
  status: TaxFiling['status'];
  filed_date?: string | null;
  filing_document_url?: string | null;
}

export const useUpdateTaxFiling = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, UpdateTaxFilingVariables>(
    async ({ id, creator_id, ...updates }) => {
      const { error } = await supabase
        .from('tax_filings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('creator_id', creator_id);

      if (error) throw new Error(error.message);
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['tax_filings', variables.creator_id] });
      },
      successMessage: 'Tax filing updated successfully!',
      errorMessage: 'Failed to update tax filing',
    }
  );
};