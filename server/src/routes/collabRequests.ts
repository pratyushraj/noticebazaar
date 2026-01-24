// Collaboration Request Link API Routes
// Handles public collab link submissions and creator management

import express, { Request, Response } from 'express';
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
} from '../services/collabRequestEmailService.js';
import crypto from 'crypto';

const router = express.Router();

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
          facebook_followers
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
 * POST /api/collab/:username/submit
 * Submit a collaboration request (public, no auth)
 */
router.post('/:username/submit', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const {
      brand_name,
      brand_email,
      brand_phone,
      brand_website,
      brand_instagram,
      collab_type,
      budget_range,
      exact_budget,
      barter_description,
      barter_value,
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

    // Create collab request
    const insertData: any = {
      creator_id: creator.id,
      brand_name: brand_name.trim(),
      brand_email: brand_email.toLowerCase().trim(),
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
    };

    // Add budget/barter fields based on collab_type
    if (collab_type === 'paid' || collab_type === 'both') {
      insertData.budget_range = budget_range || null;
      insertData.exact_budget = exact_budget ? parseFloat(exact_budget) : null;
    }

    if (collab_type === 'barter' || collab_type === 'both') {
      insertData.barter_description = barter_description?.trim() || null;
      insertData.barter_value = barter_value ? parseFloat(barter_value) : null;
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

          // Calculate total follower count
          const profileAny = creatorProfile as any;
          let totalFollowers = 0;
          if (profileAny?.instagram_followers) totalFollowers += profileAny.instagram_followers;
          if (profileAny?.youtube_subs) totalFollowers += profileAny.youtube_subs;
          if (profileAny?.tiktok_followers) totalFollowers += profileAny.tiktok_followers;
          if (profileAny?.twitter_followers) totalFollowers += profileAny.twitter_followers;

          // Send creator notification email
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
            deliverables: deliverablesArray,
            deadline: deadline || undefined,
            timeline: deadline || undefined, // Use deadline as timeline
            notes: undefined, // Don't duplicate campaign description in notes
            requestId: collabRequest.id,
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
            const dashboardLink = `${frontendUrl}/#/creator-dashboard`;
            
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
      deal_type: request.collab_type === 'barter' ? 'barter' : 'paid',
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

    // Update collab request status
    const { error: updateError } = await supabase
      .from('collab_requests')
      .update({
        status: 'accepted',
        deal_id: deal.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('[CollabRequests] Error updating request:', updateError);
      // Deal was created, so continue anyway
    }

    // Auto-generate contract (idempotent - check if contract already exists)
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
          brandAddress: undefined, // Not available from collab request
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

