// @ts-nocheck
import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import {
  createInstagramOAuthState,
  exchangeCodeForTokens,
  fetchInstagramPerformanceSummary,
  getInstagramIntegrationMode,
  getInstagramOAuthUrl,
  parseInstagramOAuthState,
  resolveInstagramBusinessAccount,
} from '../services/instagramGraphService.js';

const router = Router();

router.post('/oauth/url', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const creatorId = req.user?.id;
    if (!creatorId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const returnTo = typeof req.body?.return_to === 'string' ? req.body.return_to : '';
    const state = createInstagramOAuthState({ creatorId, returnTo });
    const url = getInstagramOAuthUrl(state);

    return res.json({
      success: true,
      auth_url: url,
      state,
      redirect_uri: process.env.META_REDIRECT_URI,
    });
  } catch (error: any) {
    console.error('[InstagramOAuth] oauth/url error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to create OAuth URL' });
  }
});

router.get('/status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const creatorId = req.user?.id;
    if (!creatorId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const [{ data: conn, error: connError }, { data: latestSnapshot, error: snapshotError }, { data: profile, error: profileError }] = await Promise.all([
      supabase
        .from('instagram_connections')
        .select('ig_user_id, ig_username, connected_at, updated_at, page_access_token')
        .eq('creator_id', creatorId)
        .maybeSingle(),
      supabase
        .from('instagram_performance_snapshots')
        .select('captured_at')
        .eq('creator_id', creatorId)
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('instagram_handle, last_instagram_sync')
        .eq('id', creatorId)
        .maybeSingle(),
    ]);

    if (connError) {
      throw connError;
    }
    if (snapshotError) {
      throw snapshotError;
    }
    if (profileError) {
      throw profileError;
    }

    const connected = Boolean(conn?.ig_user_id || conn?.ig_username || profile?.instagram_handle);
    const lastSyncedAt = latestSnapshot?.captured_at || (profile as any)?.last_instagram_sync || null;

    return res.json({
      success: true,
      status: {
        connected,
        ig_username: conn?.ig_username || (profile as any)?.instagram_handle || null,
        connected_at: conn?.connected_at || null,
        last_synced_at: lastSyncedAt,
        can_sync: Boolean(conn?.ig_user_id && conn?.page_access_token),
        integration_mode: getInstagramIntegrationMode(),
      },
    });
  } catch (error: any) {
    console.error('[InstagramOAuth] status error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to fetch Instagram status' });
  }
});

router.get('/oauth/callback', async (req: Request, res: Response) => {
  const frontendBase = process.env.FRONTEND_URL || 'https://creatorarmour.com';
  const sanitizeReturnPath = (input: string | undefined): string => {
    if (!input || typeof input !== 'string') return '/creator-profile';
    if (!input.startsWith('/')) return '/creator-profile';
    if (input.startsWith('//')) return '/creator-profile';
    return input;
  };
  const failRedirect = (reason: string, returnPath: string) =>
    `${frontendBase}${returnPath}?instagram_connect=failed&reason=${encodeURIComponent(reason)}`;
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const stateRaw = typeof req.query.state === 'string' ? req.query.state : '';

    if (!code || !stateRaw) {
      return res.redirect(failRedirect('missing_code_or_state', '/creator-profile'));
    }

    const state = parseInstagramOAuthState(stateRaw);
    const creatorId = state.creatorId;
    const returnPath = sanitizeReturnPath(state.returnTo);

    const tokenData = await exchangeCodeForTokens(code);
    let account: any = null;
    let summary: any = null;

    try {
      account = await resolveInstagramBusinessAccount(tokenData.userAccessToken);
      summary = await fetchInstagramPerformanceSummary(
        account.igUserId,
        account.pageAccessToken,
        account.followersCount
      );
    } catch (partialError: any) {
      console.warn('[InstagramOAuth] Limited connection (no insights/page permissions yet):', partialError?.message || partialError);
    }

    await supabase
      .from('instagram_connections')
      .upsert(
        {
          creator_id: creatorId,
          meta_user_access_token: tokenData.userAccessToken,
          user_token_expires_at: tokenData.userExpiresAt,
          page_id: account?.pageId || null,
          page_access_token: account?.pageAccessToken || null,
          ig_user_id: account?.igUserId || null,
          ig_username: account?.igUsername || null,
          updated_at: new Date().toISOString(),
          connected_at: new Date().toISOString(),
        } as any,
        { onConflict: 'creator_id' }
      );

    if (account && summary) {
      await supabase
        .from('instagram_performance_snapshots')
        .insert({
          creator_id: creatorId,
          ig_user_id: account.igUserId,
          ig_username: account.igUsername,
          followers_count: account.followersCount,
          engagement_rate: summary.engagementRate,
          median_reel_views: summary.medianReelViews,
          avg_likes: summary.avgLikes,
          avg_comments: summary.avgComments,
          avg_saves: summary.avgSaves,
          avg_shares: summary.avgShares,
          sample_size: summary.sampleSize,
          data_quality: summary.dataQuality,
          raw: { media: summary.media },
        } as any);

      await supabase
        .from('profiles')
        .update({
          instagram_handle: account.igUsername,
          username: account.igUsername,
          instagram_followers: account.followersCount,
          instagram_profile_photo: account.profilePhoto,
          last_instagram_sync: new Date().toISOString(),
        } as any)
        .eq('id', creatorId);
    }

    const successUrl = account?.igUsername
      ? `${frontendBase}${returnPath}?instagram_connect=success&instagram_username=${encodeURIComponent(account.igUsername)}`
      : `${frontendBase}${returnPath}?instagram_connect=limited`;
    return res.redirect(successUrl);
  } catch (error: any) {
    console.error('[InstagramOAuth] callback error:', error);
    const rawState = typeof req.query.state === 'string' ? req.query.state : '';
    let returnPath = '/creator-profile';
    try {
      if (rawState) {
        const parsed = parseInstagramOAuthState(rawState);
        returnPath = sanitizeReturnPath(parsed.returnTo);
      }
    } catch {
      // noop
    }
    return res.redirect(failRedirect(error?.message || 'oauth_failed', returnPath));
  }
});

router.post('/insights/sync', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const creatorId = req.user?.id;
    if (!creatorId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { data: conn } = await supabase
      .from('instagram_connections')
      .select('page_id, page_access_token, ig_user_id, ig_username')
      .eq('creator_id', creatorId)
      .maybeSingle();

    if (!conn?.ig_user_id || !conn?.page_access_token) {
      return res.status(404).json({ success: false, error: 'Instagram not connected' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('instagram_followers')
      .eq('id', creatorId)
      .maybeSingle();

    const summary = await fetchInstagramPerformanceSummary(
      conn.ig_user_id,
      conn.page_access_token,
      (profile as any)?.instagram_followers || null
    );

    await supabase
      .from('instagram_performance_snapshots')
      .insert({
        creator_id: creatorId,
        ig_user_id: conn.ig_user_id,
        ig_username: conn.ig_username,
        followers_count: (profile as any)?.instagram_followers || null,
        engagement_rate: summary.engagementRate,
        median_reel_views: summary.medianReelViews,
        avg_likes: summary.avgLikes,
        avg_comments: summary.avgComments,
        avg_saves: summary.avgSaves,
        avg_shares: summary.avgShares,
        sample_size: summary.sampleSize,
        data_quality: summary.dataQuality,
        raw: { media: summary.media },
      } as any);

    return res.json({
      success: true,
      summary: {
        engagement_rate: summary.engagementRate,
        median_reel_views: summary.medianReelViews,
        avg_likes: summary.avgLikes,
        avg_comments: summary.avgComments,
        avg_saves: summary.avgSaves,
        avg_shares: summary.avgShares,
        sample_size: summary.sampleSize,
        data_quality: summary.dataQuality,
      },
    });
  } catch (error: any) {
    console.error('[InstagramOAuth] insights/sync error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to sync insights' });
  }
});

export default router;
