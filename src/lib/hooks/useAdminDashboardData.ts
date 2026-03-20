import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminDashboardData {
  totalUsersCount: number; // Total users/accounts
  newAccountsCount: number; // New accounts created in date range
  contractsMadeCount: number; // Total contracts created
  linksGeneratedCount: number; // Deal detail tokens + contract ready tokens
  referralLinksCount: number; // Referral links created
  totalDealsCount: number; // Total brand deals
  activeDealsCount: number; // Active brand deals
}

interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://noticebazaar-api.onrender.com';

// Fallback function to query directly from Supabase (used when backend endpoint is not available)
async function fallbackDirectQuery(dateRange?: DateRange): Promise<AdminDashboardData> {
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

  // Fetch Total Users Count
  const totalUsers = await safeCount('profiles');

  // Fetch New Accounts Count
  let newAccountsQuery = (q: any) => {
    if (dateRange?.startDate) {
      const start = new Date(dateRange.startDate);
      start.setHours(0, 0, 0, 0);
      q = q.gte('created_at', start.toISOString());
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      q = q.gte('created_at', thirtyDaysAgo.toISOString());
    }
    if (dateRange?.endDate) {
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);
      q = q.lte('created_at', end.toISOString());
    }
    return q;
  };
  const newAccounts = await safeCount('profiles', newAccountsQuery);

  // Fetch other metrics
  const contractsMade = await safeCount('brand_deals', (q) => 
    q.not('contract_file_url', 'is', null)
  );
  const dealTokensCount = await safeCount('deal_details_tokens');
  const contractTokensCount = await safeCount('contract_ready_tokens');
  const linksGenerated = dealTokensCount + contractTokensCount;
  const referralLinks = await safeCount('referral_links');
  const totalDeals = await safeCount('brand_deals');
  const activeDeals = await safeCount('brand_deals', (q) => 
    q.in('status', ['active', 'pending'])
  );

  return {
    totalUsersCount: totalUsers,
    newAccountsCount: newAccounts,
    contractsMadeCount: contractsMade,
    linksGeneratedCount: linksGenerated,
    referralLinksCount: referralLinks,
    totalDealsCount: totalDeals,
    activeDealsCount: activeDeals,
  };
}

export const useAdminDashboardData = (enabled: boolean = true, dateRange?: DateRange) => {
  return useQuery<AdminDashboardData, Error>({
    queryKey: ['adminDashboardData', dateRange?.startDate?.toISOString(), dateRange?.endDate?.toISOString()],
    queryFn: async () => {
      // Get session token for authentication
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      // Build query params
      const params = new URLSearchParams();
      if (dateRange?.startDate) {
        params.append('startDate', dateRange.startDate.toISOString().split('T')[0]);
      }
      if (dateRange?.endDate) {
        params.append('endDate', dateRange.endDate.toISOString().split('T')[0]);
      }

      // Call backend API endpoint which uses service role to bypass RLS
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard-stats?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If 404, the backend endpoint might not be deployed yet - fallback to direct Supabase query
        if (response.status === 404) {
          console.warn('[AdminDashboard] Backend endpoint not found, falling back to direct Supabase query');
          return await fallbackDirectQuery(dateRange);
        }
        const error = await response.json().catch(() => ({ error: 'Failed to fetch dashboard stats' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json() as Promise<AdminDashboardData>;
    },
    enabled: enabled,
    retry: 1,
  });
};