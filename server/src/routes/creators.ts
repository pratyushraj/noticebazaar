// @ts-nocheck
// Creator Directory API Routes
// Public routes for SEO-friendly creator directory

import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { estimateReelBudgetRange, getEffectiveReelRate } from '../services/creatorRateService.js';

const router = express.Router();

const numberOrNull = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const deriveProfileCompletion = (profile: any) => {
  const explicit = numberOrNull(profile?.profile_completion);
  if (explicit !== null) return clamp(Math.round(explicit), 0, 100);
  const checks = [
    Boolean(profile?.first_name || profile?.business_name),
    Boolean(profile?.username),
    Boolean(profile?.creator_category),
    Boolean(profile?.bio),
    Boolean(profile?.instagram_handle),
    Boolean(profile?.media_kit_url),
    Number(profile?.pricing_min ?? profile?.starting_price ?? profile?.avg_rate_reel ?? 0) > 0,
    Number(profile?.instagram_followers ?? profile?.followers_count ?? 0) > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const deriveAvgViews = (profile: any) => {
  const explicit = numberOrNull(profile?.avg_views);
  if (explicit !== null && explicit > 0) return explicit;
  const manual = numberOrNull(profile?.avg_reel_views_manual);
  if (manual !== null && manual > 0) return manual;
  const followers = Number(profile?.followers_count ?? profile?.instagram_followers ?? 0);
  if (!Number.isFinite(followers) || followers <= 0) return null;
  return Math.round(Math.max(1200, followers * 0.22));
};

const deriveStartingPrice = (profile: any) =>
  Number(profile?.starting_price ?? profile?.pricing_min ?? profile?.avg_rate_reel ?? profile?.pricing_avg ?? getEffectiveReelRate(profile) ?? 0) || 0;

const deriveCompletedDeals = (profile: any, trustStats: any) => {
  const explicit = numberOrNull(profile?.completed_deals);
  if (explicit !== null) return explicit;
  return Number(trustStats?.completed_deals ?? profile?.collab_brands_count_override ?? 0) || 0;
};

const deriveResponseHours = (profile: any, trustStats: any) => {
  const explicit = numberOrNull(profile?.response_hours);
  if (explicit !== null && explicit > 0) return explicit;
  const override = numberOrNull(profile?.collab_response_hours_override);
  if (override !== null && override > 0) return override;
  const trust = numberOrNull(trustStats?.avg_response_hours);
  return trust !== null && trust > 0 ? trust : null;
};

const deriveReliabilityScore = (profile: any, trustStats: any) => {
  const explicit = numberOrNull(profile?.reliability_score);
  if (explicit !== null) return clamp(Math.round(explicit), 0, 100);
  const trust = numberOrNull(trustStats?.completion_rate);
  if (trust !== null) return clamp(Math.round(trust), 0, 100);
  return 96;
};

const deriveEngagementRate = (profile: any, avgViews: number | null) => {
  const explicit = numberOrNull(profile?.engagement_rate);
  if (explicit !== null) return explicit;
  const likes = numberOrNull(profile?.avg_likes_manual);
  if (likes !== null && avgViews && avgViews > 0) {
    return Number(((likes / avgViews) * 100).toFixed(2));
  }
  return null;
};

const deriveAvailabilityStatus = (profile: any) => {
  const status = String(profile?.availability_status || '').trim().toLowerCase();
  if (['available', 'busy', 'next_week', 'unavailable'].includes(status)) return status;
  if (profile?.open_to_collabs === false) return 'busy';
  return 'available';
};

const isCreatorDiscoverable = (profile: any, stats: any) => {
  const checks = [
    Boolean(String(profile?.username || profile?.instagram_handle || '').trim()),
    Boolean(String(profile?.category || profile?.creator_category || '').trim()),
    Number(stats?.starting_price || 0) > 0,
    Number(profile?.followers ?? profile?.instagram_followers ?? profile?.followers_count ?? 0) > 0 || Number(stats?.avg_views || 0) > 0,
    Boolean(String(profile?.media_kit_url || '').trim()) || Number(stats?.completed_deals || 0) > 0,
  ];

  const completedChecks = checks.filter(Boolean).length;
  return (profile?.open_to_collabs !== false) && completedChecks >= 4;
};

const isBlockedSocialAvatar = (value: unknown) => {
  const url = String(value || '').trim().toLowerCase();
  if (!url) return false;
  return (
    url.includes('cdninstagram.com') ||
    url.includes('instagram.') ||
    url.includes('fbcdn.net')
  );
};

const getSafeCreatorPhoto = (profile: any) => {
  const avatarUrl = String((profile as any)?.avatar_url || '').trim();
  if (avatarUrl) return avatarUrl;

  const instagramPhoto = String(profile?.instagram_profile_photo || '').trim();
  if (instagramPhoto) return instagramPhoto;

  return null;
};

const stableSeedNumber = (input: unknown) => {
  const text = String(input || 'creator-armour').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const deriveFallbackBadges = (profile: any, stats: any, existingBadges: string[]) => {
  const seed = stableSeedNumber(profile?.id || profile?.username || profile?.instagram_handle || profile?.first_name);
  const fallbackPool = [
    { label: 'Recently Active', allowed: !existingBadges.includes('Recently Active') },
    { label: 'Budget Friendly', allowed: !existingBadges.includes('Budget Friendly') && stats.starting_price > 0 && stats.starting_price <= 18000 },
    { label: 'Available Now', allowed: !existingBadges.includes('Available Now') && stats.availability_status === 'available' },
    { label: 'Fast Responder', allowed: !existingBadges.includes('Fast Responder') && (stats.response_hours === null || stats.response_hours <= 12) },
    { label: 'High Reliability', allowed: !existingBadges.includes('High Reliability') && stats.reliability_score >= 90 },
    { label: 'New Creator', allowed: !existingBadges.includes('New Creator') && stats.completed_deals === 0 },
    { label: 'Featured', allowed: !existingBadges.includes('Featured') && Boolean(profile?.is_featured) },
  ].filter((item) => item.allowed);

  if (fallbackPool.length === 0) return [];

  const ordered = fallbackPool
    .map((item, index) => ({
      ...item,
      rank: (seed + (index + 1) * 17) % 97,
    }))
    .sort((a, b) => a.rank - b.rank);

  return ordered.map((item) => item.label);
};

const deriveBadges = (profile: any, stats: any) => {
  const badges: string[] = [];
  const responseHours = stats.response_hours;
  const reliabilityScore = stats.reliability_score;
  const completedDeals = stats.completed_deals;
  const avgViews = stats.avg_views;
  const startingPrice = stats.starting_price;
  const lastActiveAt = profile?.last_active_at ? new Date(profile.last_active_at).getTime() : 0;
  const recentlyActive = lastActiveAt > 0 && (Date.now() - lastActiveAt) <= (7 * 24 * 60 * 60 * 1000);
  const bestValue = avgViews && startingPrice > 0 ? (startingPrice / avgViews) <= 0.45 : false;
  const budgetFriendly = Boolean(profile?.is_budget_friendly) || (startingPrice > 0 && startingPrice <= 12000);

  if (profile?.is_verified) badges.push('Verified');
  if (responseHours !== null && responseHours <= 6) badges.push('Fast Responder');
  if (reliabilityScore >= 95) badges.push('High Reliability');
  if (bestValue) badges.push('Best Value');
  if (recentlyActive) badges.push('Recently Active');
  if (budgetFriendly) badges.push('Budget Friendly');
  if (completedDeals === 0) badges.push('New Creator');
  if (stats.availability_status === 'available') badges.push('Available Now');
  if (profile?.is_featured) badges.push('Featured');
  if (profile?.manual_badge && String(profile.manual_badge).trim()) badges.unshift(String(profile.manual_badge).trim());

  const uniqueBadges = Array.from(new Set(badges));
  if (uniqueBadges.length < 2) {
    uniqueBadges.push(...deriveFallbackBadges(profile, stats, uniqueBadges));
  }

  return Array.from(new Set(uniqueBadges)).slice(0, 2);
};

/**
 * GET /api/creators
 * Get list of creators for directory (public, no auth required)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, limit = '50', offset = '0', username, q } = req.query as any;
    const baseSelect = `
      id,
      username,
      first_name,
      last_name,
      business_name,
      avatar_url,
      location,
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
      media_kit_url,
      avg_reel_views_manual,
      avg_likes_manual,
      open_to_collabs,
      collab_brands_count_override,
      collab_response_hours_override,
      youtube_subs,
      tiktok_followers,
      twitter_followers,
      facebook_followers,
      discovery_video_url,
      barter_min_value
    `;
    const performanceSelect = `
      followers_count,
      avg_views,
      engagement_rate,
      starting_price,
      completed_deals,
      reliability_score,
      response_hours,
      profile_completion,
      availability_status,
      last_active_at,
      is_verified,
      is_featured,
      is_budget_friendly,
      manual_badge,
      conversion_rate,
      repeat_brands,
      on_time_delivery_rate
    `;

    const normalizeHandle = (raw: unknown) => {
      const s = String(raw || '').trim().replace(/^@+/, '').toLowerCase();
      // Keep it conservative so we don't generate invalid PostgREST filters.
      return s.replace(/[^a-z0-9._]/g, '');
    };

    const buildQuery = (selectClause: string) => {
      let query = supabase
        .from('profiles')
        .select(selectClause)
        .eq('role', 'creator')
        .not('username', 'is', null)
        .neq('username', 'democreator')
        .not('discovery_video_url', 'is', null)
        .neq('discovery_video_url', '')
        .order('created_at', { ascending: false });

      const usernameTerm = normalizeHandle(username);
      if (usernameTerm) {
        query = query.or(`username.ilike.${usernameTerm},instagram_handle.ilike.${usernameTerm}`);
      }

      const qTerm = normalizeHandle(q);
      if (qTerm) {
        const like = `%${qTerm}%`;
        query = query.or(
          `username.ilike.${like},instagram_handle.ilike.${like},business_name.ilike.${like},first_name.ilike.${like},last_name.ilike.${like}`
        );
      }

      query = query.range(
        parseInt(offset as string, 10),
        parseInt(offset as string, 10) + parseInt(limit as string, 10) - 1
      );

      if (category && category !== 'all') {
        query = query.eq('creator_category', category as string);
      }

      return query;
    };

    let { data: profiles, error } = await buildQuery(`${baseSelect}, ${performanceSelect}`);
    if (error) {
      const message = String(error.message || '').toLowerCase();
      const missingColumn = error.code === '42703' || message.includes('column') || message.includes('does not exist') || message.includes('schema cache');
      if (missingColumn) {
        const fallback = await buildQuery(baseSelect);
        profiles = fallback.data;
        error = fallback.error;
      }
    }

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

      const uname = (profile.username || '').toLowerCase().trim();
      let creatorName = profile.business_name ||
        `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
        'Creator';

      let profilePhoto = getSafeCreatorPhoto(profile);

      if (uname === 'beyonce') {
        creatorName = 'Beyoncé';
        profilePhoto = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800&h=800';
      } else if (uname === 'virat.kohli') {
        creatorName = 'Virat Kohli';
        profilePhoto = 'https://images.unsplash.com/photo-1541233349642-6e425fe6190e?auto=format&fit=crop&q=80&w=800&h=800';
      }

      // Also ensure internal profile object has consistent photo
      if (uname === 'beyonce' || uname === 'virat.kohli') {
        profile.avatar_url = profilePhoto;
        profile.instagram_profile_photo = profilePhoto;
      }
      const avgViews = deriveAvgViews(profile);
      const startingPrice = deriveStartingPrice(profile);
      const stats = {
        avg_views: avgViews,
        starting_price: startingPrice,
        completed_deals: deriveCompletedDeals(profile, null),
        response_hours: deriveResponseHours(profile, null),
        reliability_score: deriveReliabilityScore(profile, null),
        profile_completion: deriveProfileCompletion(profile),
        engagement_rate: deriveEngagementRate(profile, avgViews),
        availability_status: deriveAvailabilityStatus(profile),
      };

      return {
        id: profile.id,
        username: profile.username,
        name: creatorName,
        category: profile.creator_category,
        bio: profile.bio,
        profile_photo: profilePhoto,
        followers: numberOrNull(profile.followers_count) ?? profile.instagram_followers ?? null,
        avg_views: stats.avg_views,
        engagement_rate: stats.engagement_rate,
        starting_price: stats.starting_price,
        completed_deals: stats.completed_deals,
        reliability_score: stats.reliability_score,
        response_hours: stats.response_hours,
        profile_completion: stats.profile_completion,
        availability_status: stats.availability_status,
        last_active_at: profile.last_active_at || null,
        is_verified: Boolean(profile.is_verified),
        is_featured: Boolean(profile.is_featured),
        is_budget_friendly: Boolean(profile.is_budget_friendly),
        manual_badge: profile.manual_badge || null,
        conversion_rate: numberOrNull(profile.conversion_rate),
        repeat_brands: numberOrNull(profile.repeat_brands) ?? 0,
        on_time_delivery_rate: numberOrNull(profile.on_time_delivery_rate),
        location: profile.location || null,
        media_kit_url: profile.media_kit_url || null,
        discovery_video_url: profile.discovery_video_url || null,
        barter_min_value: profile.barter_min_value || null,
        badges: deriveBadges(profile, stats),
        last_instagram_sync: (profile as any).last_instagram_sync || null,
        pricing: {
          min: stats.starting_price || ((profile as any).pricing_min ?? null),
          avg: (profile as any).pricing_avg ?? null,
          max: (profile as any).pricing_max ?? null,
          reel: stats.starting_price || getEffectiveReelRate(profile),
          estimated_range: estimateReelBudgetRange(getEffectiveReelRate(profile)),
        },
        platforms,
      };
    }).filter((creator: any) => isCreatorDiscoverable(creator, {
      starting_price: creator.starting_price,
      avg_views: creator.avg_views,
      completed_deals: creator.completed_deals,
    }));

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
    const baseSelect = `
      id,
      username,
      first_name,
      last_name,
      business_name,
      avatar_url,
      location,
      creator_category,
      bio,
      instagram_handle,
      instagram_followers,
      instagram_profile_photo,
      last_instagram_sync,
      avg_rate_reel,
      learned_avg_rate_reel,
      pricing_min,
      pricing_avg,
      pricing_max,
      media_kit_url,
      avg_reel_views_manual,
      avg_likes_manual,
      open_to_collabs,
      collab_brands_count_override,
      collab_response_hours_override,
      discovery_video_url,
      barter_min_value
    `;
    const performanceSelect = `
      followers_count,
      avg_views,
      engagement_rate,
      starting_price,
      completed_deals,
      reliability_score,
      response_hours,
      profile_completion,
      availability_status,
      last_active_at,
      is_verified,
      is_featured,
      is_budget_friendly,
      manual_badge,
      conversion_rate,
      repeat_brands,
      on_time_delivery_rate
    `;

    const buildSuggestedQuery = (selectClause: string) => {
      let query = supabase
        .from('profiles')
        .select(selectClause)
        .eq('role', 'creator')
        .not('username', 'is', null)
        .order('created_at', { ascending: false })
        .range(safeOffset, safeOffset + safeLimit - 1);

      if (category && category !== 'all') {
        query = query.eq('creator_category', category as string);
      }

      return query;
    };

    let { data: profiles, error } = await buildSuggestedQuery(`${baseSelect}, ${performanceSelect}`);
    if (error) {
      const message = String(error.message || '').toLowerCase();
      const missingColumn = error.code === '42703' || message.includes('column') || message.includes('does not exist') || message.includes('schema cache');
      if (missingColumn) {
        const fallback = await buildSuggestedQuery(baseSelect);
        profiles = fallback.data;
        error = fallback.error;
      }
    }

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
      const uname = (profile.username || '').toLowerCase().trim();
      let creatorName = profile.business_name ||
        `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
        'Creator';

      if (uname === 'beyonce') {
        creatorName = 'Beyoncé';
      } else if (uname === 'virat.kohli') {
        creatorName = 'Virat Kohli';
      }

      const effectiveReelRate = getEffectiveReelRate(profile);
      const trust = trustByCreatorId.get(String(profile.id)) || {
        completed_deals: 0,
        total_deals: 0,
        completion_rate: 100,
        avg_response_hours: null,
      };
      const avgViews = deriveAvgViews(profile);
      const startingPrice = deriveStartingPrice(profile) || effectiveReelRate;
      const stats = {
        avg_views: avgViews,
        starting_price: startingPrice,
        completed_deals: deriveCompletedDeals(profile, trust),
        response_hours: deriveResponseHours(profile, trust),
        reliability_score: deriveReliabilityScore(profile, trust),
        profile_completion: deriveProfileCompletion(profile),
        engagement_rate: deriveEngagementRate(profile, avgViews),
        availability_status: deriveAvailabilityStatus(profile),
      };

      return {
        id: profile.id,
        username: profile.username,
        name: creatorName,
        category: profile.creator_category,
        bio: profile.bio,
        profile_photo: (() => {
          const safePhoto = getSafeCreatorPhoto(profile);
          const isPlaceholder = !safePhoto || 
                               safePhoto.includes('photo-1531415074968-036ba1b575da') || 
                               safePhoto.includes('photo-1541233349642-6e425fe6190e') || 
                               safePhoto.includes('photo-1493225255756-d9584f8606e9') || 
                               safePhoto.includes('photo-1516280440614-37939bbacd81') || 
                               safePhoto.includes('placeholder') ||
                               (safePhoto.includes('unsplash.com') && !safePhoto.includes('supabase.co'));

          if (uname === 'beyonce' && isPlaceholder) {
            return 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800&h=800';
          }
          if (uname === 'virat.kohli' && isPlaceholder) {
            return 'https://images.unsplash.com/photo-1541233349642-6e425fe6190e?auto=format&fit=crop&q=80&w=800&h=800';
          }
          return safePhoto;
        })(),
        followers: numberOrNull(profile.followers_count) ?? profile.instagram_followers ?? null,
        avg_views: stats.avg_views,
        engagement_rate: stats.engagement_rate,
        starting_price: stats.starting_price,
        completed_deals: stats.completed_deals,
        reliability_score: stats.reliability_score,
        response_hours: stats.response_hours,
        profile_completion: stats.profile_completion,
        availability_status: stats.availability_status,
        last_active_at: profile.last_active_at || profile.last_instagram_sync || null,
        is_verified: Boolean(profile.is_verified),
        is_featured: Boolean(profile.is_featured),
        is_budget_friendly: Boolean(profile.is_budget_friendly),
        manual_badge: profile.manual_badge || null,
        conversion_rate: numberOrNull(profile.conversion_rate),
        repeat_brands: numberOrNull(profile.repeat_brands) ?? 0,
        on_time_delivery_rate: numberOrNull(profile.on_time_delivery_rate),
        location: profile.location || null,
        media_kit_url: profile.media_kit_url || null,
        discovery_video_url: profile.discovery_video_url || null,
        barter_min_value: profile.barter_min_value || null,
        badges: deriveBadges(profile, stats),
        pricing: {
          min: stats.starting_price || (profile.pricing_min ?? null),
          avg: profile.pricing_avg ?? null,
          max: profile.pricing_max ?? null,
          reel: stats.starting_price || effectiveReelRate,
          estimated_range: estimateReelBudgetRange(effectiveReelRate),
        },
        trust: {
          ...trust,
          completed_deals: stats.completed_deals,
          completion_rate: stats.reliability_score,
          avg_response_hours: stats.response_hours,
        },
      };
    }).filter((creator: any) => isCreatorDiscoverable(creator, {
      starting_price: creator.starting_price,
      avg_views: creator.avg_views,
      completed_deals: creator.completed_deals,
    }));

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
