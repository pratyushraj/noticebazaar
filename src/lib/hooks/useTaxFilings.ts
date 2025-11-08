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

      // 1. Optimize DB query based on filter
      if (statusFilter === 'Filed') {
        query = query.eq('status', 'filed');
      } else if (statusFilter === 'Pending' || statusFilter === 'Overdue') {
        // If filtering for Pending or Overdue, we only need records that are 'pending' in the DB
        query = query.eq('status', 'pending');
      }
      // If statusFilter is 'All', no status filter is applied to the DB query.

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase Error in useTaxFilings:', error.message);
        return [];
      }
      
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format for comparison

      // 2. Apply client-side status derivation logic
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

      // 3. Apply final client-side filtering based on derived status
      if (statusFilter === 'All') {
        return processedData;
      }
      
      // Filter by the derived status (Pending, Filed, or Overdue)
      return processedData.filter(filing => filing.status === statusFilter);
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
  filing_document_file?: File | null; // NEW: Optional file upload
}

export const useUpdateTaxFiling = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, UpdateTaxFilingVariables>(
    async ({ id, creator_id, status, filing_document_file, ...updates }) => {
      let filing_document_url: string | null | undefined = updates.filing_document_url;
      
      // 1. Handle file upload if provided
      if (filing_document_file) {
        const fileExtension = filing_document_file.name.split('.').pop();
        const filePath = `${creator_id}/tax_filings/${id}-${Date.now()}.${fileExtension}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('creator-assets') // Using the same bucket as brand deals
          .upload(filePath, filing_document_file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Filing document upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('creator-assets')
          .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
          await supabase.storage.from('creator-assets').remove([filePath]);
          throw new Error('Failed to get public URL for the uploaded filing document.');
        }
        filing_document_url = publicUrlData.publicUrl;
      }

      // Ensure we only write 'filed' or 'pending' back to the DB, not 'Overdue'
      const dbStatus = status === 'Overdue' ? 'pending' : status.toLowerCase();
      
      const { error } = await supabase
        .from('tax_filings')
        .update({ 
          status: dbStatus, 
          filing_document_url: filing_document_url, // Include the new URL
          updated_at: new Date().toISOString(),
          ...updates 
        })
        .eq('id', id)
        .eq('creator_id', creator_id);

      if (error) {
        // If DB update fails, attempt to clean up the uploaded file if one exists
        if (filing_document_file && filing_document_url) {
            const filePath = filing_document_url.split('/creator-assets/')[1];
            await supabase.storage.from('creator-assets').remove([filePath]);
        }
        throw new Error(error.message);
      }
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