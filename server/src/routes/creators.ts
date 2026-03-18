// @ts-nocheck
// Creator Directory API Routes
// Public routes for SEO-friendly creator directory

import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { estimateReelBudgetRange, getEffectiveReelRate } from '../services/creatorRateService.js';

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
        avatar_url,
        creator_category,
        bio,
        instagram_handle,
        youtube_channel_id,
        tiktok_handle,
        twitter_handle,
        facebook_profile_url,
        instagram_followers,
        instagram_profile_photo,
        last_instagram_sync,
        avg_rate_reel,
        learned_avg_rate_reel,
        pricing_min,
        pricing_avg,
        pricing_max,
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

      const rawPhoto = (profile as any).avatar_url || (profile as any).instagram_profile_photo || null;
      const profilePhoto =
        rawPhoto && typeof rawPhoto === 'string' && rawPhoto.includes('cdninstagram.com')
          ? null
          : rawPhoto;

      return {
        id: profile.id,
        username: profile.username,
        name: creatorName,
        category: profile.creator_category,
        bio: profile.bio,
        profile_photo: profilePhoto,
        followers: profile.instagram_followers ?? null,
        last_instagram_sync: (profile as any).last_instagram_sync || null,
        pricing: {
          min: (profile as any).pricing_min ?? null,
          avg: (profile as any).pricing_avg ?? null,
          max: (profile as any).pricing_max ?? null,
          reel: getEffectiveReelRate(profile),
          estimated_range: estimateReelBudgetRange(getEffectiveReelRate(profile)),
        },
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
 * GET /api/creators/suggested
 * Lightweight discovery endpoint that includes trust signals (no vanity metrics).
 * Public: safe aggregated stats only.
 */
router.get('/suggested', async (req: Request, res: Response) => {
  try {
    const { category, limit = '8', offset = '0' } = req.query;
    const safeLimit = Math.max(1, Math.min(24, parseInt(limit as string, 10) || 8));
    const safeOffset = Math.max(0, parseInt(offset as string, 10) || 0);

    let query = supabase
      .from('profiles')
      .select(`
        id,
        username,
        first_name,
        last_name,
        business_name,
        avatar_url,
        creator_category,
        bio,
        instagram_handle,
        instagram_followers,
        instagram_profile_photo,
        avg_rate_reel,
        learned_avg_rate_reel,
        pricing_min,
        pricing_avg,
        pricing_max
      `)
      .eq('role', 'creator')
      .not('username', 'is', null)
      .order('created_at', { ascending: false })
      .range(safeOffset, safeOffset + safeLimit - 1);

    if (category && category !== 'all') {
      query = query.eq('creator_category', category as string);
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.error('[Creators] Error fetching suggested creators:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch creators' });
    }

    const creatorIds = (profiles || []).map((p: any) => p.id).filter(Boolean);

    const trustByCreatorId = new Map<string, any>();
    creatorIds.forEach((id: string) => trustByCreatorId.set(String(id), {
      completed_deals: 0,
      total_deals: 0,
      completion_rate: 100,
      avg_response_hours: null,
    }));

    if (creatorIds.length > 0) {
      // Deals completion signals
      const { data: dealsRows } = await supabase
        .from('brand_deals')
        .select('creator_id, status, progress_percentage')
        .in('creator_id' as any, creatorIds as any[]);

      (dealsRows || []).forEach((d: any) => {
        const id = String(d.creator_id || '');
        if (!trustByCreatorId.has(id)) return;
        const t = trustByCreatorId.get(id);
        t.total_deals += 1;
        const status = String(d?.status || '').toLowerCase();
        const progress = Number(d?.progress_percentage ?? 0);
        const isCompleted = progress >= 100 || status.includes('completed') || status.includes('closed');
        if (isCompleted) t.completed_deals += 1;
      });

      // Response timing signals
      const { data: responseRows } = await supabase
        .from('collab_requests')
        .select('creator_id, created_at, updated_at, status')
        .in('creator_id' as any, creatorIds as any[])
        .in('status', ['accepted', 'countered', 'declined']);

      const responseBuckets = new Map<string, number[]>();
      (responseRows || []).forEach((r: any) => {
        const id = String(r.creator_id || '');
        if (!id || !trustByCreatorId.has(id)) return;
        if (!r.created_at || !r.updated_at) return;
        const diff = new Date(r.updated_at).getTime() - new Date(r.created_at).getTime();
        if (!(diff > 0)) return;
        const hours = diff / (1000 * 60 * 60);
        if (!responseBuckets.has(id)) responseBuckets.set(id, []);
        responseBuckets.get(id)!.push(hours);
      });

      trustByCreatorId.forEach((t, id) => {
        t.completion_rate = t.total_deals > 0 ? Math.round((t.completed_deals / t.total_deals) * 100) : 100;
        const hoursList = responseBuckets.get(id) || [];
        if (hoursList.length > 0) {
          const avg = hoursList.reduce((acc, h) => acc + h, 0) / hoursList.length;
          t.avg_response_hours = Math.round(avg);
        }
      });
    }

    const creators = (profiles || []).map((profile: any) => {
      const creatorName = profile.business_name ||
        `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
        'Creator';

      const effectiveReelRate = getEffectiveReelRate(profile);
      const trust = trustByCreatorId.get(String(profile.id)) || {
        completed_deals: 0,
        total_deals: 0,
        completion_rate: 100,
        avg_response_hours: null,
      };

      return {
        id: profile.id,
        username: profile.username,
        name: creatorName,
        category: profile.creator_category,
        bio: profile.bio,
        profile_photo:
          ((profile as any).avatar_url && typeof (profile as any).avatar_url === 'string' && !(profile as any).avatar_url.includes('cdninstagram.com'))
            ? (profile as any).avatar_url
            : (profile.instagram_profile_photo && typeof profile.instagram_profile_photo === 'string' && profile.instagram_profile_photo.includes('cdninstagram.com'))
              ? null
              : (profile.instagram_profile_photo || null),
        followers: profile.instagram_followers ?? null,
        pricing: {
          min: profile.pricing_min ?? null,
          avg: profile.pricing_avg ?? null,
          max: profile.pricing_max ?? null,
          reel: effectiveReelRate,
          estimated_range: estimateReelBudgetRange(effectiveReelRate),
        },
        trust,
      };
    });

    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json({ success: true, creators, count: creators.length });
  } catch (error: any) {
    console.error('[Creators] Error in GET /suggested:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
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

/**
 * GET /api/creators/reputation-stats
 * Get trust and performance stats for a creator
 */
router.get('/reputation-stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id; // Current creator
    const targetCreatorId = req.query.creatorId as string || userId; // Allow admin to check others

    // 1. Fetch creator profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id, first_name, last_name, username, instagram_handle, 
        collab_brands_count_override, last_instagram_sync
      `)
      .eq('id', targetCreatorId)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(404).json({ success: false, error: 'Creator not found' });
    }

    // 2. Fetch trust stats (similar logic to collabRequests.ts)
    const { data: dealsRows } = await supabase
      .from('brand_deals')
      .select('brand_name, status, progress_percentage')
      .eq('creator_id', targetCreatorId);

    const deals = dealsRows || [];
    const totalDeals = deals.length;
    const completedDeals = deals.filter((d: any) => {
      const status = (d?.status || '').toLowerCase();
      const progress = d?.progress_percentage ?? 0;
      return progress >= 100 || status.includes('completed') || status.includes('closed');
    }).length;

    const uniqueBrands = new Set(
      deals.map((d: any) => (d?.brand_name || '').trim().toLowerCase()).filter(Boolean)
    ).size;

    const baseBrandCount = Number(profile.collab_brands_count_override) || 0;
    const brandsCount = baseBrandCount + uniqueBrands;

    // 3. Response timing
    const { data: responseRows } = await supabase
      .from('collab_requests')
      .select('created_at, updated_at, status')
      .eq('creator_id', targetCreatorId)
      .in('status', ['accepted', 'countered', 'declined']);

    const validResponses = (responseRows || []).filter(r => r.created_at && r.updated_at);
    const avgResponseHours = validResponses.length > 0
      ? validResponses.reduce((sum, r) => {
        const diff = new Date(r.updated_at).getTime() - new Date(r.created_at).getTime();
        return sum + (diff / (1000 * 60 * 60));
      }, 0) / validResponses.length
      : null;

    // 4. Performance snapshot
    const { data: latestSnapshot } = await supabase
      .from('instagram_performance_snapshots')
      .select('*')
      .eq('creator_id', targetCreatorId)
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    res.json({
      success: true,
      stats: {
        brands_count: brandsCount,
        completed_deals: completedDeals,
        total_deals: totalDeals,
        completion_rate: totalDeals > 0 ? Math.round((completedDeals / totalDeals) * 100) : 100,
        avg_response_hours: avgResponseHours !== null ? Math.round(avgResponseHours) : null,
      },
      performance: latestSnapshot || null,
      profile: {
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Creator',
        username: profile.username,
        instagram_handle: profile.instagram_handle
      }
    });
  } catch (error: any) {
    console.error('[Creators] reputation-stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
