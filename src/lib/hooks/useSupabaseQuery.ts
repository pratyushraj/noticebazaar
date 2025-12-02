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
      
      // Skip error handling for 404s on tables/functions that might not exist yet
      const partnerProgramTables = [
        'referral_links', 'referrals', 'partner_earnings', 'partner_stats', 
        'partner_milestones', 'original_content', 'copyright_scans', 'copyright_matches',
        'brands', 'brand_reviews', 'brand_bookmarks', 'opportunities' // Brand directory tables
      ];
      const partnerProgramFunctions = [
        'get_or_create_referral_link', 'refresh_partner_stats', 'initialize_partner_stats',
        'record_referral_commission', 'issue_voucher_reward', 'check_and_award_milestones',
        'add_free_month_credit', 'calculate_commission', 'update_partner_tier', 'apply_tds',
        'get_brand_avg_rating', 'update_expired_opportunities' // Brand directory functions
      ];
      
      const isPartnerTableOrFunction = 
        partnerProgramTables.some(table => queryKeyStr.includes(table) || errorMessageStr.includes(table)) ||
        partnerProgramFunctions.some(func => queryKeyStr.includes(func) || errorMessageStr.includes(func));
      
      const errorCode = error?.code || errorStatus;
      
      const isMissingResourceError = 
        errorStatus === 404 || 
        errorCode === 'PGRST116' ||
        errorCode === 'PGRST202' || // Function not found
        errorCode === '42P01' ||
        errorCode === 404 ||
        errorMessageStr.includes('404') || 
        errorMessageStr.includes('not found') ||
        errorMessageStr.includes('could not find') ||
        errorMessageStr.includes('could not find the table') ||
        errorMessageStr.includes('could not find the function') ||
        errorMessageStr.includes('relation') ||
        errorMessageStr.includes('does not exist') ||
        errorMessageStr.includes('schema cache') ||
        errorMessageStr.includes('searched for the function') ||
        errorMessageStr.includes('no matches were found');
      
      const isMissingTableOrFunction = isPartnerTableOrFunction && isMissingResourceError;
      
      if (isMissingTableOrFunction) {
        // Silently ignore 404/PGRST202 errors for tables/functions that might not exist yet
        // This is expected if migrations haven't been run yet
        // Don't log to console or show toast
        return;
      }
      
      // Only show errors for unexpected issues (not migration-related)
      const message = errorMessage || 'An unexpected error occurred.';
      toast.error(message, { description: error?.message || 'Unknown error' });
      console.error('Supabase Query Error:', queryResult.error);
    }
  }, [queryResult.error, errorMessage, queryKey]);

  return queryResult;
};