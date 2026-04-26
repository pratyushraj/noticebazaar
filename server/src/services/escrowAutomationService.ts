// @ts-nocheck
import { supabase } from '../lib/supabase.js';
import { sendCreatorContentReviewedEmail } from './escrowEmailService.js';

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
      .select('id, creator_id, brand_id, deal_amount, creator:creator_id(email, display_name)')
      .eq('status', 'CONTENT_DELIVERED')
      .lt('updated_at', seventyTwoHoursAgo.toISOString());

    if (error) throw error;
    if (!staleDeals || staleDeals.length === 0) {
      console.log('[EscrowAutomation] No stale deals found.');
      return { processed: 0 };
    }

    console.log(\`[EscrowAutomation] Found \${staleDeals.length} stale deals. Processing...\`);

    const results = [];

    for (const deal of staleDeals) {
      // 2. Update status to CONTENT_APPROVED
      const { error: updateError } = await supabase
        .from('brand_deals')
        .update({ 
          status: 'CONTENT_APPROVED',
          updated_at: new Date().toISOString()
        })
        .eq('id', deal.id);

      if (updateError) {
        console.error(\`[EscrowAutomation] Failed to approve deal \${deal.id}:\`, updateError);
        continue;
      }

      // 3. Log the system action
      await supabase.from('deal_action_logs').insert({
        deal_id: deal.id,
        event: 'SYSTEM_AUTO_APPROVED',
        metadata: { reason: '72h_no_brand_action' },
        created_at: new Date().toISOString()
      });

      // 4. Notify Creator
      if (deal.creator && deal.creator.email) {
        await sendCreatorContentReviewedEmail(
          deal.creator.email,
          deal.creator.display_name || 'Creator',
          'approved',
          'Automatically approved by system after 72 hours of no brand action.'
        );
      }

      results.push(deal.id);
    }

    console.log(\`[EscrowAutomation] Successfully auto-approved \${results.length} deals.\`);
    return { processed: results.length, dealIds: results };

  } catch (err) {
    console.error('[EscrowAutomation] Job failed:', err);
    return { error: err.message };
  }
}
