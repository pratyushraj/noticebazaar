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
        .select('id, deal_id, submission_id, is_active, expires_at, revoked_at')
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

    // Verify deal exists - handle case where deal_id might be null for contract_ready_tokens
    let deal: any = null;
    let dealError: any = null;
    
    if (tokenData.deal_id) {
      const { data: dealData, error: dealErr } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', tokenData.deal_id)
      .maybeSingle();
      
      deal = dealData;
      dealError = dealErr;
    } else if ((tokenData as any).submission_id) {
      // For contract_ready_tokens with submission_id, fetch deal from submission
      const { data: submission, error: submissionError } = await supabase
        .from('deal_details_submissions')
        .select('deal_id, form_data')
        .eq('id', (tokenData as any).submission_id)
        .maybeSingle();
      
      if (!submissionError && submission?.deal_id) {
        const { data: dealData, error: dealErr } = await supabase
          .from('brand_deals')
          .select('*')
          .eq('id', submission.deal_id)
          .maybeSingle();
        
        deal = dealData;
        dealError = dealErr;
      } else if (!submissionError && submission) {
        // Deal not created yet, use form_data for brand info
        const formData = submission.form_data as any;
        deal = {
          id: null,
          brand_email: formData?.brandEmail || formData?.brand_email,
          brand_name: formData?.brandName || formData?.brand_name,
          otp_last_sent_at: null,
          otp_hash: null,
          otp_expires_at: null,
          otp_attempts: 0,
          otp_verified: false
        };
      } else {
        dealError = submissionError;
      }
    } else {
      // No deal_id or submission_id - try to get deal info from getContractReadyTokenInfo
      // This handles cases where the token exists but deal/submission references are missing
      try {
        const { getContractReadyTokenInfo } = await import('../services/contractReadyTokenService.js');
        const tokenInfo = await getContractReadyTokenInfo(token);
        
        if (tokenInfo && tokenInfo.deal) {
          // Use deal info from tokenInfo (may have id: null but has brand_email, etc.)
          deal = tokenInfo.deal;
          console.log('[OTP] Got deal info from tokenInfo service:', {
            dealId: deal?.id,
            brandEmail: deal?.brand_email,
            brandName: deal?.brand_name
          });
        } else {
          console.warn('[OTP] TokenInfo service returned no deal info for token:', token);
          return res.status(400).json({
            success: false,
            error: 'Invalid token: missing deal or submission reference',
          });
        }
      } catch (importError: any) {
        console.error('[OTP] Error getting token info:', importError);
        return res.status(500).json({
          success: false,
          error: `Failed to validate token: ${importError?.message || 'Unknown error'}`,
        });
      }
    }

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

    console.log('[OTP] Generated OTP for deal:', deal?.id || 'pending (from submission)');
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

    // Update deal with OTP hash and expiration (only if deal exists in database)
    if (deal?.id) {
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
        .eq('id', deal.id);

    if (updateError) {
      console.error('[OTP] Failed to update deal:', updateError);
        // Don't fail the OTP send if update fails - OTP was already sent
        console.warn('[OTP] OTP sent but failed to save to deal table (non-fatal)');
      }
    } else if ((tokenData as any).submission_id) {
      // Deal doesn't exist yet - store OTP hash in submission's form_data
      const { data: submission, error: submissionError } = await supabase
        .from('deal_details_submissions')
        .select('form_data')
        .eq('id', (tokenData as any).submission_id)
        .maybeSingle();
      
      if (!submissionError && submission) {
        const formData = submission.form_data as any || {};
        const updatedFormData = {
          ...formData,
          _otp_hash: otpHash,
          _otp_expires_at: expiresAt.toISOString(),
          _otp_last_sent_at: new Date().toISOString(),
          _otp_attempts: 0,
        };
        
        const { error: updateError } = await supabase
          .from('deal_details_submissions')
          .update({ form_data: updatedFormData })
          .eq('id', (tokenData as any).submission_id);
        
        if (updateError) {
          console.error('[OTP] Failed to store OTP in submission:', updateError);
          // Don't fail OTP send - OTP was already sent via email
          console.warn('[OTP] OTP sent but failed to save to submission (non-fatal)');
        } else {
          console.log('[OTP] OTP hash stored in submission form_data');
        }
      } else {
        console.warn('[OTP] Could not find submission to store OTP hash');
      }
    } else {
      // Deal doesn't exist yet and no submission_id - OTP sent but can't store
      console.log('[OTP] Deal not created yet (id is null), OTP sent but not stored');
      console.log('[OTP] Deal info available:', {
        brandEmail: deal?.brand_email,
        brandName: deal?.brand_name,
        hasDealId: !!deal?.id
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
        .select('id, deal_id, submission_id, is_active, expires_at, revoked_at')
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

    // Fetch deal with OTP info - handle case where deal_id might be null for contract_ready_tokens
    let deal: any = null;
    let dealError: any = null;
    
    if (tokenData.deal_id) {
      const { data: dealData, error: dealErr } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('id', tokenData.deal_id)
      .maybeSingle();

      deal = dealData;
      dealError = dealErr;
    } else if ((tokenData as any).submission_id) {
      // For contract_ready_tokens with submission_id, fetch deal from submission
      const { data: submission, error: submissionError } = await supabase
        .from('deal_details_submissions')
        .select('deal_id, form_data')
        .eq('id', (tokenData as any).submission_id)
        .maybeSingle();
      
      if (!submissionError && submission?.deal_id) {
        const { data: dealData, error: dealErr } = await supabase
          .from('brand_deals')
          .select('*')
          .eq('id', submission.deal_id)
          .maybeSingle();
        
        deal = dealData;
        dealError = dealErr;
      } else if (!submissionError && submission) {
        // Deal not created yet - check OTP hash in submission's form_data
        const formData = submission.form_data as any || {};
        const storedHash = formData._otp_hash;
        
        if (!storedHash) {
          return res.status(400).json({
            success: false,
            error: 'No OTP found. Please request a new OTP',
          });
        }
        
        // Check if OTP is already verified
        if (formData._otp_verified === true) {
          return res.status(400).json({
            success: false,
            error: 'OTP has already been verified',
          });
        }
        
        // Check expiration
        const expiresAt = formData._otp_expires_at;
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
        
        // Check max attempts
        const attempts = formData._otp_attempts || 0;
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
          // Increment attempts in submission
          const updatedFormData = {
            ...formData,
            _otp_attempts: attempts + 1,
          };
          
          await supabase
            .from('deal_details_submissions')
            .update({ form_data: updatedFormData })
            .eq('id', (tokenData as any).submission_id);
          
          return res.status(400).json({
            success: false,
            error: `Invalid OTP. ${5 - (attempts + 1)} attempts remaining`,
            attemptsRemaining: 5 - (attempts + 1),
          });
        }
        
        // OTP is valid - mark as verified in submission
        const verifiedAt = new Date().toISOString();
        const updatedFormData = {
          ...formData,
          _otp_verified: true,
          _otp_verified_at: verifiedAt,
        };
        
        const { error: updateError } = await supabase
          .from('deal_details_submissions')
          .update({ form_data: updatedFormData })
          .eq('id', (tokenData as any).submission_id);
        
        if (updateError) {
          console.error('[OTP] Failed to update submission verification status:', updateError);
          return res.status(500).json({
            success: false,
            error: `Failed to verify OTP: ${updateError.message}`,
          });
        }
        
        console.log('[OTP] OTP verified successfully for submission (deal not created yet)');
        
        return res.json({
          success: true,
          message: 'OTP verified successfully',
          verifiedAt: verifiedAt,
        });
      } else {
        // Deal not created yet and no submission found
        return res.status(400).json({
          success: false,
          error: 'OTP verification requires deal to be created. Please contact support or try again later.',
        });
      }
    } else {
      // No deal_id or submission_id
      return res.status(404).json({
        success: false,
        error: 'Deal not found',
      });
    }

    if (dealError) {
      console.error('[OTP] Error fetching deal:', dealError);
      return res.status(500).json({
        success: false,
        error: `Database error: ${dealError.message}`,
      });
    }

    if (!deal || !deal.id) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found',
      });
    }

    // Check if OTP exists (use brand OTP fields for public endpoint)
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
      // Increment attempts (only if deal exists)
      if (deal?.id) {
      const newAttempts = attempts + 1;
      await supabase
        .from('brand_deals')
        .update({
          otp_attempts: newAttempts,
          updated_at: new Date().toISOString(),
        })
          .eq('id', deal.id);

      // Log failed attempt
        await logDealAction(deal.id, 'OTP_FAILED_ATTEMPT', {
        attempts: newAttempts,
      });
      }

      return res.status(400).json({
        success: false,
        error: `Invalid OTP. ${5 - (attempts + 1)} attempts remaining`,
        attemptsRemaining: 5 - (attempts + 1),
      });
    }

    // OTP is valid - mark as verified (only if deal exists)
    let verifiedAt: string | null = null;
    
    if (deal?.id) {
    const updateData: any = {
      otp_verified: true,
      otp_verified_at: new Date().toISOString(),
      brand_response_status: 'accepted_verified',
      updated_at: new Date().toISOString(),
    };

      verifiedAt = updateData.otp_verified_at;

    const { error: updateError } = await supabase
      .from('brand_deals')
      .update(updateData)
        .eq('id', deal.id);

    if (updateError) {
      console.error('[OTP] Failed to update deal:', updateError);
      return res.status(500).json({
        success: false,
        error: `Failed to verify OTP: ${updateError.message}`,
      });
    }

    // Log successful verification
      await logDealAction(deal.id, 'OTP_VERIFIED', {
      verifiedAt: updateData.otp_verified_at,
    });
    }

    // Generate invoice after OTP verification
    try {
      const { generateInvoice } = await import('../services/invoiceService.js');
      console.log('[OTP] Generating invoice for OTP-verified deal...');
      await generateInvoice(deal?.id || tokenData.deal_id);
      console.log('[OTP] Invoice generated successfully');
    } catch (invoiceError: any) {
      console.error('[OTP] Invoice generation failed (non-fatal):', invoiceError.message);
      // Don't fail the OTP verification if invoice generation fails
    }

    console.log('[OTP] OTP verified successfully for deal:', deal?.id || tokenData.deal_id);

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      verifiedAt: verifiedAt || new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[OTP] Unhandled error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// POST /api/otp/send-creator (PROTECTED - for creators)
// Send OTP to creator's email - requires auth
router.post('/send-creator', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { dealId } = req.body;

    if (!dealId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: dealId',
      });
    }

    // Fetch deal
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

    // Verify user has access (must be the creator or admin)
    if (deal.creator_id !== req.user.id && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Get creator's email from auth.users (email is in auth, not profiles)
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(req.user.id);
    
    if (authError) {
      console.error('[OTP] Error fetching user from auth:', authError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user information',
      });
    }
    
    if (!authUser?.user?.email) {
      console.error('[OTP] Creator email not found for user:', req.user.id);
      return res.status(404).json({
        success: false,
        error: 'Creator email not found. Please ensure your account has a valid email address.',
      });
    }

    const creatorEmail = authUser.user.email.trim();
    
    // Validate email format before sending
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(creatorEmail)) {
      console.error('[OTP] Invalid email format:', creatorEmail);
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format',
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Send OTP email (function signature: email, otp, brandName?)
    const emailResult = await sendEmailOTP(creatorEmail, otp, (deal as any).brand_name);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: emailResult.error || 'Failed to send OTP email',
      });
    }

    // Store OTP hash in deal (for creator signing)
    const updateData: any = {
      creator_otp_hash: otpHash,
      creator_otp_expires_at: expiresAt.toISOString(),
      creator_otp_attempts: 0,
      creator_otp_verified: false,
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
    await logDealAction(dealId, 'CREATOR_OTP_SENT', {
      email: creatorEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
      emailId: emailResult.emailId,
    });

    console.log('[OTP] Creator OTP sent successfully');

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

// POST /api/otp/verify-creator (PROTECTED - for creators)
// Verify OTP entered by creator - requires auth
router.post('/verify-creator', async (req: AuthenticatedRequest, res: Response) => {
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

    // Check if OTP exists (use creator-specific fields)
    const storedHash = (deal as any).creator_otp_hash;
    if (!storedHash) {
      return res.status(400).json({
        success: false,
        error: 'No OTP found. Please request a new OTP',
      });
    }

    // Check if OTP is already verified
    if ((deal as any).creator_otp_verified === true) {
      return res.status(400).json({
        success: false,
        error: 'OTP has already been verified',
      });
    }

    // Check expiration
    const expiresAt = (deal as any).creator_otp_expires_at;
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
    const attempts = (deal as any).creator_otp_attempts || 0;
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
          creator_otp_attempts: newAttempts,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId);

      // Log failed attempt
      await logDealAction(dealId, 'CREATOR_OTP_FAILED_ATTEMPT', {
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
      creator_otp_verified: true,
      creator_otp_verified_at: new Date().toISOString(),
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
    await logDealAction(dealId, 'CREATOR_OTP_VERIFIED', {
      verifiedAt: updateData.creator_otp_verified_at,
    });

    console.log('[OTP] Creator OTP verified successfully for deal:', dealId);

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
