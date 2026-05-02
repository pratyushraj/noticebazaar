import { isBarterLikeCollab, isPaidLikeCollab } from './collabType';

export type DealRole = 'brand' | 'creator';

export type CanonicalDealStatus =
  | 'CONTRACT_READY'
  | 'SENT'
  | 'FULLY_EXECUTED'
  | 'PAYMENT_PENDING'
  | 'AWAITING_BRAND_ADDRESS'
  | 'CONTENT_MAKING'
  | 'CONTENT_DELIVERED'
  | 'REVISION_REQUESTED'
  | 'DISPUTED'
  | 'DISPUTE_ARBITRATION'
  | 'DISPUTE_PARTIAL_REFUND'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'UNKNOWN';

export type DealCtaTone = 'action' | 'view' | 'waiting';

export type DealPrimaryCtaAction =
  | 'review_sign_contract'
  | 'view_contract'
  | 'view_collaboration'
  | 'start_working'
  | 'confirm_payment'
  | 'provide_shipping_address'
  | 'track_progress'
  | 'mark_delivered'
  | 'review_content'
  | 'upload_revision'
  | 'escalate_dispute'
  | 'view_summary'
  | 'view_issue'
  | 'view_details'
  | 'confirm_receipt'
  | 'none';

export interface DealPrimaryCta {
  label: string;
  disabled: boolean;
  tone: DealCtaTone;
  action: DealPrimaryCtaAction;
  status: CanonicalDealStatus;
}

const normalizeStatusText = (raw: unknown) =>
  String(raw || '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .toUpperCase()
    .replaceAll(' ', '_');

const hasTruthyKeyMatch = (sources: any[], pattern: RegExp) => {
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;
    for (const key of Object.keys(src)) {
      if (!pattern.test(key)) continue;
      const v = (src as any)[key];
      if (v === true) return true;
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) return true;
      if (typeof v === 'string' && v.trim().length > 0) return true;
      if (v instanceof Date && !Number.isNaN(v.getTime())) return true;
    }
  }
  return false;
};

/**
 * Canonical deal status for CTA decisions.
 * This intentionally collapses multiple legacy/internal statuses into a small state machine.
 */
export const getCanonicalDealStatus = (deal: any): CanonicalDealStatus => {
  if (!deal) return 'UNKNOWN';

  const raw = normalizeStatusText(deal?.status ?? deal?.deal_status ?? deal?.raw?.status ?? deal?.raw?.deal_status);
  const lower = raw.toLowerCase();

  if (!raw) return 'UNKNOWN';

  const isBarter = isBarterLikeCollab(deal);
  const hasAddress = !!String(deal?.brand_address || '').trim();
  const signatureSources = [
    deal,
    deal?.raw,
    deal?.contract,
    deal?.contract_data,
    deal?.contract_metadata,
    deal?.esign,
    deal?.signature,
    deal?.signatures,
  ].filter((x) => x && typeof x === 'object');

  const creatorSigned = hasTruthyKeyMatch(signatureSources, /(creator.*signed|signed.*creator|creator_signature|creator_esign|creator_signed_at)/i);
  const brandSigned = hasTruthyKeyMatch(signatureSources, /(brand.*signed|signed.*brand|brand_signature|brand_esign|brand_signed_at)/i);

  // For barter deals, once the address is provided, we effectively move to the active stage
  // unless it's already completed or disputed, or content has already been delivered.
  const isPostContractStatus = 
    lower.includes('content_delivered') || 
    lower.includes('revision') || 
    lower.includes('awaiting_review') || 
    lower.includes('completed') || 
    lower.includes('settled') || 
    lower.includes('approved') || 
    lower.includes('released') || 
    lower.includes('paid') || 
    lower.includes('dispute');

  if (isBarter && (hasAddress || brandSigned || creatorSigned) && !isPostContractStatus) {
    return 'CONTENT_MAKING';
  }

  if (lower.includes('cancel')) return 'CANCELLED';
  if (lower === 'completed' || lower.includes('completed') || lower.includes('approved') || lower.includes('released') || lower.includes('settled') || lower.includes('paid')) return 'COMPLETED';
  if (lower.includes('dispute') || lower.includes('disputed')) return 'DISPUTED';

  // Revision requested: prefer explicit status, but also treat brand_approval_status as a signal.
  const approval = String(deal?.brand_approval_status || '').trim().toLowerCase();
  if (approval === 'disputed') return 'DISPUTED';
  if (lower.includes('revision_requested') || lower.includes('changes_requested') || approval === 'changes_requested') {
    return 'REVISION_REQUESTED';
  }

  // Content delivered (including revision delivered).
  if (
    lower.includes('content_delivered') ||
    lower.includes('revision_done') ||
    lower.includes('revision_submitted') ||
    lower.includes('awaiting_review') ||
    lower.includes('waiting_for_review')
  ) {
    return 'CONTENT_DELIVERED';
  }

  if (lower.includes('content_making') || lower.includes('content making')) return 'CONTENT_MAKING';

  // New enforcement statuses
  if (lower === 'payment_pending') {
    if (deal?.payment_status === 'captured' || deal?.amount_paid > 0) {
      if (isBarter && !hasAddress) {
        return 'AWAITING_BRAND_ADDRESS';
      }
      return 'CONTENT_MAKING';
    }
    return 'PAYMENT_PENDING';
  }
  if (lower === 'awaiting_brand_address') return 'AWAITING_BRAND_ADDRESS';
  if (lower === 'dispute_arbitration') return 'DISPUTE_ARBITRATION';
  if (lower === 'dispute_partial_refund') return 'DISPUTE_PARTIAL_REFUND';

  // Contract step
  if (
    lower.includes('signed_by_brand') ||
    lower.includes('signed_by_creator') ||
    lower.includes('signed_pending_creator') ||
    lower.includes('signed_pending_brand') ||
    lower.includes('awaiting_brand_signature') ||
    lower.includes('awaiting_creator_signature') ||
    lower.includes('pending_signature')
  ) {
    return 'SENT';
  }
  if (lower.includes('sent')) return 'SENT';
  if (lower.includes('contract_ready') || lower.includes('drafting') || lower.includes('shipment') || lower.includes('transit')) {
    return 'CONTRACT_READY';
  }

  if (lower.includes('fully_executed') || lower.includes('executed') || lower === 'signed') return 'FULLY_EXECUTED';

  // Signature-driven override (prevents "signature required" when already signed).
  // IMPORTANT: Only apply when we couldn't derive a later-stage status from `deal.status`.
  if (creatorSigned && brandSigned) return 'FULLY_EXECUTED';

  return 'UNKNOWN';
};

export const getDealPrimaryCta = (params: { role: DealRole; deal: any }): DealPrimaryCta => {
  const { role, deal } = params;
  const status = getCanonicalDealStatus(deal);
  const requiresShipping = isBarterLikeCollab(deal);
  const collabType = String(deal?.collab_type || deal?.deal_type || deal?.raw?.collab_type || deal?.raw?.deal_type || '').trim().toLowerCase();
  const isPureBarter = collabType === 'barter';
  const requiresPayment = isPaidLikeCollab(deal) && !isPureBarter;
  const shippingStatus = String(deal?.shipping_status || deal?.raw?.shipping_status || '').trim().toLowerCase();
  const hasReceivedShipment = shippingStatus === 'delivered' || shippingStatus === 'received';
  const signatureSources = [
    deal,
    deal?.raw,
    deal?.contract,
    deal?.contract_data,
    deal?.contract_metadata,
    deal?.esign,
    deal?.signature,
    deal?.signatures,
  ].filter((x) => x && typeof x === 'object');
  const creatorSigned = hasTruthyKeyMatch(signatureSources, /(creator.*signed|signed.*creator|creator_signature|creator_esign|creator_signed_at)/i);
  const brandSigned = hasTruthyKeyMatch(signatureSources, /(brand.*signed|signed.*brand|brand_signature|brand_esign|brand_signed_at)/i);

  // Brand
  if (role === 'brand') {
    if (status === 'DISPUTED') {
      return { status, label: 'Escalate Dispute', disabled: false, tone: 'action', action: 'escalate_dispute' };
    }
    if (status === 'DISPUTE_ARBITRATION') {
      return { status, label: 'Under Arbitration', disabled: true, tone: 'waiting', action: 'none' };
    }
    if (status === 'DISPUTE_PARTIAL_REFUND') {
      return { status, label: 'Partial Refund Initiated', disabled: true, tone: 'waiting', action: 'none' };
    }
    // ── Payment pending gate: brand must confirm payment ──────────────────────
    if (status === 'PAYMENT_PENDING') {
      if (isPureBarter && requiresShipping) {
        return { 
          status, 
          label: 'Add Tracking Details',
          disabled: false, 
          tone: 'action', 
          action: 'track_progress'
        };
      }
      return requiresShipping
        ? { status, label: 'Ship Product First', disabled: true, tone: 'waiting', action: 'none' }
        : { status, label: 'Pay Escrow', disabled: false, tone: 'action', action: 'confirm_payment' };
    }
    // ── Shipping address gate: brand must provide address ─────────────────────
    if (status === 'AWAITING_BRAND_ADDRESS') {
      const hasAddress = !!String(deal?.brand_address || '').trim();
      if (isPureBarter && requiresShipping) {
        return {
          status,
          label: 'Add Tracking Details',
          disabled: false,
          tone: 'action',
          action: 'track_progress',
        };
      }
      return requiresShipping
        ? { 
            status, 
            label: hasAddress ? 'Edit Shipping Address' : 'Provide Shipping Address', 
            disabled: false, 
            tone: 'action', 
            action: 'provide_shipping_address' 
          }
        : { status, label: 'Review & Sign Contract', disabled: false, tone: 'action', action: 'review_sign_contract' };
    }
    if (status === 'CONTRACT_READY' || status === 'SENT') {
      // If the brand already signed, this is no longer an "action required" step for the brand.
      // The next step is waiting for the creator to sign.
      if (brandSigned && !creatorSigned) {
        return { status, label: 'Waiting for Creator', disabled: true, tone: 'waiting', action: 'none' };
      }
      // For barter deals: only show shipping address CTA if address is missing.
      // After address is provided, the next action is to review & sign the contract.
      if (requiresShipping && !hasReceivedShipment && isPureBarter) {
        return { status, label: 'Review & Sign Contract', disabled: false, tone: 'action', action: 'review_sign_contract' };
      }
      return { status, label: 'Review & Sign Contract', disabled: false, tone: 'action', action: 'review_sign_contract' };
    }
    if (status === 'FULLY_EXECUTED') {
      if (isPureBarter && requiresShipping) {
        return { 
          status, 
          label: 'Ship Product', 
          disabled: false, 
          tone: 'action', 
          action: 'track_progress' 
        };
      }
      return { status, label: 'View Collaboration', disabled: false, tone: 'view', action: 'view_collaboration' };
    }
    if (status === 'CONTENT_MAKING') {
      if (requiresShipping && shippingStatus !== 'shipped' && shippingStatus !== 'delivered' && shippingStatus !== 'received') {
        return { status, label: 'Ship Product', disabled: false, tone: 'action', action: 'track_progress' };
      }
      return { status, label: 'Track Progress', disabled: false, tone: 'view', action: 'track_progress' };
    }
    if (status === 'CONTENT_DELIVERED') {
      return { status, label: 'Approve Content', disabled: false, tone: 'action', action: 'review_content' };
    }
    if (status === 'REVISION_REQUESTED') {
      return { status, label: 'Waiting for Revision', disabled: true, tone: 'waiting', action: 'none' };
    }
    if (status === 'COMPLETED') {
      return { status, label: 'View Summary', disabled: false, tone: 'view', action: 'view_summary' };
    }
    if (status === 'CANCELLED') {
      return { status, label: 'View Details', disabled: false, tone: 'view', action: 'view_details' };
    }
    return { status, label: 'View Details', disabled: false, tone: 'view', action: 'view_details' };
  }

  // Creator
  if (status === 'COMPLETED') {
    return { status, label: 'View Summary', disabled: false, tone: 'view', action: 'view_summary' };
  }
  // Shipping deals: never show "Mark as Delivered" until the product shipment is received.
  // (Some legacy states incorrectly set status=CONTENT_MAKING for barter/shipping deals.)
  if (requiresShipping && !hasReceivedShipment) {
    if (shippingStatus === 'shipped') {
      return { status, label: 'Confirm Product Received', disabled: false, tone: 'action', action: 'confirm_receipt' };
    }
    // If the brand hasn't provided their address yet, show a specific gate message
    if (status === 'AWAITING_BRAND_ADDRESS' || status === 'FULLY_EXECUTED') {
      return { status, label: 'Waiting for Shipping Details', disabled: true, tone: 'waiting', action: 'none' };
    }
    return isPureBarter
      ? { status, label: 'Waiting for Product Shipment', disabled: true, tone: 'waiting', action: 'none' }
      : { status, label: 'Waiting for Product Shipment', disabled: true, tone: 'waiting', action: 'none' };
  }

  // ── Payment pending gate (creator side) ───────────────────────────────────
  if (status === 'PAYMENT_PENDING') {
    if (isPureBarter && requiresShipping) {
      return { status, label: 'Awaiting Shipping Details', disabled: true, tone: 'waiting', action: 'none' };
    }
    return requiresPayment
      ? { status, label: 'Awaiting Brand Payment', disabled: true, tone: 'waiting', action: 'none' }
      : { status, label: 'Awaiting Shipping Details', disabled: true, tone: 'waiting', action: 'none' };
  }

  // ── Dispute escalation statuses (creator side) ────────────────────────────
  if (status === 'DISPUTE_ARBITRATION') {
    return { status, label: 'Under Arbitration', disabled: true, tone: 'waiting', action: 'none' };
  }
  if (status === 'DISPUTE_PARTIAL_REFUND') {
    return { status, label: 'Partial Refund Pending', disabled: true, tone: 'waiting', action: 'none' };
  }

  if (status === 'CONTRACT_READY' || status === 'SENT') {
    // If the creator already signed, they should see a waiting state until the brand signs.
    if (creatorSigned && !brandSigned) {
      return { status, label: 'Waiting for Brand', disabled: true, tone: 'waiting', action: 'none' };
    }
    // Otherwise, contract signing is the creator's next action.
    return { status, label: 'Sign Agreement', disabled: false, tone: 'action', action: 'review_sign_contract' };
  }
  if (status === 'FULLY_EXECUTED') {
    if (requiresPayment) {
      const hasPayment = (deal?.amount_paid && deal.amount_paid > 0) || 
                         deal?.payment_id || 
                         deal?.payment_status === 'captured' || 
                         deal?.raw?.payment_status === 'captured';
      if (!hasPayment) {
        return { status, label: 'Awaiting Payment', disabled: true, tone: 'waiting', action: 'none' };
      }
    }
    return { status, label: 'Start Working', disabled: false, tone: 'action', action: 'start_working' };
  }
  if (status === 'CONTENT_MAKING') {
    return { status, label: 'Submit Content', disabled: false, tone: 'action', action: 'mark_delivered' };
  }
  if (status === 'CONTENT_DELIVERED') {
    return { status, label: 'Waiting for Review', disabled: true, tone: 'waiting', action: 'none' };
  }
  if (status === 'REVISION_REQUESTED') {
    return { status, label: 'Upload Revised Content', disabled: false, tone: 'action', action: 'upload_revision' };
  }
  if (status === 'DISPUTED') {
    return { status, label: 'View Issue', disabled: false, tone: 'view', action: 'view_issue' };
  }
  if (status === 'CANCELLED') {
    return { status, label: 'View Details', disabled: false, tone: 'view', action: 'view_details' };
  }
  return { status, label: 'View Details', disabled: false, tone: 'view', action: 'view_details' };
};

export const dealPrimaryCtaButtonClass = (tone: DealCtaTone) => {
  if (tone === 'action') return 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)] border-emerald-500/30 font-black';
  if (tone === 'view') return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)] border-blue-400/30 font-black';
  return 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 border-slate-200 dark:border-white/10 shadow-sm font-bold backdrop-blur-md hover:bg-slate-200 dark:hover:bg-white/10 transition-all';
};
