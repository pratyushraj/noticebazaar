// @ts-nocheck
// OTP Routes for Creator Magic Link Signing
// Handles OTP generation and verification for contract signing

import express, { Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../lib/supabase.js';
import { sendOTPEmail } from '../services/otpEmailService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Diagnostic route to test Resend directly
router.get('/test-resend', async (req, res) => {
  try {
    const testEmail = req.query.email as string || 'notice3@yopmail.com';
    console.log('[OTP Test] Attempting direct Resend test to:', testEmail);
    await sendOTPEmail(testEmail, '123456');
    return res.json({ success: true, message: 'Test email sent successfully' });
  } catch (err: any) {
    console.error('[OTP Test] direct Resend test failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

const sendRateStore: Record<string, { count: number; resetAt: number; lastSentAt: number }> = {};
const SEND_WINDOW_MS = 10 * 60 * 1000;
const SEND_MAX = 5;
const SEND_COOLDOWN_MS = 60 * 1000;

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

// Generate and send OTP
router.post('/send', async (req, res) => {
  try {
    const { token, email } = req.body;
    const ip = req.headers['x-forwarded-for']?.toString() || req.ip || 'unknown';

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        error: 'Token and email are required'
      });
    }

    // Basic rate limiting per email + IP to prevent OTP spam
    const emailKey = String(email).trim().toLowerCase();
    const rateKey = `${emailKey}:${ip}`;
    const now = Date.now();
    const entry = sendRateStore[rateKey];
    if (!entry || now > entry.resetAt) {
      sendRateStore[rateKey] = { count: 1, resetAt: now + SEND_WINDOW_MS, lastSentAt: now };
    } else {
      if (now - entry.lastSentAt < SEND_COOLDOWN_MS) {
        return res.status(429).json({
          success: false,
          error: 'Please wait before requesting another OTP.',
          retryAfter: Math.ceil((SEND_COOLDOWN_MS - (now - entry.lastSentAt)) / 1000)
        });
      }
      if (entry.count >= SEND_MAX) {
        return res.status(429).json({
          success: false,
          error: 'Too many OTP requests. Please try again later.',
          retryAfter: Math.ceil((entry.resetAt - now) / 1000)
        });
      }
      entry.count += 1;
      entry.lastSentAt = now;
    }

    // Try creator_signing_tokens first (for creator magic link signing)
    let tokenData: any = null;
    let tokenType: 'creator_signing' | 'contract_ready' = 'creator_signing';
    let emailField = 'creator_email';

    const { data: creatorTokenData, error: creatorTokenError } = await supabase
      .from('creator_signing_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_valid', true)
      .maybeSingle();

    if (creatorTokenData) {
      tokenData = creatorTokenData;
      tokenType = 'creator_signing';
      emailField = 'creator_email';
    } else {
      // Try contract_ready_tokens (for brand signing on ContractReadyPage)
      const { data: contractTokenData, error: contractTokenError } = await supabase
        .from('contract_ready_tokens')
        .select('*, brand_deals!inner(brand_email)')
        .eq('id', token)
        .eq('is_valid', true)
        .maybeSingle();

      if (contractTokenData) {
        tokenData = contractTokenData;
        tokenType = 'contract_ready';
        emailField = 'brand_email';
      }
    }

    if (!tokenData) {
      console.error('[OTP] Token not found in either table:', token);
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired signing link'
      });
    }

    // Verify email matches (different field depending on token type)
    let expectedEmail: string;
    if (tokenType === 'creator_signing') {
      expectedEmail = tokenData.creator_email;
    } else {
      // For contract_ready_tokens, get email from the related deal
      expectedEmail = tokenData.brand_deals?.brand_email || '';
    }

    if (!expectedEmail || expectedEmail.toLowerCase() !== email.toLowerCase()) {
      console.error('[OTP] Email mismatch:', { expected: expectedEmail, provided: email, tokenType });
      return res.status(403).json({
        success: false,
        error: 'Email does not match authorized signer'
      });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    // Store OTP in database (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Update the appropriate table
    let updateError: any = null;
    if (tokenType === 'creator_signing') {
      const { error } = await supabase
        .from('creator_signing_tokens')
        .update({
          creator_otp_hash: otpHash,
          creator_otp_expires_at: expiresAt.toISOString(),
          creator_otp_attempts: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenData.id);
      updateError = error;
    } else {
      const { error } = await supabase
        .from('contract_ready_tokens')
        .update({
          otp_hash: otpHash,
          otp_expires_at: expiresAt.toISOString(),
          otp_attempts: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenData.id);
      updateError = error;
    }

    if (updateError) {
      console.error('[OTP] Error storing OTP:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate OTP'
      });
    }

    // Send OTP via email
    try {
      await sendOTPEmail(email, otp);
      console.log('[OTP] OTP sent successfully to:', email, 'for token type:', tokenType);

      // Also send via WhatsApp if phone number is available
      let phoneNumber = null;
      if (tokenType === 'creator_signing' && tokenData.profiles?.phone) {
        phoneNumber = tokenData.profiles.phone;
      } else if (tokenType === 'contract_ready_tokens' && tokenData.brand_deals?.brand_phone) {
        phoneNumber = tokenData.brand_deals.brand_phone;
      }

      if (phoneNumber) {
        // Dynamic import to avoid issues if service is missing
        import('../services/msg91Service.js').then(async ({ sendOTPviaWhatsApp }) => {
          try {
            const waResult = await sendOTPviaWhatsApp(phoneNumber!, otp);
            if (waResult.success) {
              console.log('[OTP] WhatsApp OTP sent successfully to:', phoneNumber);
            } else {
              console.warn('[OTP] Failed to send WhatsApp OTP:', waResult.error);
            }
          } catch (waError) {
            console.error('[OTP] Check: Error sending WhatsApp OTP:', waError);
          }
        });
      }
    } catch (emailError) {
      console.error('[OTP] Error sending email:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP email'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      expiresAt: expiresAt.toISOString(),
      tokenType // Include for debugging
    });

  } catch (error) {
    console.error('[OTP] Send error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
    });
  }
});

// Verify OTP
router.post('/verify', async (req, res) => {
  try {
    const { token, otp } = req.body;

    if (!token || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Token and OTP are required'
      });
    }

    // Try creator_signing_tokens first, then contract_ready_tokens
    let tokenData: any = null;
    let tokenType: 'creator_signing' | 'contract_ready' = 'creator_signing';

    // Fetch creator token with profile phone
    const { data: creatorTokenData, error: creatorTokenError } = await supabase
      .from('creator_signing_tokens')
      .select('*, profiles(phone)')
      .eq('token', token)
      .eq('is_valid', true)
      .maybeSingle();

    if (creatorTokenData) {
      tokenData = creatorTokenData;
      tokenType = 'creator_signing';
    } else {
      const { data: contractTokenData, error: contractTokenError } = await supabase
        .from('contract_ready_tokens')
        .select('*, brand_deals!inner(brand_email, brand_phone)')
        .eq('id', token)
        .eq('is_valid', true)
        .maybeSingle();

      if (contractTokenData) {
        tokenData = contractTokenData;
        tokenType = 'contract_ready';
      }
    }

    if (!tokenData) {
      console.error('[OTP] Verify: Token not found in either table:', token);
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired signing link'
      });
    }

    // Determine column names based on token type
    const otpHashField = tokenType === 'creator_signing' ? 'creator_otp_hash' : 'otp_hash';
    const otpExpiresField = tokenType === 'creator_signing' ? 'creator_otp_expires_at' : 'otp_expires_at';
    const otpAttemptsField = tokenType === 'creator_signing' ? 'creator_otp_attempts' : 'otp_attempts';

    const storedHash = tokenData[otpHashField];
    const storedExpires = tokenData[otpExpiresField];
    const storedAttempts = tokenData[otpAttemptsField] || 0;

    // Check if OTP exists
    if (!storedHash || !storedExpires) {
      return res.status(400).json({
        success: false,
        error: 'No OTP found. Please request a new one.'
      });
    }

    // Check if OTP expired
    if (new Date(storedExpires) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new one.'
      });
    }

    // Check attempts
    if (storedAttempts >= 5) {
      return res.status(429).json({
        success: false,
        error: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    const otpHash = hashOTP(otp);

    if (otpHash !== storedHash) {
      // Increment attempts
      if (tokenType === 'creator_signing') {
        await supabase
          .from('creator_signing_tokens')
          .update({
            creator_otp_attempts: storedAttempts + 1
          })
          .eq('id', tokenData.id);
      } else {
        await supabase
          .from('contract_ready_tokens')
          .update({
            otp_attempts: storedAttempts + 1
          })
          .eq('id', tokenData.id);
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid OTP. Please try again.',
        attemptsRemaining: 5 - storedAttempts - 1
      });
    }

    // OTP verified successfully
    if (tokenType === 'creator_signing') {
      await supabase
        .from('creator_signing_tokens')
        .update({
          creator_otp_verified: true,
          creator_otp_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenData.id);
    } else {
      await supabase
        .from('contract_ready_tokens')
        .update({
          otp_verified: true,
          otp_verified_at: new Date().toISOString()
        })
        .eq('id', tokenData.id);
    }

    console.log('[OTP] OTP verified successfully for token type:', tokenType);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      tokenType // Include for debugging
    });

  } catch (error) {
    console.error('[OTP] Verify error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP'
    });
  }
});

// POST /api/otp/send-creator (PROTECTED - for creators)
// Send OTP to creator's email - requires auth
router.post('/send-creator', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('[OTP] Received send-creator request for dealId:', req.body?.dealId, 'from user:', req.user?.id);

    if (!req.user || !req.user.id) {
      console.warn('[OTP] send-creator failed: No user in request');
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { dealId } = req.body;

    if (!dealId) {
      console.warn('[OTP] send-creator failed: Missing dealId in body');
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
      console.warn('[OTP] send-creator failed: Deal not found or error:', dealError);
      return res.status(404).json({
        success: false,
        error: 'Deal not found',
      });
    }

    // Verify user has access (must be the creator or admin)
    if (deal.creator_id !== req.user.id && req.user?.role !== 'admin') {
      console.warn('[OTP] send-creator failed: Access denied. Deal creator:', deal.creator_id, 'User:', req.user.id);
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

    // Send OTP email
    try {
      await sendOTPEmail(creatorEmail, otp);
      console.log('[OTP] Creator OTP sent successfully to:', creatorEmail);

      // Try sending via WhatsApp also
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', req.user.id)
          .single();

        if (profile?.phone) {
          import('../services/msg91Service.js').then(async ({ sendOTPviaWhatsApp }) => {
            const waResult = await sendOTPviaWhatsApp(profile.phone, otp);
            if (waResult.success) {
              console.log('[OTP] Creator WhatsApp OTP sent successfully');
            } else {
              console.warn('[OTP] Failed to send Creator WhatsApp OTP:', waResult.error);
            }
          });
        }
      } catch (waError) {
        console.error('[OTP] Error attempting WhatsApp sending:', waError);
      }

    } catch (emailError: any) {
      console.error('[OTP] Failed to send OTP email:', emailError);
      return res.status(500).json({
        success: false,
        error: emailError.message || 'Failed to send OTP email',
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
    });

    return res.json({
      success: true,
      message: 'OTP sent successfully to your email',
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error: any) {
    console.error('[OTP] send-creator error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// POST /api/otp/verify-creator (PROTECTED - for creators)
// Verify OTP entered by creator - requires auth
router.post('/verify-creator', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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
      verifiedAt: updateData.creator_otp_verified_at,
    });
  } catch (error: any) {
    console.error('[OTP] verify-creator error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

export default router;
