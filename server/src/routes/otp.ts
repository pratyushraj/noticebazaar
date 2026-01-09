// OTP API Routes
// Handles Email OTP sending and verification for contract acceptance

import express, { Router, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendEmailOTP } from '../services/emailOtpService.js';

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

// POST /api/otp/send (PUBLIC - for brand response page and contract ready page)
// Send OTP to brand's email address - no auth required
publicRouter.post('/send', async (req: express.Request, res: Response) => {
  try {
    const { token, email } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: token',
      });
    }

    // Validate token and get deal - check both brand_reply_tokens and contract_ready_tokens
    let tokenData: any = null;
    let tokenError: any = null;
    
    // Try brand_reply_tokens first
    const { data: replyTokenData, error: replyTokenError } = await supabase
      .from('brand_reply_tokens')
      .select('id, deal_id, is_active, expires_at, revoked_at')
      .eq('id', token)
      .maybeSingle();
    
    if (!replyTokenError && replyTokenData) {
      tokenData = replyTokenData;
    } else {
      // Try contract_ready_tokens
      const { data: readyTokenData, error: readyTokenError } = await supabase
        .from('contract_ready_tokens')
        .select('id, deal_id, is_active, expires_at, revoked_at')
        .eq('id', token)
        .maybeSingle();
      
      if (!readyTokenError && readyTokenData) {
        tokenData = readyTokenData;
      } else {
        tokenError = readyTokenError || replyTokenError;
      }
    }

    if (tokenError || !tokenData) {
      return res.status(404).json({
        success: false,
        error: 'Invalid token',
      });
    }

    // Check if token is active
    if (!tokenData.is_active || tokenData.revoked_at) {
      return res.status(403).json({
        success: false,
        error: 'This link is no longer valid',
      });
    }

    // Check if token is expired
    if (tokenData.expires_at) {
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);
      if (now > expiresAt) {
        return res.status(403).json({
          success: false,
          error: 'This request has expired',
        });
      }
    }

    // Verify deal exists
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', tokenData.deal_id)
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

    // Get brand email - use provided email or deal's brand_email
    const brandEmail = (email && email.trim()) 
      ? email.trim() 
      : (deal as any).brand_email;
    
    if (!brandEmail || brandEmail.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Email address is required to send OTP. Please provide an email address.',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(brandEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format',
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

    console.log('[OTP] Generated OTP for deal:', tokenData.deal_id);
    console.log('[OTP] OTP hash:', otpHash.substring(0, 16) + '...');
    console.log('[OTP] Expires at:', expiresAt.toISOString());

    // Send OTP via Email (Resend)
    const emailResult = await sendEmailOTP(brandEmail, otp, (deal as any).brand_name);

    if (!emailResult.success) {
      console.error('[OTP] Failed to send email:', emailResult.error);
      return res.status(500).json({
        success: false,
        error: emailResult.error || 'Failed to send OTP',
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
      .eq('id', tokenData.deal_id);

    if (updateError) {
      console.error('[OTP] Failed to update deal:', updateError);
      return res.status(500).json({
        success: false,
        error: `Failed to save OTP: ${updateError.message}`,
      });
    }

    // Log the action
    await logDealAction(tokenData.deal_id, 'OTP_SENT', {
      email: brandEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email (keep first 2 chars and domain)
      emailId: emailResult.emailId,
    });

    console.log('[OTP] OTP sent successfully to brand email');

    return res.json({
      success: true,
      message: 'OTP sent successfully to your email',
      emailId: emailResult.emailId,
    });
  } catch (error: any) {
    console.error('[OTP] Unhandled error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// POST /api/otp/verify (PUBLIC - for brand response page and contract ready page)
// Verify OTP entered by brand - no auth required
publicRouter.post('/verify', async (req: express.Request, res: Response) => {
  try {
    const { token, otp } = req.body;

    if (!token || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: token and otp',
      });
    }

    // Validate token and get deal - check both brand_reply_tokens and contract_ready_tokens
    let tokenData: any = null;
    let tokenError: any = null;
    
    // Try brand_reply_tokens first
    const { data: replyTokenData, error: replyTokenError } = await supabase
      .from('brand_reply_tokens')
      .select('id, deal_id, is_active, expires_at, revoked_at')
      .eq('id', token)
      .maybeSingle();
    
    if (!replyTokenError && replyTokenData) {
      tokenData = replyTokenData;
    } else {
      // Try contract_ready_tokens
      const { data: readyTokenData, error: readyTokenError } = await supabase
        .from('contract_ready_tokens')
        .select('id, deal_id, is_active, expires_at, revoked_at')
        .eq('id', token)
        .maybeSingle();
      
      if (!readyTokenError && readyTokenData) {
        tokenData = readyTokenData;
      } else {
        tokenError = readyTokenError || replyTokenError;
      }
    }

    if (tokenError || !tokenData) {
      return res.status(404).json({
        success: false,
        error: 'Invalid token',
      });
    }

    // Check if token is active
    if (!tokenData.is_active || tokenData.revoked_at) {
      return res.status(403).json({
        success: false,
        error: 'This link is no longer valid',
      });
    }

    // Check if token is expired
    if (tokenData.expires_at) {
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);
      if (now > expiresAt) {
        return res.status(403).json({
          success: false,
          error: 'This request has expired',
        });
      }
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
      .eq('id', tokenData.deal_id)
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
        .eq('id', tokenData.deal_id);

      // Log failed attempt
      await logDealAction(tokenData.deal_id, 'OTP_FAILED_ATTEMPT', {
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
      .eq('id', tokenData.deal_id);

    if (updateError) {
      console.error('[OTP] Failed to update deal:', updateError);
      return res.status(500).json({
        success: false,
        error: `Failed to verify OTP: ${updateError.message}`,
      });
    }

    // Log successful verification
    await logDealAction(tokenData.deal_id, 'OTP_VERIFIED', {
      verifiedAt: updateData.otp_verified_at,
    });

    // Generate invoice after OTP verification
    try {
      const { generateInvoice } = await import('../services/invoiceService.js');
      console.log('[OTP] Generating invoice for OTP-verified deal...');
      await generateInvoice(tokenData.deal_id);
      console.log('[OTP] Invoice generated successfully');
    } catch (invoiceError: any) {
      console.error('[OTP] Invoice generation failed (non-fatal):', invoiceError.message);
      // Don't fail the OTP verification if invoice generation fails
    }

    console.log('[OTP] OTP verified successfully for deal:', tokenData.deal_id);

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
        .eq('id', tokenData.deal_id);

      // Log failed attempt
      await logDealAction(tokenData.deal_id, 'OTP_FAILED_ATTEMPT', {
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
      await logDealAction(tokenData.deal_id, 'OTP_VERIFIED', {
      verifiedAt: updateData.otp_verified_at,
    });

    // Generate invoice after OTP verification
    try {
      const { generateInvoice } = await import('../services/invoiceService.js');
      console.log('[OTP] Generating invoice for OTP-verified deal...');
      await generateInvoice(tokenData.deal_id);
      console.log('[OTP] Invoice generated successfully');
    } catch (invoiceError: any) {
      console.error('[OTP] Invoice generation failed (non-fatal):', invoiceError.message);
      // Don't fail the OTP verification if invoice generation fails
    }

    console.log('[OTP] OTP verified successfully for deal:', tokenData.deal_id);

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
