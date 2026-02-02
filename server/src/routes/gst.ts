// API route for GSTIN lookup
// Public endpoint - no auth required (used by brand form)

import { Router, Request, Response } from 'express';
import { lookupGSTCompany } from '../services/gstService.js';

const router = Router();

/**
 * GET /api/gst/lookup?gstin=XXXXXXXXXXXXXXX
 * Lookup company details by GSTIN
 * Returns cached data if available, otherwise fetches from external API
 */
router.get('/lookup', async (req: Request, res: Response) => {
  try {
    const { gstin } = req.query;

    if (!gstin || typeof gstin !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'GSTIN is required',
      });
    }

    // Lookup GST company data
    const companyData = await lookupGSTCompany(gstin);

    return res.json({
      success: true,
      data: companyData,
    });
  } catch (error) {
    console.error('[GSTRoute] Lookup error:', error);

    if (error instanceof Error) {
      // Invalid GSTIN format
      if (error.message.includes('Invalid GSTIN format')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      // GSTIN not found
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'GSTIN not found',
        });
      }

      // API key missing or external service failure
      if (error.message.includes('not configured') || error.message.includes('authentication failed')) {
        return res.status(503).json({
          success: false,
          error: 'GST lookup is temporarily unavailable. Please enter company name and address manually.',
        });
      }
    }

    // Generic failure (external API down, timeout, etc.) - return 503 so client can show "temporarily unavailable"
    return res.status(503).json({
      success: false,
      error: 'GST lookup is temporarily unavailable. Please enter company name and address manually.',
    });
  }
});

export default router;

