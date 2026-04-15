/**
 * Unified payment status constants and helpers.
 * Single source of truth for all payment status types across the app.
 */

// ─── Core Types ─────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'upcoming' | 'overdue' | 'paid';

export type RiskLevel = 'low' | 'moderate' | 'high';

// ─── Status Display Config ───────────────────────────────────────────────────

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, {
  label: string;
  shortLabel: string;
  colorClass: string;
  icon: string;
}> = {
  pending: {
    label: 'Pending',
    shortLabel: 'Pending',
    colorClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: 'clock',
  },
  upcoming: {
    label: 'Due Soon',
    shortLabel: 'Soon',
    colorClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: 'calendar',
  },
  overdue: {
    label: 'Overdue',
    shortLabel: 'Overdue',
    colorClass: 'bg-destructive/20 text-destructive border-destructive/30',
    icon: 'alert',
  },
  paid: {
    label: 'Paid',
    shortLabel: 'Paid',
    colorClass: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: 'check',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compute payment status from deal data.
 * Uses payment_received_date as source of truth for "paid".
 * Falls back to due date comparison for pending/upcoming/overdue.
 */
export function computePaymentStatus(
  paymentReceivedDate: string | null | undefined,
  paymentExpectedDate: string | null | undefined
): PaymentStatus {
  if (paymentReceivedDate) return 'paid';

  if (!paymentExpectedDate) return 'pending';

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(paymentExpectedDate);
  due.setHours(0, 0, 0, 0);

  if (due < now) return 'overdue';
  if (due.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) return 'upcoming';
  return 'pending';
}

/**
 * Compute days until due (negative = overdue).
 */
export function computeDaysUntilDue(
  paymentExpectedDate: string | null | undefined
): number | null {
  if (!paymentExpectedDate) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(paymentExpectedDate);
  due.setHours(0, 0, 0, 0);

  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
