import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect } from 'react';

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
  const { errorMessage, ...restOptions } = options || {};

  const queryResult = useQuery<TQueryFnData, TError, TData, TQueryKey>({
    queryKey,
    queryFn,
    ...restOptions,
  });

  // Handle errors via useEffect (React Query v5 doesn't support onError)
  useEffect(() => {
    if (queryResult.error) {
      const error = queryResult.error as any;
      // Skip error handling for 404s on original_content table (table might not exist)
      const errorMessageStr = error?.message || '';
      const errorStatus = error?.status || error?.statusCode;
      const isOriginalContent404 = errorMessageStr.includes('original_content') && 
                                   (errorStatus === 404 || errorMessageStr.includes('404') || 
                                    errorMessageStr.includes('Could not find the table'));
      
      if (isOriginalContent404) {
        // Silently ignore 404 errors for original_content table
        return;
      }
      
      const message = errorMessage || 'An unexpected error occurred.';
      toast.error(message, { description: error?.message || 'Unknown error' });
      console.error('Supabase Query Error:', queryResult.error);
    }
  }, [queryResult.error, errorMessage]);

  return queryResult;
};