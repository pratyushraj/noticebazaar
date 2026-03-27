import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';
import { CREATOR_ASSETS_BUCKET, extractFilePathFromUrl } from '@/lib/constants/storage';
import { useQueryClient } from '@tanstack/react-query';

export interface Expense {
  id: string;
  created_at: string;
  updated_at: string;
  creator_id: string;
  organization_id?: string | null;
  amount: number;
  category: string;
  description?: string | null;
  expense_date: string;
  receipt_file_url?: string | null;
  vendor_name?: string | null;
  payment_method?: string | null;
  tags?: string[] | null;
}

interface UseExpensesOptions {
  creatorId: string;
  enabled?: boolean;
  startDate?: string;
  endDate?: string;
  category?: string;
}

export const useExpenses = (options: UseExpensesOptions) => {
  const { creatorId, enabled = true, startDate, endDate, category } = options;

  return useSupabaseQuery<Expense[], Error>(
    ['expenses', creatorId, startDate, endDate, category],
    async () => {
      if (!creatorId) {
        return [];
      }

      let query = supabase
        .from('expenses')
        .select('*')
        .eq('creator_id', creatorId)
        .order('expense_date', { ascending: false });

      if (startDate) {
        query = query.gte('expense_date', startDate);
      }

      if (endDate) {
        query = query.lte('expense_date', endDate);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        const isMissingTableError = 
          error.code === 'PGRST116' || 
          error.code === '42P01' || 
          (error as any).status === 404 ||
          error.message?.includes('does not exist') ||
          error.message?.includes('relation') ||
          error.message?.includes('not found');

        if (isMissingTableError) {
          return [];
        }

        return [];
      }

      return (data || []) as Expense[];
    },
    {
      enabled: enabled && !!creatorId,
      errorMessage: 'Failed to fetch expenses',
      retry: false,
    }
  );
};

interface AddExpenseVariables {
  creator_id: string;
  organization_id?: string;
  amount: number;
  category: string;
  description?: string;
  expense_date: string;
  receipt_file?: File | null;
  vendor_name?: string;
  payment_method?: string;
  tags?: string[];
}

export const useAddExpense = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, AddExpenseVariables>(
    async ({ creator_id, organization_id, amount, category, description, expense_date, receipt_file, vendor_name, payment_method, tags }) => {
      let receipt_file_url: string | null = null;

      // Upload receipt file if provided
      if (receipt_file) {
        const fileExtension = receipt_file.name.split('.').pop();
        const sanitizedCategory = category.trim().replace(/\s/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
        const filePath = `${creator_id}/expenses/${sanitizedCategory}-${Date.now()}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from(CREATOR_ASSETS_BUCKET)
          .upload(filePath, receipt_file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Receipt file upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from(CREATOR_ASSETS_BUCKET)
          .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
          await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([filePath]);
          throw new Error('Failed to get public URL for the uploaded receipt file.');
        }
        receipt_file_url = publicUrlData.publicUrl;
      }

      const insertPayload: any = {
        creator_id,
        amount,
        category,
        expense_date,
        description: description?.trim() || null,
        vendor_name: vendor_name?.trim() || null,
        payment_method: payment_method || null,
        tags: tags || null,
        receipt_file_url,
      };

      if (organization_id) {
        insertPayload.organization_id = organization_id;
      }

      const { error: insertError } = await supabase
        .from('expenses')
        .insert(insertPayload);

      if (insertError) {
        // Attempt to remove uploaded file if database insert fails
        if (receipt_file_url) {
          const filePath = extractFilePathFromUrl(receipt_file_url, CREATOR_ASSETS_BUCKET);
          if (filePath) {
            await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([filePath]);
          }
        }
        throw new Error(`Failed to save expense: ${insertError.message}`);
      }
    },
    {
      onSuccess: (_, variables) => {
        // Invalidate all expenses queries
        queryClient.invalidateQueries({ 
          queryKey: ['expenses'],
          exact: false 
        });
        // Also refetch immediately
        queryClient.refetchQueries({ 
          queryKey: ['expenses', variables.creator_id],
          exact: false 
        });
      },
      successMessage: 'Expense added successfully!',
      errorMessage: 'Failed to add expense',
    }
  );
};

interface UpdateExpenseVariables {
  id: string;
  creator_id: string;
  amount?: number;
  category?: string;
  description?: string;
  expense_date?: string;
  receipt_file?: File | null;
  original_receipt_file_url?: string | null;
  vendor_name?: string;
  payment_method?: string;
  tags?: string[];
}

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, UpdateExpenseVariables>(
    async ({ id, creator_id, receipt_file, original_receipt_file_url, ...updates }) => {
      let receipt_file_url: string | null | undefined = undefined;

      // Handle receipt file update
      if (receipt_file !== undefined) {
        if (original_receipt_file_url) {
          const oldFilePath = extractFilePathFromUrl(original_receipt_file_url, CREATOR_ASSETS_BUCKET);
          if (oldFilePath) {
            await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([oldFilePath]);
          }
        }
        if (receipt_file) {
          const fileExtension = receipt_file.name.split('.').pop();
          const sanitizedCategory = (updates.category || 'expense').trim().replace(/\s/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
          const filePath = `${creator_id}/expenses/${sanitizedCategory}-${Date.now()}.${fileExtension}`;
          const { error: uploadError } = await supabase.storage.from(CREATOR_ASSETS_BUCKET).upload(filePath, receipt_file, { cacheControl: '3600', upsert: false });
          if (uploadError) { throw new Error(`Receipt file upload failed: ${uploadError.message}`); }
          const { data: publicUrlData } = supabase.storage.from(CREATOR_ASSETS_BUCKET).getPublicUrl(filePath);
          if (!publicUrlData?.publicUrl) { await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([filePath]); throw new Error('Failed to get public URL for the uploaded receipt file.'); }
          receipt_file_url = publicUrlData.publicUrl;
        } else { receipt_file_url = null; }
      }

      const updatePayload: any = { ...updates };
      if (receipt_file_url !== undefined) {
        updatePayload.receipt_file_url = receipt_file_url;
      }

      const { error } = await supabase
        .from('expenses')
        .update(updatePayload)
        .eq('id', id)
        .eq('creator_id', creator_id);

      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ 
          queryKey: ['expenses'],
          exact: false 
        });
        queryClient.refetchQueries({ 
          queryKey: ['expenses', variables.creator_id],
          exact: false 
        });
      },
      successMessage: 'Expense updated successfully!',
      errorMessage: 'Failed to update expense',
    }
  );
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, { id: string; creator_id: string; receipt_file_url: string | null }>(
    async ({ id, creator_id, receipt_file_url }) => {
      // Delete receipt file from storage
      if (receipt_file_url) {
        const filePath = extractFilePathFromUrl(receipt_file_url, CREATOR_ASSETS_BUCKET);
        if (filePath) {
          await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([filePath]);
        }
      }

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('creator_id', creator_id);

      if (error) {
        throw new Error(`Failed to delete expense: ${error.message}`);
      }
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ 
          queryKey: ['expenses'],
          exact: false 
        });
        queryClient.refetchQueries({ 
          queryKey: ['expenses', variables.creator_id],
          exact: false 
        });
      },
      successMessage: 'Expense deleted successfully!',
      errorMessage: 'Failed to delete expense',
    }
  );
};

