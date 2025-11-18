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
      const errorMessageStr = String(error?.message || '').toLowerCase();
      const errorStatus = error?.status || error?.statusCode || error?.code;
      const queryKeyStr = JSON.stringify(queryKey || '').toLowerCase();
      
      // Skip error handling for 404s on original_content table (table might not exist)
      const isOriginalContent404 = 
        (queryKeyStr.includes('original_content') || errorMessageStr.includes('original_content')) &&
        (errorStatus === 404 || 
         errorStatus === 'PGRST116' ||
         errorStatus === '42P01' ||
         errorMessageStr.includes('404') || 
         errorMessageStr.includes('not found') ||
         errorMessageStr.includes('could not find the table') ||
         errorMessageStr.includes('relation') ||
         errorMessageStr.includes('does not exist'));
      
      if (isOriginalContent404) {
        // Silently ignore 404 errors for original_content table
        // This is expected if the table hasn't been created yet
        // Don't log to console or show toast
        return;
      }
      
      const message = errorMessage || 'An unexpected error occurred.';
      toast.error(message, { description: error?.message || 'Unknown error' });
      console.error('Supabase Query Error:', queryResult.error);
    }
  }, [queryResult.error, errorMessage, queryKey]);

  return queryResult;
};