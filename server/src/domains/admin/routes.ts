/**
 * Admin Routes
 * 
 * Comprehensive admin panel endpoints for managing users, deals,
 * payments, disputes, and system operations.
 */

import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../../middleware/auth.js';
import { getSupabaseClient } from '../../shared/lib/supabase.js';
import { DealState, DealEventType } from '../deals/types/index.js';
import { DealLifecycleService, getDealLifecycleService } from '../deals/lifecycle.js';

const router = Router();

// ============================================================
// MIDDLEWARE
// ============================================================

/**
 * Middleware to ensure user is admin
 */
const adminOnly = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const supabase = getSupabaseClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }

  next();
};

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminOnly);

// ============================================================
// USER MANAGEMENT
// ============================================================

/**
 * GET /api/admin/users
 * List all users with filtering
 */
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const {
      role,
      search,
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      order = 'desc'
    } = req.query;

    let query = supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role, created_at, onboarding_complete, phone', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order(orderBy as string, { ascending: order === 'asc' })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      data,
      pagination: {
        total: count || 0,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: any) {
    console.error('[Admin] Get users error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get user details
 */
router.get('/users/:userId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseClient();

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get auth user details
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

    // Get deal stats
    const { data: deals } = await supabase
      .from('brand_deals')
      .select('id, status, deal_amount, created_at')
      .eq('creator_id', userId);

    const dealStats = {
      total: deals?.length || 0,
      completed: deals?.filter(d => d.status === 'COMPLETED').length || 0,
      totalEarnings: deals?.reduce((sum, d) => sum + (d.deal_amount || 0), 0) || 0,
    };

    return res.json({
      success: true,
      data: {
        profile,
        auth: authUser?.user ? {
          email: authUser.user.email,
          created_at: authUser.user.created_at,
          last_sign_in_at: authUser.user.last_sign_in_at,
        } : null,
        dealStats,
      },
    });
  } catch (error: any) {
    console.error('[Admin] Get user error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/admin/users/:userId
 * Update user
 */
router.patch('/users/:userId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const adminId = req.user!.id;
    const supabase = getSupabaseClient();

    // Remove sensitive fields
    delete updates.id;
    delete updates.created_at;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    // Log admin action
    await logAdminAction(supabase, {
      adminId,
      action: 'update_user',
      resourceType: 'user',
      resourceId: userId,
      metadata: { updates },
    });

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('[Admin] Update user error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/users/:userId/disable
 * Disable a user account
 */
router.post('/users/:userId/disable', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;
    const supabase = getSupabaseClient();

    // Ban the user in auth
    const { error: banError } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: '876000h', // ~100 years
    });

    if (banError) {
      return res.status(500).json({ success: false, error: banError.message });
    }

    // Log admin action
    await logAdminAction(supabase, {
      adminId,
      action: 'disable_user',
      resourceType: 'user',
      resourceId: userId,
      metadata: { reason },
    });

    return res.json({ success: true, message: 'User disabled' });
  } catch (error: any) {
    console.error('[Admin] Disable user error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/users/:userId/enable
 * Re-enable a user account
 */
router.post('/users/:userId/enable', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = req.user!.id;
    const supabase = getSupabaseClient();

    // Unban the user
    const { error: unbanError } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
    });

    if (unbanError) {
      return res.status(500).json({ success: false, error: unbanError.message });
    }

    // Log admin action
    await logAdminAction(supabase, {
      adminId,
      action: 'enable_user',
      resourceType: 'user',
      resourceId: userId,
    });

    return res.json({ success: true, message: 'User enabled' });
  } catch (error: any) {
    console.error('[Admin] Enable user error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/users/:userId/reset-onboarding
 * Reset user's onboarding status
 */
router.post('/users/:userId/reset-onboarding', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = req.user!.id;
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_complete: false,
        profile_completion: 0,
      })
      .eq('id', userId);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    // Log admin action
    await logAdminAction(supabase, {
      adminId,
      action: 'reset_onboarding',
      resourceType: 'user',
      resourceId: userId,
    });

    return res.json({ success: true, message: 'Onboarding reset' });
  } catch (error: any) {
    console.error('[Admin] Reset onboarding error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// DEAL MANAGEMENT
// ============================================================

/**
 * GET /api/admin/deals
 * List all deals with filtering
 */
router.get('/deals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const {
      state,
      creatorId,
      brandEmail,
      search,
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      order = 'desc'
    } = req.query;

    let query = supabase
      .from('brand_deals')
      .select('id, brand_name, brand_email, deal_type, deal_amount, status, current_state, created_at, creator_id, profiles(first_name, last_name, email)', { count: 'exact' });

    if (state) {
      query = query.or(`status.eq.${state},current_state.eq.${state}`);
    }

    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }

    if (brandEmail) {
      query = query.ilike('brand_email', `%${brandEmail}%`);
    }

    if (search) {
      query = query.or(`brand_name.ilike.%${search}%,brand_email.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order(orderBy as string, { ascending: order === 'asc' })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      data,
      pagination: {
        total: count || 0,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: any) {
    console.error('[Admin] Get deals error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/deals/:dealId
 * Get deal details with timeline
 */
router.get('/deals/:dealId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dealId } = req.params;
    const supabase = getSupabaseClient();

    // Get deal
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('*, profiles!creator_id(*)')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    // Get timeline
    const lifecycle = getDealLifecycleService();
    const timeline = await lifecycle.getDealTimeline(dealId);

    // Get signatures
    const { data: signatures } = await supabase
      .from('contract_signatures')
      .select('*')
      .eq('deal_id', dealId);

    return res.json({
      success: true,
      data: {
        deal,
        timeline,
        signatures: signatures || [],
      },
    });
  } catch (error: any) {
    console.error('[Admin] Get deal error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/deals/:dealId/transition
 * Manually transition deal state
 */
router.post('/deals/:dealId/transition', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dealId } = req.params;
    const { targetState, reason } = req.body;
    const adminId = req.user!.id;

    if (!Object.values(DealState).includes(targetState)) {
      return res.status(400).json({ success: false, error: 'Invalid target state' });
    }

    const lifecycle = getDealLifecycleService();
    const result = await lifecycle.forceTransition(
      dealId,
      targetState as DealState,
      adminId,
      reason || 'Admin override'
    );

    // Log admin action
    const supabase = getSupabaseClient();
    await logAdminAction(supabase, {
      adminId,
      action: 'transition_deal',
      resourceType: 'deal',
      resourceId: dealId,
      metadata: { targetState, reason, result },
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[Admin] Transition deal error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/deals/:dealId/mark-payment
 * Mark payment as sent/received
 */
router.post('/deals/:dealId/mark-payment', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dealId } = req.params;
    const { utrNumber, amount, paymentDate } = req.body;
    const adminId = req.user!.id;
    const supabase = getSupabaseClient();

    // Update deal
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        utr_number: utrNumber,
        payment_received_date: paymentDate || new Date().toISOString(),
        status: 'PAID',
        current_state: DealState.PAID,
      })
      .eq('id', dealId);

    if (updateError) {
      return res.status(500).json({ success: false, error: updateError.message });
    }

    // Create event
    await supabase.from('deal_events').insert({
      deal_id: dealId,
      event_type: 'payment_marked',
      actor_id: adminId,
      actor_role: 'admin',
      new_state: DealState.PAID,
      metadata: { utrNumber, amount, paymentDate },
    });

    // Log admin action
    await logAdminAction(supabase, {
      adminId,
      action: 'mark_payment',
      resourceType: 'deal',
      resourceId: dealId,
      metadata: { utrNumber, amount },
    });

    return res.json({ success: true, message: 'Payment marked' });
  } catch (error: any) {
    console.error('[Admin] Mark payment error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/deals/:dealId/generate-invoice
 * Trigger invoice generation
 */
router.post('/deals/:dealId/generate-invoice', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dealId } = req.params;
    const adminId = req.user!.id;

    // Queue invoice job
    const { addInvoiceJob } = await import('../../shared/lib/queue.js');
    await addInvoiceJob({ dealId });

    // Log admin action
    const supabase = getSupabaseClient();
    await logAdminAction(supabase, {
      adminId,
      action: 'generate_invoice',
      resourceType: 'deal',
      resourceId: dealId,
    });

    return res.json({ success: true, message: 'Invoice generation queued' });
  } catch (error: any) {
    console.error('[Admin] Generate invoice error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/deals/:dealId/generate-contract
 * Trigger contract regeneration
 */
router.post('/deals/:dealId/generate-contract', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dealId } = req.params;
    const adminId = req.user!.id;

    // Queue contract job
    const { addContractJob } = await import('../../shared/lib/queue.js');
    await addContractJob({ dealId });

    // Log admin action
    const supabase = getSupabaseClient();
    await logAdminAction(supabase, {
      adminId,
      action: 'generate_contract',
      resourceType: 'deal',
      resourceId: dealId,
    });

    return res.json({ success: true, message: 'Contract generation queued' });
  } catch (error: any) {
    console.error('[Admin] Generate contract error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/deals/:dealId/resolve-dispute
 * Resolve a dispute
 */
router.post('/deals/:dealId/resolve-dispute', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dealId } = req.params;
    const { resolution, targetState } = req.body;
    const adminId = req.user!.id;

    const lifecycle = getDealLifecycleService();
    const result = await lifecycle.forceTransition(
      dealId,
      targetState || DealState.COMPLETED,
      adminId,
      `Dispute resolved: ${resolution}`
    );

    // Log admin action
    const supabase = getSupabaseClient();
    await logAdminAction(supabase, {
      adminId,
      action: 'resolve_dispute',
      resourceType: 'deal',
      resourceId: dealId,
      metadata: { resolution, targetState },
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[Admin] Resolve dispute error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ANALYTICS & METRICS
// ============================================================

/**
 * GET /api/admin/metrics
 * Get platform metrics
 */
router.get('/metrics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = getSupabaseClient();

    // Get user counts
    const { data: userStats } = await supabase
      .from('profiles')
      .select('role')
      .then(({ data }) => {
        const stats = { creators: 0, brands: 0, lawyers: 0, admins: 0 };
        data?.forEach((p: any) => {
          if (p.role === 'creator') stats.creators++;
          else if (p.role === 'brand') stats.brands++;
          else if (p.role === 'lawyer') stats.lawyers++;
          else if (p.role === 'admin') stats.admins++;
        });
        return { data: stats };
      });

    // Get deal counts by state
    const { data: dealStats } = await supabase
      .from('brand_deals')
      .select('status, current_state, deal_amount')
      .then(({ data }) => {
        const stats: Record<string, { count: number; amount: number }> = {};
        data?.forEach((d: any) => {
          const state = d.current_state || d.status || 'unknown';
          if (!stats[state]) stats[state] = { count: 0, amount: 0 };
          stats[state].count++;
          stats[state].amount += d.deal_amount || 0;
        });
        return { data: stats };
      });

    // Get recent activity
    const { data: recentEvents } = await supabase
      .from('deal_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    const [{ data: creatorFunnelRows }, { data: dealMetricRows }] = await Promise.all([
      supabase.from('creator_funnel_metrics' as any).select('*'),
      supabase.from('deal_metrics' as any).select('*'),
    ]);

    const creatorFunnels = (creatorFunnelRows || []) as any[];
    const dealMetrics = (dealMetricRows || []) as any[];

    const offersSent = dealMetrics.filter((row) => row.offer_received_at).length;
    const dealsStarted = dealMetrics.filter((row) => row.deal_started_at).length;
    const dealsCompleted = dealMetrics.filter((row) => row.deal_completed_at).length;
    const totalDealValue = dealMetrics.reduce((sum, row) => sum + Number(row.deal_value || 0), 0);
    const averageDealValue = dealsStarted > 0 ? totalDealValue / dealsStarted : 0;

    const timeToFirstOfferDays = creatorFunnels
      .filter((row) => row.signed_up_at && row.first_offer_received_at)
      .map((row) => (
        (new Date(row.first_offer_received_at).getTime() - new Date(row.signed_up_at).getTime()) / (1000 * 60 * 60 * 24)
      ));
    const avgTimeToFirstOfferDays = timeToFirstOfferDays.length > 0
      ? timeToFirstOfferDays.reduce((sum, value) => sum + value, 0) / timeToFirstOfferDays.length
      : 0;

    const timeToCompleteDealDays = dealMetrics
      .filter((row) => row.deal_started_at && row.deal_completed_at)
      .map((row) => (
        (new Date(row.deal_completed_at).getTime() - new Date(row.deal_started_at).getTime()) / (1000 * 60 * 60 * 24)
      ));
    const avgTimeToCompleteDealDays = timeToCompleteDealDays.length > 0
      ? timeToCompleteDealDays.reduce((sum, value) => sum + value, 0) / timeToCompleteDealDays.length
      : 0;

    const totalCreators = Number((userStats as any)?.creators || 0);
    const totalBrands = Number((userStats as any)?.brands || 0);
    const creatorsWithDeals = creatorFunnels.filter((row) => row.first_deal_started_at).length;
    const signupToDealConversionRate = totalCreators > 0 ? creatorsWithDeals / totalCreators : 0;
    const offerToDealConversionRate = offersSent > 0 ? dealsStarted / offersSent : 0;
    const repeatCreators = creatorFunnels.filter((row) => Number(row.deals_completed_count || 0) > 1).length;

    return res.json({
      success: true,
      data: {
        users: userStats,
        deals: dealStats,
        recentEvents,
        marketplace: {
          totalCreators,
          totalBrands,
          offersSent,
          dealsStarted,
          dealsCompleted,
          totalDealValue,
          averageDealValue,
          timeToFirstOfferDays: avgTimeToFirstOfferDays,
          timeToCompleteDealDays: avgTimeToCompleteDealDays,
          creatorSignupToDealConversionRate: signupToDealConversionRate,
          offerToDealConversionRate,
          repeatCreators,
        },
      },
    });
  } catch (error: any) {
    console.error('[Admin] Get metrics error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/logs
 * Get admin action logs
 */
router.get('/logs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { limit = 100, offset = 0, action } = req.query;

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (action) {
      query = query.eq('action_type', action);
    }

    const { data, error, count } = await query
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      data,
      pagination: {
        total: count || 0,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: any) {
    console.error('[Admin] Get logs error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

interface AdminActionLog {
  adminId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
}

async function logAdminAction(
  supabase: ReturnType<typeof getSupabaseClient>,
  log: AdminActionLog
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      action_type: log.action,
      resource_type: log.resourceType,
      resource_id: log.resourceId,
      user_id: log.adminId,
      metadata: log.metadata || {},
      severity: 'info',
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Admin] Failed to log action:', error);
  }
}

export default router;
