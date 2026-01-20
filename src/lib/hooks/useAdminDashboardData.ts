import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery } from './useSupabaseQuery';

interface AdminDashboardData {
  newAccountsCount: number; // New accounts created (last 30 days)
  contractsMadeCount: number; // Total contracts created
  linksGeneratedCount: number; // Deal detail tokens + contract ready tokens
  referralLinksCount: number; // Referral links created
  totalDealsCount: number; // Total brand deals
  activeDealsCount: number; // Active brand deals
}

export const useAdminDashboardData = (enabled: boolean = true) => {
  return useSupabaseQuery<AdminDashboardData, Error>(
    ['adminDashboardData'],
    async () => {
      // Helper function to safely fetch count, returning 0 on error
      const safeCount = async (table: string, query?: (q: any) => any): Promise<number> => {
        try {
          let queryBuilder = supabase.from(table).select('id', { count: 'exact', head: true });
          if (query) {
            queryBuilder = query(queryBuilder);
          }
          const { count, error } = await queryBuilder;
          if (error) {
            console.warn(`[AdminDashboard] Error fetching ${table}:`, error.message);
            return 0;
          }
          return count || 0;
        } catch (error: any) {
          console.warn(`[AdminDashboard] Exception fetching ${table}:`, error.message);
          return 0;
        }
      };

      // Fetch New Accounts Count (accounts created in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newAccounts = await safeCount('profiles', (q) => 
        q.gte('created_at', thirtyDaysAgo.toISOString())
      );

      // Fetch Total Contracts Made (brand_deals with contract_file_url)
      const contractsMade = await safeCount('brand_deals', (q) => 
        q.not('contract_file_url', 'is', null)
      );

      // Fetch Links Generated (deal_details_tokens + contract_ready_tokens)
      const dealTokensCount = await safeCount('deal_details_tokens');
      const contractTokensCount = await safeCount('contract_ready_tokens');
      const linksGenerated = dealTokensCount + contractTokensCount;

      // Fetch Referral Links Count
      const referralLinks = await safeCount('referral_links');

      // Fetch Total Deals Count
      const totalDeals = await safeCount('brand_deals');

      // Fetch Active Deals Count (status = 'active' or 'pending')
      const activeDeals = await safeCount('brand_deals', (q) => 
        q.in('status', ['active', 'pending'])
      );

      return {
        newAccountsCount: newAccounts,
        contractsMadeCount: contractsMade,
        linksGeneratedCount: linksGenerated,
        referralLinksCount: referralLinks,
        totalDealsCount: totalDeals,
        activeDealsCount: activeDeals,
      };
    },
    {
      enabled: enabled,
      errorMessage: 'Failed to load admin dashboard data',
    }
  );
};