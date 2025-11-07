import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCallback } from 'react';

// Extend UseQueryOptions to include our custom errorMessage
interface SupabaseQueryOptions<TData, TError, TQueryFnData = TData, TQueryKey extends QueryKey = QueryKey>
  extends UseQueryOptions<TData, TError, TQueryFnData, TQueryKey> {
  errorMessage?: string;
}

export const useSupabaseQuery = <
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryKey: TQueryKey, // queryKey is now a required parameter
  queryFn: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>['queryFn'], // queryFn is now a required parameter
  options?: Omit<SupabaseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'> // Omit queryKey and queryFn from options
) => {
  const { errorMessage, onError: originalOnError, ...restOptions } = options || {};

  const onError = useCallback(
    (error: TError) => {
      const message = errorMessage || 'An unexpected error occurred.';
      toast.error(message, { description: (error as Error).message });
      console.error('Supabase Query Error:', error); // Log the error object
      console.trace('Supabase Query Error Trace:'); // Add a stack trace
      originalOnError?.(error);
    },
    [errorMessage, originalOnError]
  );

  return useQuery<TQueryFnData, TError, TData, TQueryKey>({
    queryKey,
    queryFn,
    ...restOptions,
    onError, // Pass the custom onError handler
  });
};