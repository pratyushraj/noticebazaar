import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaxSetting } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';

interface UseTaxSettingsOptions {
  creatorId: string | undefined;
  enabled?: boolean;
}

export const useTaxSettings = (options: UseTaxSettingsOptions) => {
  const { creatorId, enabled = true } = options;

  return useSupabaseQuery<TaxSetting | null, Error>(
    ['tax_settings', creatorId],
    async () => {
      if (!creatorId) return null;

      const { data, error } = await supabase
        .from('tax_settings')
        .select('*')
        .eq('creator_id', creatorId)
        .maybeSingle();

      if (error) {
        console.error('Supabase Error in useTaxSettings:', error.message);
        return null;
      }
      return data as TaxSetting | null;
    },
    {
      enabled: enabled && !!creatorId,
      errorMessage: 'Failed to fetch tax settings',
      retry: false,
    }
  );
};

interface UpsertTaxSettingsVariables {
  creator_id: string;
  gst_rate?: number;
  tds_rate?: number;
  itr_slab?: string;
}

export const useUpsertTaxSettings = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, UpsertTaxSettingsVariables>(
    async (settings) => {
      // Attempt to update first (assuming a row exists or will be created by a trigger/initial insert)
      const { error: updateError, count } = await supabase
        .from('tax_settings')
        .update(settings)
        .eq('creator_id', settings.creator_id)
        .select()
        .maybeSingle();

      if (updateError && updateError.code !== 'PGRST116') { // PGRST116 means no rows found
        throw new Error(updateError.message);
      }

      // If no row was updated, insert a new one
      if (!updateError || updateError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('tax_settings')
          .insert(settings);
        if (insertError) throw new Error(insertError.message);
      }
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['tax_settings', variables.creator_id] });
      },
      successMessage: 'Tax settings saved successfully!',
      errorMessage: 'Failed to save tax settings',
    }
  );
};