import { Router, Request, Response } from 'express';
import { syncInstagramStats } from '../jobs/instagramSync.js';

const router = Router();

// POST /api/cron/instagram-sync
// Protect with CRON_SECRET or DEAL_REMINDERS_CRON_SECRET
router.post('/instagram-sync', async (req: Request, res: Response) => {
  try {
    const secret = process.env.CRON_SECRET || process.env.DEAL_REMINDERS_CRON_SECRET;
    const authHeader = req.headers.authorization;
    const headerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const cronSecret = headerSecret || (req.headers['x-cron-secret'] as string) || null;

    if (secret && cronSecret !== secret) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await syncInstagramStats();
    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[CronInstagramSync] error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Sync failed' });
  }
});

export default router;
