import { supabase } from '../lib/supabase.js';
import { sendCreatorContentReviewedEmail } from './creatorNotificationService.js';
import { calculatePayoutReleaseAt } from '../lib/payment.js';

/**
 * Automatically approve deals that have been in CONTENT_DELIVERED for more than 72 hours
 * without brand action.
 */
export async function runAutoApprovalJob() {
  console.log('[EscrowAutomation] Starting auto-approval job...');
  
  const seventyTwoHoursAgo = new Date();
  seventyTwoHoursAgo.setHours(seventyTwoHoursAgo.getHours() - 72);
  
  try {
    // 1. Find deals in CONTENT_DELIVERED that haven't been updated in 72 hours
    const { data: staleDeals, error } = await supabase
      .from('brand_deals')
      .select(`
        id, 
        creator_id, 
        brand_id, 
        brand_name,
        deal_amount, 
        profiles:creator_id (
          email, 
          first_name,
          last_name,
          username
        )
      `)
      .eq('status', 'CONTENT_DELIVERED')
      .lt('updated_at', seventyTwoHoursAgo.toISOString());

    if (error) throw error;
    if (!staleDeals || staleDeals.length === 0) {
      console.log('[EscrowAutomation] No stale deals found.');
      return { processed: 0 };
    }

    console.log(`[EscrowAutomation] Found ${staleDeals.length} stale deals. Processing...`);

    const results = [];
    const now = new Date();
    const nowIso = now.toISOString();

    for (const deal of staleDeals) {
      // 2. Update status to CONTENT_APPROVED and set necessary timestamps
      const { error: updateError } = await supabase
        .from('brand_deals')
        .update({ 
          status: 'CONTENT_APPROVED',
          brand_approved_at: nowIso,
          content_approved_at: nowIso,
          payout_release_at: calculatePayoutReleaseAt(now),
          brand_approval_status: 'approved',
          milestone_status: 'approved',
          progress_percentage: 95,
          updated_at: nowIso
        })
        .eq('id', deal.id);

      if (updateError) {
        console.error(`[EscrowAutomation] Failed to approve deal ${deal.id}:`, updateError);
        continue;
      }

      // 3. Log the system action
      await supabase.from('deal_action_logs').insert({
        deal_id: deal.id,
        event: 'SYSTEM_AUTO_APPROVED',
        metadata: { reason: '72h_no_brand_action' },
        created_at: nowIso
      });

      // 4. Notify Creator
      const profile = Array.isArray(deal.profiles) ? deal.profiles[0] : deal.profiles;
      if (profile && profile.email) {
        const creatorName = profile.first_name || profile.username || 'Creator';
        
        // Match the signature used in deals.ts: (creatorObj, { brandName, isApproved, feedback, dealId })
        await sendCreatorContentReviewedEmail(
          { email: profile.email, first_name: profile.first_name, username: profile.username },
          { 
            brandName: deal.brand_name || 'Brand', 
            isApproved: true, 
            feedback: 'Automatically approved by system after 72 hours of no brand action.',
            dealId: deal.id
          }
        );
      }

      results.push(deal.id);
    }

    console.log(`[EscrowAutomation] Successfully auto-approved ${results.length} deals.`);
    return { processed: results.length, dealIds: results };

  } catch (err: any) {
    console.error('[EscrowAutomation] Job failed:', err);
    return { error: err.message };
  }
}
