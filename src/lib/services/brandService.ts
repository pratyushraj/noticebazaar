/**
 * Brand Service
 * 
 * Handles all business logic related to brands including:
 * - Brand directory
 * - Brand reviews
 * - Opportunities
 * - Brand interactions
 */

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';
import { BrandReview, Opportunity } from '@/types';
import {
  ServiceResult,
  QueryOptions,
  ok,
  fail,
  handleResult,
  handleListResult,
  mapSupabaseError,
} from './types';

// ============================================
// Types
// ============================================

export interface BrandProfile {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  industry: string | null;
  location: string | null;
  verified: boolean;
  rating: number;
  review_count: number;
  active_opportunities_count: number;
  created_at: string;
}

export interface BrandReviewInput {
  brand_id: string;
  creator_id: string;
  rating: number;
  payment_rating?: number;
  communication_rating?: number;
  review_text?: string;
}

export interface BrandFilters {
  industry?: string;
  verified?: boolean;
  minRating?: number;
  searchTerm?: string;
}

export interface BrandQueryOptions extends QueryOptions {
  filters?: BrandFilters;
}

export interface OpportunityInput {
  brand_id: string;
  title: string;
  description: string;
  requirements?: string;
  compensation_type: 'paid' | 'barter' | 'both';
  compensation_min?: number;
  compensation_max?: number;
  deadline?: string;
  platforms?: string[];
  niches?: string[];
}

export interface OpportunityFilters {
  platform?: string;
  niche?: string;
  compensation_type?: 'paid' | 'barter' | 'both';
  minCompensation?: number;
  maxCompensation?: number;
}

export interface OpportunityQueryOptions extends QueryOptions {
  filters?: OpportunityFilters;
}

export interface BrandInteraction {
  id: string;
  brand_id: string;
  creator_id: string;
  type: 'view' | 'bookmark' | 'apply' | 'message';
  created_at: string;
}

// ============================================
// Brand Service Interface
// ============================================

export interface IBrandService {
  // Brand Directory
  getBrands(options?: BrandQueryOptions): Promise<ServiceResult<BrandProfile[]>>;
  getBrandById(brandId: string): Promise<ServiceResult<BrandProfile>>;
  searchBrands(query: string, options?: BrandQueryOptions): Promise<ServiceResult<BrandProfile[]>>;

  // Brand Reviews
  getReviews(brandId: string): Promise<ServiceResult<BrandReview[]>>;
  createReview(input: BrandReviewInput): Promise<ServiceResult<BrandReview>>;
  updateReview(reviewId: string, input: Partial<BrandReviewInput>): Promise<ServiceResult<BrandReview>>;
  deleteReview(reviewId: string): Promise<ServiceResult<void>>;
  getCreatorReviewForBrand(brandId: string, creatorId: string): Promise<ServiceResult<BrandReview | null>>;

  // Opportunities
  getOpportunities(options?: OpportunityQueryOptions): Promise<ServiceResult<Opportunity[]>>;
  getOpportunityById(opportunityId: string): Promise<ServiceResult<Opportunity>>;
  getOpportunitiesByBrand(brandId: string): Promise<ServiceResult<Opportunity[]>>;

  // Bookmarks
  bookmarkBrand(brandId: string, creatorId: string): Promise<ServiceResult<void>>;
  unbookmarkBrand(brandId: string, creatorId: string): Promise<ServiceResult<void>>;
  getBookmarkedBrands(creatorId: string): Promise<ServiceResult<BrandProfile[]>>;
  isBrandBookmarked(brandId: string, creatorId: string): Promise<ServiceResult<boolean>>;

  // Interactions
  logInteraction(brandId: string, creatorId: string, type: BrandInteraction['type']): Promise<ServiceResult<void>>;
  getRecentInteractions(creatorId: string, limit?: number): Promise<ServiceResult<BrandInteraction[]>>;
}

// ============================================
// Brand Service Implementation
// ============================================

export class BrandService implements IBrandService {
  private supabase;

  constructor(supabaseClient?: typeof supabase) {
    this.supabase = supabaseClient ?? supabase;
  }

  // ----------------------------------------
  // Brand Directory
  // ----------------------------------------

  async getBrands(options?: BrandQueryOptions): Promise<ServiceResult<BrandProfile[]>> {
    const { filters, sortBy = 'created_at', sortOrder = 'desc', limit = 50 } = options || {};

    let query = this.supabase
      .from('brands')
      .select(`
        *,
        brand_reviews(rating),
        opportunities!opportunities_brand_id_fkey(id, status)
      `)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    if (filters?.industry) {
      query = query.eq('industry', filters.industry);
    }

    if (filters?.verified !== undefined) {
      query = query.eq('verified', filters.verified);
    }

    if (filters?.minRating) {
      // Note: This would need a computed column or view for efficient filtering
      // For now, we filter in-memory
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: mapSupabaseError(error) };
    }

    // Transform data to BrandProfile
    const brands: BrandProfile[] = (data || []).map(brand => {
      const reviews = brand.brand_reviews || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
        : 0;

      const activeOpps = (brand.opportunities || []).filter((o: any) => o.status === 'active').length;

      return {
        id: brand.id,
        name: brand.name,
        description: brand.description,
        logo_url: brand.logo_url,
        website_url: brand.website_url,
        industry: brand.industry,
        location: brand.location,
        verified: brand.verified || false,
        rating: Math.round(avgRating * 10) / 10,
        review_count: reviews.length,
        active_opportunities_count: activeOpps,
        created_at: brand.created_at,
      };
    });

    // Apply rating filter in-memory
    let filtered = brands;
    if (filters?.minRating) {
      filtered = filtered.filter(b => b.rating >= filters.minRating!);
    }

    // Apply search filter in-memory
    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(term) ||
        b.description?.toLowerCase().includes(term) ||
        b.industry?.toLowerCase().includes(term)
      );
    }

    return ok(filtered);
  }

  async getBrandById(brandId: string): Promise<ServiceResult<BrandProfile>> {
    const { data, error } = await this.supabase
      .from('brands')
      .select(`
        *,
        brand_reviews(rating),
        opportunities!opportunities_brand_id_fkey(id, status)
      `)
      .eq('id', brandId)
      .single();

    if (error) {
      return { success: false, error: mapSupabaseError(error) };
    }

    const reviews = data.brand_reviews || [];
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0;

    const activeOpps = (data.opportunities || []).filter((o: any) => o.status === 'active').length;

    const brand: BrandProfile = {
      id: data.id,
      name: data.name,
      description: data.description,
      logo_url: data.logo_url,
      website_url: data.website_url,
      industry: data.industry,
      location: data.location,
      verified: data.verified || false,
      rating: Math.round(avgRating * 10) / 10,
      review_count: reviews.length,
      active_opportunities_count: activeOpps,
      created_at: data.created_at,
    };

    return ok(brand);
  }

  async searchBrands(
    query: string,
    options?: BrandQueryOptions
  ): Promise<ServiceResult<BrandProfile[]>> {
    return this.getBrands({
      ...options,
      filters: {
        ...options?.filters,
        searchTerm: query,
      },
    });
  }

  // ----------------------------------------
  // Brand Reviews
  // ----------------------------------------

  async getReviews(brandId: string): Promise<ServiceResult<BrandReview[]>> {
    const { data, error } = await this.supabase
      .from('brand_reviews')
      .select(`
        *,
        profiles!brand_reviews_creator_id_fkey(first_name, last_name, avatar_url)
      `)
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    return handleListResult<BrandReview>(data, error);
  }

  async createReview(input: BrandReviewInput): Promise<ServiceResult<BrandReview>> {
    const { data, error } = await this.supabase
      .from('brand_reviews')
      .insert({
        brand_id: input.brand_id,
        creator_id: input.creator_id,
        rating: input.rating,
        payment_rating: input.payment_rating || null,
        communication_rating: input.communication_rating || null,
        review_text: input.review_text || null,
      })
      .select()
      .single();

    return handleResult<BrandReview>(data, error);
  }

  async updateReview(
    reviewId: string,
    input: Partial<BrandReviewInput>
  ): Promise<ServiceResult<BrandReview>> {
    const updatePayload: Database['public']['Tables']['brand_reviews']['Update'] = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('brand_reviews')
      .update(updatePayload)
      .eq('id', reviewId)
      .select()
      .single();

    return handleResult<BrandReview>(data, error);
  }

  async deleteReview(reviewId: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabase
      .from('brand_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      return { success: false, error: mapSupabaseError(error) };
    }

    return ok(undefined);
  }

  async getCreatorReviewForBrand(
    brandId: string,
    creatorId: string
  ): Promise<ServiceResult<BrandReview | null>> {
    const { data, error } = await this.supabase
      .from('brand_reviews')
      .select('*')
      .eq('brand_id', brandId)
      .eq('creator_id', creatorId)
      .maybeSingle();

    if (error) {
      return { success: false, error: mapSupabaseError(error) };
    }

    return ok(data);
  }

  // ----------------------------------------
  // Opportunities
  // ----------------------------------------

  async getOpportunities(
    options?: OpportunityQueryOptions
  ): Promise<ServiceResult<Opportunity[]>> {
    const { filters, sortBy = 'created_at', sortOrder = 'desc', limit = 50 } = options || {};

    let query = this.supabase
      .from('opportunities')
      .select(`
        *,
        brands!opportunities_brand_id_fkey(*)
      `)
      .eq('status', 'active')
      .order(sortBy, { ascending: sortOrder === 'asc' });

    if (filters?.platform) {
      query = query.contains('platforms', [filters.platform]);
    }

    if (filters?.niche) {
      query = query.contains('niches', [filters.niche]);
    }

    if (filters?.compensation_type) {
      query = query.eq('compensation_type', filters.compensation_type);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    return handleListResult<Opportunity>(data, error);
  }

  async getOpportunityById(opportunityId: string): Promise<ServiceResult<Opportunity>> {
    const { data, error } = await this.supabase
      .from('opportunities')
      .select(`
        *,
        brands!opportunities_brand_id_fkey(*)
      `)
      .eq('id', opportunityId)
      .single();

    return handleResult<Opportunity>(data, error);
  }

  async getOpportunitiesByBrand(brandId: string): Promise<ServiceResult<Opportunity[]>> {
    const { data, error } = await this.supabase
      .from('opportunities')
      .select('*')
      .eq('brand_id', brandId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    return handleListResult<Opportunity>(data, error);
  }

  // ----------------------------------------
  // Bookmarks
  // ----------------------------------------

  async bookmarkBrand(brandId: string, creatorId: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabase
      .from('brand_bookmarks')
      .insert({
        brand_id: brandId,
        creator_id: creatorId,
      });

    if (error) {
      // Ignore duplicate bookmark errors
      if (error.code === '23505') {
        return ok(undefined);
      }
      return { success: false, error: mapSupabaseError(error) };
    }

    return ok(undefined);
  }

  async unbookmarkBrand(brandId: string, creatorId: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabase
      .from('brand_bookmarks')
      .delete()
      .eq('brand_id', brandId)
      .eq('creator_id', creatorId);

    if (error) {
      return { success: false, error: mapSupabaseError(error) };
    }

    return ok(undefined);
  }

  async getBookmarkedBrands(creatorId: string): Promise<ServiceResult<BrandProfile[]>> {
    const { data, error } = await this.supabase
      .from('brand_bookmarks')
      .select(`
        brand_id,
        brands(
          *,
          brand_reviews(rating)
        )
      `)
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: mapSupabaseError(error) };
    }

    const brands: BrandProfile[] = (data || []).map((bookmark: any) => {
      const brand = bookmark.brands;
      const reviews = brand?.brand_reviews || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
        : 0;

      return {
        id: brand.id,
        name: brand.name,
        description: brand.description,
        logo_url: brand.logo_url,
        website_url: brand.website_url,
        industry: brand.industry,
        location: brand.location,
        verified: brand.verified || false,
        rating: Math.round(avgRating * 10) / 10,
        review_count: reviews.length,
        active_opportunities_count: 0, // Would need additional query
        created_at: brand.created_at,
      };
    });

    return ok(brands);
  }

  async isBrandBookmarked(brandId: string, creatorId: string): Promise<ServiceResult<boolean>> {
    const { data, error } = await this.supabase
      .from('brand_bookmarks')
      .select('id')
      .eq('brand_id', brandId)
      .eq('creator_id', creatorId)
      .maybeSingle();

    if (error) {
      return { success: false, error: mapSupabaseError(error) };
    }

    return ok(!!data);
  }

  // ----------------------------------------
  // Interactions
  // ----------------------------------------

  async logInteraction(
    brandId: string,
    creatorId: string,
    type: BrandInteraction['type']
  ): Promise<ServiceResult<void>> {
    const { error } = await this.supabase
      .from('brand_interactions')
      .insert({
        brand_id: brandId,
        creator_id: creatorId,
        type,
      });

    if (error) {
      return { success: false, error: mapSupabaseError(error) };
    }

    return ok(undefined);
  }

  async getRecentInteractions(
    creatorId: string,
    limit = 10
  ): Promise<ServiceResult<BrandInteraction[]>> {
    const { data, error } = await this.supabase
      .from('brand_interactions')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return handleListResult<BrandInteraction>(data, error);
  }
}

// ============================================
// Singleton Instance
// ============================================

export const brandService = new BrandService();
