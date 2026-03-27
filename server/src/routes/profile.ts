import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { syncSingleCreatorInstagram } from '../jobs/instagramSync.js';

const router = Router();

// POST /api/profile/instagram-sync
// Sync Instagram public profile data for the authenticated creator
router.post('/instagram-sync', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const creatorId = req.user?.id;
    if (!creatorId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const instagramUsername = typeof req.body?.instagram_username === 'string'
      ? req.body.instagram_username
      : null;

    const result = await syncSingleCreatorInstagram(creatorId, instagramUsername);

    if (!result.success) {
      return res.status(200).json({
        success: false,
        synced: false,
        reason: result.reason,
      });
    }

    return res.json({
      success: true,
      synced: true,
      profile_photo: result.profile_photo,
      followers: result.followers,
    });
  } catch (error: any) {
    console.error('[Profile] instagram-sync error:', error);
    return res.status(500).json({ success: false, error: 'Failed to sync Instagram profile' });
  }
});

export default router;
