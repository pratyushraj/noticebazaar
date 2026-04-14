/**
 * Creator-friendly deal lifecycle: UI labels, helper text, and colors.
 * Single source of truth for Collab Link → Deal flow (paid & barter).
 * Use: friendly language, no legal jargon, status color coding (green / amber / red).
 */

/** Must match DealStage in useBrandDeals.ts */
export type DealStageKey =
  | 'details_submitted'
  | 'contract_ready'
  | 'brand_signed'
  | 'fully_executed'
  | 'live_deal'
  | 'needs_changes'
  | 'declined'
  | 'completed'
  | 'awaiting_product_shipment'
  | 'negotiation'
  | 'content_making'
  | 'content_delivered';

export type DealTypeForFlow = 'paid' | 'barter';

export interface StageDisplayConfig {
  label: string;
  shortLabel: string;
  helperText: string;
  /** Paid-specific helper (overrides helperText when dealType === 'paid') */
  helperTextPaid?: string;
  /** Barter-specific helper (overrides helperText when dealType === 'barter') */
  helperTextBarter?: string;
  /** Tailwind-style: green / amber / red / blue / gray */
  colorClass: string;
}

/** Creator-facing labels and helper text per stage */
export const DEAL_STAGE_DISPLAY: Record<DealStageKey, StageDisplayConfig> = {
  details_submitted: {
    label: 'Respond needed',
    shortLabel: 'Respond',
    helperText: 'Brand is waiting for your reply',
    helperTextPaid: 'Brand is waiting — respond before expiry',
    helperTextBarter: 'Brand is waiting for your reply',
    colorClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  contract_ready: {
    label: 'Agreement ready',
    shortLabel: 'Ready to sign',
    helperText: 'Review and sign to lock in the deal',
    helperTextPaid: 'Sign to secure your payment',
    helperTextBarter: 'Sign to confirm the deal',
    colorClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  brand_signed: {
    label: 'Sign to start',
    shortLabel: 'Your turn',
    helperText: 'Brand signed — your signature needed',
    helperTextPaid: 'Brand signed — sign to release payment',
    helperTextBarter: 'Brand signed — confirm to start',
    colorClass: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  fully_executed: {
    label: 'Deal live',
    shortLabel: 'Live',
    helperText: 'Deal confirmed — start creating',
    helperTextPaid: 'Payment locked in — create and upload your content',
    helperTextBarter: 'Product on the way — start creating content',
    colorClass: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  live_deal: {
    label: 'In progress',
    shortLabel: 'In progress',
    helperText: 'Create and upload your content',
    helperTextPaid: 'Create your content — payment pending approval',
    helperTextBarter: 'Product received — share your post link',
    colorClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  needs_changes: {
    label: 'Your action needed',
    shortLabel: 'Action Required',
    helperText: 'Open the deal to see what to do',
    colorClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  declined: {
    label: 'Declined',
    shortLabel: 'Declined',
    helperText: 'Deal closed',
    colorClass: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  },
  completed: {
    label: 'Completed',
    shortLabel: 'Done',
    helperText: 'Deal finished',
    helperTextPaid: 'Payment received',
    helperTextBarter: 'Deal complete',
    colorClass: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  awaiting_product_shipment: {
    label: 'Accepted — making the agreement',
    shortLabel: 'Making agreement',
    helperText: 'Please wait for a moment',
    colorClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  negotiation: {
    label: 'Counter received',
    shortLabel: 'Counter',
    helperText: 'Review counter-offer and respond',
    helperTextPaid: 'Brand countered — review and accept or negotiate',
    helperTextBarter: 'Brand countered — review the new terms',
    colorClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  content_making: {
    label: 'Creating content',
    shortLabel: 'Creating',
    helperText: 'Upload your content to get paid',
    helperTextPaid: 'Upload content to trigger payment release',
    helperTextBarter: 'Share your post link to complete',
    colorClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  content_delivered: {
    label: 'Under review',
    shortLabel: 'Under review',
    helperText: 'Brand is reviewing — you\'ll be paid soon',
    helperTextPaid: 'Brand reviewing — payment releases after approval',
    helperTextBarter: 'Brand received your item — content in review',
    colorClass: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  },
};

/** Payment Secured (paid only) – use when payment_received_date is set */
export const PAYMENT_SECURED_DISPLAY: StageDisplayConfig = {
  label: 'Payment received',
  shortLabel: 'Paid',
  helperText: 'Payment is done',
  colorClass: 'bg-green-500/20 text-green-400 border-green-500/30',
};

/** Action Required (dispute / overdue) */
export const ACTION_REQUIRED_DISPLAY: StageDisplayConfig = {
  label: 'Your action needed',
  shortLabel: 'Action Required',
  helperText: 'Open the deal to see what to do',
  colorClass: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function getStageHelperText(
  stage: DealStageKey | string,
  dealType?: DealTypeForFlow | null
): string {
  const config = DEAL_STAGE_DISPLAY[stage as DealStageKey];
  if (!config) return '';
  if (dealType === 'paid' && config.helperTextPaid) return config.helperTextPaid;
  if (dealType === 'barter' && config.helperTextBarter) return config.helperTextBarter;
  return config.helperText;
}

export function getStageDisplay(stage: DealStageKey | string): StageDisplayConfig {
  return DEAL_STAGE_DISPLAY[stage as DealStageKey] ?? {
    label: String(stage),
    shortLabel: String(stage),
    helperText: '',
    colorClass: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
}
