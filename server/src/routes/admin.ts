// @ts-nocheck
import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { getPlatformMetrics } from '../services/internalMetricsService.js';

const router = Router();

// Middleware to ensure user is admin
const adminOnly = (req: AuthenticatedRequest, res: Response, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

/**
 * GET /api/admin/metrics
 * Internal platform metrics for performance tracking
 */
router.get('/metrics', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const metrics = await getPlatformMetrics();
    return res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    console.error('[AdminMetrics] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router;
