// @ts-nocheck
// Brand-side Collab Requests API
// Handles brand viewing + responding to their own sent offers
// Requires brand authentication

import express from 'express';
import { supabase } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendCollabRequestAcceptedEmail } from '../services/collabRequestEmailService';
import { resolveOrCreateBrandContact } from '../services/brandContactService';

const router = express.Router();

const inferPlatformFromDeliverables = (deliverables: unknown) => {
  const text = Array.isArray(deliverables)
    ? deliverables.map((item: any) => {
        if (!item) return '';
        if (typeof item === 'string') return item;
        return [item?.platform, item?.type, item?.name, item?.deliverable].filter(Boolean).join(' ');
      }).join(' ')
    : String(deliverables || '');
  const normalized = text.toLowerCase();
  if (normalized.includes('youtube') || normalized.includes('shorts')) return 'YouTube';
  if (normalized.includes('tiktok')) return 'TikTok';
  if (normalized.includes('twitter') || normalized.includes('x post')) return 'X';
  if (normalized.includes('linkedin')) return 'LinkedIn';
  if (normalized.includes('instagram') || normalized.includes('reel') || normalized.includes('story') || normalized.includes('stories')) return 'Instagram';
  return null;
};

// ============================================================================
// MIDDLEWARE: Require brand role
// ============================================================================

async function requireBrand(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  if (req.user?.role !== 'brand') {
    return res.status(403).json({ success: false, error: 'Brand account required' });
  }
  next();
}

router.use(requireBrand);

// ============================================================================
// HELPER: Find brand's brand_contact record from user email
// ============================================================================

async function getBrandContactId(email: string | undefined): Promise<string | null> {
  if (!email) return null;
  const { data } = await supabase
    .from('brand_contacts')
    .select('id')
    .ilike('email', email)
    .maybeSingle();
  return data?.id || null;
}

// ============================================================================
// GET /api/brand/collab-requests
// Brand's own sent offers (all statuses)
// ============================================================================

router.get('/', async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const brandEmail = req.user?.email;
    if (!brandEmail) {
      return res.status(401).json({ success: false, error: 'Brand email not found' });
    }

    const { status, creator_id } = req.query;

    // Fetch requests submitted by this brand (matched by email)
    let query = supabase
      .from('collab_requests')
      .select('*')
      .eq('brand_email', brandEmail.toLowerCase())
      .order('created_at', { ascending: false });

    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('[BrandCollabRequests] Fetch error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch offers' });
    }

    // Fetch creator profiles for enrichment
    const creatorIds = [...new Set((requests || []).map(r => r.creator_id).filter(Boolean))];
    let creatorProfiles: Record<string, any> = {};
    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, username, instagram_handle, avatar_url')
        .in('id', creatorIds);
      if (profiles) {
        creatorProfiles = profiles.reduce((acc: Record<string, any>, p) => {
          acc[p.id] = p;
          return acc;
        }, {});
      }
    }

    const enrichedRequests = (requests || []).map((request: any) => {
      const creator = creatorProfiles[request.creator_id];
      const creatorName = creator
        ? `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || creator.username || 'Creator'
        : 'Creator';

      let counterOffer = null;
      if (request.status === 'countered' && (request.counter_price || request.counter_notes || request.countered_at)) {
        counterOffer = {
          final_price: request.counter_price,
          deliverables: request.counter_deliverables,
          notes: request.counter_notes,
          countered_at: request.countered_at,
        };
      }

      return {
        id: request.id,
        creator_id: request.creator_id,
        creator_name: creatorName,
        creator_username: creator?.username,
        creator_instagram: creator?.instagram_handle,
        creator_avatar: creator?.avatar_url,
        brand_name: request.brand_name,
        brand_email: request.brand_email,
        collab_type: request.collab_type,
        budget_range: request.budget_range,
        exact_budget: request.exact_budget,
        barter_description: request.barter_description,
        barter_value: request.barter_value,
        deliverables: request.deliverables,
        deadline: request.deadline,
        status: request.status,
        counter_offer: counterOffer,
        deal_id: request.deal_id,
        created_at: request.created_at,
        updated_at: request.updated_at,
        accepted_at: request.accepted_at,
        countered_at: request.countered_at,
      };
    });

    res.json({ success: true, requests: enrichedRequests });
  } catch (e) {
    console.error('[BrandCollabRequests] Error:', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================================================
// GET /api/brand/collab-requests/:id
// Get single request detail
// ============================================================================

router.get('/:id', async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const brandEmail = req.user?.email;
    const requestId = typeof req.params.id === 'string' ? req.params.id.trim() : '';

    if (!brandEmail) {
      return res.status(401).json({ success: false, error: 'Brand email not found' });
    }
    if (!requestId) {
      return res.status(400).json({ success: false, error: 'Request ID required' });
    }

    const { data: request, error } = await supabase
      .from('collab_requests')
      .select('*')
      .eq('id', requestId)
      .eq('brand_email', brandEmail.toLowerCase())
      .maybeSingle();

    if (error || !request) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    // Fetch creator profile
    let creatorProfile: any = null;
    if (request.creator_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, username, instagram_handle, avatar_url')
        .eq('id', request.creator_id)
        .maybeSingle();
      creatorProfile = profile;
    }

    const creatorName = creatorProfile
      ? `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || creatorProfile.username || 'Creator'
      : 'Creator';

    let counterOffer = null;
    if (request.status === 'countered' && (request.counter_price || request.counter_notes || request.countered_at)) {
      counterOffer = {
        final_price: request.counter_price,
        deliverables: request.counter_deliverables,
        notes: request.counter_notes,
        countered_at: request.countered_at,
      };
    }

    res.json({
      success: true,
      request: {
        id: request.id,
        creator_id: request.creator_id,
        creator_name: creatorName,
        creator_username: creatorProfile?.username,
        creator_instagram: creatorProfile?.instagram_handle,
        creator_avatar: creatorProfile?.avatar_url,
        brand_name: request.brand_name,
        brand_email: request.brand_email,
        collab_type: request.collab_type,
        budget_range: request.budget_range,
        exact_budget: request.exact_budget,
        barter_description: request.barter_description,
        barter_value: request.barter_value,
        deliverables: request.deliverables,
        deadline: request.deadline,
        status: request.status,
        counter_offer: counterOffer,
        deal_id: request.deal_id,
        created_at: request.created_at,
        updated_at: request.updated_at,
        accepted_at: request.accepted_at,
        countered_at: request.countered_at,
      },
    });
  } catch (e) {
    console.error('[BrandCollabRequests] Error:', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================================================
// PATCH /api/brand/collab-requests/:id/accept-counter
// Brand accepts creator's counter offer → status becomes 'accepted'
// ============================================================================

router.patch('/:id/accept-counter', async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const brandEmail = req.user?.email;
    const requestId = typeof req.params.id === 'string' ? req.params.id.trim() : '';

    if (!brandEmail) {
      return res.status(401).json({ success: false, error: 'Brand email not found' });
    }
    if (!requestId) {
      return res.status(400).json({ success: false, error: 'Request ID required' });
    }

    // Fetch the request — must belong to this brand
    const { data: request, error: fetchError } = await supabase
      .from('collab_requests')
      .select('*')
      .eq('id', requestId)
      .eq('brand_email', brandEmail.toLowerCase())
      .maybeSingle();

    if (fetchError || !request) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    if (request.status !== 'countered') {
      return res.status(400).json({
        success: false,
        error: `Cannot accept counter — current status is '${request.status}', expected 'countered'`,
      });
    }

    const now = new Date().toISOString();
    const clientIp = req.ip || (req.socket as any)?.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    // Parse deliverables
    let deliverablesArray: string[] = [];
    try {
      deliverablesArray = typeof request.deliverables === 'string'
        ? JSON.parse(request.deliverables)
        : request.deliverables || [];
    } catch {
      deliverablesArray = [];
    }

    // Use counter price if provided, otherwise fall back to original
    const dealAmount = request.counter_price
      ?? request.exact_budget
      ?? request.barter_value
      ?? 0;

    const isBarter = request.collab_type === 'barter';
    const isHybrid = request.collab_type === 'hybrid' || request.collab_type === 'both';
    const requiresShipping = isBarter || isHybrid;

    // Create the brand deal
    const dealData: any = {
      creator_id: request.creator_id,
      brand_name: request.brand_name,
      brand_email: request.brand_email,
      deal_amount: dealAmount,
      deliverables: deliverablesArray.join(', '),
      due_date: request.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_expected_date: request.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      platform: inferPlatformFromDeliverables(request.deliverables),
      status: 'Drafting',
      deal_type: isBarter ? 'barter' : 'paid',
      created_via: 'collab_request_counter',
      collab_request_id: requestId,
      shipping_required: requiresShipping,
    };

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .insert(dealData)
      .select('id')
      .single();

    if (dealError || !deal) {
      console.error('[BrandCollabRequests] Accept counter: deal creation error:', dealError);
      return res.status(500).json({ success: false, error: 'Failed to create deal' });
    }

    // Link brand contact
    const brandContactId = await resolveOrCreateBrandContact({
      legalName: request.brand_name || '',
      email: request.brand_email || '',
      phone: request.brand_phone || null,
      website: null,
      instagram: null,
      address: request.brand_address?.trim() || null,
      gstin: request.brand_gstin?.trim().toUpperCase() || null,
    });
    if (brandContactId) {
      await supabase
        .from('brand_deals')
        .update({ brand_contact_id: brandContactId, updated_at: now })
        .eq('id', deal.id);
    }

    // Update request status to accepted
    const { error: updateError } = await supabase
      .from('collab_requests')
      .update({
        status: 'accepted',
        deal_id: deal.id,
        accepted_at: now,
        updated_at: now,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('[BrandCollabRequests] Accept counter: update error:', updateError);
    }

    // Audit log
    await supabase.from('collab_request_audit_log').insert({
      collab_request_id: requestId,
      action: 'brand_accepted_counter',
      actor_id: req.user?.id,
      auth_method: 'session',
      ip_address: clientIp,
      user_agent: userAgent,
      metadata: { counter_price: request.counter_price, deal_id: deal.id },
    }).catch(() => {});

    // Fetch creator profile for email
    let creatorName = 'Creator';
    if (request.creator_id) {
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', request.creator_id)
        .maybeSingle();
      if (creatorProfile) {
        creatorName = `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || 'Creator';
      }
    }

    // Send email to creator notifying acceptance
    if (request.brand_email) {
      sendCollabRequestAcceptedEmail(request.brand_email, {
        creatorName,
        brandName: request.brand_name,
        dealAmount,
        dealType: isBarter ? 'barter' : 'paid',
        deliverables: deliverablesArray,
        contractReadyToken: undefined,
        contractUrl: undefined,
        barterValue: requiresShipping ? dealAmount : undefined,
      }).catch((e) => console.error('[BrandCollabRequests] Accept counter: email error:', e));
    }

    res.json({
      success: true,
      deal: { id: deal.id },
      needs_delivery_details: requiresShipping,
      message: requiresShipping
        ? 'Counter accepted. Please add delivery details to generate the contract.'
        : 'Counter accepted! Deal has been created.',
    });
  } catch (e) {
    console.error('[BrandCollabRequests] Accept counter error:', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ============================================================================
// PATCH /api/brand/collab-requests/:id/decline-counter
// Brand declines creator's counter offer → status becomes 'declined'
// ============================================================================

router.patch('/:id/decline-counter', async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const brandEmail = req.user?.email;
    const requestId = typeof req.params.id === 'string' ? req.params.id.trim() : '';

    if (!brandEmail) {
      return res.status(401).json({ success: false, error: 'Brand email not found' });
    }
    if (!requestId) {
      return res.status(400).json({ success: false, error: 'Request ID required' });
    }

    const { data: request, error: fetchError } = await supabase
      .from('collab_requests')
      .select('id, brand_email, status')
      .eq('id', requestId)
      .eq('brand_email', brandEmail.toLowerCase())
      .maybeSingle();

    if (fetchError || !request) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    if (request.status !== 'countered') {
      return res.status(400).json({
        success: false,
        error: `Cannot decline — current status is '${request.status}', expected 'countered'`,
      });
    }

    const now = new Date().toISOString();
    const clientIp = req.ip || (req.socket as any)?.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    const { error: updateError } = await supabase
      .from('collab_requests')
      .update({ status: 'declined', updated_at: now })
      .eq('id', requestId);

    if (updateError) {
      console.error('[BrandCollabRequests] Decline counter error:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to decline counter offer' });
    }

    // Audit log
    await supabase.from('collab_request_audit_log').insert({
      collab_request_id: requestId,
      action: 'brand_declined_counter',
      actor_id: req.user?.id,
      auth_method: 'session',
      ip_address: clientIp,
      user_agent: userAgent,
      metadata: {},
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Counter offer declined',
    });
  } catch (e) {
    console.error('[BrandCollabRequests] Decline counter error:', e);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
