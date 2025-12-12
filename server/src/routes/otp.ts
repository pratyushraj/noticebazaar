// OTP API Routes
// Handles Fast2SMS OTP sending and verification for contract acceptance

import express, { Router, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendOTP } from '../services/fast2smsService.js';

const router = Router();
const publicRouter = Router(); // Public router for brand response page

/**
 * Generate a 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP using SHA256
 */
function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Log deal action to deal_action_logs table
 */
async function logDealAction(
  dealId: string,
  event: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    await supabase.from('deal_action_logs').insert({
      deal_id: dealId,
      event,
      metadata,
    });
  } catch (error: any) {
    console.error('[OTP] Failed to log deal action:', error);
    // Don't throw - logging failure shouldn't block the operation
  }
}

// POST /api/otp/send (PUBLIC - for brand response page)
// Send OTP to brand's phone number - no auth required
publicRouter.post('/send', async (req: express.Request, res: Response) => {
  try {
    const { dealId, phone } = req.body;

    if (!dealId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: dealId',
      });
    }

    // Verify deal exists
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError) {
      console.error('[OTP] Error fetching deal:', dealError);
      return res.status(500).json({
        success: false,
        error: `Database error: ${dealError.message}`,
      });
    }

    if (!deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found',
      });
    }

    // Get brand phone number - use provided phone or deal's brand_phone
    const brandPhone = (phone && phone.trim() && phone !== '+91' && phone !== '+91 ') 
      ? phone.trim() 
      : (deal as any).brand_phone;
    
    if (!brandPhone || brandPhone.trim() === '' || brandPhone === '+91' || brandPhone === '+91 ') {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required to send OTP. Please provide a phone number.',
      });
    }

    // Check cooldown (prevent spam - max 1 OTP per 30 seconds)
    const lastSentAt = (deal as any).otp_last_sent_at;
    if (lastSentAt) {
      const lastSent = new Date(lastSentAt);
      const now = new Date();
      const secondsSinceLastSent = (now.getTime() - lastSent.getTime()) / 1000;
      
      if (secondsSinceLastSent < 30) {
        const remainingSeconds = Math.ceil(30 - secondsSinceLastSent);
        return res.status(429).json({
          success: false,
          error: `Please wait ${remainingSeconds} seconds before requesting another OTP`,
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    console.log('[OTP] Generated OTP for deal:', dealId);
    console.log('[OTP] OTP hash:', otpHash.substring(0, 16) + '...');
    console.log('[OTP] Expires at:', expiresAt.toISOString());

    // Send OTP via Fast2SMS
    const smsResult = await sendOTP(brandPhone, otp);

    if (!smsResult.success) {
      console.error('[OTP] Failed to send SMS:', smsResult.error);
      return res.status(500).json({
        success: false,
        error: smsResult.error || 'Failed to send OTP',
      });
    }

    // Update deal with OTP hash and expiration
    const updateData: any = {
      otp_hash: otpHash,
      otp_expires_at: expiresAt.toISOString(),
      otp_last_sent_at: new Date().toISOString(),
      otp_attempts: 0, // Reset attempts on new OTP
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update(updateData)
      .eq('id', dealId);

    if (updateError) {
      console.error('[OTP] Failed to update deal:', updateError);
      return res.status(500).json({
        success: false,
        error: `Failed to save OTP: ${updateError.message}`,
      });
    }

    // Log the action
    await logDealAction(dealId, 'OTP_SENT', {
      phone: brandPhone.replace(/(\d{2})\d{6}(\d{2})/, '$1****$2'), // Mask phone
      requestId: smsResult.requestId,
    });

    console.log('[OTP] OTP sent successfully to brand phone');

    return res.json({
      success: true,
      message: 'OTP sent successfully',
      requestId: smsResult.requestId,
    });
  } catch (error: any) {
    console.error('[OTP] Unhandled error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// POST /api/otp/verify (PUBLIC - for brand response page)
// Verify OTP entered by brand - no auth required
publicRouter.post('/verify', async (req: express.Request, res: Response) => {
  try {
    const { dealId, otp } = req.body;

    if (!dealId || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: dealId and otp',
      });
    }

    // Verify OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP format. OTP must be 6 digits',
      });
    }

    // Fetch deal with OTP info
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found',
      });
    }

    // Check if OTP exists
    const storedHash = (deal as any).otp_hash;
    if (!storedHash) {
      return res.status(400).json({
        success: false,
        error: 'No OTP found. Please request a new OTP',
      });
    }

    // Check if OTP is already verified
    if ((deal as any).otp_verified === true) {
      return res.status(400).json({
        success: false,
        error: 'OTP has already been verified',
      });
    }

    // Check expiration
    const expiresAt = (deal as any).otp_expires_at;
    if (expiresAt) {
      const expirationTime = new Date(expiresAt);
      const now = new Date();
      
      if (now > expirationTime) {
        return res.status(400).json({
          success: false,
          error: 'OTP has expired. Please request a new OTP',
        });
      }
    }

    // Check max attempts (prevent brute force)
    const attempts = (deal as any).otp_attempts || 0;
    if (attempts >= 5) {
      return res.status(429).json({
        success: false,
        error: 'Maximum OTP verification attempts exceeded. Please request a new OTP',
      });
    }

    // Verify OTP
    const inputHash = hashOTP(otp);
    const isValid = crypto.timingSafeEqual(
      Buffer.from(storedHash),
      Buffer.from(inputHash)
    );

    if (!isValid) {
      // Increment attempts
      const newAttempts = attempts + 1;
      await supabase
        .from('brand_deals')
        .update({
          otp_attempts: newAttempts,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      // Log failed attempt
      await logDealAction(dealId, 'OTP_FAILED_ATTEMPT', {
        attempts: newAttempts,
      });

      return res.status(400).json({
        success: false,
        error: `Invalid OTP. ${5 - newAttempts} attempts remaining`,
        attemptsRemaining: 5 - newAttempts,
      });
    }

    // OTP is valid - mark as verified
    const updateData: any = {
      otp_verified: true,
      otp_verified_at: new Date().toISOString(),
      brand_response_status: 'accepted_verified',
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update(updateData)
      .eq('id', dealId);

    if (updateError) {
      console.error('[OTP] Failed to update deal:', updateError);
      return res.status(500).json({
        success: false,
        error: `Failed to verify OTP: ${updateError.message}`,
      });
    }

    // Log successful verification
    await logDealAction(dealId, 'OTP_VERIFIED', {
      verifiedAt: updateData.otp_verified_at,
    });

    // Generate invoice after OTP verification
    try {
      const { generateInvoice } = await import('../services/invoiceService.js');
      console.log('[OTP] Generating invoice for OTP-verified deal...');
      await generateInvoice(dealId);
      console.log('[OTP] Invoice generated successfully');
    } catch (invoiceError: any) {
      console.error('[OTP] Invoice generation failed (non-fatal):', invoiceError.message);
      // Don't fail the OTP verification if invoice generation fails
    }

    console.log('[OTP] OTP verified successfully for deal:', dealId);

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      verifiedAt: updateData.otp_verified_at,
    });
  } catch (error: any) {
    console.error('[OTP] Unhandled error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// POST /api/otp/verify (PROTECTED - for creators)
// Verify OTP entered by brand - requires auth
router.post('/verify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { dealId, otp } = req.body;

    if (!dealId || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: dealId and otp',
      });
    }

    // Verify OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP format. OTP must be 6 digits',
      });
    }

    // Fetch deal with OTP info
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found',
      });
    }

    // Verify user has access
    if (deal.creator_id !== req.user.id && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Check if OTP exists
    const storedHash = (deal as any).otp_hash;
    if (!storedHash) {
      return res.status(400).json({
        success: false,
        error: 'No OTP found. Please request a new OTP',
      });
    }

    // Check if OTP is already verified
    if ((deal as any).otp_verified === true) {
      return res.status(400).json({
        success: false,
        error: 'OTP has already been verified',
      });
    }

    // Check expiration
    const expiresAt = (deal as any).otp_expires_at;
    if (expiresAt) {
      const expirationTime = new Date(expiresAt);
      const now = new Date();
      
      if (now > expirationTime) {
        return res.status(400).json({
          success: false,
          error: 'OTP has expired. Please request a new OTP',
        });
      }
    }

    // Check max attempts (prevent brute force)
    const attempts = (deal as any).otp_attempts || 0;
    if (attempts >= 5) {
      return res.status(429).json({
        success: false,
        error: 'Maximum OTP verification attempts exceeded. Please request a new OTP',
      });
    }

    // Verify OTP
    const inputHash = hashOTP(otp);
    const isValid = crypto.timingSafeEqual(
      Buffer.from(storedHash),
      Buffer.from(inputHash)
    );

    if (!isValid) {
      // Increment attempts
      const newAttempts = attempts + 1;
      await supabase
        .from('brand_deals')
        .update({
          otp_attempts: newAttempts,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      // Log failed attempt
      await logDealAction(dealId, 'OTP_FAILED_ATTEMPT', {
        attempts: newAttempts,
      });

      return res.status(400).json({
        success: false,
        error: `Invalid OTP. ${5 - newAttempts} attempts remaining`,
        attemptsRemaining: 5 - newAttempts,
      });
    }

    // OTP is valid - mark as verified
    const updateData: any = {
      otp_verified: true,
      otp_verified_at: new Date().toISOString(),
      brand_response_status: 'accepted_verified',
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update(updateData)
      .eq('id', dealId);

    if (updateError) {
      console.error('[OTP] Failed to update deal:', updateError);
      return res.status(500).json({
        success: false,
        error: `Failed to verify OTP: ${updateError.message}`,
      });
    }

    // Log successful verification
    await logDealAction(dealId, 'OTP_VERIFIED', {
      verifiedAt: updateData.otp_verified_at,
    });

    // Generate invoice after OTP verification
    try {
      const { generateInvoice } = await import('../services/invoiceService.js');
      console.log('[OTP] Generating invoice for OTP-verified deal...');
      await generateInvoice(dealId);
      console.log('[OTP] Invoice generated successfully');
    } catch (invoiceError: any) {
      console.error('[OTP] Invoice generation failed (non-fatal):', invoiceError.message);
      // Don't fail the OTP verification if invoice generation fails
    }

    console.log('[OTP] OTP verified successfully for deal:', dealId);

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      verifiedAt: updateData.otp_verified_at,
    });
  } catch (error: any) {
    console.error('[OTP] Unhandled error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

export default router;
export { publicRouter };
