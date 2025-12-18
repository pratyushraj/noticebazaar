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

    // Update brand_response_status to 'pending' and deal status to 'Sent' if not already set
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

export default router;

