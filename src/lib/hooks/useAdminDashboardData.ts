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
        const error = await response.json().catch(() => ({ error: 'Failed to fetch dashboard stats' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json() as Promise<AdminDashboardData>;
    },
    enabled: enabled,
    retry: 1,
  });
};