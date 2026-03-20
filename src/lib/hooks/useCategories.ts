import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';

interface UseCategoriesOptions {
  clientId?: string; // Required for fetching user-specific categories
  enabled?: boolean;
  includeSystemCategories?: boolean; // Option to include system-defined categories
  disablePagination?: boolean;
}

export const useCategories = (options?: UseCategoriesOptions) => {
  const { clientId, enabled = true, includeSystemCategories = true, disablePagination = true } = options || {};

  return useSupabaseQuery<{ data: Category[], count: number | null }, Error>(
    ['categories', clientId, includeSystemCategories, disablePagination],
    async () => {
      let query = supabase
        .from('categories')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true }); // Order by name for consistent display

      if (clientId && !includeSystemCategories) {
        // Only user's own categories
        query = query.eq('client_id', clientId).eq('is_system_category', false);
      } else if (clientId && includeSystemCategories) {
        // User's own categories OR system categories
        query = query.or(`client_id.eq.${clientId},is_system_category.eq.true`);
      } else if (!clientId && includeSystemCategories) {
        // Only system categories (e.g., for admin or public view)
        query = query.eq('is_system_category', true);
      } else {
        // If no clientId and not including system categories, return empty
        return { data: [], count: 0 };
      }

      // Pagination logic can be added here if disablePagination is false
      // For now, we assume all categories are fetched if not disabled.

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }
      return { data: data as Category[], count };
    },
    {
      enabled: enabled,
      errorMessage: 'Failed to fetch categories',
    }
  );
};

interface AddCategoryVariables {
  name: string;
  client_id: string;
}

export const useAddCategory = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, AddCategoryVariables>(
    async (newCategory) => {
      const { error } = await supabase
        .from('categories')
        .insert({ ...newCategory, is_system_category: false }); // Ensure new categories are not system categories
      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['categories', variables.client_id] });
      },
      successMessage: 'Category added successfully!',
      errorMessage: 'Failed to add category',
    }
  );
};

interface UpdateCategoryVariables {
  id: string;
  name: string;
  client_id: string; // Needed for query invalidation
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, UpdateCategoryVariables>(
    async ({ id, name, client_id }) => {
      const { error } = await supabase
        .from('categories')
        .update({ name })
        .eq('id', id)
        .eq('client_id', client_id) // Ensure only owner can update
        .eq('is_system_category', false); // Prevent updating system categories
      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['categories', variables.client_id] });
        queryClient.invalidateQueries({ queryKey: ['documents'] }); // Documents might need refetching if category name changes
      },
      successMessage: 'Category updated successfully!',
      errorMessage: 'Failed to update category',
    }
  );
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, { id: string; client_id: string }>(
    async ({ id, client_id }) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('client_id', client_id) // Ensure only owner can delete
        .eq('is_system_category', false); // Prevent deleting system categories
      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['categories', variables.client_id] });
        queryClient.invalidateQueries({ queryKey: ['documents'] }); // Documents previously in this category will now be unlinked
      },
      successMessage: 'Category deleted successfully!',
      errorMessage: 'Failed to delete category',
    }
  );
};