import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BrandDeal } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';

interface UseBrandDealsOptions {
  creatorId: string | undefined;
  enabled?: boolean;
  statusFilter?: BrandDeal['status'] | 'All';
  sortBy?: 'created_at' | 'due_date' | 'payment_expected_date';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export const useBrandDeals = (options: UseBrandDealsOptions) => {
  const { creatorId, enabled = true, statusFilter, sortBy = 'due_date', sortOrder = 'asc', limit } = options;

  return useSupabaseQuery<BrandDeal[], Error>(
    ['brand_deals', creatorId, statusFilter, sortBy, sortOrder, limit],
    async () => {
      if (!creatorId) {
        throw new Error('Creator ID is required to fetch brand deals.');
      }

      let query = supabase
        .from('brand_deals')
        .select('*')
        .eq('creator_id', creatorId)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (statusFilter && statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }
      return data as BrandDeal[];
    },
    {
      enabled: enabled && !!creatorId,
      errorMessage: 'Failed to fetch brand deals',
    }
  );
};

interface AddBrandDealVariables {
  creator_id: string;
  brand_name: string;
  deal_amount: number;
  deliverables: string;
  contract_file: File | null; // Allow null for no file
  due_date: string;
  payment_expected_date: string;
  contact_person: string;
  platform: string;
  status: BrandDeal['status'];
}

export const useAddBrandDeal = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, AddBrandDealVariables>(
    async ({ creator_id, brand_name, deliverables, contract_file, ...rest }) => {
      let contract_file_url: string | null = null;

      if (contract_file) {
        const fileExtension = contract_file.name.split('.').pop();
        const filePath = `${creator_id}/brand_deals/${brand_name.replace(/\s/g, '_')}-${Date.now()}.${fileExtension}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('creator-assets') // Assuming a 'creator-assets' bucket for creator-specific files
          .upload(filePath, contract_file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Contract file upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('creator-assets')
          .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
          await supabase.storage.from('creator-assets').remove([filePath]);
          throw new Error('Failed to get public URL for the uploaded contract file.');
        }
        contract_file_url = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from('brand_deals')
        .insert({
          creator_id,
          brand_name,
          deliverables,
          contract_file_url,
          ...rest,
        });

      if (insertError) {
        if (contract_file_url) {
          const filePath = contract_file_url.split('/creator-assets/')[1];
          await supabase.storage.from('creator-assets').remove([filePath]);
        }
        throw new Error(`Failed to record brand deal in database: ${insertError.message}`);
      }
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['brand_deals', variables.creator_id] });
      },
      successMessage: 'Brand deal added successfully!',
      errorMessage: 'Failed to add brand deal',
    }
  );
};

interface UpdateBrandDealVariables {
  id: string;
  creator_id: string;
  brand_name?: string;
  deal_amount?: number;
  deliverables?: string;
  contract_file?: File | null; // Allow updating file
  due_date?: string;
  payment_expected_date?: string;
  contact_person?: string;
  platform?: string;
  status?: BrandDeal['status'];
  // Add original_contract_file_url if you need to delete old file on update
  original_contract_file_url?: string | null; 
}

export const useUpdateBrandDeal = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, UpdateBrandDealVariables>(
    async ({ id, creator_id, contract_file, original_contract_file_url, ...updates }) => {
      let contract_file_url: string | null | undefined = undefined;

      if (contract_file !== undefined) { // If a new file is provided or file is explicitly set to null
        if (original_contract_file_url) {
          // Delete old file if it exists
          const oldFilePath = original_contract_file_url.split('/creator-assets/')[1];
          if (oldFilePath) {
            await supabase.storage.from('creator-assets').remove([oldFilePath]);
          }
        }

        if (contract_file) {
          const fileExtension = contract_file.name.split('.').pop();
          const filePath = `${creator_id}/brand_deals/${updates.brand_name || 'contract'}-${Date.now()}.${fileExtension}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('creator-assets')
            .upload(filePath, contract_file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            throw new Error(`Contract file upload failed: ${uploadError.message}`);
          }

          const { data: publicUrlData } = supabase.storage
            .from('creator-assets')
            .getPublicUrl(filePath);

          if (!publicUrlData?.publicUrl) {
            await supabase.storage.from('creator-assets').remove([filePath]);
            throw new Error('Failed to get public URL for the uploaded contract file.');
          }
          contract_file_url = publicUrlData.publicUrl;
        } else {
          contract_file_url = null; // Explicitly set to null if file is removed
        }
      }

      const { error } = await supabase
        .from('brand_deals')
        .update({ ...updates, contract_file_url, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['brand_deals', variables.creator_id] });
      },
      successMessage: 'Brand deal updated successfully!',
      errorMessage: 'Failed to update brand deal',
    }
  );
};

export const useDeleteBrandDeal = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, { id: string; creator_id: string; contract_file_url: string | null }>(
    async ({ id, creator_id, contract_file_url }) => {
      if (contract_file_url) {
        const filePath = contract_file_url.split('/creator-assets/')[1];
        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from('creator-assets')
            .remove([filePath]);
          if (storageError) {
            console.warn('Failed to delete contract file from storage:', storageError.message);
            // Don't throw, proceed with DB deletion even if file deletion fails
          }
        }
      }

      const { error: dbError } = await supabase
        .from('brand_deals')
        .delete()
        .eq('id', id);

      if (dbError) {
        throw new Error(`Failed to delete brand deal record: ${dbError.message}`);
      }
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['brand_deals', variables.creator_id] });
      },
      successMessage: 'Brand deal deleted successfully!',
      errorMessage: 'Failed to delete brand deal',
    }
  );
};