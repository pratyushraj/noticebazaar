// @ts-nocheck
/**
 * Deal Lifecycle Service
 * 
 * Manages deal state transitions, event logging, and side effects.
 * This is the core state machine for the deals domain.
 */

import { createClient } from '@supabase/supabase-js';
import {
  DealState,
  DealEventType,
  TransitionResult,
  DEAL_TRANSITIONS,
  isValidTransition,
  getTransitionEvent,
  isTerminalState,
} from './types/index.js';
import { getCreatorNotificationContent, type CreatorNotificationTemplate } from './creatorNotificationCopy.js';

// ============================================================
// TYPES
// ============================================================

interface TransitionOptions {
  dealId: string;
  targetState: DealState;
  actorId?: string;
  actorRole?: 'creator' | 'brand' | 'system' | 'admin';
  metadata?: Record<string, any>;
  skipNotifications?: boolean;
  reason?: string; // For admin overrides
}

export interface DealRecord {
  id: string;
  status: string;
  creator_id: string;
  brand_email: string;
  brand_name: string;
  deal_type: string;
  deal_amount: number;
  current_state?: string;
}

// ============================================================
// STATE MACHINE ERRORS
// ============================================================

export class InvalidTransitionError extends Error {
  constructor(
    public currentState: DealState,
    public targetState: DealState,
    message?: string
  ) {
    super(message || `Invalid transition from ${currentState} to ${targetState}`);
    this.name = 'InvalidTransitionError';
  }
}

export class TerminalStateError extends Error {
  constructor(public state: DealState) {
    super(`Cannot transition from terminal state ${state}`);
    this.name = 'TerminalStateError';
  }
}

export class DealNotFoundError extends Error {
  constructor(public dealId: string) {
    super(`Deal not found: ${dealId}`);
    this.name = 'DealNotFoundError';
  }
}

export class UnauthorizedTransitionError extends Error {
  constructor(
    public requiredRoles: string[],
    public actualRole: string
  ) {
    super(`Unauthorized: requires roles [${requiredRoles.join(', ')}], got ${actualRole}`);
    this.name = 'UnauthorizedTransitionError';
  }
}

// ============================================================
// LIFECYCLE SERVICE
// ============================================================

export class DealLifecycleService {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseClient: ReturnType<typeof createClient>) {
    this.supabase = supabaseClient;
  }

  /**
   * Get the current state of a deal
   */
  async getDealState(dealId: string): Promise<DealState | null> {
    const { data, error } = await this.supabase
      .from('brand_deals')
      .select('status, current_state')
      .eq('id', dealId)
      .single();

    if (error || !data) {
      return null;
    }

    // Prefer current_state if available, fall back to status
    const stateValue = data.current_state || data.status;
    
    // Validate it's a known state
    if (Object.values(DealState).includes(stateValue as DealState)) {
      return stateValue as DealState;
    }

    // Map legacy status strings to new states
    return this.mapLegacyStatus(stateValue);
  }

  /**
   * Get deal by ID with full details
   */
  async getDeal(dealId: string): Promise<DealRecord | null> {
    const { data, error } = await this.supabase
      .from('brand_deals')
      .select('id, status, creator_id, brand_email, brand_name, deal_type, deal_amount, current_state')
      .eq('id', dealId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as DealRecord;
  }

  /**
   * Transition a deal to a new state
   */
  async transition(options: TransitionOptions): Promise<TransitionResult> {
    const {
      dealId,
      targetState,
      actorId,
      actorRole = 'system',
      metadata = {},
      skipNotifications = false,
      reason,
    } = options;

    // Get current deal
    const deal = await this.getDeal(dealId);
    if (!deal) {
      throw new DealNotFoundError(dealId);
    }

    // Determine current state
    const currentState = await this.getDealState(dealId);
    if (!currentState) {
      throw new Error(`Could not determine current state for deal ${dealId}`);
    }

    // Check if current state is terminal
    if (isTerminalState(currentState) && targetState !== DealState.CANCELLED) {
      throw new TerminalStateError(currentState);
    }

    // Validate transition
    if (!isValidTransition(currentState, targetState)) {
      // Allow admin override
      if (actorRole === 'admin') {
        console.log(`[DealLifecycle] Admin override: ${currentState} -> ${targetState}`);
      } else {
        throw new InvalidTransitionError(currentState, targetState);
      }
    }

    // Get the event type for this transition
    const eventType = getTransitionEvent(currentState, targetState) || DealEventType.STATUS_OVERRIDE;

    // Check role requirements
    const transition = DEAL_TRANSITIONS.find(
      (t) =>
        (Array.isArray(t.from) ? t.from.includes(currentState) : t.from === currentState) &&
        t.to === targetState
    );

    if (transition?.requires?.role && actorRole !== 'admin') {
      if (!transition.requires.role.includes(actorRole as any)) {
        throw new UnauthorizedTransitionError(transition.requires.role, actorRole);
      }
    }

    // Start a transaction-like flow
    try {
      // 1. Create the event record
      const eventId = await this.createEvent({
        dealId,
        eventType,
        actorId,
        actorRole,
        previousState: currentState,
        newState: targetState,
        metadata: {
          ...metadata,
          reason,
          adminOverride: actorRole === 'admin',
        },
      });

      // 2. Update the deal status
      await this.updateDealStatus(dealId, targetState);

      // 3. Trigger side effects (notifications, etc.)
      if (!skipNotifications) {
        await this.triggerSideEffects(deal, currentState, targetState, eventType, metadata);
      }

      // 4. Log the transition
      console.log(`[DealLifecycle] Deal ${dealId}: ${currentState} -> ${targetState} (${eventType})`);

      return {
        success: true,
        previousState: currentState,
        newState: targetState,
        event: eventType,
        eventId,
      };
    } catch (error) {
      console.error(`[DealLifecycle] Transition failed:`, error);
      throw error;
    }
  }

  /**
   * Create a deal event record
   */
  private async createEvent(params: {
    dealId: string;
    eventType: DealEventType;
    actorId?: string;
    actorRole?: string;
    previousState: DealState;
    newState: DealState;
    metadata: Record<string, any>;
  }): Promise<string> {
    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error } = await this.supabase
      .from('deal_events')
      .insert({
        id: eventId,
        deal_id: params.dealId,
        event_type: params.eventType,
        actor_id: params.actorId,
        actor_role: params.actorRole,
        previous_state: params.previousState,
        new_state: params.newState,
        metadata: params.metadata,
        created_at: now,
      });

    if (error) {
      console.error('[DealLifecycle] Failed to create event:', error);
      // Don't throw - event logging should not block the transition
    }

    return eventId;
  }

  /**
   * Update deal status in database
   */
  private async updateDealStatus(dealId: string, newState: DealState): Promise<void> {
    const now = new Date().toISOString();

    // Update both status (legacy) and current_state (new)
    const { error } = await this.supabase
      .from('brand_deals')
      .update({
        status: newState, // Keep in sync for backward compatibility
        current_state: newState,
        updated_at: now,
      })
      .eq('id', dealId);

    if (error) {
      throw new Error(`Failed to update deal status: ${error.message}`);
    }
  }

  /**
   * Trigger side effects after a transition
   */
  private async triggerSideEffects(
    deal: DealRecord,
    previousState: DealState,
    newState: DealState,
    eventType: DealEventType,
    metadata: Record<string, any>
  ): Promise<void> {
    // Queue notifications based on transition
    const transition = DEAL_TRANSITIONS.find(
      (t) =>
        (Array.isArray(t.from) ? t.from.includes(previousState) : t.from === previousState) &&
        t.to === newState
    );

    if (transition?.notifications) {
      for (const notification of transition.notifications) {
        try {
          await this.queueNotification(deal, notification.recipient, notification.template, metadata);
        } catch (error) {
          console.error('[DealLifecycle] Failed to queue notification:', error);
        }
      }
    }

    // Special handling for specific events
    switch (eventType) {
      case DealEventType.DEAL_COMPLETED:
        await this.handleDealCompleted(deal);
        break;
      case DealEventType.PAYMENT_CONFIRMED:
        await this.handlePaymentConfirmed(deal, metadata);
        break;
      case DealEventType.CONTENT_APPROVED:
        await this.handleContentApproved(deal);
        break;
    }
  }

  /**
   * Queue a notification for sending
   */
  private async queueNotification(
    deal: DealRecord,
    recipient: 'creator' | 'brand' | 'both',
    template: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      const { queueEmail } = await import('../../shared/lib/queue.js');

      if (recipient === 'creator' || recipient === 'both') {
        const creatorContent = this.getCreatorNotificationContent(template, deal);
        if (creatorContent) {
          const { data: authUser } = await this.supabase.auth.admin.getUserById(deal.creator_id);
          const creatorEmail = authUser?.user?.email || null;

          await this.supabase.from('notifications').insert({
            user_id: deal.creator_id,
            type: creatorContent.type,
            category: creatorContent.category,
            title: creatorContent.title,
            message: creatorContent.message,
            data: {
              template,
              deal_id: deal.id,
              brand_name: deal.brand_name,
              ...metadata,
            },
            link: creatorContent.link,
            priority: creatorContent.priority,
            icon: creatorContent.type,
            action_label: creatorContent.actionLabel,
            action_link: creatorContent.actionLink,
            read: false,
          });

          if (creatorEmail) {
            await queueEmail({
              to: creatorEmail,
              subject: creatorContent.emailSubject,
              template: 'notification',
              data: {
                title: creatorContent.title,
                message: creatorContent.message,
                ctaLabel: creatorContent.actionLabel,
                ctaUrl: creatorContent.actionLink,
                brandName: deal.brand_name,
                dealId: deal.id,
                ...metadata,
              },
            });
          }
        }
      }

      if (recipient === 'brand' || recipient === 'both') {
        await queueEmail({
          to: deal.brand_email,
          subject: `Deal Update: ${template}`,
          template: 'notification',
          data: {
            title: `Deal Update: ${template}`,
            message: `Your deal with a creator has been updated.`,
            template,
            dealId: deal.id,
            brandEmail: deal.brand_email,
            ...metadata,
          },
        });
      }
    } catch (error) {
      console.error('[DealLifecycle] Failed to queue notification:', error);
    }
  }

  private getCreatorNotificationContent(
    template: string,
    deal: DealRecord
  ) {
    const creatorTemplates = new Set<CreatorNotificationTemplate>([
      'offer_received',
      'offer_accepted',
      'contract_signed',
      'content_requested',
      'revision_requested',
      'content_approved',
      'payment_marked',
      'payment_confirmed',
      'deal_completed',
    ]);

    if (!creatorTemplates.has(template as CreatorNotificationTemplate)) {
      return null;
    }

    return getCreatorNotificationContent(template as CreatorNotificationTemplate, deal);
  }

  /**
   * Handle deal completed event
   */
  private async handleDealCompleted(deal: DealRecord): Promise<void> {
    // Update creator stats
    try {
      await this.supabase.rpc('increment_creator_deals', {
        creator_id: deal.creator_id,
        deal_amount: deal.deal_amount,
      });
    } catch (error) {
      console.error('[DealLifecycle] Failed to update creator stats:', error);
    }

    // Queue invoice generation if not already done
    if (deal.deal_type === 'paid') {
      try {
        const { addInvoiceJob } = await import('../../shared/lib/queue.js');
        await addInvoiceJob({ dealId: deal.id });
      } catch (error) {
        console.error('[DealLifecycle] Failed to queue invoice generation:', error);
      }
    }
  }

  /**
   * Handle payment confirmed event
   */
  private async handlePaymentConfirmed(deal: DealRecord, metadata: Record<string, any>): Promise<void> {
    // Record payment details
    if (metadata.utrNumber) {
      await this.supabase
        .from('brand_deals')
        .update({
          utr_number: metadata.utrNumber,
          payment_received_date: new Date().toISOString(),
        })
        .eq('id', deal.id);
    }

    // Queue invoice generation
    try {
      const { addInvoiceJob } = await import('../../shared/lib/queue.js');
      await addInvoiceJob({ dealId: deal.id });
    } catch (error) {
      console.error('[DealLifecycle] Failed to queue invoice generation:', error);
    }
  }

  /**
   * Handle content approved event
   */
  private async handleContentApproved(deal: DealRecord): Promise<void> {
    // For barter deals, auto-transition to completed
    if (deal.deal_type === 'barter') {
      await this.transition({
        dealId: deal.id,
        targetState: DealState.COMPLETED,
        actorRole: 'system',
        metadata: { autoCompleted: true, reason: 'Barter deal - no payment required' },
      });
    }
  }

  /**
   * Get all events for a deal (timeline)
   */
  async getDealTimeline(dealId: string): Promise<DealEvent[]> {
    const { data, error } = await this.supabase
      .from('deal_events')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[DealLifecycle] Failed to get timeline:', error);
      return [];
    }

    return (data || []) as DealEvent[];
  }

  /**
   * Get deals by state
   */
  async getDealsByState(state: DealState, limit = 50): Promise<DealRecord[]> {
    const { data, error } = await this.supabase
      .from('brand_deals')
      .select('id, status, creator_id, brand_email, brand_name, deal_type, deal_amount, current_state')
      .or(`status.eq.${state},current_state.eq.${state}`)
      .limit(limit);

    if (error) {
      console.error('[DealLifecycle] Failed to get deals by state:', error);
      return [];
    }

    return (data || []) as DealRecord[];
  }

  /**
   * Map legacy status strings to new DealState enum
   */
  private mapLegacyStatus(status: string): DealState | null {
    const mapping: Record<string, DealState> = {
      // Legacy status -> New state
      'pending': DealState.OFFER_SENT,
      'sent': DealState.OFFER_SENT,
      'accepted': DealState.OFFER_ACCEPTED,
      'contract_sent': DealState.CONTRACT_SENT,
      'awaiting_brand_signature': DealState.CONTRACT_SENT,
      'awaiting_creator_signature': DealState.CONTRACT_SENT,
      'signed_by_brand': DealState.CONTRACT_SENT,
      'signed_by_creator': DealState.CONTRACT_SENT,
      'fully_executed': DealState.CONTRACT_SIGNED,
      'content_making': DealState.CONTENT_IN_PROGRESS,
      'content_submitted': DealState.CONTENT_SUBMITTED,
      'revision_requested': DealState.REVISION_REQUESTED,
      'revision_done': DealState.CONTENT_SUBMITTED,
      'content_approved': DealState.APPROVED,
      'payment_released': DealState.PAYMENT_PENDING,
      'paid': DealState.PAID,
      'completed': DealState.COMPLETED,
      'cancelled': DealState.CANCELLED,
      'dispute': DealState.DISPUTE,
    };

    const normalized = status.toLowerCase().replace(/ /g, '_');
    return mapping[normalized] || null;
  }

  /**
   * Force transition (admin only) - bypasses validation
   */
  async forceTransition(
    dealId: string,
    targetState: DealState,
    adminId: string,
    reason: string
  ): Promise<TransitionResult> {
    return this.transition({
      dealId,
      targetState,
      actorId: adminId,
      actorRole: 'admin',
      metadata: { reason, forced: true },
    });
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

let lifecycleInstance: DealLifecycleService | null = null;

export function getDealLifecycleService(
  supabaseClient?: ReturnType<typeof createClient>
): DealLifecycleService {
  if (!lifecycleInstance) {
    // Lazy load to avoid circular dependencies
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getSupabaseClient } = require('../../shared/lib/supabase.js');
    const client = supabaseClient || getSupabaseClient();
    lifecycleInstance = new DealLifecycleService(client);
  }
  return lifecycleInstance;
}

/**
 * Initialize the lifecycle service with a specific client
 */
export function initDealLifecycleService(
  supabaseClient: ReturnType<typeof createClient>
): DealLifecycleService {
  lifecycleInstance = new DealLifecycleService(supabaseClient);
  return lifecycleInstance;
}

export default DealLifecycleService;
