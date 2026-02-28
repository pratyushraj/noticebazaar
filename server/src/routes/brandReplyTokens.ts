// @ts-nocheck
// API route for creating and managing brand reply tokens
// Authenticated endpoint - only creators can create tokens for their deals

import { Router, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { createBrandReplyToken, revokeBrandReplyToken, getAuditSummary } from '../services/brandReplyTokenService.js';

const router = Router();

// POST /api/brand-reply-tokens
// Create a new secure token for a deal
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { dealId, expiresAt } = req.body;

    if (!dealId) {
      return res.status(400).json({
        success: false,
        error: 'dealId is required'
      });
    }

    // Parse expiresAt if provided (ISO string or null)
    let expiresDate: Date | null = null;
    if (expiresAt) {
      expiresDate = new Date(expiresAt);
      if (isNaN(expiresDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid expiresAt format. Use ISO 8601 date string or null.'
        });
      }
    }

    const token = await createBrandReplyToken({
      dealId,
      creatorId: userId,
      expiresAt: expiresDate,
    });

    return res.json({
      success: true,
      token: {
        id: token.id,
        deal_id: token.deal_id,
        created_at: token.created_at,
        expires_at: token.expires_at,
      }
    });
  } catch (error: any) {
    console.error('[BrandReplyTokens] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// DELETE /api/brand-reply-tokens/:tokenId
// Revoke a token
router.delete('/:tokenId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { tokenId } = req.params;

    if (!tokenId) {
      return res.status(400).json({
        success: false,
        error: 'tokenId is required'
      });
    }

    await revokeBrandReplyToken(tokenId, userId);

    return res.json({
      success: true,
      message: 'Token revoked successfully'
    });
  } catch (error: any) {
    console.error('[BrandReplyTokens] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/brand-reply-tokens/audit/:dealId
// Get audit summary for a deal (read-only)
router.get('/audit/:dealId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { dealId } = req.params;

    if (!dealId) {
      return res.status(400).json({
        success: false,
        error: 'dealId is required'
      });
    }

    const summary = await getAuditSummary(dealId, userId);

    return res.json({
      success: true,
      audit: summary
    });
  } catch (error: any) {
    console.error('[BrandReplyTokens] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router;


