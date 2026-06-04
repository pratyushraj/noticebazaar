import { Router, Request, Response } from 'express';
import { scrapeInstagramReels, saveScrapedReelsToDatabase } from '../services/instagramReelScraper.js';

const router = Router();

// POST /api/cron/instagram-reels-sync
// Protected by CRON_SECRET or DEAL_REMINDERS_CRON_SECRET
router.post('/instagram-reels-sync', async (req: Request, res: Response) => {
  try {
    const secret = process.env.CRON_SECRET || process.env.DEAL_REMINDERS_CRON_SECRET;
    const authHeader = req.headers.authorization;
    const headerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const cronSecret = headerSecret || (req.headers['x-cron-secret'] as string) || null;

    if (secret && cronSecret !== secret) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const tag = (req.body?.tag as string) || 'dentistindia';
    const limit = Number(req.body?.limit) || 12;

    console.log(`[CronInstagramReelsSync] Starting sync for #${tag} (limit: ${limit})...`);
    const reels = await scrapeInstagramReels(tag, limit);
    const saved = await saveScrapedReelsToDatabase(reels);

    return res.json({
      success: true,
      tag,
      scraped_count: reels.length,
      saved_to_db: saved,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[CronInstagramReelsSync] error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Reels sync failed' });
  }
});

export default router;
