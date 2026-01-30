// Collaboration Request Link API Routes
// Handles public collab link submissions and creator management

import express, { Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { supabase, supabaseInitialized } from '../index.js';
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
} from '../services/collabRequestEmailService.js';
import { resolveOrCreateBrandContact } from '../services/brandContactService.js';

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
        collab_type: request.collab_type,
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
    const dealType = request.collab_type === 'barter' ? 'Barter' : request.collab_type === 'paid' ? 'Paid' : 'Paid / Barter';
    const amount = request.collab_type === 'barter' ? (request.barter_value ?? null) : (request.exact_budget ?? null);
    return res.json({
      success: true,
      alreadyHandled: false,
      brand_name: request.brand_name,
      collab_type: request.collab_type,
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
    
    // Try username first, then instagram_handle as fallback
    // Using minimal required columns first, then fetching additional data if needed
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        business_name,
        instagram_handle,
        bio,
        username
      `)
      .eq('username', normalizedUsername)
      .eq('role', 'creator')
      .maybeSingle();
    
    // If not found by username, try instagram_handle
    if (!profile && !profileError) {
      const result = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          business_name,
          instagram_handle,
          bio,
          username
        `)
        .eq('instagram_handle', normalizedUsername)
        .eq('role', 'creator')
        .maybeSingle();
      profile = result.data;
      profileError = result.error;
    }
    
    // If profile found, fetch additional optional columns separately (to handle missing columns gracefully)
    if (profile && !profileError) {
      const { data: extendedProfile } = await supabase
        .from('profiles')
        .select(`
          creator_category,
          youtube_channel_id,
          tiktok_handle,
          twitter_handle,
          facebook_profile_url,
          instagram_followers,
          youtube_subs,
          tiktok_followers,
          twitter_followers,
          facebook_followers,
          open_to_collabs,
          content_niches,
          media_kit_url
      `)
        .eq('id', profile.id)
      .maybeSingle();
      
      // Merge extended data if available (ignore errors for missing columns)
      if (extendedProfile) {
        profile = { ...profile, ...extendedProfile };
      }
    }

    if (profileError) {
      console.error('[CollabRequests] Error fetching creator:', profileError);
      console.error('[CollabRequests] Error code:', profileError.code);
      console.error('[CollabRequests] Error message:', profileError.message);
      console.error('[CollabRequests] Error details:', JSON.stringify(profileError, null, 2));
      console.error('[CollabRequests] Username searched:', username.toLowerCase().trim());
      console.error('[CollabRequests] Supabase client initialized:', supabaseInitialized);
      
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
      console.log('[CollabRequests] Creator not found for username:', username.toLowerCase().trim());
      return res.status(404).json({
        success: false,
        error: 'Creator not found',
      });
    }

    // Build platforms array (handle missing columns gracefully)
    const platforms: Array<{ name: string; handle: string; followers?: number }> = [];
    const p = profile as any; // Use type assertion to access potentially missing columns
    
    if (profile.instagram_handle) {
      platforms.push({
        name: 'Instagram',
        handle: profile.instagram_handle,
        followers: p.instagram_followers || undefined,
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

    res.json({
      success: true,
      creator: {
        id: profile.id,
        name: creatorName,
        username: profile.username,
        category: profile.creator_category,
        platforms,
        bio: profile.bio,
        open_to_collabs: (profile as any).open_to_collabs !== false,
        content_niches: Array.isArray((profile as any).content_niches) ? (profile as any).content_niches : [],
        media_kit_url: (profile as any).media_kit_url || null,
      },
    });
  } catch (error: any) {
    console.error('[CollabRequests] Error in GET /:username:', error);
    console.error('[CollabRequests] Error stack:', error.stack);
    console.error('[CollabRequests] Error name:', error.name);
    console.error('[CollabRequests] Error message:', error.message);
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
      campaign_description,
      deliverables,
      usage_rights,
      deadline,
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

    if (!collab_type || !['paid', 'barter', 'both'].includes(collab_type)) {
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
    const normalizedUsername = username.toLowerCase().trim();
    
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

    if (creatorError || !creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found',
      });
    }

    // Rate limiting: Check for recent submissions from same email/IP
    // Disabled in development mode for easier testing
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

    if (!isDevelopment) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentSubmissions, error: rateLimitError } = await supabase
      .from('collab_requests')
      .select('id')
      .eq('brand_email', brand_email.toLowerCase().trim())
      .eq('creator_id', creator.id)
      .gte('created_at', oneHourAgo)
      .limit(1);

    if (rateLimitError) {
      console.error('[CollabRequests] Rate limit check error:', rateLimitError);
    }

    if (recentSubmissions && recentSubmissions.length > 0) {
      return res.status(429).json({
        success: false,
        error: 'Please wait before submitting another request. You can submit one request per hour.',
      });
      }
    } else {
      console.log('[CollabRequests] Rate limiting disabled in development mode');
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
      brand_name: brand_name.trim(),
      brand_email: brand_email.toLowerCase().trim(),
      brand_address: brand_address.trim(),
      brand_gstin: brand_gstin && typeof brand_gstin === 'string' ? brand_gstin.trim().toUpperCase() : null,
      brand_phone: brand_phone?.trim() || null,
      brand_website: brand_website?.trim() || null,
      brand_instagram: brand_instagram?.trim() || null,
      collab_type,
      campaign_description: campaign_description.trim(),
      deliverables: JSON.stringify(deliverables),
      usage_rights: usage_rights === true || usage_rights === 'true',
      deadline: deadline || null,
      submitted_ip: clientIp,
      submitted_user_agent: userAgent,
      ...(brandContactId ? { brand_contact_id: brandContactId } : {}),
    };

    // Add budget/barter fields based on collab_type
    if (collab_type === 'paid' || collab_type === 'both') {
      insertData.budget_range = budget_range || null;
      insertData.exact_budget = exact_budget ? parseFloat(exact_budget) : null;
    }

    if (collab_type === 'barter' || collab_type === 'both') {
      insertData.barter_description = barter_description?.trim() || null;
      insertData.barter_value = barter_value ? parseFloat(barter_value) : null;
      // Optional barter product image URL (basic validation)
      if (barter_product_image_url != null && typeof barter_product_image_url === 'string') {
        const trimmed = barter_product_image_url.trim();
        if (trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
          insertData.barter_product_image_url = trimmed;
        }
      }
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
        collabType: collab_type,
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
      // Get creator's email from auth.users
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(creator.id);
        
        if (!authError && authUser?.user?.email) {
          const creatorEmail = authUser.user.email;

          // Create accept-from-email token (7 days) and build Accept Deal URL
          const frontendUrl = (process.env.FRONTEND_URL || 'https://creatorarmour.com').replace(/\/$/, '');
          let acceptUrl: string | undefined;
          const acceptTokenId = crypto.randomBytes(24).toString('hex');
          const acceptExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const { error: tokenInsertError } = await supabase
            .from('collab_accept_tokens')
            .insert({
              id: acceptTokenId,
              collab_request_id: collabRequest.id,
              creator_email: creatorEmail,
              expires_at: acceptExpiresAt.toISOString(),
            });
          if (!tokenInsertError) {
            acceptUrl = `${frontendUrl}/collab/accept/${acceptTokenId}`;
          }

          // Calculate total follower count
          const profileAny = creatorProfile as any;
          let totalFollowers = 0;
          if (profileAny?.instagram_followers) totalFollowers += profileAny.instagram_followers;
          if (profileAny?.youtube_subs) totalFollowers += profileAny.youtube_subs;
          if (profileAny?.tiktok_followers) totalFollowers += profileAny.tiktok_followers;
          if (profileAny?.twitter_followers) totalFollowers += profileAny.twitter_followers;

          // Send creator notification email (with Accept Deal CTA if token created)
          sendCollabRequestCreatorNotificationEmail(creatorEmail, {
            creatorName,
            creatorCategory: creatorProfile?.creator_category || undefined,
            followerCount: totalFollowers > 0 ? totalFollowers : undefined,
            avatarUrl: creatorProfile?.avatar_url || undefined,
            brandName: brand_name,
            brandWebsite: brand_website || undefined,
            campaignGoal: campaign_description || undefined,
            collabType: collab_type,
            budgetRange: budget_range || undefined,
            exactBudget: exact_budget ? parseFloat(exact_budget.toString()) : undefined,
            barterDescription: barter_description || undefined,
            barterValue: barter_value ? parseFloat(barter_value.toString()) : undefined,
            barterProductImageUrl: (insertData as any).barter_product_image_url ?? undefined,
            deliverables: deliverablesArray,
            deadline: deadline || undefined,
            timeline: deadline || undefined, // Use deadline as timeline
            notes: undefined, // Don't duplicate campaign description in notes
            requestId: collabRequest.id,
            acceptUrl,
          }).then((result) => {
            if (result.success) {
              console.log('[CollabRequests] Creator notification email sent successfully:', result.emailId);
            } else {
              console.warn('[CollabRequests] Creator notification email failed (non-fatal):', result.error);
            }
          }).catch((emailError) => {
            console.error('[CollabRequests] Creator notification email sending failed (non-fatal):', emailError);
          });

          // Optionally: Add notification entry to notifications table (non-blocking)
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
                  collab_type: collab_type,
                },
                link: dashboardLink,
                priority: 'high',
                icon: 'collab_request',
                action_label: 'Review Request',
                action_link: dashboardLink,
              });

            if (notificationError) {
              console.warn('[CollabRequests] Failed to create notification entry (non-fatal):', notificationError);
              // Don't fail the request if notification creation fails
            } else {
              console.log('[CollabRequests] Notification entry created successfully');
            }
          } catch (notificationError) {
            console.warn('[CollabRequests] Error creating notification entry (non-fatal):', notificationError);
            // Don't fail the request if notification creation fails
          }
        } else {
          console.warn('[CollabRequests] Could not fetch creator email for notification:', authError);
        }
      } catch (error) {
        console.error('[CollabRequests] Error sending creator notification (non-fatal):', error);
        // Don't fail the request if notification fails
      }
    }

    res.json({
      success: true,
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
 * GET /api/collab-requests
 * Get all collab requests for authenticated creator
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status } = req.query;

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
      console.error('[CollabRequests] Error fetching requests:', error);
      console.error('[CollabRequests] Error details:', JSON.stringify(error, null, 2));
      console.error('[CollabRequests] User ID:', userId);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch collaboration requests',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    res.json({
      success: true,
      requests: requests || [],
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
    if (request.collab_type === 'paid' || request.collab_type === 'both') {
      dealAmount = request.exact_budget || 0;
    }
    const isBarter = request.collab_type === 'barter';

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

    await supabase
      .from('collab_requests')
      .update({
        status: 'accepted',
        deal_id: deal.id,
        accepted_at: now,
        accepted_by_creator_id: userId,
        accepted_ip: clientIp,
        accepted_user_agent: userAgent,
        updated_at: now,
      })
      .eq('id', id);

    await supabase.from('collab_request_audit_log').insert({
      collab_request_id: id,
      action: 'accepted',
      actor_id: userId,
      auth_method: 'magic_link',
      ip_address: clientIp,
      user_agent: userAgent,
      metadata: {},
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
          .select('first_name, last_name, email, location, address')
          .eq('id', userId)
          .maybeSingle();
        if (creatorError) throw new Error('Failed to fetch creator profile');
        const creatorName = creatorProfile
          ? `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || 'Creator'
          : 'Creator';
        const creatorEmail = creatorProfile?.email || req.user?.email || undefined;
        const creatorAddress = creatorProfile?.location || creatorProfile?.address || undefined;
        let paymentTerms: string | undefined;
        if (request.collab_type === 'paid' || request.collab_type === 'both') {
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
          additionalTerms: request.collab_type === 'barter' && request.barter_description ? `Barter Collaboration: ${request.barter_description}` : undefined,
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
            dealType: request.collab_type === 'barter' ? 'barter' : 'paid',
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
    if (request.collab_type === 'paid' || request.collab_type === 'both') {
      dealAmount = request.exact_budget || 0;
    }

    const isBarter = request.collab_type === 'barter';

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
        accepted_at: now,
        accepted_by_creator_id: userId,
        accepted_ip: clientIp,
        accepted_user_agent: userAgent,
        updated_at: now,
      })
      .eq('id', id);

    if (updateError) {
      console.error('[CollabRequests] Error updating request:', updateError);
      // Deal was created, so continue anyway
    }

    await supabase.from('collab_request_audit_log').insert({
      collab_request_id: id,
      action: 'accepted',
      actor_id: userId,
      auth_method: 'session',
      ip_address: clientIp,
      user_agent: userAgent,
      metadata: {},
    }).then(({ error: logErr }) => { if (logErr) console.warn('[CollabRequests] Audit log insert failed:', logErr); });

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
          .select('first_name, last_name, email, location, address')
          .eq('id', userId)
          .maybeSingle();

        if (creatorError) {
          console.error('[CollabRequests] Error fetching creator profile:', creatorError);
          throw new Error('Failed to fetch creator profile');
        }

        // Build creator name
        const creatorName = creatorProfile
          ? `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || 'Creator'
          : 'Creator';
        
        const creatorEmail = creatorProfile?.email || req.user?.email || undefined;
        const creatorAddress = creatorProfile?.location || creatorProfile?.address || undefined;

        // Build payment terms based on collab type
        let paymentTerms: string | undefined;
        if (request.collab_type === 'paid' || request.collab_type === 'both') {
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
          additionalTerms: request.collab_type === 'barter' && request.barter_description
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
            status: 'Drafting', // Contract is ready, awaiting brand signature
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
              dealType: request.collab_type === 'barter' ? 'barter' : 'paid',
              deliverables: deliverablesArray.length > 0 ? deliverablesArray : ['As per agreement'],
              contractReadyToken,
              contractUrl: contractUrl || undefined,
            }).catch((emailError) => {
              console.error('[CollabRequests] Acceptance email sending failed (non-fatal):', emailError);
            });
          }
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

