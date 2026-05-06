// @ts-nocheck
// Collaboration Request Link API Routes
// Handles public collab link submissions and creator management

import express, { Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { supabase, supabaseInitialized } from '../lib/supabase.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
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
import { createDealFromCollabRequest } from '../services/dealCreationService.js';
import { 
  isPaidLikeCollab, 
  isBarterLikeCollab, 
  normalizeCollabTypeForDb, 
  normalizeCollabTypeForApi,
  normalizeImageUrl,
  normalizeHandle
} from '../lib/collabUtils.js';
import { estimateBarterValueRange, estimateReelBudgetRange, estimateReelRate, getEffectiveReelRate } from '../services/creatorRateService.js';
import { fetchInstagramPublicData } from '../services/instagramService.js';
import { notifyCreatorOnCollabRequestCreated, sendGenericPushNotificationToCreator } from '../services/pushNotificationService.js';
import { findOrCreateBrandUser, generateBrandMagicLink } from '../services/brandAuthService.js';
import { getCreatorNotificationContent } from '../domains/deals/creatorNotificationCopy.js';
import { recordMarketplaceEvent } from '../shared/lib/marketplaceAnalytics.js';
import { invalidateDealsMineCache } from './deals.js';
import { saveExternalImageToStorage } from '../services/imageStorageService.js';
import { logFailedNotification } from '../utils/outbox.js';
import { collabSubmissionLimiter } from '../shared/middleware/security.js';

const router = express.Router();

// Tiny in-memory cache to hide Supabase latency for dashboard bootstraps.
// TTL is short to avoid stale offers; caller can always refresh.
const collabRequestsCache = new Map<string, { expiresAt: number; value: any }>();
const COLLAB_REQUESTS_CACHE_TTL_MS = 15_000;

function getCollabRequestsCache(key: string) {
  const hit = collabRequestsCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    collabRequestsCache.delete(key);
    return null;
  }
  return hit.value;
}

export function setCollabRequestsCache(key: string, value: any) {
  collabRequestsCache.set(key, { expiresAt: Date.now() + COLLAB_REQUESTS_CACHE_TTL_MS, value });
}

export function invalidateCollabRequestsCache(userId: string) {
  for (const key of collabRequestsCache.keys()) {
    if (key.startsWith(userId)) {
      collabRequestsCache.delete(key);
    }
  }
}

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
  // Detect iOS vs Android first
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return 'ios';
  }
  if (ua.includes('android')) {
    return 'android';
  }
  // Fallbacks
  if (ua.includes('mobile')) {
    return 'mobile';
  }
  if (ua.includes('tablet')) {
    return 'tablet';
  }
  if (ua.includes('desktop') || ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
    return 'desktop';
  }
  return 'unknown';
}

// Normalization helpers moved to ../lib/collabUtils.ts

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

const resolveBrandUserIdForPush = async (brandId?: string | null, brandEmail?: string | null) => {
  if (brandId) return brandId;
  if (!brandEmail) return null;

  const { data: brandProfile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', brandEmail)
    .maybeSingle();

  if (error) {
    console.warn('[CollabRequests] Failed to resolve brand profile for push:', error.message);
    return null;
  }

  return brandProfile?.id || null;
};

const notifyBrandOnCreatorAcceptance = async ({
  brandId,
  brandEmail,
  creatorName,
  dealId,
  requestId,
  isBarter,
}: {
  brandId?: string | null;
  brandEmail?: string | null;
  creatorName: string;
  dealId: string;
  requestId: string;
  isBarter: boolean;
}) => {
  const targetBrandUserId = await resolveBrandUserIdForPush(brandId, brandEmail);
  if (!targetBrandUserId) {
    console.log('[CollabRequests] Skipping brand push: no brand user id found', { requestId, brandEmail });
    return;
  }

  const result = await sendGenericPushNotificationToCreator({
    creatorId: targetBrandUserId,
    title: 'Creator accepted your offer',
    body: isBarter
      ? `${creatorName} accepted. Add delivery details to keep the deal moving.`
      : `${creatorName} accepted. Review the deal and complete the next step.`,
    url: `/brand-dashboard?tab=collabs&subtab=active&dealId=${encodeURIComponent(dealId)}`,
    data: {
      type: 'brand_offer_accepted',
      requestId,
      dealId,
    },
  });

  console.log('[CollabRequests] Brand acceptance push result:', {
    requestId,
    dealId,
    brandUserId: targetBrandUserId,
    ...result,
  });
};

const createBrandAcceptanceNotification = async ({
  brandId,
  brandEmail,
  creatorName,
  dealId,
  requestId,
  isBarter,
}: {
  brandId?: string | null;
  brandEmail?: string | null;
  creatorName: string;
  dealId: string;
  requestId: string;
  isBarter: boolean;
}) => {
  const targetBrandUserId = await resolveBrandUserIdForPush(brandId, brandEmail);
  if (!targetBrandUserId) {
    console.log('[CollabRequests] Skipping brand notification: no brand user id found', { requestId, brandEmail });
    return;
  }

  const title = 'Creator accepted your offer';
  const message = isBarter
    ? `${creatorName} accepted. Add shipping details to keep the barter collaboration moving.`
    : `${creatorName} accepted. Review the deal and complete the next step.`;
  const actionLink = `/brand-dashboard?tab=collabs&subtab=active&dealId=${encodeURIComponent(dealId)}`;

  const { error } = await supabase.from('notifications').insert({
    user_id: targetBrandUserId,
    type: 'deal',
    category: 'collab_request',
    title,
    message,
    data: {
      type: 'brand_offer_accepted',
      requestId,
      dealId,
      collab_type: isBarter ? 'barter' : 'paid',
    },
    link: actionLink,
    priority: 'high',
    icon: 'CheckCircle',
    action_label: isBarter ? 'Add shipping details' : 'Review deal',
    action_link: actionLink,
    read: false,
  });

  if (error) {
    console.warn('[CollabRequests] Failed to create brand acceptance notification:', error.message);
    return;
  }

  console.log('[CollabRequests] Brand acceptance notification created:', {
    requestId,
    dealId,
    brandUserId: targetBrandUserId,
  });
};

const isMissingColumnError = (error: any): boolean => {
  if (!error) return false;
  return (
    error.code === '42703'
    || error.code === 'PGRST204'
    || /column .* does not exist/i.test(error.message || '')
    || /could not find the '.*' column/i.test(error.message || '')
  );
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

const resolveCreatorByPublicHandle = async (handle: string, selectColumns: string) => {
  const normalizedHandle = normalizeHandle(handle);
  if (!normalizedHandle) {
    return {
      creator: null,
      error: null,
      normalizedHandle: null,
      isStaleUsernameLink: false,
      canonicalHandle: null,
    };
  }

  const { data: instagramProfiles, error: instagramError } = await supabase
    .from('profiles')
    .select(selectColumns)
    .eq('instagram_handle', normalizedHandle)
    .eq('role', 'creator')
    .limit(1);

  if (instagramError) {
    return {
      creator: null,
      error: instagramError,
      normalizedHandle,
      isStaleUsernameLink: false,
      canonicalHandle: null,
    };
  }

  if (Array.isArray(instagramProfiles) && instagramProfiles.length > 0) {
    return {
      creator: instagramProfiles[0],
      error: null,
      normalizedHandle,
      isStaleUsernameLink: false,
      canonicalHandle: normalizedHandle,
    };
  }

  const { data: usernameProfiles, error: usernameError } = await supabase
    .from('profiles')
    .select(selectColumns)
    .eq('username', normalizedHandle)
    .eq('role', 'creator')
    .limit(1);

  if (usernameError) {
    return {
      creator: null,
      error: usernameError,
      normalizedHandle,
      isStaleUsernameLink: false,
      canonicalHandle: null,
    };
  }

  const usernameMatch = Array.isArray(usernameProfiles) && usernameProfiles.length > 0
    ? usernameProfiles[0]
    : null;

  if (!usernameMatch) {
    return {
      creator: null,
      error: null,
      normalizedHandle,
      isStaleUsernameLink: false,
      canonicalHandle: null,
    };
  }

  const canonicalHandle = normalizeHandle((usernameMatch as any).instagram_handle);
  if (canonicalHandle && canonicalHandle !== normalizedHandle) {
    return {
      creator: null,
      error: null,
      normalizedHandle,
      isStaleUsernameLink: true,
      canonicalHandle,
    };
  }

  return {
    creator: usernameMatch,
    error: null,
    normalizedHandle,
    isStaleUsernameLink: false,
    canonicalHandle: canonicalHandle || normalizedHandle,
  };
};

const humanizePublicHandle = (handle: string | null | undefined) => {
  const clean = String(handle || '').trim().replace(/^@/, '');
  if (!clean) return null;
  const words = clean
    .split(/[._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (words.length === 0 || words.some((word) => /\d/.test(word))) return null;
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const resolvePublicCreatorName = ({
  profileName,
  businessName,
  publicHandle,
}: {
  profileName?: string | null;
  businessName?: string | null;
  publicHandle?: string | null;
}) => {
  const storedName = String(profileName || '').trim();
  if (storedName) return storedName;

  const business = String(businessName || '').trim();
  if (business) return business;

  const handleName = humanizePublicHandle(publicHandle);
  return handleName || null;
};

const isGeneratedCreatorHandle = (value?: string | null) => {
  if (!value) return false;
  return /^creator-[a-z0-9]{6,}$/i.test(value.trim());
};

const startRegisteredCreatorBackgroundSync = (profile: any) => {
  if (!profile?.id || !profile?.instagram_handle) return;

  const existingFollowers = profile.instagram_followers;
  const existingPhoto = profile.instagram_profile_photo;
  const lastSync = profile.last_instagram_sync
    ? new Date(profile.last_instagram_sync).getTime()
    : 0;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  
  // Check if current photo is external (Instagram CDN)
  const isExternalPhoto = existingPhoto && (
    existingPhoto.includes('cdninstagram.com') || 
    existingPhoto.includes('fbcdn.net') || 
    !existingPhoto.includes('supabase.co')
  );

  const isStale = !lastSync || (Date.now() - lastSync) > sevenDaysMs;
  const shouldSync = isStale || !existingFollowers || isExternalPhoto;
  if (!shouldSync) return;

  setTimeout(async () => {
    try {
      const instaData = await fetchInstagramPublicData(profile.instagram_handle as string);
      if (!instaData) return;

      const updatePayload: Record<string, unknown> = {
        last_instagram_sync: new Date().toISOString(),
      };
      
      if (typeof instaData.followers === 'number') updatePayload.instagram_followers = instaData.followers;
      
      // Permanently save the profile photo if it's from Instagram
      if (instaData.profile_photo) {
        const isNewExternal = instaData.profile_photo.includes('cdninstagram.com') || 
                             instaData.profile_photo.includes('fbcdn.net') ||
                             !instaData.profile_photo.includes('supabase.co');
        
        if (isNewExternal) {
          const fileName = `profile-${Date.now()}.jpg`;
          const filePath = `${profile.id}/${fileName}`;
          const permanentUrl = await saveExternalImageToStorage(instaData.profile_photo, filePath);
          
          if (permanentUrl) {
            updatePayload.instagram_profile_photo = permanentUrl;
            updatePayload.avatar_url = permanentUrl;
            console.log('[CollabRequests] Permanently saved profile photo for:', profile.instagram_handle);
          } else {
            // Fallback to the temporary URL if saving failed
            updatePayload.instagram_profile_photo = instaData.profile_photo;
          }
        } else {
          updatePayload.instagram_profile_photo = instaData.profile_photo;
        }
      }
      
      // Optional enrichment: only backfill bio/name if creator hasn't set them already.
      if (!profile.bio && instaData.bio) updatePayload.bio = instaData.bio;
      if (!profile.business_name && instaData.full_name) updatePayload.business_name = instaData.full_name;

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
    const candidatePayload = { ...payload };
    const optionalColumns = [
      'request_payload',
      'target_channel',
      'brand_phone',
      'brand_website',
      'brand_instagram',
      'submitted_ip',
      'submitted_user_agent',
      'selected_package_id',
      'selected_package_label',
      'selected_package_type',
      'selected_addons',
      'content_quantity',
      'content_duration',
      'content_requirements',
      'barter_types',
    ];

    for (;;) {
      const { data, error } = await supabase
        .from(table)
        .insert(candidatePayload as any)
        .select('id, created_at')
        .single();

      if (!error && data) {
        return { record: data, table };
      }

      if (isMissingTableError(error)) {
        lastError = error;
        break;
      }

      if (isMissingColumnError(error)) {
        lastError = error;
        const missingColumn = optionalColumns.find((column) =>
          new RegExp(`column .*${column}.* does not exist`, 'i').test(error.message || '') ||
          new RegExp(`could not find the ['"]${column}['"] column`, 'i').test(error.message || '')
        );
        if (missingColumn && missingColumn in candidatePayload) {
          delete candidatePayload[missingColumn];
          continue;
        }
        break;
      }

      throw error;
    }
  }

  throw lastError || new Error('No lead table available for unclaimed collab requests');
};

async function attachPendingCollabLeadsForCreator(creatorId: string): Promise<{ attached: number; failed: number }> {
  if (!creatorId) return { attached: 0, failed: 0 };

  const { data: creatorProfileRow } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, business_name, username, instagram_handle, creator_category, avatar_url, instagram_followers, youtube_subs, tiktok_followers, twitter_followers')
    .eq('id', creatorId)
    .maybeSingle();

  let creatorProfile: any = creatorProfileRow || null;
  let authUserEmail: string | null = null;

  try {
    const { data: authUser } = await supabase.auth.admin.getUserById(creatorId);
    authUserEmail = authUser?.user?.email || null;

    if (!creatorProfile && authUser?.user) {
      const metadata = authUser.user.user_metadata || {};
      const fullName = String(metadata.full_name || '').trim();
      const firstName = fullName.split(' ')[0] || '';
      const lastName = fullName.split(' ').slice(1).join(' ');
      const fallbackHandle = normalizeHandle(
        metadata.instagram_handle || metadata.username || authUser.user.email?.split('@')[0] || ''
      );

      creatorProfile = {
        id: creatorId,
        first_name: firstName,
        last_name: lastName,
        business_name: metadata.business_name || null,
        username: fallbackHandle || null,
        instagram_handle: fallbackHandle || null,
        creator_category: metadata.creator_category || null,
        avatar_url: metadata.avatar_url || null,
        instagram_followers: null,
        youtube_subs: null,
        tiktok_followers: null,
        twitter_followers: null,
      };
    }
  } catch (error) {
    console.warn('[CollabRequests] Failed to fetch auth metadata for lead attachment fallback:', error);
  }

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
  const creatorName = `${(creatorProfile as any).first_name || ''} ${(creatorProfile as any).last_name || ''}`.trim()
    || (creatorProfile as any).business_name
    || 'Creator';

  const creatorEmail = authUserEmail;

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
        campaign_category: claimedLead.campaign_category || null,
        campaign_goal: claimedLead.campaign_goal || null,
        selected_package_id: claimedLead.selected_package_id || null,
        selected_package_label: claimedLead.selected_package_label || null,
        selected_package_type: claimedLead.selected_package_type || null,
        selected_addons: Array.isArray(claimedLead.selected_addons) ? claimedLead.selected_addons : [],
        content_quantity: claimedLead.content_quantity || null,
        content_duration: claimedLead.content_duration || null,
        content_requirements: Array.isArray(claimedLead.content_requirements) ? claimedLead.content_requirements : [],
        barter_types: Array.isArray(claimedLead.barter_types) ? claimedLead.barter_types : [],
        deliverables: claimedLead.deliverables || [],
        usage_rights: claimedLead.usage_rights === true,
        deadline: claimedLead.deadline || null,
        submitted_ip: claimedLead.submitted_ip || null,
        submitted_user_agent: claimedLead.submitted_user_agent || null,
        ...(brandContactId ? { brand_contact_id: brandContactId } : {}),
      };

      const optionalRequestColumns = [
        'source_lead_id',
        'brand_address',
        'brand_gstin',
        'brand_phone',
        'brand_website',
        'brand_instagram',
        'barter_product_image_url',
        'campaign_category',
        'campaign_goal',
        'selected_package_id',
        'selected_package_label',
        'selected_package_type',
        'selected_addons',
        'content_quantity',
        'content_duration',
        'content_requirements',
        'barter_types',
        'brand_contact_id',
      ];

      let requestId: string | null = null;
      const requestInsertPayload: any = { ...insertData };
      let insertedRequest: any = null;
      let insertError: any = null;

      for (let attempt = 0; attempt < 8; attempt++) {
        const result = await supabase
          .from('collab_requests')
          .insert(requestInsertPayload)
          .select('id')
          .maybeSingle();

        insertedRequest = result.data;
        insertError = result.error;

        if (!insertError) break;

        if (isMissingColumnError(insertError)) {
          const missingColumn = optionalRequestColumns.find((column) =>
            new RegExp(`column .*${column}.* does not exist`, 'i').test(insertError.message || '') ||
            new RegExp(`could not find the ['"]${column}['"] column`, 'i').test(insertError.message || '')
          );
          if (missingColumn && missingColumn in requestInsertPayload) {
            delete requestInsertPayload[missingColumn];
            continue;
          }
        }

        break;
      }

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
        await recordMarketplaceEvent(supabase, {
          eventName: 'offer_received',
          userId: creatorId,
          creatorId,
          requestId,
          metadata: {
            creator_id: creatorId,
            request_id: requestId,
            brand_name: claimedLead.brand_name,
            collab_type: collabTypeForApi,
          },
        });

        const creatorOfferNotification = getCreatorNotificationContent('offer_received', {
          id: requestId,
          status: 'OFFER_SENT',
          creator_id: creatorId,
          brand_email: claimedLead.brand_email || '',
          brand_name: claimedLead.brand_name,
          deal_type: collabTypeForApi || 'paid',
          deal_amount: Number(claimedLead.exact_budget || claimedLead.barter_value || 0),
          current_state: 'OFFER_SENT',
        });
        const requestReviewPath = `/collab-requests/${requestId}/brief`;
        await supabase.from('notifications').insert({
          user_id: creatorId,
          type: creatorOfferNotification.type,
          category: creatorOfferNotification.category,
          title: creatorOfferNotification.title,
          message: creatorOfferNotification.message,
          data: {
            collab_request_id: requestId,
            brand_name: claimedLead.brand_name,
            collab_type: collabTypeForApi,
            source: 'attached_lead',
          },
          link: requestReviewPath,
          priority: creatorOfferNotification.priority,
          icon: creatorOfferNotification.type,
          action_label: creatorOfferNotification.actionLabel,
          action_link: requestReviewPath,
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

    const frontendUrl = process.env.FRONTEND_URL || 'https://creatorarmour.com';
    const resumeUrl = `${frontendUrl}/${encodeURIComponent(normalizedUsername)}?resume=${encodeURIComponent(resumeToken)}`;

    let creatorName = 'the creator';
    const profileRes = await supabase
      .from('profiles')
      .select('first_name, last_name, business_name')
      .or(`username.eq.${normalizedUsername},instagram_handle.eq.${normalizedUsername}`)
      .eq('role', 'creator')
      .maybeSingle();
    if (profileRes.data) {
      const p = profileRes.data as any;
      creatorName = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.business_name || 'the creator';
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
    const { data: tokenRow, error: tokenError } = await supabase
      .from('collab_accept_tokens')
      .select('id, collab_request_id, creator_email, expires_at')
      .eq('id', requestToken)
      .maybeSingle();
    if (tokenError || !tokenRow) {
      return res.status(404).json({ success: false, error: 'Invalid link' });
    }
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
 * GET /api/collab/availability/:username
 * Checks whether a collab handle is already claimed by an existing creator profile.
 * Note: This does not use Instagram/public fallback logic.
 */
router.get('/availability/:username', async (req: Request, res: Response) => {
  try {
    const raw = req.params.username;
    const normalized = normalizeHandle(raw);
    if (!normalized || normalized.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid username',
        available: false,
      });
    }

    const { data: instaProfiles, error: instaError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'creator')
      .eq('instagram_handle', normalized)
      .limit(1);

    if (instaError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to check username availability',
        code: instaError.code,
      });
    }

    if (Array.isArray(instaProfiles) && instaProfiles.length > 0) {
      return res.json({ success: true, available: false, reason: 'claimed' });
    }

    const { data: userProfiles, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'creator')
      .eq('username', normalized)
      .limit(1);

    if (userError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to check username availability',
        code: userError.code,
      });
    }

    if (Array.isArray(userProfiles) && userProfiles.length > 0) {
      return res.json({ success: true, available: false, reason: 'claimed' });
    }

    return res.json({ success: true, available: true });
  } catch (error: any) {
    console.error('[CollabRequests] Availability check failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check username availability',
    });
  }
});

const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 
  'yopmail.com', 'rediffmail.com', 'zoho.com', 'live.com', 'me.com', 
  'msn.com', 'mail.com', 'protonmail.com', 'aol.com'
]);

function inferLogoFromEmail(email: string): string | null {
  if (!email || !email.includes('@')) return null;
  const domain = email.split('@')[1].toLowerCase();
  if (PUBLIC_EMAIL_DOMAINS.has(domain)) return null;
  // Use Clearbit for custom domains
  return `https://logo.clearbit.com/${domain}`;
}

/**
 * GET /lookup-brand
 * Fetch brand logo and brand name from registered dashboard email to autofill public forms.
 */
router.get('/lookup-brand', async (req: Request, res: Response) => {
  try {
    const email = (req.query.email as string)?.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email query parameter is required' });
    }

    if (!supabaseInitialized) {
      return res.status(503).json({ success: false, error: 'Database connection not initialized' });
    }

    const firstDefined = (...values: Array<string | null | undefined>) =>
      values.map(value => String(value || '').trim()).find(Boolean) || null;

    console.log(`[lookup-brand] Looking up: ${email}`);
    // 1. Check profiles table first (Primary Account Storage)
    const { data: profileRow, error: profileErr } = await supabase
      .from('profiles')
      .select('id, business_name, avatar_url, profile_image_url, role, pincode, location, email, username')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();

    if (profileRow && !profileErr) {
      console.log(`[lookup-brand] Found profile: ${profileRow.id}, searching for brand record...`);
      // Also check the 'brands' profile table which is where the dashboard usually saves the logo
      const { data: brandProfile } = await supabase
        .from('brands')
        .select('name, logo_url, avatar_url, brand_logo_url, logo, image_url, website_url')
        .eq('external_id', profileRow.id)
        .maybeSingle();

      const resolvedLogo = firstDefined(
        (brandProfile as any)?.logo_url,
        (brandProfile as any)?.brand_logo_url,
        (brandProfile as any)?.avatar_url,
        (brandProfile as any)?.logo,
        (brandProfile as any)?.image_url,
        profileRow.avatar_url,
        profileRow.profile_image_url
      );

      console.log(`[lookup-brand] Brand record found:`, brandProfile);
      return res.json({
        success: true,
        data: {
          brand_name: brandProfile?.name || profileRow.business_name || null,
          logo: resolvedLogo,
          instagram: null,
          website: brandProfile?.website_url || null,
          pincode: profileRow.pincode || null,
          location: profileRow.location || null,
          logo_source: brandProfile?.logo_url ? 'brands.logo_url'
            : (brandProfile as any)?.brand_logo_url ? 'brands.brand_logo_url'
            : (brandProfile as any)?.avatar_url ? 'brands.avatar_url'
            : (brandProfile as any)?.logo ? 'brands.logo'
            : (brandProfile as any)?.image_url ? 'brands.image_url'
            : profileRow.avatar_url ? 'profiles.avatar_url'
            : profileRow.profile_image_url ? 'profiles.profile_image_url'
            : null
        }
      });
    }

    // 2. Fallback to brand_users (Legacy/Alternate Storage)
    console.log(`[lookup-brand] Profile not found, checking brand_users...`);
    const { data: brandUser, error: brandUserErr } = await supabase
      .from('brand_users')
      .select('id, brand_name, brand_logo_url, avatar_url, logo_url, instagram_handle')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();
      
    if (brandUser && !brandUserErr) {
      const { data: brandProfile } = await supabase
        .from('brands')
        .select('name, logo_url, avatar_url, brand_logo_url, logo, image_url, website_url')
        .eq('external_id', brandUser.id)
        .maybeSingle();

      const resolvedLogo = firstDefined(
        (brandProfile as any)?.logo_url,
        (brandProfile as any)?.brand_logo_url,
        (brandProfile as any)?.avatar_url,
        (brandProfile as any)?.logo,
        (brandProfile as any)?.image_url,
        brandUser.brand_logo_url,
        (brandUser as any)?.avatar_url,
        (brandUser as any)?.logo_url
      );

      return res.json({
        success: true,
        data: {
          brand_name: brandProfile?.name || brandUser.brand_name || null,
          logo: resolvedLogo,
          instagram: brandUser.instagram_handle || null,
          website: brandProfile?.website_url || null,
          logo_source: brandProfile?.logo_url ? 'brands.logo_url'
            : (brandProfile as any)?.brand_logo_url ? 'brands.brand_logo_url'
            : (brandProfile as any)?.avatar_url ? 'brands.avatar_url'
            : (brandProfile as any)?.logo ? 'brands.logo'
            : (brandProfile as any)?.image_url ? 'brands.image_url'
            : brandUser.brand_logo_url ? 'brand_users.brand_logo_url'
            : (brandUser as any)?.avatar_url ? 'brand_users.avatar_url'
            : (brandUser as any)?.logo_url ? 'brand_users.logo_url'
            : null
        }
      });
    }

    // 2. Check past collab_requests if no registered brand exists
    // This allows returning logos for unregistered brands that have previously submitted requests
    const { data: pastRequests, error: pastReqErr } = await supabase
      .from('collab_requests')
      .select('brand_name, brand_logo_url, brand_instagram')
      .eq('brand_email', email)
      .order('created_at', { ascending: false })
      .limit(10);

    const pastRequest = pastRequests?.find((request) => request?.brand_name);
    const resolvedPastLogo = pastRequests?.find((request) => firstDefined(request?.brand_logo_url));

    if (pastRequest && !pastReqErr) {
      const resolvedLogo = firstDefined(pastRequest.brand_logo_url);
      return res.json({
        success: true,
        data: {
          brand_name: pastRequest.brand_name || null,
          logo: resolvedLogo || firstDefined(resolvedPastLogo?.brand_logo_url),
          instagram: pastRequest.brand_instagram || null
        }
      });
    }

    return res.json({
      success: false,
      error: 'Brand not registered',
      data: null
    });
  } catch (error: any) {
    console.error('[CollabRequests] Error in /lookup-brand:', error);
    res.status(500).json({ success: false, error: 'Internal server error during brand lookup' });
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

    const normalizedUsername = normalizeHandle(username) || username.toLowerCase().trim();

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
      onboarding_complete,
      avatar_url,
      username
    `;

    const resolvedCreator = await resolveCreatorByPublicHandle(normalizedUsername, baseProfileSelect);
    let profile = resolvedCreator.creator;
    const profileError = resolvedCreator.error;

    if (resolvedCreator.isStaleUsernameLink) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found',
        message: 'This creator link has moved to a new Instagram handle.',
      });
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
          portfolio_links,
          avatar_url,
          avg_rate_reel,
          avg_reel_views_manual,
          avg_likes_manual,
          active_brand_collabs_month,
          campaign_slot_note,
          pincode,
          city,
          location
        `)
        .eq('id', profile.id)
        .maybeSingle();

      if (extendedProfile) {
        profile = { ...profile, ...extendedProfile };
      }

      try {
        const { data: portfolioProfile } = await supabase
          .from('profiles')
          .select('portfolio_links, media_kit_url')
          .eq('id', profile.id)
          .maybeSingle();

        if (portfolioProfile) {
          const nextProfile: Record<string, unknown> = { ...profile };
          if (Array.isArray((portfolioProfile as any).portfolio_links)) {
            nextProfile.portfolio_links = (portfolioProfile as any).portfolio_links;
          }
          if (typeof (portfolioProfile as any).media_kit_url === 'string' || (portfolioProfile as any).media_kit_url === null) {
            nextProfile.media_kit_url = (portfolioProfile as any).media_kit_url;
          }
          profile = nextProfile as typeof profile;
        }
      } catch (e) { /* ignore portfolio query errors */ }

      try {
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
      } catch (e) { /* ignore trust arrays query errors */ }
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
            completion_rate: 98,
            avg_response_hours: 3,
          },
        },
      });
    }

    // Background enrichment only: never blocks rendering of registered creator profile.
    startRegisteredCreatorBackgroundSync(profile);

    // Build platforms array (handle missing columns gracefully)
    const platforms: Array<{ name: string; handle: string; followers?: number }> = [];
    const p = profile as any;
    let resolvedInstagramFollowers: number | null = typeof p.instagram_followers === 'number'
      ? p.instagram_followers
      : null;

    // Resolve profile photo with strict priority: avatar_url (Supabase) > instagram_profile_photo (CDN)
    let resolvedProfilePhoto: string | null = 
      normalizeImageUrl(p.avatar_url) || 
      normalizeImageUrl(p.instagram_profile_photo) || 
      null;
    let resolvedBio: string | null = profile.bio || null;
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    let resolvedName: string | null = fullName || null;
    const instagramHandleValue = (profile.instagram_handle || '').trim();
    const usernameHandleValue = (profile.username || '').trim();
    const primaryPublicHandle = instagramHandleValue
      || (!isGeneratedCreatorHandle(usernameHandleValue) ? usernameHandleValue : null);
    const instagramSourceHandle = instagramHandleValue || primaryPublicHandle;

    // If public Instagram data is missing or followers are 0, fetch a cached public fallback for better collab-page UX.
    if (instagramSourceHandle && (!resolvedInstagramFollowers || !resolvedBio || !resolvedName)) {
      try {
        const shouldForceFreshInstagram =
          Boolean((profile.instagram_handle || '').trim())
          && Boolean((profile.username || '').trim())
          && (profile.instagram_handle || '').trim().toLowerCase() !== (profile.username || '').trim().toLowerCase();

        const instagramData = shouldForceFreshInstagram
          ? await fetchInstagramPublicData(instagramSourceHandle)
          : await getCachedInstagramPublicData(instagramSourceHandle);

        if (typeof instagramData?.followers === 'number') {
          resolvedInstagramFollowers = instagramData.followers;
        }
        if (!resolvedProfilePhoto && instagramData?.profile_photo) {
          resolvedProfilePhoto = normalizeImageUrl(instagramData.profile_photo);
        }
        if (!resolvedBio && instagramData?.bio) {
          resolvedBio = instagramData.bio;
        }
        if (!resolvedName && instagramData?.full_name) {
          resolvedName = instagramData.full_name;
        }
      } catch (fallbackError: any) {
        console.warn('[CollabRequests] Registered creator Instagram fallback skipped:', fallbackError?.message || fallbackError);
      }
    }

    resolvedName = resolvePublicCreatorName({
      profileName: resolvedName,
      businessName: profile.business_name,
      publicHandle: primaryPublicHandle,
    });

    if (primaryPublicHandle) {
      platforms.push({
        name: 'Instagram',
        handle: primaryPublicHandle,
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
    const creatorName = resolvedName || primaryPublicHandle || 'Creator';
    const profilePhoto = resolvedProfilePhoto;

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
        completion_rate: totalDeals > 0 ? Math.round((completedDeals / totalDeals) * 100) : 98,
        avg_response_hours: avgResponseHours !== null ? Math.max(1, Math.round(avgResponseHours)) : 3,
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
        profile_photo: profilePhoto,
        followers: resolvedInstagramFollowers,
        last_instagram_sync: (profile as any).last_instagram_sync || null,
        bio: resolvedBio,
        open_to_collabs: (profile as any).open_to_collabs !== false,
        content_niches: Array.isArray((profile as any).content_niches) ? (profile as any).content_niches : [],
        media_kit_url: (profile as any).media_kit_url || null,
        portfolio_links: Array.isArray((profile as any).portfolio_links) ? (profile as any).portfolio_links : [],
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
        collab_intro_line: (profile as any).collab_intro_line || null,
        collab_audience_fit_note: (profile as any).collab_audience_fit_note || null,
        collab_recent_activity_note: (profile as any).collab_recent_activity_note || null,
        collab_audience_relevance_note: (profile as any).collab_audience_relevance_note || null,
        collab_delivery_reliability_note: (profile as any).collab_delivery_reliability_note || null,
        collab_engagement_confidence_note: (profile as any).collab_engagement_confidence_note || null,
        collab_response_behavior_note: (profile as any).collab_response_behavior_note || null,
        collab_cta_trust_note: (profile as any).collab_cta_trust_note || null,
        collab_cta_dm_note: (profile as any).collab_cta_dm_note || null,
        collab_cta_platform_note: (profile as any).collab_cta_platform_note || null,
        collab_show_packages: (profile as any).collab_show_packages ?? true,
        collab_show_trust_signals: (profile as any).collab_show_trust_signals ?? true,
        collab_show_audience_snapshot: (profile as any).collab_show_audience_snapshot ?? true,
        collab_show_past_work: (profile as any).collab_show_past_work ?? true,
        collab_past_work_items: Array.isArray((profile as any).collab_past_work_items) ? (profile as any).collab_past_work_items : [],
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
        // Qualification & Deal Rules
        min_deal_value: (profile as any).pricing_min ?? null,
        min_lead_time_days: 3, // Hardcoded for demo/baseline
        typical_story_rate: null,
        typical_post_rate: null,
        premium_production_multiplier: null,
        brand_type_preferences: null,
        campaign_type_support: null,
        revision_policy: null,
        allow_negotiation: true,
        allow_counter_offer: true,
        onboarding_complete: (profile as any).onboarding_complete ?? null,
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
 * POST /api/collab/:username/upload-brand-logo
 * Upload optional brand logo (requires authentication and ownership verification)
 */
router.post(
  '/:username/upload-brand-logo',
  authMiddleware,
  barterImageUpload.single('file'),
  async (req: AuthenticatedRequest & { file?: Express.Multer.File }, res: Response) => {
    try {
      const file = req.file;
      if (!file || !file.buffer) {
        return res.status(400).json({ success: false, error: 'No image file provided' });
      }

      // Verify user owns the brand profile
      const { data: brandProfile } = await supabase
        .from('brand_profiles')
        .select('id, owner_id')
        .eq('username', req.params.username)
        .eq('owner_id', req.user.id)
        .single();

      if (!brandProfile) {
        return res.status(403).json({ 
          success: false, 
          error: 'Access denied: you do not own this brand profile' 
        });
      }

      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
      if (!allowed.includes(file.mimetype)) {
        return res.status(400).json({ success: false, error: 'Only JPEG, PNG, WebP, SVG, and GIF are allowed' });
      }

      // Verify file content (basic magic byte check)
      const mimeType = file.mimetype;
      const isImage = file.buffer.slice(0, 4).toString('hex').match(/^(ffd8ffe0|89504e47|47494638|52494646|57454250)/);
      if (!isImage && mimeType !== 'image/svg+xml') {
        return res.status(400).json({ 
          success: false, 
          error: 'File content does not match declared MIME type. SVG files not supported via this endpoint.' 
        });
      }

      const ext = mimeType.split('/')[1].split('+')[0];
      const path = `collab-requests/logos/brand_${brandProfile.id}/${crypto.randomUUID()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('creator-assets')
        .upload(path, file.buffer, { 
          contentType: file.mimetype, 
          upsert: false,
          cacheControl: '3600'
        });
      
      if (uploadError) {
        console.error('[CollabRequests] Brief logo upload error:', uploadError);
        return res.status(500).json({ success: false, error: 'Failed to upload logo' });
      }

      // Update brand profile with logo path
      await supabase
        .from('brand_profiles')
        .update({ logo_url: path })
        .eq('id', brandProfile.id);

      const { data: urlData } = supabase.storage.from('creator-assets').getPublicUrl(path);
      return res.status(200).json({ success: true, url: urlData.publicUrl });

    } catch (e) {
      console.error('[CollabRequests] Logo upload exception:', e);
      return res.status(500).json({ success: false, error: 'Failed to upload logo' });
    }
  }
);

/**
 * POST /api/collab/:username/upload-public-brand-logo
 * Upload optional brand logo for public landing page (public, no auth).
 */
router.post(
  '/:username/upload-public-brand-logo',
  barterImageUpload.single('file'),
  async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    try {
      const file = req.file;
      if (!file || !file.buffer) {
        return res.status(400).json({ success: false, error: 'No image file provided' });
      }

      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowed.includes(file.mimetype)) {
        return res.status(400).json({ success: false, error: 'Only JPEG, PNG, WebP, and GIF are allowed' });
      }

      const ext = file.mimetype.split('/')[1];
      const path = `collab-requests/logos/public/${crypto.randomUUID()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('creator-assets')
        .upload(path, file.buffer, { 
          contentType: file.mimetype, 
          upsert: false,
          cacheControl: '3600'
        });
      
      if (uploadError) {
        console.error('[CollabRequests] Public logo upload error:', uploadError);
        return res.status(500).json({ success: false, error: 'Failed to upload logo' });
      }

      const { data: urlData } = supabase.storage.from('creator-assets').getPublicUrl(path);
      return res.status(200).json({ success: true, url: urlData.publicUrl });

    } catch (e) {
      console.error('[CollabRequests] Public logo upload exception:', e);
      return res.status(500).json({ success: false, error: 'Failed to upload logo' });
    }
  }
);

/**
 * POST /api/collab/:username/submit
 * Submit a collaboration request (public, rate-limited)
 */
router.post('/:username/submit', collabSubmissionLimiter, async (req: Request, res: Response) => {
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
      brand_logo_url,
      collab_type,
      budget_range,
      exact_budget,
      barter_description,
      barter_product_name,
      barter_product_category,
      barter_value,
      barter_product_image_url,
      selected_package_id,
      selected_package_label,
      selected_package_type,
      selected_addons,
      content_quantity,
      content_duration,
      content_requirements,
      barter_types,
      campaign_category,
      campaign_goal,
      campaign_description,
      deliverables,
      usage_rights,
      deadline,
      authorized_signer_name,
      authorized_signer_role,
      usage_duration,
      payment_terms,
      approval_sla_hours,
      requires_shipping,
      shipping_timeline_days,
      cancellation_policy,
      offer_expires_at,
      brand_pincode,
      form_data,
    } = req.body;

    // Validate brand email domain
    // Extract domain from email
    let brand_domain = '';
    if (brand_email) {
      const emailParts = brand_email.toLowerCase().split('@');
      if (emailParts.length !== 2 || !emailParts[1]) {
        return res.status(400).json({
          success: false,
          error: 'Invalid brand email format',
        });
      }
      brand_domain = emailParts[1];

      // Check for common personal email domains
      const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
      if (personalDomains.includes(brand_domain)) {
        console.warn(`[CollabRequests] Personal email used for brand: ${brand_email}`);
        // Allow but log - could require additional verification
      }
    }

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

    // Address and GSTIN are optional for initial offer
    
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

    const normalizedProductImage = normalizeImageUrl(barter_product_image_url);
    const normalizedProductName = String(barter_product_name || '').trim();
    
    if (!normalizedProductImage || !normalizedProductName) {
      return res.status(400).json({
        success: false,
        error: 'Product name and image are required for all collaborations',
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
    if (barter_product_name) extraTermsLines.push(`Product for collab: ${String(barter_product_name).trim()}`);
    if (barter_product_category) extraTermsLines.push(`Product category: ${String(barter_product_category).trim()}`);
    if (selected_package_label) extraTermsLines.push(`Selected package: ${String(selected_package_label).trim()}`);
    if (content_quantity) extraTermsLines.push(`Content quantity: ${String(content_quantity).trim()}`);
    if (content_duration) extraTermsLines.push(`Content duration: ${String(content_duration).trim()}`);
    if (Array.isArray(content_requirements) && content_requirements.length > 0) {
      extraTermsLines.push(`Content requirements: ${content_requirements.map(String).join(', ')}`);
    }
    if (Array.isArray(barter_types) && barter_types.length > 0) {
      extraTermsLines.push(`Barter value type: ${barter_types.map(String).join(', ')}`);
    }

    const campaignDescriptionWithTerms = extraTermsLines.length > 0
      ? `${campaign_description.trim()}\n\nAdditional Commercial Terms:\n- ${extraTermsLines.join('\n- ')}`
      : campaign_description.trim();

    const basePayload: any = {
      target_handle: normalizedUsername,
      brand_name: brand_name.trim(),
      brand_email: brand_email.toLowerCase().trim(),
      brand_address: brand_address?.trim() || null,
      brand_pincode: brand_pincode?.trim() || null,
      brand_gstin: brand_gstin && typeof brand_gstin === 'string' ? brand_gstin.trim().toUpperCase() : null,
      brand_phone: brand_phone?.trim() || null,
      brand_website: brand_website?.trim() || null,
      brand_instagram: brand_instagram?.trim() || null,
      brand_logo_url: brand_logo_url?.trim() || null,
      collab_type: collabTypeForDb,
      campaign_description: campaignDescriptionWithTerms,
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      usage_rights: usage_rights === true || usage_rights === 'true',
      deadline: deadline || null,
      offer_expires_at: offer_expires_at || null,
      shipping_required: requires_shipping === true || requires_shipping === 'true',
      campaign_category: campaign_category?.trim() || null,
      campaign_goal: campaign_goal?.trim() || null,
      selected_package_id: typeof selected_package_id === 'string' ? selected_package_id.trim() || null : null,
      selected_package_label: typeof selected_package_label === 'string' ? selected_package_label.trim() || null : null,
      selected_package_type: typeof selected_package_type === 'string' ? selected_package_type.trim() || null : null,
      selected_addons: Array.isArray(selected_addons) ? selected_addons : [],
      content_quantity: content_quantity != null ? String(content_quantity).trim() || null : null,
      content_duration: typeof content_duration === 'string' ? content_duration.trim() || null : null,
      content_requirements: Array.isArray(content_requirements) ? content_requirements.map(String).filter(Boolean) : [],
      barter_types: Array.isArray(barter_types) ? barter_types.map(String).filter(Boolean) : [],
      form_data: form_data && typeof form_data === 'object' ? form_data : {},
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

    const resolvedCreator = await resolveCreatorByPublicHandle(
      normalizedUsername,
      'id, username, instagram_handle, pricing_min',
    );
    const creator = resolvedCreator.creator;
    const creatorError = resolvedCreator.error;

    if (resolvedCreator.isStaleUsernameLink) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found',
        message: 'This creator link is no longer active. Please use the creator’s latest collab link.',
      });
    }

    // Auto-Decline Logic: Instant filter for lowball spam
    if (creator && creator.pricing_min && exact_budget) {
      const budgetValue = parseFloat(exact_budget.toString());
      if (budgetValue < creator.pricing_min) {
        return res.status(400).json({
          success: false,
          error: `Offer below creator minimum (₹${creator.pricing_min.toLocaleString()}). This creator has an auto-decline policy for low-budget proposals.`,
          auto_declined: true
        });
      }
    }

    // Rate limiting (optional): prevent rapid repeat submits to the same creator from the same email.
    // Default is OFF (COLLAB_REQUEST_RATE_LIMIT_MINUTES=0) to avoid blocking legitimate retries.
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const allowDemoEmail = process.env.ALLOW_DEMO_EMAIL === 'true';
    const rateLimitMinutes = Number(process.env.COLLAB_REQUEST_RATE_LIMIT_MINUTES || '0');

    /*
    if (rateLimitMinutes > 0 && !isDevelopment && !allowDemoEmail) {
      const windowAgo = new Date(Date.now() - rateLimitMinutes * 60 * 1000).toISOString();

      let hasRecentSubmission = false;
      if (creator?.id) {
        const { data: recentSubmissions, error: rateLimitError } = await supabase
          .from('collab_requests')
          .select('id')
          .eq('brand_email', brand_email.toLowerCase().trim())
          .eq('creator_id', creator.id)
          .gte('created_at', windowAgo)
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
            .gte('created_at', windowAgo)
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
          error: `Please wait before submitting another request. You can submit one request every ${rateLimitMinutes} minute${rateLimitMinutes === 1 ? '' : 's'}.`,
        });
      }
    } else {
      console.log('[CollabRequests] Rate limiting disabled (COLLAB_REQUEST_RATE_LIMIT_MINUTES=0 or dev/demo)');
    }
    */

    if (creatorError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to validate creator profile',
      });
    }

    if (!creator) {
      const leadInsertData: any = {
        brand_name: basePayload.brand_name,
        brand_email: basePayload.brand_email,
        brand_phone: basePayload.brand_phone,
        brand_website: basePayload.brand_website,
        brand_instagram: basePayload.brand_instagram,
        collab_type: basePayload.collab_type,
        campaign_description: basePayload.campaign_description,
        campaign_category: basePayload.campaign_category,
        campaign_goal: basePayload.campaign_goal,
        selected_package_id: basePayload.selected_package_id,
        selected_package_label: basePayload.selected_package_label,
        selected_package_type: basePayload.selected_package_type,
        selected_addons: basePayload.selected_addons,
        content_quantity: basePayload.content_quantity,
        content_duration: basePayload.content_duration,
        content_requirements: basePayload.content_requirements,
        barter_types: basePayload.barter_types,
        deliverables: basePayload.deliverables,
        usage_rights: basePayload.usage_rights,
        deadline: basePayload.deadline,
        budget_range: basePayload.budget_range || null,
        exact_budget: basePayload.exact_budget ?? null,
        barter_description: basePayload.barter_description || null,
        barter_value: basePayload.barter_value ?? null,
        target_handle: normalizedUsername,
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
      logo_url: brand_logo_url?.trim() || null,
      gstin: brand_gstin && typeof brand_gstin === 'string' ? brand_gstin.trim().toUpperCase() : null,
    });

    // Resolve or create brand user account (frictionless registration)
    let brandUserId: string | null = null;
    let brandMagicLink: string | null = null;
    try {
      const brandResult = await findOrCreateBrandUser(brand_email, brand_name);
      brandUserId = brandResult.userId;
      brandMagicLink = await generateBrandMagicLink(brand_email);
      console.log(`[CollabRequests] Brand account ${brandResult.isNew ? 'created' : 'resolved'} for ${brand_email}`);
    } catch (authError) {
      console.warn('[CollabRequests] Frictionless brand registration failed (non-fatal):', authError);
    }

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
      brand_logo_url: basePayload.brand_logo_url,
      collab_type: basePayload.collab_type,
      campaign_description: basePayload.campaign_description,
      campaign_category: basePayload.campaign_category,
      campaign_goal: basePayload.campaign_goal,
      selected_package_id: basePayload.selected_package_id,
      selected_package_label: basePayload.selected_package_label,
      selected_package_type: basePayload.selected_package_type,
      selected_addons: basePayload.selected_addons,
      content_quantity: basePayload.content_quantity,
      content_duration: basePayload.content_duration,
      content_requirements: basePayload.content_requirements,
      barter_types: basePayload.barter_types,
      deliverables: basePayload.deliverables,
      usage_rights: basePayload.usage_rights,
      deadline: basePayload.deadline,
      offer_expires_at: basePayload.offer_expires_at,
      shipping_required: basePayload.shipping_required ?? false,
      submitted_ip: clientIp,
      submitted_user_agent: userAgent,
      ...(brandContactId ? { brand_contact_id: brandContactId } : {}),
      ...(brandUserId ? { brand_id: brandUserId } : {}),
      form_data: basePayload.form_data || {},
    };

    // Add budget/barter fields based on collab_type
    if (isPaidLikeCollab(basePayload.collab_type)) {
      insertData.budget_range = basePayload.budget_range || null;
      insertData.exact_budget = basePayload.exact_budget ?? null;
    }

    insertData.barter_description = basePayload.barter_description || null;
    insertData.barter_value = basePayload.barter_value || null;
    insertData.barter_product_image_url = normalizedProductImage;

    const requestOptionalFields = new Set([
      'shipping_required',
      'brand_contact_id',
      'brand_id',
      'brand_pincode',
      'submitted_ip',
      'submitted_user_agent',
      'selected_package_id',
      'selected_package_label',
      'selected_package_type',
      'selected_addons',
      'content_quantity',
      'content_duration',
      'content_requirements',
      'barter_types',
      'form_data',
    ]);

    const extractMissingColumn = (message: string): string | null => {
      if (!message) return null;
      const quoted = message.match(/'([^']+)' column/i);
      if (quoted?.[1]) return quoted[1];
      const quotedAlt = message.match(/column\s+"([^"]+)"/i);
      if (quotedAlt?.[1]) return quotedAlt[1];
      const unquoted = message.match(/column\s+([a-z_][a-z0-9_]*)/i);
      if (unquoted?.[1]) return unquoted[1];
      return null;
    };

    const requestInsertPayload: any = { ...insertData };
    let collabRequest: any = null;
    let insertError: any = null;

    for (let attempt = 0; attempt < 16; attempt++) {
      const result = await supabase
        .from('collab_requests')
        .insert(requestInsertPayload)
        .select('id, brand_name, created_at')
        .single();

      collabRequest = result.data;
      insertError = result.error;

      if (!insertError) {
        break;
      }

      const missingColumn = extractMissingColumn(String(insertError.message || ''));
      if (missingColumn && requestOptionalFields.has(missingColumn) && missingColumn in requestInsertPayload) {
        delete requestInsertPayload[missingColumn];
        continue;
      }

      break;
    }

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

    // Get creator name prioritizing first_name/last_name
    let creatorName = 'Creator';
    if (creatorProfile) {
      const firstName = creatorProfile.first_name || '';
      const lastName = creatorProfile.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      if (fullName) {
        creatorName = fullName;
      } else if (firstName) {
        creatorName = firstName;
      } else if (lastName) {
        creatorName = lastName;
      } else if (creatorProfile.business_name && creatorProfile.business_name.trim()) {
        creatorName = creatorProfile.business_name.trim();
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
        magicLink: brandMagicLink || undefined,
      }).catch((emailError) => {
        console.error('[CollabRequests] Submission email sending failed (non-fatal):', emailError);
        logFailedNotification({
          type: 'email',
          recipient_email: brand_email,
          payload: { requestId: collabRequest.id, brand_email },
          error_message: emailError?.message || String(emailError),
          source: 'collabRequestSubmit_brandEmail'
        });
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
          logFailedNotification({
            type: 'push',
            recipient_id: creator.id,
            payload: { requestId: collabRequest.id },
            error_message: notifyError?.message || String(notifyError),
            source: 'collabRequestSubmit_pushNotify'
          });
        });
      } catch (pushError: any) {
        console.error('[CollabRequests] Push notification threw (non-fatal):', pushError);
        logFailedNotification({
          type: 'push',
          recipient_id: creator.id,
          payload: { requestId: collabRequest.id },
          error_message: pushError?.message || String(pushError),
          source: 'collabRequestSubmit_pushNotifyThrew'
        });
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
            logFailedNotification({
              type: 'email',
              recipient_id: creator.id,
              recipient_email: creatorEmail,
              payload: { requestId: collabRequest.id, creatorEmail },
              error_message: emailError?.message || String(emailError),
              source: 'collabRequestSubmit_creatorEmail'
            });
          });
        } else {
          console.warn('[CollabRequests] Could not fetch creator email for email notification:', authError?.message);
        }
      } catch (emailBlockError: any) {
        console.error('[CollabRequests] Error in email notification block (non-fatal):', emailBlockError);
        logFailedNotification({
          type: 'email',
          recipient_id: creator.id,
          payload: { requestId: collabRequest.id },
          error_message: emailBlockError?.message || String(emailBlockError),
          source: 'collabRequestSubmit_creatorEmailThrew'
        });
      }

      // ── In-app Notification ──────────────────────────────────────────────────
      try {
        await recordMarketplaceEvent(supabase, {
          eventName: 'offer_received',
          userId: creator.id,
          creatorId: creator.id,
          requestId: collabRequest.id,
          metadata: {
            creator_id: creator.id,
            request_id: collabRequest.id,
            brand_name,
            collab_type: collabTypeForApi || collabTypeForDb,
            deal_value: Number(exact_budget || barter_value || 0),
          },
        });

        const creatorOfferNotification = getCreatorNotificationContent('offer_received', {
          id: collabRequest.id,
          status: 'OFFER_SENT',
          creator_id: creator.id,
          brand_email: brand_email || '',
          brand_name,
          deal_type: collabTypeForApi || collabTypeForDb || 'paid',
          deal_amount: Number(exact_budget || barter_value || 0),
          current_state: 'OFFER_SENT',
        });
        const requestReviewPath = `/collab-requests/${collabRequest.id}/brief`;
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: creator.id,
            type: creatorOfferNotification.type,
            category: creatorOfferNotification.category,
            title: creatorOfferNotification.title,
            message: creatorOfferNotification.message,
            data: {
              collab_request_id: collabRequest.id,
              brand_name: brand_name,
              collab_type: collabTypeForApi || collabTypeForDb,
            },
            link: requestReviewPath,
            priority: creatorOfferNotification.priority,
            icon: creatorOfferNotification.type,
            action_label: creatorOfferNotification.actionLabel,
            action_link: requestReviewPath,
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

    // Invalidate caches for the creator to ensure they see the new offer immediately
    invalidateCollabRequestsCache(creator.id);
    invalidateDealsMineCache(creator.id);

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

/**
 * GET /api/collab-requests/console/:token
 * Public endpoint for the unified Brand Deal Console.
 * Fetches the collaboration lifecycle state regardless of the stage.
 */
router.get('/console/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ success: false, error: 'Token is required' });

    // 1. Try to find a collab_request by ID (this is our primary console token)
    let { data: collabRequest, error: collabError } = await supabase
      .from('collab_requests')
      .select(`
        *,
        creator:creator_id (
          id,
          username,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('id', token)
      .maybeSingle();

    if (collabError) {
      console.error('[CollabConsole] Error fetching collab request:', collabError);
    }

    // 2. If not found, it might be a deal_details_token or deal_id
    let brandDeal = null;
    let dealDetailsToken = null;

    if (!collabRequest) {
      // Check if it's a deal_details_token
      const { data: dToken } = await supabase
        .from('deal_details_tokens')
        .select('*')
        .eq('id', token)
        .maybeSingle();

      if (dToken) {
        dealDetailsToken = dToken;
        // Find if this token has a submission linked to a deal
        const { data: submission } = await supabase
          .from('deal_details_submissions')
          .select('deal_id')
          .eq('token_id', dToken.id)
          .maybeSingle();

        if (submission?.deal_id) {
          const { data: deal } = await supabase
            .from('brand_deals')
            .select('*')
            .eq('id', submission.deal_id)
            .maybeSingle();
          brandDeal = deal;
        }
      } else {
        // Check if it's directly a brand_deal ID
        const { data: deal } = await supabase
          .from('brand_deals')
          .select('*')
          .eq('id', token)
          .maybeSingle();

        if (deal) {
          brandDeal = deal;
          // Try to find the collab_request that lead to this deal
          const { data: cr } = await supabase
            .from('collab_requests')
            .select('*')
            .eq('deal_id', deal.id)
            .maybeSingle();
          collabRequest = cr;
        }
      }
    } else if (collabRequest.deal_id) {
      // If we found a collabRequest, also fetch the linked brandDeal
      const { data: deal } = await supabase
        .from('brand_deals')
        .select('*')
        .eq('id', collabRequest.deal_id)
        .maybeSingle();
      brandDeal = deal;
    }

    if (!collabRequest && !brandDeal && !dealDetailsToken) {
      return res.status(404).json({ success: false, error: 'Deal or request not found' });
    }

    // 3. Resolve Creator Info
    let creator = collabRequest?.creator || null;
    if (!creator && brandDeal?.creator_id) {
      const { data: c } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, avatar_url, profile_label')
        .eq('id', brandDeal.creator_id)
        .maybeSingle();
      creator = c;
    }

    // 4. Activity Logs
    let activity = [];
    if (brandDeal?.id) {
      const { data: logs } = await supabase
        .from('deal_action_logs')
        .select('*')
        .eq('deal_id', brandDeal.id)
        .order('created_at', { ascending: false });
      activity = logs || [];
    }

    // 5. Construct Lifecycle State
    let stage = 'PROPOSAL';
    if (collabRequest?.status === 'accepted' || brandDeal?.status === 'Drafting' || brandDeal?.status === 'Intake') {
      stage = 'INTAKE';
    }
    if (brandDeal?.status === 'CONTRACT_READY') {
      stage = 'SIGNING';
    }
    if (brandDeal?.status === 'Executing') {
      stage = 'EXECUTING';
    }
    if (brandDeal?.status === 'Vested' || brandDeal?.status === 'Completed') {
      stage = 'VESTED';
    }

    return res.json({
      success: true,
      stage,
      collabRequest,
      brandDeal,
      creator: creator ? {
        name: `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || creator.username,
        username: creator.username,
        avatar_url: creator.avatar_url,
        profile_label: (creator as any).profile_label || null,
        trust_stats: collabRequest?.creator?.trust_stats || null
      } : null,
      activity,
      dealDetailsToken
    });

  } catch (error: any) {
    console.error('[CollabConsole] Universal fetch error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
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

    const cacheKey = `${userId}::${typeof status === 'string' ? status : ''}`;
    const cached = getCollabRequestsCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Best-effort auto-attach so the dashboard sees lead-captured barter offers
    // without blocking the initial dashboard response.
    void attachPendingCollabLeadsForCreator(userId).catch((attachError) => {
      console.warn('[CollabRequests] Auto-attach leads failed (non-fatal):', attachError);
    });

    // Deduplicate: keep most recent request per unique (brand_name, collab_type, exact_budget)
    // Only applied when filtering by status=pending to avoid hiding legitimate history entries
    const isPendingOnly = status === 'pending';

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

    // Backend deduplication: keep most recent offer per unique brand+type+budget combo
    const dedupeKey = (r: any) =>
      `${r.brand_name ?? ''}|||${r.collab_type ?? ''}|||${r.exact_budget ?? ''}`;

    const seenKeys = new Set<string>();
    const deduplicatedRequests = isPendingOnly
      ? (requests || []).filter((r: any) => {
          const key = dedupeKey(r);
          if (seenKeys.has(key)) return false;
          seenKeys.add(key);
          return true;
        })
      : (requests || []);

    const normalizedRequests = deduplicatedRequests.map((request: any) => ({
      ...request,
      collab_type: normalizeCollabTypeForApi(request.collab_type) || request.collab_type,
    }));

    // Output validation (server-side): never let corrupted requests reach the frontend.
    // This prevents ghost cards / broken CTAs and keeps deal lifecycle deterministic.
    const allowedStatuses = new Set(['pending', 'accepted', 'countered', 'declined']);
    const isPaidLike = (t: string) => t === 'paid' || t === 'hybrid' || t === 'both';
    const isBarterLike = (t: string) => t === 'barter' || t === 'hybrid' || t === 'both';

    const sanitizedRequests = (normalizedRequests || []).filter((r: any) => {
      const id = String(r?.id || '').trim();
      const brand = String(r?.brand_name || '').trim();
      if (!id || !brand) return false;

      const statusNorm = String(r?.status || '').toLowerCase().trim();
      if (!allowedStatuses.has(statusNorm)) return false;

      const typeNorm = String(r?.collab_type || '').toLowerCase().trim();
      const exactBudget = r?.exact_budget != null ? Number(r.exact_budget) : null;
      const barterValue = r?.barter_value != null ? Number(r.barter_value) : null;
      const dealAmount = r?.deal_amount != null ? Number(r.deal_amount) : null;
      const hasPaidValue = (exactBudget != null && Number.isFinite(exactBudget) && exactBudget > 0) || (dealAmount != null && Number.isFinite(dealAmount) && dealAmount > 0);
      const hasBarterValue = barterValue != null && Number.isFinite(barterValue) && barterValue > 0;

      // For pending/countered, enforce that the offer has some positive value.
      // This is critical for creator UX (budget chips, accept CTA, etc).
      if (statusNorm === 'pending' || statusNorm === 'countered') {
        if (isPaidLike(typeNorm) && !hasPaidValue) return false;
        // Barter deals are allowed even without a specific value (the product description is enough)
        if (isBarterLike(typeNorm) && !hasBarterValue && !hasPaidValue && typeNorm !== 'barter') return false;
      }
      return true;
    });

    if ((normalizedRequests || []).length !== sanitizedRequests.length) {
      console.warn('[CollabRequests] Filtered invalid requests:', {
        total: (normalizedRequests || []).length,
        kept: sanitizedRequests.length,
        dropped: (normalizedRequests || []).length - sanitizedRequests.length,
        creator_id: userId,
      });
    }

    const payload = {
      success: true,
      requests: sanitizedRequests,
    };
    setCollabRequestsCache(cacheKey, payload);
    res.json(payload);
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
    const isBarter = normalizeCollabTypeForDb(request.collab_type) === 'barter';

    // Create brand deal using shared service
    const deal = await createDealFromCollabRequest(request, userId, {
      status: 'accepted_pending_otp' // Magic links currently move to accepted_pending_otp in this route
    });

    // Update collab request status and acceptance metadata
    const { error: updateError } = await supabase
      .from('collab_requests')
      .update({
        status: 'accepted_pending_otp',
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

    const { data: creatorProfileForBrandPush } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .maybeSingle();
    const creatorNameForBrandPush =
      `${creatorProfileForBrandPush?.first_name || ''} ${creatorProfileForBrandPush?.last_name || ''}`.trim() || 'Creator';

    notifyBrandOnCreatorAcceptance({
      brandId: request.brand_id || null,
      brandEmail: request.brand_email || null,
      creatorName: creatorNameForBrandPush,
      dealId: deal.id,
      requestId: id,
      isBarter,
    }).catch((pushError) => {
      console.error('[CollabRequests] Accept confirm: brand push failed (non-fatal):', pushError);
    });
    createBrandAcceptanceNotification({
      brandId: request.brand_id || null,
      brandEmail: request.brand_email || null,
      creatorName: creatorNameForBrandPush,
      dealId: deal.id,
      requestId: id,
      isBarter,
    }).catch((notificationError) => {
      console.error('[CollabRequests] Accept confirm: brand notification failed (non-fatal):', notificationError);
    });

    await recordMarketplaceEvent(supabase, {
      eventName: 'offer_accepted',
      userId,
      creatorId: userId,
      dealId: deal.id,
      requestId: id,
      metadata: {
        creator_id: userId,
        deal_id: deal.id,
        request_id: id,
        collab_type: normalizeCollabTypeForApi(request.collab_type) || request.collab_type,
        deal_value: dealAmount,
      },
    });

    await recordMarketplaceEvent(supabase, {
      eventName: 'deal_started',
      userId,
      creatorId: userId,
      dealId: deal.id,
      requestId: id,
      metadata: {
        creator_id: userId,
        deal_id: deal.id,
        request_id: id,
        collab_type: normalizeCollabTypeForApi(request.collab_type) || request.collab_type,
        deal_value: dealAmount,
      },
    });

    // Proceed to generate contract for all deal types

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
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (creatorError) throw new Error('Failed to fetch creator profile');
        const creatorName = creatorProfile
          ? `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || 'Creator'
          : 'Creator';
        const creatorEmail = creatorProfile?.email || req.user?.email || undefined;
        
        // Resolve creator address - prioritize registered_address
        let creatorAddress = creatorProfile?.registered_address || creatorProfile?.location || creatorProfile?.address || undefined;
        if (creatorAddress && (creatorAddress.trim() === '' || creatorAddress.toLowerCase() === 'n/a')) {
          creatorAddress = undefined;
        }

        // Resolve brand address - prioritize registered company_address if available
        let companyAddressFromTable: string | null = null;
        if (request.brand_id) {
          const { data: brandData } = await supabase
            .from('brands')
            .select('company_address')
            .eq('external_id', request.brand_id)
            .maybeSingle();
          companyAddressFromTable = brandData?.company_address || null;
        }
        const brandAddress = request.brand_address?.trim() || companyAddressFromTable || undefined;

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
          brandAddress,
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
            status: 'CONTRACT_READY', // Contract is ready, awaiting brand signature (paid deals only)
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

    // Invalidate caches for the creator
    invalidateCollabRequestsCache(creatorId);
    invalidateDealsMineCache(creatorId);

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
    const { shipping_address, pincode, delivery_name, delivery_phone, otp_verified, otp_verified_at } = req.body || {};

    console.log('[CollabRequests] Accept request:', { requestId: id, userId, hasBody: !!req.body });

    // Get the collab request
    const { data: request, error: requestError } = await supabase
      .from('collab_requests')
      .select('*')
      .eq('id', id)
      .eq('creator_id', userId)
      .maybeSingle();

    if (requestError) {
      console.error('[CollabRequests] Database error querying request:', requestError);
      return res.status(500).json({
        success: false,
        error: 'Database error while fetching collaboration request',
      });
    }

    if (!request) {
      console.warn('[CollabRequests] Request not found or not owned by user:', { requestId: id, userId, exists: request ? 'yes' : 'no' });
      return res.status(404).json({
        success: false,
        error: 'Collaboration request not found',
      });
    }

    if (request.status !== 'pending') {
      if (request.status === 'accepted_pending_otp' && (request as any).deal_id) {
        console.log('[CollabRequests] Request already in OTP flow:', { requestId: id, dealId: (request as any).deal_id });
        return res.json({
          success: true,
          deal: { id: (request as any).deal_id },
          needs_otp: true,
          message: 'OTP verification is still required before this offer is accepted.',
        });
      }
      console.log(`[CollabRequests] Accept failed: Request ${id} has status "${request.status}" (expected "pending")`);
      return res.status(400).json({
        success: false,
        error: `Request has already been processed (current status: ${request.status})`,
      });
    }

    // Self-healing: if a deal already exists for this collab request but the request
    // row was never updated, repair the link and continue instead of creating a duplicate.
    const { data: existingDeal } = await supabase
      .from('brand_deals')
      .select('id')
      .eq('collab_request_id', id)
      .maybeSingle();
    if (existingDeal?.id) {
      const now = new Date().toISOString();
      await supabase
        .from('collab_requests')
        .update({
          status: request.source_lead_id ? 'accepted' : 'accepted_pending_otp',
          deal_id: existingDeal.id,
          accepted_at: request.source_lead_id ? now : null,
          accepted_by_creator_id: request.source_lead_id ? userId : null,
          updated_at: now,
        } as any)
        .eq('id', id);

      return res.json({
        success: true,
        deal: { id: existingDeal.id },
        needs_otp: !request.source_lead_id,
        message: 'Existing deal link restored successfully.',
      });
    }

    const isBarter = normalizeCollabTypeForDb(request.collab_type) === 'barter';

    // Create brand deal using shared service
    const deal = await createDealFromCollabRequest(request, userId, {
      shipping_address,
      pincode,
      delivery_name: delivery_name || null,
      delivery_phone: delivery_phone || null,
      otp_verified,
      otp_verified_at,
    });

    const now = new Date().toISOString();
    const clientIp = req.ip || (req.socket as any)?.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    // Update collab request status and acceptance metadata
    const { error: updateError } = await supabase
      .from('collab_requests')
      .update({
        status: request.source_lead_id ? 'accepted' : 'accepted_pending_otp',
        deal_id: (deal as any).id,
        accepted_at: request.source_lead_id ? now : null,
        accepted_by_creator_id: request.source_lead_id ? userId : null,
        updated_at: now,
      } as any)
      .eq('id', id);

    if (updateError) {
      console.error('[CollabRequests] Error updating request:', updateError);
    }

    // Proactive profile sync: Save address/pincode to profile for future convenience
    if (shipping_address || pincode) {
      void supabase
        .from('profiles')
        .update({
          location: shipping_address || undefined,
          pincode: pincode || undefined,
        } as any)
        .eq('id', userId)
        .then(({ error }) => {
          if (error) console.error('[CollabRequests] Error syncing address to profile:', error);
        });
    }

    // Fetch creator profile for contract generation (needed for DEAL_LOCKED log)
    const { data: creatorProfile, error: creatorProfileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, location')
      .eq('id', userId)
      .maybeSingle();

    if (creatorProfileError) {
      console.error('[CollabRequests] Error fetching creator profile for audit log:', creatorProfileError);
    }

    // Insert audit log for the acceptance action using deal_action_logs
    await supabase.from('deal_action_logs').insert({
      deal_id: deal.id,
      user_id: userId,
      event: request.source_lead_id ? 'DEAL_LOCKED' : 'DEAL_PENDING_CREATOR_OTP',
      metadata: {
        collab_request_id: id,
        message: request.source_lead_id 
          ? 'Creator accepted the offer. Contract being generated.' 
          : 'Creator opened OTP verification. Offer is not accepted until OTP is verified.',
        creator_name: creatorProfile ? `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() : 'Creator'
      },
    });

    await supabase.from('deal_action_logs').insert({
      deal_id: deal.id,
      user_id: userId,
      event: request.source_lead_id ? 'OFFER_ACCEPTED' : 'CREATOR_ACCEPT_PENDING_OTP',
      metadata: {
        collab_request_id: id,
        auth_method: 'session',
        ip_address: clientIp,
        user_agent: userAgent,
        collab_type: normalizeCollabTypeForApi(request.collab_type) || request.collab_type,
        status: request.source_lead_id ? (isBarter ? 'Drafting' : 'CONTRACT_READY') : 'accepted_pending_otp'
      },
    }).then(({ error: logErr }) => {
      if (logErr) console.warn('[CollabRequests] Audit log insert failed:', logErr);
    });

    invalidateCollabRequestsCache(userId);
    invalidateDealsMineCache(userId);

    // If OTP is NOT required (because it's a lead-originated request), proceed to brand notification and contract generation.
    // Otherwise, return early and wait for OTP verification in otp.ts.
    if (!request.source_lead_id) {
      return res.json({
        success: true,
        deal: { id: deal.id },
        needs_otp: true,
        message: 'OTP sent next. Verify it to accept and sign this collaboration.',
      });
    }

    const creatorNameForBrandPush =
      creatorProfile ? `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || 'Creator' : 'Creator';

    notifyBrandOnCreatorAcceptance({
      brandId: request.brand_id || null,
      brandEmail: request.brand_email || null,
      creatorName: creatorNameForBrandPush,
      dealId: deal.id,
      requestId: id,
      isBarter,
    }).catch((pushError) => {
      console.error('[CollabRequests] PATCH accept: brand push failed (non-fatal):', pushError);
    });
    createBrandAcceptanceNotification({
      brandId: request.brand_id || null,
      brandEmail: request.brand_email || null,
      creatorName: creatorNameForBrandPush,
      dealId: deal.id,
      requestId: id,
      isBarter,
    }).catch((notificationError) => {
      console.error('[CollabRequests] PATCH accept: brand notification failed (non-fatal):', notificationError);
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
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const creatorName = creatorProfile
          ? `${((creatorProfile as any).first_name || '').trim()} ${((creatorProfile as any).last_name || '').trim()}`.trim() || 'Creator'
          : 'Creator';

        // Resolve creator address - prioritize registered_address
        let creatorAddress = (creatorProfile as any)?.registered_address || (creatorProfile as any)?.location || (creatorProfile as any)?.address || undefined;
        if (creatorAddress && (creatorAddress.trim() === '' || creatorAddress.toLowerCase() === 'n/a')) {
          creatorAddress = undefined;
        }

        // Try to get email from profile, then from req.user, then from auth as last resort
        let creatorEmail = (creatorProfile as any)?.email || req.user?.email;

        if (!creatorEmail) {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(userId);
            creatorEmail = authUser?.user?.email;
          } catch (e) {
            console.error('[CollabRequests] Failed to fetch creator email from auth:', e);
          }
        }

        creatorEmail = creatorEmail || undefined;

        // Resolve brand address - prioritize registered company_address if available
        let companyAddressFromTable: string | null = null;
        if (request.brand_id) {
          const { data: brandData } = await supabase
            .from('brands')
            .select('company_address')
            .eq('external_id', request.brand_id)
            .maybeSingle();
          companyAddressFromTable = brandData?.company_address || null;
        }
        const brandAddress = request.brand_address?.trim() || companyAddressFromTable || undefined;

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

        const canGenerateContract = Boolean(
          request.brand_name &&
          creatorName &&
          creatorEmail &&
          brandAddress &&
          creatorAddress
        );

        if (!canGenerateContract) {
          console.log('[CollabRequests] Skipping contract generation due to missing info:', {
            dealId: deal.id,
            hasBrandName: !!request.brand_name,
            hasCreatorName: !!creatorName,
            hasCreatorEmail: !!creatorEmail,
            hasBrandAddress: !!brandAddress,
            hasCreatorAddress: !!creatorAddress,
          });
          // For now, don't throw error - allow acceptance to proceed even if contract generation fails
          // throw new Error('Missing required information for paid contract generation.');
        } else {
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
            brandAddress,
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

          const token = await createContractReadyToken({
            dealId: deal.id,
            creatorId: userId,
            expiresAt: null, // No expiry
          });
          contractReadyToken = token.id;

          const { error: contractUpdateError } = await supabase
            .from('brand_deals')
            .update({
              contract_file_url: contractUrl,
              status: 'CONTRACT_READY',
              updated_at: new Date().toISOString(),
            })
            .eq('id', deal.id);

          if (contractUpdateError) {
            console.error('[CollabRequests] Error updating deal with contract:', contractUpdateError);
            throw new Error('Failed to mark deal contract ready');
          }

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

          console.log('[CollabRequests] Contract generated successfully for deal:', deal.id);
        }
      }
    } catch (contractError: any) {
      console.error('[CollabRequests] Error generating contract:', contractError);
      return res.status(500).json({
        success: false,
        deal: { id: deal.id },
        error: contractError?.message || 'Deal accepted, but contract generation failed.',
      });
    }

    // Invalidate caches for the creator
    invalidateCollabRequestsCache(userId);
    invalidateDealsMineCache(userId);

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

    // Invalidate caches for the creator
    invalidateCollabRequestsCache(userId);
    invalidateDealsMineCache(userId);

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

    // Invalidate caches for the creator
    invalidateCollabRequestsCache(userId);
    invalidateDealsMineCache(userId);

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
