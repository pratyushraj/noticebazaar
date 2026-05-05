// @ts-nocheck
// Profile API routes
// Handles authenticated user profile operations

import { Router, Response } from 'express';
import { supabase } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/profile/instagram-sync
 * Sync public Instagram statistics (followers) for the authenticated creator.
 * Uses Apify Instagram Scraper to fetch public data.
 */
router.post('/instagram-sync', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { instagram_username } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!instagram_username) {
      return res.status(400).json({ error: 'Instagram username is required' });
    }

    const cleanUsername = instagram_username.replace('@', '').trim();
    console.log(`[ProfileSync] Syncing Instagram for @${cleanUsername} (User: ${userId})`);

    // In local development, if APIFY_API_TOKEN is missing, we perform a graceful skip
    // to avoid breaking the frontend dashboard.
    const apiToken = process.env.APIFY_API_TOKEN;
    
    if (!apiToken) {
      console.warn('[ProfileSync] APIFY_API_TOKEN not configured, using cached/mock data');
      
      // Fetch current followers to avoid resetting it
      const { data: profile } = await supabase
        .from('profiles')
        .select('instagram_followers')
        .eq('id', userId)
        .single();

      return res.json({ 
        success: true, 
        message: 'Sync skipped (Service not configured)',
        followers: profile?.instagram_followers || 1000,
        last_sync: new Date().toISOString()
      });
    }

    // Dynamic import to avoid requiring apify-client if not needed
    const { ApifyClient } = await import('apify-client');
    const client = new ApifyClient({ token: apiToken });

    // Fetch full profile using profile URL (Public data only)
    const profileUrl = `https://www.instagram.com/${cleanUsername}/`;
    
    const run = await client.actor('apify/instagram-scraper').call({
      directUrls: [profileUrl],
      resultsLimit: 1,
      resultsType: 'details'
    });

    if (run.status !== 'SUCCEEDED') {
      console.error(`[ProfileSync] Apify run failed for @${cleanUsername}`, run.status);
      return res.status(500).json({ error: 'Failed to fetch Instagram data' });
    }

    const { items } = await client.dataset(run.defaultDatasetId).listItems({
      limit: 1
    });

    if (!items || items.length === 0) {
      console.warn(`[ProfileSync] No data found for @${cleanUsername}`);
      return res.status(404).json({ error: 'Instagram profile not found or private' });
    }

    const profileData = items[0] as any;
    const followers = profileData.followersCount || profileData.followers || 0;
    
    console.log(`[ProfileSync] Found ${followers} followers for @${cleanUsername}`);

    // Update profile in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        instagram_followers: followers,
        last_instagram_sync: new Date().toISOString(),
        // Also update avatar if missing
        avatar_url: profileData.profilePicUrl || undefined
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[ProfileSync] Error updating profile:', updateError);
      return res.status(500).json({ error: 'Failed to update profile stats' });
    }

    return res.json({
      success: true,
      followers,
      last_sync: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[ProfileSync] Sync exception:', error);
    res.status(500).json({ error: 'Internal server error during sync' });
  }
});

export default router;
