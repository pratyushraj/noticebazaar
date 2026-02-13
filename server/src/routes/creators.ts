// @ts-nocheck
// Creator Directory API Routes
// Public routes for SEO-friendly creator directory

import express, { Request, Response } from 'express';
import { supabase } from '../index.js';

const router = express.Router();

/**
 * GET /api/creators
 * Get list of creators for directory (public, no auth required)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, limit = '50', offset = '0' } = req.query;

    let query = supabase
      .from('profiles')
      .select(`
        id,
        username,
        first_name,
        last_name,
        business_name,
        creator_category,
        bio,
        instagram_handle,
        youtube_channel_id,
        tiktok_handle,
        twitter_handle,
        facebook_profile_url,
        instagram_followers,
        youtube_subs,
        tiktok_followers,
        twitter_followers,
        facebook_followers
      `)
      .eq('role', 'creator')
      .not('username', 'is', null)
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string, 10), parseInt(offset as string, 10) + parseInt(limit as string, 10) - 1);

    if (category && category !== 'all') {
      query = query.eq('creator_category', category as string);
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.error('[Creators] Error fetching creators:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch creators',
      });
    }

    // Transform profiles to include platform info
    const creators = (profiles || []).map(profile => {
      const platforms: Array<{ name: string; handle: string; followers?: number }> = [];
      
      if (profile.instagram_handle) {
        platforms.push({
          name: 'Instagram',
          handle: profile.instagram_handle,
          followers: profile.instagram_followers || undefined,
        });
      }
      if (profile.youtube_channel_id) {
        platforms.push({
          name: 'YouTube',
          handle: profile.youtube_channel_id,
          followers: profile.youtube_subs || undefined,
        });
      }
      if (profile.tiktok_handle) {
        platforms.push({
          name: 'TikTok',
          handle: profile.tiktok_handle,
          followers: profile.tiktok_followers || undefined,
        });
      }
      if (profile.twitter_handle) {
        platforms.push({
          name: 'Twitter',
          handle: profile.twitter_handle,
          followers: profile.twitter_followers || undefined,
        });
      }
      if (profile.facebook_profile_url) {
        platforms.push({
          name: 'Facebook',
          handle: profile.facebook_profile_url,
          followers: profile.facebook_followers || undefined,
        });
      }

      const creatorName = profile.business_name || 
        `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 
        'Creator';

      return {
        id: profile.id,
        username: profile.username,
        name: creatorName,
        category: profile.creator_category,
        bio: profile.bio,
        platforms,
      };
    });

    res.json({
      success: true,
      creators,
      count: creators.length,
    });
  } catch (error: any) {
    console.error('[Creators] Error in GET /:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/creators/categories
 * Get list of creator categories (public)
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('creator_category')
      .eq('role', 'creator')
      .not('creator_category', 'is', null);

    if (error) {
      console.error('[Creators] Error fetching categories:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch categories',
      });
    }

    const categories = Array.from(
      new Set((profiles || []).map(p => p.creator_category).filter(Boolean))
    ).sort();

    res.json({
      success: true,
      categories,
    });
  } catch (error: any) {
    console.error('[Creators] Error in GET /categories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;

