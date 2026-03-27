import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Subscription } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery'; // Import new hook
import { useSupabaseMutation } from './useSupabaseMutation'; // Import new hook

interface UseClientSubscriptionOptions {
  clientId: string | undefined; // Required for fetching a single client's subscription
  enabled?: boolean;
}

export const useClientSubscription = (options: UseClientSubscriptionOptions) => {
  const { clientId, enabled = true } = options;

  return useSupabaseQuery<Subscription | null, Error>(
    ['subscription', clientId],
    async () => {
      if (!clientId) {
        throw new Error('Client ID is required to fetch a single subscription.');
      }
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false }) // Order by creation date descending
        .limit(1); // Only fetch the most recent one

      if (error) {
        throw new Error(error.message);
      }
      
      // Return the first item or null if the array is empty
      return (data?.[0] as Subscription) || null;
    },
    {
      enabled: enabled && !!clientId,
      errorMessage: 'Failed to fetch subscription details',
    }
  );
};

interface UseAdminSubscriptionsOptions {
  enabled?: boolean;
  page?: number; // New: current page number (1-indexed)
  pageSize?: number; // New: number of items per page
}

export const useAdminSubscriptions = (options?: UseAdminSubscriptionsOptions) => {
  const { enabled = true, page = 1, pageSize = 10 } = options || {};

  return useSupabaseQuery<{ data: Subscription[], count: number | null }, Error>(
    ['adminSubscriptions', page, pageSize], // Query key for admin view
    async () => {
      let query = supabase
        .from('subscriptions')
        .select('*, profiles!client_id(first_name, last_name)', { count: 'exact' }) // Request exact count and client profiles
        .order('created_at', { ascending: false });

      // Calculate range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query; // Destructure count

      if (error) {
        throw new Error(error.message);
      }
      return { data: data as Subscription[], count }; // Return data and count
    },
    {
      enabled: enabled,
      errorMessage: 'Failed to fetch all subscriptions',
    }
  );
};

interface SubscriptionMutationVariables {
  client_id: string;
  plan_name: string;
  next_billing_date: string;
  status: string;
}

export const useAddSubscription = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, SubscriptionMutationVariables>(
    async (newSubscription) => {
      const { error } = await supabase
        .from('subscriptions')
        .insert(newSubscription);
      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] }); // Invalidate admin view
        queryClient.invalidateQueries({ queryKey: ['subscription', variables.client_id] }); // Invalidate client's specific subscription
        queryClient.invalidateQueries({ queryKey: ['adminDashboardData'] });
        queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      },
      successMessage: 'Subscription added successfully!',
      errorMessage: 'Failed to add subscription',
    }
  );
};

interface UpdateSubscriptionVariables {
  id: string;
  client_id: string; // Added client_id for invalidation
  plan_name: string;
  next_billing_date: string;
  status: string;
}

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, UpdateSubscriptionVariables>(
    async ({ id, client_id, ...updatedSubscription }) => {
      const { error } = await supabase
        .from('subscriptions')
        .update(updatedSubscription)
        .eq('id', id);
      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] }); // Invalidate admin view
        queryClient.invalidateQueries({ queryKey: ['subscription', variables.client_id] }); // Invalidate client's specific subscription
        queryClient.invalidateQueries({ queryKey: ['adminDashboardData'] }); // Invalidate dashboard data
        queryClient.invalidateQueries({ queryKey: ['activity_log'] }); // Invalidate activity log
      },
      successMessage: 'Subscription updated successfully!',
      errorMessage: 'Failed to update subscription',
    }
  );
};

export const useDeleteSubscription = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, { id: string; client_id: string }>( // Added client_id for invalidation
    async ({ id, client_id }) => {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);
      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] }); // Invalidate admin view
        queryClient.invalidateQueries({ queryKey: ['subscription', variables.client_id] }); // Invalidate client's specific subscription
        queryClient.invalidateQueries({ queryKey: ['adminDashboardData'] }); // Invalidate dashboard data
        queryClient.invalidateQueries({ queryKey: ['activity_log'] }); // Invalidate activity log
      },
      successMessage: 'Subscription deleted successfully!',
      errorMessage: 'Failed to delete subscription',
    }
  );
};