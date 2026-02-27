// @ts-nocheck
// Push subscription management routes (authenticated creator)

import express, { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  getPushRuntimeStatus,
  getCreatorPushSubscriptionStatus,
  removeCreatorPushSubscription,
  sendTestPushToCreator,
  upsertCreatorPushSubscription,
} from '../services/pushNotificationService.js';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

router.get('/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const status = await getCreatorPushSubscriptionStatus(req.user.id);
    return res.json({ success: true, ...status });
  } catch (error: any) {
    console.error('[PushNotifications] GET /status failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch push status' });
  }
});

router.get('/debug-status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const creatorId = req.user.id;
    const runtime = getPushRuntimeStatus();

    const { data: subs, error: subsError } = await supabase
      .from('creator_push_subscriptions')
      .select('id, endpoint, last_seen, user_agent, created_at')
      .eq('creator_id', creatorId)
      .order('last_seen', { ascending: false })
      .limit(10);

    const { data: requests, error: requestsError } = await supabase
      .from('collab_requests')
      .select('id, created_at, last_notified_at, brand_name, brand_email')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(10);

    return res.json({
      success: true,
      creatorId,
      runtime,
      subscriptions: {
        error: subsError?.message || null,
        count: subs?.length || 0,
        items: (subs || []).map((sub: any) => ({
          id: sub.id,
          created_at: sub.created_at,
          last_seen: sub.last_seen,
          endpoint_prefix: typeof sub.endpoint === 'string' ? sub.endpoint.slice(0, 80) : null,
          user_agent: sub.user_agent || null,
        })),
      },
      recentRequests: {
        error: requestsError?.message || null,
        count: requests?.length || 0,
        items: (requests || []).map((r: any) => ({
          id: r.id,
          created_at: r.created_at,
          last_notified_at: r.last_notified_at,
          brand_name: r.brand_name,
          brand_email: r.brand_email,
          notified: !!r.last_notified_at,
        })),
      },
    });
  } catch (error: any) {
    console.error('[PushNotifications] GET /debug-status failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch push debug status' });
  }
});

router.post('/subscribe', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const subscription = req.body?.subscription;
    if (!subscription) {
      return res.status(400).json({ success: false, error: 'subscription is required' });
    }

    await upsertCreatorPushSubscription(
      req.user.id,
      subscription,
      req.headers['user-agent'] as string | undefined
    );

    return res.json({ success: true });
  } catch (error: any) {
    console.error('[PushNotifications] POST /subscribe failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to store subscription' });
  }
});

router.post('/unsubscribe', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const endpoint = req.body?.endpoint;
    if (!endpoint) {
      return res.status(400).json({ success: false, error: 'endpoint is required' });
    }

    await removeCreatorPushSubscription(req.user.id, endpoint);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('[PushNotifications] POST /unsubscribe failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to remove subscription' });
  }
});

router.post('/test', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const result = await sendTestPushToCreator(req.user.id, {
      title: req.body?.title,
      body: req.body?.body,
      url: req.body?.url,
    });

    return res.json({
      success: result.sent,
      ...result,
      sentCount: result.delivered,
      attemptedCount: result.attempted,
      failedCount: result.failed,
    });
  } catch (error: any) {
    console.error('[PushNotifications] POST /test failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to send test push' });
  }
});

export default router;
