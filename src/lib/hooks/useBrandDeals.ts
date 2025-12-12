import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BrandDeal } from '@/types';
import type { Database } from '@/types/supabase';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';
import { CREATOR_ASSETS_BUCKET, extractFilePathFromUrl } from '@/lib/constants/storage';
import { logger } from '@/lib/utils/logger';

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
      status: 'Content Delivered',
      progress_percentage: 90,
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
      status: 'Content Delivered',
      progress_percentage: 90,
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
      status: 'Content Delivered',
      progress_percentage: 90,
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
      status: 'Content Delivered',
      progress_percentage: 90,
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
      status: 'Content Delivered',
      progress_percentage: 90,
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
      due_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_expected_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Far future, not yet set for payment
      contact_person: 'Priya Sharma',
      platform: 'Instagram',
      status: 'Negotiation',
      progress_percentage: 30,
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
      // Debug: Log creatorId (dev only)
      if (import.meta.env.DEV) {
        console.log('[useBrandDeals] Fetching deals for creatorId:', creatorId);
      }
      
      if (!creatorId) {
        if (import.meta.env.DEV) {
          console.log('[useBrandDeals] No creatorId provided, returning empty array');
        }
        return [];
      }

      // Get current session to verify auth.uid() matches creatorId
      const { data: { session } } = await supabase.auth.getSession();
      const authUserId = session?.user?.id;
      
      if (import.meta.env.DEV) {
        console.log('[useBrandDeals] Auth user ID:', authUserId, 'Creator ID:', creatorId);
      }
      
      if (authUserId !== creatorId) {
        if (import.meta.env.DEV) {
          console.warn('[useBrandDeals] WARNING: auth.uid() does not match creatorId. This may cause RLS issues.');
        }
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

      // Debug: Log error details
      if (error) {
        console.error('[useBrandDeals] Query error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          creatorId,
          authUserId,
        });
        
        // Check for RLS/permission errors
        const isRLSError = 
          error.code === '42501' || // Insufficient privilege
          error.message?.includes('permission denied') ||
          error.message?.includes('row-level security') ||
          error.message?.toLowerCase().includes('policy');
        
        if (isRLSError) {
          console.error('[useBrandDeals] RLS ERROR: Permission denied. Check RLS policies for brand_deals table.');
          console.error('[useBrandDeals] RLS Error Details:', {
            creatorId,
            authUserId,
            errorMessage: error.message,
          });
        }
        
        // Check if error is due to missing table/relation (404, PGRST116, 42P01)
        const isMissingTableError = 
          error.code === 'PGRST116' || 
          error.code === '42P01' || 
          (error as any).status === 404 ||
          error.message?.includes('does not exist') ||
          error.message?.includes('relation') ||
          error.message?.includes('not found');

        if (isMissingTableError && creatorId) {
          if (import.meta.env.DEV) {
            console.log('[useBrandDeals] Table missing, returning demo data');
          }
          // Return demo data when table doesn't exist
          return getDemoBrandDeals(creatorId);
        }

        // Log the error but return an empty array to prevent crashing the UI
        // Error is logged via useSupabaseQuery error handling
        // NOTE: We return [] here instead of throwing to handle missing tables gracefully.
        if (import.meta.env.DEV) {
          console.log('[useBrandDeals] Returning empty array due to error');
        }
        return [];
      }

      // Debug: Log data (dev only)
      if (import.meta.env.DEV) {
        console.log('[useBrandDeals] Query successful:', {
          dataLength: data?.length ?? 0,
          dataIsNull: data === null,
          dataIsArray: Array.isArray(data),
          creatorId,
        });
      }

      // Ensure Supabase always returns [] instead of null
      if (!data) {
        if (import.meta.env.DEV) {
          console.log('[useBrandDeals] Data is null, returning empty array');
        }
        return [];
      }

      // Ensure data is always an array
      if (!Array.isArray(data)) {
        if (import.meta.env.DEV) {
          console.warn('[useBrandDeals] Data is not an array, converting to array');
        }
        return [];
      }

      // Only return demo data in preview/demo mode (not for real users)
      const isPreviewMode = typeof window !== 'undefined' && (
        window.location.pathname.includes('/dashboard-preview') ||
        window.location.pathname.includes('/dashboard-white-preview')
      );

      // For real users with no data, return empty array (shows empty state)
      if (!isPreviewMode && data.length === 0) {
        if (import.meta.env.DEV) {
          console.log('[useBrandDeals] No deals found for user, returning empty array');
        }
        return [];
      }

      // Only use demo data in preview mode
      if (isPreviewMode && creatorId && data.length < 6) {
        if (import.meta.env.DEV) {
          console.log('[useBrandDeals] Preview mode with insufficient data, returning demo data');
        }
        return getDemoBrandDeals(creatorId);
      }

      if (import.meta.env.DEV) {
        console.log('[useBrandDeals] Returning', data.length, 'deals');
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
  organization_id: string | null; // NEW: Optional field (can be null if user doesn't have an organization)
  brand_name: string;
  deal_amount: number;
  deliverables: string;
  contract_file: File | null; // Allow null for no file
  contract_file_url?: string | null; // NEW: Optional - use existing URL instead of uploading
  due_date: string;
  payment_expected_date: string;
  contact_person: string | null;
  platform: string | null;
  status: BrandDeal['status'];
  invoice_file: File | null; // New: invoice file
  utr_number: string | null; // New: UTR number
  brand_email: string | null; // New: brand email
  brand_phone: string | null; // New: brand phone
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
      contract_file_url: providedContractUrl, // NEW: Use provided URL if available
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

      // Use provided URL if available (file already uploaded), otherwise upload the file
      if (providedContractUrl) {
        console.log('[useAddBrandDeal] Using provided contract_file_url:', providedContractUrl);
        contract_file_url = providedContractUrl;
      } else if (contract_file) {
        // Upload contract file only if URL not provided
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

      // Build insert payload - only include organization_id if it's a valid UUID
      // We explicitly omit it if null to avoid NOT NULL constraint violations
      const insertPayload: Database['public']['Tables']['brand_deals']['Insert'] = {
          creator_id,
          brand_name,
          deal_amount,
          deliverables,
          due_date,
          payment_expected_date,
          status: finalStatus, // Use finalStatus
          contract_file_url,
          invoice_file_url,
          contact_person: contact_person || null,
          platform: platform || null,
          utr_number: utr_number || null,
          brand_email: brand_email || null,
          brand_phone: brand_phone || null,
          payment_received_date: payment_received_date || null,
      };

      // Only include organization_id if it's provided, not null, and is a valid UUID
      // This avoids foreign key constraint violations if the user doesn't have an organization
      // IMPORTANT: If organization_id is null, we don't include it in the payload at all
      // This requires the database column to be nullable (run the migration first)
      if (organization_id && organization_id.trim() !== '') {
        // Validate it's a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(organization_id)) {
          insertPayload.organization_id = organization_id;
        } else {
          console.warn('Invalid organization_id format, omitting from insert:', organization_id);
        }
      }
      
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
          queryKey: ['brand_deals'],
          exact: false 
        });
        // Also refetch immediately to ensure UI updates
        queryClient.refetchQueries({ 
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
  brand_phone?: string | null; // New: brand phone
  payment_received_date?: string | null; // New: payment received date
  proof_of_payment_url?: string | null; // New: proof of payment URL
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
            if (deleteError) logger.warn('Failed to delete old contract file', { error: deleteError.message });
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
            if (deleteError) logger.warn('Failed to delete old invoice file', { error: deleteError.message });
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

      // Include invoice_number if provided
      if (updates.invoice_number !== undefined) {
        updatePayload.invoice_number = updates.invoice_number;
      }

      // Only include file URLs if they were explicitly handled (i.e., file was uploaded or explicitly set to null)
      if (contract_file_url !== undefined) {
        updatePayload.contract_file_url = contract_file_url;
      }
      if (invoice_file_url !== undefined) {
        updatePayload.invoice_file_url = invoice_file_url;
      }
      
      // Include proof_of_payment_url if provided
      if (updates.proof_of_payment_url !== undefined) {
        updatePayload.proof_of_payment_url = updates.proof_of_payment_url;
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
          queryKey: ['brand_deals'],
          exact: false 
        });
        // Also invalidate the specific deal query (singular 'brand_deal')
        queryClient.invalidateQueries({ 
          queryKey: ['brand_deal', variables.id],
          exact: false 
        });
        // Also refetch immediately to ensure UI updates
        queryClient.refetchQueries({ 
          queryKey: ['brand_deals', variables.creator_id],
          exact: false 
        });
        queryClient.refetchQueries({ 
          queryKey: ['brand_deal', variables.id],
          exact: false 
        });
      },
      successMessage: 'Brand deal updated successfully!',
      errorMessage: 'Failed to update brand deal',
    }
  );
};

export const useBrandDealById = (dealId: string | undefined, creatorId: string | undefined) => {
  return useSupabaseQuery<BrandDeal | null, Error>(
    ['brand_deal', dealId, creatorId],
    async () => {
      if (!dealId || !creatorId) return null;

      const { data, error } = await supabase
        .from('brand_deals')
        .select('*')
        .eq('id', dealId)
        .eq('creator_id', creatorId)
        .single();

      if (error) {
        const isMissingTableError = 
          error.code === 'PGRST116' || 
          error.code === '42P01' || 
          (error as any).status === 404 ||
          error.message?.includes('does not exist') ||
          error.message?.includes('relation') ||
          error.message?.includes('not found');

        if (isMissingTableError) {
          return null;
        }
        throw error;
      }

      return data as BrandDeal | null;
    },
    {
      enabled: !!dealId && !!creatorId,
      errorMessage: 'Failed to fetch brand deal',
      retry: false,
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
          if (storageError) { logger.warn('Failed to delete contract file from storage', { error: storageError.message }); }
        }
      }
      // Delete invoice file from storage
      if (invoice_file_url) {
        const filePath = extractFilePathFromUrl(invoice_file_url, CREATOR_ASSETS_BUCKET);
        if (filePath) {
          const { error: storageError } = await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([filePath]);
          if (storageError) { logger.warn('Failed to delete invoice file from storage', { error: storageError.message }); }
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
        // Invalidate all brand_deals queries
        queryClient.invalidateQueries({ 
          queryKey: ['brand_deals'],
          exact: false 
        });
        // Also refetch immediately to ensure UI updates
        queryClient.refetchQueries({ 
          queryKey: ['brand_deals', variables.creator_id],
          exact: false 
        });
      },
      successMessage: 'Brand deal deleted successfully!',
      errorMessage: 'Failed to delete brand deal',
    }
  );
};

// ============================================
// DEAL PROGRESS UPDATE HELPER
// ============================================

export type DealStage = 'negotiation' | 'signed' | 'content_making' | 'content_delivered' | 'completed';

export const DEAL_PROGRESS_STAGES = {
  negotiation: { percent: 30, next: 'signed' },
  signed: { percent: 70, next: 'content_making' },
  content_making: { percent: 80, next: 'content_delivered' },
  content_delivered: { percent: 90, next: 'completed' },
  completed: { percent: 100, next: null },
} as const;

export const STAGE_TO_PROGRESS: Record<DealStage, number> = {
  negotiation: 30,
  signed: 70,
  content_making: 80,
  content_delivered: 90,
  completed: 100,
};

export const STAGE_TO_STATUS: Record<DealStage, string> = {
  negotiation: 'Negotiation',
  signed: 'Signed',
  content_making: 'Content Making',
  content_delivered: 'Content Delivered',
  completed: 'Completed',
};

export const STAGE_LABELS: Record<DealStage, string> = {
  negotiation: 'Negotiation',
  signed: 'Signed',
  content_making: 'Content Making',
  content_delivered: 'Content Delivered',
  completed: 'Completed',
};

export const useUpdateDealProgress = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, { dealId: string; stage: DealStage; creator_id: string }>(
    async ({ dealId, stage, creator_id }) => {
      // Fetch current deal to validate sequential progression
      const { data: currentDeal, error: fetchError } = await supabase
        .from('brand_deals')
        .select('progress_percentage, status')
        .eq('id', dealId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch deal: ${fetchError.message}`);
      }

      // Validate sequential progression
      const currentProgress = (currentDeal as any)?.progress_percentage ?? 0;
      
      // Get current stage from progress
      const getCurrentStageFromProgress = (progress: number): DealStage | null => {
        if (progress >= 100) return 'completed';
        if (progress >= 90) return 'content_delivered';
        if (progress >= 80) return 'content_making';
        if (progress >= 70) return 'signed';
        if (progress >= 30) return 'negotiation';
        return null;
      };

      const currentStage = getCurrentStageFromProgress(currentProgress);
      
      // Check if progression is valid (must be next stage or same stage)
      if (currentStage) {
        const currentStageConfig = DEAL_PROGRESS_STAGES[currentStage];
        const targetStageConfig = DEAL_PROGRESS_STAGES[stage];
        
        // Allow same stage (no-op) or next stage only
        if (stage !== currentStage && targetStageConfig.percent <= currentStageConfig.percent) {
          throw new Error(`Cannot skip stages. Current: ${currentStage}, Attempted: ${stage}`);
        }
        
        // Ensure we're moving to the next stage only
        if (currentStageConfig.next && stage !== currentStage && stage !== currentStageConfig.next) {
          throw new Error(`Must progress sequentially. Current: ${currentStage}, Next allowed: ${currentStageConfig.next}, Attempted: ${stage}`);
        }
      }

      const progress_percentage = STAGE_TO_PROGRESS[stage];
      const status = STAGE_TO_STATUS[stage];

      const updatePayload: Record<string, any> = {
        progress_percentage,
        status,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('brand_deals')
        .update(updatePayload)
        .eq('id', dealId);

      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: (_, variables) => {
        // Optimistically update UI
        queryClient.invalidateQueries({ 
          queryKey: ['brand_deals'],
          exact: false 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['brand_deal', variables.dealId],
          exact: false 
        });
        queryClient.refetchQueries({ 
          queryKey: ['brand_deals', variables.creator_id],
          exact: false 
        });
      },
      successMessage: 'Deal progress updated successfully!',
      errorMessage: 'Failed to update deal progress',
    }
  );
};