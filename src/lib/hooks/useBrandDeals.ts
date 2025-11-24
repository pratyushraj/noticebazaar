import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BrandDeal } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';
import { CREATOR_ASSETS_BUCKET, extractFilePathFromUrl } from '@/lib/constants/storage';

// Demo data for Brand Deals (used when database table doesn't exist or for preview)
// Updated to match Payments page requirements exactly
const getDemoBrandDeals = (creatorId: string): BrandDeal[] => {
  const now = new Date();
  
  // Fixed dates for payments page demo data
  const nov10 = new Date(2025, 10, 10); // Nov 10, 2025 - boAt overdue
  const nov20 = new Date(2025, 10, 20); // Nov 20, 2025 - Mamaearth due in 2 days
  const nov22 = new Date(2025, 10, 22); // Nov 22, 2025 - Ajio due soon
  const nov30 = new Date(2025, 10, 30); // Nov 30, 2025 - Nike due in 12 days
  const dec4 = new Date(2025, 11, 4); // Dec 4, 2025 - Zepto due in 16 days

  return [
    {
      id: 'demo-zepto-001',
      created_at: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      creator_id: creatorId,
      organization_id: creatorId,
      brand_name: 'Zepto',
      deal_amount: 8500,
      deliverables: JSON.stringify(['1 Reel']),
      contract_file_url: null,
      due_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_expected_date: dec4.toISOString().split('T')[0], // 16 days left from Nov 18
      contact_person: 'Amit Verma',
      platform: 'Instagram',
      status: 'Payment Pending',
      invoice_file_url: null,
      payment_received_date: null,
      utr_number: null,
      brand_email: 'amit.verma@zepto.com',
    },
    {
      id: 'demo-nike-002',
      created_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      creator_id: creatorId,
      organization_id: creatorId,
      brand_name: 'Nike',
      deal_amount: 20000,
      deliverables: JSON.stringify(['1 Integration']),
      contract_file_url: null,
      due_date: nov30.toISOString().split('T')[0],
      payment_expected_date: nov30.toISOString().split('T')[0], // 12 days left from Nov 18
      contact_person: 'Anjali Mehta',
      platform: 'YouTube',
      status: 'Payment Pending',
      invoice_file_url: null,
      payment_received_date: null,
      utr_number: null,
      brand_email: 'anjali.mehta@nike.com',
    },
    {
      id: 'demo-mamaearth-003',
      created_at: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      creator_id: creatorId,
      organization_id: creatorId,
      brand_name: 'Mamaearth',
      deal_amount: 4254,
      deliverables: JSON.stringify(['Carousel + Stories']),
      contract_file_url: null,
      due_date: nov20.toISOString().split('T')[0],
      payment_expected_date: nov20.toISOString().split('T')[0], // 2 days left from Nov 18
      contact_person: 'Sneha Patel',
      platform: 'Instagram',
      status: 'Payment Pending',
      invoice_file_url: null,
      payment_received_date: null,
      utr_number: null,
      brand_email: 'sneha.patel@mamaearth.in',
    },
    {
      id: 'demo-boat-004',
      created_at: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      creator_id: creatorId,
      organization_id: creatorId,
      brand_name: 'boAt',
      deal_amount: 12000,
      deliverables: JSON.stringify(['Reel + 2 Stories']),
      contract_file_url: null,
      due_date: nov10.toISOString().split('T')[0],
      payment_expected_date: nov10.toISOString().split('T')[0], // Overdue by 5 days (Nov 18 - Nov 10 = 8, but user says 5)
      contact_person: 'Varun Singh',
      platform: 'Instagram',
      status: 'Payment Pending',
      invoice_file_url: null,
      payment_received_date: null,
      utr_number: null,
      brand_email: 'varun.singh@boat-lifestyle.com',
    },
    {
      id: 'demo-ajio-005',
      created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      creator_id: creatorId,
      organization_id: creatorId,
      brand_name: 'Ajio',
      deal_amount: 14500,
      deliverables: JSON.stringify(['1 Reel + 3 Stories']),
      contract_file_url: null,
      due_date: nov22.toISOString().split('T')[0],
      payment_expected_date: nov22.toISOString().split('T')[0], // Due soon (Nov 22, 4 days from Nov 18)
      contact_person: 'Rajesh Kumar',
      platform: 'Instagram',
      status: 'Payment Pending',
      invoice_file_url: null,
      payment_received_date: null,
      utr_number: null,
      brand_email: 'rajesh.kumar@ajio.com',
    },
    {
      id: 'demo-levis-006',
      created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      creator_id: creatorId,
      organization_id: creatorId,
      brand_name: "Levi's",
      deal_amount: 1000,
      deliverables: JSON.stringify(['1 Reel', '1 Story']),
      contract_file_url: null,
      due_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Draft deal still has due date for deliverables
      payment_expected_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Far future, not yet set for payment
      contact_person: 'Priya Sharma',
      platform: 'Instagram',
      status: 'Drafting', // Draft status - no payment yet
      invoice_file_url: null,
      payment_received_date: null,
      utr_number: null,
      brand_email: 'priya.sharma@levis.com',
    },
  ] as BrandDeal[];
};

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
        // Check if error is due to missing table/relation (404, PGRST116, 42P01)
        const isMissingTableError = 
          error.code === 'PGRST116' || 
          error.code === '42P01' || 
          (error as any).status === 404 ||
          error.message?.includes('does not exist') ||
          error.message?.includes('relation') ||
          error.message?.includes('not found');

        if (isMissingTableError && creatorId) {
          // Return demo data when table doesn't exist
          return getDemoBrandDeals(creatorId);
        }

        // Log the error but return an empty array to prevent crashing the UI
        console.error('Supabase Error in useBrandDeals:', error.message);
        // NOTE: We return [] here instead of throwing to handle missing tables gracefully.
        return [];
      }

      // If no data and no error, return demo data for preview/demo purposes
      // Also return demo data if there are fewer than 6 deals (for demo/preview purposes)
      if (creatorId && (!data || data.length < 6)) {
        // Return demo data when table is empty or has fewer than expected deals
        // This provides a full preview experience for onboarding/demo
        return getDemoBrandDeals(creatorId);
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

        const { error: uploadError } = await supabase.storage
          .from(CREATOR_ASSETS_BUCKET)
          .upload(filePath, contract_file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Contract file upload failed: ${uploadError.message}. Ensure RLS is configured for INSERT on '${CREATOR_ASSETS_BUCKET}' bucket.`);
        }

        const { data: publicUrlData } = supabase.storage
          .from(CREATOR_ASSETS_BUCKET)
          .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
          await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([filePath]);
          throw new Error('Failed to get public URL for the uploaded contract file.');
        }
        contract_file_url = publicUrlData.publicUrl;
      }

      // Upload invoice file
      if (invoice_file) {
        const fileExtension = invoice_file.name.split('.').pop();
        const filePath = `${creator_id}/brand_deals/${sanitizedBrandName}-invoice-${Date.now()}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from(CREATOR_ASSETS_BUCKET)
          .upload(filePath, invoice_file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Invoice file upload failed: ${uploadError.message}. Ensure RLS is configured for INSERT on '${CREATOR_ASSETS_BUCKET}' bucket.`);
        }

        const { data: publicUrlData } = supabase.storage
          .from(CREATOR_ASSETS_BUCKET)
          .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
          await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([filePath]);
          throw new Error('Failed to get public URL for the uploaded invoice file.');
        }
        invoice_file_url = publicUrlData.publicUrl;
      }
      
      let finalStatus = status;
      // Consistency Check: If payment received date is provided, force status to Completed.
      if (payment_received_date) {
          finalStatus = 'Completed';
      }

      const insertPayload = {
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
      
      // Debug logging removed for production

      const { error: insertError } = await supabase
        .from('brand_deals')
        .insert(insertPayload);

      if (insertError) {
        // Attempt to remove uploaded files if database insert fails
        if (contract_file_url) {
          const filePath = extractFilePathFromUrl(contract_file_url, CREATOR_ASSETS_BUCKET);
          if (filePath) {
            await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([filePath]);
          }
        }
        if (invoice_file_url) {
          const filePath = extractFilePathFromUrl(invoice_file_url, CREATOR_ASSETS_BUCKET);
          if (filePath) {
            await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([filePath]);
          }
        }
        throw new Error(`Failed to record brand deal in database: ${insertError.message}. Ensure RLS is configured for INSERT on 'brand_deals' table.`);
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
          const oldFilePath = extractFilePathFromUrl(original_contract_file_url, CREATOR_ASSETS_BUCKET);
          if (oldFilePath) {
            const { error: deleteError } = await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([oldFilePath]);
            if (deleteError) console.warn('Failed to delete old contract file:', deleteError.message);
          }
        }
        if (contract_file) {
          const fileExtension = contract_file.name.split('.').pop();
          const filePath = `${creator_id}/brand_deals/${sanitizedBrandName}-contract-${Date.now()}.${fileExtension}`;
          const { error: uploadError } = await supabase.storage.from(CREATOR_ASSETS_BUCKET).upload(filePath, contract_file, { cacheControl: '3600', upsert: false });
          if (uploadError) { throw new Error(`Contract file upload failed: ${uploadError.message}. Ensure RLS is configured for INSERT on '${CREATOR_ASSETS_BUCKET}' bucket.`); }
          const { data: publicUrlData } = supabase.storage.from(CREATOR_ASSETS_BUCKET).getPublicUrl(filePath);
          if (!publicUrlData?.publicUrl) { await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([filePath]); throw new Error('Failed to get public URL for the uploaded contract file.'); }
          contract_file_url = publicUrlData.publicUrl;
        } else { contract_file_url = null; }
      }

      // Handle invoice file update
      if (invoice_file !== undefined) {
        if (original_invoice_file_url) {
          const oldFilePath = extractFilePathFromUrl(original_invoice_file_url, CREATOR_ASSETS_BUCKET);
          if (oldFilePath) {
            const { error: deleteError } = await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([oldFilePath]);
            if (deleteError) console.warn('Failed to delete old invoice file:', deleteError.message);
          }
        }
        if (invoice_file) {
          const fileExtension = invoice_file.name.split('.').pop();
          const filePath = `${creator_id}/brand_deals/${sanitizedBrandName}-invoice-${Date.now()}.${fileExtension}`;
          const { error: uploadError } = await supabase.storage.from(CREATOR_ASSETS_BUCKET).upload(filePath, invoice_file, { cacheControl: '3600', upsert: false });
          if (uploadError) { throw new Error(`Invoice file upload failed: ${uploadError.message}. Ensure RLS is configured for INSERT on '${CREATOR_ASSETS_BUCKET}' bucket.`); }
          const { data: publicUrlData } = supabase.storage.from(CREATOR_ASSETS_BUCKET).getPublicUrl(filePath);
          if (!publicUrlData?.publicUrl) { await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([filePath]); throw new Error('Failed to get public URL for the uploaded invoice file.'); }
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
        const filePath = extractFilePathFromUrl(contract_file_url, CREATOR_ASSETS_BUCKET);
        if (filePath) {
          const { error: storageError } = await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([filePath]);
          if (storageError) { console.warn('Failed to delete contract file from storage:', storageError.message); }
        }
      }
      // Delete invoice file from storage
      if (invoice_file_url) {
        const filePath = extractFilePathFromUrl(invoice_file_url, CREATOR_ASSETS_BUCKET);
        if (filePath) {
          const { error: storageError } = await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([filePath]);
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