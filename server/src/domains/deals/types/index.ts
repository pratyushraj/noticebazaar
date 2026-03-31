/**
 * Deal Domain Types
 * 
 * Core types for the deals domain including state machine definitions,
 * event types, and transition logic.
 */

// ============================================================
// DEAL STATE MACHINE
// ============================================================

/**
 * All possible deal states in the lifecycle
 */
export enum DealState {
  // Initial states
  OFFER_SENT = 'OFFER_SENT',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  
  // Contract states
  CONTRACT_SENT = 'CONTRACT_SENT',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  
  // Content states
  CONTENT_IN_PROGRESS = 'CONTENT_IN_PROGRESS',
  CONTENT_SUBMITTED = 'CONTENT_SUBMITTED',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
  APPROVED = 'APPROVED',
  
  // Payment states
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  
  // Terminal states
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTE = 'DISPUTE',
}

/**
 * Deal event types - these are the events that trigger state transitions
 */
export enum DealEventType {
  // Offer events
  OFFER_SENT = 'offer_sent',
  OFFER_ACCEPTED = 'offer_accepted',
  OFFER_DECLINED = 'offer_declined',
  OFFER_EXPIRED = 'offer_expired',
  
  // Contract events
  CONTRACT_GENERATED = 'contract_generated',
  CONTRACT_SENT = 'contract_sent',
  CONTRACT_SIGNED_BY_BRAND = 'contract_signed_by_brand',
  CONTRACT_SIGNED_BY_CREATOR = 'contract_signed_by_creator',
  CONTRACT_FULLY_SIGNED = 'contract_fully_signed',
  CONTRACT_REJECTED = 'contract_rejected',
  
  // Content events
  WORK_STARTED = 'work_started',
  CONTENT_SUBMITTED = 'content_submitted',
  REVISION_REQUESTED = 'revision_requested',
  REVISION_SUBMITTED = 'revision_submitted',
  CONTENT_APPROVED = 'content_approved',
  CONTENT_REJECTED = 'content_rejected',
  
  // Payment events
  PAYMENT_MARKED = 'payment_marked',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PAYMENT_DISPUTED = 'payment_disputed',
  INVOICE_GENERATED = 'invoice_generated',
  
  // Lifecycle events
  DEAL_COMPLETED = 'deal_completed',
  DEAL_CANCELLED = 'deal_cancelled',
  DISPUTE_OPENED = 'dispute_opened',
  DISPUTE_RESOLVED = 'dispute_resolved',
  
  // Admin events
  STATUS_OVERRIDE = 'status_override',
  DEAL_REOPENED = 'deal_reopened',
}

/**
 * Transition definition - defines allowed state transitions
 */
export interface StateTransition {
  from: DealState | DealState[];
  to: DealState;
  event: DealEventType;
  requires?: {
    role?: ('creator' | 'brand' | 'admin')[];
    conditions?: string[]; // Named conditions to check
  };
  notifications?: {
    recipient: 'creator' | 'brand' | 'both';
    template: string;
  }[];
}

/**
 * All allowed state transitions
 */
export const DEAL_TRANSITIONS: StateTransition[] = [
  // Offer flow
  {
    from: DealState.OFFER_SENT,
    to: DealState.OFFER_ACCEPTED,
    event: DealEventType.OFFER_ACCEPTED,
    notifications: [
      { recipient: 'brand', template: 'offer_accepted' },
    ],
  },
  {
    from: DealState.OFFER_SENT,
    to: DealState.CANCELLED,
    event: DealEventType.OFFER_DECLINED,
  },
  {
    from: DealState.OFFER_SENT,
    to: DealState.CANCELLED,
    event: DealEventType.OFFER_EXPIRED,
  },
  
  // Contract flow
  {
    from: DealState.OFFER_ACCEPTED,
    to: DealState.CONTRACT_SENT,
    event: DealEventType.CONTRACT_SENT,
    notifications: [
      { recipient: 'brand', template: 'contract_ready_for_signature' },
    ],
  },
  {
    from: DealState.CONTRACT_SENT,
    to: DealState.CONTRACT_SIGNED,
    event: DealEventType.CONTRACT_FULLY_SIGNED,
    notifications: [
      { recipient: 'both', template: 'contract_fully_signed' },
    ],
  },
  
  // Content flow
  {
    from: DealState.CONTRACT_SIGNED,
    to: DealState.CONTENT_IN_PROGRESS,
    event: DealEventType.WORK_STARTED,
  },
  {
    from: DealState.CONTENT_IN_PROGRESS,
    to: DealState.CONTENT_SUBMITTED,
    event: DealEventType.CONTENT_SUBMITTED,
    notifications: [
      { recipient: 'brand', template: 'content_submitted' },
    ],
  },
  {
    from: DealState.CONTENT_SUBMITTED,
    to: DealState.REVISION_REQUESTED,
    event: DealEventType.REVISION_REQUESTED,
    notifications: [
      { recipient: 'creator', template: 'revision_requested' },
    ],
  },
  {
    from: DealState.REVISION_REQUESTED,
    to: DealState.CONTENT_SUBMITTED,
    event: DealEventType.REVISION_SUBMITTED,
    notifications: [
      { recipient: 'brand', template: 'revision_submitted' },
    ],
  },
  {
    from: DealState.CONTENT_SUBMITTED,
    to: DealState.APPROVED,
    event: DealEventType.CONTENT_APPROVED,
    notifications: [
      { recipient: 'creator', template: 'content_approved' },
    ],
  },
  
  // Payment flow (for paid deals)
  {
    from: DealState.APPROVED,
    to: DealState.PAYMENT_PENDING,
    event: DealEventType.PAYMENT_MARKED,
    notifications: [
      { recipient: 'creator', template: 'payment_marked' },
    ],
  },
  {
    from: DealState.PAYMENT_PENDING,
    to: DealState.PAID,
    event: DealEventType.PAYMENT_CONFIRMED,
    notifications: [
      { recipient: 'brand', template: 'payment_confirmed' },
    ],
  },
  
  // Completion flow
  {
    from: [DealState.APPROVED, DealState.PAID],
    to: DealState.COMPLETED,
    event: DealEventType.DEAL_COMPLETED,
    notifications: [
      { recipient: 'both', template: 'deal_completed' },
    ],
  },
  
  // Dispute flow
  {
    from: [
      DealState.CONTENT_SUBMITTED,
      DealState.APPROVED,
      DealState.PAYMENT_PENDING,
      DealState.PAID,
    ],
    to: DealState.DISPUTE,
    event: DealEventType.DISPUTE_OPENED,
    notifications: [
      { recipient: 'both', template: 'dispute_opened' },
    ],
  },
  {
    from: DealState.DISPUTE,
    to: DealState.COMPLETED,
    event: DealEventType.DISPUTE_RESOLVED,
  },
  
  // Cancellation (from various states)
  {
    from: [
      DealState.OFFER_SENT,
      DealState.OFFER_ACCEPTED,
      DealState.CONTRACT_SENT,
      DealState.CONTRACT_SIGNED,
      DealState.CONTENT_IN_PROGRESS,
    ],
    to: DealState.CANCELLED,
    event: DealEventType.DEAL_CANCELLED,
  },
  
  // Admin override (can transition from any state)
  {
    from: Object.values(DealState) as DealState[],
    to: DealState.CANCELLED,
    event: DealEventType.STATUS_OVERRIDE,
    requires: { role: ['admin'] },
  },
];

/**
 * Transition result
 */
export interface TransitionResult {
  success: boolean;
  previousState: DealState;
  newState: DealState;
  event: DealEventType;
  eventId?: string;
  error?: string;
}

/**
 * Deal event record (stored in database)
 */
export interface DealEvent {
  id: string;
  deal_id: string;
  event_type: DealEventType;
  actor_id: string | null;
  actor_role: 'creator' | 'brand' | 'system' | 'admin' | null;
  previous_state: DealState | null;
  new_state: DealState;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Deal with computed fields
 */
export interface DealWithEvents {
  id: string;
  current_state: DealState;
  previous_state: DealState | null;
  events: DealEvent[];
  created_at: string;
  updated_at: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if a transition is valid
 */
export function isValidTransition(
  currentState: DealState,
  targetState: DealState
): boolean {
  return DEAL_TRANSITIONS.some(
    (t) =>
      (Array.isArray(t.from) ? t.from.includes(currentState) : t.from === currentState) &&
      t.to === targetState
  );
}

/**
 * Get valid transitions from a state
 */
export function getValidTransitions(currentState: DealState): DealState[] {
  return DEAL_TRANSITIONS
    .filter((t) =>
      Array.isArray(t.from) ? t.from.includes(currentState) : t.from === currentState
    )
    .map((t) => t.to);
}

/**
 * Get the event type for a transition
 */
export function getTransitionEvent(
  currentState: DealState,
  targetState: DealState
): DealEventType | null {
  const transition = DEAL_TRANSITIONS.find(
    (t) =>
      (Array.isArray(t.from) ? t.from.includes(currentState) : t.from === currentState) &&
      t.to === targetState
  );
  return transition?.event || null;
}

/**
 * Check if state is terminal (no further transitions)
 */
export function isTerminalState(state: DealState): boolean {
  return [DealState.COMPLETED, DealState.CANCELLED].includes(state);
}

/**
 * Check if state requires payment flow
 */
export function requiresPayment(state: DealState): boolean {
  return [
    DealState.PAYMENT_PENDING,
    DealState.PAID,
  ].includes(state);
}

/**
 * Get state display name
 */
export function getStateDisplayName(state: DealState): string {
  const names: Record<DealState, string> = {
    [DealState.OFFER_SENT]: 'Offer Sent',
    [DealState.OFFER_ACCEPTED]: 'Offer Accepted',
    [DealState.CONTRACT_SENT]: 'Contract Sent',
    [DealState.CONTRACT_SIGNED]: 'Contract Signed',
    [DealState.CONTENT_IN_PROGRESS]: 'Content In Progress',
    [DealState.CONTENT_SUBMITTED]: 'Content Submitted',
    [DealState.REVISION_REQUESTED]: 'Revision Requested',
    [DealState.APPROVED]: 'Approved',
    [DealState.PAYMENT_PENDING]: 'Payment Pending',
    [DealState.PAID]: 'Paid',
    [DealState.COMPLETED]: 'Completed',
    [DealState.CANCELLED]: 'Cancelled',
    [DealState.DISPUTE]: 'Dispute',
  };
  return names[state] || state;
}

/**
 * Get state category for UI grouping
 */
export function getStateCategory(state: DealState): 'offer' | 'contract' | 'content' | 'payment' | 'terminal' {
  const categories: Record<string, 'offer' | 'contract' | 'content' | 'payment' | 'terminal'> = {
    [DealState.OFFER_SENT]: 'offer',
    [DealState.OFFER_ACCEPTED]: 'offer',
    [DealState.CONTRACT_SENT]: 'contract',
    [DealState.CONTRACT_SIGNED]: 'contract',
    [DealState.CONTENT_IN_PROGRESS]: 'content',
    [DealState.CONTENT_SUBMITTED]: 'content',
    [DealState.REVISION_REQUESTED]: 'content',
    [DealState.APPROVED]: 'content',
    [DealState.PAYMENT_PENDING]: 'payment',
    [DealState.PAID]: 'payment',
    [DealState.COMPLETED]: 'terminal',
    [DealState.CANCELLED]: 'terminal',
    [DealState.DISPUTE]: 'terminal',
  };
  return categories[state] || 'terminal';
}
