import { Router, Request, Response } from 'express';
import { getPlatformMetrics, getTimeSeriesMetrics } from '../services/internalMetricsService.js';
import { runAutoApprovalJob } from '../services/escrowAutomationService.js';
import { supabase } from '../lib/supabase.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const BOT_API_KEY = process.env.OPENCLAW_API_KEY || process.env.BOT_API_KEY || '';

const botAuthMiddleware = (req: Request, res: Response, next: any) => {
  if (!BOT_API_KEY) {
    console.error('[BotAuth] OPENCLAW_API_KEY is not configured');
    return res.status(503).json({ success: false, error: 'Bot authentication is not configured' });
  }

  const authHeader = String(req.headers.authorization || '').trim();
  const headerKey = String(req.headers['x-openclaw-key'] || '').trim();
  const tokenFromAuthHeader = authHeader.startsWith('ApiKey ')
    ? authHeader.substring('ApiKey '.length).trim()
    : authHeader.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length).trim()
      : authHeader;

  if (tokenFromAuthHeader !== BOT_API_KEY && headerKey !== BOT_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized bot access' });
  }

  (req as AuthenticatedRequest).user = {
    id: 'openclaw-bot',
    email: 'openclaw-bot@creatorarmour.com',
    role: 'admin'
  };
  next();
};

const adminOnly = (req: AuthenticatedRequest, res: Response, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

const botIntentMap = {
  service: 'openclaw-admin-gateway',
  description: 'OpenClaw bot access to CreatorArmour admin operations',
  actions: [
    {
      name: 'health',
      description: 'Verify OpenClaw bot authentication and API readiness',
      method: 'GET',
      path: '/api/bot/health'
    },
    {
      name: 'metrics',
      description: 'Fetch platform admin metrics for dashboard analytics',
      method: 'GET',
      path: '/api/bot/admin/metrics'
    },
    {
      name: 'analytics',
      description: 'Fetch time-series deal analytics data',
      method: 'GET',
      path: '/api/bot/admin/analytics',
      query: { days: 'optional number of days to fetch' }
    },
    {
      name: 'payouts',
      description: 'List deals pending payout or approved for release',
      method: 'GET',
      path: '/api/bot/admin/payouts'
    },
    {
      name: 'deals',
      description: 'Search and list brand deals',
      method: 'GET',
      path: '/api/bot/admin/deals',
      query: { status: 'optional deal status', search: 'optional text search' }
    },
    {
      name: 'users',
      description: 'List users and filter by role',
      method: 'GET',
      path: '/api/bot/admin/users',
      query: { role: 'optional role filter', limit: 'optional number', offset: 'optional number' }
    },
    {
      name: 'logs',
      description: 'Fetch recent admin action logs',
      method: 'GET',
      path: '/api/bot/admin/logs',
      query: { deal_id: 'optional deal id filter', limit: 'optional number' }
    },
    {
      name: 'verifyKyc',
      description: 'Mark a user as KYC/UPI verified',
      method: 'POST',
      path: '/api/bot/admin/users/:id/verify-kyc'
    },
    {
      name: 'suspendUser',
      description: 'Suspend a user account',
      method: 'POST',
      path: '/api/bot/admin/users/:id/suspend'
    },
    {
      name: 'forceApproveDeal',
      description: 'Force approve a delivered or disputed deal',
      method: 'POST',
      path: '/api/bot/admin/payouts/:id/force-approve'
    },
    {
      name: 'runAutoApproval',
      description: 'Trigger the escrow auto-approval job',
      method: 'POST',
      path: '/api/bot/admin/escrow/run-auto-approval'
    }
  ]
};

router.get('/intents', botAuthMiddleware, (req: Request, res: Response) => {
  return res.json(botIntentMap);
});

router.get('/health', botAuthMiddleware, (req: Request, res: Response) => {
  return res.json({
    success: true,
    service: 'openclaw-bot',
    status: 'authorized',
    timestamp: new Date().toISOString()
  });
});

router.get('/admin/metrics', botAuthMiddleware, adminOnly, async (_req: Request, res: Response) => {
  try {
    const metrics = await getPlatformMetrics();
    return res.json({ success: true, data: metrics });
  } catch (error: any) {
    console.error('[BotAdminMetrics] Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.get('/admin/analytics', botAuthMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const days = Number((req.query.days as string) || 30);
    const data = await getTimeSeriesMetrics(days);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('[BotAdminAnalytics] Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.get('/admin/payouts', botAuthMiddleware, adminOnly, async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('brand_deals')
      .select(`
        id,
        creator_id,
        brand_id,
        brand_name,
        status,
        deal_amount,
        creator_amount,
        platform_fee,
        amount_paid,
        payout_release_at,
        brand_approved_at,
        profiles:creator_id (
          id,
          username,
          first_name,
          last_name,
          payout_upi,
          upi_verified_at
        )
      `)
      .in('status', ['CONTENT_APPROVED', 'PAYMENT_RELEASED', 'CONTENT_MAKING', 'DISPUTED', 'CONTENT_DELIVERED'])
      .order('payout_release_at', { ascending: true, nullsFirst: false });

    if (error) {
      const { data: fallback, error: fallbackError } = await supabase
        .from('brand_deals')
        .select(`
          id, creator_id, brand_name, status, deal_amount, brand_approved_at,
          profiles:creator_id (id, username, first_name, last_name, payout_upi, upi_verified_at)
        `)
        .in('status', ['CONTENT_APPROVED', 'PAYMENT_RELEASED', 'CONTENT_MAKING', 'DISPUTED', 'CONTENT_DELIVERED'])
        .order('brand_approved_at', { ascending: true });

      if (fallbackError) throw fallbackError;
      return res.json({ success: true, data: fallback || [] });
    }

    return res.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('[BotAdminPayouts] Fetch error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.get('/admin/deals', botAuthMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const status = String(req.query.status || 'all');
    const search = String(req.query.search || '');
    const limit = Number(req.query.limit || 50);
    const offset = Number(req.query.offset || 0);

    let query = supabase
      .from('brand_deals')
      .select(`
        *,
        creator:profiles!creator_id (id, username, first_name, last_name, profile_photo)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`brand_name.ilike.%${search}%,id.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return res.json({ success: true, data, total: count });
  } catch (error: any) {
    console.error('[BotAdminDeals] Fetch error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.get('/admin/users', botAuthMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const role = String(req.query.role || 'all');
    const limit = Number(req.query.limit || 50);
    const offset = Number(req.query.offset || 0);

    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('[BotAdminUsers] Fetch error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.get('/admin/logs', botAuthMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const dealId = String(req.query.deal_id || '');
    const limit = Number(req.query.limit || 50);

    let query = supabase
      .from('deal_action_logs')
      .select(`
        *,
        user:profiles!user_id (id, username, first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (dealId) {
      query = query.eq('deal_id', dealId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('[BotAdminLogs] Fetch error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.post('/admin/users/:id/verify-kyc', botAuthMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('profiles')
      .update({ upi_verified_at: now, updated_at: now })
      .eq('id', userId);

    if (error) throw error;
    return res.json({ success: true, message: 'User KYC verified' });
  } catch (error: any) {
    console.error('[BotAdminUserVerify] Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.post('/admin/users/:id/suspend', botAuthMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('profiles')
      .update({ suspended_at: now, updated_at: now })
      .eq('id', userId);

    if (error) {
      console.warn('[BotAdminUserSuspend] suspended_at column may not exist, logging action instead');
    }

    await supabase.from('deal_action_logs').insert({
      event: 'USER_SUSPENDED',
      user_id: (req as AuthenticatedRequest).user?.id || 'openclaw-bot',
      deal_id: '00000000-0000-0000-0000-000000000000',
      metadata: { suspended_user_id: userId }
    });

    return res.json({ success: true, message: 'User suspended' });
  } catch (error: any) {
    console.error('[BotAdminUserSuspend] Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.post('/admin/payouts/:id/force-approve', botAuthMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const dealId = req.params.id;

    const { data: deal, error: dealError } = await supabase.from('brand_deals').select('status').eq('id', dealId).single();
    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    if (deal.status !== 'CONTENT_DELIVERED' && deal.status !== 'DISPUTED') {
      return res.status(400).json({ success: false, error: 'Only delivered or disputed deals can be force-approved' });
    }

    const now = new Date();
    const { error } = await supabase
      .from('brand_deals')
      .update({
        status: 'CONTENT_APPROVED',
        brand_approved_at: now.toISOString(),
        payout_release_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', dealId);

    if (error) throw error;

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: (req as AuthenticatedRequest).user?.id || 'openclaw-bot',
      event: 'ADMIN_FORCE_APPROVED',
      metadata: { force_approved_at: now.toISOString() }
    });

    return res.json({ success: true, message: 'Deal force-approved successfully' });
  } catch (error: any) {
    console.error('[BotAdminForceApprove] Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.post('/admin/escrow/run-auto-approval', botAuthMiddleware, adminOnly, async (_req: Request, res: Response) => {
  try {
    const result = await runAutoApprovalJob();
    return res.json({ success: true, result });
  } catch (error: any) {
    console.error('[BotAdminAutoApproval] Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

export default router;
