// Deals API Routes
// Handles deal-related operations like logging reminders

import { Router, Response } from 'express';
import { supabase } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import multer from 'multer';

const router = Router();

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

// Debug route to test routing
router.get('/test-routing', (req, res) => {
  console.log('[Deals] Test routing endpoint hit');
  res.json({ success: true, message: 'Deals router is working', timestamp: new Date().toISOString() });
});

export default router;

