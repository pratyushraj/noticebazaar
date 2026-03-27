/**
 * Backend Audit Logging Infrastructure
 * 
 * Production-grade audit logging for security and compliance
 */

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';

type AuditSeverity = 'info' | 'warning' | 'error' | 'security';
type ResourceType = 
  | 'brand_deal' 
  | 'contract_issue' 
  | 'payment' 
  | 'message' 
  | 'expense' 
  | 'lawyer_request'
  | 'user'
  | 'profile';

interface AuditEvent {
  actionType: string;
  resourceType: ResourceType;
  resourceId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  severity?: AuditSeverity;
  isSecurityEvent?: boolean;
}

/**
 * Log an audit event
 * 
 * @param event - Audit event details
 * @returns Log ID if successful, null otherwise
 */
export async function logAuditEvent(event: AuditEvent): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('log_audit_event', {
      action_type_param: event.actionType,
      resource_type_param: event.resourceType,
      resource_id_param: event.resourceId || null,
      description_param: event.description || null,
      metadata_param: event.metadata || {},
      severity_param: event.severity || 'info',
      is_security_event_param: event.isSecurityEvent || false,
    });

    if (error) {
      console.error('Audit logging failed:', error);
      return null;
    }

    return data as string;
  } catch (err) {
    console.error('Audit logging exception:', err);
    return null;
  }
}

/**
 * Log a security event (convenience wrapper)
 */
export async function logSecurityEvent(
  actionType: string,
  resourceType: ResourceType,
  description: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logAuditEvent({
    actionType,
    resourceType,
    description,
    metadata,
    severity: 'security',
    isSecurityEvent: true,
  });
}

/**
 * Log an error event
 */
export async function logErrorEvent(
  actionType: string,
  resourceType: ResourceType,
  description: string,
  error: Error,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logAuditEvent({
    actionType,
    resourceType,
    description,
    metadata: {
      ...metadata,
      errorMessage: error.message,
      errorStack: error.stack,
    },
    severity: 'error',
  });
}

/**
 * Log a payment event
 */
export async function logPaymentEvent(
  dealId: string,
  action: 'received' | 'marked_pending' | 'undone',
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logAuditEvent({
    actionType: `payment_${action}`,
    resourceType: 'payment',
    resourceId: dealId,
    description: `Payment ${action} for deal ${dealId}`,
    metadata,
    severity: 'info',
  });
}

/**
 * Log a contract issue event
 */
export async function logContractIssueEvent(
  issueId: string,
  dealId: string,
  action: 'created' | 'updated' | 'resolved' | 'deleted',
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logAuditEvent({
    actionType: `contract_issue_${action}`,
    resourceType: 'contract_issue',
    resourceId: issueId,
    description: `Contract issue ${action}`,
    metadata: {
      ...metadata,
      dealId,
    },
    severity: action === 'deleted' ? 'warning' : 'info',
  });
}

