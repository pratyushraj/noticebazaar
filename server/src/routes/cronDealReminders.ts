// Cron-invokable route: send gentle reminders for "Brand hasn't signed yet" and "Deal pending 7 days"
// Protect with CRON_SECRET or similar; call daily (e.g. Vercel cron, GitHub Actions)

import { Router, Request, Response } from 'express';
import { supabase } from '../index.js';
import {
  sendBrandSigningReminderEmail,
  sendDealPendingReminderToBrand,
  sendDealPendingReminderToCreator,
} from '../services/dealReminderEmailService.js';

const router = Router();

const BRAND_SIGNING_REMINDER_DAYS = 3; // Don't send "brand hasn't signed" more than once per 3 days
const DEAL_PENDING_DAYS = 7; // Deal is "pending 7 days" when created_at is 7+ days ago
const DEAL_PENDING_REMINDER_COOLDOWN_DAYS = 7; // Don't send "deal pending" reminder more than once per 7 days

function getFrontendUrl(): string {
  return (process.env.FRONTEND_URL || 'https://creatorarmour.com').replace(/\/$/, '');
}

/** Check if we've sent this reminder type for this deal within the last N days */
async function lastReminderSentWithin(
  dealId: string,
  event: string,
  days: number
): Promise<boolean> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from('deal_action_logs')
    .select('id')
    .eq('deal_id', dealId)
    .eq('event', event)
    .gte('created_at', since.toISOString())
    .limit(1)
    .maybeSingle();
  if (error) return true; // on error, skip sending to avoid duplicates
  return !!data;
}

/** Get one active contract-ready token for a deal (for signing URL) */
async function getContractReadyTokenForDeal(dealId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('contract_ready_tokens')
    .select('id, expires_at')
    .eq('deal_id', dealId)
    .eq('is_active', true)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { id: string; expires_at?: string | null };
  if (row.expires_at && new Date(row.expires_at) < new Date()) return null;
  return row.id;
}

/** Log reminder sent (user_id null for system) */
async function logReminder(dealId: string, event: string): Promise<void> {
  await supabase.from('deal_action_logs').insert({
    deal_id: dealId,
    user_id: null,
    event,
    metadata: { sent_at: new Date().toISOString() },
  });
}

// POST /api/cron/deal-reminders (call with Authorization: Bearer <CRON_SECRET> or x-cron-secret header)
router.post('/deal-reminders', async (req: Request, res: Response) => {
  try {
    const secret = process.env.CRON_SECRET || process.env.DEAL_REMINDERS_CRON_SECRET;
    const authHeader = req.headers.authorization;
    const headerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const cronSecret = headerSecret || (req.headers['x-cron-secret'] as string) || null;
    if (secret && cronSecret !== secret) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const frontendUrl = getFrontendUrl();
    const results = { brandSigning: 0, dealPendingBrand: 0, dealPendingCreator: 0, errors: [] as string[] };

    // 1) Deals where contract is ready but brand hasn't signed — remind brand (at most every 3 days)
    const { data: dealsAwaitingSignature, error: e1 } = await supabase
      .from('brand_deals')
      .select('id, brand_name, brand_email, creator_id')
      .not('contract_file_url', 'is', null)
      .neq('brand_response_status', 'accepted_verified')
      .not('brand_email', 'is', null);

    if (!e1 && dealsAwaitingSignature?.length) {
      for (const deal of dealsAwaitingSignature) {
        if (await lastReminderSentWithin(deal.id, 'BRAND_SIGNING_REMINDER_SENT', BRAND_SIGNING_REMINDER_DAYS))
          continue;
        const tokenId = await getContractReadyTokenForDeal(deal.id);
        if (!tokenId) continue;
        const contractReadyUrl = `${frontendUrl}/contract-ready/${tokenId}`;
        const { data: creatorProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name, business_name')
          .eq('id', deal.creator_id)
          .maybeSingle();
        const creatorName =
          (creatorProfile as any)?.business_name ||
          [creatorProfile?.first_name, creatorProfile?.last_name].filter(Boolean).join(' ') ||
          'Creator';
        const r = await sendBrandSigningReminderEmail(deal.brand_email, {
          creatorName,
          brandName: deal.brand_name || 'there',
          contractReadyUrl,
        });
        if (r.success) {
          await logReminder(deal.id, 'BRAND_SIGNING_REMINDER_SENT');
          results.brandSigning++;
        } else results.errors.push(`brand signing ${deal.id}: ${r.error}`);
      }
    }

    // 2) Deals pending 7+ days (not signed) — remind both brand and creator (at most every 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - DEAL_PENDING_DAYS);
    const { data: dealsPending7d, error: e2 } = await supabase
      .from('brand_deals')
      .select('id, brand_name, brand_email, creator_id')
      .lt('created_at', sevenDaysAgo.toISOString())
      .neq('brand_response_status', 'accepted_verified')
      .not('brand_email', 'is', null);

    if (!e2 && dealsPending7d?.length) {
      for (const deal of dealsPending7d) {
        if (await lastReminderSentWithin(deal.id, 'DEAL_PENDING_7D_REMINDER_SENT', DEAL_PENDING_REMINDER_COOLDOWN_DAYS))
          continue;
        const tokenId = await getContractReadyTokenForDeal(deal.id);
        const contractReadyUrl = tokenId ? `${frontendUrl}/contract-ready/${tokenId}` : undefined;
        const { data: creatorProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name, business_name')
          .eq('id', deal.creator_id)
          .maybeSingle();
        const creatorName =
          (creatorProfile as any)?.business_name ||
          [creatorProfile?.first_name, creatorProfile?.last_name].filter(Boolean).join(' ') ||
          'Creator';
        let sent = false;
        const rBrand = await sendDealPendingReminderToBrand(deal.brand_email, {
          creatorName,
          brandName: deal.brand_name || 'there',
          contractReadyUrl,
        });
        if (rBrand.success) {
          results.dealPendingBrand++;
          sent = true;
        } else results.errors.push(`deal pending brand ${deal.id}: ${rBrand.error}`);
        let creatorEmail: string | null = null;
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(deal.creator_id);
          creatorEmail = authUser?.user?.email || null;
        } catch (_) {}
        if (creatorEmail) {
          const rCreator = await sendDealPendingReminderToCreator(creatorEmail, {
            creatorName,
            brandName: deal.brand_name || 'Brand',
            dashboardUrl: `${frontendUrl}/creator-contracts/${deal.id}`,
          });
          if (rCreator.success) {
            results.dealPendingCreator++;
            sent = true;
          } else results.errors.push(`deal pending creator ${deal.id}: ${rCreator.error}`);
        }
        if (sent) await logReminder(deal.id, 'DEAL_PENDING_7D_REMINDER_SENT');
      }
    }

    return res.json({
      success: true,
      sent: results,
    });
  } catch (err: any) {
    console.error('[CronDealReminders] Error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal error' });
  }
});

export default router;
