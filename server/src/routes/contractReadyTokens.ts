// API route for contract ready tokens
// Public endpoint for brands to view and sign contracts

import { Router, Request, Response } from 'express';
import { supabase } from '../index.js';
import { getContractReadyTokenInfo } from '../services/contractReadyTokenService.js';
import { signContractAsBrand, getClientIp, getDeviceInfo, getSignature } from '../services/contractSigningService.js';

const router = Router();

// GET /api/contract-ready-tokens/:token
// Public endpoint to get token info (for contract ready page)
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid token'
      });
    }

    const tokenInfo = await getContractReadyTokenInfo(token.trim());

    if (!tokenInfo) {
      return res.status(404).json({
        success: false,
        error: 'This link is no longer valid. Please contact the creator.'
      });
    }

    // Get signature status if exists
    const signature = await getSignature(tokenInfo.deal.id, 'brand');

    return res.json({
      success: true,
      deal: tokenInfo.deal,
      creatorName: tokenInfo.creatorName,
      signature: signature ? {
        id: signature.id,
        signed: signature.signed,
        signedAt: signature.signed_at,
        signerName: signature.signer_name,
        signerEmail: signature.signer_email,
      } : null,
    });
  } catch (error: any) {
    console.error('[ContractReadyTokens] GET Error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred. Please try again later.'
    });
  }
});

// GET /api/contract-ready/:token/signature
// Get signature details for a contract
router.get('/:token/signature', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Validate token
    const tokenInfo = await getContractReadyTokenInfo(token.trim());

    if (!tokenInfo) {
      return res.status(404).json({
        success: false,
        error: 'This link is no longer valid. Please contact the creator.'
      });
    }

    // Get signature
    const signature = await getSignature(tokenInfo.deal.id, 'brand');

    if (!signature) {
      return res.status(404).json({
        success: false,
        error: 'No signature found'
      });
    }

    return res.json({
      success: true,
      signature: {
        id: signature.id,
        signerName: signature.signer_name,
        signerEmail: signature.signer_email,
        signerPhone: signature.signer_phone,
        signed: signature.signed,
        signedAt: signature.signed_at,
        otpVerified: signature.otp_verified,
        otpVerifiedAt: signature.otp_verified_at,
        contractVersionId: signature.contract_version_id,
        deviceInfo: signature.device_info,
        // Don't expose IP address for security
      }
    });
  } catch (error: any) {
    console.error('[ContractReadyTokens] Get signature error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred. Please try again later.'
    });
  }
});

// POST /api/contract-ready/:token/sign
// Public endpoint to sign contract with full audit trail
router.post('/:token/sign', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { 
      signerName, 
      signerEmail, 
      signerPhone,
      contractVersionId,
      contractSnapshotHtml,
      otpVerified,
      otpVerifiedAt 
    } = req.body;

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Validate token and get deal
    const tokenInfo = await getContractReadyTokenInfo(token.trim());

    if (!tokenInfo) {
      return res.status(404).json({
        success: false,
        error: 'This link is no longer valid. Please contact the creator.'
      });
    }

    const deal = tokenInfo.deal;

    // Get signer info from request or deal
    const finalSignerName = signerName || deal.brand_name || 'Brand';
    const finalSignerEmail = signerEmail || deal.brand_email;
    const finalSignerPhone = signerPhone || deal.brand_phone;

    if (!finalSignerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Signer email is required'
      });
    }

    // Get client info
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const deviceInfo = getDeviceInfo(userAgent);

    // Sign contract
    const result = await signContractAsBrand({
      dealId: deal.id,
      token: token.trim(),
      signerName: finalSignerName,
      signerEmail: finalSignerEmail,
      signerPhone: finalSignerPhone,
      contractVersionId: contractVersionId || deal.contract_version || 'v3',
      contractSnapshotHtml,
      ipAddress,
      userAgent,
      deviceInfo,
      otpVerified: otpVerified !== false, // Default to true if not specified
      otpVerifiedAt: otpVerifiedAt || new Date().toISOString(),
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to sign contract'
      });
    }

    // Send email notifications (async, don't await)
    try {
      const { sendContractSignedEmails } = await import('./contractSignedEmailService.js');
      sendContractSignedEmails(deal.id, result.signature!).catch((err) => {
        console.error('[ContractReadyTokens] Email sending failed (non-fatal):', err);
      });
    } catch (emailError) {
      console.error('[ContractReadyTokens] Email service import failed (non-fatal):', emailError);
    }

    return res.json({
      success: true,
      message: 'Contract signed successfully',
      signature: {
        id: result.signature?.id,
        signedAt: result.signature?.signed_at,
      }
    });
  } catch (error: any) {
    console.error('[ContractReadyTokens] Sign Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred. Please try again later.'
    });
  }
});

// POST /api/contract-ready/:token/request-edit
// Public endpoint to request edits
router.post('/:token/request-edit', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { message } = req.body;

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid token'
      });
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Validate token
    const tokenInfo = await getContractReadyTokenInfo(token.trim());

    if (!tokenInfo) {
      return res.status(404).json({
        success: false,
        error: 'This link is no longer valid. Please contact the creator.'
      });
    }

    const deal = tokenInfo.deal;

    // Update deal status to BRAND_REQUESTED_CHANGES
    const { error: updateError } = await supabase
      .from('brand_deals')
      .update({
        status: 'BRAND_REQUESTED_CHANGES',
        brand_response_status: 'negotiating',
        brand_feedback: message.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', deal.id);

    if (updateError) {
      console.error('[ContractReadyTokens] Request edit error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to submit edit request'
      });
    }

    // Log activity: Brand requested changes
    try {
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'brand_requested_changes',
          deal_id: deal.id,
          creator_id: deal.creator_id,
          metadata: {
            source: 'contract_ready_page',
            token_id: token,
            message_length: message.trim().length
          },
          created_at: new Date().toISOString()
        });
    } catch (analyticsError) {
      console.error('[ContractReadyTokens] Activity logging failed (non-fatal):', analyticsError);
    }

    // TODO: Send notification to creator

    return res.json({
      success: true,
      message: 'Edit request submitted successfully'
    });
  } catch (error: any) {
    console.error('[ContractReadyTokens] Request edit Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred. Please try again later.'
    });
  }
});

export default router;

