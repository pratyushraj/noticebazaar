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
        'brands', 'brand_reviews', 'brand_bookmarks', 'opportunities', // Brand directory tables
        'notifications', // Notifications table might not exist yet
        'deal_action_logs', // Action logs table might not exist yet
        'issues', // Issues table might not exist yet
        'issue_history' // Issue history table might not exist yet
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
      
      // Only suppress errors that specifically mean "table/function doesn't exist yet"
      // Do NOT suppress permission errors — those are real bugs that should surface.
      const isMissingTableError =
        errorCode === 'PGRST116' ||  // No rows (single) / resource not found
        errorCode === 'PGRST202' ||  // Function not found
        errorCode === '42P01' ||     // Undefined table
        errorCode === 404 ||
        errorStatus === 404 ||
        errorMessageStr.includes('does not exist') ||
        errorMessageStr.includes('could not find the table') ||
        errorMessageStr.includes('could not find the function') ||
        errorMessageStr.includes('schema cache');

      // NOTE: We intentionally do NOT suppress "permission denied" (42501),
      // "RLS policy violation" (PGRST301), or generic "relation" errors.
      // Those indicate real auth/RLS bugs that should be visible.
      
      const isMissingTableOrFunction = isPartnerTableOrFunction && isMissingTableError;
      
      const isAuthError =
        errorMessageStr.includes('not authenticated') ||
        errorMessageStr.includes('session expired') ||
        errorMessageStr.includes('unauthorized') ||
        errorMessageStr.includes('jwt') ||
        errorCode === 401 ||
        errorCode === 'PGRST301' ||
        errorCode === '401';

      if (isAuthError) {
        // Silently handle auth errors during transitions - ProtectedRoute/SessionContext handles these.
        if (import.meta.env.DEV) {
          console.warn('[useSupabaseQuery] Suppressing auth error during transition:', {
            queryKey: queryKeyStr,
            error: errorMessageStr,
          });
        }
        return;
      }

      if (isMissingTableOrFunction) {
        // Log in dev so developers know a table is missing, but don't toast
        if (import.meta.env.DEV) {
          console.warn('[useSupabaseQuery] Missing table/function (migration may not be applied):', {
            queryKey: queryKeyStr,
            error: errorMessageStr,
          });
        }
        return;
      }
      
      // Show errors for real issues (including permission denied, RLS violations, etc.)
      const message = errorMessage || 'Something went wrong. Please try again.';
      toast.error(message, { description: error?.message || 'Unknown error' });
      console.error('[useSupabaseQuery] Error:', queryResult.error);
    }
  }, [queryResult.error, errorMessage, queryKey]);

  return queryResult;
};