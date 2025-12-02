import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useQueryClient } from '@tanstack/react-query';

export const useBrandBookmarks = () => {
  const { profile } = useSession();
  const queryClient = useQueryClient();

  return useSupabaseQuery<string[]>(
    ['brand-bookmarks', profile?.id],
    async () => {
      if (!profile?.id) return [];

      // Type assertion needed because tables might not exist in TypeScript types until migrations are run
      const { data, error } = await (supabase
        .from('brand_bookmarks' as any)
        .select('brand_id')
        .eq('creator_id' as any, profile.id) as any);

      if (error) {
        // If the tables don't exist yet (404, PGRST116, or relation errors), return empty array silently
        const errorStatus = (error as any)?.status || (error as any)?.statusCode;
        const errorCode = (error as any)?.code;
        const errorMessage = error.message || '';
        
        if (
          errorStatus === 404 ||
          errorCode === 'PGRST116' ||
          errorCode === '42P01' ||
          errorMessage.includes('relation') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('not found') ||
          errorMessage.includes('could not find')
        ) {
          // Tables don't exist yet - return empty array silently
          return [];
        }
        throw error;
      }

      return (data || []).map((bookmark) => bookmark.brand_id);
    },
    {
      enabled: !!profile?.id,
      errorMessage: 'Failed to fetch bookmarks',
    }
  );
};

export const useToggleBrandBookmark = () => {
  const { profile } = useSession();
  const queryClient = useQueryClient();

  return useSupabaseMutation(
    async (brandId: string) => {
      if (!profile?.id) {
        throw new Error('User not authenticated');
      }

      // Check if already bookmarked
      // Type assertion needed because tables might not exist in TypeScript types until migrations are run
      const { data: existing } = await (supabase
        .from('brand_bookmarks' as any)
        .select('id')
        .eq('creator_id' as any, profile.id)
        .eq('brand_id' as any, brandId)
        .single() as any);

      if (existing) {
        // Remove bookmark
        const { error } = await (supabase
          .from('brand_bookmarks' as any)
          .delete()
          .eq('creator_id' as any, profile.id)
          .eq('brand_id' as any, brandId) as any);

        if (error) throw error;
      } else {
        // Add bookmark
        const { error } = await (supabase
          .from('brand_bookmarks' as any)
          .insert({
            creator_id: profile.id,
            brand_id: brandId,
          } as any) as any);

        if (error) throw error;
      }

      return { isBookmarked: !existing };
    },
    {
      onSuccess: () => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['brand-bookmarks'] });
        queryClient.invalidateQueries({ queryKey: ['brands'] });
        queryClient.invalidateQueries({ queryKey: ['brand'] });
      },
      errorMessage: 'Failed to toggle bookmark',
    }
  );
};

