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
      // Fetch New Accounts Count (accounts created in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: newAccounts, error: newAccountsError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());
      if (newAccountsError) throw newAccountsError;

      // Fetch Total Contracts Made (brand_deals with contract_file_url)
      const { count: contractsMade, error: contractsError } = await supabase
        .from('brand_deals')
        .select('id', { count: 'exact', head: true })
        .not('contract_file_url', 'is', null);
      if (contractsError) throw contractsError;

      // Fetch Links Generated (deal_details_tokens + contract_ready_tokens)
      const [dealTokensResult, contractTokensResult] = await Promise.all([
        supabase
          .from('deal_details_tokens')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('contract_ready_tokens')
          .select('id', { count: 'exact', head: true })
      ]);
      
      const dealTokensCount = dealTokensResult.count || 0;
      const contractTokensCount = contractTokensResult.count || 0;
      const linksGenerated = dealTokensCount + contractTokensCount;
      
      if (dealTokensResult.error) throw dealTokensResult.error;
      if (contractTokensResult.error) throw contractTokensResult.error;

      // Fetch Referral Links Count
      const { count: referralLinks, error: referralLinksError } = await supabase
        .from('referral_links')
        .select('id', { count: 'exact', head: true });
      if (referralLinksError) throw referralLinksError;

      // Fetch Total Deals Count
      const { count: totalDeals, error: totalDealsError } = await supabase
        .from('brand_deals')
        .select('id', { count: 'exact', head: true });
      if (totalDealsError) throw totalDealsError;

      // Fetch Active Deals Count (status = 'active' or 'pending')
      const { count: activeDeals, error: activeDealsError } = await supabase
        .from('brand_deals')
        .select('id', { count: 'exact', head: true })
        .in('status', ['active', 'pending']);
      if (activeDealsError) throw activeDealsError;

      return {
        newAccountsCount: newAccounts || 0,
        contractsMadeCount: contractsMade || 0,
        linksGeneratedCount: linksGenerated,
        referralLinksCount: referralLinks || 0,
        totalDealsCount: totalDeals || 0,
        activeDealsCount: activeDeals || 0,
      };
    },
    {
      enabled: enabled,
      errorMessage: 'Failed to load admin dashboard data',
    }
  );
};