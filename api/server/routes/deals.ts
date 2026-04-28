// @ts-nocheck
// Deals API Routes
// Handles deal-related operations like logging reminders and delivery details (barter)

import { Router, Response } from 'express';
import { supabase } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';
import multer from 'multer';
import { generateContractFromScratch } from '../services/contractGenerator';
import { createContractReadyToken } from '../services/contractReadyTokenService';
import { sendCollabRequestAcceptedEmail } from '../services/collabRequestEmailService';
import { createShippingToken } from '../services/shippingTokenService';
import { sendBrandShippingUpdateEmail, sendBrandShippingIssueEmail } from '../services/shippingEmailService';

const normalizeStatus = (raw: any) =>
  String(raw || '')
    .trim()
    .toUpperCase()
    .replaceAll(' ', '_')
    .replaceAll('-', '_');

const inferRequiresPayment = (deal: any) => {
  const kind = String(deal?.collab_type || deal?.deal_type || '').trim().toLowerCase();
  const amount = Number(deal?.deal_amount || deal?.exact_budget || 0);
  // Prefer numeric amount when available; schemas vary across environments.
  if (Number.isFinite(amount) && amount > 0) return true;
  if (!kind) return false;
  return kind === 'paid' || kind === 'both' || kind === 'hybrid' || kind === 'paid_barter';
};

// Helper: determine if a deal is barter-type (requires shipping/product delivery)
const isBarterType = (deal: any): boolean => {
  if (!deal) return false;
  // Flags take precedence
  if (typeof deal.requires_shipping === 'boolean') return deal.requires_shipping;
  if (typeof deal.shipping_required === 'boolean') return deal.shipping_required;
  // Infer from type
  const type = String(deal?.deal_type || '').toLowerCase();
  return type === 'barter';
};

// Helper: determine if a deal is paid-type (requires monetary payment)
const isPaidType = (deal: any): boolean => {
  if (!deal) return false;
  const type = String(deal?.deal_type || '').toLowerCase();
  const amount = Number(deal?.deal_amount || 0);
  if (amount > 0) return true;
  return type === 'paid' || type.includes('paid');
};

// Helper: delegate generic push to Render server
async function sendGenericPushViaRender(params: {
  creatorId: string;
  title: string;
  body: string;
  url: string;
  data?: any;
}): Promise<void> {
  const renderUrl = 'https://creatorarmour-api.onrender.com/api/push/notify-generic';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  try {
    const resp = await fetch(renderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(params),
    });
    const data = await resp.json() as any;
    if (data.sent) {
      console.log(`[Deals] ✅ Generic push sent to creator ${params.creatorId}: ${params.title}`);
    } else {
      console.warn(`[Deals] Generic push not delivered to ${params.creatorId}:`, data);
    }
  } catch (err) {
    console.error('[Deals] Failed to call Render generic push endpoint (non-fatal):', err);
  }
}

const router = Router();

/** Mask phone for contract PDF: 98XXXXXX21 (first 2 + last 2 visible) */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return 'XXXXXXXXXX';
  return digits.slice(0, 2) + 'XXXXXX' + digits.slice(-2);
}

// Multer configuration for signed contract uploads (in-memory, PDF only, max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// POST /api/deals/log-share
// Log a brand message share
router.post('/log-share', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dealId, message, metadata } = req.body;

    // Validate required fields
    if (!dealId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: dealId, message'
      });
    }

    // Verify deal exists and user has access
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    // Verify user has access
    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Log to deal_action_logs
    const { data: logEntry, error: logError } = await supabase
      .from('deal_action_logs')
      .insert({
        deal_id: dealId,
        user_id: userId,
        event: 'BRAND_MESSAGE_SHARED',
        metadata: {
          channel: metadata?.channel || 'share',
          method: metadata?.method || 'unknown',
          message: message,
          timestamp: metadata?.timestamp || new Date().toISOString(),
        }
      })
      .select()
      .single();

    if (logError) {
      console.error('[Deals] Failed to log share:', logError);
      // Don't fail the request if logging fails
    }

    // Update brand_response_status to 'pending' and deal status to 'Sent' ONLY if not already accepted_verified
    // Once accepted_verified, status should never be reset
    const { data: currentDeal } = await supabase
      .from('brand_deals')
      .select('brand_response_status')
      .eq('id', dealId)
      .single();

    // Don't reset status if already accepted_verified (final state)
    if (currentDeal?.brand_response_status === 'accepted_verified') {
      // Only update updated_at, don't change status
      const { error: updateError } = await supabase
        .from('brand_deals')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      if (updateError) {
        console.error('[Deals] Failed to update deal timestamp:', updateError);
      }
    } else {
      // Safe to update status for non-final states
      const { error: updateError } = await supabase
        .from('brand_deals')
        .update({
          brand_response_status: 'pending',
          status: 'Sent',
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      if (updateError) {
        console.error('[Deals] Failed to update deal status:', updateError);
      }
    }

    if (updateError) {
      console.error('[Deals] Failed to update deal status:', updateError);
      // Don't fail the request if update fails
    }

    return res.json({
      success: true,
      message: 'Share logged successfully',
      data: logEntry
    });

  } catch (error: any) {
    console.error('[Deals] Log share error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/deals/mine
// Creator-facing deals list used by the mobile dashboard.
// Note: This file is mounted behind authMiddleware at /api/deals.
router.get('/mine', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = String(req.user?.role || '').toLowerCase();

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (role !== 'creator' && role !== 'admin' && role !== 'client') {
      return res.status(403).json({ success: false, error: 'Creator access required' });
    }

    const { data: deals, error } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('creator_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[Deals] mine query error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch deals' });
    }

    const rows = (deals || []) as any[];

    // Hardening: ensure creator dashboard never receives deals with 0/invalid amount.
    // Mirror the filtering behavior from server/src/routes/deals.ts for consistency.
    const needsAmountFix = rows.filter((d) => {
      const amt = Number((d as any)?.deal_amount || 0);
      const collabLike = String((d as any)?.collab_type || (d as any)?.deal_type || '').toLowerCase();
      return (!Number.isFinite(amt) || amt <= 0) && !!String((d as any)?.collab_request_id || '').trim() && (collabLike.includes('barter') || collabLike.includes('hybrid') || collabLike.includes('both'));
    });

    if (needsAmountFix.length > 0) {
      const ids = Array.from(new Set(needsAmountFix.map((d) => String((d as any).collab_request_id)).filter(Boolean)));
      try {
        const { data: requests } = await (supabase as any)
          .from('collab_requests')
          .select('id, exact_budget, barter_value, collab_type')
          .in('id', ids);

        const byId = new Map<string, any>();
        for (const r of (requests || []) as any[]) byId.set(String(r.id), r);

        for (const d of rows) {
          const id = String((d as any)?.collab_request_id || '').trim();
          if (!id) continue;
          const r = byId.get(id);
          if (!r) continue;
          const exact = r.exact_budget != null ? Number(r.exact_budget) : null;
          const barter = r.barter_value != null ? Number(r.barter_value) : null;
          const computed = exact && exact > 0 ? exact : barter && barter > 0 ? barter : null;
          if (computed && computed > 0) (d as any).deal_amount = computed;
        }
      } catch {
        // ignore lookup failures; we'll filter invalid items below.
      }
    }

    const sanitized = rows.filter((d) => {
      const brand = String((d as any)?.brand_name || '').trim();
      const amt = Number((d as any)?.deal_amount || 0);
      return !!brand && Number.isFinite(amt) && amt > 0;
    });

    return res.json({ success: true, deals: sanitized });
  } catch (error: any) {
    console.error('[Deals] mine error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

// PATCH /api/deals/:id/confirm-payment-received
// Creator confirms payment was received after brand marks it sent.
router.patch('/:id/confirm-payment-received', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = String(req.params.id || '').trim();
    const userId = req.user?.id;
    const role = String(req.user?.role || '').toLowerCase();

    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
    if (role !== 'creator' && role !== 'admin' && role !== 'client') {
      return res.status(403).json({ success: false, error: 'Creator access required' });
    }

    const { data: deal, error: dealErr } = await supabase
      .from('brand_deals')
      .select('id, status, creator_id, payment_released_at, payment_received_date')
      .eq('id', dealId)
      .maybeSingle();
    if (dealErr || !deal) return res.status(404).json({ success: false, error: 'Deal not found' });

    if (role !== 'admin' && String((deal as any).creator_id || '') !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const current = String((deal as any).status || '').trim().toUpperCase().replaceAll(' ', '_');
    if (current !== 'PAYMENT_RELEASED') {
      return res.status(409).json({ success: false, error: `Payment can be confirmed only after brand releases it. Current: ${current || 'UNKNOWN'}.` });
    }

    const now = new Date().toISOString();
    const { error: updErr } = await supabase
      .from('brand_deals')
      .update({ status: 'PAYMENT_RECEIVED', payment_received_date: now, updated_at: now } as any)
      .eq('id', dealId);
    if (updErr) throw updErr;

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'PAYMENT_CONFIRMED',
      metadata: { confirmed_at: now },
    }).then(() => {});

    return res.json({ success: true, message: 'Payment confirmed.', payment_received_date: now });
  } catch (error: any) {
    console.error('[Deals] confirm-payment-received error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

router.patch('/:id/unconfirm-payment-received', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = String(req.params.id || '').trim();
    const userId = req.user?.id;
    const role = String(req.user?.role || '').toLowerCase();

    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
    if (role !== 'creator' && role !== 'admin' && role !== 'client') {
      return res.status(403).json({ success: false, error: 'Creator access required' });
    }

    const { data: deal, error: dealErr } = await supabase
      .from('brand_deals')
      .select('id, status, creator_id')
      .eq('id', dealId)
      .maybeSingle();
    if (dealErr || !deal) return res.status(404).json({ success: false, error: 'Deal not found' });

    if (role !== 'admin' && String((deal as any).creator_id || '') !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const current = String((deal as any).status || '').trim().toUpperCase().replaceAll(' ', '_');
    if (current !== 'PAYMENT_RECEIVED') {
      return res.status(409).json({ success: false, error: `Nothing to undo. Current: ${current || 'UNKNOWN'}.` });
    }

    const now = new Date().toISOString();
    const { error: updErr } = await supabase
      .from('brand_deals')
      .update({ status: 'PAYMENT_RELEASED', payment_received_date: null, updated_at: now } as any)
      .eq('id', dealId);
    if (updErr) throw updErr;

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'PAYMENT_CONFIRM_UNDONE',
      metadata: { undone_at: now },
    }).then(() => {});

    return res.json({ success: true, message: 'Payment confirmation undone.' });
  } catch (error: any) {
    console.error('[Deals] unconfirm-payment-received error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:id/submit-content
 * Creator submits content for brand review (Instagram link, etc).
 */
router.patch('/:id/submit-content', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawId = String(req.params.id || '').trim();
    const userId = req.user?.id;
    const role = String(req.user?.role || '').toLowerCase();
    const accessToken = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();

    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
    if (role !== 'creator' && role !== 'admin' && role !== 'client') {
      return res.status(403).json({ success: false, error: 'Creator access required' });
    }

    const contentUrl = String(req.body?.contentUrl || req.body?.mainLink || '').trim();
    const messageToBrand = String(req.body?.messageToBrand || req.body?.notes || '').trim() || null;

    if (!contentUrl || !/^https?:\/\//i.test(contentUrl)) {
      return res.status(400).json({ success: false, error: 'Paste a full Instagram post or reel link' });
    }

    // Resolve deal id (some pages pass tokens/collab ids)
    const resolveDealId = async (id: string): Promise<string | null> => {
      if (!id) return null;
      const cleaned = id.trim();
      const { data: dealProbe } = await supabase.from('brand_deals').select('id').eq('id', cleaned).maybeSingle();
      if (dealProbe?.id) return String(dealProbe.id);

      const { data: collabRow } = await (supabase as any).from('collab_requests').select('deal_id').eq('id', cleaned).maybeSingle();
      if (collabRow?.deal_id) return String(collabRow.deal_id);

      const { data: submission } = await (supabase as any)
        .from('deal_details_submissions')
        .select('deal_id')
        .eq('token_id', cleaned)
        .maybeSingle();
      if (submission?.deal_id) return String(submission.deal_id);
      return null;
    };

    const dealId = await resolveDealId(rawId);
    if (!dealId) return res.status(404).json({ success: false, error: 'Deal not found' });

    // Fetch deal with all necessary columns for validation
    const { data: deal, error: dealErr } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', dealId)
      .maybeSingle();
    if (dealErr || !deal) return res.status(404).json({ success: false, error: 'Deal not found' });
    if (role !== 'admin' && String((deal as any).creator_id || '') !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const current = normalizeStatus((deal as any).status);
    const canSubmit =
      current === 'CONTENT_MAKING' ||
      current === 'DRAFTING' ||
      current === 'CONTENT_IN_PROGRESS' ||
      current === 'FULLY_EXECUTED' ||
      current === 'SIGNED' ||
      current === 'REVISION_REQUESTED';
    if (!canSubmit) {
      return res.status(409).json({ success: false, error: `Cannot submit content from status ${current || 'UNKNOWN'}.` });
    }

    // Additional guard: enforce pre-conditions based on deal type
    if (isBarterType(deal) && deal.shipping_status !== 'delivered') {
      return res.status(409).json({
        success: false,
        error: 'Cannot submit content until you have received the product. Please confirm delivery first.',
      });
    }
    if (isPaidType(deal) && !deal.payment_id && (!deal.amount_paid || deal.amount_paid <= 0)) {
      return res.status(409).json({
        success: false,
        error: 'Cannot submit content until payment is escrowed. Please wait for the brand to fund the escrow.',
      });
    }

    const now = new Date().toISOString();
    const isRevision = current === 'REVISION_REQUESTED';

    // Best-effort: new columns may not exist in older schema; fallback to status-only update.
    const fullUpdate: any = {
      status: 'Content Delivered',
      progress_percentage: 95,
      content_submission_url: contentUrl,
      content_submitted_at: now,
      message_to_brand: messageToBrand,
      updated_at: now,
    };
    const minimalUpdate: any = {
      status: 'Content Delivered',
      progress_percentage: 95,
      updated_at: now,
    };

    const { error: updErr } = await supabase.from('brand_deals').update(fullUpdate).eq('id', dealId);
    if (updErr) {
      const { error: fallbackErr } = await supabase.from('brand_deals').update(minimalUpdate).eq('id', dealId);
      if (fallbackErr) throw fallbackErr;
    }

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: isRevision ? 'REVISION_SUBMITTED' : 'CONTENT_SUBMITTED',
      metadata: {
        content_url: contentUrl,
        notes: messageToBrand,
        submitted_at: now,
      },
    }).then(() => {});

    // Non-blocking: if Render push is configured, nudge creator/brand. No-op without keys.
    if (accessToken) {
      // nothing; keep local minimal
    }

    return res.json({ success: true, message: 'Content submitted' });
  } catch (error: any) {
    console.error('[Deals] submit-content error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:id/review-content
 * Brand approves / requests changes / disputes after creator submits content.
 */
router.patch('/:id/review-content', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = String(req.params.id || '').trim();
    const userId = req.user?.id;
    const role = String(req.user?.role || '').toLowerCase();
    const userEmail = String(req.user?.email || '').toLowerCase() || null;

    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
    if (role !== 'brand' && role !== 'admin') return res.status(403).json({ success: false, error: 'Brand access required' });

    const status = String(req.body?.status || '').trim().toLowerCase();
    if (!['approved', 'changes_requested', 'disputed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid review status' });
    }

    const feedback = String(req.body?.feedback || req.body?.brandFeedback || '').trim() || null;
    const disputeNotes = String(req.body?.disputeNotes || '').trim() || null;

    const { data: deal, error: dealErr } = await supabase
      .from('brand_deals')
      .select('id, brand_id, brand_email, status, creator_id')
      .eq('id', dealId)
      .maybeSingle();
    if (dealErr || !deal) return res.status(404).json({ success: false, error: 'Deal not found' });

    const dealBrandEmail = String((deal as any).brand_email || '').toLowerCase() || null;
    const hasAccess =
      String((deal as any).brand_id || '') === String(userId) ||
      (!!userEmail && !!dealBrandEmail && userEmail === dealBrandEmail) ||
      role === 'admin';
    if (!hasAccess) return res.status(403).json({ success: false, error: 'Access denied' });

    const current = normalizeStatus((deal as any).status);
    if (current !== 'CONTENT_DELIVERED' && current !== 'CONTENT_SUBMITTED' && current !== 'REVISION_SUBMITTED' && current !== 'REVISION_DONE') {
      // Allow "review" even if schema uses string statuses.
      if (!String((deal as any).status || '').toLowerCase().includes('content')) {
        return res.status(409).json({ success: false, error: `Cannot review content from status ${current || 'UNKNOWN'}.` });
      }
    }

    const now = new Date().toISOString();
    const updateData: any = {
      updated_at: now,
      brand_approval_status: status,
    };
    if (status === 'approved') {
      updateData.status = 'CONTENT_APPROVED';
      updateData.brand_feedback = feedback;
    } else if (status === 'changes_requested') {
      updateData.status = 'REVISION_REQUESTED';
      updateData.brand_feedback = feedback;
    } else {
      updateData.status = 'DISPUTED';
      updateData.dispute_notes = disputeNotes || feedback;
    }

    const { error: updErr } = await supabase.from('brand_deals').update(updateData).eq('id', dealId);
    if (updErr) {
      // Fallback to only status if extra columns don't exist.
      const { error: fallbackErr } = await supabase.from('brand_deals').update({ status: updateData.status, updated_at: now } as any).eq('id', dealId);
      if (fallbackErr) throw fallbackErr;
    }

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: status === 'approved' ? 'CONTENT_APPROVED' : status === 'changes_requested' ? 'REVISION_REQUESTED' : 'DISPUTE_RAISED',
      metadata: { reviewed_at: now, feedback: feedback, dispute_notes: disputeNotes },
    }).then(() => {});

    return res.json({ success: true, message: 'Review saved', status });
  } catch (error: any) {
    console.error('[Deals] review-content error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:id/release-payment
 * Brand marks payment as released after content approval.
 */
router.patch('/:id/release-payment', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = String(req.params.id || '').trim();
    const userId = req.user?.id;
    const role = String(req.user?.role || '').toLowerCase();
    const userEmail = String(req.user?.email || '').toLowerCase() || null;

    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
    if (role !== 'brand' && role !== 'admin') return res.status(403).json({ success: false, error: 'Brand access required' });

    // Keep select limited to columns that exist across older schemas.
    const { data: deal, error: dealErr } = await supabase
      .from('brand_deals')
      .select('id, brand_id, brand_email, status, creator_id, deal_amount, updated_at')
      .eq('id', dealId)
      .maybeSingle();
    if (dealErr || !deal) return res.status(404).json({ success: false, error: 'Deal not found' });

    const dealBrandEmail = String((deal as any).brand_email || '').toLowerCase() || null;
    const hasAccess =
      String((deal as any).brand_id || '') === String(userId) ||
      (!!userEmail && !!dealBrandEmail && userEmail === dealBrandEmail) ||
      role === 'admin';
    if (!hasAccess) return res.status(403).json({ success: false, error: 'Access denied' });

    if (!inferRequiresPayment(deal)) {
      return res.status(409).json({ success: false, error: 'This deal does not require creator payment.' });
    }

    const current = normalizeStatus((deal as any).status);
    if (current !== 'CONTENT_APPROVED') {
      return res.status(409).json({ success: false, error: `Payment can be released only after approval. Current: ${current || 'UNKNOWN'}.` });
    }

    const paymentReference = String(req.body?.paymentReference || req.body?.utrNumber || '').trim();
    const paymentProofUrl = String(req.body?.paymentProofUrl || '').trim() || null;
    const paymentNotes = String(req.body?.paymentNotes || '').trim() || null;
    const paymentReceivedDate = String(req.body?.paymentReceivedDate || '').trim() || null;

    if (!paymentReference) {
      return res.status(400).json({ success: false, error: 'Payment reference is required before release.' });
    }

    const now = new Date().toISOString();
    const fullUpdate: any = {
      status: 'PAYMENT_RELEASED',
      payment_released_at: now,
      payment_received_date: paymentReceivedDate || null,
      utr_number: paymentReference,
      payment_proof_url: paymentProofUrl,
      payment_notes: paymentNotes,
      updated_at: now,
    };
    const minimalUpdate: any = { status: 'PAYMENT_RELEASED', payment_released_at: now, updated_at: now };

    const { error: updErr } = await supabase.from('brand_deals').update(fullUpdate).eq('id', dealId);
    if (updErr) {
      const { error: fallbackErr } = await supabase.from('brand_deals').update(minimalUpdate).eq('id', dealId);
      if (fallbackErr) throw fallbackErr;
    }

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'PAYMENT_RELEASED',
      metadata: { released_at: now, payment_reference: paymentReference, payment_proof_url: paymentProofUrl, payment_notes: paymentNotes },
    }).then(() => {});

    return res.json({ success: true, message: 'Payment released.' });
  } catch (error: any) {
    console.error('[Deals] release-payment error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

// POST /api/deals/log-reminder
// Log a brand reminder to the activity log
router.post('/log-reminder', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dealId, reminder_type, message } = req.body;

    // Validate required fields
    if (!dealId || !reminder_type || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: dealId, reminder_type, message'
      });
    }

    // Verify deal exists and user has access
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    // Verify user has access
    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Extract metadata from request body (if provided)
    const requestMetadata = req.body.metadata || {};

    // Log to deal_action_logs
    const { data: logEntry, error: logError } = await supabase
      .from('deal_action_logs')
      .insert({
        deal_id: dealId,
        user_id: userId,
        event: 'BRAND_REMINDER_SENT',
        metadata: {
          reminder_type: reminder_type,
          channel: requestMetadata.channel || (reminder_type === 'system-share' ? 'system-share' : reminder_type),
          platform: requestMetadata.platform || null,
          message: message,
          timestamp: new Date().toISOString(),
        }
      })
      .select()
      .single();

    if (logError) {
      console.error('[Deals] Failed to log reminder:', logError);
      // Don't fail the request if logging fails
    }

    // Update last_reminded_at in brand_deals
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        last_reminded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId);

    if (updateError) {
      console.error('[Deals] Failed to update last_reminded_at:', updateError);
      // Don't fail the request if update fails
    }

    return res.json({
      success: true,
      message: 'Reminder logged successfully',
      data: logEntry
    });

  } catch (error: any) {
    console.error('[Deals] Log reminder error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// POST /api/deals/:dealId/upload-signed-contract
// Phase 2: Allow creators to upload a final signed contract PDF for storage
router.post(
  '/:dealId/upload-signed-contract',
  upload.single('file'),
  async (req: AuthenticatedRequest & { file?: Express.Multer.File }, res: Response) => {
    try {
      const userId = req.user!.id;
      const { dealId } = req.params;

      if (!dealId) {
        return res.status(400).json({
          success: false,
          error: 'Deal ID is required',
        });
      }

      // Verify deal exists and belongs to current creator (or admin)
      const { data: deal, error: dealError } = await supabase
        .from('brand_deals')
        .select('id, creator_id, brand_response_status, deal_execution_status')
        .eq('id', dealId)
        .single();

      if (dealError || !deal) {
        return res.status(404).json({
          success: false,
          error: 'Deal not found',
        });
      }

      if (deal.creator_id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'You can only upload a signed contract for your own deals',
        });
      }

      // Ensure brand has fully accepted via Brand Reply flow
      if (deal.brand_response_status !== 'accepted_verified') {
        return res.status(400).json({
          success: false,
          error:
            'You can upload a signed contract after the brand has accepted the clarifications.',
        });
      }

      // Validate uploaded file
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'Signed contract PDF is required',
        });
      }

      const mime = file.mimetype || '';
      const isPdf =
        mime === 'application/pdf' ||
        mime === 'application/x-pdf' ||
        file.originalname.toLowerCase().endsWith('.pdf');

      if (!isPdf) {
        return res.status(400).json({
          success: false,
          error: 'Only PDF files are allowed for signed contracts',
        });
      }

      // Upload to Supabase Storage (signed-contracts bucket)
      const timestamp = Date.now();
      const signedPath = `signed/${dealId}/${timestamp}_signed_contract.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('signed-contracts')
        .upload(signedPath, file.buffer, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        console.error('[Deals] Signed contract upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload signed contract. Please try again.',
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from('signed-contracts')
        .getPublicUrl(signedPath);

      const signedUrl = publicUrlData?.publicUrl;
      if (!signedUrl) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate a URL for the signed contract.',
        });
      }

      // Update brand_deals with signed contract details
      const uploadedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('brand_deals')
        .update({
          signed_contract_url: signedUrl,
          signed_contract_uploaded_at: uploadedAt,
          deal_execution_status: 'signed',
          updated_at: uploadedAt,
        })
        .eq('id', dealId);

      if (updateError) {
        console.error('[Deals] Failed to update deal with signed contract:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Failed to save signed contract details.',
        });
      }

      // Log audit entry into deal_action_logs (non-blocking)
      const { error: logError } = await supabase.from('deal_action_logs').insert({
        deal_id: dealId,
        user_id: userId,
        event: 'SIGNED_CONTRACT_UPLOADED',
        metadata: {
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploaded_at: uploadedAt,
        },
      });

      if (logError) {
        console.warn('[Deals] Failed to log signed contract upload:', logError);
      }

      // Return the updated deal
      const { data: updatedDeal, error: fetchError } = await supabase
        .from('brand_deals')
        .select('*')
        .eq('id', dealId)
        .single();

      if (fetchError || !updatedDeal) {
        return res.json({
          success: true,
          message: 'Signed contract uploaded, but failed to fetch updated deal.',
        });
      }

      return res.json({
        success: true,
        message: 'Signed contract uploaded successfully',
        deal: updatedDeal,
      });
    } catch (error: any) {
      console.error('[Deals] Upload signed contract error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  }
);

// GET /api/deals/:dealId/signature/:role
// Get signature for a deal by role (brand or creator)
router.get(
  '/:dealId/signature/:role',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { dealId, role } = req.params;

      if (!dealId || !role) {
        return res.status(400).json({
          success: false,
          error: 'Deal ID and role are required',
        });
      }

      if (role !== 'brand' && role !== 'creator') {
        return res.status(400).json({
          success: false,
          error: 'Role must be "brand" or "creator"',
        });
      }

      // Verify deal exists
      const { data: deal, error: dealError } = await supabase
        .from('brand_deals')
        .select('id, creator_id')
        .eq('id', dealId)
        .single();

      if (dealError || !deal) {
        return res.status(404).json({
          success: false,
          error: 'Deal not found',
        });
      }

      // Verify user has access (creator can only view their own deals)
      if (role === 'creator' && deal.creator_id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'You can only view signatures for your own deals',
        });
      }

      // Get signature
      const { getSignature } = await import('../services/contractSigningService.js');
      const signature = await getSignature(dealId, role as 'brand' | 'creator');

      return res.json({
        success: true,
        signature: signature ? {
          id: signature.id,
          signed: signature.signed,
          signedAt: signature.signed_at,
          signerName: signature.signer_name,
          signerEmail: signature.signer_email,
        } : null,
      });
    } catch (error: any) {
      console.error('[Deals] Get signature error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  }
);

// POST /api/deals/:dealId/sign-creator (alias for sign-as-creator)
// POST /api/deals/:dealId/sign-as-creator
// Allow creators to sign contracts after brand has signed
const signAsCreatorHandler = async (req: AuthenticatedRequest, res: Response) => {
  console.log('[Deals] sign-creator route hit:', req.method, req.path, req.params);
  try {
    const userId = req.user!.id;
    const { dealId } = req.params;
    const {
      signerName,
      signerEmail,
      signerPhone,
      contractVersionId,
      contractSnapshotHtml,
      otpVerified,
      otpVerifiedAt,
    } = req.body;

    console.log('[Deals] sign-creator - userId:', userId, 'dealId:', dealId);

    if (!dealId) {
      return res.status(400).json({
        success: false,
        error: 'Deal ID is required',
      });
    }

    // Verify deal exists and belongs to current creator
    // Note: contract_version column may not exist in all databases, so we don't select it
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, contract_file_url, creator_otp_verified, creator_otp_verified_at')
      .eq('id', dealId)
      .single();

    console.log('[Deals] sign-creator - deal lookup result:', {
      dealExists: !!deal,
      dealError: dealError?.message,
      dealId: deal?.id,
      creatorId: deal?.creator_id,
      userId
    });

    if (dealError || !deal) {
      console.error('[Deals] sign-creator - Deal not found:', {
        dealError: dealError?.message,
        dealErrorCode: dealError?.code,
        dealErrorDetails: dealError?.details,
        dealId: dealId,
        hasDeal: !!deal,
        supabaseInitialized: !!supabase
      });
      return res.status(404).json({
        success: false,
        error: 'Deal not found',
        details: dealError?.message || 'No deal returned from database',
      });
    }

    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      console.log('[Deals] sign-creator - Access denied: creator_id mismatch');
      return res.status(403).json({
        success: false,
        error: 'You can only sign contracts for your own deals',
      });
    }

    // Verify creator OTP was verified
    const dealData = deal as any;
    console.log('[Deals] sign-creator - OTP check:', {
      creator_otp_verified: dealData.creator_otp_verified,
      creator_otp_verified_at: dealData.creator_otp_verified_at
    });

    if (!dealData.creator_otp_verified) {
      console.log('[Deals] sign-creator - OTP not verified, rejecting');
      return res.status(400).json({
        success: false,
        error: 'OTP verification is required before signing. Please verify your OTP first.',
      });
    }

    console.log('[Deals] sign-creator - OTP verified, proceeding with signing');

    // Get creator profile for default values
    console.log('[Deals] sign-creator - Fetching creator profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[Deals] sign-creator - Profile fetch error:', profileError);
    }

    // Get email from auth.users (email is in auth, not profiles)
    let creatorEmail: string | null = null;
    if (!signerEmail) {
      console.log('[Deals] sign-creator - Fetching email from auth.users...');
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      if (authError) {
        console.error('[Deals] sign-creator - Auth user fetch error:', authError);
      } else {
        creatorEmail = authUser?.user?.email || null;
        console.log('[Deals] sign-creator - Email from auth:', creatorEmail ? `${creatorEmail.substring(0, 3)}***` : 'not found');
      }
    }

    const finalSignerName = signerName ||
      (profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile?.first_name || 'Creator');
    const finalSignerEmail = signerEmail || creatorEmail;
    const finalSignerPhone = signerPhone || profile?.phone;

    console.log('[Deals] sign-creator - Signer info:', {
      name: finalSignerName,
      email: finalSignerEmail ? `${finalSignerEmail.substring(0, 3)}***` : 'missing',
      phone: finalSignerPhone ? 'provided' : 'missing'
    });

    if (!finalSignerEmail) {
      console.log('[Deals] sign-creator - Missing signer email, rejecting');
      return res.status(400).json({
        success: false,
        error: 'Signer email is required',
      });
    }

    // Get client info
    const { getClientIp, getDeviceInfo } = await import('../services/contractSigningService.js');
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const deviceInfo = getDeviceInfo(userAgent);

    // Sign contract as creator
    console.log('[Deals] sign-creator - Calling signContractAsCreator service...');
    const { signContractAsCreator } = await import('../services/contractSigningService.js');
    const result = await signContractAsCreator({
      dealId,
      creatorId: userId,
      signerName: finalSignerName,
      signerEmail: finalSignerEmail,
      signerPhone: finalSignerPhone,
      contractVersionId: contractVersionId || 'v3', // Default to v3 if not provided
      contractSnapshotHtml: contractSnapshotHtml ||
        (deal.contract_file_url
          ? `Contract URL: ${deal.contract_file_url}\nSigned at: ${new Date().toISOString()}`
          : undefined),
      ipAddress,
      userAgent,
      deviceInfo,
      otpVerified: true, // Already verified above
      otpVerifiedAt: otpVerifiedAt || dealData.creator_otp_verified_at || new Date().toISOString(),
    });

    if (!result.success) {
      console.error('[Deals] sign-creator - Signing failed:', result.error);
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to sign contract',
      });
    }

    console.log('[Deals] sign-creator - Contract signed successfully!');
    return res.json({
      success: true,
      message: 'Contract signed successfully',
      signature: result.signature,
    });
  } catch (error: any) {
    console.error('[Deals] Sign as creator error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

// Add both route aliases - IMPORTANT: These must be registered before any catch-all routes
router.post('/:dealId/sign-creator', signAsCreatorHandler);
router.post('/:dealId/sign-as-creator', signAsCreatorHandler);

/**
 * PATCH /api/deals/:dealId/delivery-details
 * Save delivery details for a barter deal (post-acceptance). Generates contract and sets status to Awaiting Product Shipment.
 */
router.patch('/:dealId/delivery-details', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dealId } = req.params;
    const { delivery_name, delivery_phone, delivery_address, delivery_notes } = req.body;

    if (!dealId) {
      return res.status(400).json({ success: false, error: 'Deal ID is required' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, deal_type, brand_name, brand_email, brand_address, brand_phone, deliverables, due_date, payment_expected_date')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    if (deal.creator_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    if ((deal as any).deal_type !== 'barter') {
      return res.status(400).json({ success: false, error: 'Delivery details are only for barter deals' });
    }
    // Barter: delivery_address (and name/phone) required before contract generation — validated below

    if (!delivery_name || typeof delivery_name !== 'string' || !delivery_name.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required' });
    }
    const phoneDigits = (delivery_phone || '').replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return res.status(400).json({ success: false, error: 'Phone number must be at least 10 digits' });
    }
    if (!delivery_address || typeof delivery_address !== 'string' || !delivery_address.trim()) {
      return res.status(400).json({ success: false, error: 'Delivery address is required' });
    }

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        delivery_name: delivery_name.trim(),
        delivery_phone: delivery_phone.trim(),
        delivery_address: delivery_address.trim(),
        delivery_notes: delivery_notes ? String(delivery_notes).trim() : null,
        status: 'Awaiting Product Shipment',
        shipping_required: true,
        shipping_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId);

    if (updateError) {
      console.error('[Deals] delivery-details update error:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to save delivery details' });
    }

    let contractUrl: string | null = null;
    let contractReadyToken: string | null = null;

    try {
      const { data: existingDeal } = await supabase
        .from('brand_deals')
        .select('contract_file_url')
        .eq('id', dealId)
        .single();

      if (existingDeal?.contract_file_url) {
        contractUrl = existingDeal.contract_file_url;
      } else {
        const { data: creatorProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', userId)
          .maybeSingle();

        const creatorName = creatorProfile
          ? `${(creatorProfile.first_name || '').trim()} ${(creatorProfile.last_name || '').trim()}`.trim() || delivery_name.trim()
          : delivery_name.trim();

        // Try to get email from profile, then from req.user, then from auth as last resort
        let creatorEmail = creatorProfile?.email || req.user?.email;

        if (!creatorEmail) {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(userId);
            creatorEmail = authUser?.user?.email;
          } catch (e) {
            console.error('[Deals] Failed to fetch creator email from auth:', e);
          }
        }

        creatorEmail = creatorEmail || undefined;

        let deliverablesArray: string[] = [];
        try {
          const d = deal.deliverables;
          deliverablesArray = typeof d === 'string' ? (d.includes('[') ? JSON.parse(d) : d.split(',').map((s: string) => s.trim())) : d || [];
        } catch {
          deliverablesArray = [String(deal.deliverables)];
        }
        const dueDate = deal.due_date || deal.payment_expected_date;
        const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString() : undefined;

        const maskedPhone = maskPhone(delivery_phone);
        // Barter-specific contract clauses (creator-first, plain English)
        const BARTER_DISPATCH_DAYS = 7;
        const productDeliveryTerms = [
          `1. Product Delivery: The brand must dispatch the barter product to the creator within ${BARTER_DISPATCH_DAYS} days of contract signing. A tracking ID must be shared with the creator when applicable.`,
          `2. Product Condition: The product must match the description and agreed value. The creator may reject damaged or incorrect items.`,
          `3. Delivery Confirmation: The creator confirms receipt inside the CreatorArmour dashboard. The content timeline starts only after this confirmation.`,
          `4. Non-Delivery: If the product is not delivered within the agreed timeline, the creator may cancel the collaboration and the brand loses collaboration rights under this agreement.`,
          `5. No Product, No Content: The creator is not obligated to deliver content until the product has been received and confirmed.`,
          `Delivery address: ${delivery_address.trim()}. Contact (masked): ${maskedPhone}.`,
        ].join('\n\n');

        const dealSchema = {
          deal_amount: 0,
          deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
          delivery_deadline: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          payment: { method: 'Barter', timeline: 'Product shipment within 7 days' },
          usage: { type: 'Non-exclusive', platforms: ['All platforms'], duration: '6 months', paid_ads: false, whitelisting: false },
          exclusivity: { enabled: false, category: null, duration: null },
          termination: { notice_days: 7 },
          jurisdiction_city: 'Mumbai',
        };

        // Check if we have enough information for contract generation
        const canGenerateContract =
          deal.brand_name &&
          deal.brand_email &&
          (deal as any).brand_address &&
          creatorName &&
          creatorEmail &&
          delivery_address.trim();

        if (canGenerateContract) {
          const contractResult = await generateContractFromScratch({
            brandName: deal.brand_name,
            creatorName,
            creatorEmail,
            dealAmount: 0,
            deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
            paymentTerms: 'Barter – product shipment within 7 days of acceptance.',
            dueDate: dueDateStr,
            paymentExpectedDate: dueDateStr,
            platform: 'Multiple Platforms',
            brandEmail: deal.brand_email || undefined,
            brandAddress: (deal as any).brand_address || undefined,
            brandPhone: (deal as any).brand_phone || undefined,
            creatorAddress: delivery_address.trim(),
            dealSchema,
            usageType: 'Non-exclusive',
            usagePlatforms: ['All platforms'],
            usageDuration: '6 months',
            paidAdsAllowed: false,
            whitelistingAllowed: false,
            exclusivityEnabled: false,
            exclusivityCategory: null,
            exclusivityDuration: null,
            terminationNoticeDays: 7,
            jurisdictionCity: 'Mumbai',
            additionalTerms: productDeliveryTerms,
          });

          const storagePath = `contracts/${dealId}/${Date.now()}_${contractResult.fileName}`;
          const { error: uploadError } = await supabase.storage
            .from('creator-assets')
            .upload(storagePath, contractResult.contractDocx, {
              contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              upsert: false,
            });

          if (uploadError) {
            console.error('[Deals] delivery-details contract upload error:', uploadError);
          } else {
            const { data: publicUrlData } = supabase.storage.from('creator-assets').getPublicUrl(storagePath);
            contractUrl = publicUrlData?.publicUrl || null;

            await supabase
              .from('brand_deals')
              .update({
                contract_file_url: contractUrl,
                contract_file_path: storagePath, // Use new secure path column
                updated_at: new Date().toISOString(),
              })
              .eq('id', dealId);

            const token = await createContractReadyToken({
              dealId,
              creatorId: userId,
              expiresAt: null,
            });
            contractReadyToken = token.id;

            if (deal.brand_email && contractReadyToken && contractUrl) {
              sendCollabRequestAcceptedEmail(deal.brand_email, {
                creatorName,
                brandName: deal.brand_name,
                dealAmount: 0,
                dealType: 'barter',
                deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
                contractReadyToken,
                contractUrl,
              }).catch((e) => console.error('[Deals] delivery-details acceptance email failed:', e));
            }
          }
        } else {
          console.log('[Deals] Skipping contract generation due to missing info:', {
            hasBrandName: !!deal.brand_name,
            hasBrandEmail: !!deal.brand_email,
            hasBrandAddress: !!(deal as any).brand_address,
            hasCreatorName: !!creatorName,
            hasCreatorEmail: !!creatorEmail,
            hasCreatorAddress: !!delivery_address.trim()
          });
        }

        // Barter shipping: create token and send brand "Update Shipping Details" email (link valid 14 days)
        try {
          const { token: shippingToken } = await createShippingToken({ dealId });
          const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
          const shippingLink = `${frontendUrl}/ship/${shippingToken}`;
          const productDescription = deliverablesArray.length > 0 ? deliverablesArray.join(', ') : 'Product';
          if (deal.brand_email) {
            sendBrandShippingUpdateEmail(deal.brand_email, {
              brandName: deal.brand_name,
              creatorName,
              productDescription,
              shippingLink,
            }).catch((e) => console.error('[Deals] delivery-details shipping email failed:', e));
          }
        } catch (shippingTokenErr: any) {
          console.error('[Deals] delivery-details shipping token/email error:', shippingTokenErr);
        }
      }
    } catch (contractErr: any) {
      console.error('[Deals] delivery-details contract generation error:', contractErr);
      const errorMsg = contractErr.missingFields
        ? `Missing required details for contract: ${contractErr.missingFields.join(', ')}`
        : 'Delivery details saved but contract generation failed. Brand info might be incomplete.';
      return res.status(500).json({ success: false, error: errorMsg });
    }

    return res.json({
      success: true,
      deal: { id: dealId },
      contract: contractUrl ? { url: contractUrl, token: contractReadyToken } : null,
      message: 'Delivery details saved. Contract generated.',
    });
  } catch (error: any) {
    console.error('[Deals] delivery-details error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * PATCH /api/deals/:dealId/shipping/confirm-received
 * Creator confirms barter product received (shipping_status = delivered, delivered_at = now).
 */
router.patch('/:dealId/shipping/confirm-received', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dealId } = req.params;

    if (!dealId) {
      return res.status(400).json({ success: false, error: 'Deal ID is required' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, deal_type, shipping_required, shipping_status')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    if (deal.creator_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    if ((deal as any).deal_type !== 'barter' || !(deal as any).shipping_required) {
      return res.status(400).json({ success: false, error: 'Shipping confirmation is only for barter deals with shipping' });
    }
    if ((deal as any).shipping_status !== 'shipped') {
      return res.status(400).json({ success: false, error: 'Product must be marked as shipped before confirming receipt' });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        shipping_status: 'delivered',
        delivered_at: now,
        updated_at: now,
      })
      .eq('id', dealId);

    if (updateError) {
      console.error('[Deals] shipping confirm-received update error:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to update' });
    }

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      event: 'shipping_confirmed_delivered',
      metadata: {},
    }).then(() => { }).catch((e: any) => console.warn('[Deals] shipping audit log failed:', e));

    return res.json({
      success: true,
      message: 'Product received confirmed. Deliverables timeline can now proceed.',
    });
  } catch (error: any) {
    console.error('[Deals] shipping confirm-received error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * PATCH /api/deals/:dealId/shipping/report-issue
 * Creator reports shipping issue (shipping_status = issue_reported, notify brand).
 */
router.patch('/:dealId/shipping/report-issue', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dealId } = req.params;
    const { reason } = req.body;

    if (!dealId) {
      return res.status(400).json({ success: false, error: 'Deal ID is required' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, deal_type, shipping_required, brand_name, brand_email')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    if (deal.creator_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    if ((deal as any).deal_type !== 'barter' || !(deal as any).shipping_required) {
      return res.status(400).json({ success: false, error: 'Shipping issue reporting is only for barter deals with shipping' });
    }
    const currentStatus = (deal as any).shipping_status;
    if (currentStatus === 'delivered') {
      return res.status(400).json({ success: false, error: 'Product already marked as delivered' });
    }

    const reasonStr = reason != null && typeof reason === 'string' ? reason.trim() : '';
    if (!reasonStr) {
      return res.status(400).json({ success: false, error: 'Please provide a reason for the issue' });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        shipping_status: 'issue_reported',
        shipping_issue_reason: reasonStr,
        updated_at: now,
      })
      .eq('id', dealId);

    if (updateError) {
      console.error('[Deals] shipping report-issue update error:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to update' });
    }

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      event: 'shipping_issue_reported',
      metadata: { reason: reasonStr },
    }).then(() => { }).catch((e: any) => console.warn('[Deals] shipping audit log failed:', e));

    if (deal.brand_email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .maybeSingle();
      const creatorName = profile
        ? `${(profile.first_name || '').trim()} ${(profile.last_name || '').trim()}`.trim() || 'Creator'
        : 'Creator';
      sendBrandShippingIssueEmail(deal.brand_email, {
        brandName: deal.brand_name || 'Brand',
        creatorName,
        reason: reasonStr,
      }).catch((e) => console.error('[Deals] shipping issue email failed:', e));
    }

    return res.json({
      success: true,
      message: 'Issue reported. The brand has been notified.',
    });
  } catch (error: any) {
    console.error('[Deals] shipping report-issue error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/deals/:dealId/regenerate-contract
 * Manual trigger to (re)generate the contract doc for a deal.
 * Used by the brand console "Generate contract" CTA.
 */
router.post('/:dealId/regenerate-contract', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = String(req.user?.email || '').toLowerCase();
    const { dealId } = req.params;

    if (!dealId) return res.status(400).json({ success: false, error: 'Deal ID is required' });

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) return res.status(404).json({ success: false, error: 'Deal not found' });

    const isCreatorOwner = deal.creator_id === userId;
    const isBrandOwner =
      deal.brand_id === userId ||
      (userEmail && String(deal.brand_email || '').toLowerCase() === userEmail);
    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';

    if (!isCreatorOwner && !isBrandOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Pre-checks: barter deals require delivery address before contract generation
    if (isBarterType(deal) && (!deal.delivery_address || !deal.delivery_address.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Delivery details are required before generating a contract. Please add delivery address first.',
      });
    }

    // Fetch creator profile (keep select conservative to avoid schema drift).
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, location')
      .eq('id', deal.creator_id)
      .maybeSingle();

    const creatorName = creatorProfile
      ? `${(creatorProfile.first_name || '').trim()} ${(creatorProfile.last_name || '').trim()}`.trim() || 'Creator'
      : 'Creator';

    // Creator email: prefer auth admin (service role available on server).
    let creatorEmail: string | undefined = undefined;
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(deal.creator_id);
      creatorEmail = authUser?.user?.email || undefined;
    } catch (e) {
      console.warn('[Deals] regenerate-contract: could not fetch creator email via auth.admin:', e);
      if (isCreatorOwner) creatorEmail = req.user?.email;
    }

    // Deliverables parsing.
    let deliverablesArray: string[] = [];
    try {
      const d = (deal as any).deliverables;
      if (Array.isArray(d)) deliverablesArray = d.map((v) => String(v));
      else if (typeof d === 'string') deliverablesArray = d.includes('[') ? JSON.parse(d) : d.split(',').map((s) => s.trim());
      else if (d && typeof d === 'object') deliverablesArray = Array.isArray(d) ? d : Object.values(d).map((v) => String(v));
    } catch {
      deliverablesArray = [];
    }

    const dueDateStr = deal.due_date ? new Date(deal.due_date).toLocaleDateString() : undefined;
    const paymentExpectedDateStr = deal.payment_expected_date ? new Date(deal.payment_expected_date).toLocaleDateString() : undefined;

    const contractResult = await generateContractFromScratch({
      brandName: (deal as any).brand_name || deal.brand_name || 'Brand',
      creatorName,
      creatorEmail: creatorEmail || 'creator@example.com',
      dealAmount: Number(deal.deal_amount || 0),
      deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
      paymentTerms: paymentExpectedDateStr ? `Payment by ${paymentExpectedDateStr}` : 'Within 7 days of content delivery',
      dueDate: dueDateStr,
      paymentExpectedDate: paymentExpectedDateStr,
      platform: (deal as any).platform || 'Multiple Platforms',
      brandEmail: deal.brand_email || undefined,
      // Some environments enforce address for contract generation; default to a safe placeholder
      // so the flow doesn't block on first-time brands/creators.
      brandAddress: (deal as any).brand_address || 'Mumbai, Maharashtra 400001',
      brandPhone: (deal as any).brand_phone || undefined,
      creatorAddress: creatorProfile?.location || 'Mumbai, Maharashtra 400001',
      dealSchema: {
        deal_amount: deal.deal_amount,
        deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
        delivery_deadline: deal.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment: { method: 'Bank Transfer', timeline: paymentExpectedDateStr ? `Payment by ${paymentExpectedDateStr}` : 'Within 7 days of content delivery' },
        usage: { type: 'Non-exclusive', platforms: ['All platforms'], duration: '6 months', paid_ads: false, whitelisting: false },
        exclusivity: { enabled: false, category: null, duration: null },
        termination: { notice_days: 7 },
        jurisdiction_city: 'Mumbai',
      },
      usageType: 'Non-exclusive',
      usagePlatforms: ['All platforms'],
      usageDuration: '6 months',
      paidAdsAllowed: false,
      whitelistingAllowed: false,
      exclusivityEnabled: false,
      exclusivityCategory: null,
      exclusivityDuration: null,
      terminationNoticeDays: 7,
      jurisdictionCity: 'Mumbai',
    });

    const timestamp = Date.now();
    const storagePath = `contracts/${dealId}/${timestamp}_${contractResult.fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('creator-assets')
      .upload(storagePath, contractResult.contractDocx, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from('creator-assets').getPublicUrl(storagePath);
    const contractUrl = publicUrlData?.publicUrl;
    if (!contractUrl) throw new Error('Failed to get public URL for contract');

    await supabase
      .from('brand_deals')
      .update({ contract_file_url: contractUrl, updated_at: new Date().toISOString() } as any)
      .eq('id', dealId);

    const token = await createContractReadyToken({
      dealId,
      creatorId: deal.creator_id,
      expiresAt: null,
    });

    if (deal.brand_email && token.id) {
      sendCollabRequestAcceptedEmail(deal.brand_email, {
        creatorName,
        brandName: (deal as any).brand_name || deal.brand_name,
        dealAmount: deal.deal_amount,
        dealType: (deal.deal_type as 'paid' | 'barter') || 'paid',
        deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
        contractReadyToken: token.id,
        contractUrl,
      }).catch((e) => console.error('[Deals] regenerate-contract email failed:', e));
    }

    return res.json({ success: true, contract: { url: contractUrl, token: token.id }, message: 'Contract regenerated.' });
  } catch (error: any) {
    console.error('[Deals] regenerate-contract error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// POST /api/deals/:dealId/brand-shipping-address
// Brand updates their shipping/business address for a specific deal
router.post('/:dealId/brand-shipping-address', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = String(req.user?.email || '').toLowerCase();
    const { dealId } = req.params;
    const { address, contactName, phone } = req.body;

    if (!dealId) {
      return res.status(400).json({ success: false, error: 'Deal ID is required' });
    }

    if (!address || typeof address !== 'string' || !address.trim()) {
      return res.status(400).json({ success: false, error: 'Address is required' });
    }

    // Fetch deal to verify brand ownership
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, brand_id, brand_email')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    // Verify brand ownership
    const isBrandOwner =
      deal.brand_id === userId ||
      (userEmail && String(deal.brand_email || '').toLowerCase() === userEmail);
    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';

    if (!isBrandOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Update deal with brand shipping address and contact info
    const updatePayload: any = {
      brand_address: address.trim(),
      updated_at: new Date().toISOString(),
    };

    if (contactName !== undefined && typeof contactName === 'string') {
      updatePayload.contact_person = contactName.trim();
    }
    if (phone !== undefined && typeof phone === 'string' && phone.trim()) {
      updatePayload.brand_phone = phone.trim();
    }

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update(updatePayload)
      .eq('id', dealId);

    if (updateError) {
      console.error('[Deals] brand-shipping-address update error:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to update shipping address' });
    }

    // Invalidate caches
    // (We'll rely on realtime or client-side invalidation)

    return res.json({
      success: true,
      message: 'Shipping address updated successfully',
    });
  } catch (error: any) {
    console.error('[Deals] brand-shipping-address error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// Debug route to test routing
router.get('/test-routing', (req, res) => {
  console.log('[Deals] Test routing endpoint hit');
  res.json({ success: true, message: 'Deals router is working', timestamp: new Date().toISOString() });
});

export default router;
