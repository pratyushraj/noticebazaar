import express, { type Request, type Response } from 'express';
import { runPaymentOverdueReminders } from '../services/paymentOverdueReminderService.js';

const router = express.Router();

function requireCronSecret(req: Request, res: Response, next: () => void) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(500).json({ success: false, error: 'CRON_SECRET not configured' });
  }
  const auth = String(req.get('authorization') || '');
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
  if (token !== secret) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}

// POST /api/reminders/payments/overdue/run
// Intended for external cron (Render/Vercel cron, GitHub Action, etc.)
router.post('/payments/overdue/run', requireCronSecret, async (req: Request, res: Response) => {
  try {
    const dryRun = req.query.dryRun === '1' || req.query.dryRun === 'true';
    const result = await runPaymentOverdueReminders({ dryRun });
    return res.json(result);
  } catch (e: any) {
    console.error('[Reminders] overdue payments run failed:', e);
    return res.status(500).json({ success: false, error: e?.message || 'Failed' });
  }
});

export default router;

