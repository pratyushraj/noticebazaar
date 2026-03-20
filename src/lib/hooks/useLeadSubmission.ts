import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, TablesUpdate } from '@/types/supabase';

type LeadSubmissionInsert = TablesInsert<'lead_submissions'>;
type LeadSubmissionUpdate = TablesUpdate<'lead_submissions'>;

interface UpsertLeadVariables {
  lead_id: string;
  data: Omit<LeadSubmissionInsert, 'lead_id' | 'created_at' | 'updated_at'>;
}

export const useLeadSubmission = () => {
  return useSupabaseMutation<void, Error, UpsertLeadVariables>(
    async ({ lead_id, data }) => {
      // Attempt to update the existing record first
      const { error: updateError, count: updateCount } = await supabase
        .from('lead_submissions')
        .update(data as LeadSubmissionUpdate)
        .eq('lead_id', lead_id)
        .select()
        .maybeSingle();

      if (updateError) {
        // If update fails for a reason other than 'not found', throw
        if (updateError.code !== 'PGRST116') { // PGRST116 means no rows found
          throw new Error(updateError.message);
        }
      }

      // If no row was updated (i.e., it's a new lead), insert a new record
      if (!updateError || updateError.code === 'PGRST116') {
        const insertData: LeadSubmissionInsert = {
          lead_id: lead_id,
          status: 'in_progress',
          ...data,
        };
        
        const { error: insertError } = await supabase
          .from('lead_submissions')
          .insert(insertData);

        if (insertError) {
          throw new Error(insertError.message);
        }
      }
    },
    {
      errorMessage: 'Failed to save lead progress',
    }
  );
};

export const useFetchLeadSubmission = (leadId: string | null) => {
  return useSupabaseMutation<LeadSubmissionUpdate | null, Error, void>(
    async () => {
      if (!leadId) return null;

      const { data, error } = await supabase
        .from('lead_submissions')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    {
      enabled: !!leadId,
      errorMessage: 'Failed to load previous lead data',
    }
  );
};