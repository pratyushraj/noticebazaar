// Collaboration Link Analytics API Routes
// Tracks page views and submissions, provides aggregated analytics

import express, { Request, Response } from 'express';
import { supabase, supabaseInitialized } from '../index.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * Helper: Hash IP address for privacy (first 3 octets only)
 */
function hashIp(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown';
  
  const parts = ip.split('.');
  if (parts.length >= 3) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  
  // For IPv6 or other formats, hash it
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16) + '...';
}

/**
 * Helper: Detect device type from user agent
 */
function detectDeviceType(userAgent: string | undefined): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  if (ua.includes('desktop') || ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
    return 'desktop';
  }
  return 'unknown';
}

/**
 * POST /api/collab-analytics/track
 * Track a collab link event (public, no auth required)
 */
router.post('/track', async (req: Request, res: Response) => {
  try {
    const {
      creator_username,
      event_type,
      request_id,
      utm_source,
      utm_medium,
      utm_campaign,
    } = req.body;

    // Validation
    if (!creator_username || !event_type) {
      return res.status(400).json({
        success: false,
        error: 'creator_username and event_type are required',
      });
    }

    if (!['view', 'submit'].includes(event_type)) {
      return res.status(400).json({
        success: false,
        error: 'event_type must be "view" or "submit"',
      });
    }

    // Normalize username
    const normalizedUsername = creator_username.toLowerCase().trim();
    
    console.log('[CollabAnalytics] Tracking event:', {
      event_type,
      creator_username: normalizedUsername,
      original_username: creator_username,
    });
    
    // Get creator ID - don't filter by role (some creators might not have role set)
    const { data: creator, error: creatorError } = await supabase
      .from('profiles')
      .select('id, role, username')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (creatorError) {
      console.error('[CollabAnalytics] Error looking up creator:', {
        username: normalizedUsername,
        error: creatorError,
        errorCode: creatorError.code,
        errorMessage: creatorError.message,
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to lookup creator',
        details: process.env.NODE_ENV === 'development' ? creatorError.message : undefined,
      });
    }

    if (!creator) {
      console.warn('[CollabAnalytics] Creator not found:', {
        username: normalizedUsername,
        original_username: creator_username,
      });
      
      // Try alternative lookup methods for debugging
      if (process.env.NODE_ENV === 'development') {
        const { data: allUsernames } = await supabase
          .from('profiles')
          .select('username, role')
          .limit(10);
        console.log('[CollabAnalytics] Sample usernames in database:', allUsernames);
      }
      
      return res.status(404).json({
        success: false,
        error: 'Creator not found',
        details: process.env.NODE_ENV === 'development' ? `Username: ${normalizedUsername}` : undefined,
      });
    }

    console.log('[CollabAnalytics] Creator found:', {
      creator_id: creator.id,
      username: creator.username,
      role: creator.role,
    });

    // Rate limiting: Max 10 events per IP per minute
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    const { data: recentEvents } = await supabase
      .from('collab_link_events')
      .select('id')
      .eq('creator_id', creator.id)
      .eq('ip_hash', hashIp(clientIp))
      .gte('created_at', oneMinuteAgo)
      .limit(10);

    if (recentEvents && recentEvents.length >= 10) {
      // Rate limit exceeded, but don't fail - just log
      console.log('[CollabAnalytics] Rate limit exceeded for IP:', hashIp(clientIp));
      return res.json({
        success: true,
        message: 'Event tracked (rate limited)',
      });
    }

    // Insert event
    const eventData = {
        creator_id: creator.id,
        event_type,
        request_id: request_id || null,
        device_type: detectDeviceType(userAgent),
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        ip_hash: hashIp(clientIp),
        user_agent_hash: crypto.createHash('sha256').update(userAgent).digest('hex').substring(0, 16),
    };

    const { data: insertedData, error: insertError } = await supabase
      .from('collab_link_events')
      .insert(eventData)
      .select()
      .single();

    if (insertError) {
      console.error('[CollabAnalytics] Error tracking event:', insertError);
      console.error('[CollabAnalytics] Event data:', JSON.stringify(eventData, null, 2));
      console.error('[CollabAnalytics] Creator ID:', creator.id);
      return res.status(500).json({
        success: false,
        error: 'Failed to track event',
        details: process.env.NODE_ENV === 'development' ? insertError.message : undefined,
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[CollabAnalytics] Event tracked successfully:', {
        event_type,
        creator_id: creator.id,
        inserted_id: insertedData?.id,
      });
    }

    res.json({
      success: true,
      message: 'Event tracked successfully',
    });
  } catch (error: any) {
    console.error('[CollabAnalytics] Error in POST /track:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/collab-analytics
 * Get aggregated analytics for authenticated creator
 */
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { days = '30' } = req.query;

    const daysNum = parseInt(days.toString(), 10);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({
        success: false,
        error: 'days must be between 1 and 365',
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    const startDateStr = startDate.toISOString();

    // Get all events for this creator in the timeframe
    const { data: events, error: eventsError } = await supabase
      .from('collab_link_events')
      .select('event_type, device_type, created_at, ip_hash')
      .eq('creator_id', userId)
      .gte('created_at', startDateStr)
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('[CollabAnalytics] Error fetching events:', eventsError);
      console.error('[CollabAnalytics] Error details:', JSON.stringify(eventsError, null, 2));
      console.error('[CollabAnalytics] User ID:', userId);
      console.error('[CollabAnalytics] Start date:', startDateStr);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics',
        details: process.env.NODE_ENV === 'development' ? eventsError.message : undefined,
      });
    }

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[CollabAnalytics] Fetched events:', {
        total: events?.length || 0,
        views: events?.filter(e => e.event_type === 'view').length || 0,
        submissions: events?.filter(e => e.event_type === 'submit').length || 0,
        userId,
        startDate: startDateStr,
      });
    }

    // Aggregate data
    const views = events?.filter(e => e.event_type === 'view').length || 0;
    const submissions = events?.filter(e => e.event_type === 'submit').length || 0;
    const conversionRate = views > 0 ? (submissions / views) * 100 : 0;

    // Device breakdown (only for views, not submissions)
    const viewEvents = events.filter(e => e.event_type === 'view');
    const deviceBreakdown = {
      mobile: viewEvents.filter(e => e.device_type === 'mobile').length,
      desktop: viewEvents.filter(e => e.device_type === 'desktop').length,
      tablet: viewEvents.filter(e => e.device_type === 'tablet').length,
      unknown: viewEvents.filter(e => e.device_type === 'unknown').length,
    };

    // Get comparison period (previous period of same length)
    const comparisonStartDate = new Date(startDate);
    comparisonStartDate.setDate(comparisonStartDate.getDate() - daysNum);
    const comparisonStartDateStr = comparisonStartDate.toISOString();

    const { data: comparisonEvents } = await supabase
      .from('collab_link_events')
      .select('event_type')
      .eq('creator_id', userId)
      .gte('created_at', comparisonStartDateStr)
      .lt('created_at', startDateStr);

    const comparisonViews = comparisonEvents?.filter(e => e.event_type === 'view').length || 0;
    const comparisonSubmissions = comparisonEvents?.filter(e => e.event_type === 'submit').length || 0;

    // Calculate trends
    const viewsTrend = comparisonViews > 0
      ? ((views - comparisonViews) / comparisonViews) * 100
      : views > 0 ? 100 : 0;

    const submissionsTrend = comparisonSubmissions > 0
      ? ((submissions - comparisonSubmissions) / comparisonSubmissions) * 100
      : submissions > 0 ? 100 : 0;

    // Get unique views (approximate - using IP hash)
    const uniqueViews = new Set(
      events
        .filter(e => e.event_type === 'view')
        .map(e => e.ip_hash || 'unknown')
    ).size;

    res.json({
      success: true,
      analytics: {
        period: daysNum,
        views: {
          total: views,
          unique: uniqueViews,
          trend: viewsTrend,
          trendDirection: viewsTrend >= 0 ? 'up' : 'down',
        },
        submissions: {
          total: submissions,
          trend: submissionsTrend,
          trendDirection: submissionsTrend >= 0 ? 'up' : 'down',
        },
        conversionRate: {
          value: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
          trend: comparisonViews > 0
            ? conversionRate - ((comparisonSubmissions / comparisonViews) * 100)
            : conversionRate,
          trendDirection: comparisonViews > 0
            ? (conversionRate - ((comparisonSubmissions / comparisonViews) * 100)) >= 0 ? 'up' : 'down'
            : 'neutral',
        },
        deviceBreakdown,
      },
    });
  } catch (error: any) {
    console.error('[CollabAnalytics] Error in GET /:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/collab-analytics/summary
 * Get quick summary for profile page (weekly views, total views, submissions)
 */
router.get('/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    console.log('[CollabAnalytics] GET /summary - User ID:', userId);

    // Get last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    // Get all time stats - use service role to bypass RLS
    console.log('[CollabAnalytics] Fetching events for creator_id:', userId);
    console.log('[CollabAnalytics] Supabase client initialized:', supabaseInitialized);
    
    // Try the query with explicit error handling
    let allTimeEvents: any[] | null = null;
    let allTimeError: any = null;
    
    try {
      const result = await supabase
        .from('collab_link_events')
        .select('event_type, ip_hash, created_at')
        .eq('creator_id', userId);
      
      allTimeEvents = result.data;
      allTimeError = result.error;
      
      console.log('[CollabAnalytics] Query result:', {
        hasData: !!allTimeEvents,
        dataLength: allTimeEvents?.length || 0,
        hasError: !!allTimeError,
        errorCode: allTimeError?.code,
        errorMessage: allTimeError?.message,
      });
    } catch (queryError: any) {
      console.error('[CollabAnalytics] Query exception:', queryError);
      allTimeError = queryError;
    }

    if (allTimeError) {
      console.error('[CollabAnalytics] Error fetching all-time events:', allTimeError);
      console.error('[CollabAnalytics] Error code:', allTimeError.code);
      console.error('[CollabAnalytics] Error message:', allTimeError.message);
      console.error('[CollabAnalytics] Error details:', JSON.stringify(allTimeError, null, 2));
      console.error('[CollabAnalytics] Error hint:', allTimeError.hint);
      console.error('[CollabAnalytics] User ID:', userId);
      console.error('[CollabAnalytics] Supabase initialized:', supabaseInitialized);
      
      // Return detailed error in development
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics',
        details: process.env.NODE_ENV === 'development' ? {
          message: allTimeError.message,
          code: allTimeError.code,
          hint: allTimeError.hint,
          details: allTimeError.details,
          fullError: JSON.stringify(allTimeError, null, 2),
        } : undefined,
        code: allTimeError.code,
      });
    }

    console.log('[CollabAnalytics] Fetched', allTimeEvents?.length || 0, 'events');

    // Get weekly events (last 7 days)
    const weeklyEvents = allTimeEvents?.filter(
      e => new Date(e.created_at) >= sevenDaysAgo
    ) || [];

    // Count unique weekly views (using IP hash as proxy for uniqueness)
    const weeklyUniqueViews = new Set(
      weeklyEvents
        .filter(e => e.event_type === 'view')
        .map(e => e.ip_hash || 'unknown')
    ).size;

    // Count total weekly views
    const weeklyViews = weeklyEvents.filter(e => e.event_type === 'view').length;

    // Count weekly submissions
    const weeklySubmissions = weeklyEvents.filter(e => e.event_type === 'submit').length;

    // Count all-time unique views
    const totalUniqueViews = new Set(
      allTimeEvents
        ?.filter(e => e.event_type === 'view')
        .map(e => e.ip_hash || 'unknown') || []
    ).size;

    // Count all-time total views
    const totalViews = allTimeEvents?.filter(e => e.event_type === 'view').length || 0;

    // Count all-time submissions
    const totalSubmissions = allTimeEvents?.filter(e => e.event_type === 'submit').length || 0;

    console.log('[CollabAnalytics] Summary calculated:', {
      weeklyUniqueViews,
      totalUniqueViews,
      totalSubmissions,
      weeklySubmissions,
    });

    res.json({
      success: true,
      weeklyViews: weeklyUniqueViews, // Unique views in last 7 days
      totalViews: totalUniqueViews, // All-time unique views
      submissions: totalSubmissions, // All-time submissions
      weeklySubmissions, // Submissions in last 7 days
    });
  } catch (error: any) {
    console.error('[CollabAnalytics] Error in GET /summary:', error);
    console.error('[CollabAnalytics] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;

