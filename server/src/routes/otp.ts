// @ts-nocheck
// OTP Routes for Creator Magic Link Signing
// Handles OTP generation and verification for contract signing

import express from 'express';
import crypto from 'crypto';
import { supabase } from '../index.js';
import { sendOTPEmail } from '../services/otpEmailService.js';

const router = express.Router();
const sendRateStore: Record<string, { count: number; resetAt: number; lastSentAt: number }> = {};
const SEND_WINDOW_MS = 10 * 60 * 1000;
const SEND_MAX = 5;
const SEND_COOLDOWN_MS = 60 * 1000;

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
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

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

    const { data: creatorTokenData, error: creatorTokenError } = await supabase
      .from('creator_signing_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_valid', true)
      .maybeSingle();

    if (creatorTokenData) {
      tokenData = creatorTokenData;
      tokenType = 'creator_signing';
    } else {
      const { data: contractTokenData, error: contractTokenError } = await supabase
        .from('contract_ready_tokens')
        .select('*')
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
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

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

export default router;
