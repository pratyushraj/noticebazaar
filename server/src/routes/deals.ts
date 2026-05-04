// @ts-nocheck
// Deals API Routes
// Handles deal-related operations like logging reminders and delivery details (barter)

import { Router, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import multer from 'multer';
import { generateContractFromScratch } from '../services/contractGenerator.js';
import { sendContentDeliveredEmailToBrand } from '../services/escrowEmailService.js';
import { sendCreatorContentReviewedEmail } from '../services/creatorNotificationService.js';
import { createContractReadyToken } from '../services/contractReadyTokenService.js';
import { sendCollabRequestAcceptedEmail } from '../services/collabRequestEmailService.js';
import { createShippingToken } from '../services/shippingTokenService.js';
import { sendBrandShippingUpdateEmail, sendBrandShippingIssueEmail } from '../services/shippingEmailService.js';
import { authMiddleware } from '../middleware/auth.js';
import { signContractAsCreator, getClientIp, getDeviceInfo } from '../services/contractSigningService.js';
import { recordMarketplaceEvent } from '../shared/lib/marketplaceAnalytics.js';
import { getCreatorNotificationContent } from '../domains/deals/creatorNotificationCopy.js';
import { sendGenericPushNotificationToCreator } from '../services/pushNotificationService.js';
import { calculatePaymentBreakdown, calculatePayoutReleaseAt } from '../lib/payment.js';

const router = Router();

// Tiny in-memory cache to hide Supabase latency for dashboard bootstraps.
// TTL is intentionally short to avoid stale UX; client can still refetch anytime.
const dealsMineCache = new Map<string, { expiresAt: number; value: any }>();
const DEALS_MINE_CACHE_TTL_MS = 15_000;

function getDealsMineCache(key: string) {
  const hit = dealsMineCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    dealsMineCache.delete(key);
    return null;
  }
  return hit.value;
}

export function setDealsMineCache(key: string, value: any) {
  dealsMineCache.set(key, { expiresAt: Date.now() + DEALS_MINE_CACHE_TTL_MS, value });
}

export function invalidateDealsMineCache(key: string) {
  dealsMineCache.delete(key);
}

/** Mask phone for contract PDF: 98XXXXXX21 (first 2 + last 2 visible) */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return 'XXXXXXXXXX';
  return digits.slice(0, 2) + 'XXXXXX' + digits.slice(-2);
}

const isMissingColumnError = (err: any) => {
  const msg = String(err?.message || err?.details || err?.hint || '').toLowerCase();
  return (
    msg.includes('could not find the') ||
    msg.includes('does not exist') ||
    (msg.includes('column') && msg.includes('schema cache'))
  );
};

const normalizeStatus = (raw: any) => String(raw || '').trim().toUpperCase().replaceAll(' ', '_');
const normalizeCollabKind = (raw: any) => String(raw || '').trim().toLowerCase();
const inferRequiresPayment = (deal: any) => {
  const kind = normalizeCollabKind(deal?.collab_type || deal?.deal_type);
  if (kind === 'barter') return false;
  if (kind === 'paid' || kind === 'both' || kind === 'hybrid' || kind === 'paid_barter') return true;
  return Number(deal?.deal_amount || 0) > 0;
};
const inferRequiresShipping = (deal: any) => {
  if (typeof deal?.shipping_required === 'boolean') return deal.shipping_required;
  const kind = normalizeCollabKind(deal?.collab_type || deal?.deal_type);
  if (kind === 'barter' || kind === 'both' || kind === 'hybrid' || kind === 'paid_barter') return true;
  return false;
};

// Helper: determine if a deal is barter-type (requires shipping/product delivery)
const isBarterType = (deal: any): boolean => {
  if (!deal) return false;
  // Flags take precedence
  if (typeof deal.requires_shipping === 'boolean') return deal.requires_shipping;
  if (typeof deal.shipping_required === 'boolean') return deal.shipping_required;
  
  // Infer from type fields
  const type = String(deal?.collab_type || deal?.deal_type || '').trim().toLowerCase();
  return (
    type.includes('barter') || 
    ['both', 'hybrid', 'paid_barter', 'product_only', 'gifted', 'product'].includes(type)
  );
};

// Helper: determine if a deal is paid-type (requires monetary payment)
const isPaidType = (deal: any): boolean => {
  if (!deal) return false;
  const type = String(deal?.collab_type || deal?.deal_type || '').trim().toLowerCase();
  const amount = Number(deal?.deal_amount || deal?.exact_budget || 0);
  if (amount > 0) return true;
  return type.includes('paid') || ['both', 'hybrid', 'paid_barter'].includes(type);
};

const fetchDealForBrandMutation = async (dealId: string) => {
  const selectAttempts = [
    'id, status, brand_address, brand_phone, contact_person, brand_id, brand_email, brand_name, creator_id, deal_type, deal_amount, progress_percentage, shipping_required, payment_id, payment_status, amount_paid, creator_amount, platform_fee',
    'id, status, brand_address, brand_phone, contact_person, brand_id, brand_email, brand_name, creator_id, deal_type, deal_amount, progress_percentage, shipping_required, payment_id, payment_status',
    'id, status, brand_address, brand_phone, contact_person, brand_id, brand_email, brand_name, creator_id, deal_type, deal_amount, shipping_required, payment_id',
    'id, status, brand_address, brand_phone, contact_person, brand_id, brand_email, brand_name, creator_id, deal_type, deal_amount, progress_percentage, shipping_required',
    'id, status, brand_address, brand_phone, contact_person, brand_id, brand_email, brand_name, creator_id, deal_type, deal_amount, shipping_required',
    'id, status, brand_address, brand_phone, contact_person, brand_id, brand_email, brand_name, creator_id, deal_type, deal_amount, shipping_required',
    'id, status, brand_address, brand_phone, contact_person, brand_id, brand_email, brand_name, creator_id, deal_type, deal_amount',
    'id, status, brand_address, brand_phone, contact_person, brand_email, brand_name, creator_id, deal_type, deal_amount',
    'id, status, brand_address, brand_phone, contact_person, brand_email, brand_name, creator_id',
  ];

  let lastError: any = null;
  for (const select of selectAttempts) {
    const { data, error } = await supabase
      .from('brand_deals')
      .select(select)
      .eq('id', dealId)
      .maybeSingle();

    if (!error) {
      return { deal: data, error: null };
    }

    lastError = error;
    if (!isMissingColumnError(error)) {
      return { deal: null, error };
    }
  }

  return { deal: null, error: lastError };
};

/**
 * Minimal deal fetch for creator-side mutation guards (payment confirm, etc.)
 */
const fetchDealForCreatorMutation = async (dealId: string) => {
  const selectAttempts = [
    'id, status, creator_id, deal_type, deal_amount, brand_address, brand_name, brand_email, shipping_required, payment_released_at, payment_received_date',
    'id, status, creator_id, deal_type, deal_amount, brand_name, brand_email',
    'id, status, creator_id, deal_type, brand_name, brand_email',
    'id, status, creator_id, brand_name, brand_email',
  ];

  let lastError: any = null;
  for (const select of selectAttempts) {
    const { data, error } = await supabase
      .from('brand_deals')
      .select(select)
      .eq('id', dealId)
      .maybeSingle();

    if (!error) {
      return { deal: data, error: null };
    }

    lastError = error;
    if (!isMissingColumnError(error)) {
      return { deal: null, error };
    }
  }

  return { deal: null, error: lastError };
};

const fetchDealForViewer = async (dealId: string) => {
  const selectAttempts = [
    'id, status, creator_id, brand_id, brand_email, brand_name, brand_logo_url, deal_type, deal_amount, due_date, progress_percentage, payment_released_at, payment_received_date, utr_number, shipping_required, brand_address, brand_phone, contact_person, content_submission_url, content_url, content_notes, brand_approval_status, campaign_goal, campaign_description, campaign_category, selected_package_id, selected_package_label, selected_package_type, selected_addons, content_quantity, content_duration, content_requirements, barter_types, form_data, collab_request_id, created_at, updated_at',
    'id, status, creator_id, brand_id, brand_email, brand_name, brand_logo_url, deal_type, deal_amount, due_date, progress_percentage, payment_released_at, payment_received_date, utr_number, shipping_required, brand_address, brand_phone, contact_person, content_submission_url, content_url, content_notes, brand_approval_status, created_at, updated_at',
    'id, status, creator_id, brand_id, brand_email, brand_name, brand_logo_url, deal_type, deal_amount, due_date, payment_released_at, payment_received_date, utr_number, shipping_required, brand_address, brand_phone, contact_person, content_submission_url, content_url, content_notes, brand_approval_status, created_at, updated_at',
    'id, status, creator_id, brand_id, brand_email, brand_name, brand_logo_url, deal_type, deal_amount, due_date, payment_released_at, payment_received_date, utr_number, brand_address, brand_phone, contact_person, content_submission_url, content_url, content_notes, created_at, updated_at',
    'id, status, creator_id, brand_id, brand_email, brand_name, deal_type, deal_amount, due_date, payment_released_at, payment_received_date, utr_number, brand_address, brand_phone, contact_person, content_submission_url, content_url, content_notes, created_at, updated_at',
    'id, status, creator_id, brand_id, brand_email, brand_name, brand_logo_url, deal_type, deal_amount, due_date, brand_address, brand_phone, contact_person, created_at, updated_at',
    'id, status, creator_id, brand_id, brand_email, brand_name, deal_type, deal_amount, due_date, brand_address, brand_phone, contact_person, created_at, updated_at',
    'id, status, creator_id, brand_email, brand_name, brand_logo_url, deal_type, deal_amount, due_date, brand_address, brand_phone, contact_person, created_at, updated_at',
    'id, status, creator_id, brand_email, brand_name, deal_type, deal_amount, due_date, brand_address, brand_phone, contact_person, created_at, updated_at',
    'id, status, creator_id, brand_email, brand_name, brand_logo_url, created_at',
    'id, status, creator_id, brand_email, brand_name, created_at',
  ];

  let lastError: any = null;
  for (const select of selectAttempts) {
    const { data, error } = await supabase
      .from('brand_deals')
      .select(select)
      .eq('id', dealId)
      .maybeSingle();

    if (!error) {
      return { deal: data, error: null };
    }

    lastError = error;
    if (!isMissingColumnError(error)) {
      return { deal: null, error };
    }
  }

  return { deal: null, error: lastError };
};

const fetchDealsForCreator = async (creatorId: string, creatorEmail?: string | null) => {
  const selectAttempts = [
    { select: '*, profiles!brand_deals_brand_id_fkey(avatar_url)', canUseCreatorId: true },
    { select: '*', canUseCreatorId: true },
  ];

  for (const attempt of selectAttempts) {
    let query: any = supabase.from('brand_deals').select(attempt.select).order('created_at', { ascending: false });
    query = query.eq('creator_id', creatorId);

    const { data, error } = await query;
    if (!error) {
      const deals = (data || []).map((d: any) => {
        // Flatten brand logo if joined
        const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
        if (profile?.avatar_url && !d.brand_logo_url) {
          d.brand_logo_url = profile.avatar_url;
        }
        return d;
      });

      // Hardening: Recover missing collab links and fetch product photos.
      // Many deals have null collab_request_id or are missing product images because they are not stored in brand_deals table.
      const dealsToEnrich = deals.filter((d: any) => 
        d.collab_request_id || 
        (d.created_via === 'collab_request' && d.status !== 'Completed')
      );

      if (dealsToEnrich.length > 0) {
        const linkedIds = dealsToEnrich.map((d: any) => d.collab_request_id).filter(Boolean);
        
        try {
          // Fetch requests for linked deals
          let requests: any[] = [];
          if (linkedIds.length > 0) {
            const { data } = await supabase
              .from('collab_requests')
              .select('id, exact_budget, barter_value, barter_description, barter_product_image_url, brand_name, brand_logo_url')
              .in('id', linkedIds);
            if (data) requests = data;
          }

          // Recovery: for deals without ID, try matching by brand name
          const missingLinkDeals = dealsToEnrich.filter((d: any) => !d.collab_request_id);
          console.log(`[Deals] Enrichment: ${dealsToEnrich.length} deals to check, ${missingLinkDeals.length} missing link ID`);
          if (missingLinkDeals.length > 0) {
             const brandNames = Array.from(new Set(missingLinkDeals.map((d: any) => d.brand_name))).filter(Boolean);
             console.log(`[Deals] Enrichment: Searching requests for brands: ${brandNames.join(', ')}`);
             const { data: recovered, error: recoveredErr } = await supabase
               .from('collab_requests')
               .select('id, deal_id, exact_budget, barter_value, barter_description, barter_product_image_url, brand_name, brand_logo_url')
               .eq('creator_id', creatorId)
               .in('brand_name', brandNames)
               .order('created_at', { ascending: false });
             
             if (recoveredErr) console.error('[Deals] Enrichment: Recover error:', recoveredErr);
             if (recovered) {
               console.log(`[Deals] Enrichment: Found ${recovered.length} potential matching requests`);
               requests = [...requests, ...recovered];
             }
          }

          const requestMap = new Map<string, any>();
          const brandMap = new Map<string, any>();
          const dealIdMap = new Map<string, any>();
          
          for (const r of requests) {
            requestMap.set(String(r.id), r);
            if (r.deal_id) {
              dealIdMap.set(String(r.deal_id), r);
            }
            const brandKey = String(r.brand_name || '').trim().toLowerCase();
            if (brandKey) {
              const existing = brandMap.get(brandKey);
              // Prioritize the request that has a product image
              if (!existing || (!existing.barter_product_image_url && r.barter_product_image_url)) {
                brandMap.set(brandKey, r);
              }
            }
          }

          for (const d of deals) {
            const normalizedDealBrand = String(d.brand_name || '').trim().toLowerCase();
            const r = requestMap.get(String((d as any).collab_request_id)) || 
                      dealIdMap.get(String(d.id)) ||
                      brandMap.get(normalizedDealBrand);
            if (!r) {
              console.log(`[Deals] No request found for deal ${d.id} (Brand: ${d.brand_name}, Normalized: ${normalizedDealBrand})`);
              continue;
            }

            console.log(`[Deals] Found request ${r.id} for deal ${d.id} (Brand: ${d.brand_name}). Image: ${r.barter_product_image_url}`);

            // Fix amount if missing
            const amt = Number(d.deal_amount || 0);
            if (amt <= 0) {
              const exact = r.exact_budget != null ? Number(r.exact_budget) : null;
              const barter = r.barter_value != null ? Number(r.barter_value) : null;
              const computed = (exact && exact > 0) ? exact : (barter && barter > 0) ? barter : null;
              if (computed && computed > 0) (d as any).deal_amount = computed;
            }

            // Backfill product image
            if (!(d as any).barter_product_image_url && r.barter_product_image_url) {
              (d as any).barter_product_image_url = r.barter_product_image_url;
              (d as any).product_image = r.barter_product_image_url;
              console.log(`[Deals] Backfilled image for deal ${d.id}: ${r.barter_product_image_url}`);
            }
            
            // Backfill request id if recovered
            if (!(d as any).collab_request_id) {
              (d as any).collab_request_id = r.id;
              console.log(`[Deals] Backfilled request id for deal ${d.id}: ${r.id}`);
            }
            if (!d.brand_logo_url && r.brand_logo_url) {
              d.brand_logo_url = r.brand_logo_url;
            }
            if (!(d as any).product_name && r.barter_description) {
              (d as any).product_name = r.barter_description;
            }
          }
        } catch (enrichError) {
          console.warn('[Deals] Failed to enrich deals with request data:', enrichError);
        }
      }

      const sanitized = deals.filter((d) => {
        const brand = String((d as any)?.brand_name || '').trim();
        const amt = Number((d as any)?.deal_amount || 0);
        return !!brand && Number.isFinite(amt) && amt >= 0;
      });

      return { deals: sanitized, error: null };
    }

    if (!isMissingColumnError(error)) {
      return { deals: [], error };
    }
  }

  if (!creatorEmail) {
    return { deals: [], error: null };
  }

  return { deals: [], error: null };
};

const notifyCreatorForDealEvent = async (
  template: Parameters<typeof getCreatorNotificationContent>[0],
  deal: any,
  metadata: Record<string, any> = {}
) => {
  const creatorId = String(deal?.creator_id || '').trim();
  if (!creatorId) return;

  try {
    const notification = getCreatorNotificationContent(template, {
      id: String(deal?.id || ''),
      creator_id: creatorId,
      brand_name: String(deal?.brand_name || '').trim() || 'Brand',
      brand_email: String(deal?.brand_email || '').trim() || '',
      deal_type: deal?.deal_type || deal?.collab_type || 'paid',
      collab_type: deal?.collab_type || deal?.deal_type || 'paid',
      deal_amount: Number(deal?.deal_amount || 0),
      status: String(deal?.status || ''),
      current_state: String(deal?.status || ''),
    } as any);

    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: creatorId,
      type: notification.type,
      category: notification.category,
      title: notification.title,
      message: notification.message,
      data: {
        template,
        deal_id: deal.id,
        brand_name: deal?.brand_name || null,
        ...metadata,
      },
      link: notification.link,
      priority: notification.priority,
      icon: notification.type,
      action_label: notification.actionLabel,
      action_link: notification.actionLink,
      read: false,
    });

    if (notificationError) {
      console.warn(`[Deals] Failed to create ${template} notification:`, notificationError.message);
    }

    const pushResult = await sendGenericPushNotificationToCreator({
      creatorId,
      title: notification.title,
      body: notification.message,
      url: notification.actionLink,
      data: {
        template,
        dealId: deal.id,
        ...metadata,
      },
    });

    if (!pushResult.sent) {
      console.log(`[Deals] No push subscriptions delivered for ${template} on deal ${deal.id}`);
    }
  } catch (error: any) {
    console.warn(`[Deals] Failed to notify creator for ${template}:`, error?.message || error);
  }
};

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
      .select('id, creator_id, status, brand_response_status')
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
    let updateErrorObj: any = null;

    if (deal.brand_response_status === 'accepted_verified') {
      // Don't reset status if already accepted_verified, just update timestamp
      const { error: updateError } = await supabase
        .from('brand_deals')
        .update({
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', dealId);

      if (updateError) updateErrorObj = updateError;
    } else {
      // Safe to update status for non-final states
      const { error: updateError } = await supabase
        .from('brand_deals')
        .update({
          brand_response_status: 'pending',
          status: 'Sent',
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', dealId);

      if (updateError) updateErrorObj = updateError;
    }

    if (updateErrorObj) {
      console.error('[Deals] Failed to update deal status:', updateErrorObj);
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

// POST /api/deals/log-reminder
// Log a brand reminder to the activity log
router.post('/log-reminder', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { dealId, reminder_type, message } = req.body;

    // Validate required fields
    if (!dealId || !reminder_type || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Verify access
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Log the reminder
    const { data: logEntry, error: logError } = await supabase
      .from('deal_action_logs')
      .insert({
        deal_id: dealId,
        user_id: userId,
        event: 'BRAND_REMINDER_SENT',
        metadata: {
          type: reminder_type,
          message: message,
          timestamp: new Date().toISOString(),
        }
      })
      .select()
      .single();

    if (logError) {
      console.error('[Deals] Failed to log reminder:', logError);
      return res.status(500).json({ success: false, error: 'Failed to log reminder' });
    }

    // Update deal's last_reminded_at
    await supabase
      .from('brand_deals')
      .update({
        last_reminded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', dealId);

    return res.json({
      success: true,
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

// GET /api/deals/mine
// Lightweight creator-facing deals list fallback for older clients and route bootstraps.
router.get('/mine', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userEmail = String(req.user?.email || '').toLowerCase() || null;
    const role = String(req.user?.role || '').toLowerCase();

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (role !== 'creator' && role !== 'admin' && role !== 'client') {
      return res.status(403).json({ success: false, error: 'Creator access required' });
    }

    const cacheKey = String(userId);
    const cached = getDealsMineCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const { deals, error } = await fetchDealsForCreator(userId, userEmail);
    if (error) {
      throw error;
    }

    const payload = { success: true, deals };
    setDealsMineCache(cacheKey, payload);
    return res.json(payload);
  } catch (error: any) {
    console.error('[Deals] mine error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

// GET /api/deals/:id
// Authenticated creator/brand deal fetch used by direct route bootstraps.
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;
    const userEmail = String(req.user?.email || '').toLowerCase() || null;
    const role = String(req.user?.role || '').toLowerCase();

    if (!dealId) {
      return res.status(400).json({ success: false, error: 'Deal ID is required' });
    }
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { deal, error } = await fetchDealForViewer(dealId);
    if (error || !deal) {
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const dealBrandEmail = String((deal as any).brand_email || '').toLowerCase() || null;
    const creatorId = String((deal as any).creator_id || '');
    const brandId = String((deal as any).brand_id || '');
    const hasAccess =
      role === 'admin' ||
      creatorId === String(userId) ||
      brandId === String(userId) ||
      (!!userEmail && !!dealBrandEmail && userEmail === dealBrandEmail);

    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    return res.json({ success: true, deal });
  } catch (error: any) {
    console.error('[Deals] fetch deal error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

// POST /api/deals/:id/upload-signed-contract
// Upload a signed contract PDF
router.post('/:id/upload-signed-contract', authMiddleware, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Verify deal access
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const fileName = `signed_${timestamp}_${dealId}.pdf`;
    const filePath = `signed-contracts/${userId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('creator-assets')
      .upload(filePath, file.buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('[Deals] Storage upload error:', uploadError);
      return res.status(500).json({ success: false, error: 'Failed to upload to storage' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('creator-assets')
      .getPublicUrl(filePath);

    // Update deal record
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        status: 'Signed',
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', dealId);

    if (updateError) {
      console.error('[Deals] Database update error:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to update deal record' });
    }

    // Log action
    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'SIGNED_CONTRACT_UPLOADED',
      metadata: { file_name: fileName }
    });

    return res.json({
      success: true,
      signed_contract_url: urlData.publicUrl
    });
  } catch (error: any) {
    console.error('[Deals] Signed contract upload error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/deals/barter/delivery-details
 * For BARTER deals: creator saves brand's shipping info + generates contract.
 */
router.post('/barter/delivery-details', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      dealId,
      brandContactName,
      brandAddress,
      brandPhone,
      shippingRequired,
      barterProductValue
    } = req.body;

    if (!dealId || !brandContactName || !brandAddress) {
      return res.status(400).json({ success: false, error: 'Missing required brand details' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('*, creator:profiles!creator_id(*)')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const creator = (deal as any).creator;
    const creatorName = creator ? `${creator.first_name || ''} ${creator.last_name || ''}`.trim() : 'Creator';
    // Resolve creator address - prioritize registered_address
    let creatorAddress = (creator as any).registered_address || (creator as any).location || (creator as any).address || '';
    if (creatorAddress && (creatorAddress.trim() === '' || creatorAddress.toLowerCase() === 'n/a')) {
      creatorAddress = '';
    }

    // Resolve brand address - prioritize registered company_address if available
    let companyAddressFromTable: string | null = null;
    if (deal.brand_id) {
      const { data: brandData } = await supabase
        .from('brands')
        .select('company_address')
        .eq('external_id', deal.brand_id)
        .maybeSingle();
      companyAddressFromTable = brandData?.company_address || null;
    }
    const finalBrandAddress = brandAddress || companyAddressFromTable || undefined;

    // Try to get email from profile, then from req.user, then from auth
    let creatorEmail = creator?.email || req.user?.email || '';
    if (!creatorEmail) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        creatorEmail = authUser?.user?.email || '';
      } catch (e) {
        console.error('[Deals] Failed to fetch creator email from auth:', e);
      }
    }

    // Generate contract
    const contractResult = await generateContractFromScratch({
      brandName: deal.brand_name,
      creatorName,
      creatorEmail,
      dealAmount: 0,
      deliverables: Array.isArray(deal.deliverables) ? deal.deliverables : [String(deal.deliverables)],
      dueDate: deal.due_date,
      paymentExpectedDate: '',
      platform: deal.platform || 'Instagram',
      brandEmail: deal.brand_email || undefined,
      brandAddress: finalBrandAddress,
      brandGstin: undefined,
      creatorAddress,
      dealSchema: {
        deal_amount: 0,
        deliverables: Array.isArray(deal.deliverables) ? deal.deliverables : [String(deal.deliverables)],
        delivery_deadline: deal.due_date,
        payment: { method: 'Barter', timeline: 'Product delivery' },
        usage: { type: 'Non-exclusive', platforms: ['All'], duration: '6 months', paid_ads: false, whitelisting: false },
        exclusivity: { enabled: false, category: null, duration: null },
        termination: { notice_days: 7 },
        jurisdiction_city: 'Mumbai',
      },
      usageType: 'Non-exclusive' as any,
      usagePlatforms: ['All'],
      usageDuration: '6 months',
      paidAdsAllowed: false,
      whitelistingAllowed: false,
      exclusivityEnabled: false,
      exclusivityCategory: null,
      exclusivityDuration: null,
      terminationNoticeDays: 7,
      jurisdictionCity: 'Mumbai',
    });

    // Upload contract
    const fileName = `barter_contract_${Date.now()}_${dealId}.docx`;
    const filePath = `contracts/${userId}/${fileName}`;
    await supabase.storage.from('creator-assets').upload(filePath, contractResult.contractDocx, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const { data: urlData } = supabase.storage.from('creator-assets').getPublicUrl(filePath);

    // Update deal
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        brand_address: brandAddress,
        brand_phone: brandPhone,
        shipping_required: !!shippingRequired,
        barter_value: barterProductValue || 0,
        contract_file_url: urlData.publicUrl,
        contract_file_path: filePath, // Use new secure path column
        status: 'CONTRACT_READY',
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', dealId);

    if (updateError) throw updateError;

    // Create contract token
    const token = await createContractReadyToken({ dealId, creatorId: userId, expiresAt: null });

    // Send email to brand (if they have email)
    if (deal.brand_email) {
      sendCollabRequestAcceptedEmail(deal.brand_email, {
        creatorName,
        brandName: deal.brand_name,
        dealType: 'barter',
        deliverables: Array.isArray(deal.deliverables) ? deal.deliverables : [String(deal.deliverables)],
        contractReadyToken: token.id,
        barterValue: barterProductValue,
      }).catch(e => console.error('[Deals] barter mail failed:', e));
    }

    return res.json({ success: true, contract_url: urlData.publicUrl });
  } catch (error: any) {
    console.error('[Deals] barter delivery-details error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:dealId/delivery-details
 * Save delivery details for a barter deal (post-acceptance). Generates contract and sets status to CONTRACT_READY.
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
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    if (deal.creator_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    // Allow barter deals OR any deal explicitly flagged as shipping_required.
    // Pure paid/service deals without a physical product component are rejected.
    const isBarterDeal = normalizeCollabKind((deal as any).deal_type) === 'barter';
    const isShippingRequired = (deal as any).shipping_required === true;
    if (!isBarterDeal && !isShippingRequired) {
      return res.status(400).json({ success: false, error: 'Delivery details are only for deals that require shipping.' });
    }
    // delivery_address (and name/phone) required — validated below

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
        status: 'Drafting',
        shipping_required: true,
        shipping_status: 'pending',
        updated_at: new Date().toISOString(),
      } as any)
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
        const token = await createContractReadyToken({
          dealId,
          creatorId: userId,
          expiresAt: null,
        });
        contractReadyToken = token.id;

        await supabase
          .from('brand_deals')
          .update({
            status: 'CONTRACT_READY',
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', dealId);
      } else {
        const { data: creatorProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, address, location, registered_address')
          .eq('id', userId)
          .maybeSingle();

        const creatorName = creatorProfile
          ? `${((creatorProfile as any).first_name || '').trim()} ${((creatorProfile as any).last_name || '').trim()}`.trim() || delivery_name.trim()
          : delivery_name.trim();

        // Resolve creator address - prioritize registered_address
        let creatorAddress = (creatorProfile as any)?.registered_address || (creatorProfile as any)?.location || (creatorProfile as any)?.address || delivery_address.trim();
        if (creatorAddress && (creatorAddress.trim() === '' || creatorAddress.toLowerCase() === 'n/a')) {
          creatorAddress = delivery_address.trim();
        }

        // Try to get email from profile, then from req.user, then from auth as last resort
        let creatorEmail = (creatorProfile as any)?.email || req.user?.email;

        if (!creatorEmail) {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(userId);
            creatorEmail = authUser?.user?.email;
          } catch (e) {
            console.error('[Deals] Failed to fetch creator email from auth:', e);
          }
        }

        creatorEmail = creatorEmail || undefined;

        // Resolve brand address - prioritize registered company_address if available
        let companyAddressFromTable: string | null = null;
        if (deal.brand_id) {
          const { data: brandData } = await supabase
            .from('brands')
            .select('company_address')
            .eq('external_id', deal.brand_id)
            .maybeSingle();
          companyAddressFromTable = brandData?.company_address || null;
        }
        const finalBrandAddress = (deal as any).brand_address || companyAddressFromTable || undefined;

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
          finalBrandAddress &&
          creatorName &&
          creatorEmail &&
          creatorAddress;

        if (!canGenerateContract) {
          console.log('[Deals] Skipping contract generation due to missing info:', {
            hasBrandName: !!deal.brand_name,
            hasBrandEmail: !!deal.brand_email,
            hasBrandAddress: !!(deal as any).brand_address,
            hasCreatorName: !!creatorName,
            hasCreatorEmail: !!creatorEmail,
            hasCreatorAddress: !!delivery_address.trim()
          });
          return res.status(400).json({
            success: false,
            error: 'Delivery details saved, but contract generation needs complete brand and creator details.',
          });
        }

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
            brandAddress: finalBrandAddress,
            brandPhone: (deal as any).brand_phone || undefined,
            creatorAddress,
            dealSchema: dealSchema as any,
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
            throw new Error('Failed to upload barter contract');
          } else {
            const { data: publicUrlData } = supabase.storage.from('creator-assets').getPublicUrl(storagePath);
            contractUrl = publicUrlData?.publicUrl || null;

            const token = await createContractReadyToken({
              dealId,
              creatorId: userId,
              expiresAt: null,
            });
            contractReadyToken = token.id;

            await supabase
              .from('brand_deals')
              .update({
                contract_file_url: contractUrl,
                contract_file_path: storagePath, // Use new secure path column
                status: 'CONTRACT_READY',
                updated_at: new Date().toISOString(),
              } as any)
              .eq('id', dealId);

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
      // More helpful error for common contract generation failures
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
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:dealId/shipping/update
 * Brand/System updates shipping status (shipped, delivered, etc.).
 */
router.patch('/:dealId/shipping/update', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dealId } = req.params;
    const userId = req.user?.id;
    const userEmail = String(req.user?.email || '').toLowerCase() || null;
    const role = String(req.user?.role || '').toLowerCase();
    const { status, tracking_number, courier_name, tracking_url, expected_delivery_date } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (role !== 'brand' && role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brand access required' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, brand_id, brand_email, shipping_required, deal_type')
      .eq('id', dealId)
      .maybeSingle();
    if (dealError || !deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const dealBrandEmail = String((deal as any).brand_email || '').toLowerCase() || null;
    const hasAccess =
      String((deal as any).brand_id || '') === String(userId) ||
      (!!userEmail && !!dealBrandEmail && userEmail === dealBrandEmail) ||
      role === 'admin';
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!inferRequiresShipping(deal)) {
      return res.status(409).json({ success: false, error: 'Shipping is not required for this deal.' });
    }

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        shipping_status: status,
        tracking_number,
        courier_name,
        tracking_url: tracking_url || null,
        expected_delivery_date: expected_delivery_date || null,
        shipped_at: status === 'shipped' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', dealId);

    if (updateError) throw updateError;

    // Log action
    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'shipping_status_updated',
      metadata: { status, tracking_number, courier_name, tracking_url: tracking_url || null, expected_delivery_date: expected_delivery_date || null }
    });

    return res.json({ success: true, message: `Shipping status updated to ${status}` });
  } catch (error: any) {
    console.error('[Deals] shipping update error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:id/shipping/confirm-received
 * Creator confirms they received the product (for barter).
 */
const confirmReceivedHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id || req.params.dealId;
    const userId = req.user!.id;

    if (!dealId) {
      return res.status(400).json({ success: false, error: 'Deal ID is required' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, deal_type, shipping_required, shipping_status')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const dealData = deal as any;
    if (dealData.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!dealData.shipping_required) {
      return res.status(400).json({ success: false, error: 'Shipping confirmation is only for deals with shipping required' });
    }
    if (dealData.shipping_status !== 'shipped') {
      return res.status(400).json({ success: false, error: 'Product must be marked as shipped before confirming receipt' });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        shipping_status: 'delivered',
        status: 'CONTENT_MAKING',
        delivered_at: now,
        updated_at: now
      } as any)
      .eq('id', dealId);

    if (updateError) throw updateError;

    // Log action
    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'shipping_confirmed_delivered',
      metadata: {}
    });

    // Notify creator (async, non-blocking)
    try {
      const { data: brandDeal } = await supabase
        .from('brand_deals')
        .select('brand_name')
        .eq('id', dealId)
        .single();

      const result = await (supabase as any)
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single();
      const profile = result.data;

      if (profile && profile.email) {
        const creatorName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Creator';
        const { sendCreatorDeliveryConfirmedEmail } = await import('../services/shippingEmailService.js');
        sendCreatorDeliveryConfirmedEmail(
          profile.email,
          creatorName,
          (brandDeal as any)?.brand_name || 'Brand',
          dealId
        ).catch(e => console.error('[Deals] Delivery confirmation email failed:', e));
      }
    } catch (emailErr) {
      console.warn('[Deals] Failed to trigger delivery confirmation email:', emailErr);
    }

    return res.json({ success: true, message: 'Product receipt confirmed' });
  } catch (error: any) {
    console.error('[Deals] confirm-received error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
};

router.patch('/:id/shipping/confirm-received', confirmReceivedHandler);
router.patch('/:dealId/shipping/confirm-received', confirmReceivedHandler);
router.post('/:id/confirm-receipt', confirmReceivedHandler);

/**
 * POST /api/deals/:dealId/regenerate-contract
 * Manual trigger to regenerate contract for a deal if it failed or needs update.
 */
router.post('/:dealId/regenerate-contract', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = String(req.user?.email || '').toLowerCase();
    const { dealId } = req.params;

    if (!dealId) {
      return res.status(400).json({ success: false, error: 'Deal ID is required' });
    }

    const selectAttempts = [
      'id, creator_id, brand_id, brand_name, brand_email, brand_address, brand_phone, deal_type, deal_amount, deliverables, due_date, payment_expected_date, platform, jurisdiction_city, delivery_address',
      'id, creator_id, brand_id, brand_name, brand_email, brand_address, brand_phone, deal_type, deal_amount, deliverables, due_date, payment_expected_date, platform',
      'id, creator_id, brand_id, brand_name, brand_email, brand_address, brand_phone, deal_type, deal_amount, deliverables, due_date, payment_expected_date',
      'id, creator_id, brand_id, brand_name, brand_email, deal_type, deal_amount, deliverables, due_date, payment_expected_date',
      'id, creator_id, brand_id, brand_name, brand_email, deal_type, deal_amount, deliverables',
    ];

    let deal: any = null;
    let dealError: any = null;
    for (const select of selectAttempts) {
      const result = await supabase
        .from('brand_deals')
        .select(select)
        .eq('id', dealId)
        .maybeSingle();
      deal = result.data;
      dealError = result.error;
      if (!dealError) break;
      const msg = String(dealError?.message || '').toLowerCase();
      if (!msg.includes('does not exist') && !msg.includes('could not find') && !msg.includes('schema cache')) {
        break;
      }
    }

    if (dealError || !deal) {
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const isCreatorOwner = deal.creator_id === userId;
    const isBrandOwner = deal.brand_id === userId || (userEmail && String(deal.brand_email || '').toLowerCase() == userEmail);
    const isAdmin = req.user!.role === 'admin';

    if (!isCreatorOwner && !isBrandOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Fetch creator profile first so we can use it for address fallbacks
    const profileSelectAttempts = [
      'first_name, last_name, address, location, registered_address',
      'first_name, last_name, address, location',
      'first_name, last_name, location',
      'first_name, last_name',
    ];
    let creatorProfile: any = null;
    let creatorProfileError: any = null;
    for (const select of profileSelectAttempts) {
      const { data, error } = await supabase
        .from('profiles')
        .select(select)
        .eq('id', deal.creator_id)
        .maybeSingle();
      creatorProfile = data;
      creatorProfileError = error;
      if (!error) break;
      const msg = String(error?.message || '').toLowerCase();
      if (!msg.includes('does not exist') && !msg.includes('could not find') && !msg.includes('schema cache')) {
        break;
      }
    }
    if (creatorProfileError && !creatorProfile) {
      throw creatorProfileError;
    }

    // Fallback for barter delivery address: use creator's location if explicit delivery_address is missing
    const resolvedCreatorAddress = creatorProfile?.registered_address || creatorProfile?.location || creatorProfile?.address || '';
    const finalDeliveryAddress = (deal.delivery_address || resolvedCreatorAddress || '').trim();

    if (deal.deal_type === 'barter' && !finalDeliveryAddress) {
      return res.status(400).json({
        success: false,
        error: 'Delivery details are required before generating a contract. Please ensure you have a location set in your profile or provide a delivery address.',
      });
    }

    const tokenCreatorId = String(deal.creator_id || '').trim();
    if (!tokenCreatorId) {
      return res.status(400).json({
        success: false,
        error: 'Deal creator is missing, so a contract token cannot be generated.',
      });
    }


    const creatorName = creatorProfile
      ? `${(creatorProfile.first_name || '').trim()} ${(creatorProfile.last_name || '').trim()}`.trim() || (creatorProfile as any)?.full_name?.trim() || 'Creator'
      : 'Creator';

    // Fallback email fetching if not in profiles
    let creatorEmail = (creatorProfile as any)?.email;
    if (!creatorEmail) {
      // If we are the creator, we have the email in req.user
      if (isCreatorOwner) {
        creatorEmail = req.user?.email;
      } else {
        // Otherwise try auth.admin (requires service role, which server client matches)
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(deal.creator_id);
          creatorEmail = authUser?.user?.email;
        } catch (authErr) {
          console.warn('[Deals] Failed to fetch creator email from auth.admin:', authErr);
        }
      }
    }

    // Resolve creator address - prioritize registered_address
    let creatorAddress = (creatorProfile as any)?.registered_address || (creatorProfile as any)?.location || (creatorProfile as any)?.address || undefined;
    if (creatorAddress && (creatorAddress.trim() === '' || creatorAddress.toLowerCase() === 'n/a')) {
      creatorAddress = undefined;
    }

    // Resolve brand address - prioritize registered company_address if available
    let companyAddressFromTable: string | null = null;
    if (deal.brand_id) {
      const { data: brandData } = await supabase
        .from('brands')
        .select('company_address')
        .eq('external_id', deal.brand_id)
        .maybeSingle();
      companyAddressFromTable = brandData?.company_address || null;
    }
    const finalBrandAddress = (deal as any).brand_address || companyAddressFromTable || undefined;

    // Parse deliverables
    let deliverablesArray: string[] = [];
    try {
      if (typeof deal.deliverables === 'string') {
        if (deal.deliverables.startsWith('[') && deal.deliverables.endsWith(']')) {
          deliverablesArray = JSON.parse(deal.deliverables);
        } else {
          deliverablesArray = deal.deliverables.split(',').map((s: string) => s.trim());
        }
      } else {
        deliverablesArray = deal.deliverables || [];
      }
    } catch {
      deliverablesArray = [String(deal.deliverables)];
    }

    const dueDateStr = deal.due_date ? new Date(deal.due_date).toLocaleDateString() : undefined;
    const paymentExpectedDateStr = deal.payment_expected_date ? new Date(deal.payment_expected_date).toLocaleDateString() : undefined;

    // Generate contract
    let contractResult;
    try {
      contractResult = await generateContractFromScratch({
        brandName: deal.brand_name,
        creatorName,
        creatorEmail,
        dealAmount: deal.deal_amount,
        deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
        dueDate: dueDateStr,
        paymentExpectedDate: paymentExpectedDateStr,
        platform: deal.platform || 'Multiple Platforms',
        brandEmail: deal.brand_email || undefined,
        brandAddress: finalBrandAddress,
        brandPhone: (deal as any).brand_phone || undefined,
        creatorAddress,
        dealSchema: {
          deal_amount: deal.deal_amount,
          deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
          delivery_deadline: deal.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          payment: { method: 'Bank Transfer', timeline: paymentExpectedDateStr ? `Payment by ${paymentExpectedDateStr}` : 'Within 7 days of content delivery' },
          usage: { type: 'Non-exclusive', platforms: ['All platforms'], duration: '6 months', paid_ads: false, whitelisting: false },
          exclusivity: { enabled: false, category: null, duration: null },
          termination: { notice_days: 7 },
          jurisdiction_city: deal.jurisdiction_city || 'Mumbai',
        },
        usageType: 'Non-exclusive' as "Non-exclusive" | "Exclusive",
        usagePlatforms: ['All platforms'],
        usageDuration: '6 months',
        paidAdsAllowed: false,
        whitelistingAllowed: false,
        exclusivityEnabled: false,
        exclusivityCategory: null,
        exclusivityDuration: null,
        terminationNoticeDays: 7,
        jurisdictionCity: deal.jurisdiction_city || 'Mumbai',
      });
    } catch (genErr: any) {
      if (genErr.missingFields) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required information for contract generation.',
          missingFields: genErr.missingFields 
        });
      }
      throw genErr;
    }

    const timestamp = Date.now();
    const storagePath = `contracts/${dealId}/${timestamp}_${contractResult.fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('creator-assets')
      .upload(storagePath, contractResult.contractDocx, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage.from('creator-assets').getPublicUrl(storagePath);
    const contractUrl = publicUrlData?.publicUrl;

    if (!contractUrl) {
      throw new Error('Failed to get public URL for contract');
    }

    // Update deal
    await supabase.from('brand_deals').update({
      contract_file_url: contractUrl,
      updated_at: new Date().toISOString(),
    } as any).eq('id', dealId);

    // Create token
    const token = await createContractReadyToken({
      dealId,
      creatorId: tokenCreatorId,
      expiresAt: null,
    });

    // Send email
    if (deal.brand_email && token.id) {
      sendCollabRequestAcceptedEmail(deal.brand_email, {
        creatorName,
        brandName: (deal as any).brand_name,
        dealAmount: deal.deal_amount,
        dealType: (deal.deal_type as "paid" | "barter") || 'paid',
        deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
        contractReadyToken: token.id,
        contractUrl: contractUrl,
      }).catch((e) => console.error('[Deals] Regenerate contract email failed:', e));
    }

    return res.json({
      success: true,
      contract: {
        url: contractUrl,
        token: token.id
      },
      message: 'Contract regenerated and sent to brand.'
    });

  } catch (error: any) {
    console.error('[Deals] Regenerate contract error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

router.get('/:dealId/contract-review-link', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = String(req.user?.email || '').toLowerCase();
    const { dealId } = req.params;

    if (!dealId) {
      return res.status(400).json({ success: false, error: 'Deal ID is required' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, brand_id, brand_email')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const isCreatorOwner = deal.creator_id === userId;
    const isBrandOwner = deal.brand_id === userId || (userEmail && String(deal.brand_email || '').toLowerCase() === userEmail);
    const isAdmin = req.user!.role === 'admin';

    if (!isCreatorOwner && !isBrandOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    let tokenId: string | null = null;
    const { data: existingToken } = await (supabase as any)
      .from('contract_ready_tokens')
      .select('id')
      .eq('deal_id', dealId)
      .eq('is_active', true)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

	    if (existingToken?.id) {
	      tokenId = existingToken.id;
	    } else {
	      const token = await createContractReadyToken({
	        dealId,
	        creatorId: deal.creator_id,
	        expiresAt: null,
	      });
	      tokenId = token.id;
	    }

	    const apiBaseUrl = `${req.protocol}://${req.get('host')}`;
	    // Prefer the frontend origin (where the user is browsing) so we can send them to the
	    // ContractReadyPage for signing instead of a protected-file view that often downloads.
	    const frontendOriginRaw = req.get('origin') || process.env.FRONTEND_URL || '';
	    const frontendOrigin = String(frontendOriginRaw || '').replace(/\/$/, '');
	    return res.json({
	      success: true,
	      token: tokenId,
	      // Read-only contract view (can download depending on browser / content-disposition).
	      viewUrl: `${apiBaseUrl}/api/protection/contracts/${dealId}/view?token=${tokenId}`,
	      // Signing UX (brand flow) hosted on the frontend.
	      signUrl: frontendOrigin ? `${frontendOrigin}/contract-ready/${tokenId}` : undefined,
	    });
	  } catch (error: any) {
	    console.error('[Deals] contract-review-link error:', error);
	    return res.status(500).json({ success: false, error: error?.message || 'Failed to create contract review link' });
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
    const reasonStr = String(reason || '').trim();

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, creator_id, deal_type, shipping_required, shipping_status, brand_name, brand_email')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    if (!inferRequiresShipping(deal)) {
      return res.status(400).json({ success: false, error: 'Shipping issue reporting is only available for deals with shipping' });
    }
    if ((deal as any).shipping_status === 'delivered' || (deal as any).shipping_status === 'received') {
      return res.status(400).json({ success: false, error: 'Product already marked as delivered' });
    }
    if (!reasonStr) {
      return res.status(400).json({ success: false, error: 'Please provide a reason for the issue' });
    }

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        shipping_status: 'issue_reported',
        shipping_issue_reason: reasonStr,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', dealId);

    if (updateError) {
      return res.status(500).json({ success: false, error: 'Failed to update' });
    }

    try {
      await supabase.from('deal_action_logs').insert({
        deal_id: dealId,
        event: 'shipping_issue_reported',
        metadata: { reason: reasonStr },
      });
    } catch (e: any) {
      console.warn('[Deals] shipping audit log failed:', e);
    }

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
        brandName: (deal as any).brand_name || 'Brand',
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
 * POST /api/deals/:id/sign-creator
 * Legally sign the contract as a creator after OTP verification
 */
router.post('/:id/sign-creator', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user!.id;
    const { signerName, signerEmail, contractSnapshotHtml } = req.body;

    if (!signerName || !signerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: signerName and signerEmail'
      });
    }

    // 1. Fetch deal to verify OTP status
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('creator_otp_verified, creator_otp_verified_at, creator_id')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const dealData = deal as any;

    // 2. Security Check: Only the creator (or admin) can sign
    if (dealData.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // 3. Verify OTP was actually verified
    if (!(deal as any).creator_otp_verified) {
      return res.status(400).json({
        success: false,
        error: 'OTP verification is required before signing. Please verify your email first.'
      });
    }

    // 4. Sign the contract using the service
    const signResult = await signContractAsCreator({
      dealId,
      creatorId: userId,
      signerName,
      signerEmail,
      contractSnapshotHtml,
      ipAddress: getClientIp(req as any),
      userAgent: req.headers['user-agent'] || 'unknown',
      deviceInfo: getDeviceInfo(req.headers['user-agent'] || 'unknown'),
      otpVerified: true,
      otpVerifiedAt: (deal as any).creator_otp_verified_at
    });

    if (!signResult.success) {
      return res.status(500).json({
        success: false,
        error: signResult.error || 'Failed to sign contract'
      });
    }

    // Status update is now handled internally by signContractAsCreator
    // based on whether both parties have signed.

    // ── PAYMENT_PENDING auto-transition ──────────────────────────────────────
    // After both parties sign, if the deal requires payment, immediately move it
    // to PAYMENT_PENDING so the brand must confirm funds before creator delivers.
    try {
      const { data: freshDeal } = await supabase
        .from('brand_deals')
        .select('status, deal_type, deal_amount')
        .eq('id', dealId)
        .maybeSingle();

      const freshStatus = normalizeStatus(freshDeal?.status);
      if (freshStatus === 'FULLY_EXECUTED' && inferRequiresPayment(freshDeal)) {
        await supabase
          .from('brand_deals')
          .update({ status: 'PAYMENT_PENDING', updated_at: new Date().toISOString() } as any)
          .eq('id', dealId);

        await supabase.from('deal_action_logs').insert({
          deal_id: dealId,
          user_id: userId,
          event: 'PAYMENT_PENDING_STARTED',
          metadata: { reason: 'Paid deal fully executed; awaiting brand payment confirmation.' },
        });
      }
    } catch (transitionErr) {
      console.warn('[Deals] sign-creator: PAYMENT_PENDING auto-transition failed (non-fatal):', transitionErr);
    }

    return res.json({
      success: true,
      message: 'Contract signed successfully',
      signature: signResult.signature
    });

  } catch (error: any) {
    console.error('[Deals] Sign-creator error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/deals/:id/brand-shipping-address
 * Brand provides their shipping/fulfillment address for a deal that requires it.
 * This clears the AWAITING_BRAND_ADDRESS gate so the creator can proceed.
 * Works for both barter and paid deals with physical product components.
 */
router.post('/:id/brand-shipping-address', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;
    const userEmail = String(req.user?.email || '').toLowerCase() || null;
    const role = String(req.user?.role || '').toLowerCase();

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (role !== 'brand' && role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brand access required' });
    }

    const { address, contactName, phone, notes } = req.body;
    const addressStr = String(address || '').trim();
    if (!addressStr || addressStr.length < 5) {
      return res.status(400).json({ success: false, error: 'A valid shipping address is required (at least 5 characters).' });
    }

    const { deal, error: dealError } = await fetchDealForBrandMutation(dealId);
    if (dealError || !deal) {
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const dealBrandEmail = String((deal as any).brand_email || '').toLowerCase() || null;
    const hasAccess =
      String((deal as any).brand_id || '') === String(userId) ||
      (!!userEmail && !!dealBrandEmail && userEmail === dealBrandEmail) ||
      role === 'admin';
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

     const now = new Date().toISOString();
     const fullUpdate: any = {
       brand_address: addressStr,
       brand_phone: phone ? String(phone).trim() : undefined,
       contact_person: contactName ? String(contactName).trim() : undefined,
       updated_at: now,
     };
     const minUpdate: any = { brand_address: addressStr, updated_at: now };
     if (contactName) {
       (minUpdate as any).contact_person = String(contactName).trim();
     }

     // If this is a barter deal in a gate status (PAYMENT_PENDING or AWAITING_BRAND_ADDRESS),
     // providing the address moves it to the next active state: CONTENT_MAKING.
    const currentStatus = normalizeStatus((deal as any).status);
    const isBarter = isBarterType(deal);
    
    // Clear the address gate for any deal type. 
    // For barter, we also skip the payment and contract gates since there is no escrow 
    // and provide shipping is the definitive "start" action.
    if (currentStatus === 'AWAITING_BRAND_ADDRESS' || (isBarter && (currentStatus === 'PAYMENT_PENDING' || currentStatus === 'ACCEPTED' || currentStatus === 'CONTRACT_READY' || currentStatus === 'SENT'))) {
      fullUpdate.status = 'CONTENT_MAKING';
      minUpdate.status = 'CONTENT_MAKING';
    }

    const { data: updatedData, error: updateError } = await supabase.from('brand_deals').update(fullUpdate).eq('id', dealId).select();
    if (updateError) {
      const { error: fallback } = await supabase.from('brand_deals').update(minUpdate).eq('id', dealId);
      if (fallback) throw fallback;
    }

    // Invalidate creator cache so they see the address immediately
    invalidateDealsMineCache(String(deal.creator_id));

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'BRAND_SHIPPING_ADDRESS_PROVIDED',
      metadata: { address: addressStr, contact_name: contactName || null, phone: phone || null, notes: notes || null },
    });

    await notifyCreatorForDealEvent('deal_activated', { ...deal, status: fullUpdate.status || (deal as any).status }, {
      brand_address_provided: true,
    });

    return res.json({ success: true, message: 'Shipping address saved. Creator can now proceed with delivery.' });
  } catch (error: any) {
    console.error('[Deals] brand-shipping-address error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

/**
 * POST /api/deals/:id/confirm-payment-pending
 * Brand confirms payment is escrowed / transferred, unblocking creator delivery.
 * Transitions: PAYMENT_PENDING → CONTENT_MAKING.
 */
router.post('/:id/confirm-payment-pending', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;
    const userEmail = String(req.user?.email || '').toLowerCase() || null;
    const role = String(req.user?.role || '').toLowerCase();

    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
    if (role !== 'brand' && role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brand access required' });
    }

    const { deal, error: dealError } = await fetchDealForBrandMutation(dealId);
    if (dealError || !deal) { console.error("404 Deal not found", dealId, (typeof dealError !== "undefined" ? dealError : (typeof error !== "undefined" ? error : null))); return res.status(404).json({ success: false, error: 'Deal not found' }); }

    const dealBrandEmail = String((deal as any).brand_email || '').toLowerCase() || null;
    const hasAccess =
      String((deal as any).brand_id || '') === String(userId) ||
      (!!userEmail && !!dealBrandEmail && userEmail === dealBrandEmail) ||
      role === 'admin';
    if (!hasAccess) return res.status(403).json({ success: false, error: 'Access denied' });

    if (!inferRequiresPayment(deal)) {
      return res.status(409).json({ success: false, error: 'This deal does not require payment confirmation.' });
    }

    const current = normalizeStatus((deal as any).status);
    if (current !== 'PAYMENT_PENDING') {
      return res.status(409).json({
        success: false,
        error: `Payment can only be confirmed from PAYMENT_PENDING state. Current: ${current || 'UNKNOWN'}.`,
      });
    }

    const paymentReference = String(req.body?.paymentReference || req.body?.utrNumber || '').trim();
    if (!paymentReference) {
      return res.status(400).json({ success: false, error: 'Payment reference / UTR is required.' });
    }

    const now = new Date().toISOString();
    const updateFull: any = { status: 'CONTENT_MAKING', payment_pending_confirmed_at: now, utr_number: paymentReference, progress_percentage: 30, updated_at: now };
    const updateMin: any = { status: 'CONTENT_MAKING', updated_at: now };

    const { error: updateError } = await supabase.from('brand_deals').update(updateFull).eq('id', dealId);
    if (updateError) {
      const { error: fallback } = await supabase.from('brand_deals').update(updateMin).eq('id', dealId);
      if (fallback) throw fallback;
    }

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'PAYMENT_PENDING_CONFIRMED',
      metadata: { payment_reference: paymentReference, confirmed_at: now },
    });

    await notifyCreatorForDealEvent('deal_activated', { ...deal, status: 'CONTENT_MAKING' }, {
      payment_confirmed: true,
      payment_reference: paymentReference,
    });

    return res.json({ success: true, message: 'Payment confirmed. Creator can now start content delivery.' });
  } catch (error: any) {
    console.error('[Deals] confirm-payment-pending error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

/**
 * POST /api/deals/:id/cancel-unpaid
 * Allows creator or brand to cancel a deal that is stuck in PAYMENT_PENDING.
 */
router.post('/:id/cancel-unpaid', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    const { data: deal } = await supabase.from('brand_deals').select('status, creator_id, brand_id, created_at').eq('id', dealId).single();
    if (!deal) { console.error("404 Deal not found", dealId, null); return res.status(404).json({ success: false, error: 'Deal not found' }); }

    // Only allow if it's PAYMENT_PENDING
    const current = normalizeStatus(deal.status);
    if (current !== 'PAYMENT_PENDING') {
      return res.status(400).json({ success: false, error: 'Only unpaid deals can be cancelled.' });
    }

    // Only creator or brand can cancel
    if (userId !== deal.creator_id && userId !== deal.brand_id) {
      return res.status(403).json({ success: false, error: 'Unauthorized to cancel this deal' });
    }

    // Enforce 24 hour wait time before creator can cancel
    const createdTime = new Date(deal.created_at || Date.now()).getTime();
    const hoursElapsed = (Date.now() - createdTime) / (1000 * 60 * 60);

    if (userId === deal.creator_id && hoursElapsed < 24) {
      return res.status(400).json({ success: false, error: 'Creators must wait 24 hours before cancelling an unpaid deal.' });
    }

    const { error } = await supabase
      .from('brand_deals')
      .update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString()
      })
      .eq('id', dealId)
      .eq('status', deal.status); // Safety check

    if (error) throw error;

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'DEAL_CANCELLED',
      metadata: { reason: 'Unpaid deal cancelled' }
    });

    return res.json({ success: true, message: 'Deal cancelled successfully' });
  } catch (error: any) {
    console.error('[Deals] cancel-unpaid error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

/**
 * POST /api/deals/:id/create-payment-link
 * Generates Razorpay payment link with exact fee breakdown.
 */
router.post('/:id/create-payment-link', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;
    const role = String(req.user?.role || '').toLowerCase();

    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    const { deal, error: dealError } = await fetchDealForBrandMutation(dealId);

    if (dealError || !deal) { console.error("404 Deal not found", dealId, (typeof dealError !== "undefined" ? dealError : (typeof error !== "undefined" ? error : null))); return res.status(404).json({ success: false, error: 'Deal not found' }); }

    // Authorization: allow if role=brand/admin, OR if the user is the brand who owns this deal
    // (checked by brand_id or brand_email, to handle older records created without brand_id).
    const dealBrandId = String((deal as any).brand_id || '');
    const dealBrandEmail = String((deal as any).brand_email || '').toLowerCase();
    const userEmail = String(req.user?.email || '').toLowerCase();
    const isOwner = (dealBrandId && dealBrandId === userId) || (dealBrandEmail && userEmail && dealBrandEmail === userEmail);
    if (role !== 'brand' && role !== 'admin' && !isOwner) {
      return res.status(403).json({ success: false, error: 'Brand access required' });
    }
    
    const current = normalizeStatus((deal as any).status);
    if (current !== 'PAYMENT_PENDING') {
      return res.status(409).json({ success: false, error: 'Payment can only be initiated from PAYMENT_PENDING state.' });
    }

    const dealAmount = Number((deal as any).deal_amount || 0);
    if (dealAmount <= 0) return res.status(400).json({ success: false, error: 'Deal has no valid amount.' });

    const breakdown = calculatePaymentBreakdown(dealAmount);

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(500).json({
        success: false,
        error: 'Razorpay is not configured on this server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
      });
    }

    let paymentLinkUrl = '';
    
    try {
      const Razorpay = (await import('razorpay')).default;
      const rzp = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      });
      
      const linkParams = {
        amount: breakdown.amountPaise,
        currency: 'INR',
        accept_partial: false,
        description: `Payment for Deal #${dealId}`,
        // Razorpay caps reference_id at 40 characters.
        reference_id: `deal_${dealId.replace(/-/g, '').slice(0, 16)}_${String(Date.now()).slice(-6)}`,
        // Razorpay requires expire_by to be at least 15 minutes in the future.
        // Add a small buffer so the request does not fail at the boundary.
        expire_by: Math.floor(Date.now() / 1000) + 20 * 60,
        notes: {
          deal_id: dealId,
          creator_id: (deal as any).creator_id,
          brand_id: userId
        }
      };
      
      const rzpLink = await rzp.paymentLink.create(linkParams);
      paymentLinkUrl = rzpLink.short_url;
      
      // Store generated payment link ID in DB
      const { error: updateError } = await supabase.from('brand_deals').update({
        payment_id: rzpLink.id,
        amount_paid: breakdown.brandTotal,
        creator_amount: breakdown.creatorPayout,
        platform_fee: breakdown.platformFee
      }).eq('id', dealId);
      if (updateError) {
        console.error('[Razorpay] Failed to persist payment link metadata:', updateError);
      }

    } catch (rzpError: any) {
      console.error('[Razorpay] Payment link creation failed:', rzpError);
      return res.status(502).json({
        success: false,
        error: rzpError?.message || 'Failed to create Razorpay payment link.',
      });
    }

    return res.json({ 
      success: true, 
      short_url: paymentLinkUrl,
      amount: breakdown.brandTotal,
      breakdown 
    });
  } catch (error: any) {
    console.error('[Deals] create-payment-link error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

/**
 * POST /api/deals/:id/create-payment-order
 * Creates a Razorpay order for in-app checkout modal flow.
 */
router.post('/:id/create-payment-order', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;
    const role = String(req.user?.role || '').toLowerCase();

    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    const { deal, error: dealError } = await fetchDealForBrandMutation(dealId);
    if (dealError || !deal) { console.error("404 Deal not found", dealId, (typeof dealError !== "undefined" ? dealError : (typeof error !== "undefined" ? error : null))); return res.status(404).json({ success: false, error: 'Deal not found' }); }

    const dealBrandId = String((deal as any).brand_id || '');
    const dealBrandEmail = String((deal as any).brand_email || '').toLowerCase();
    const userEmail = String(req.user?.email || '').toLowerCase();
    const isOwner = (dealBrandId && dealBrandId === userId) || (dealBrandEmail && userEmail && dealBrandEmail === userEmail);
    if (role !== 'brand' && role !== 'admin' && !isOwner) {
      return res.status(403).json({ success: false, error: 'Brand access required' });
    }

    const current = normalizeStatus((deal as any).status);
    if (current !== 'PAYMENT_PENDING') {
      return res.status(409).json({ success: false, error: 'Payment can only be initiated from PAYMENT_PENDING state.' });
    }

    const dealAmount = Number((deal as any).deal_amount || 0);
    if (dealAmount <= 0) return res.status(400).json({ success: false, error: 'Deal has no valid amount.' });

    const breakdown = calculatePaymentBreakdown(dealAmount);
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(500).json({
        success: false,
        error: 'Razorpay is not configured on this server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
      });
    }

    try {
      const Razorpay = (await import('razorpay')).default;
      const rzp = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      });

      const order = await rzp.orders.create({
        amount: breakdown.amountPaise,
        currency: 'INR',
        receipt: `deal_${dealId.replace(/-/g, '').slice(0, 20)}`,
        notes: {
          deal_id: dealId,
          creator_id: (deal as any).creator_id,
          brand_id: userId,
        },
      });

      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // Hardening: only update columns if they exist in the schema
      if ('payment_id' in (deal || {})) updateData.payment_id = order.id;
      if ('platform_fee' in (deal || {})) updateData.platform_fee = breakdown.platformFee;

      const { error: updateError } = await supabase.from('brand_deals').update(updateData).eq('id', dealId);
      if (updateError) {
        console.error('[Razorpay] Failed to persist order metadata:', updateError);
      }

      return res.json({
        success: true,
        order_id: order.id,
        amount: breakdown.brandTotal,
        breakdown,
        key_id: razorpayKeyId,
        currency: 'INR',
      });
    } catch (rzpError: any) {
      console.error('[Razorpay] Order creation failed:', rzpError);
      return res.status(502).json({
        success: false,
        error: rzpError?.error?.description || rzpError?.message || 'Failed to create Razorpay order.',
      });
    }
  } catch (error: any) {
    console.error('[Deals] create-payment-order error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

/**
 * POST /api/deals/:id/verify-payment
 * Manually checks Razorpay for payment status in case webhooks fail.
 */
router.post('/:id/verify-payment', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    // 1. Fetch deal
    const { data: deal, error } = await supabase
      .from('brand_deals')
      .select('status, payment_id, brand_id, brand_email')
      .eq('id', dealId)
      .single();

    if (error || !deal) { console.error("404 Deal not found", dealId, error); return res.status(404).json({ success: false, error: 'Deal not found' }); }

    // 2. Check permission (Brand or Admin)
    const userEmail = String(req.user?.email || '').toLowerCase();
    const dealBrandEmail = String(deal.brand_email || '').toLowerCase();
    const isOwner = deal.brand_id === userId || (dealBrandEmail && userEmail && dealBrandEmail === userEmail);
    if (!isOwner && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // 3. If already captured/content_making, skip expensive Razorpay call
    const current = String(deal.status || '').toLowerCase();
    if (current === 'content_making' || current === 'content-making') {
       return res.json({ success: true, status: 'content_making', message: 'Payment already confirmed' });
    }

    // 4. Query Razorpay API
    try {
      const Razorpay = (await import('razorpay')).default;
      const rzp = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_fallback',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'fallback_secret',
      });

      let isPaid = false;
      let orderId = deal.payment_id;

      // Case A: We have a payment_id (order_id)
      if (orderId) {
        const order = await rzp.orders.fetch(orderId);
        if (order.status === 'paid') {
          isPaid = true;
        }
      }

      // Case B: No payment_id or order not marked paid yet, search by notes
      if (!isPaid) {
        console.log(`[Razorpay] Searching for payments/orders by deal_id: ${dealId}`);
        
        // Try searching payments first
        const payments = await rzp.payments.all({ 'notes[deal_id]': dealId } as any);
        const capturedPayment = (payments.items || []).find((p: any) => p.status === 'captured' || p.status === 'authorized');
        
        if (capturedPayment) {
          isPaid = true;
          orderId = capturedPayment.order_id || orderId;
        } else {
          // If no payment found, try searching orders
          const orders = await rzp.orders.all({ 'notes[deal_id]': dealId } as any);
          const paidOrder = (orders.items || []).find((o: any) => o.status === 'paid');
          if (paidOrder) {
            isPaid = true;
            orderId = paidOrder.id;
          }
        }
      }
      
      if (isPaid) {
        // Success! Update manually.
        const now = new Date().toISOString();
        const updateData: any = {
          status: 'content_making',
          updated_at: now
        };
        
        // Save the IDs for future reference
        if ('payment_id' in (deal || {})) updateData.payment_id = orderId;
        if ('payment_status' in (deal || {})) updateData.payment_status = 'captured';

        await supabase.from('brand_deals').update(updateData).eq('id', dealId);

        await supabase.from('deal_action_logs').insert({
          deal_id: dealId,
          user_id: userId,
          event: 'PAYMENT_VERIFIED_MANUAL',
          metadata: { order_id: orderId, source: 'manual_verification' }
        });

        return res.json({ success: true, status: 'content_making', message: 'Payment verified and deal updated!' });
      } else {
        return res.json({ 
          success: true, 
          status: deal.status, 
          message: 'No captured payment found on Razorpay for this deal yet. If you just paid, please wait 2-3 minutes.' 
        });
      }
    } catch (rzpErr: any) {
      console.error('[Razorpay] Manual verification failed:', rzpErr);
      return res.status(502).json({ success: false, error: 'Failed to communicate with Razorpay' });
    }
  } catch (err: any) {
    console.error('[Deals] verify-payment error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/deals/:id/refund
 * Processes refund if deal is cancelled before delivery.
 */
router.post('/:id/refund', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;
    const role = String(req.user?.role || '').toLowerCase();

    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
    if (role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required for refunds' });
    }

    const { data: deal } = await supabase.from('brand_deals').select('status, payment_id, deal_amount').eq('id', dealId).single();
    if (!deal) { console.error("404 Deal not found", dealId, null); return res.status(404).json({ success: false, error: 'Deal not found' }); }
    
    if (!deal.payment_id) return res.status(400).json({ success: false, error: 'No Razorpay payment ID found' });

    try {
      const Razorpay = (await import('razorpay')).default;
      const rzp = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_fallback',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'fallback_secret',
      });
      
      const refundAmount = deal.deal_amount ? Math.round(Number(deal.deal_amount) * 100) : undefined; // Refund only deal amount in paise
      
      await rzp.payments.refund(deal.payment_id, {
        amount: refundAmount,
        notes: { reason: 'Deal cancelled - Platform fee retained' }
      });
    } catch (rzpErr: any) {
      console.warn('[Razorpay] Refund failed or SDK missing', rzpErr);
    }

    const now = new Date().toISOString();
    await supabase.from('brand_deals').update({ 
      status: 'REFUNDED', 
      payment_status: 'refunded',
      updated_at: now 
    }).eq('id', dealId);

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'DEAL_REFUNDED',
      metadata: { payment_id: deal.payment_id }
    });

    return res.json({ success: true, message: 'Refund initiated successfully' });
  } catch (error: any) {
    console.error('[Deals] refund error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

/**
 * POST /api/deals/:id/escalate-dispute
 * Formal dispute escalation after a revision is still rejected.
 * Provides structured resolution options: partial_refund | final_arbitration | cancel_deal | last_revision.
 * Only callable from DISPUTED status; freezes payout and routes to manual review.
 */
router.post('/:id/escalate-dispute', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;
    const userEmail = String(req.user?.email || '').toLowerCase() || null;
    const role = String(req.user?.role || '').toLowerCase();

    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
    if (role !== 'brand' && role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the brand can escalate a dispute.' });
    }

    const validResolutions = ['partial_refund', 'final_arbitration', 'cancel_deal', 'last_revision'] as const;
    type ResolutionType = typeof validResolutions[number];
    const resolution: ResolutionType | undefined = req.body?.resolution;
    if (!resolution || !validResolutions.includes(resolution)) {
      return res.status(400).json({
        success: false,
        error: `resolution must be one of: ${validResolutions.join(', ')}`,
      });
    }

    const escalationNotes = String(req.body?.notes || '').trim() || null;

    const { deal, error: dealError } = await fetchDealForBrandMutation(dealId);
    if (dealError || !deal) { console.error("404 Deal not found", dealId, (typeof dealError !== "undefined" ? dealError : (typeof error !== "undefined" ? error : null))); return res.status(404).json({ success: false, error: 'Deal not found' }); }

    const dealBrandEmail = String((deal as any).brand_email || '').toLowerCase() || null;
    const hasAccess =
      String((deal as any).brand_id || '') === String(userId) ||
      (!!userEmail && !!dealBrandEmail && userEmail === dealBrandEmail) ||
      role === 'admin';
    if (!hasAccess) return res.status(403).json({ success: false, error: 'Access denied' });

    const current = normalizeStatus((deal as any).status);
    if (current !== 'DISPUTED') {
      return res.status(409).json({
        success: false,
        error: `Dispute escalation is only allowed from DISPUTED status. Current: ${current || 'UNKNOWN'}.`,
      });
    }

    const now = new Date().toISOString();

    // Resolution-specific status transitions
    const statusMap: Record<ResolutionType, string> = {
      partial_refund: 'DISPUTE_PARTIAL_REFUND',
      final_arbitration: 'DISPUTE_ARBITRATION',
      cancel_deal: 'CANCELLED',
      last_revision: 'REVISION_REQUESTED',
    };

    const newStatus = statusMap[resolution];
    const updateFull: any = {
      status: newStatus,
      dispute_resolution: resolution,
      dispute_escalated_at: now,
      dispute_escalation_notes: escalationNotes,
      // Freeze payout for all paths except cancel (which has no payout anyway)
      payout_frozen: resolution !== 'cancel_deal',
      updated_at: now,
    };
    const updateMin: any = { status: newStatus, updated_at: now };

    const { error: updateError } = await supabase.from('brand_deals').update(updateFull).eq('id', dealId);
    if (updateError) {
      const { error: fallback } = await supabase.from('brand_deals').update(updateMin).eq('id', dealId);
      if (fallback) throw fallback;
    }

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'DISPUTE_ESCALATED',
      metadata: {
        resolution,
        new_status: newStatus,
        escalation_notes: escalationNotes,
        escalated_at: now,
        payout_frozen: resolution !== 'cancel_deal',
      },
    });

    // Notify creator of escalation result
    if (resolution === 'last_revision') {
      await notifyCreatorForDealEvent('revision_requested', { ...deal, status: 'REVISION_REQUESTED' }, {
        escalation_type: 'last_revision',
        escalation_notes: escalationNotes,
      });
    } else {
      await notifyCreatorForDealEvent('deal_disputed', { ...deal, status: newStatus }, {
        resolution,
        escalation_notes: escalationNotes,
      });
    }

    const messageMap: Record<ResolutionType, string> = {
      partial_refund: 'Dispute escalated. A partial refund process has been initiated and routed to support.',
      final_arbitration: 'Dispute escalated to final arbitration. Our team will review and resolve within 72 hours.',
      cancel_deal: 'Deal cancelled due to unresolved dispute.',
      last_revision: 'One last revision has been granted. Creator has been notified.',
    };

    return res.json({
      success: true,
      resolution,
      new_status: newStatus,
      message: messageMap[resolution],
    });
  } catch (error: any) {
    console.error('[Deals] escalate-dispute error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:id/submit-content
 * Creator submits content for brand review
 */
router.patch('/:id/submit-content', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawId = req.params.id;
    const userId = req.user!.id;
    const {
      contentUrl,
      mainLink,
      additionalLinks,
      caption,
      notes,
      messageToBrand,
      contentStatus,
      driveLink, // legacy
    } = req.body ?? {};

    const primaryLink = String(mainLink || contentUrl || '').trim();
    if (!primaryLink) {
      return res.status(400).json({ success: false, error: 'Content link is required' });
    }

    const normalizedContentStatusRaw = String(contentStatus || '').trim().toLowerCase();
    const normalizedContentStatus =
      normalizedContentStatusRaw === 'draft' || normalizedContentStatusRaw === 'posted'
        ? normalizedContentStatusRaw
        : null;

    const resolveDealId = async (id: string): Promise<string | null> => {
      const cleaned = String(id || '').trim();
      if (!cleaned) return null;

      // 1) Already a brand_deals id?
      const { data: dealProbe } = await supabase
        .from('brand_deals')
        .select('id')
        .eq('id', cleaned)
        .maybeSingle();
      if (dealProbe?.id) return dealProbe.id;

      // 2) deal_details_tokens id -> deal_details_submissions -> deal_id
      const { data: tokenRow } = await (supabase as any)
        .from('deal_details_tokens')
        .select('id')
        .eq('id', cleaned)
        .maybeSingle();
      if (tokenRow?.id) {
        const { data: submission } = await (supabase as any)
          .from('deal_details_submissions')
          .select('deal_id')
          .eq('token_id', cleaned)
          .maybeSingle();
        if (submission?.deal_id) return String(submission.deal_id);
      }

      // 3) collab_requests id -> deal_id
      const { data: collabRow } = await (supabase as any)
        .from('collab_requests')
        .select('deal_id')
        .eq('id', cleaned)
        .maybeSingle();
      if (collabRow?.deal_id) return String(collabRow.deal_id);

      return null;
    };

    const dealId = await resolveDealId(rawId);
    if (!dealId) {
      console.warn('[Deals] submit-content: could not resolve deal id', { rawId });
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    // Verify access — fetch with extended columns for gate checks
    const submitSelectAttempts = [
      'id, creator_id, status, brand_email, brand_name, progress_percentage, updated_at, deal_type, deal_amount, brand_address, shipping_required, shipping_status, amount_paid',
      'id, creator_id, status, brand_email, brand_name, progress_percentage, updated_at, deal_type, deal_amount, brand_address, shipping_required, amount_paid',
      'id, creator_id, status, brand_email, brand_name, progress_percentage, updated_at, deal_type, deal_amount, shipping_required, amount_paid',
      'id, creator_id, status, brand_email, brand_name, progress_percentage, updated_at, deal_type, deal_amount, amount_paid',
      'id, creator_id, status, brand_email, brand_name, progress_percentage, updated_at, deal_type, deal_amount',
      'id, creator_id, status, brand_email, brand_name, progress_percentage, updated_at, amount_paid',
    ];

    let deal: any = null;
    let dealError: any = null;
    for (const sel of submitSelectAttempts) {
      const { data, error } = await supabase.from('brand_deals').select(sel).eq('id', dealId).maybeSingle();
      if (!error) { deal = data; break; }
      if (!isMissingColumnError(error)) { dealError = error; break; }
      dealError = error;
    }

    if (dealError) {
      console.error('[Deals] submit-content: error fetching deal', { rawId, dealId, error: dealError?.message });
    }
    if (dealError || !deal) {
      console.warn('[Deals] submit-content: deal not found after resolve', { rawId, dealId });
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    if (deal.creator_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const current = normalizeStatus((deal as any).status);
    const isAdminOverride = req.user!.role === 'admin';

    if (!isAdminOverride && inferRequiresPayment(deal)) {
      const hasFunded = (Number(deal?.amount_paid || 0) > 0) || deal?.payment_status === 'captured';
      
      // If deal is signed/executed but not funded, it's in PAYMENT_PENDING state (or should be).
      // We ONLY allow content submission if it has been funded (captured).
      if (!hasFunded) {
        return res.status(402).json({
          success: false,
          error: 'Payment must be confirmed (escrow funded) by the brand before you can deliver content.',
          gate: 'PAYMENT_PENDING',
          currentStatus: current
        });
      }
    }

    // ── GATE 2: Shipping-address gate ─────────────────────────────────────────
    // For any deal that requires shipping (barter, hybrid, or explicit flag),
    // the brand must have provided their shipping address before creator delivers.
    if (!isAdminOverride && inferRequiresShipping(deal)) {
      const hasBrandAddress = !!(deal as any).brand_address && String((deal as any).brand_address).trim().length > 5;
      if (!hasBrandAddress) {
        return res.status(402).json({
          success: false,
          error: 'The brand must provide a shipping address before you can deliver content.',
          gate: 'AWAITING_BRAND_ADDRESS',
        });
      }
    }

     // ── GATE 2b: Shipping delivery confirmation (barter only) ───────────────────
     // For barter deals, content submission requires that the creator has received the product.
     if (!isAdminOverride && inferRequiresShipping(deal) && deal.shipping_status !== 'delivered') {
       return res.status(402).json({
         success: false,
         error: 'Cannot submit content until you have received and confirmed the product. Please confirm delivery first.',
         gate: 'SHIPPING_NOT_DELIVERED',
       });
     }

     const canSubmit = current === 'CONTENT_MAKING' || current === 'REVISION_REQUESTED' ||
       current === 'FULLY_EXECUTED' || current === 'PAYMENT_PENDING' ||
       current === 'SENT' || current === 'CONTRACT_READY' || current === 'AWAITING_SHIPMENT' || current === 'SHIPPED' || current === 'DRAFTING';
    if (!canSubmit) {
      return res.status(409).json({ success: false, error: `Cannot submit content from status ${current || 'UNKNOWN'}.` });
    }

    const now = new Date().toISOString();
    const isRevision = current === 'REVISION_REQUESTED';

    const sanitizeLink = (value: unknown) => {
      const url = String(value || '').trim();
      if (!url) return null;
      if (!/^https?:\/\//i.test(url)) return null;
      if (url.length > 2000) return null;
      return url;
    };

    const cleanedAdditional = (Array.isArray(additionalLinks) ? additionalLinks : [])
      .map(sanitizeLink)
      .filter(Boolean) as string[];
    const legacyDriveLink = sanitizeLink(driveLink);
    const uniqueLinks = Array.from(new Set([sanitizeLink(primaryLink), ...cleanedAdditional, legacyDriveLink].filter(Boolean) as string[]));
    const finalNotes = String(messageToBrand ?? notes ?? '').trim() || null;
    // Some deployments don't have the newer content_* columns yet.
    // We still record the submission via `deal_action_logs` and move the deal status forward.
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        status: 'Content Delivered',
        progress_percentage: 95,
        updated_at: now,
      } as any)
      .eq('id', dealId);

    if (updateError) throw updateError;

    // Log action
    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: isRevision ? 'REVISION_SUBMITTED' : 'CONTENT_SUBMITTED',
      metadata: {
        content_url: primaryLink,
        content_links: uniqueLinks,
        caption,
        notes: finalNotes,
        content_status: normalizedContentStatus,
        submitted_at: now,
      }
    });

    await recordMarketplaceEvent(supabase, {
      eventName: 'content_submitted',
      userId,
      creatorId: userId,
      dealId,
      metadata: {
        creator_id: userId,
        deal_id: dealId,
        content_status: normalizedContentStatus,
      },
    });

    if (deal) {
      await sendContentDeliveredEmailToBrand(deal);
    }

    return res.json({
      success: true,
      message: isRevision ? 'Revision submitted for review' : 'Content submitted for review',
      submitted_at: now
    });
  } catch (error: any) {
    console.error('[Deals] submit-content error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:id/review-content
 * Brand reviews submitted content (approve or request changes)
 * This route might be called via a brand-specific token or auth
 */
router.patch('/:id/review-content', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;
    const userEmail = String(req.user?.email || '').toLowerCase() || null;
    const role = String(req.user?.role || '').toLowerCase();
    const { status, feedback, disputeNotes } = req.body; // status: 'approved' | 'changes_requested' | 'disputed'

    if (!['approved', 'changes_requested', 'disputed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (role !== 'brand' && role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brand access required' });
    }

    const { deal, error: dealError } = await fetchDealForBrandMutation(dealId);

    if (dealError || !deal) {
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const dealBrandEmail = String((deal as any).brand_email || '').toLowerCase() || null;
    const hasAccess =
      String((deal as any).brand_id || '') === String(userId) ||
      (!!userEmail && !!dealBrandEmail && userEmail === dealBrandEmail) ||
      role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const normalizeStatus = (raw: any) => String(raw || '').trim().toUpperCase().replaceAll(' ', '_');
    const current = normalizeStatus((deal as any).status);
    if (!(current === 'CONTENT_DELIVERED' || current === 'REVISION_DONE')) {
      return res.status(409).json({ success: false, error: `Cannot review content from status ${current || 'UNKNOWN'}.` });
    }

    const now = new Date().toISOString();
    const updateData: any = {
      brand_approval_status: status,
      brand_feedback: feedback,
      updated_at: now,
    };

    const minimalUpdate: any = {
      updated_at: now,
    };

    if (status === 'approved') {
      updateData.brand_approved_at = now;
      updateData.milestone_status = 'approved';
      updateData.status = 'CONTENT_APPROVED';
      updateData.content_approved_at = now;
      updateData.progress_percentage = 95;
      updateData.payout_release_at = calculatePayoutReleaseAt(new Date(now));
      minimalUpdate.status = 'CONTENT_APPROVED';
      minimalUpdate.progress_percentage = 95;
    } else if (status === 'changes_requested') {
      updateData.milestone_status = 'feedback_given';
      // Use a status value that exists in older environments and matches client filters.
      updateData.status = 'Content Making';
      updateData.revision_requested_at = now;
      updateData.progress_percentage = 85;
      minimalUpdate.status = 'Content Making';
      minimalUpdate.progress_percentage = 85;
    } else {
      updateData.milestone_status = 'disputed';
      updateData.status = 'DISPUTED';
      updateData.disputed_at = now;
      updateData.dispute_notes = String(disputeNotes ?? feedback ?? '').trim() || null;
      minimalUpdate.status = 'DISPUTED';
    }

    const { error: updateError } = await supabase.from('brand_deals').update(updateData).eq('id', dealId);
    if (updateError) {
      // Older schemas may not have brand_approval_status / milestone columns. Fall back to a minimal update.
      const { error: fallbackError } = await supabase.from('brand_deals').update(minimalUpdate).eq('id', dealId);
      if (fallbackError) throw fallbackError;
    }

    // Log action
    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: status === 'approved' ? 'CONTENT_APPROVED' : status === 'disputed' ? 'DEAL_DISPUTED' : 'REVISION_REQUESTED',
      metadata: { feedback: feedback ?? null, dispute_notes: updateData.dispute_notes ?? null }
    });

    if (status === 'approved') {
      await recordMarketplaceEvent(supabase, {
        eventName: 'content_approved',
        userId,
        dealId,
        metadata: {
          deal_id: dealId,
        },
      });
    }

    if (status === 'approved') {
      await notifyCreatorForDealEvent('content_approved', {
        ...deal,
        status: 'CONTENT_APPROVED',
      }, {
        approved_at: now,
        feedback: feedback ?? null,
      });
      // Email Creator
      const { data: creator } = await supabase.from('creators').select('email, first_name, username').eq('id', userId).single();
      if (creator) {
        await sendCreatorContentReviewedEmail(creator, { 
          brandName: deal.brand_name, 
          isApproved: true, 
          feedback: feedback || 'Looks good! Proceeding to payment.',
          dealId: dealId
        });
      }
    } else if (status === 'changes_requested') {
      await notifyCreatorForDealEvent('revision_requested', {
        ...deal,
        status: 'REVISION_REQUESTED',
      }, {
        revision_requested_at: now,
        feedback: feedback ?? null,
      });
      // Email Creator
      const { data: creator } = await supabase.from('creators').select('email, first_name, username').eq('id', userId).single();
      if (creator) {
        await sendCreatorContentReviewedEmail(creator, { 
          brandName: deal.brand_name, 
          isApproved: false, 
          feedback: feedback || 'Please review the brief and make necessary adjustments.',
          dealId: dealId
        });
      }
    }

    return res.json({
      success: true,
      message: status === 'approved' ? 'Content approved' : status === 'disputed' ? 'Issue raised' : 'Changes requested',
      status: status
    });
  } catch (error: any) {
    console.error('[Deals] review-content error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:id/release-payment
 * Brand releases payment after content approval.
 */
router.patch('/:id/release-payment', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;
    const userEmail = String(req.user?.email || '').toLowerCase() || null;
    const role = String(req.user?.role || '').toLowerCase();

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (role !== 'brand' && role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brand access required' });
    }

    const { deal, error: dealError } = await fetchDealForBrandMutation(dealId);

    if (dealError || !deal) {
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const dealBrandEmail = String((deal as any).brand_email || '').toLowerCase() || null;
    const hasAccess =
      String((deal as any).brand_id || '') === String(userId) ||
      (!!userEmail && !!dealBrandEmail && userEmail === dealBrandEmail) ||
      role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const normalizeStatus = (raw: any) => String(raw || '').trim().toUpperCase().replaceAll(' ', '_');
    const current = normalizeStatus((deal as any).status);
    if (!inferRequiresPayment(deal)) {
      return res.status(409).json({ success: false, error: 'This deal does not require creator payment.' });
    }
    if (current !== 'CONTENT_APPROVED') {
      return res.status(409).json({ success: false, error: `Payment can be released only after approval. Current: ${current || 'UNKNOWN'}.` });
    }

    const paymentReference = String(req.body?.paymentReference || req.body?.utrNumber || '').trim();
    const paymentProofUrl = String(req.body?.paymentProofUrl || '').trim() || null;
    const paymentNotes = String(req.body?.paymentNotes || '').trim() || null;

    if (!paymentReference) {
      return res.status(400).json({ success: false, error: 'Payment reference is required before release.' });
    }

    const now = new Date().toISOString();
    const fullUpdate: any = {
      status: 'PAYMENT_RELEASED',
      payment_released_at: now,
      utr_number: paymentReference,
      updated_at: now,
    };
    const minimalUpdate: any = {
      status: 'PAYMENT_RELEASED',
      payment_released_at: now,
      updated_at: now,
    };

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update(fullUpdate)
      .eq('id', dealId);

    if (updateError) {
      const { error: fallbackError } = await supabase
        .from('brand_deals')
        .update(minimalUpdate)
        .eq('id', dealId);
      if (fallbackError) throw fallbackError;
    }

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'PAYMENT_RELEASED',
      metadata: {
        released_at: now,
        payment_reference: paymentReference,
        payment_proof_url: paymentProofUrl,
        payment_notes: paymentNotes,
      },
    }).then(({ error }) => {
      if (error) console.warn('[Deals] release-payment action log failed:', error.message);
    });

    await recordMarketplaceEvent(supabase, {
      eventName: 'payment_marked',
      userId,
      dealId,
      metadata: {
        deal_id: dealId,
        amount: (deal as any).deal_amount || 0,
      },
    });

    await notifyCreatorForDealEvent('payment_marked', {
      ...deal,
      status: 'PAYMENT_RELEASED',
    }, {
      payment_reference: paymentReference,
      payment_proof_url: paymentProofUrl,
      payment_notes: paymentNotes,
    });

    return res.json({
      success: true,
      message: 'Payment released.',
      payment_reference: paymentReference,
      payment_proof_url: paymentProofUrl,
      payment_notes: paymentNotes,
    });
  } catch (error: any) {
    console.error('[Deals] release-payment error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:id/confirm-payment-received
 * Creator confirms payment has been received after the brand releases it.
 */
router.patch('/:id/confirm-payment-received', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;
    const role = String(req.user?.role || '').toLowerCase();

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (role !== 'creator' && role !== 'admin' && role !== 'client') {
      return res.status(403).json({ success: false, error: 'Creator access required' });
    }

    const { deal, error: dealError } = await fetchDealForCreatorMutation(dealId);
    if (dealError || !deal) {
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const creatorId = String((deal as any).creator_id || '');
    if (role !== 'admin' && creatorId !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const normalizeStatus = (raw: any) => String(raw || '').trim().toUpperCase().replaceAll(' ', '_');
    const current = normalizeStatus((deal as any).status);
    if (!inferRequiresPayment(deal)) {
      return res.status(409).json({ success: false, error: 'This deal does not require creator payment.' });
    }
    if (current !== 'PAYMENT_RELEASED') {
      return res.status(409).json({ success: false, error: `Payment can be confirmed only after brand releases it. Current: ${current || 'UNKNOWN'}.` });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        status: 'PAYMENT_RECEIVED',
        payment_received_date: now,
        updated_at: now,
      } as any)
      .eq('id', dealId);
    if (updateError) throw updateError;

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'PAYMENT_CONFIRMED',
      metadata: {
        confirmed_at: now,
      },
    }).then(({ error }) => {
      if (error) console.warn('[Deals] confirm-payment-received action log failed:', error.message);
    });

    return res.json({ success: true, message: 'Payment confirmed.', payment_received_date: now });
  } catch (error: any) {
    console.error('[Deals] confirm-payment-received error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:id/unconfirm-payment-received
 * Creator can undo a mistaken confirmation (simple revert to PAYMENT_RELEASED).
 */
router.patch('/:id/unconfirm-payment-received', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;
    const role = String(req.user?.role || '').toLowerCase();

    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
    if (role !== 'creator' && role !== 'admin' && role !== 'client') {
      return res.status(403).json({ success: false, error: 'Creator access required' });
    }

    const { deal, error: dealError } = await fetchDealForCreatorMutation(dealId);
    if (dealError || !deal) { console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' }); }

    const creatorId = String((deal as any).creator_id || '');
    if (role !== 'admin' && creatorId !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const normalizeStatus = (raw: any) => String(raw || '').trim().toUpperCase().replaceAll(' ', '_');
    const current = normalizeStatus((deal as any).status);
    if (current !== 'PAYMENT_RECEIVED') {
      return res.status(409).json({ success: false, error: `Nothing to undo. Current: ${current || 'UNKNOWN'}.` });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        status: 'PAYMENT_RELEASED',
        payment_received_date: null,
        updated_at: now,
      } as any)
      .eq('id', dealId);
    if (updateError) throw updateError;

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'PAYMENT_CONFIRM_UNDONE',
      metadata: { undone_at: now },
    }).then(({ error }) => {
      if (error) console.warn('[Deals] unconfirm-payment-received action log failed:', error.message);
    });

    return res.json({ success: true, message: 'Payment confirmation undone.' });
  } catch (error: any) {
    console.error('[Deals] unconfirm-payment-received error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

/**
 * PATCH /api/deals/:id/mark-complete
 * Brand manually marks a collaboration as completed from the dashboard.
 */
router.patch('/:id/mark-complete', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealId = req.params.id;
    const userId = req.user?.id;
    const userEmail = String(req.user?.email || '').toLowerCase() || null;
    const role = String(req.user?.role || '').toLowerCase();

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (role !== 'brand' && role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brand access required' });
    }

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('id, status, brand_address, brand_phone, contact_person, brand_id, brand_email, deal_type, deal_amount, shipping_required, shipping_status')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      console.warn('[Deals] 404 Deal not found:', dealId); return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    const dealBrandEmail = String(deal.brand_email || '').toLowerCase() || null;
    const hasAccess =
      String(deal.brand_id || '') === String(userId) ||
      (!!userEmail && !!dealBrandEmail && userEmail === dealBrandEmail) ||
      role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const normalizedCurrent = String(deal.status || '').trim().toUpperCase().replaceAll(' ', '_');
    if (normalizedCurrent === 'COMPLETED') {
      return res.json({ success: true, alreadyCompleted: true, message: 'Deal already marked complete.' });
    }

    const requiresPayment = inferRequiresPayment(deal);
    const requiresShipping = inferRequiresShipping(deal);
    const shippingDone = ['DELIVERED', 'RECEIVED'].includes(normalizeStatus((deal as any).shipping_status));
    const paymentDone = !requiresPayment || normalizedCurrent === 'PAYMENT_RELEASED';
    const contentDone = requiresPayment ? normalizedCurrent === 'PAYMENT_RELEASED' : normalizedCurrent === 'CONTENT_APPROVED';

    if (role !== 'admin') {
      if (!contentDone) {
        return res.status(409).json({ success: false, error: `Deal can be completed only after content approval and required obligations are done. Current: ${normalizedCurrent || 'UNKNOWN'}.` });
      }
      if (requiresShipping && !shippingDone) {
        return res.status(409).json({ success: false, error: 'Deal can be completed only after shipping is delivered.' });
      }
      if (!paymentDone) {
        return res.status(409).json({ success: false, error: `Deal can be completed only after payment release. Current: ${normalizedCurrent || 'UNKNOWN'}.` });
      }
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        status: 'COMPLETED',
        updated_at: now,
      } as any)
      .eq('id', dealId);

    if (updateError) {
      throw updateError;
    }

    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      user_id: userId,
      event: 'DEAL_MARKED_COMPLETE_BY_BRAND',
      metadata: {
        completed_at: now,
        source: 'brand_dashboard',
      },
    }).then(({ error }) => {
      if (error) console.warn('[Deals] mark-complete action log failed:', error.message);
    });

    await recordMarketplaceEvent(supabase, {
      eventName: 'deal_completed',
      userId,
      dealId,
      metadata: {
        deal_id: dealId,
        deal_value: (deal as any).deal_amount || 0,
      },
    });

    return res.json({ success: true, message: 'Deal marked as completed.' });
  } catch (error: any) {
    console.error('[Deals] mark-complete error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

// Debug route to test routing
router.get('/test-routing', (req, res) => {
  console.log('[Deals] Test routing endpoint hit');
  res.json({ success: true, message: 'Deals router is working', timestamp: new Date().toISOString() });
});

export default router;
