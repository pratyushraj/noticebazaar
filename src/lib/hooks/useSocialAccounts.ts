import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery } from './useSupabaseQuery';

interface SocialAccount {
  id: string;
  user_id: string;
  platform: 'instagram' | 'youtube' | 'tiktok' | 'twitter';
  account_username: string;
  account_id: string | null;
  follower_count: number;
  profile_picture_url: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useSocialAccounts = (userId: string | undefined) => {
  return useSupabaseQuery<SocialAccount[], Error>(
    ['social_accounts', userId],
    async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SocialAccount[];
    },
    {
      enabled: !!userId,
      errorMessage: 'Failed to fetch social accounts',
    }
  );
};

export const useLinkSocialAccount = () => {
  return useMutation({
    mutationFn: async (platform: string) => {
      const { data, error } = await supabase.functions.invoke('link-social-account', {
        body: { platform },
      });

      if (error) throw error;
      return data;
    },
  });
};

export const useSyncSocialAccounts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-social-accounts');

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social_accounts'] });
    },
  });
};

export const useUnlinkSocialAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (platform: string) => {
      const { data, error } = await supabase.functions.invoke('unlink-social-account', {
        method: 'DELETE',
        body: { platform },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social_accounts'] });
    },
  });
};

