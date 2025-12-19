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

      // API authentication failure
      if (error.message.includes('authentication failed')) {
        return res.status(502).json({
          success: false,
          error: 'GST lookup service temporarily unavailable',
        });
      }
    }

    // Generic API failure
    return res.status(502).json({
      success: false,
      error: 'Failed to lookup GST data. Please try again or enter details manually.',
    });
  }
});

export default router;

