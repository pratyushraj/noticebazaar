// @ts-nocheck
// Collaboration Request Link API Routes
// Handles public collab link submissions and creator management

import express, { Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { supabase, supabaseInitialized } from '../lib/supabase.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { generateContractFromScratch } from '../services/contractGenerator.js';
import { createContractReadyToken } from '../services/contractReadyTokenService.js';
import {
  sendCollabRequestSubmissionEmail,
  sendCollabRequestAcceptedEmail,
  sendCollabRequestCounterEmail,
  sendCollabRequestDeclinedEmail,
  sendCollabRequestCreatorNotificationEmail,
  sendCollabAcceptMagicLinkEmail,
  sendCollabDraftResumeEmail,
  sendCollabLeadCapturedAlertEmail,
} from '../services/collabRequestEmailService.js';
import { resolveOrCreateBrandContact } from '../services/brandContactService.js';
import { estimateBarterValueRange, estimateReelBudgetRange, estimateReelRate, getEffectiveReelRate } from '../services/creatorRateService.js';
import { fetchInstagramPublicData } from '../services/instagramService.js';
import { notifyCreatorOnCollabRequestCreated } from '../services/pushNotificationService.js';

const router = express.Router();

// Multer for optional barter product image (in-memory, max 5MB; mimetype validated in handler)
const barterImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

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

type CollabTypeValue = 'paid' | 'barter' | 'hybrid' | 'both';

const normalizeCollabTypeForDb = (value: unknown): 'paid' | 'barter' | 'both' | null => {
  if (value === 'hybrid' || value === 'both') return 'both';
  if (value === 'paid' || value === 'barter') return value;
  return null;
};

const normalizeCollabTypeForApi = (value: unknown): CollabTypeValue | null => {
  if (value === 'both') return 'hybrid';
  if (value === 'paid' || value === 'barter' || value === 'hybrid') return value;
  return null;
};

const isPaidLikeCollab = (value: unknown): boolean => {
  const normalized = normalizeCollabTypeForDb(value);
  return normalized === 'paid' || normalized === 'both';
};

const isBarterLikeCollab = (value: unknown): boolean => {
  const normalized = normalizeCollabTypeForDb(value);
  return normalized === 'barter' || normalized === 'both';
};

const normalizeHandle = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace(/^@+/, '');
  return normalized.length > 0 ? normalized : null;
};

const normalizeImageUrl = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/\\\//g, '/')
    .trim();
};

const getCollabLeadAlertEmail = (): string => {
  const configured = process.env.COLLAB_LEADS_ALERT_EMAIL || process.env.INTERNAL_LEADS_EMAIL;
  return (configured && configured.trim()) || 'support@creatorarmour.com';
};

const NON_REGISTERED_IG_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const NON_REGISTERED_IG_CACHE = new Map<string, { fetchedAt: number; data: Awaited<ReturnType<typeof fetchInstagramPublicData>> }>();
const PRIMARY_UNCLAIMED_REQUESTS_TABLE = 'unclaimed_collab_requests';
const LEGACY_LEADS_TABLE = 'collab_request_leads';
const LEAD_SOURCE_TABLES = [PRIMARY_UNCLAIMED_REQUESTS_TABLE, LEGACY_LEADS_TABLE];

const isMissingTableError = (error: any): boolean => {
  if (!error) return false;
  return error.code === '42P01' || /relation .* does not exist/i.test(error.message || '');
};

const isMissingColumnError = (error: any): boolean => {
  if (!error) return false;
  return error.code === '42703' || /column .* does not exist/i.test(error.message || '');
};

const isUpstreamConnectivityError = (error: any): boolean => {
  if (!error) return false;
  const haystack = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return (
    haystack.includes('fetch failed')
    || haystack.includes('connect timeout')
    || haystack.includes('und_err_connect_timeout')
    || haystack.includes('etimedout')
    || haystack.includes('enotfound')
    || haystack.includes('econnreset')
  );
};

const getCachedInstagramPublicData = async (handle: string) => {
  const normalized = normalizeHandle(handle);
  if (!normalized) return null;

  const cached = NON_REGISTERED_IG_CACHE.get(normalized);
  if (cached && (Date.now() - cached.fetchedAt) < NON_REGISTERED_IG_CACHE_TTL_MS) {
    return cached.data;
  }

  const fresh = await fetchInstagramPublicData(normalized);
  NON_REGISTERED_IG_CACHE.set(normalized, { fetchedAt: Date.now(), data: fresh });
  return fresh;
};

const startRegisteredCreatorBackgroundSync = (profile: any) => {
  if (!profile?.id || !profile?.instagram_handle) return;

  const existingFollowers = profile.instagram_followers;
  const existingPhoto = profile.instagram_profile_photo;
  const lastSync = profile.last_instagram_sync
    ? new Date(profile.last_instagram_sync).getTime()
    : 0;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const isStale = !lastSync || (Date.now() - lastSync) > sevenDaysMs;
  const shouldSync = isStale || !existingFollowers || !existingPhoto;
  if (!shouldSync) return;

  setTimeout(async () => {
    try {
      const instaData = await fetchInstagramPublicData(profile.instagram_handle as string);
      if (!instaData) return;

      const updatePayload: Record<string, unknown> = {
        last_instagram_sync: new Date().toISOString(),
      };
      if (typeof instaData.followers === 'number') updatePayload.instagram_followers = instaData.followers;
      if (instaData.profile_photo) updatePayload.instagram_profile_photo = instaData.profile_photo;
      // Optional enrichment: only backfill bio if creator hasn't set one already.
      if (!profile.bio && instaData.bio) updatePayload.bio = instaData.bio;

      await supabase
        .from('profiles')
        .update(updatePayload as any)
        .eq('id', profile.id);
    } catch (syncError: any) {
      console.warn('[CollabRequests] Background Instagram sync skipped:', syncError?.message || syncError);
    }
  }, 0);
};

const insertUnclaimedCollabRequest = async (payload: Record<string, unknown>) => {
  const insertOrder = [PRIMARY_UNCLAIMED_REQUESTS_TABLE, LEGACY_LEADS_TABLE];
  let lastError: any = null;

  for (const table of insertOrder) {
    const { data, error } = await supabase
      .from(table)
      .insert(payload as any)
      .select('id, created_at')
      .single();

    if (!error && data) {
      return { record: data, table };
    }

    if (isMissingTableError(error) || isMissingColumnError(error)) {
      lastError = error;
      continue;
    }

    throw error;
  }

  throw lastError || new Error('No lead table available for unclaimed collab requests');
};

async function attachPendingCollabLeadsForCreator(creatorId: string): Promise<{ attached: number; failed: number }> {
  if (!creatorId) return { attached: 0, failed: 0 };

  const { data: creatorProfile } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, business_name, username, instagram_handle, creator_category, avatar_url, instagram_followers, youtube_subs, tiktok_followers, twitter_followers')
    .eq('id', creatorId)
    .maybeSingle();

  if (!creatorProfile) return { attached: 0, failed: 0 };

  const handleSet = new Set<string>();
  const usernameHandle = normalizeHandle((creatorProfile as any).username);
  const instagramHandle = normalizeHandle((creatorProfile as any).instagram_handle);
  if (usernameHandle) handleSet.add(usernameHandle);
  if (instagramHandle) handleSet.add(instagramHandle);
  if (handleSet.size === 0) return { attached: 0, failed: 0 };

  const handles = Array.from(handleSet);
  const collectedLeads: Array<any> = [];

  for (const table of LEAD_SOURCE_TABLES) {
    const { data: leads, error: leadFetchError } = await supabase
      .from(table)
      .select('*')
      .in('target_handle', handles)
      .in('status', ['pending', 'failed'])
      .order('created_at', { ascending: true })
      .limit(100);

    if (leadFetchError) {
      if (isMissingTableError(leadFetchError)) continue;
      console.warn('[CollabRequests] Failed to fetch attachable leads from table:', table, leadFetchError.message);
      continue;
    }

    if (Array.isArray(leads) && leads.length > 0) {
      collectedLeads.push(
        ...leads.map((lead) => ({ ...lead, __source_table: table })),
      );
    }
  }

  const leads = collectedLeads
    .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
    .slice(0, 100);

  if (leads.length === 0) {
    return { attached: 0, failed: 0 };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
  const creatorName = (creatorProfile as any).business_name
    || `${(creatorProfile as any).first_name || ''} ${(creatorProfile as any).last_name || ''}`.trim()
    || 'Creator';

  let creatorEmail: string | null = null;
  try {
    const { data: authUser } = await supabase.auth.admin.getUserById(creatorId);
    creatorEmail = authUser?.user?.email || null;
  } catch (error) {
    console.warn('[CollabRequests] Failed to fetch creator email for lead attachment notifications:', error);
  }

  let attached = 0;
  let failed = 0;

  for (const lead of leads) {
    try {
      const claimTime = new Date().toISOString();
      const leadSourceTable = lead.__source_table || LEGACY_LEADS_TABLE;
      const { data: claimedLead, error: claimError } = await supabase
        .from(leadSourceTable)
        .update({ status: 'processing', updated_at: claimTime, last_error: null })
        .eq('id', lead.id)
        .in('status', ['pending', 'failed'])
        .select('*')
        .maybeSingle();

      if (claimError || !claimedLead) continue;

      const collabTypeForDb = normalizeCollabTypeForDb(claimedLead.collab_type) || 'paid';
      const collabTypeForApi = normalizeCollabTypeForApi(claimedLead.collab_type) || collabTypeForDb;

      const brandContactId = await resolveOrCreateBrandContact({
        legalName: claimedLead.brand_name || '',
        email: claimedLead.brand_email || '',
        phone: claimedLead.brand_phone || null,
        website: claimedLead.brand_website || null,
        instagram: claimedLead.brand_instagram || null,
        address: claimedLead.brand_address || null,
        gstin: claimedLead.brand_gstin || null,
      });

      const insertData: any = {
        creator_id: creatorId,
        source_lead_id: claimedLead.id,
        brand_name: claimedLead.brand_name,
        brand_email: claimedLead.brand_email,
        brand_address: claimedLead.brand_address || null,
        brand_gstin: claimedLead.brand_gstin || null,
        brand_phone: claimedLead.brand_phone || null,
        brand_website: claimedLead.brand_website || null,
        brand_instagram: claimedLead.brand_instagram || null,
        collab_type: collabTypeForDb,
        budget_range: claimedLead.budget_range || null,
        exact_budget: claimedLead.exact_budget || null,
        barter_description: claimedLead.barter_description || null,
        barter_value: claimedLead.barter_value || null,
        barter_product_image_url: claimedLead.barter_product_image_url || null,
        campaign_description: claimedLead.campaign_description,
        deliverables: claimedLead.deliverables || [],
        usage_rights: claimedLead.usage_rights === true,
        deadline: claimedLead.deadline || null,
        submitted_ip: claimedLead.submitted_ip || null,
        submitted_user_agent: claimedLead.submitted_user_agent || null,
        ...(brandContactId ? { brand_contact_id: brandContactId } : {}),
      };

      let requestId: string | null = null;
      const { data: insertedRequest, error: insertError } = await supabase
        .from('collab_requests')
        .insert(insertData)
        .select('id')
        .maybeSingle();

      if (insertError) {
        const isDuplicateSourceLead = insertError.code === '23505' || /source_lead_id/i.test(insertError.message || '');
        if (isDuplicateSourceLead) {
          const { data: existingRequest } = await supabase
            .from('collab_requests')
            .select('id')
            .eq('source_lead_id', claimedLead.id)
            .maybeSingle();
          requestId = existingRequest?.id || null;
        } else {
          throw insertError;
        }
      } else {
        requestId = insertedRequest?.id || null;
      }

      if (!requestId) {
        throw new Error('Failed to create request from lead');
      }

      const nowIso = new Date().toISOString();
      await supabase
        .from(leadSourceTable)
        .update({
          status: 'attached',
          attached_creator_id: creatorId,
          converted_request_id: requestId,
          attached_at: nowIso,
          updated_at: nowIso,
          last_error: null,
        })
        .eq('id', claimedLead.id);

      try {
        await supabase.from('notifications').insert({
          user_id: creatorId,
          type: 'deal',
          category: 'collab_request',
          title: `New collaboration request from ${claimedLead.brand_name}`,
          message: 'A request submitted before your onboarding is now attached to your account.',
          data: {
            collab_request_id: requestId,
            brand_name: claimedLead.brand_name,
            collab_type: collabTypeForApi,
            source: 'attached_lead',
          },
          link: `${frontendUrl}/creator-dashboard`,
          priority: 'high',
          icon: 'collab_request',
          action_label: 'Review Request',
          action_link: `${frontendUrl}/creator-dashboard`,
        });
      } catch (notificationError) {
        console.warn('[CollabRequests] Failed to create notification for attached lead (non-fatal):', notificationError);
      }

      if (creatorEmail) {
        const deliverablesArray = Array.isArray(claimedLead.deliverables) ? claimedLead.deliverables : [];
        let totalFollowers = 0;
        if ((creatorProfile as any)?.instagram_followers) totalFollowers += (creatorProfile as any).instagram_followers;
        if ((creatorProfile as any)?.youtube_subs) totalFollowers += (creatorProfile as any).youtube_subs;
        if ((creatorProfile as any)?.tiktok_followers) totalFollowers += (creatorProfile as any).tiktok_followers;
        if ((creatorProfile as any)?.twitter_followers) totalFollowers += (creatorProfile as any).twitter_followers;

        sendCollabRequestCreatorNotificationEmail(creatorEmail, {
          creatorName,
          creatorCategory: (creatorProfile as any)?.creator_category || undefined,
          followerCount: totalFollowers > 0 ? totalFollowers : undefined,
          avatarUrl: (creatorProfile as any)?.avatar_url || undefined,
          brandName: claimedLead.brand_name,
          brandWebsite: claimedLead.brand_website || undefined,
          campaignGoal: claimedLead.campaign_description || undefined,
          collabType: collabTypeForApi,
          budgetRange: claimedLead.budget_range || undefined,
          exactBudget: claimedLead.exact_budget ?? undefined,
          barterDescription: claimedLead.barter_description || undefined,
          barterValue: claimedLead.barter_value ?? undefined,
          barterProductImageUrl: claimedLead.barter_product_image_url || undefined,
          deliverables: deliverablesArray,
          deadline: claimedLead.deadline || undefined,
          timeline: claimedLead.deadline || undefined,
          requestId,
          acceptUrl: `${frontendUrl}/collab-requests`,
        }, creatorId).catch((emailError) => {
          console.warn('[CollabRequests] Failed to send creator email for attached lead (non-fatal):', emailError);
        });
      }

      attached += 1;
    } catch (error: any) {
      failed += 1;
      const lastError = error?.message ? String(error.message).slice(0, 500) : 'Unknown attachment error';
      await supabase
        .from(lead.__source_table || LEGACY_LEADS_TABLE)
        .update({ status: 'failed', last_error: lastError, updated_at: new Date().toISOString() })
        .eq('id', lead.id);
      console.error('[CollabRequests] Failed attaching lead:', lead.id, error);
    }
  }

  return { attached, failed };
}

// ============================================================================
// PUBLIC ROUTES (No auth required)
// ============================================================================

/**
 * GET /api/collab/:username/resume?token=xxx
 * Load draft form data for "Save and continue later" (no auth)
 */
router.get('/:username/resume', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';
    if (!username || !token) {
      return res.status(400).json({ success: false, error: 'Username and token are required' });
    }
    // collab_request_drafts table is missing in production schema
    /*
    const { data: draft, error: draftError } = await supabase
      .from('collab_request_drafts')
      .select('form_data, expires_at, creator_username')
      .eq('resume_token', token)
      .eq('creator_username', username.toLowerCase().trim())
      .maybeSingle();
    if (draftError) {
      console.error('[CollabRequests] Draft fetch error:', draftError);
      return res.status(500).json({ success: false, error: 'Failed to load draft' });
    }
    if (!draft) {
      return res.status(404).json({ success: false, error: 'Draft not found or link expired' });
    }
    const expiresAt = new Date(draft.expires_at);
    if (expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ success: false, error: 'This link has expired' });
    }
    return res.json({
      success: true,
      formData: draft.form_data || {},
    });
    */
    console.warn('[CollabRequests] Resume draft feature disabled: collab_request_drafts table missing');
    return res.status(501).json({ success: false, error: 'Drafts are currently disabled' });
  } catch (e) {
    console.error('[CollabRequests] Resume draft error:', e);
    return res.status(500).json({ success: false, error: 'Failed to load draft' });
  }
});

/**
 * POST /api/collab/:username/save-draft
 * Save form draft and send "Continue later" email (no auth)
 */
router.post('/:username/save-draft', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const { email, formData } = req.body || {};
    if (!username || username.trim() === '') {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }
    const emailStr = typeof email === 'string' ? email.trim() : '';
    if (!emailStr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      return res.status(400).json({ success: false, error: 'Valid email is required' });
    }
    const payload = typeof formData === 'object' && formData !== null ? formData : {};
    const resumeToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const normalizedUsername = username.toLowerCase().trim();
    // collab_request_drafts table is missing in production schema
    /*
    const { error: insertError } = await supabase
      .from('collab_request_drafts')
      .insert({
        creator_username: normalizedUsername,
        brand_email: emailStr,
        form_data: payload,
        resume_token: resumeToken,
        expires_at: expiresAt.toISOString(),
      });
    if (insertError) {
      console.error('[CollabRequests] Save draft error:', insertError);
      return res.status(500).json({ success: false, error: 'Failed to save draft' });
    }
    */
    console.warn('[CollabRequests] Save draft feature disabled: collab_request_drafts table missing');
    return res.status(501).json({ success: false, error: 'Drafts are currently disabled' });

    const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
    const resumeUrl = `${frontendUrl}/collab/${encodeURIComponent(normalizedUsername)}?resume=${encodeURIComponent(resumeToken)}`;

    let creatorName = 'the creator';
    const profileRes = await supabase
      .from('profiles')
      .select('first_name, last_name, business_name')
      .or(`username.eq.${normalizedUsername},instagram_handle.eq.${normalizedUsername}`)
      .eq('role', 'creator')
      .maybeSingle();
    if (profileRes.data) {
      const p = profileRes.data as any;
      creatorName = p.business_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'the creator';
    }

    const emailResult = await sendCollabDraftResumeEmail(emailStr, creatorName, resumeUrl);
    if (!emailResult.success) {
      console.error('[CollabRequests] Draft resume email failed:', emailResult.error);
    }

    return res.json({
      success: true,
      message: 'Check your email for a link to continue your request.',
    });
  } catch (e) {
    console.error('[CollabRequests] Save draft error:', e);
    return res.status(500).json({ success: false, error: 'Failed to save draft' });
  }
});

// ============================================================================
// ACCEPT FROM EMAIL (public routes – must be before /:username)
// ============================================================================

/**
 * GET /api/collab/accept/preview/:requestToken
 * Public: get deal summary for accept-from-email page (no auth)
 */
router.get('/accept/preview/:requestToken', async (req: Request, res: Response) => {
  try {
    const requestToken = typeof req.params.requestToken === 'string' ? req.params.requestToken.trim() : '';
    if (!requestToken) {
      return res.status(400).json({ success: false, error: 'Invalid link' });
    }
    // collab_accept_tokens table is missing in production schema
    /*
    const { data: tokenRow, error: tokenError } = await supabase
      .from('collab_accept_tokens')
      .select('id, collab_request_id, creator_email, expires_at')
      .eq('id', requestToken)
      .maybeSingle();
    if (tokenError || !tokenRow) {
      return res.status(404).json({ success: false, error: 'Invalid link' });
    }
    */
    console.warn('[CollabRequests] Accept link preview disabled: collab_accept_tokens table missing');
    return res.status(404).json({ success: false, error: 'Please log in to your dashboard to handle this request.' });
    const expiresAt = new Date(tokenRow.expires_at);
    if (expiresAt.getTime() < Date.now()) {
      return res.status(410).json({
        success: false,
        error: 'expired',
        message: 'This link has expired',
      });
    }
    const { data: request, error: reqError } = await supabase
      .from('collab_requests')
      .select('id, brand_name, collab_type, exact_budget, barter_value, barter_description, deliverables, deadline, status')
      .eq('id', tokenRow.collab_request_id)
      .maybeSingle();
    if (reqError || !request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(200).json({
        success: true,
        alreadyHandled: true,
        status: request.status,
        message: 'This request has already been handled',
        brand_name: request.brand_name,
        collab_type: normalizeCollabTypeForApi(request.collab_type) || request.collab_type,
        deliverables: request.deliverables || [],
        deadline: request.deadline,
        amount: request.exact_budget ?? request.barter_value ?? null,
      });
    }
    let deliverablesArray: string[] = [];
    try {
      deliverablesArray = Array.isArray(request.deliverables)
        ? request.deliverables
        : typeof request.deliverables === 'string'
          ? JSON.parse(request.deliverables)
          : [];
    } catch {
      deliverablesArray = [];
    }
    const dealType = isBarterLikeCollab(request.collab_type) && !isPaidLikeCollab(request.collab_type) ? 'Barter' : isPaidLikeCollab(request.collab_type) && !isBarterLikeCollab(request.collab_type) ? 'Paid' : 'Paid / Barter';
    const amount = isBarterLikeCollab(request.collab_type) && !isPaidLikeCollab(request.collab_type) ? (request.barter_value ?? null) : (request.exact_budget ?? null);
    return res.json({
      success: true,
      alreadyHandled: false,
      brand_name: request.brand_name,
      collab_type: normalizeCollabTypeForApi(request.collab_type) || request.collab_type,
      deal_type_label: dealType,
      amount,
      deliverables: deliverablesArray,
      deadline: request.deadline,
      creator_email: tokenRow.creator_email,
      expires_at: tokenRow.expires_at,
    });
  } catch (e) {
    console.error('[CollabRequests] Accept preview error:', e);
    return res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

/**
 * POST /api/collab/accept/send-verification
 * Public: send magic link to creator email for soft auth (no login page)
 */
router.post('/accept/send-verification', async (req: Request, res: Response) => {
  try {
    const { requestToken } = req.body || {};
    const tokenStr = typeof requestToken === 'string' ? requestToken.trim() : '';
    if (!tokenStr) {
      return res.status(400).json({ success: false, error: 'Invalid link' });
    }
    // collab_accept_tokens table is missing in production schema
    /*
    const { data: tokenRow, error: tokenError } = await supabase
      .from('collab_accept_tokens')
      .select('id, collab_request_id, creator_email, expires_at')
      .eq('id', tokenStr)
      .maybeSingle();
    if (tokenError || !tokenRow) {
      return res.status(404).json({ success: false, error: 'Invalid link' });
    }
    */
    console.warn('[CollabRequests] Magic link verification disabled: collab_accept_tokens table missing');
    return res.status(404).json({ success: false, error: 'Feature unavailable. Please log in to your dashboard.' });
    const expiresAt = new Date(tokenRow.expires_at);
    if (expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ success: false, error: 'This link has expired' });
    }
    const { data: request } = await supabase
      .from('collab_requests')
      .select('id, status')
      .eq('id', tokenRow.collab_request_id)
      .maybeSingle();
    if (!request || request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'This request has already been handled' });
    }
    const frontendUrl = (process.env.FRONTEND_URL || 'https://creatorarmour.com').replace(/\/$/, '');
    const redirectTo = `${frontendUrl}/collab/accept/${encodeURIComponent(tokenStr)}?verified=true`;
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: tokenRow.creator_email,
      options: { redirectTo },
    });
    const magicLink = (linkData as any)?.properties?.action_link ?? (linkData as any)?.action_link;
    if (linkError || !magicLink) {
      console.error('[CollabRequests] Magic link generate error:', linkError);
      return res.status(500).json({ success: false, error: 'Failed to send verification email' });
    }
    const emailResult = await sendCollabAcceptMagicLinkEmail(tokenRow.creator_email, magicLink);
    if (!emailResult.success) {
      console.error('[CollabRequests] Magic link email failed:', emailResult.error);
      return res.status(500).json({ success: false, error: 'Failed to send verification email' });
    }
    return res.json({ success: true, message: 'Verification link sent to your email' });
  } catch (e) {
    console.error('[CollabRequests] Send verification error:', e);
    return res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

/**
 * GET /api/collab/:username
 * Get creator profile info for collab link landing page
 */
router.get('/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    if (!username || username.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Username is required',
      });
    }

    // Fetch creator profile by username or instagram_handle
    // Check both fields to support legacy usernames and new Instagram handle-based usernames
    const normalizedUsername = username.toLowerCase().trim();

    // Use limit(1) instead of maybeSingle() to avoid 500s on duplicate usernames/handles.
    // Keep the first profile lookup limited to stable columns so one missing optional
    // column in production schema doesn't fail the entire collab page with 500.
    const baseProfileSelect = `
      id,
      first_name,
      last_name,
      business_name,
      instagram_handle,
      bio,
      username
    `;

    const { data: usernameProfiles, error: usernameError } = await supabase
      .from('profiles')
      .select(baseProfileSelect)
      .eq('username', normalizedUsername)
      .eq('role', 'creator')
      .limit(1);

    let profile = (usernameProfiles && usernameProfiles.length > 0) ? usernameProfiles[0] : null;
    let profileError = usernameError;

    // If not found by username, try instagram_handle
    if (!profile && !profileError) {
      const { data: instagramProfiles, error: instagramError } = await supabase
        .from('profiles')
        .select(baseProfileSelect)
        .eq('instagram_handle', normalizedUsername)
        .eq('role', 'creator')
        .limit(1);

      profile = (instagramProfiles && instagramProfiles.length > 0) ? instagramProfiles[0] : null;
      profileError = instagramError;
    }

    // If profile found, fetch additional optional columns separately (to handle missing columns gracefully)
    if (profile && !profileError) {
      const { data: extendedProfile } = await supabase
        .from('profiles')
        .select(`
          creator_category,
          audience_gender_split,
          top_cities,
          audience_age_range,
          primary_audience_language,
          posting_frequency,
          youtube_channel_id,
          tiktok_handle,
          twitter_handle,
          facebook_profile_url,
          instagram_followers,
          instagram_profile_photo,
          last_instagram_sync,
          youtube_subs,
          tiktok_followers,
          twitter_followers,
          facebook_followers,
          open_to_collabs,
          content_niches,
          media_kit_url,
          avg_rate_reel,
          avg_reel_views_manual,
          avg_likes_manual,
          active_brand_collabs_month,
          campaign_slot_note,
          collab_brands_count_override,
          collab_response_hours_override,
          collab_cancellations_percent_override,
          collab_region_label,
          collab_audience_fit_note,
          collab_recent_activity_note,
          collab_audience_relevance_note,
          collab_delivery_reliability_note,
          collab_engagement_confidence_note,
          collab_response_behavior_note,
          collab_cta_trust_note,
          collab_cta_dm_note,
          collab_cta_platform_note,
          learned_avg_rate_reel,
          learned_deal_count
      `)
        .eq('id', profile.id)
        .maybeSingle();

      // Merge extended data if available (ignore errors for missing columns)
      if (extendedProfile) {
        profile = { ...profile, ...extendedProfile };
      }

      // Fetch optional trust arrays separately so older schemas don't break the main extended select.
      const { data: trustArraysProfile } = await supabase
        .from('profiles')
        .select('past_brands, recent_campaign_types')
        .eq('id', profile.id)
        .maybeSingle();

      if (trustArraysProfile) {
        const nextProfile: Record<string, unknown> = { ...profile };
        if (Array.isArray((trustArraysProfile as any).past_brands)) {
          nextProfile.past_brands = (trustArraysProfile as any).past_brands;
        }
        if (Array.isArray((trustArraysProfile as any).recent_campaign_types)) {
          nextProfile.recent_campaign_types = (trustArraysProfile as any).recent_campaign_types;
        }
        profile = nextProfile as typeof profile;
      }
    }

    if (profileError) {
      console.error('[CollabRequests] Error fetching creator:', profileError);
      console.error('[CollabRequests] Error code:', profileError.code);
      console.error('[CollabRequests] Error message:', profileError.message);
      console.error('[CollabRequests] Error details:', JSON.stringify(profileError, null, 2));
      console.error('[CollabRequests] Username searched:', username.toLowerCase().trim());
      console.error('[CollabRequests] Supabase client initialized:', supabaseInitialized);

      if (isUpstreamConnectivityError(profileError)) {
        return res.status(503).json({
          success: false,
          error: 'Creator profile service temporarily unavailable',
          code: 'UPSTREAM_CONNECTIVITY_ISSUE',
          message: 'Unable to reach profile data provider from this network. Please retry shortly.',
        });
      }

      // Return more detailed error (always include in dev, optional in prod)
      const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch creator profile',
        details: isDev ? {
          message: profileError.message,
          code: profileError.code,
          hint: profileError.hint,
          details: profileError.details,
          fullError: JSON.stringify(profileError, null, 2),
        } : {
          code: profileError.code,
          message: profileError.message,
        },
      });
    }

    if (!profile) {
      console.log('[CollabRequests] Creator not found in profiles table, trying Instagram fallback for username:', normalizedUsername);

      let instagramData: Awaited<ReturnType<typeof fetchInstagramPublicData>> = null;
      try {
        instagramData = await getCachedInstagramPublicData(normalizedUsername);
      } catch (fallbackError: any) {
        console.warn('[CollabRequests] Instagram fallback failed:', fallbackError?.message || fallbackError);
      }

      const suggestedReelRate = estimateReelRate(instagramData?.followers ?? 0);
      const suggestedPaidRange = estimateReelBudgetRange(suggestedReelRate);
      const suggestedBarterRange = estimateBarterValueRange(suggestedReelRate);
      const fallbackName = (instagramData?.full_name && instagramData.full_name.trim()) || normalizedUsername
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ') || normalizedUsername;

      let performanceProof: Record<string, unknown> | null = null;
      try {
        const { data: latestSnapshot } = await supabase
          .from('instagram_performance_snapshots')
          .select('engagement_rate, median_reel_views, avg_likes, avg_comments, avg_saves, avg_shares, sample_size, data_quality, captured_at')
          .eq('ig_username', normalizedUsername)
          .order('captured_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestSnapshot) {
          performanceProof = {
            engagement_rate: (latestSnapshot as any).engagement_rate,
            median_reel_views: (latestSnapshot as any).median_reel_views,
            avg_likes: (latestSnapshot as any).avg_likes,
            avg_comments: (latestSnapshot as any).avg_comments,
            avg_saves: (latestSnapshot as any).avg_saves,
            avg_shares: (latestSnapshot as any).avg_shares,
            sample_size: (latestSnapshot as any).sample_size,
            data_quality: (latestSnapshot as any).data_quality || 'limited',
            captured_at: (latestSnapshot as any).captured_at,
          };
        }
      } catch {
        // No-op: table may not exist before migration.
      }

      return res.json({
        success: true,
        creator: {
          id: `instagram:${normalizedUsername}`,
          is_registered: false,
          profile_type: 'public',
          profile_label: 'Public Creator Profile',
          submission_flow: 'lead_capture',
          name: fallbackName,
          username: normalizedUsername,
          category: null,
          platforms: [
            {
              name: 'Instagram',
              handle: normalizedUsername,
              followers: instagramData?.followers ?? undefined,
            },
          ],
          suggested_reel_rate: suggestedReelRate,
          suggested_paid_range_min: suggestedPaidRange.min,
          suggested_paid_range_max: suggestedPaidRange.max,
          suggested_barter_value_min: suggestedBarterRange.min,
          suggested_barter_value_max: suggestedBarterRange.max,
          profile_photo: normalizeImageUrl(instagramData?.profile_photo) || null,
          followers: instagramData?.followers ?? null,
          last_instagram_sync: new Date().toISOString(),
          bio: instagramData?.bio || null,
          open_to_collabs: true,
          content_niches: [],
          media_kit_url: null,
          audience_gender_split: null,
          top_cities: [],
          audience_age_range: null,
          primary_audience_language: null,
          posting_frequency: null,
          past_brands: [],
          recent_campaign_types: [],
          avg_reel_views: (performanceProof as any)?.median_reel_views ?? null,
          avg_likes: (performanceProof as any)?.avg_likes ?? null,
          past_brand_count: 0,
          performance_proof: performanceProof,
          trust_stats: {
            brands_count: 0,
            completed_deals: 0,
            total_deals: 0,
            completion_rate: null,
            avg_response_hours: null,
          },
        },
      });
    }

    // Background enrichment only: never blocks rendering of registered creator profile.
    startRegisteredCreatorBackgroundSync(profile);

    // Build platforms array (handle missing columns gracefully)
    const platforms: Array<{ name: string; handle: string; followers?: number }> = [];
    const p = profile as any; // Use type assertion to access potentially missing columns
    let resolvedInstagramFollowers: number | null = typeof p.instagram_followers === 'number'
      ? p.instagram_followers
      : null;
    let resolvedProfilePhoto: string | null = normalizeImageUrl(p.instagram_profile_photo) || null;
    let resolvedBio: string | null = profile.bio || null;

    // If public Instagram data is missing in DB, fetch a cached public fallback for better collab-page UX.
    if (profile.instagram_handle && (resolvedInstagramFollowers === null || !resolvedProfilePhoto || !resolvedBio)) {
      try {
        const instagramData = await getCachedInstagramPublicData(profile.instagram_handle);
        if (resolvedInstagramFollowers === null && typeof instagramData?.followers === 'number') {
          resolvedInstagramFollowers = instagramData.followers;
        }
        if (!resolvedProfilePhoto && instagramData?.profile_photo) {
          resolvedProfilePhoto = normalizeImageUrl(instagramData.profile_photo);
        }
        if (!resolvedBio && instagramData?.bio) {
          resolvedBio = instagramData.bio;
        }
      } catch (fallbackError: any) {
        console.warn('[CollabRequests] Registered creator Instagram fallback skipped:', fallbackError?.message || fallbackError);
      }
    }

    if (profile.instagram_handle) {
      platforms.push({
        name: 'Instagram',
        handle: profile.instagram_handle,
        followers: resolvedInstagramFollowers ?? undefined,
      });
    }
    if (p.youtube_channel_id) {
      platforms.push({
        name: 'YouTube',
        handle: p.youtube_channel_id,
        followers: p.youtube_subs || undefined,
      });
    }
    if (p.tiktok_handle) {
      platforms.push({
        name: 'TikTok',
        handle: p.tiktok_handle,
        followers: p.tiktok_followers || undefined,
      });
    }
    if (p.twitter_handle) {
      platforms.push({
        name: 'Twitter',
        handle: p.twitter_handle,
        followers: p.twitter_followers || undefined,
      });
    }
    if (p.facebook_profile_url) {
      platforms.push({
        name: 'Facebook',
        handle: p.facebook_profile_url,
        followers: p.facebook_followers || undefined,
      });
    }

    // Get creator name
    const creatorName = profile.business_name ||
      `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
      'Creator';

    // Public trust metrics for conversion (safe aggregates only)
    let trustStats: {
      brands_count: number;
      completed_deals: number;
      total_deals: number;
      completion_rate: number | null;
      avg_response_hours: number | null;
    } = {
      brands_count: 0,
      completed_deals: 0,
      total_deals: 0,
      completion_rate: null,
      avg_response_hours: null,
    };

    try {
      const { data: dealsStatsRows } = await supabase
        .from('brand_deals')
        .select('brand_name, status, progress_percentage')
        .eq('creator_id', profile.id);

      const dealsRows = Array.isArray(dealsStatsRows) ? dealsStatsRows : [];
      const totalDeals = dealsRows.length;
      const completedDeals = dealsRows.filter((d: any) => {
        const status = (d?.status || '').toLowerCase();
        const progress = typeof d?.progress_percentage === 'number' ? d.progress_percentage : 0;
        if (progress >= 100) return true;
        return status.includes('completed') || status.includes('closed') || status.includes('resolved');
      }).length;
      const uniqueBrands = new Set(
        dealsRows
          .map((d: any) => (typeof d?.brand_name === 'string' ? d.brand_name.trim().toLowerCase() : ''))
          .filter(Boolean)
      ).size;
      const baseBrandCountRaw = Number((profile as any).collab_brands_count_override);
      const baseBrandCount = Number.isFinite(baseBrandCountRaw) && baseBrandCountRaw >= 0
        ? Math.floor(baseBrandCountRaw)
        : null;
      const totalBrandCount = baseBrandCount !== null
        ? baseBrandCount + uniqueBrands
        : uniqueBrands;

      const { data: responseRows } = await supabase
        .from('collab_requests')
        .select('created_at, updated_at, status')
        .eq('creator_id', profile.id)
        .in('status', ['accepted', 'countered', 'declined']);

      const responseDurationsHours = (Array.isArray(responseRows) ? responseRows : [])
        .map((r: any) => {
          const created = r?.created_at ? new Date(r.created_at).getTime() : NaN;
          const updated = r?.updated_at ? new Date(r.updated_at).getTime() : NaN;
          if (!Number.isFinite(created) || !Number.isFinite(updated) || updated < created) return null;
          const hours = (updated - created) / (1000 * 60 * 60);
          // Ignore outliers above 7 days for better signal quality
          if (hours < 0 || hours > 168) return null;
          return hours;
        })
        .filter((v: number | null): v is number => typeof v === 'number');

      const avgResponseHours = responseDurationsHours.length > 0
        ? responseDurationsHours.reduce((sum: number, h: number) => sum + h, 0) / responseDurationsHours.length
        : null;

      trustStats = {
        brands_count: totalBrandCount,
        completed_deals: completedDeals,
        total_deals: totalDeals,
        completion_rate: totalDeals > 0 ? Math.round((completedDeals / totalDeals) * 100) : null,
        avg_response_hours: avgResponseHours !== null ? Math.max(1, Math.round(avgResponseHours)) : null,
      };
    } catch (statsError) {
      console.warn('[CollabRequests] Failed to compute trust stats:', statsError);
    }

    const suggestedReelRate = getEffectiveReelRate(profile);
    const suggestedPaidRange = estimateReelBudgetRange(suggestedReelRate);
    const suggestedBarterRange = estimateBarterValueRange(suggestedReelRate);
    let performanceProof: Record<string, unknown> | null = null;
    try {
      const { data: latestSnapshot } = await supabase
        .from('instagram_performance_snapshots')
        .select('engagement_rate, median_reel_views, avg_likes, avg_comments, avg_saves, avg_shares, sample_size, data_quality, captured_at')
        .eq('creator_id', profile.id)
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestSnapshot) {
        performanceProof = {
          engagement_rate: (latestSnapshot as any).engagement_rate,
          median_reel_views: (latestSnapshot as any).median_reel_views,
          avg_likes: (latestSnapshot as any).avg_likes,
          avg_comments: (latestSnapshot as any).avg_comments,
          avg_saves: (latestSnapshot as any).avg_saves,
          avg_shares: (latestSnapshot as any).avg_shares,
          sample_size: (latestSnapshot as any).sample_size,
          data_quality: (latestSnapshot as any).data_quality || 'limited',
          captured_at: (latestSnapshot as any).captured_at,
        };
      }
    } catch {
      // No-op: table may not exist before migration.
    }

    res.json({
      success: true,
      creator: {
        id: profile.id,
        is_registered: true,
        profile_type: 'verified',
        profile_label: 'Verified Creator Profile',
        submission_flow: 'direct_request',
        name: creatorName,
        username: profile.username,
        category: profile.creator_category,
        platforms,
        suggested_reel_rate: suggestedReelRate,
        suggested_paid_range_min: suggestedPaidRange.min,
        suggested_paid_range_max: suggestedPaidRange.max,
        suggested_barter_value_min: suggestedBarterRange.min,
        suggested_barter_value_max: suggestedBarterRange.max,
        profile_photo: resolvedProfilePhoto,
        followers: resolvedInstagramFollowers,
        last_instagram_sync: (profile as any).last_instagram_sync || null,
        bio: resolvedBio,
        open_to_collabs: (profile as any).open_to_collabs !== false,
        content_niches: Array.isArray((profile as any).content_niches) ? (profile as any).content_niches : [],
        media_kit_url: (profile as any).media_kit_url || null,
        audience_gender_split: (profile as any).audience_gender_split || null,
        top_cities: Array.isArray((profile as any).top_cities) ? (profile as any).top_cities : [],
        audience_age_range: (profile as any).audience_age_range || null,
        primary_audience_language: (profile as any).primary_audience_language || null,
        posting_frequency: (profile as any).posting_frequency || null,
        active_brand_collabs_month: (profile as any).active_brand_collabs_month ?? null,
        campaign_slot_note: (profile as any).campaign_slot_note || null,
        collab_brands_count_override: (profile as any).collab_brands_count_override ?? null,
        collab_response_hours_override: (profile as any).collab_response_hours_override ?? null,
        collab_cancellations_percent_override: (profile as any).collab_cancellations_percent_override ?? null,
        collab_region_label: (profile as any).collab_region_label || null,
        collab_audience_fit_note: (profile as any).collab_audience_fit_note || null,
        collab_recent_activity_note: (profile as any).collab_recent_activity_note || null,
        collab_audience_relevance_note: (profile as any).collab_audience_relevance_note || null,
        collab_delivery_reliability_note: (profile as any).collab_delivery_reliability_note || null,
        collab_engagement_confidence_note: (profile as any).collab_engagement_confidence_note || null,
        collab_response_behavior_note: (profile as any).collab_response_behavior_note || null,
        collab_cta_trust_note: (profile as any).collab_cta_trust_note || null,
        collab_cta_dm_note: (profile as any).collab_cta_dm_note || null,
        collab_cta_platform_note: (profile as any).collab_cta_platform_note || null,
        past_brands: Array.isArray((profile as any).past_brands) ? (profile as any).past_brands : [],
        recent_campaign_types: Array.isArray((profile as any).recent_campaign_types) ? (profile as any).recent_campaign_types : [],
        avg_reel_views: (() => {
          const manualViews = Number((profile as any).avg_reel_views_manual);
          if (Number.isFinite(manualViews) && manualViews > 0) return manualViews;
          return (performanceProof as any)?.median_reel_views ?? null;
        })(),
        avg_likes: (() => {
          const manualLikes = Number((profile as any).avg_likes_manual);
          if (Number.isFinite(manualLikes) && manualLikes > 0) return manualLikes;
          return (performanceProof as any)?.avg_likes ?? null;
        })(),
        past_brand_count: trustStats.brands_count,
        performance_proof: performanceProof,
        trust_stats: trustStats,
      },
    });
  } catch (error: any) {
    console.error('[CollabRequests] Error in GET /:username:', error);
    console.error('[CollabRequests] Error stack:', error.stack);
    console.error('[CollabRequests] Error name:', error.name);
    console.error('[CollabRequests] Error message:', error.message);

    if (isUpstreamConnectivityError(error)) {
      return res.status(503).json({
        success: false,
        error: 'Creator profile service temporarily unavailable',
        code: 'UPSTREAM_CONNECTIVITY_ISSUE',
        message: 'Unable to reach profile data provider from this network. Please retry shortly.',
      });
    }

    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: isDev ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      } : {
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/collab/:username/upload-barter-image
 * Upload optional barter product image (public, no auth). Returns public URL.
 */
router.post(
  '/:username/upload-barter-image',
  barterImageUpload.single('file'),
  async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    try {
      const file = req.file;
      if (!file || !file.buffer) {
        return res.status(400).json({ success: false, error: 'No image file provided' });
      }
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowed.includes(file.mimetype)) {
        return res.status(400).json({ success: false, error: 'Only JPEG, PNG, WebP, and GIF images are allowed' });
      }
      const ext = file.mimetype === 'image/jpeg' ? 'jpg' : file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'gif';
      const path = `collab-requests/barter/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('creator-assets')
        .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
      if (uploadError) {
        console.error('[CollabRequests] Barter image upload error:', uploadError);
        return res.status(500).json({ success: false, error: 'Failed to upload image' });
      }
      const { data: urlData } = supabase.storage.from('creator-assets').getPublicUrl(path);
      return res.status(200).json({ success: true, url: urlData.publicUrl });
    } catch (e) {
      console.error('[CollabRequests] Barter image upload exception:', e);
      return res.status(500).json({ success: false, error: 'Failed to upload image' });
    }
  }
);

/**
 * POST /api/collab/:username/submit
 * Submit a collaboration request (public, no auth)
 */
router.post('/:username/submit', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const {
      brand_name,
      brand_email,
      brand_address,
      brand_gstin,
      brand_phone,
      brand_website,
      brand_instagram,
      collab_type,
      budget_range,
      exact_budget,
      barter_description,
      barter_value,
      barter_product_image_url,
      campaign_category,
      campaign_description,
      deliverables,
      usage_rights,
      deadline,
      authorized_signer_name,
      authorized_signer_role,
      usage_duration,
      payment_terms,
      approval_sla_hours,
      shipping_timeline_days,
      cancellation_policy,
    } = req.body;

    // Validation
    if (!username || username.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Username is required',
      });
    }

    if (!brand_name || !brand_email || !campaign_description) {
      return res.status(400).json({
        success: false,
        error: 'Brand name, email, and campaign description are required',
      });
    }

    if (!brand_address || typeof brand_address !== 'string' || brand_address.trim().length < 15) {
      return res.status(400).json({
        success: false,
        error: 'Company / brand address is required (full registered address, at least 15 characters) for contract generation',
      });
    }

    if (brand_gstin != null && typeof brand_gstin === 'string' && brand_gstin.trim()) {
      const gstin = brand_gstin.trim().toUpperCase();
      if (!/^[0-9A-Z]{15}$/.test(gstin)) {
        return res.status(400).json({
          success: false,
          error: 'GSTIN must be 15 characters (letters and numbers only)',
        });
      }
    }

    const collabTypeForDb = normalizeCollabTypeForDb(collab_type);
    const collabTypeForApi = normalizeCollabTypeForApi(collab_type);

    if (!collabTypeForDb) {
      return res.status(400).json({
        success: false,
        error: 'Valid collaboration type is required',
      });
    }

    if (!Array.isArray(deliverables) || deliverables.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one deliverable is required',
      });
    }

    // Get creator ID by username or instagram_handle
    const normalizedUsername = normalizeHandle(username) || username.toLowerCase().trim();

    // Create shared payload once (used for direct request or lead capture)
    const extraTermsLines: string[] = [];
    if (authorized_signer_name) extraTermsLines.push(`Authorized signer: ${String(authorized_signer_name).trim()}${authorized_signer_role ? ` (${String(authorized_signer_role).trim()})` : ''}`);
    if (campaign_category && typeof campaign_category === 'string' && campaign_category.trim()) {
      extraTermsLines.push(`Collab content category: ${campaign_category.trim()}`);
    }
    if (usage_duration) extraTermsLines.push(`Usage duration requested: ${String(usage_duration).trim()}`);
    if (payment_terms) extraTermsLines.push(`Payment terms requested: ${String(payment_terms).trim()}`);
    if (approval_sla_hours) extraTermsLines.push(`Approval SLA requested: ${String(approval_sla_hours).trim()} hours`);
    if (shipping_timeline_days) extraTermsLines.push(`Shipping timeline requested: ${String(shipping_timeline_days).trim()} days`);
    if (cancellation_policy) extraTermsLines.push(`Cancellation/reschedule policy: ${String(cancellation_policy).trim()}`);

    const campaignDescriptionWithTerms = extraTermsLines.length > 0
      ? `${campaign_description.trim()}\n\nAdditional Commercial Terms:\n- ${extraTermsLines.join('\n- ')}`
      : campaign_description.trim();

    const basePayload: any = {
      target_handle: normalizedUsername,
      brand_name: brand_name.trim(),
      brand_email: brand_email.toLowerCase().trim(),
      brand_address: brand_address.trim(),
      brand_gstin: brand_gstin && typeof brand_gstin === 'string' ? brand_gstin.trim().toUpperCase() : null,
      brand_phone: brand_phone?.trim() || null,
      brand_website: brand_website?.trim() || null,
      brand_instagram: brand_instagram?.trim() || null,
      collab_type: collabTypeForDb,
      campaign_description: campaignDescriptionWithTerms,
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      usage_rights: usage_rights === true || usage_rights === 'true',
      deadline: deadline || null,
    };

    if (isPaidLikeCollab(collabTypeForDb)) {
      basePayload.budget_range = budget_range || null;
      basePayload.exact_budget = exact_budget ? parseFloat(exact_budget) : null;
    }

    if (isBarterLikeCollab(collabTypeForDb)) {
      basePayload.barter_description = barter_description?.trim() || null;
      basePayload.barter_value = barter_value ? parseFloat(barter_value) : null;
      if (barter_product_image_url != null && typeof barter_product_image_url === 'string') {
        const trimmed = barter_product_image_url.trim();
        if (trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
          basePayload.barter_product_image_url = trimmed;
        }
      }
    }

    // Try username first, then instagram_handle as fallback
    let { data: creator, error: creatorError } = await supabase
      .from('profiles')
      .select('id, username, instagram_handle')
      .eq('username', normalizedUsername)
      .eq('role', 'creator')
      .maybeSingle();

    // If not found by username, try instagram_handle
    if (!creator && !creatorError) {
      const result = await supabase
        .from('profiles')
        .select('id, username, instagram_handle')
        .eq('instagram_handle', normalizedUsername)
        .eq('role', 'creator')
        .maybeSingle();
      creator = result.data;
      creatorError = result.error;
    }

    // Rate limiting: Check for recent submissions from same email/IP
    // Disabled in development mode for easier testing
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const allowDemoEmail = process.env.ALLOW_DEMO_EMAIL === 'true';

    if (!isDevelopment && !allowDemoEmail) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      let hasRecentSubmission = false;
      if (creator?.id) {
        const { data: recentSubmissions, error: rateLimitError } = await supabase
          .from('collab_requests')
          .select('id')
          .eq('brand_email', brand_email.toLowerCase().trim())
          .eq('creator_id', creator.id)
          .gte('created_at', oneHourAgo)
          .limit(1);

        if (rateLimitError) {
          console.error('[CollabRequests] Rate limit check error (creator request):', rateLimitError);
        }
        hasRecentSubmission = Array.isArray(recentSubmissions) && recentSubmissions.length > 0;
      } else {
        let foundInAnyLeadTable = false;
        for (const table of LEAD_SOURCE_TABLES) {
          const { data: recentLeads, error: leadRateLimitError } = await supabase
            .from(table)
            .select('id')
            .eq('brand_email', brand_email.toLowerCase().trim())
            .eq('target_handle', normalizedUsername)
            .gte('created_at', oneHourAgo)
            .limit(1);

          if (leadRateLimitError) {
            if (isMissingTableError(leadRateLimitError)) continue;
            console.error(`[CollabRequests] Rate limit check error (lead request, table=${table}):`, leadRateLimitError);
            continue;
          }

          if (Array.isArray(recentLeads) && recentLeads.length > 0) {
            foundInAnyLeadTable = true;
            break;
          }
        }
        hasRecentSubmission = foundInAnyLeadTable;
      }

      if (hasRecentSubmission) {
        return res.status(429).json({
          success: false,
          error: 'Please wait before submitting another request. You can submit one request per hour.',
        });
      }
    } else {
      console.log('[CollabRequests] Rate limiting disabled in development mode');
    }

    if (creatorError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to validate creator profile',
      });
    }

    if (!creator) {
      const leadInsertData: any = {
        ...basePayload,
        target_channel: 'username',
        status: 'pending',
        submitted_ip: clientIp,
        submitted_user_agent: userAgent,
        request_payload: req.body && typeof req.body === 'object' ? req.body : null,
      };

      let collabLead: any = null;
      let leadTable = LEGACY_LEADS_TABLE;
      try {
        const inserted = await insertUnclaimedCollabRequest(leadInsertData);
        collabLead = inserted.record;
        leadTable = inserted.table;
      } catch (leadInsertError) {
        console.error('[CollabRequests] Error creating lead request:', leadInsertError);
        return res.status(500).json({
          success: false,
          error: 'Failed to capture collaboration request',
        });
      }

      sendCollabRequestSubmissionEmail(brand_email, {
        creatorName: `@${normalizedUsername}`,
        creatorPlatforms: ['Instagram'],
        brandName: brand_name,
        collabType: collabTypeForApi || collabTypeForDb,
        budgetRange: budget_range || undefined,
        exactBudget: exact_budget ? parseFloat(exact_budget.toString()) : undefined,
        barterDescription: barter_description || undefined,
        deliverables: Array.isArray(basePayload.deliverables) ? basePayload.deliverables : [],
        deadline: deadline || undefined,
        requestId: collabLead.id,
      }).catch((emailError) => {
        console.error('[CollabRequests] Lead submission email sending failed (non-fatal):', emailError);
      });

      sendCollabLeadCapturedAlertEmail(getCollabLeadAlertEmail(), {
        targetHandle: normalizedUsername,
        brandName: brand_name.trim(),
        brandEmail: brand_email.toLowerCase().trim(),
        collabType: collabTypeForApi || collabTypeForDb,
        campaignDescription: campaignDescriptionWithTerms,
        leadId: collabLead.id,
      }).then(() => {
        supabase
          .from(leadTable)
          .update({ notified_at: new Date().toISOString() })
          .eq('id', collabLead.id)
          .then(({ error }) => {
            if (error) console.warn('[CollabRequests] Failed to mark lead notified_at:', error.message);
          });
      }).catch((alertError) => {
        console.warn('[CollabRequests] Lead alert email failed (non-fatal):', alertError);
      });

      return res.json({
        success: true,
        submission_type: 'lead',
        lead: {
          id: collabLead.id,
          target_handle: normalizedUsername,
          submitted_at: collabLead.created_at,
          status: 'pending_attachment',
        },
        message: 'Your request has been shared with the creator.',
      });
    }

    // Resolve or create canonical brand for agency (deduped by email)
    const brandContactId = await resolveOrCreateBrandContact({
      legalName: brand_name.trim(),
      email: brand_email.trim(),
      phone: brand_phone?.trim() || null,
      website: brand_website?.trim() || null,
      instagram: brand_instagram?.trim() || null,
      address: brand_address?.trim() || null,
      gstin: brand_gstin && typeof brand_gstin === 'string' ? brand_gstin.trim().toUpperCase() : null,
    });

    // Create collab request
    const insertData: any = {
      creator_id: creator.id,
      brand_name: basePayload.brand_name,
      brand_email: basePayload.brand_email,
      brand_address: basePayload.brand_address,
      brand_gstin: basePayload.brand_gstin,
      brand_phone: basePayload.brand_phone,
      brand_website: basePayload.brand_website,
      brand_instagram: basePayload.brand_instagram,
      collab_type: basePayload.collab_type,
      campaign_description: basePayload.campaign_description,
      deliverables: JSON.stringify(basePayload.deliverables),
      usage_rights: basePayload.usage_rights,
      deadline: basePayload.deadline,
      submitted_ip: clientIp,
      submitted_user_agent: userAgent,
      ...(brandContactId ? { brand_contact_id: brandContactId } : {}),
    };

    // Add budget/barter fields based on collab_type
    if (isPaidLikeCollab(basePayload.collab_type)) {
      insertData.budget_range = basePayload.budget_range || null;
      insertData.exact_budget = basePayload.exact_budget ?? null;
    }

    if (isBarterLikeCollab(basePayload.collab_type)) {
      insertData.barter_description = basePayload.barter_description || null;
      insertData.barter_value = basePayload.barter_value ?? null;
      insertData.barter_product_image_url = basePayload.barter_product_image_url ?? null;
    }

    const { data: collabRequest, error: insertError } = await supabase
      .from('collab_requests')
      .insert(insertData)
      .select('id, brand_name, created_at')
      .single();

    if (insertError) {
      console.error('[CollabRequests] Error creating request:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to submit collaboration request',
      });
    }

    // Fetch creator profile once for both emails (async, non-blocking)
    let creatorProfile: any = null;
    if (collabRequest && collabRequest.id) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, business_name, username, instagram_handle, youtube_channel_id, tiktok_handle, twitter_handle, avatar_url, creator_category, instagram_followers, youtube_subs, tiktok_followers, twitter_followers')
          .eq('id', creator.id)
          .maybeSingle();
        creatorProfile = profileData;
      } catch (profileError) {
        console.warn('[CollabRequests] Could not fetch creator profile for emails (non-fatal):', profileError);
      }
    }

    // Get creator name with better fallback (prioritize business_name like GET endpoint)
    let creatorName = 'Creator';
    if (creatorProfile) {
      // First try business_name, then first_name + last_name, then individual names
      if (creatorProfile.business_name && creatorProfile.business_name.trim()) {
        creatorName = creatorProfile.business_name.trim();
      } else {
        const firstName = creatorProfile.first_name || '';
        const lastName = creatorProfile.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) {
          creatorName = fullName;
        } else if (firstName) {
          creatorName = firstName;
        } else if (lastName) {
          creatorName = lastName;
        }
      }
    }

    // If still "Creator", try to get email username as fallback
    if (creatorName === 'Creator') {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(creator.id);
        if (authUser?.user?.email) {
          const emailUsername = authUser.user.email.split('@')[0];
          if (emailUsername && emailUsername.length >= 2) {
            creatorName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
          }
        }
      } catch (authError) {
        // Keep default "Creator" if auth lookup fails
        console.warn('[CollabRequests] Could not fetch creator email for name fallback:', authError);
      }
    }

    // Parse deliverables once (reuse for both emails)
    let deliverablesArray: string[] = [];
    try {
      deliverablesArray = typeof deliverables === 'string'
        ? JSON.parse(deliverables)
        : deliverables || [];
    } catch {
      deliverablesArray = Array.isArray(deliverables) ? deliverables : [];
    }

    // Send email notification to brand (async, non-blocking)
    if (collabRequest && collabRequest.id) {
      const platforms: string[] = [];
      if (creatorProfile?.instagram_handle) platforms.push('Instagram');
      if (creatorProfile?.youtube_channel_id) platforms.push('YouTube');
      if (creatorProfile?.tiktok_handle) platforms.push('TikTok');
      if (creatorProfile?.twitter_handle) platforms.push('Twitter');

      sendCollabRequestSubmissionEmail(brand_email, {
        creatorName,
        creatorPlatforms: platforms.length > 0 ? platforms : undefined,
        brandName: brand_name,
        collabType: collabTypeForApi || collabTypeForDb,
        budgetRange: budget_range || undefined,
        exactBudget: exact_budget ? parseFloat(exact_budget.toString()) : undefined,
        barterDescription: barter_description || undefined,
        deliverables: deliverablesArray,
        deadline: deadline || undefined,
        requestId: collabRequest.id,
      }).catch((emailError) => {
        console.error('[CollabRequests] Submission email sending failed (non-fatal):', emailError);
      });
    }

    // Track submit event for analytics (async, non-blocking)
    try {
      const { error: analyticsError } = await supabase
        .from('collab_link_events')
        .insert({
          creator_id: creator.id,
          event_type: 'submit',
          request_id: collabRequest.id,
          device_type: detectDeviceType(userAgent),
          ip_hash: hashIp(clientIp),
          user_agent_hash: crypto.createHash('sha256').update(userAgent).digest('hex').substring(0, 16),
        });

      if (analyticsError) {
        console.error('[CollabRequests] Error tracking submit event:', analyticsError);
        // Don't fail the request if analytics fails
      }
    } catch (analyticsError) {
      console.error('[CollabRequests] Error tracking submit event:', analyticsError);
      // Don't fail the request if analytics fails
    }

    // Send email notification to creator (async, non-blocking)
    if (collabRequest && collabRequest.id) {

      // ── Push Notification (fires immediately, independent of email) ──────────
      try {
        notifyCreatorOnCollabRequestCreated({
          creatorId: creator.id,
          requestId: collabRequest.id,
          emailData: {
            creatorName,
            brandName: brand_name,
            collabType: collabTypeForApi || collabTypeForDb,
            budgetRange: budget_range || undefined,
            exactBudget: exact_budget ? parseFloat(exact_budget.toString()) : undefined,
            deliverables: deliverablesArray,
            deadline: deadline || undefined,
            requestId: collabRequest.id,
          },
          creatorEmail: null,
        }).then((result) => {
          if (result.sent) {
            console.log(`[CollabRequests] ✅ Push sent via ${result.channel} for request ${collabRequest.id}`);
          } else {
            console.warn(`[CollabRequests] Push not sent for ${collabRequest.id}: ${result.reason}`);
          }
        }).catch((notifyError) => {
          console.error('[CollabRequests] Push notification failed (non-fatal):', notifyError);
        });
      } catch (pushError) {
        console.error('[CollabRequests] Push notification threw (non-fatal):', pushError);
      }

      // ── Email Notification (requires creator's email from auth.users) ────────
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(creator.id);

        if (!authError && authUser?.user?.email) {
          const creatorEmail = authUser.user.email;

          // Build Accept Deal URL
          const frontendUrl = (process.env.FRONTEND_URL || 'https://creatorarmour.com').replace(/\/$/, '');
          const acceptUrl = `${frontendUrl}/collab-requests`;

          // Calculate total follower count
          const profileAny = creatorProfile as any;
          let totalFollowers = 0;
          if (profileAny?.instagram_followers) totalFollowers += profileAny.instagram_followers;
          if (profileAny?.youtube_subs) totalFollowers += profileAny.youtube_subs;
          if (profileAny?.tiktok_followers) totalFollowers += profileAny.tiktok_followers;
          if (profileAny?.twitter_followers) totalFollowers += profileAny.twitter_followers;

          const creatorNotificationPayload = {
            creatorName,
            creatorCategory: creatorProfile?.creator_category || undefined,
            followerCount: totalFollowers > 0 ? totalFollowers : undefined,
            avatarUrl: creatorProfile?.avatar_url || undefined,
            brandName: brand_name,
            brandWebsite: brand_website || undefined,
            campaignGoal: campaign_description || undefined,
            collabType: collabTypeForApi || collabTypeForDb,
            budgetRange: budget_range || undefined,
            exactBudget: exact_budget ? parseFloat(exact_budget.toString()) : undefined,
            barterDescription: barter_description || undefined,
            barterValue: barter_value ? parseFloat(barter_value.toString()) : undefined,
            barterProductImageUrl: (insertData as any).barter_product_image_url ?? undefined,
            deliverables: deliverablesArray,
            deadline: deadline || undefined,
            timeline: deadline || undefined,
            notes: extraTermsLines.length > 0 ? extraTermsLines.join(' | ') : undefined,
            requestId: collabRequest.id,
            acceptUrl,
          };

          // Send email
          sendCollabRequestCreatorNotificationEmail(creatorEmail, creatorNotificationPayload, creator.id).then(async () => {
            await supabase
              .from('collab_requests')
              .update({ last_notified_at: new Date().toISOString() })
              .eq('id', collabRequest.id);
          }).catch((emailError) => {
            console.error('[CollabRequests] Creator email notification failed (non-fatal):', emailError);
          });
        } else {
          console.warn('[CollabRequests] Could not fetch creator email for email notification:', authError?.message);
        }
      } catch (emailBlockError) {
        console.error('[CollabRequests] Error in email notification block (non-fatal):', emailBlockError);
      }

      // ── In-app Notification ──────────────────────────────────────────────────
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
        const dashboardLink = `${frontendUrl}/creator-dashboard`;
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: creator.id,
            type: 'deal',
            category: 'collab_request',
            title: `New collaboration request from ${brand_name}`,
            message: `You have a new collaboration request. Review it in your dashboard.`,
            data: {
              collab_request_id: collabRequest.id,
              brand_name: brand_name,
              collab_type: collabTypeForApi || collabTypeForDb,
            },
            link: dashboardLink,
            priority: 'high',
            icon: 'collab_request',
            action_label: 'Review Request',
            action_link: dashboardLink,
          });
        if (notificationError) {
          console.warn('[CollabRequests] Failed to create notification entry (non-fatal):', notificationError.message);
        } else {
          console.log('[CollabRequests] In-app notification entry created');
        }
      } catch (notificationError) {
        console.warn('[CollabRequests] In-app notification error (non-fatal):', notificationError);
      }
    }

    res.json({
      success: true,
      submission_type: 'request',
      request: {
        id: collabRequest.id,
        brand_name: collabRequest.brand_name,
        submitted_at: collabRequest.created_at,
      },
    });
  } catch (error: any) {
    console.error('[CollabRequests] Error in POST /:username/submit:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ============================================================================
// AUTHENTICATED ROUTES (Creator only)
// ============================================================================

/**
 * POST /api/collab-requests/attach-leads
 * Attach pending lead captures to the authenticated creator account (after onboarding)
 */
router.post('/attach-leads', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const result = await attachPendingCollabLeadsForCreator(req.user.id);
    return res.json({
      success: true,
      attached: result.attached,
      failed: result.failed,
    });
  } catch (error: any) {
    console.error('[CollabRequests] Error in POST /attach-leads:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to attach lead requests',
    });
  }
});

/**
 * GET /api/collab-requests
 * Get all collab requests for authenticated creator
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;
    const { status } = req.query;

    // Best-effort auto-attach to make onboarding->requests seamless even if frontend
    // doesn't explicitly call /attach-leads.
    try {
      await attachPendingCollabLeadsForCreator(userId);
    } catch (attachError) {
      console.warn('[CollabRequests] Auto-attach leads failed (non-fatal):', attachError);
    }

    let query = supabase
      .from('collab_requests')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    const { data: requests, error } = await query;

    if (error) {
      const missingSchema =
        error.code === '42P01' ||
        error.code === '42703' ||
        /does not exist|relation .* does not exist|column .* does not exist/i.test(error.message || '');
      if (missingSchema) {
        console.warn('[CollabRequests] Missing table/column in production schema, returning empty requests:', error.message);
        return res.json({
          success: true,
          requests: [],
        });
      }
      console.error('[CollabRequests] Error fetching requests:', error);
      console.error('[CollabRequests] Error details:', JSON.stringify(error, null, 2));
      console.error('[CollabRequests] User ID:', userId);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch collaboration requests',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    const normalizedRequests = (requests || []).map((request: any) => ({
      ...request,
      collab_type: normalizeCollabTypeForApi(request.collab_type) || request.collab_type,
    }));

    res.json({
      success: true,
      requests: normalizedRequests,
    });
  } catch (error: any) {
    console.error('[CollabRequests] Error in GET /:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/collab-requests/accept/confirm
 * Accept via requestToken (after magic-link verification). Auth required.
 */
router.post('/accept/confirm', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { requestToken } = req.body || {};
    const tokenStr = typeof requestToken === 'string' ? requestToken.trim() : '';
    if (!tokenStr) {
      return res.status(400).json({ success: false, error: 'Invalid link' });
    }
    const clientIp = req.ip || (req.socket as any)?.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    // collab_accept_tokens table is missing in production schema
    /*
    const { data: tokenRow, error: tokenError } = await supabase
      .from('collab_accept_tokens')
      .select('id, collab_request_id, creator_email, expires_at')
      .eq('id', tokenStr)
      .maybeSingle();
    if (tokenError || !tokenRow) {
      return res.status(404).json({ success: false, error: 'Invalid link' });
    }
    const expiresAt = new Date(tokenRow.expires_at);
    if (expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ success: false, error: 'This link has expired' });
    }
    */
    console.warn('[CollabRequests] Accept confirm disabled: collab_accept_tokens table missing');
    return res.status(404).json({ success: false, error: 'Feature unavailable. Please accept via your dashboard.' });

    const { data: request, error: requestError } = await supabase
      .from('collab_requests')
      .select('*')
      .eq('id', tokenRow.collab_request_id)
      .maybeSingle();
    if (requestError || !request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    if (request.creator_id !== userId) {
      return res.status(403).json({ success: false, error: 'This link is for a different account' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'This request has already been handled' });
    }

    const id = request.id;
    const now = new Date().toISOString();

    // Parse deliverables
    let deliverablesArray: string[] = [];
    try {
      deliverablesArray = typeof request.deliverables === 'string'
        ? JSON.parse(request.deliverables)
        : request.deliverables || [];
    } catch {
      deliverablesArray = [];
    }
    let dealAmount = 0;
    if (isPaidLikeCollab(request.collab_type)) {
      dealAmount = request.exact_budget || 0;
    }
    const isBarter = normalizeCollabTypeForDb(request.collab_type) === 'barter';

    const dealData: any = {
      creator_id: userId,
      brand_name: request.brand_name,
      brand_email: request.brand_email,
      deal_amount: dealAmount,
      deliverables: deliverablesArray.join(', '),
      due_date: request.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_expected_date: request.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      platform: 'Other',
      status: 'Drafting',
      deal_type: isBarter ? 'barter' : 'paid',
      created_via: 'collab_request',
      brand_address: request.brand_address,
      brand_phone: request.brand_phone,
      // collab_request_id: request.id, // Column currently missing in production DB
    };
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .insert(dealData)
      .select('id')
      .single();
    if (dealError || !deal) {
      console.error('[CollabRequests] Accept confirm: create deal error:', dealError);
      return res.status(500).json({ success: false, error: 'Failed to create deal' });
    }

    const dealBrandContactId = await resolveOrCreateBrandContact({
      legalName: request.brand_name || '',
      email: request.brand_email || '',
      phone: request.brand_phone || null,
      website: null,
      instagram: null,
      address: request.brand_address?.trim() || null,
      gstin: request.brand_gstin?.trim().toUpperCase() || null,
    });
    if (dealBrandContactId) {
      await supabase.from('brand_deals').update({ brand_contact_id: dealBrandContactId, updated_at: now }).eq('id', deal.id);
    }

    // Update collab request status and acceptance metadata
    const { error: updateError } = await supabase
      .from('collab_requests')
      .update({
        status: 'accepted',
        deal_id: deal.id,
        updated_at: now,
      })
      .eq('id', id);

    if (updateError) {
      console.error('[CollabRequests] Error updating request:', updateError);
    }

    // Insert audit log for the acceptance action using deal_action_logs
    await supabase.from('deal_action_logs').insert({
      deal_id: deal.id,
      user_id: userId,
      event: 'CONTRACT_READY',
      metadata: {
        collab_request_id: id,
        auth_method: 'magic_link',
        ip_address: clientIp,
        user_agent: userAgent,
        collab_type: normalizeCollabTypeForApi(request.collab_type) || request.collab_type,
        status: 'CONTRACT_READY'
      },
    }).then(({ error: logErr }) => {
      if (logErr) console.warn('[CollabRequests] Audit log insert failed:', logErr);
    });

    if (isBarter) {
      return res.json({
        success: true,
        deal: { id: deal.id },
        needs_delivery_details: true,
        message: 'Deal accepted. Please add delivery details so we can generate the contract.',
      });
    }

    let contractUrl: string | null = null;
    let contractReadyToken: string | null = null;
    try {
      const { data: existingDeal } = await supabase
        .from('brand_deals')
        .select('contract_file_url')
        .eq('id', deal.id)
        .single();
      if (existingDeal?.contract_file_url) {
        contractUrl = existingDeal.contract_file_url;
      } else {
        const { data: creatorProfile, error: creatorError } = await supabase
          .from('profiles')
          .select('first_name, last_name, location')
          .eq('id', userId)
          .maybeSingle();
        if (creatorError) throw new Error('Failed to fetch creator profile');
        const creatorName = creatorProfile
          ? `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || 'Creator'
          : 'Creator';
        const creatorEmail = creatorProfile?.email || req.user?.email || undefined;
        const creatorAddress = creatorProfile?.location || creatorProfile?.address || undefined;
        let paymentTerms: string | undefined;
        if (isPaidLikeCollab(request.collab_type)) {
          paymentTerms = `Payment expected by ${request.deadline ? new Date(request.deadline).toLocaleDateString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`;
        }
        const dealSchema = {
          deal_amount: dealAmount,
          deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
          delivery_deadline: request.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          payment: { method: 'Bank Transfer', timeline: paymentTerms || 'Within 7 days of content delivery' },
          usage: { type: request.usage_rights ? 'Exclusive' : 'Non-exclusive', platforms: ['All platforms'], duration: '6 months', paid_ads: false, whitelisting: false },
          exclusivity: { enabled: false, category: null, duration: null },
          termination: { notice_days: 7 },
          jurisdiction_city: 'Mumbai',
        };
        const contractResult = await generateContractFromScratch({
          brandName: request.brand_name,
          creatorName,
          creatorEmail,
          dealAmount,
          deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
          paymentTerms,
          dueDate: request.deadline ? new Date(request.deadline).toLocaleDateString() : undefined,
          paymentExpectedDate: request.deadline ? new Date(request.deadline).toLocaleDateString() : undefined,
          platform: 'Multiple Platforms',
          brandEmail: request.brand_email || undefined,
          brandAddress: request.brand_address?.trim() || undefined,
          brandGstin: request.brand_gstin?.trim() || undefined,
          creatorAddress,
          dealSchema,
          usageType: request.usage_rights ? 'Exclusive' : 'Non-exclusive',
          usagePlatforms: ['All platforms'],
          usageDuration: '6 months',
          paidAdsAllowed: false,
          whitelistingAllowed: false,
          exclusivityEnabled: false,
          exclusivityCategory: null,
          exclusivityDuration: null,
          terminationNoticeDays: 7,
          jurisdictionCity: 'Mumbai',
          additionalTerms: normalizeCollabTypeForDb(request.collab_type) === 'barter' && request.barter_description ? `Barter Collaboration: ${request.barter_description}` : undefined,
        });
        const timestamp = Date.now();
        const storagePath = `contracts/${deal.id}/${timestamp}_${contractResult.fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('creator-assets')
          .upload(storagePath, contractResult.contractDocx, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            upsert: false,
          });
        if (uploadError) throw new Error('Failed to upload contract');
        const { data: publicUrlData } = supabase.storage.from('creator-assets').getPublicUrl(storagePath);
        contractUrl = publicUrlData?.publicUrl || null;
        if (contractUrl) {
          await supabase.from('brand_deals').update({
            contract_file_url: contractUrl,
            status: 'Drafting',
            updated_at: now,
          }).eq('id', deal.id);
        }
        const token = await createContractReadyToken({ dealId: deal.id, creatorId: userId, expiresAt: null });
        contractReadyToken = token.id;
        if (request.brand_email && contractReadyToken) {
          const creatorNameForEmail = creatorProfile
            ? `${(creatorProfile as any).first_name || ''} ${(creatorProfile as any).last_name || ''}`.trim() || 'Creator'
            : 'Creator';
          sendCollabRequestAcceptedEmail(request.brand_email, {
            creatorName: creatorNameForEmail,
            brandName: request.brand_name,
            dealAmount,
            dealType: normalizeCollabTypeForDb(request.collab_type) === 'barter' ? 'barter' : 'paid',
            deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
            contractReadyToken,
            contractUrl: contractUrl || undefined,
            barterValue: request.barter_value ?? undefined,
          }).catch((e) => console.error('[CollabRequests] Accept confirm: brand email failed:', e));
        }
      }
    } catch (contractErr) {
      console.error('[CollabRequests] Accept confirm: contract generation failed:', contractErr);
    }

    return res.json({
      success: true,
      deal: { id: deal.id },
      contract: contractUrl ? { url: contractUrl, token: contractReadyToken } : null,
      message: contractUrl ? 'Deal accepted. Contract has been generated and sent to the brand.' : 'Deal accepted.',
    });
  } catch (error: any) {
    console.error('[CollabRequests] Accept confirm error:', error);
    return res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

/**
 * PATCH /api/collab-requests/:id/accept
 * Accept a collaboration request and create deal + contract
 */
router.patch('/:id/accept', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Get the collab request
    const { data: request, error: requestError } = await supabase
      .from('collab_requests')
      .select('*')
      .eq('id', id)
      .eq('creator_id', userId)
      .maybeSingle();

    if (requestError || !request) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration request not found',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Request has already been processed',
      });
    }

    // Parse deliverables
    let deliverablesArray: string[] = [];
    try {
      deliverablesArray = typeof request.deliverables === 'string'
        ? JSON.parse(request.deliverables)
        : request.deliverables || [];
    } catch {
      deliverablesArray = [];
    }

    // Calculate deal amount
    let dealAmount = 0;
    if (isPaidLikeCollab(request.collab_type)) {
      dealAmount = request.exact_budget || 0;
    }

    const isBarter = normalizeCollabTypeForDb(request.collab_type) === 'barter';

    // Create brand deal
    const dealData: any = {
      creator_id: userId,
      brand_name: request.brand_name,
      brand_email: request.brand_email,
      deal_amount: dealAmount,
      deliverables: deliverablesArray.join(', '),
      due_date: request.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_expected_date: request.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      platform: 'Other',
      status: 'Drafting',
      deal_type: isBarter ? 'barter' : 'paid',
      created_via: 'collab_request',
      brand_address: request.brand_address,
      brand_phone: request.brand_phone,
      // collab_request_id: request.id, // Column currently missing in production DB
    };

    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .insert(dealData)
      .select('id')
      .single();

    if (dealError || !deal) {
      console.error('[CollabRequests] Error creating deal:', dealError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create deal',
      });
    }

    // Link deal to canonical brand for agency
    const dealBrandContactId = await resolveOrCreateBrandContact({
      legalName: request.brand_name || '',
      email: request.brand_email || '',
      phone: request.brand_phone || null,
      website: null,
      instagram: null,
      address: request.brand_address?.trim() || null,
      gstin: request.brand_gstin?.trim().toUpperCase() || null,
    });
    if (dealBrandContactId) {
      await supabase.from('brand_deals').update({ brand_contact_id: dealBrandContactId, updated_at: new Date().toISOString() }).eq('id', deal.id);
    }

    const now = new Date().toISOString();
    const clientIp = req.ip || (req.socket as any)?.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    // Update collab request status and acceptance metadata
    const { error: updateError } = await supabase
      .from('collab_requests')
      .update({
        status: 'accepted',
        deal_id: deal.id,
        updated_at: now,
      })
      .eq('id', id);

    if (updateError) {
      console.error('[CollabRequests] Error updating request:', updateError);
    }

    // Insert audit log for the acceptance action using deal_action_logs
    await supabase.from('deal_action_logs').insert({
      deal_id: deal.id,
      user_id: userId,
      event: 'CONTRACT_READY',
      metadata: {
        collab_request_id: id,
        auth_method: 'session',
        ip_address: clientIp,
        user_agent: userAgent,
        collab_type: normalizeCollabTypeForApi(request.collab_type) || request.collab_type,
        status: 'CONTRACT_READY'
      },
    }).then(({ error: logErr }) => {
      if (logErr) console.warn('[CollabRequests] Audit log insert failed:', logErr);
    });

    // Barter: require delivery details before contract generation. Redirect creator to delivery-details screen.
    if (isBarter) {
      return res.json({
        success: true,
        deal: { id: deal.id },
        needs_delivery_details: true,
        message: 'Deal accepted. Please add delivery details so we can generate the contract.',
      });
    }

    // Auto-generate contract (paid deals only; barter requires delivery details first)
    const { data: dealCheck } = await supabase
      .from('brand_deals')
      .select('deal_type')
      .eq('id', deal.id)
      .single();
    if ((dealCheck as any)?.deal_type === 'barter') {
      return res.status(400).json({
        success: false,
        error: 'Delivery details required for barter deals',
      });
    }

    let contractUrl: string | null = null;
    let contractReadyToken: string | null = null;

    try {
      // Check if contract already exists for this deal
      const { data: existingDeal } = await supabase
        .from('brand_deals')
        .select('contract_file_url')
        .eq('id', deal.id)
        .single();

      if (existingDeal?.contract_file_url) {
        // Contract already exists, skip generation
        console.log('[CollabRequests] Contract already exists for deal:', deal.id);
        contractUrl = existingDeal.contract_file_url;
      } else {
        // Fetch creator profile for contract generation
        const { data: creatorProfile, error: creatorError } = await supabase
          .from('profiles')
          .select('first_name, last_name, location')
          .eq('id', userId)
          .maybeSingle();

        if (creatorError) {
          console.error('[CollabRequests] Error fetching creator profile:', creatorError);
          // Don't fail the whole request, just log and use defaults
          // We can't generate a good contract without profile, but the deal exists
        }

        // Build creator name
        const creatorName = creatorProfile
          ? `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || 'Creator'
          : 'Creator';

        // Creator email from session context (recommended since missing in profiles table)
        const creatorEmail = req.user?.email || undefined;
        // creatorProfile.location is the canonical column for address
        const creatorAddress = creatorProfile?.location || undefined;

        // Build payment terms based on collab type
        let paymentTerms: string | undefined;
        if (isPaidLikeCollab(request.collab_type)) {
          const paymentDate = request.deadline
            ? new Date(request.deadline).toLocaleDateString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();
          paymentTerms = `Payment expected by ${paymentDate}`;
        }

        // Build deal schema for contract
        const dealSchema = {
          deal_amount: dealAmount,
          deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
          delivery_deadline: request.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          payment: {
            method: 'Bank Transfer',
            timeline: paymentTerms || 'Within 7 days of content delivery',
          },
          usage: {
            type: request.usage_rights ? 'Exclusive' : 'Non-exclusive',
            platforms: ['All platforms'],
            duration: '6 months',
            paid_ads: false,
            whitelisting: false,
          },
          exclusivity: {
            enabled: false,
            category: null,
            duration: null,
          },
          termination: {
            notice_days: 7,
          },
          jurisdiction_city: 'Mumbai', // Default to Mumbai, India
        };

        // Generate contract
        const contractResult = await generateContractFromScratch({
          brandName: request.brand_name,
          creatorName,
          creatorEmail,
          dealAmount,
          deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
          paymentTerms,
          dueDate: request.deadline
            ? new Date(request.deadline).toLocaleDateString()
            : undefined,
          paymentExpectedDate: request.deadline
            ? new Date(request.deadline).toLocaleDateString()
            : undefined,
          platform: 'Multiple Platforms',
          brandEmail: request.brand_email || undefined,
          brandAddress: request.brand_address?.trim() || undefined,
          brandGstin: request.brand_gstin?.trim() || undefined,
          creatorAddress,
          dealSchema,
          usageType: request.usage_rights ? 'Exclusive' : 'Non-exclusive',
          usagePlatforms: ['All platforms'],
          usageDuration: '6 months',
          paidAdsAllowed: false,
          whitelistingAllowed: false,
          exclusivityEnabled: false,
          exclusivityCategory: null,
          exclusivityDuration: null,
          terminationNoticeDays: 7,
          jurisdictionCity: 'Mumbai',
          additionalTerms: normalizeCollabTypeForDb(request.collab_type) === 'barter' && request.barter_description
            ? `Barter Collaboration: ${request.barter_description}`
            : undefined,
        });

        // Upload contract DOCX to storage
        const timestamp = Date.now();
        const storagePath = `contracts/${deal.id}/${timestamp}_${contractResult.fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('creator-assets')
          .upload(storagePath, contractResult.contractDocx, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            upsert: false,
          });

        if (uploadError) {
          console.error('[CollabRequests] Contract upload error:', uploadError);
          throw new Error('Failed to upload contract');
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('creator-assets')
          .getPublicUrl(storagePath);

        contractUrl = publicUrlData?.publicUrl || null;

        if (!contractUrl) {
          throw new Error('Failed to get contract URL');
        }

        // Update deal with contract URL
        const { error: contractUpdateError } = await supabase
          .from('brand_deals')
          .update({
            contract_file_url: contractUrl,
            status: 'CONTRACT_READY', // Contract is ready, awaiting brand signature
            updated_at: new Date().toISOString(),
          })
          .eq('id', deal.id);

        if (contractUpdateError) {
          console.error('[CollabRequests] Error updating deal with contract:', contractUpdateError);
          // Contract was uploaded, so continue anyway
        }

        // Create contract ready token for brand signing
        try {
          const token = await createContractReadyToken({
            dealId: deal.id,
            creatorId: userId,
            expiresAt: null, // No expiry
          });
          contractReadyToken = token.id;

          // Send acceptance email to brand (async, don't await)
          if (request.brand_email && contractReadyToken) {
            sendCollabRequestAcceptedEmail(request.brand_email, {
              creatorName,
              brandName: request.brand_name,
              dealAmount,
              dealType: normalizeCollabTypeForDb(request.collab_type) === 'barter' ? 'barter' : 'paid',
              deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
              contractReadyToken,
              contractUrl: contractUrl || undefined,
            }).catch((emailError) => {
              console.error('[CollabRequests] Acceptance email sending failed (non-fatal):', emailError);
            });
          }

          // Send confirmation to creator (async, don't await)
          const { sendCreatorAcceptanceProcessingEmail } = await import('../services/collabRequestEmailService.js');
          sendCreatorAcceptanceProcessingEmail(
            creatorEmail || '',
            creatorName,
            request.brand_name,
            deal.id
          ).catch((emailError) => {
            console.error('[CollabRequests] Creator acceptance confirmation failed (non-fatal):', emailError);
          });
        } catch (tokenError) {
          console.error('[CollabRequests] Error creating contract ready token:', tokenError);
          // Contract was created, so continue anyway
        }

        console.log('[CollabRequests] Contract generated successfully for deal:', deal.id);
      }
    } catch (contractError: any) {
      // Log error but don't fail the request - deal was created successfully
      console.error('[CollabRequests] Error generating contract:', contractError);
      // Continue - deal exists, creator can generate contract manually if needed
    }

    res.json({
      success: true,
      deal: {
        id: deal.id,
      },
      contract: contractUrl ? {
        url: contractUrl,
        token: contractReadyToken,
      } : null,
      message: contractUrl
        ? 'Collaboration request accepted. Deal created and contract generated successfully.'
        : 'Collaboration request accepted. Deal created successfully.',
    });
  } catch (error: any) {
    console.error('[CollabRequests] Error in PATCH /:id/accept:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PATCH /api/collab-requests/:id/counter
 * Counter offer on a collaboration request
 */
router.patch('/:id/counter', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { final_price, deliverables, payment_terms, notes } = req.body;

    if (!final_price && !deliverables) {
      return res.status(400).json({
        success: false,
        error: 'Counter offer must include price or deliverables',
      });
    }

    // Get the collab request
    const { data: request, error: requestError } = await supabase
      .from('collab_requests')
      .select('*')
      .eq('id', id)
      .eq('creator_id', userId)
      .maybeSingle();

    if (requestError || !request) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration request not found',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Request has already been processed',
      });
    }

    // Create counter offer object
    const counterOffer = {
      final_price: final_price ? parseFloat(final_price) : null,
      deliverables: deliverables || null,
      payment_terms: payment_terms || null,
      notes: notes || null,
      countered_at: new Date().toISOString(),
    };

    // Update collab request
    const { error: updateError } = await supabase
      .from('collab_requests')
      .update({
        status: 'countered',
        counter_offer: counterOffer,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('[CollabRequests] Error updating request:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to submit counter offer',
      });
    }

    // Send counter offer email to brand (async, non-blocking)
    if (request.brand_email) {
      // Fetch creator profile for email
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .maybeSingle();

      const creatorName = creatorProfile
        ? `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || 'Creator'
        : 'Creator';

      sendCollabRequestCounterEmail(request.brand_email, {
        creatorName,
        brandName: request.brand_name,
        originalBudget: request.exact_budget || request.barter_value || null,
        counterPrice: final_price ? parseFloat(final_price) : undefined,
        counterDeliverables: deliverables || undefined,
        counterNotes: notes || undefined,
        requestId: id,
      }).catch((emailError) => {
        console.error('[CollabRequests] Counter offer email sending failed (non-fatal):', emailError);
      });
    }

    res.json({
      success: true,
      message: 'Counter offer submitted successfully',
    });
  } catch (error: any) {
    console.error('[CollabRequests] Error in PATCH /:id/counter:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PATCH /api/collab-requests/:id/decline
 * Decline a collaboration request
 */
router.patch('/:id/decline', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Get the collab request
    const { data: request, error: requestError } = await supabase
      .from('collab_requests')
      .select('*')
      .eq('id', id)
      .eq('creator_id', userId)
      .maybeSingle();

    if (requestError || !request) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration request not found',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Request has already been processed',
      });
    }

    // Update collab request
    const { error: updateError } = await supabase
      .from('collab_requests')
      .update({
        status: 'declined',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('[CollabRequests] Error updating request:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to decline request',
      });
    }

    // Send decline email to brand (async, non-blocking)
    if (request.brand_email) {
      // Fetch creator profile for email
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, username')
        .eq('id', userId)
        .maybeSingle();

      const creatorName = creatorProfile
        ? `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || 'Creator'
        : 'Creator';

      const creatorUsername = creatorProfile?.username || 'creator';

      sendCollabRequestDeclinedEmail(request.brand_email, {
        creatorName,
        brandName: request.brand_name,
        creatorUsername,
      }).catch((emailError) => {
        console.error('[CollabRequests] Decline email sending failed (non-fatal):', emailError);
      });
    }

    res.json({
      success: true,
      message: 'Collaboration request declined',
    });
  } catch (error: any) {
    console.error('[CollabRequests] Error in PATCH /:id/decline:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
