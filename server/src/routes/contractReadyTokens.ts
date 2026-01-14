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
      // Token not found or invalid - check if token exists in database first
      const { data: invalidToken, error: tokenLookupError } = await (supabase as any)
        .from('contract_ready_tokens')
        .select('id, deal_id, created_by, created_at, expires_at, is_active, revoked_at')
        .eq('id', token.trim())
        .maybeSingle();

      // If token doesn't exist at all, check if it's a deal details token
      if (tokenLookupError || !invalidToken) {
        console.log('[ContractReadyTokens] Token does not exist in contract_ready_tokens, checking if it is a deal details token:', token.trim());
        
        // Check if this is a deal details token
        const { getDealDetailsTokenInfo } = await import('../services/dealDetailsTokenService.js');
        const dealDetailsTokenInfo = await getDealDetailsTokenInfo(token.trim());
        
        if (dealDetailsTokenInfo) {
          // It's a deal details token - redirect to deal details page
          return res.json({
            success: false,
            redirectTo: `/deal/${token.trim()}`,
            message: 'This is a deal details link. Please use the deal details page to submit information.'
          });
        }
        
        return res.status(404).json({
          success: false,
          error: 'This link is no longer valid. Please contact the creator for a new link.'
        });
      }

      console.log('[ContractReadyTokens] Token exists but getContractReadyTokenInfo returned null:', {
        tokenId: invalidToken.id,
        dealId: invalidToken.deal_id,
        createdBy: invalidToken.created_by,
        isActive: invalidToken.is_active,
        revokedAt: invalidToken.revoked_at,
        expiresAt: invalidToken.expires_at
      });
      
      if (invalidToken?.deal_id) {
        // Find a newer active token for the same deal
        // Make sure it's not expired
        const now = new Date();
        const { data: newerTokens, error: newerTokenError } = await (supabase as any)
          .from('contract_ready_tokens')
          .select('id, is_active, revoked_at, expires_at, created_at')
          .eq('deal_id', invalidToken.deal_id)
          .eq('is_active', true)
          .is('revoked_at', null)
          .order('created_at', { ascending: false })
          .limit(5); // Get multiple to find a valid one
        
        if (!newerTokenError && newerTokens && newerTokens.length > 0) {
          // Find the first valid token (not expired)
          const validToken = newerTokens.find((t: any) => {
            const isNotExpired = !t.expires_at || new Date(t.expires_at) > now;
            return t.is_active && !t.revoked_at && isNotExpired;
          });
          
          if (validToken?.id) {
            console.log('[ContractReadyTokens] Found valid newer token, redirecting:', validToken.id);
            return res.json({
              success: true,
              redirectToToken: validToken.id,
              message: 'This link has been replaced with a newer one. Please use the updated link.'
            });
          } else {
            console.warn('[ContractReadyTokens] No valid newer tokens found for deal:', invalidToken.deal_id);
          }
        }
      }
      
      return res.status(404).json({
        success: false,
        error: 'This link is no longer valid. Please contact the creator for a new link.'
      });
    }

    // Get signature status if exists
    const signature = await getSignature(tokenInfo.deal.id, 'brand');

    // Ensure creator fields are always returned (even if null/undefined)
    const response = {
      success: true,
      deal: tokenInfo.deal,
      creatorName: tokenInfo.creatorName ?? null,
      creatorEmail: tokenInfo.creatorEmail ?? null,
      creatorAddress: tokenInfo.creatorAddress ?? null,
      signature: signature ? {
        id: signature.id,
        signed: signature.signed,
        signedAt: signature.signed_at,
        signerName: signature.signer_name,
        signerEmail: signature.signer_email,
      } : null,
    };

    console.log('[ContractReadyTokens] Returning response with creator info:', {
      creatorName: response.creatorName,
      creatorEmail: response.creatorEmail,
      creatorAddress: response.creatorAddress,
      dealCreatorId: tokenInfo.deal.creator_id
    });

    return res.json(response);
  } catch (error: any) {
    console.error('[ContractReadyTokens] GET Error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred. Please try again later.'
    });
  }
});

// GET /api/contract-ready-tokens/:token/creator-info
// Get creator info for a contract-ready token (fallback endpoint)
router.get('/:token/creator-info', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Validate token exists
    const tokenInfo = await getContractReadyTokenInfo(token.trim());

    if (!tokenInfo || !tokenInfo.deal?.creator_id) {
      return res.status(404).json({
        success: false,
        error: 'Token not found or invalid'
      });
    }

    // Return creator info
    return res.json({
      success: true,
      creatorName: tokenInfo.creatorName ?? null,
      creatorEmail: tokenInfo.creatorEmail ?? null,
      creatorAddress: tokenInfo.creatorAddress ?? null,
    });
  } catch (error: any) {
    console.error('[ContractReadyTokens] Creator Info Error:', error);
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

    // Validate token and get deal - try contract-ready-tokens first, then brand-reply-tokens
    let tokenInfo = await getContractReadyTokenInfo(token.trim());
    
    // If not found in contract-ready-tokens, try brand-reply-tokens
    if (!tokenInfo) {
      // Try to get token info from brand-reply-tokens
      const { data: replyTokenData, error: replyTokenError } = await supabase
        .from('brand_reply_tokens')
        .select('id, deal_id, is_active, expires_at, revoked_at')
        .eq('id', token.trim())
        .maybeSingle();
      
      if (!replyTokenError && replyTokenData && replyTokenData.is_active && !replyTokenData.revoked_at) {
        // Check if token is expired
        if (replyTokenData.expires_at) {
          const now = new Date();
          const expiresAt = new Date(replyTokenData.expires_at);
          if (now > expiresAt) {
            return res.status(403).json({
              success: false,
              error: 'This link is no longer valid. Please contact the creator.'
            });
          }
        }
        
        // Get deal info
        const { data: deal, error: dealError } = await supabase
          .from('brand_deals')
          .select('*')
          .eq('id', replyTokenData.deal_id)
          .maybeSingle();
        
        if (dealError || !deal) {
          return res.status(404).json({
            success: false,
            error: 'This link is no longer valid. Please contact the creator.'
          });
        }
        
        // Fetch creator profile with address
        let creatorName = 'Creator';
        let creatorEmail: string | null = null;
        let creatorAddress: string | null = null;
        
        try {
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, location, address')
            .eq('id', deal.creator_id)
            .maybeSingle();
          
          if (creatorProfile) {
            // Construct creator name
            if (creatorProfile.first_name && creatorProfile.last_name) {
              creatorName = `${creatorProfile.first_name} ${creatorProfile.last_name}`.trim();
            } else if (creatorProfile.first_name) {
              creatorName = creatorProfile.first_name;
            } else if (creatorProfile.last_name) {
              creatorName = creatorProfile.last_name;
            }
            
            // Get address (prefer location field, fallback to address field)
            const creatorAny = creatorProfile as any;
            creatorAddress = creatorAny.location || creatorAny.address || null;
          }
          
          // Get email from auth.users
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(deal.creator_id);
            creatorEmail = authUser?.user?.email || null;
            
            // Fallback to email username if name is still "Creator"
            if (creatorName === 'Creator' && creatorEmail) {
              const emailUsername = creatorEmail.split('@')[0];
              if (emailUsername && emailUsername.length >= 2) {
                creatorName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
              }
            }
          } catch (authError) {
            console.warn('[ContractReadyTokens] Could not fetch creator email from auth:', authError);
          }
        } catch (profileError) {
          console.warn('[ContractReadyTokens] Could not fetch creator profile:', profileError);
        }
        
        // Create tokenInfo-like object for brand-reply-tokens
        // We need to match the ContractReadyToken interface structure
        tokenInfo = {
          token: {
            id: replyTokenData.id,
            deal_id: replyTokenData.deal_id,
            is_active: replyTokenData.is_active,
            expires_at: replyTokenData.expires_at,
            revoked_at: replyTokenData.revoked_at,
            created_at: (replyTokenData as any).created_at || new Date().toISOString(),
            created_by: deal.creator_id,
          } as any,
          deal: deal,
          creatorName: creatorName,
          creatorEmail: creatorEmail,
          creatorAddress: creatorAddress,
        };
      }
    }
    
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

    // Sign contract - pass tokenInfo to avoid re-validation
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
    }, tokenInfo); // Pass the already-validated tokenInfo

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

