import { Router, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseConfig } from '../lib/supabase.js';

const router = Router();

const createAdminClient = () => {
  if (!supabaseConfig.url || !supabaseConfig.serviceKey) {
    throw new Error('Supabase admin client is not configured');
  }

  return createClient(supabaseConfig.url, supabaseConfig.serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const cleanupSpecs: Array<{ table: string; columns: string[] }> = [
  { table: 'message_attachments', columns: [] }, // deleted indirectly with messages if FK cascade exists
  { table: 'message_audit_logs', columns: [] },
  { table: 'deal_action_logs', columns: ['user_id'] },
  { table: 'presence', columns: ['user_id'] },
  { table: 'notification_preferences', columns: ['user_id'] },
  { table: 'notifications', columns: ['user_id'] },
  { table: 'partner_earnings', columns: ['user_id'] },
  { table: 'partner_milestones', columns: ['user_id'] },
  { table: 'partner_rewards', columns: ['user_id'] },
  { table: 'partner_stats', columns: ['user_id'] },
  { table: 'referral_events', columns: ['user_id'] },
  { table: 'referral_links', columns: ['user_id'] },
  { table: 'referrals', columns: ['referred_user_id', 'referrer_id'] },
  { table: 'conversation_participants', columns: ['user_id'] },
  { table: 'messages', columns: ['sender_id', 'receiver_id'] },
  { table: 'brand_bookmarks', columns: ['brand_id', 'creator_id'] },
  { table: 'brand_interactions', columns: ['brand_id', 'creator_id'] },
  { table: 'brand_reviews', columns: ['brand_id', 'creator_id'] },
  { table: 'deal_details_submissions', columns: ['creator_id'] },
  { table: 'brand_reply_tokens', columns: ['created_by'] },
  { table: 'lawyer_requests', columns: ['creator_id'] },
  { table: 'consumer_complaints', columns: ['creator_id'] },
  { table: 'social_accounts', columns: ['creator_id'] },
  { table: 'brand_deals', columns: ['creator_id', 'brand_id'] },
  { table: 'payments', columns: ['creator_id', 'brand_id', 'user_id'] },
  { table: 'consultations', columns: ['client_id'] },
  { table: 'cases', columns: ['client_id'] },
  { table: 'documents', columns: ['client_id'] },
  { table: 'subscriptions', columns: ['client_id'] },
  { table: 'organizations', columns: ['owner_id'] },
  { table: 'creators', columns: ['id'] },
  { table: 'brands', columns: ['id'] },
  { table: 'influencers', columns: ['id'] },
  { table: 'profiles', columns: ['id'] },
];

async function deleteRowsForUser(userId: string) {
  const cleanupErrors: string[] = [];

  for (const spec of cleanupSpecs) {
    for (const column of spec.columns) {
      const { error } = await supabase.from(spec.table).delete().eq(column, userId);
      if (!error) continue;

      const message = String(error.message || '');
      const code = String((error as any).code || '');

      // Ignore missing tables/columns and "no rows" style cases. This route should be resilient across schema drift.
      if (
        code === 'PGRST204' ||
        code === 'PGRST205' ||
        message.includes('Could not find the table') ||
        message.includes(`Could not find the '${column}' column`)
      ) {
        continue;
      }

      cleanupErrors.push(`${spec.table}.${column}: ${message}`);
    }
  }

  return cleanupErrors;
}

/**
 * DELETE /api/account
 * Deletes the authenticated user's account.
 * Requires Authorization: Bearer <token>
 */
router.delete('/', async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: No user ID found' });
    }

    const cleanupErrors = await deleteRowsForUser(userId);

    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) {
      console.error('[AccountDeletion] Failed to delete user:', error);
      return res.status(500).json({
        error: 'Failed to delete account',
        details: error.message,
        cleanupErrors,
      });
    }

    if (cleanupErrors.length > 0) {
      console.warn(`[AccountDeletion] User ${userId} deleted with cleanup warnings`, cleanupErrors);
    } else {
      console.log(`[AccountDeletion] User ${userId} account deleted successfully`);
    }

    return res.json({
      success: true,
      message: 'Account deleted successfully',
      cleanupWarnings: cleanupErrors,
    });
  } catch (err: any) {
    console.error('[AccountDeletion] Unexpected error:', err);
    return res.status(500).json({ error: 'Failed to delete account', details: err.message });
  }
});

export default router;
