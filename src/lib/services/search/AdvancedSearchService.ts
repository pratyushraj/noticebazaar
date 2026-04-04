import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

export interface CreatorSearchResult {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatar_url?: string;
  followers_count: number;
  engagement_rate: number;
  categories: string[];
  location?: string;
  verified: boolean;
  average_rating: number;
  completed_deals: number;
  price_range: {
    min: number;
    max: number;
  };
  recent_work: Array<{
    type: string;
    brand: string;
    engagement: string;
  }>;
  match_score: number;
  availability_status: 'available' | 'busy' | 'unavailable';
}

export interface BrandSearchResult {
  id: string;
  name: string;
  website?: string;
  industry: string;
  location?: string;
  logo_url?: string;
  description: string;
  budget_range: string;
  active_campaigns: number;
  completed_deals: number;
  average_rating: number;
  preferred_categories: string[];
  target_audience: {
    age_range: string;
    interests: string[];
    location_focus?: string;
  };
  match_score: number;
  verification_status: 'verified' | 'pending' | 'unverified';
}

export interface SearchFilters {
  // Creator filters
  followerRange?: [number, number];
  engagementRate?: [number, number];
  categories?: string[];
  location?: string;
  priceRange?: [number, number];
  rating?: number;
  availability?: 'available' | 'busy' | 'unavailable';
  contentTypes?: string[];

  // Brand filters
  industry?: string[];
  budgetRange?: string;
  brandSize?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  targetAudience?: string[];
  verificationStatus?: 'verified' | 'pending' | 'unverified';

  // Common filters
  sortBy?: 'relevance' | 'rating' | 'followers' | 'price' | 'recent_activity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchQuery {
  query: string;
  type: 'creators' | 'brands' | 'both';
  filters: SearchFilters;
}

export class AdvancedSearchService {
  /**
   * Perform semantic search with AI-powered matching
   */
  static async semanticSearch(query: string, type: 'creators' | 'brands' | 'both' = 'both'): Promise<{
    creators: CreatorSearchResult[];
    brands: BrandSearchResult[];
    suggestions: string[];
    totalResults: number;
  }> {
    // In a real implementation, this would use vector search with embeddings
    // For now, we'll use enhanced text matching

    const searchTerms = this.extractSearchTerms(query);
    const intent = this.analyzeSearchIntent(query);

    let creators: CreatorSearchResult[] = [];
    let brands: BrandSearchResult[] = [];

    if (type === 'creators' || type === 'both') {
      creators = await this.searchCreators(searchTerms, intent);
    }

    if (type === 'brands' || type === 'both') {
      brands = await this.searchBrands(searchTerms, intent);
    }

    // Generate search suggestions
    const suggestions = this.generateSearchSuggestions(query, creators.length, brands.length);

    return {
      creators,
      brands,
      suggestions,
      totalResults: creators.length + brands.length
    };
  }

  /**
   * Extract meaningful search terms from query
   */
  private static extractSearchTerms(query: string): string[] {
    // Remove common words and extract meaningful terms
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they'];

    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10); // Limit to 10 terms
  }

  /**
   * Analyze search intent to provide better results
   */
  private static analyzeSearchIntent(query: string): {
    lookingFor: 'creators' | 'brands' | 'both';
    categories: string[];
    budget: 'low' | 'medium' | 'high' | 'any';
    location?: string;
    contentType?: string;
  } {
    const lowerQuery = query.toLowerCase();

    // Determine what user is looking for
    let lookingFor: 'creators' | 'brands' | 'both' = 'both';
    if (lowerQuery.includes('creator') || lowerQuery.includes('influencer') || lowerQuery.includes('content')) {
      lookingFor = 'creators';
    } else if (lowerQuery.includes('brand') || lowerQuery.includes('company') || lowerQuery.includes('business')) {
      lookingFor = 'brands';
    }

    // Extract categories
    const categoryKeywords = {
      'fashion': ['fashion', 'style', 'clothing', 'outfit', 'model'],
      'beauty': ['beauty', 'makeup', 'skincare', 'cosmetics', 'hair'],
      'food': ['food', 'cooking', 'recipe', 'restaurant', 'cuisine'],
      'tech': ['tech', 'technology', 'gadget', 'software', 'app'],
      'fitness': ['fitness', 'gym', 'workout', 'health', 'exercise'],
      'travel': ['travel', 'vacation', 'destination', 'adventure', 'tour'],
      'lifestyle': ['lifestyle', 'daily', 'routine', 'home', 'decor'],
      'gaming': ['gaming', 'game', 'esports', 'streamer', 'gamer']
    };

    const categories: string[] = [];
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        categories.push(category);
      }
    }

    // Determine budget level
    let budget: 'low' | 'medium' | 'high' | 'any' = 'any';
    if (lowerQuery.includes('cheap') || lowerQuery.includes('budget') || lowerQuery.includes('affordable')) {
      budget = 'low';
    } else if (lowerQuery.includes('premium') || lowerQuery.includes('expensive') || lowerQuery.includes('high-end')) {
      budget = 'high';
    } else if (lowerQuery.includes('moderate') || lowerQuery.includes('medium')) {
      budget = 'medium';
    }

    // Extract location if mentioned
    const locationMatch = lowerQuery.match(/\b(delhi|mumbai|bangalore|chennai|kolkata|pune|hyderabad|ahmedabad|jaipur|surat)\b/i);
    const location = locationMatch ? locationMatch[1] : undefined;

    // Extract content type
    let contentType: string | undefined;
    if (lowerQuery.includes('reel')) contentType = 'reel';
    else if (lowerQuery.includes('story') || lowerQuery.includes('stories')) contentType = 'story';
    else if (lowerQuery.includes('post')) contentType = 'post';
    else if (lowerQuery.includes('video')) contentType = 'video';

    return {
      lookingFor,
      categories,
      budget,
      location,
      contentType
    };
  }

  /**
   * Search creators with advanced filtering and scoring
   */
  private static async searchCreators(searchTerms: string[], intent: any): Promise<CreatorSearchResult[]> {
    // Mock data - in real implementation, this would query the database
    const mockCreators: CreatorSearchResult[] = [
      {
        id: 'creator-1',
        name: 'Priya Sharma',
        handle: 'priya.reels',
        bio: 'Fashion and lifestyle content creator sharing authentic stories from Delhi',
        followers_count: 50000,
        engagement_rate: 4.2,
        categories: ['fashion', 'lifestyle'],
        location: 'Delhi',
        verified: true,
        average_rating: 4.8,
        completed_deals: 45,
        price_range: { min: 8000, max: 25000 },
        recent_work: [
          { type: 'reel', brand: 'H&M', engagement: '2.1M views' },
          { type: 'post', brand: 'Nykaa', engagement: '45K likes' }
        ],
        match_score: 95,
        availability_status: 'available'
      },
      {
        id: 'creator-2',
        name: 'Rahul Verma',
        handle: 'rahul.tech',
        bio: 'Tech reviewer and gadget enthusiast from Mumbai',
        followers_count: 75000,
        engagement_rate: 3.8,
        categories: ['tech', 'gaming'],
        location: 'Mumbai',
        verified: true,
        average_rating: 4.6,
        completed_deals: 32,
        price_range: { min: 12000, max: 35000 },
        recent_work: [
          { type: 'video', brand: 'Samsung', engagement: '850K views' },
          { type: 'reel', brand: 'OnePlus', engagement: '1.2M views' }
        ],
        match_score: 88,
        availability_status: 'busy'
      }
    ];

    // Apply filtering and scoring based on search terms and intent
    return mockCreators
      .filter(creator => this.matchesCreatorFilters(creator, intent))
      .map(creator => ({
        ...creator,
        match_score: this.calculateCreatorMatchScore(creator, searchTerms, intent)
      }))
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 20);
  }

  /**
   * Search brands with advanced filtering
   */
  private static async searchBrands(searchTerms: string[], intent: any): Promise<BrandSearchResult[]> {
    // Mock data - in real implementation, this would query the database
    const mockBrands: BrandSearchResult[] = [
      {
        id: 'brand-1',
        name: 'Fashion Forward',
        industry: 'Fashion',
        location: 'Delhi',
        description: 'Contemporary fashion brand targeting young professionals',
        budget_range: '₹10,000 - ₹50,000',
        active_campaigns: 3,
        completed_deals: 127,
        average_rating: 4.7,
        preferred_categories: ['fashion', 'lifestyle'],
        target_audience: {
          age_range: '18-35',
          interests: ['fashion', 'shopping', 'social media']
        },
        match_score: 92,
        verification_status: 'verified'
      },
      {
        id: 'brand-2',
        name: 'TechHub India',
        industry: 'Technology',
        location: 'Bangalore',
        description: 'Leading tech company focused on consumer electronics',
        budget_range: '₹25,000 - ₹1,00,000',
        active_campaigns: 5,
        completed_deals: 89,
        average_rating: 4.5,
        preferred_categories: ['tech', 'gaming'],
        target_audience: {
          age_range: '20-40',
          interests: ['technology', 'gaming', 'innovation']
        },
        match_score: 85,
        verification_status: 'verified'
      }
    ];

    return mockBrands
      .filter(brand => this.matchesBrandFilters(brand, intent))
      .map(brand => ({
        ...brand,
        match_score: this.calculateBrandMatchScore(brand, searchTerms, intent)
      }))
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 20);
  }

  /**
   * Generate intelligent search suggestions
   */
  private static generateSearchSuggestions(query: string, creatorCount: number, brandCount: number): string[] {
    const suggestions: string[] = [];

    // Add popular searches if query is short
    if (query.length < 3) {
      suggestions.push(
        'fashion creators in Delhi',
        'tech reviewers Mumbai',
        'beauty brands',
        'food influencers Bangalore',
        'fitness coaches'
      );
    }

    // Add category-based suggestions
    const categories = ['fashion', 'beauty', 'tech', 'food', 'fitness', 'travel', 'gaming'];
    categories.forEach(category => {
      if (query.toLowerCase().includes(category)) {
        suggestions.push(`${category} creators`, `${category} brands`);
      }
    });

    // Add location-based suggestions
    const locations = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata'];
    locations.forEach(location => {
      if (query.toLowerCase().includes(location.toLowerCase())) {
        suggestions.push(`${location} creators`, `${location} brands`);
      }
    });

    return suggestions.slice(0, 5);
  }

  private static matchesCreatorFilters(creator: CreatorSearchResult, intent: any): boolean {
    // Category match
    if (intent.categories.length > 0) {
      const hasMatchingCategory = intent.categories.some((cat: string) =>
        creator.categories.some((c: string) => c.toLowerCase().includes(cat.toLowerCase()))
      );
      if (!hasMatchingCategory) return false;
    }

    // Location match
    if (intent.location && creator.location) {
      if (!creator.location.toLowerCase().includes(intent.location.toLowerCase())) {
        return false;
      }
    }

    // Content type match
    if (intent.contentType && creator.recent_work) {
      const hasContentType = creator.recent_work.some((work: any) =>
        work.type.toLowerCase().includes(intent.contentType!.toLowerCase())
      );
      if (!hasContentType) return false;
    }

    return true;
  }

  private static matchesBrandFilters(brand: BrandSearchResult, intent: any): boolean {
    // Industry match
    if (intent.categories.length > 0) {
      const hasMatchingIndustry = intent.categories.some((cat: string) =>
        brand.industry.toLowerCase().includes(cat.toLowerCase()) ||
        brand.preferred_categories.some((c: string) => c.toLowerCase().includes(cat.toLowerCase()))
      );
      if (!hasMatchingIndustry) return false;
    }

    return true;
  }

  private static calculateCreatorMatchScore(creator: CreatorSearchResult, searchTerms: string[], intent: any): number {
    let score = 50; // Base score

    // Name/handle match
    const nameMatch = searchTerms.some(term =>
      creator.name.toLowerCase().includes(term) ||
      creator.handle.toLowerCase().includes(term)
    );
    if (nameMatch) score += 30;

    // Category match
    const categoryMatch = intent.categories.some((cat: string) =>
      creator.categories.some((c: string) => c.toLowerCase().includes(cat.toLowerCase()))
    );
    if (categoryMatch) score += 20;

    // Location match
    if (intent.location && creator.location?.toLowerCase().includes(intent.location.toLowerCase())) {
      score += 15;
    }

    // Rating and engagement bonus
    if (creator.average_rating >= 4.5) score += 10;
    if (creator.engagement_rate >= 4.0) score += 10;

    // Availability bonus
    if (creator.availability_status === 'available') score += 5;

    return Math.min(score, 100);
  }

  private static calculateBrandMatchScore(brand: BrandSearchResult, searchTerms: string[], intent: any): number {
    let score = 50; // Base score

    // Name match
    const nameMatch = searchTerms.some(term =>
      brand.name.toLowerCase().includes(term)
    );
    if (nameMatch) score += 30;

    // Industry match
    const industryMatch = intent.categories.some((cat: string) =>
      brand.industry.toLowerCase().includes(cat.toLowerCase()) ||
      brand.preferred_categories.some((c: string) => c.toLowerCase().includes(cat.toLowerCase()))
    );
    if (industryMatch) score += 20;

    // Rating bonus
    if (brand.average_rating >= 4.5) score += 10;

    // Verification bonus
    if (brand.verification_status === 'verified') score += 15;

    return Math.min(score, 100);
  }
}

// React hook for advanced search
export const useAdvancedSearch = (query: SearchQuery) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['advanced-search', query],
    queryFn: async () => {
      return AdvancedSearchService.semanticSearch(query.query, query.type);
    },
    enabled: query.query.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    results: data,
    isLoading,
    error,
    refetch
  };
};

// Search analytics and insights
export const useSearchAnalytics = () => {
  const { profile } = useSession();

  const trackSearch = useCallback((query: string, results: number, type: 'creators' | 'brands' | 'both') => {
    // Track search analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'search', {
        search_term: query,
        results_count: results,
        search_type: type,
        user_id: profile?.id
      });
    }
  }, [profile?.id]);

  const trackResultClick = useCallback((resultId: string, resultType: 'creator' | 'brand', position: number) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'select_content', {
        content_type: resultType,
        content_id: resultId,
        position: position,
        user_id: profile?.id
      });
    }
  }, [profile?.id]);

  return { trackSearch, trackResultClick };
};