/**
 * Canonical deal status constants — single source of truth.
 *
 * IMPORTANT: The database stores status as a free-form string.
 * These constants define the _canonical_ values the app should use.
 * Reading code should be case-insensitive; writing code should use
 * these exact values.
 */

/** Canonical status strings stored in the database */
export const DEAL_STATUS = {
  // ── Pre-contract ──────────────────────────────────────────────
  BRAND_DETAILS_SUBMITTED: 'Brand_Details_Submitted',
  ACCEPTED_PENDING_OTP: 'accepted_pending_otp',
  NEGOTIATION: 'Negotiation',

  // ── Contract flow ─────────────────────────────────────────────
  CONTRACT_READY: 'CONTRACT_READY',
  SIGNED_BY_BRAND: 'SIGNED_BY_BRAND',
  SIGNED_BY_CREATOR: 'SIGNED_BY_CREATOR',
  FULLY_EXECUTED: 'FULLY_EXECUTED',

  // ── Active deal ───────────────────────────────────────────────
  ACTIVE: 'Active',
  CONTENT_MAKING: 'Content Making',
  CONTENT_DELIVERED: 'Content Delivered',
  CONTENT_APPROVED: 'Content Approved',

  // ── Review / revision ─────────────────────────────────────────
  REVISION_REQUESTED: 'Revision Requested',
  REVISION_DONE: 'Revision Done',

  // ── Payment ───────────────────────────────────────────────────
  PAYMENT_PENDING: 'Payment Pending',
  PAYMENT_RELEASED: 'Payment Released',
  COMPLETED: 'Completed',

  // ── Barter ────────────────────────────────────────────────────
  DRAFTING: 'Drafting',
  AWAITING_PRODUCT_SHIPMENT: 'Awaiting Product Shipment',

  // ── Terminal ──────────────────────────────────────────────────
  DISPUTED: 'Disputed',
  REJECTED: 'Rejected',
} as const;

export type DealStatus = (typeof DEAL_STATUS)[keyof typeof DEAL_STATUS];

/** Statuses that represent a "live" / signed deal (shown in dashboard) */
export const LIVE_DEAL_STATUSES: readonly string[] = [
  DEAL_STATUS.CONTRACT_READY,
  DEAL_STATUS.SIGNED_BY_BRAND,
  DEAL_STATUS.SIGNED_BY_CREATOR,
  DEAL_STATUS.FULLY_EXECUTED,
  DEAL_STATUS.ACTIVE,
  DEAL_STATUS.CONTENT_MAKING,
  DEAL_STATUS.CONTENT_DELIVERED,
  DEAL_STATUS.CONTENT_APPROVED,
  DEAL_STATUS.REVISION_REQUESTED,
  DEAL_STATUS.REVISION_DONE,
  DEAL_STATUS.PAYMENT_PENDING,
  DEAL_STATUS.PAYMENT_RELEASED,
  DEAL_STATUS.COMPLETED,
  DEAL_STATUS.DRAFTING,
  DEAL_STATUS.AWAITING_PRODUCT_SHIPMENT,
  DEAL_STATUS.ACCEPTED_PENDING_OTP,
  DEAL_STATUS.DISPUTED,
  // Legacy lowercase / mixed-case variants still in DB
  'sent',
  'signed',
  'content_making',
  'content_delivered',
  'completed',
  'active',
  'confirmed',
  'drafting',
] as const;

/**
 * Allowed forward transitions — maps a status to the set of statuses
 * it can legally move to.  Used by `useUpdateDealProgress` and any
 * server-side validation.
 *
 * If a status isn't in this map, it has no enforced transitions
 * (open field for edits).
 */
export const DEAL_ALLOWED_TRANSITIONS: Record<string, readonly string[]> = {
  [DEAL_STATUS.BRAND_DETAILS_SUBMITTED]: [DEAL_STATUS.CONTRACT_READY, DEAL_STATUS.NEGOTIATION, DEAL_STATUS.REJECTED],
  [DEAL_STATUS.NEGOTIATION]: [DEAL_STATUS.CONTRACT_READY, DEAL_STATUS.REJECTED],
  'accepted_pending_otp': [DEAL_STATUS.CONTENT_MAKING, DEAL_STATUS.CONTRACT_READY, DEAL_STATUS.DRAFTING, DEAL_STATUS.REJECTED],
  [DEAL_STATUS.CONTRACT_READY]: [DEAL_STATUS.SIGNED_BY_BRAND, DEAL_STATUS.SIGNED_BY_CREATOR, DEAL_STATUS.REJECTED],
  [DEAL_STATUS.SIGNED_BY_BRAND]: [DEAL_STATUS.SIGNED_BY_CREATOR, DEAL_STATUS.FULLY_EXECUTED],
  [DEAL_STATUS.SIGNED_BY_CREATOR]: [DEAL_STATUS.SIGNED_BY_BRAND, DEAL_STATUS.FULLY_EXECUTED],
  [DEAL_STATUS.FULLY_EXECUTED]: [DEAL_STATUS.ACTIVE, DEAL_STATUS.CONTENT_MAKING],
  [DEAL_STATUS.ACTIVE]: [DEAL_STATUS.CONTENT_MAKING, DEAL_STATUS.COMPLETED],
  [DEAL_STATUS.CONTENT_MAKING]: [DEAL_STATUS.CONTENT_DELIVERED],
  [DEAL_STATUS.CONTENT_DELIVERED]: [DEAL_STATUS.CONTENT_APPROVED, DEAL_STATUS.REVISION_REQUESTED],
  [DEAL_STATUS.REVISION_REQUESTED]: [DEAL_STATUS.REVISION_DONE],
  [DEAL_STATUS.REVISION_DONE]: [DEAL_STATUS.CONTENT_APPROVED, DEAL_STATUS.REVISION_REQUESTED],
  [DEAL_STATUS.CONTENT_APPROVED]: [DEAL_STATUS.PAYMENT_PENDING, DEAL_STATUS.COMPLETED],
  [DEAL_STATUS.PAYMENT_PENDING]: [DEAL_STATUS.PAYMENT_RELEASED, DEAL_STATUS.COMPLETED],
  [DEAL_STATUS.PAYMENT_RELEASED]: [DEAL_STATUS.COMPLETED],
  [DEAL_STATUS.DRAFTING]: [DEAL_STATUS.AWAITING_PRODUCT_SHIPMENT, DEAL_STATUS.CONTRACT_READY],
  [DEAL_STATUS.AWAITING_PRODUCT_SHIPMENT]: [DEAL_STATUS.CONTRACT_READY, DEAL_STATUS.ACTIVE],
};

/**
 * Check whether a status transition is valid.
 * Returns null if OK, or an error message string.
 */
export function validateStatusTransition(from: string, to: string): string | null {
  // Same status — always allowed (no-op update)
  if (from === to) return null;

  // Terminal statuses can't transition
  const terminalStatuses = [DEAL_STATUS.COMPLETED, DEAL_STATUS.REJECTED, DEAL_STATUS.DISPUTED];
  if (terminalStatuses.includes(from as DealStatus)) {
    return `Deal is already ${from} and cannot be changed`;
  }

  const allowed = DEAL_ALLOWED_TRANSITIONS[from];
  if (!allowed) {
    // Allow transitions from known statuses not in the map (e.g. accepted_pending_otp)
    const knownStatuses = [
      ...Object.values(DEAL_STATUS),
      'accepted_pending_otp',
    ];
    if (knownStatuses.includes(from)) {
      return null;
    }
    return `Unknown status "${from}". Cannot validate transition.`;
  }

  if (!allowed.includes(to)) {
    return `Cannot move from "${from}" to "${to}". Allowed next: ${allowed.join(', ')}`;
  }

  return null;
}
