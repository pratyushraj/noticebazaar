import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BrandDeal } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';

interface UseBrandDealsOptions {
  creatorId: string | undefined;
  enabled?: boolean;
  statusFilter?: BrandDeal['status'] | 'All';
  platformFilter?: string | 'All'; // NEW
  sortBy?: 'created_at' | 'due_date' | 'payment_expected_date' | 'deal_amount'; // ADD deal_amount
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export const useBrandDeals = (options: UseBrandDealsOptions) => {
  const { creatorId, enabled = true, statusFilter, platformFilter, sortBy = 'created_at', sortOrder = 'desc', limit } = options;

  return useSupabaseQuery<BrandDeal[], Error>(
    ['brand_deals', creatorId, statusFilter, platformFilter, sortBy, sortOrder, limit],
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
      
      if (platformFilter && platformFilter !== 'All') { // NEW FILTER
        query = query.eq('platform', platformFilter);
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
  organization_id: string; // NEW: Required field
  brand_name: string;
  brand_domain?: string; // NEW: Optional brand domain
  deal_amount: number;
  deliverables: string;
  contract_file: File | null; // Allow null for no file
  due_date: string;
  payment_expected_date: string;
  contact_person: string | null;
  platform: string | null;
  status: BrandDeal['status'];
  invoice_file: File | null; // New: invoice file
  utr_number: string | null; // New: UTR number
  brand_email: string | null; // New: brand email
  payment_received_date: string | null; // New: payment received date
}

export const useAddBrandDeal = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, AddBrandDealVariables>(
    async ({ 
      creator_id, 
      organization_id, // DESTRUCTURE NEW FIELD
      brand_name,
      brand_domain, // NEW: Optional brand domain
      deal_amount, 
      deliverables, 
      contract_file, 
      due_date, 
      payment_expected_date, 
      contact_person, 
      platform, 
      status, 
      invoice_file, 
      utr_number, 
      brand_email, 
      payment_received_date 
    }) => {
      let contract_file_url: string | null = null;
      let invoice_file_url: string | null = null;

      const sanitizeName = (name: string) => name.trim().replace(/\s/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
      const sanitizedBrandName = sanitizeName(brand_name);

      // Upload contract file
      if (contract_file) {
        const fileExtension = contract_file.name.split('.').pop();
        const filePath = `${creator_id}/brand_deals/${sanitizedBrandName}-contract-${Date.now()}.${fileExtension}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('creator-assets')
          .upload(filePath, contract_file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Contract file upload failed: ${uploadError.message}. Ensure RLS is configured for INSERT on 'creator-assets' bucket.`);
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
        const filePath = `${creator_id}/brand_deals/${sanitizedBrandName}-invoice-${Date.now()}.${fileExtension}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('creator-assets')
          .upload(filePath, invoice_file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Invoice file upload failed: ${uploadError.message}. Ensure RLS is configured for INSERT on 'creator-assets' bucket.`);
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
      
      let finalStatus = status;
      // Consistency Check: If payment received date is provided, force status to Completed.
      if (payment_received_date) {
          finalStatus = 'Completed';
      }

      const insertPayload: any = {
          creator_id,
          organization_id, // INCLUDE NEW FIELD
          brand_name,
          deal_amount,
          deliverables,
          due_date,
          payment_expected_date,
          status: finalStatus, // Use finalStatus
          contract_file_url,
          invoice_file_url,
          contact_person,
          platform,
          utr_number,
          brand_email,
          payment_received_date,
      };

      // Add brand_domain if provided
      if (brand_domain) {
        insertPayload.brand_domain = brand_domain;
      }
      
      console.log('DEBUG: Brand Deal Insert Payload:', insertPayload); // <-- DEBUG LOG

      const { data: insertedData, error: insertError } = await supabase
        .from('brand_deals')
        .insert(insertPayload)
        .select('id')
        .single();

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
        throw new Error(`Failed to record brand deal in database: ${insertError.message}. Ensure RLS is configured for INSERT on 'brand_deals' table.`);
      }

      // Fetch brand logo asynchronously (don't wait for it)
      if (insertedData?.id) {
        supabase.functions
          .invoke('fetch-brand-logo', {
            body: {
              brand_name,
              brand_domain: brand_domain || null,
              deal_id: insertedData.id,
              creator_id,
            },
          })
          .catch((error) => {
            console.error('Error fetching brand logo:', error);
            // Don't throw - logo fetching is non-critical
          });
      }
    },
    {
      onSuccess: (_, variables) => {
        // Invalidate all brand_deals queries for this creator to ensure fresh data
        queryClient.invalidateQueries({ 
          queryKey: ['brand_deals', variables.creator_id],
          exact: false 
        });
      },
      successMessage: 'Brand deal added successfully!',
      errorMessage: 'Failed to add brand deal',
    }
  );
};

interface UpdateBrandDealVariables {
  id: string;
  creator_id: string;
  organization_id?: string; // NEW: Optional field for update
  brand_name?: string;
  brand_domain?: string; // NEW: Optional brand domain
  deal_amount?: number;
  deliverables?: string;
  contract_file?: File | null;
  due_date?: string;
  payment_expected_date?: string;
  contact_person?: string | null;
  platform?: string | null;
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
    async ({ id, creator_id, contract_file, original_contract_file_url, invoice_file, original_invoice_file_url, organization_id, ...updates }) => {
      let contract_file_url: string | null | undefined = undefined;
      let invoice_file_url: string | null | undefined = undefined;

      const sanitizeName = (name: string) => name.trim().replace(/\s/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
      const sanitizedBrandName = updates.brand_name ? sanitizeName(updates.brand_name) : 'contract';

      // Handle contract file update
      if (contract_file !== undefined) {
        if (original_contract_file_url) {
          const oldFilePath = original_contract_file_url.split('/creator-assets/')[1];
          if (oldFilePath) { 
            const { error: deleteError } = await supabase.storage.from('creator-assets').remove([oldFilePath]);
            if (deleteError) console.warn('Failed to delete old contract file:', deleteError.message);
          }
        }
        if (contract_file) {
          const fileExtension = contract_file.name.split('.').pop();
          const filePath = `${creator_id}/brand_deals/${sanitizedBrandName}-contract-${Date.now()}.${fileExtension}`;
          const { data: uploadData, error: uploadError } = await supabase.storage.from('creator-assets').upload(filePath, contract_file, { cacheControl: '3600', upsert: false });
          if (uploadError) { throw new Error(`Contract file upload failed: ${uploadError.message}. Ensure RLS is configured for INSERT on 'creator-assets' bucket.`); }
          const { data: publicUrlData } = supabase.storage.from('creator-assets').getPublicUrl(filePath);
          if (!publicUrlData?.publicUrl) { await supabase.storage.from('creator-assets').remove([filePath]); throw new Error('Failed to get public URL for the uploaded contract file.'); }
          contract_file_url = publicUrlData.publicUrl;
        } else { contract_file_url = null; }
      }

      // Handle invoice file update
      if (invoice_file !== undefined) {
        if (original_invoice_file_url) {
          const oldFilePath = original_invoice_file_url.split('/creator-assets/')[1];
          if (oldFilePath) { 
            const { error: deleteError } = await supabase.storage.from('creator-assets').remove([oldFilePath]);
            if (deleteError) console.warn('Failed to delete old invoice file:', deleteError.message);
          }
        }
        if (invoice_file) {
          const fileExtension = invoice_file.name.split('.').pop();
          const filePath = `${creator_id}/brand_deals/${sanitizedBrandName}-invoice-${Date.now()}.${fileExtension}`;
          const { data: uploadData, error: uploadError } = await supabase.storage.from('creator-assets').upload(filePath, invoice_file, { cacheControl: '3600', upsert: false });
          if (uploadError) { throw new Error(`Invoice file upload failed: ${uploadError.message}. Ensure RLS is configured for INSERT on 'creator-assets' bucket.`); }
          const { data: publicUrlData } = supabase.storage.from('creator-assets').getPublicUrl(filePath);
          if (!publicUrlData?.publicUrl) { await supabase.storage.from('creator-assets').remove([filePath]); throw new Error('Failed to get public URL for the uploaded invoice file.'); }
          invoice_file_url = publicUrlData.publicUrl;
        } else { invoice_file_url = null; }
      }

      const updatePayload: Record<string, any> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Only include file URLs if they were explicitly handled (i.e., file was uploaded or explicitly set to null)
      if (contract_file_url !== undefined) {
        updatePayload.contract_file_url = contract_file_url;
      }
      if (invoice_file_url !== undefined) {
        updatePayload.invoice_file_url = invoice_file_url;
      }
      
      if (organization_id !== undefined) { // Include organization_id if provided
          updatePayload.organization_id = organization_id;
      }

      // Add brand_domain if provided
      if (updates.brand_domain !== undefined) {
        updatePayload.brand_domain = updates.brand_domain;
      }

      // Consistency Check: If payment received date is provided, force status to Completed.
      if (updates.payment_received_date) {
          updatePayload.status = 'Completed';
      } else if (updates.payment_received_date === null && updatePayload.status === 'Completed') {
          // If payment date is cleared, revert status to Payment Pending
          updatePayload.status = 'Payment Pending';
      }

      const { error } = await supabase
        .from('brand_deals')
        .update(updatePayload)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Fetch brand logo asynchronously if brand_name or brand_domain changed (don't wait for it)
      if ((updates.brand_name || updates.brand_domain) && !updatePayload.brand_logo_url) {
        supabase.functions
          .invoke('fetch-brand-logo', {
            body: {
              brand_name: updates.brand_name || '',
              brand_domain: updates.brand_domain || null,
              deal_id: id,
              creator_id,
            },
          })
          .catch((error) => {
            console.error('Error fetching brand logo:', error);
            // Don't throw - logo fetching is non-critical
          });
      }
    },
    {
      onSuccess: (_, variables) => {
        // Invalidate all brand_deals queries for this creator to ensure fresh data
        queryClient.invalidateQueries({ 
          queryKey: ['brand_deals', variables.creator_id],
          exact: false 
        });
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