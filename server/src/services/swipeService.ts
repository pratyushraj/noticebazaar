import { supabase } from '../index.js';
import { Database } from '../types/supabase.js';

type SwipeDirection = 'left' | 'right';

export interface SwipeResponse {
  success: boolean;
  is_match: boolean;
  swipe_id: string;
  _debug: {
    swipe_count: number;
    match_created: boolean;
    duplicates_blocked: boolean;
  };
}

export class SwipeService {
  /**
   * Records a brand's interest in a creator
   */
  static async recordBrandSwipe(
    brandId: string,
    creatorId: string,
    direction: SwipeDirection
  ): Promise<SwipeResponse> {
    console.log(`[SwipeService] Brand ${brandId} swiped ${direction} on Creator ${creatorId}`);
    
    // 1. Idempotent Upsert
    const { data: swipe, error } = await supabase
      .from('brand_swipes')
      .upsert(
        { brand_id: brandId, creator_id: creatorId, direction },
        { onConflict: 'brand_id,creator_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[SwipeService] Brand swipe error:', error);
      throw error;
    }

    // 2. Check for Match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id')
      .eq('brand_id', brandId)
      .eq('creator_id', creatorId)
      .maybeSingle();

    return {
      success: true,
      is_match: !!match,
      swipe_id: swipe.id,
      _debug: {
        swipe_count: 1, // Logic for tracking multiple attempts could go here
        match_created: !!match,
        duplicates_blocked: true // Guaranteed by UNIQUE constraint
      }
    };
  }

  /**
   * Records a creator's interest in a brand
   */
  static async recordCreatorSwipe(
    creatorId: string,
    brandId: string,
    direction: SwipeDirection
  ): Promise<SwipeResponse> {
    console.log(`[SwipeService] Creator ${creatorId} swiped ${direction} on Brand ${brandId}`);

    // 1. Idempotent Upsert
    const { data: swipe, error } = await supabase
      .from('creator_swipes')
      .upsert(
        { creator_id: creatorId, brand_id: brandId, direction },
        { onConflict: 'creator_id,brand_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[SwipeService] Creator swipe error:', error);
      throw error;
    }

    // 2. Check for Match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id')
      .eq('creator_id', creatorId)
      .eq('brand_id', brandId)
      .maybeSingle();

    return {
      success: true,
      is_match: !!match,
      swipe_id: swipe.id,
      _debug: {
        swipe_count: 1,
        match_created: !!match,
        duplicates_blocked: true
      }
    };
  }

  /**
   * Fetches all matches for a user
   */
  static async getMatches(userId: string, role: 'brand' | 'creator') {
    const query = supabase
      .from('matches')
      .select(`
        *,
        brand:brand_id (id, business_name, first_name, avatar_url),
        creator:creator_id (id, username, first_name, first_name)
      `);
    
    if (role === 'brand') {
      query.eq('brand_id', userId);
    } else {
      query.eq('creator_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}
