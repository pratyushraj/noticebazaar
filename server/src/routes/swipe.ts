import express from 'express';
import { SwipeService } from '../services/swipeService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// POST /api/swipe/creator - Creator swipes on a brand
router.post('/creator', authMiddleware, async (req: any, res) => {
  try {
    const creatorId = req.user.id;
    const { brandId, direction } = req.body;

    if (!brandId || !direction) {
      return res.status(400).json({ success: false, error: 'brandId and direction required' });
    }

    if (!['left', 'right'].includes(direction)) {
      return res.status(400).json({ success: false, error: 'Invalid direction' });
    }

    const result = await SwipeService.recordCreatorSwipe(creatorId, brandId, direction);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/swipe/brand - Brand swipes on a creator
router.post('/brand', authMiddleware, async (req: any, res) => {
  try {
    const brandId = req.user.id;
    const { creatorId, direction } = req.body;

    if (!creatorId || !direction) {
      return res.status(400).json({ success: false, error: 'creatorId and direction required' });
    }

    if (!['left', 'right'].includes(direction)) {
      return res.status(400).json({ success: false, error: 'Invalid direction' });
    }

    const result = await SwipeService.recordBrandSwipe(brandId, creatorId, direction);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/swipe/matches - Get matches for current user
router.get('/matches', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.user_metadata?.role || 'creator'; // Default to creator if not specified

    const matches = await SwipeService.getMatches(userId, role);
    return res.json({ success: true, matches });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
