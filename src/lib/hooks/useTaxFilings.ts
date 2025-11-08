import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaxFiling, ComplianceDeadline } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';
import { generateInitialTaxFilings } from '@/lib/utils/tax'; // Import the new utility

// Helper function to calculate urgency
const calculateUrgency = (dueDate: string): 'High' | 'Medium' | 'Low' => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) {
    return 'High';
  }
  if (diffDays <= 30) {
    return 'Medium';
  }
  return 'Low';
};

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

interface UseCreatorDeadlinesOptions {
  creatorId: string | undefined;
  enabled?: boolean;
}

export const useCreatorDeadlines = (options: UseCreatorDeadlinesOptions) => {
  const { creatorId, enabled = true } = options;

  return useSupabaseQuery<ComplianceDeadline[], Error>(
    ['creator_deadlines', creatorId],
    async () => {
      if (!creatorId) return [];

      const { data, error } = await supabase
        .from('tax_filings')
        .select('filing_type, due_date, status')
        .eq('creator_id', creatorId)
        .eq('status', 'pending') // Only fetch pending items
        .order('due_date', { ascending: true })
        .limit(3);

      if (error) {
        console.error('Supabase Error in useCreatorDeadlines:', error.message);
        return [];
      }

      const today = new Date().toISOString().split('T')[0];

      const deadlines = (data as Pick<TaxFiling, 'filing_type' | 'due_date' | 'status'>[]).map(filing => {
        // Only process if the due date is today or in the future (i.e., not overdue)
        if (filing.due_date < today) {
            return null; // Filter out overdue items from the "deadlines" list
        }
        
        const urgency = calculateUrgency(filing.due_date);

        return {
          date: new Date(filing.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          task: filing.filing_type.toUpperCase().replace(/_/g, ' '),
          urgency: urgency,
        };
      }).filter(item => item !== null) as ComplianceDeadline[];
      
      return deadlines;
    },
    {
      enabled: enabled && !!creatorId,
      errorMessage: 'Failed to fetch creator deadlines',
      retry: false,
    }
  );
};

// NEW: Mutation hook to generate and insert initial tax filings
export const useGenerateTaxFilings = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, { creator_id: string }>(
    async ({ creator_id }) => {
      const filingsToInsert = generateInitialTaxFilings(creator_id);

      if (filingsToInsert.length === 0) {
        console.log(`No future tax filings to insert for creator ${creator_id}.`);
        return;
      }

      const { error } = await supabase
        .from('tax_filings')
        .insert(filingsToInsert);

      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['tax_filings', variables.creator_id] });
        queryClient.invalidateQueries({ queryKey: ['creator_deadlines', variables.creator_id] });
      },
      errorMessage: 'Failed to generate initial tax filings',
    }
  );
};