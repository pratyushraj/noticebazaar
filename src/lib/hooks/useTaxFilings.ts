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

      // Only filter by status if it's 'Pending' or 'Filed' in the DB query, 
      // as 'Overdue' is derived client-side from 'Pending'.
      if (statusFilter && statusFilter !== 'All' && statusFilter !== 'Overdue') {
        query = query.eq('status', statusFilter.toLowerCase());
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase Error in useTaxFilings:', error.message);
        return [];
      }
      
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format for comparison

      // Apply client-side status derivation logic
      const processedData = (data as TaxFiling[]).map(filing => {
        let derivedStatus: TaxFiling['status'] = filing.status as TaxFiling['status'];

        if (filing.status.toLowerCase() === 'pending' && filing.due_date < today) {
          // Mark as overdue if pending and due date is in the past
          derivedStatus = 'Overdue';
        } else if (filing.status.toLowerCase() === 'pending') {
          derivedStatus = 'Pending';
        } else if (filing.status.toLowerCase() === 'filed') {
          derivedStatus = 'Filed';
        }

        return { ...filing, status: derivedStatus };
      });

      // Apply client-side filtering for 'Overdue' status if requested
      if (statusFilter === 'Overdue') {
        return processedData.filter(filing => filing.status === 'Overdue');
      }

      return processedData;
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
    async ({ id, creator_id, status, ...updates }) => {
      // Ensure we only write 'filed' or 'pending' back to the DB, not 'Overdue'
      const dbStatus = status === 'Overdue' ? 'pending' : status.toLowerCase();
      
      const { error } = await supabase
        .from('tax_filings')
        .update({ status: dbStatus, ...updates, updated_at: new Date().toISOString() })
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