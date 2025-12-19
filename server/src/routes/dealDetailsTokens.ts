// API route for creating and managing deal details tokens
// Authenticated endpoint - only creators can create tokens

import { Router, Request, Response } from 'express';
import { supabase } from '../index.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { 
  createDealDetailsToken, 
  getDealDetailsTokenInfo,
  submitDealDetails,
  getDealSubmissionDetails
} from '../services/dealDetailsTokenService.js';

const router = Router();

// POST /api/deal-details-tokens
// Create a new secure token for collecting deal details (requires auth)
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { expiresAt } = req.body;

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

    const token = await createDealDetailsToken({
      creatorId: userId,
      expiresAt: expiresDate,
    });

    return res.json({
      success: true,
      token: {
        id: token.id,
        creator_id: token.creator_id,
        created_at: token.created_at,
        expires_at: token.expires_at,
      }
    });
  } catch (error: any) {
    console.error('[DealDetailsTokens] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// GET /api/deal-details-tokens/:token
// Public endpoint to get token info (for form page)
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid token'
      });
    }

    const tokenInfo = await getDealDetailsTokenInfo(token.trim());

    if (!tokenInfo) {
      return res.status(404).json({
        success: false,
        error: 'This link is no longer valid. Please contact the creator.'
      });
    }

    return res.json({
      success: true,
      creatorName: tokenInfo.creatorName,
      isUsed: !!tokenInfo.token.used_at, // Indicates if form is locked (read-only)
    });
  } catch (error: any) {
    console.error('[DealDetailsTokens] GET Error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred. Please try again later.'
    });
  }
});

// POST /api/deal-details-tokens/:token/submit
// Public endpoint to submit deal details form
router.post('/:token/submit', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const formData = req.body;

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid token'
      });
    }

    if (!formData || typeof formData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid form data'
      });
    }

    const result = await submitDealDetails(token.trim(), formData);

    return res.json({
      success: true,
      submissionId: result.submissionId,
      dealId: result.dealId,
    });
  } catch (error: any) {
    console.error('[DealDetailsTokens] Submit Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred. Please try again later.'
    });
  }
});

// GET /api/deal-details-tokens/deal/:dealId
// Get submitted details for a deal (authenticated - creator only)
router.get('/deal/:dealId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { dealId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    if (!dealId) {
      return res.status(400).json({
        success: false,
        error: 'Deal ID is required'
      });
    }

    const details = await getDealSubmissionDetails(dealId);

    if (!details) {
      return res.status(404).json({
        success: false,
        error: 'No submission found for this deal'
      });
    }

    // Verify creator owns this deal
    const { data: deal } = await supabase
      .from('brand_deals')
      .select('creator_id')
      .eq('id', dealId)
      .single();

    if (!deal || deal.creator_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    return res.json({
      success: true,
      submission: details.submission,
      formData: details.formData,
    });
  } catch (error: any) {
    console.error('[DealDetailsTokens] Get deal details error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred. Please try again later.'
    });
  }
});

export default router;

