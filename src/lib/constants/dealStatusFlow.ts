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
    label: 'New brand message',
    shortLabel: 'New Request',
    helperText: 'Open it and reply',
    colorClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  contract_ready: {
    label: 'Agreement sent',
    shortLabel: 'Agreement sent',
    helperText: 'Waiting for brand reply',
    colorClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  brand_signed: {
    label: 'Brand signed',
    shortLabel: 'Brand signed',
    helperText: 'Sign to start the deal',
    colorClass: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  fully_executed: {
    label: 'Agreement signed',
    shortLabel: 'Signed',
    helperText: 'Deal started',
    helperTextPaid: 'Waiting for payment',
    helperTextBarter: 'Waiting for product delivery',
    colorClass: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  live_deal: {
    label: 'In progress',
    shortLabel: 'Live Deal',
    helperText: 'Make and upload your content',
    helperTextPaid: 'Make and upload your content',
    helperTextBarter: 'Product received · upload your content',
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
    helperText: 'This deal is finished',
    colorClass: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  awaiting_product_shipment: {
    label: 'Accepted — making the agreement',
    shortLabel: 'Making agreement',
    helperText: 'Please wait for a moment',
    colorClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  negotiation: {
    label: 'New brand message',
    shortLabel: 'New Request',
    helperText: 'Open it and reply',
    colorClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  content_making: {
    label: 'Making content',
    shortLabel: 'Making content',
    helperText: 'Make and upload your content',
    helperTextPaid: 'Make and upload your content',
    helperTextBarter: 'Product received · upload your content',
    colorClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  content_delivered: {
    label: 'Delivered',
    shortLabel: 'Delivered',
    helperText: 'Waiting for brand reply / payment',
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
