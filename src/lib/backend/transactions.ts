/**
 * Transaction-Safe Backend Operations
 * 
 * Wrappers for Supabase RPC functions that ensure transaction safety
 */

import { supabase } from '@/integrations/supabase/client';
import { logAuditEvent, logErrorEvent } from './audit';

/**
 * Update payment received status (transaction-safe)
 * 
 * This function:
 * - Verifies deal ownership
 * - Updates payment status atomically
 * - Logs action to deal_action_logs
 * - Returns success/error status
 */
export async function updatePaymentReceived(
  dealId: string,
  paymentReceivedDate: string,
  utrNumber?: string
): Promise<{ success: boolean; error?: string; dealId?: string }> {
  try {
    // Safeguard: Verify deal is signed before allowing payment update
    const { data: deal, error: dealError } = await supabase
      .from('brand_deals')
      .select('status')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      return { success: false, error: 'Deal not found' };
    }

    const signedStatuses = ['signed', 'SIGNED_BY_BRAND', 'content_making', 'Content Making', 'content_delivered', 'Content Delivered', 'completed', 'COMPLETED'];
    const dealStatus = deal.status?.toLowerCase() || '';
    const isSigned = signedStatuses.some(s => s.toLowerCase() === dealStatus);

    if (!isSigned) {
      return { success: false, error: 'Payments can only be recorded for signed deals' };
    }

    const { data, error } = await supabase.rpc('update_payment_received', {
      deal_id_param: dealId,
      payment_received_date_param: paymentReceivedDate,
      utr_number_param: utrNumber || null,
    });

    if (error) {
      await logErrorEvent(
        'update_payment_received',
        'payment',
        `Failed to update payment for deal ${dealId}`,
        new Error(error.message),
        { dealId, paymentReceivedDate, utrNumber }
      );
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string; deal_id?: string };

    if (result.success) {
      await logAuditEvent({
        actionType: 'payment_received',
        resourceType: 'payment',
        resourceId: dealId,
        description: `Payment marked as received for deal ${dealId}`,
        metadata: { paymentReceivedDate, utrNumber },
      });
    }

    return {
      success: result.success,
      error: result.error,
      dealId: result.deal_id,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    await logErrorEvent(
      'update_payment_received',
      'payment',
      `Exception updating payment for deal ${dealId}`,
      error,
      { dealId, paymentReceivedDate, utrNumber }
    );
    return { success: false, error: error.message };
  }
}

/**
 * Create contract issue (transaction-safe)
 * 
 * This function:
 * - Verifies deal ownership
 * - Creates issue atomically
 * - Logs action to deal_action_logs
 * - Returns issue ID on success
 */
export async function createContractIssue(
  dealId: string,
  issueType: string,
  severity: 'high' | 'medium' | 'low',
  title: string,
  description?: string,
  impact?: unknown[],
  recommendation?: string
): Promise<{ success: boolean; error?: string; issueId?: string }> {
  try {
    const { data, error } = await supabase.rpc('create_contract_issue', {
      deal_id_param: dealId,
      issue_type_param: issueType,
      severity_param: severity,
      title_param: title,
      description_param: description || null,
      impact_param: impact || [],
      recommendation_param: recommendation || null,
    });

    if (error) {
      await logErrorEvent(
        'create_contract_issue',
        'contract_issue',
        `Failed to create contract issue for deal ${dealId}`,
        new Error(error.message),
        { dealId, issueType, severity, title }
      );
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string; issue_id?: string };

    if (result.success && result.issue_id) {
      await logAuditEvent({
        actionType: 'contract_issue_created',
        resourceType: 'contract_issue',
        resourceId: result.issue_id,
        description: `Contract issue created: ${title}`,
        metadata: { dealId, issueType, severity },
      });
    }

    return {
      success: result.success,
      error: result.error,
      issueId: result.issue_id,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    await logErrorEvent(
      'create_contract_issue',
      'contract_issue',
      `Exception creating contract issue for deal ${dealId}`,
      error,
      { dealId, issueType, severity, title }
    );
    return { success: false, error: error.message };
  }
}

