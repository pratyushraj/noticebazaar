import { useSupabaseMutation } from './useSupabaseMutation';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useQueryClient } from '@tanstack/react-query';

export type BrandInteractionType = 'viewed' | 'bookmarked' | 'applied' | 'reviewed' | 'clicked_opportunity';

interface TrackInteractionOptions {
  opportunityId?: string;
  metadata?: Record<string, any>;
}

/**
 * Hook to track creator interactions with brands
 * This helps with analytics, recommendations, and demand tracking
 */
export const useTrackBrandInteraction = () => {
  const { profile } = useSession();
  const queryClient = useQueryClient();

  return useSupabaseMutation(
    async ({ brandId, interactionType, options }: { 
      brandId: string; 
      interactionType: BrandInteractionType;
      options?: TrackInteractionOptions;
    }) => {
      if (!profile?.id) {
        throw new Error('User not authenticated');
      }

      // Type assertion needed because table might not exist in TypeScript types until migrations are run
      const { error } = await (supabase
        .from('brand_interactions' as any)
        .insert({
          creator_id: profile.id,
          brand_id: brandId,
          interaction_type: interactionType,
          metadata: options?.metadata || (options?.opportunityId ? { opportunity_id: options.opportunityId } : null),
        } as any) as any);

      if (error) {
        // Silently fail if table doesn't exist yet
        const errorStatus = (error as any)?.status || (error as any)?.statusCode;
        const errorCode = (error as any)?.code;
        if (errorStatus === 404 || errorCode === 'PGRST116' || errorCode === '42P01') {
          return { success: true, skipped: true };
        }
        throw error;
      }

      return { success: true };
    },
    {
      onSuccess: () => {
        // Invalidate brand queries to refresh counts
        queryClient.invalidateQueries({ queryKey: ['brands'] });
        queryClient.invalidateQueries({ queryKey: ['brand'] });
      },
      errorMessage: 'Failed to track interaction',
    }
  );
};

/**
 * Track when a creator views a brand
 */
export const useTrackBrandView = () => {
  const trackInteraction = useTrackBrandInteraction();
  
  return (brandId: string) => {
    trackInteraction.mutate({ brandId, interactionType: 'viewed' });
  };
};

/**
 * Track when a creator clicks on an opportunity
 */
export const useTrackOpportunityClick = () => {
  const trackInteraction = useTrackBrandInteraction();
  
  return (brandId: string, opportunityId: string) => {
    trackInteraction.mutate({ 
      brandId, 
      interactionType: 'clicked_opportunity',
      options: { opportunityId }
    });
  };
};

