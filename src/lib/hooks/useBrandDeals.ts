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
  const { creatorId, enabled = true, statusFilter, sortBy = 'created_at', sortOrder = 'desc', limit } = options;

  return useSupabaseQuery<BrandDeal[], Error>(
    ['brand_deals', creatorId, statusFilter, sortBy, sortOrder, limit],
    async () => {
      if (!creatorId) {
        // Return empty array immediately if no creatorId
        return [];
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
        // Log the error but return an empty array to prevent crashing the UI
        console.error('Supabase Error in useBrandDeals:', error.message);
        // NOTE: We return [] here instead of throwing to handle missing tables gracefully.
        return [];
      }
      return data as BrandDeal[];
    },
    {
      enabled: enabled && !!creatorId,
      errorMessage: 'Failed to fetch brand deals',
      // Do not throw error here, let the queryFn handle it and return []
      retry: false,
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
  invoice_file: File | null; // New: invoice file
  utr_number: string | null; // New: UTR number
  brand_email: string | null; // New: brand email
  payment_received_date: string | null; // New: payment received date
}

export const useAddBrandDeal = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, AddBrandDealVariables>(
    async ({ creator_id, brand_name, deliverables, contract_file, invoice_file, ...rest }) => {
      let contract_file_url: string | null = null;
      let invoice_file_url: string | null = null;

      // Upload contract file
      if (contract_file) {
        const fileExtension = contract_file.name.split('.').pop();
        const filePath = `${creator_id}/brand_deals/${brand_name.replace(/\s/g, '_')}-contract-${Date.now()}.${fileExtension}`;

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
      }

      // Upload invoice file
      if (invoice_file) {
        const fileExtension = invoice_file.name.split('.').pop();
        const filePath = `${creator_id}/brand_deals/${brand_name.replace(/\s/g, '_')}-invoice-${Date.now()}.${fileExtension}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('creator-assets')
          .upload(filePath, invoice_file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Invoice file upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('creator-assets')
          .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
          await supabase.storage.from('creator-assets').remove([filePath]);
          throw new Error('Failed to get public URL for the uploaded invoice file.');
        }
        invoice_file_url = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from('brand_deals')
        .insert({
          creator_id,
          brand_name,
          deliverables,
          contract_file_url,
          invoice_file_url, // New field
          ...rest,
        });

      if (insertError) {
        // Attempt to remove uploaded files if database insert fails
        if (contract_file_url) {
          const filePath = contract_file_url.split('/creator-assets/')[1];
          await supabase.storage.from('creator-assets').remove([filePath]);
        }
        if (invoice_file_url) {
          const filePath = invoice_file_url.split('/creator-assets/')[1];
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
  contract_file?: File | null;
  due_date?: string;
  payment_expected_date?: string;
  contact_person?: string;
  platform?: string;
  status?: BrandDeal['status'];
  original_contract_file_url?: string | null;
  invoice_file?: File | null; // New: invoice file
  original_invoice_file_url?: string | null; // New: original invoice file URL
  utr_number?: string | null; // New: UTR number
  brand_email?: string | null; // New: brand email
  payment_received_date?: string | null; // New: payment received date
}

export const useUpdateBrandDeal = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, UpdateBrandDealVariables>(
    async ({ id, creator_id, contract_file, original_contract_file_url, invoice_file, original_invoice_file_url, ...updates }) => {
      let contract_file_url: string | null | undefined = undefined;
      let invoice_file_url: string | null | undefined = undefined;

      // Handle contract file update
      if (contract_file !== undefined) {
        if (original_contract_file_url) {
          const oldFilePath = original_contract_file_url.split('/creator-assets/')[1];
          if (oldFilePath) { await supabase.storage.from('creator-assets').remove([oldFilePath]); }
        }
        if (contract_file) {
          const fileExtension = contract_file.name.split('.').pop();
          const filePath = `${creator_id}/brand_deals/${updates.brand_name || 'contract'}-${Date.now()}.${fileExtension}`;
          const { data: uploadData, error: uploadError } = await supabase.storage.from('creator-assets').upload(filePath, contract_file, { cacheControl: '3600', upsert: false });
          if (uploadError) { throw new Error(`Contract file upload failed: ${uploadError.message}`); }
          const { data: publicUrlData } = supabase.storage.from('creator-assets').getPublicUrl(filePath);
          if (!publicUrlData?.publicUrl) { await supabase.storage.from('creator-assets').remove([filePath]); throw new Error('Failed to get public URL for the uploaded contract file.'); }
          contract_file_url = publicUrlData.publicUrl;
        } else { contract_file_url = null; }
      }

      // Handle invoice file update
      if (invoice_file !== undefined) {
        if (original_invoice_file_url) {
          const oldFilePath = original_invoice_file_url.split('/creator-assets/')[1];
          if (oldFilePath) { await supabase.storage.from('creator-assets').remove([oldFilePath]); }
        }
        if (invoice_file) {
          const fileExtension = invoice_file.name.split('.').pop();
          const filePath = `${creator_id}/brand_deals/${updates.brand_name || 'invoice'}-${Date.now()}.${fileExtension}`;
          const { data: uploadData, error: uploadError } = await supabase.storage.from('creator-assets').upload(filePath, invoice_file, { cacheControl: '3600', upsert: false });
          if (uploadError) { throw new Error(`Invoice file upload failed: ${uploadError.message}`); }
          const { data: publicUrlData } = supabase.storage.from('creator-assets').getPublicUrl(filePath);
          if (!publicUrlData?.publicUrl) { await supabase.storage.from('creator-assets').remove([filePath]); throw new Error('Failed to get public URL for the uploaded invoice file.'); }
          invoice_file_url = publicUrlData.publicUrl;
        } else { invoice_file_url = null; }
      }

      const { error } = await supabase
        .from('brand_deals')
        .update({ ...updates, contract_file_url, invoice_file_url, updated_at: new Date().toISOString() })
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
  return useSupabaseMutation<void, Error, { id: string; creator_id: string; contract_file_url: string | null; invoice_file_url: string | null }>(
    async ({ id, creator_id, contract_file_url, invoice_file_url }) => {
      // Delete contract file from storage
      if (contract_file_url) {
        const filePath = contract_file_url.split('/creator-assets/')[1];
        if (filePath) {
          const { error: storageError } = await supabase.storage.from('creator-assets').remove([filePath]);
          if (storageError) { console.warn('Failed to delete contract file from storage:', storageError.message); }
        }
      }
      // Delete invoice file from storage
      if (invoice_file_url) {
        const filePath = invoice_file_url.split('/creator-assets/')[1];
        if (filePath) {
          const { error: storageError } = await supabase.storage.from('creator-assets').remove([filePath]);
          if (storageError) { console.warn('Failed to delete invoice file from storage:', storageError.message); }
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