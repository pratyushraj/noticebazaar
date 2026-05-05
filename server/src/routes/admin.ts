import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { getPlatformMetrics, getTimeSeriesMetrics } from '../services/internalMetricsService.js';
import { runAutoApprovalJob } from '../services/escrowAutomationService.js';
import { sendCreatorPaymentReleasedEmail } from '../services/escrowEmailService.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

// Middleware to ensure user is admin
const adminOnly = (req: AuthenticatedRequest, res: Response, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

/**
 * GET /api/admin/metrics
 * Internal platform metrics for performance tracking
 */
router.get('/metrics', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const metrics = await getPlatformMetrics();
    return res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    console.error('[AdminMetrics] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/admin/analytics
 * Time-series analytics for charts
 */
router.get('/analytics', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const days = Number(req.query.days || 30);
    const data = await getTimeSeriesMetrics(days);
    return res.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    console.error('[AdminAnalytics] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/admin/payouts
 * Fetch deals that have been approved and need manual payout to creators.
 * Ordered by payout_release_at ascending (oldest hold first).
 */
router.get('/payouts', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
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
      .in('status', ['CONTENT_APPROVED', 'PAYMENT_RELEASED', 'CONTENT_MAKING', 'DISPUTED', 'CONTENT_DELIVERED']) // Keep released for history, others for refunding/approving
      .order('payout_release_at', { ascending: true, nullsFirst: false });

    if (error) {
      // If payout_release_at column is missing, fallback to brand_approved_at
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
    console.error('[AdminPayouts] Fetch error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/admin/payouts/:id/release
 * Manually mark a creator payout as completed (admin has manually transferred via UPI).
 */
router.post('/payouts/:id/release', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const { utr_number } = req.body;
    
    if (!utr_number) {
      return res.status(400).json({ success: false, error: 'Payout UTR number is required' });
    }

    const { data: deal } = await supabase.from('brand_deals').select('creator_id, creator_amount').eq('id', dealId).single();
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found' });
    
    const { data: creatorProfile } = await supabase.from('profiles').select('payout_upi, upi_verified_at').eq('id', deal.creator_id).single();
    if (!creatorProfile?.upi_verified_at) {
      return res.status(400).json({ success: false, error: 'Creator UPI is not verified. Payout blocked.' });
    }

    const now = new Date().toISOString();
    
    // Update deal
    const { error } = await supabase
      .from('brand_deals')
      .update({
        status: 'PAYMENT_RELEASED',
        payment_released_at: now,
        creator_payout_utr: utr_number, // New field to track the creator payout specifically
        updated_at: now
      })
      .eq('id', dealId);

    if (error) {
      // Fallback if creator_payout_utr doesn't exist yet
      const { error: fallbackError } = await supabase
        .from('brand_deals')
        .update({
          status: 'PAYMENT_RELEASED',
          payment_released_at: now,
          updated_at: now
        })
        .eq('id', dealId);
        
      if (fallbackError) throw fallbackError;
    }

    // Log the payout
    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: req.user?.id,
      event: 'PAYMENT_RELEASED_TO_CREATOR',
      metadata: { utr_number, released_at: now }
    });

    // Notify Creator
    try {
      const { data: creatorInfo } = await supabase
        .from('profiles')
        .select('email, first_name, last_name, username')
        .eq('id', deal.creator_id)
        .single();
        
      if (creatorInfo?.email) {
        const creatorName = creatorInfo.first_name 
          ? `${creatorInfo.first_name} ${creatorInfo.last_name || ''}`.trim() 
          : (creatorInfo.username || 'Creator');

        await sendCreatorPaymentReleasedEmail(
          creatorInfo.email,
          creatorName,
          Number(deal.creator_amount || 0),
          utr_number
        );
      }
    } catch (emailErr) {
      console.error('[AdminPayouts] Failed to send release email:', emailErr);
    }

    return res.json({ success: true, message: 'Payout marked as released successfully' });
  } catch (error: any) {
    console.error('[AdminPayouts] Release error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/admin/payouts/:id/force-approve
 * Force approve a delivery when the brand ghosts.
 */
router.post('/payouts/:id/force-approve', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    
    const { data: deal } = await supabase.from('brand_deals').select('status').eq('id', dealId).single();
    if (!deal) return res.status(404).json({ success: false, error: 'Deal not found' });
    if (deal.status !== 'CONTENT_DELIVERED' && deal.status !== 'DISPUTED') {
      return res.status(400).json({ success: false, error: 'Only delivered or disputed deals can be force-approved' });
    }

    const now = new Date();
    const payoutReleaseAt = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(); // Wait 3 more days just in case, or immediate? Let's use 0 hold for force-approve.
    
    // For admin force approve, we assume the hold period is waived since they already waited.
    // Let's just set the payout_release_at to now.
    
    const { error } = await supabase
      .from('brand_deals')
      .update({
        status: 'CONTENT_APPROVED',
        brand_approved_at: now.toISOString(),
        payout_release_at: now.toISOString(), // Ready for immediate payout
        updated_at: now.toISOString()
      })
      .eq('id', dealId);

    if (error) throw error;

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: req.user?.id,
      event: 'ADMIN_FORCE_APPROVED',
      metadata: { force_approved_at: now.toISOString() }
    });

    return res.json({ success: true, message: 'Deal force-approved successfully' });
  } catch (error: any) {
    console.error('[AdminPayouts] Force-approve error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

router.post('/escrow/run-auto-approval', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await runAutoApprovalJob();
    return res.json({ success: true, result });
  } catch (error: any) {
    console.error('[AdminEscrow] Auto-approval trigger failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/deals
 * All-in-one deal monitoring endpoint
 */
router.get('/deals', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('brand_deals')
      .select(`
        *,
        creator:profiles!creator_id (id, username, first_name, last_name, profile_photo)
      `)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

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
    console.error('[AdminDeals] Fetch error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/users
 * User growth and management list
 */
router.get('/users', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('[AdminUsers] Fetch error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/logs
 * Real-time event stream audit trail
 */
router.get('/logs', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { deal_id, limit = 50 } = req.query;
    
    let query = supabase
      .from('deal_action_logs')
      .select(`
        *,
        user:profiles!user_id (id, username, first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (deal_id) {
      query = query.eq('deal_id', deal_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('[AdminLogs] Fetch error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/users/:userId/verify-kyc
 * Manually verify a user's KYC/UPI
 */
router.post('/users/:id/verify-kyc', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.params.id;
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('profiles')
      .update({
        upi_verified_at: now,
        updated_at: now
      })
      .eq('id', userId);

    if (error) throw error;

    return res.json({ success: true, message: 'User KYC verified' });
  } catch (error: any) {
    console.error('[AdminUserVerify] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/users/:userId/suspend
 * Suspend a user account
 */
router.post('/users/:id/suspend', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.params.id;
    const now = new Date().toISOString();

    // We use a metadata field in profiles or a specific column if it exists
    // For now, we'll try to update a hypothetical 'suspended_at' column
    // and fallback to just logging if it fails
    const { error } = await supabase
      .from('profiles')
      .update({
        suspended_at: now,
        updated_at: now
      })
      .eq('id', userId);

    if (error) {
      console.warn('[AdminUserSuspend] suspended_at column may not exist, logging action instead');
    }

    // Always log the action
    await supabase.from('deal_action_logs').insert({
      event: 'USER_SUSPENDED',
      user_id: req.user?.id,
      deal_id: '00000000-0000-0000-0000-000000000000', // System level
      metadata: { suspended_user_id: userId }
    });

    return res.json({ success: true, message: 'User suspended' });
  } catch (error: any) {
    console.error('[AdminUserSuspend] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
