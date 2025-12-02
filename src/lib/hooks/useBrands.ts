import { useSupabaseQuery } from './useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { Brand } from '@/types';
import { useSession } from '@/contexts/SessionContext';
import { useMemo } from 'react';

interface UseBrandsOptions {
  industry?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  bookmarkedOnly?: boolean;
  searchTerm?: string;
  enabled?: boolean;
}

// Helper function to calculate average rating from reviews
function calculateAverageRating(reviews?: Array<{ rating: number }>): number {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export const useBrands = (options?: UseBrandsOptions) => {
  const { profile } = useSession();
  const {
    industry,
    minRating,
    verifiedOnly,
    bookmarkedOnly,
    searchTerm,
    enabled = true,
  } = options || {};

  const queryKey = useMemo(
    () => ['brands', industry, minRating, verifiedOnly, bookmarkedOnly, searchTerm, profile?.id],
    [industry, minRating, verifiedOnly, bookmarkedOnly, searchTerm, profile?.id]
  );

  return useSupabaseQuery<Brand[]>(
    queryKey,
    async () => {
      // Build the base query
      // Type assertion needed because tables might not exist in TypeScript types until migrations are run
      let query: any = supabase
        .from('brands' as any)
        .select(`
          *,
          brand_reviews(rating),
          brand_bookmarks(creator_id),
          opportunities(id, status)
        `)
        .eq('status' as any, 'active')
        // Filter out manual/seed data - only show scraped/marketplace brands
        .in('source' as any, ['scraped', 'marketplace', 'self-signup']);

      // Apply filters
      if (industry && industry !== 'all') {
        query = (query.eq('industry' as any, industry) as any);
      }

      if (verifiedOnly) {
        query = (query.eq('verified' as any, true) as any);
      }

      if (searchTerm) {
        query = (query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,industry.ilike.%${searchTerm}%`) as any);
      }

      // For bookmarked only, we need to filter by creator_id in the join
      // This is handled in post-processing since Supabase doesn't support filtering on joined tables easily

      const { data, error } = await query;

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

      if (!data) return [];

      // Process data: calculate ratings, check bookmarks, count opportunities
      let processedBrands = data.map((brand: any) => {
        const reviews = brand.brand_reviews || [];
        const bookmarks = brand.brand_bookmarks || [];
        const opportunities = brand.opportunities || [];

        const rating = calculateAverageRating(reviews);
        const reviewCount = reviews.length;
        const activeOpportunitiesCount = opportunities.filter(
          (opp: any) => opp.status === 'open' && new Date(opp.deadline) >= new Date()
        ).length;
        const isBookmarked = profile?.id
          ? bookmarks.some((b: any) => b.creator_id === profile.id)
          : false;

        return {
          ...brand,
          rating,
          review_count: reviewCount,
          active_opportunities_count: activeOpportunitiesCount,
          is_bookmarked: isBookmarked,
        } as Brand;
      });

      // Apply filters that require post-processing
      if (bookmarkedOnly && profile?.id) {
        processedBrands = processedBrands.filter((brand: Brand) => brand.is_bookmarked);
      }

      if (minRating) {
        processedBrands = processedBrands.filter((brand: Brand) => (brand.rating || 0) >= minRating);
      }

      // Sort: Brands with active opportunities first, then by most recently updated
      processedBrands.sort((a, b) => {
        // First: Brands with active opportunities come first
        const aOpps = a.active_opportunities_count || 0;
        const bOpps = b.active_opportunities_count || 0;
        if (aOpps !== bOpps) {
          return bOpps - aOpps; // Descending: more opportunities first
        }

        // Second: Most recently updated first
        const aUpdated = new Date(a.updated_at || a.created_at || 0).getTime();
        const bUpdated = new Date(b.updated_at || b.created_at || 0).getTime();
        return bUpdated - aUpdated; // Descending: newest first
      });

      return processedBrands;
    },
    {
      enabled: enabled && !!profile?.id,
      errorMessage: 'Failed to fetch brands',
    }
  );
};

export const useBrandById = (brandId: string | undefined, options?: { enabled?: boolean }) => {
  const { profile } = useSession();
  const enabled = options?.enabled !== false && !!brandId && !!profile?.id;

  return useSupabaseQuery<Brand | null>(
    ['brand', brandId, profile?.id],
    async () => {
      if (!brandId) return null;

      // Type assertion needed because tables might not exist in TypeScript types until migrations are run
      const { data, error } = await ((supabase
        .from('brands' as any)
        .select(`
          *,
          brand_reviews(rating, review_text, payment_rating, communication_rating, creator_id),
          brand_bookmarks(creator_id),
          opportunities(id, status, title, deadline)
        `)
        .eq('id' as any, brandId)
        .eq('status' as any, 'active')
        .single()) as any);

      if (error) {
        // If the tables don't exist yet, return null silently
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
          return null;
        }
        throw error;
      }

      if (!data) return null;

      const brandData = data as any;
      const reviews = brandData.brand_reviews || [];
      const bookmarks = brandData.brand_bookmarks || [];
      const opportunities = brandData.opportunities || [];

      const rating = calculateAverageRating(reviews);
      const reviewCount = reviews.length;
      const activeOpportunitiesCount = opportunities.filter(
        (opp: any) => opp.status === 'open' && new Date(opp.deadline) >= new Date()
      ).length;
      const isBookmarked = profile?.id
        ? bookmarks.some((b: any) => b.creator_id === profile.id)
        : false;

      return {
        ...brandData,
        rating,
        review_count: reviewCount,
        active_opportunities_count: activeOpportunitiesCount,
        is_bookmarked: isBookmarked,
      } as Brand;
    },
    {
      enabled,
      errorMessage: 'Failed to fetch brand',
    }
  );
};

