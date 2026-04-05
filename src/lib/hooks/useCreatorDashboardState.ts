import { useMemo } from 'react';
import type { BrandDeal } from '@/types';

// ============================================
// TYPES
// ============================================

export type CreatorState =
  | 'new'
  | 'new_offers'
  | 'active_deals'
  | 'content_upload'
  | 'revision_requested'
  | 'payment_pending'
  | 'completed';

export type NextActionType =
  | 'share_link'
  | 'review_offer'
  | 'view_deal'
  | 'submit_content'
  | 'view_revision'
  | 'confirm_payment';

export interface NextAction {
  type: NextActionType;
  label: string;
  targetId?: string;
  deal?: BrandDeal;
}

export interface DashboardSections {
  linkCard: 'full' | 'collapsed' | 'hidden';
  nextStep: boolean;
  offers: boolean;
  activeDeals: boolean;
  payment: boolean;
  earnings: boolean;
  onboarding: boolean;
  timeline: boolean;
}

export interface CreatorDashboardState {
  state: CreatorState;
  nextAction: NextAction | null;
  sections: DashboardSections;
  stickyCta: boolean;
  urgentDeal?: BrandDeal;
}

interface UseCreatorDashboardStateParams {
  deals: BrandDeal[];
  offersCount: number;
  hasUrl: boolean;
  linkSharedAt?: string | null;
}

// ============================================
// SECTION CONFIG BY STATE
// ============================================

const SECTION_CONFIG: Record<CreatorState, DashboardSections> = {
  new: {
    linkCard: 'full',
    nextStep: true,
    offers: false,
    activeDeals: false,
    payment: false,
    earnings: false,
    onboarding: true,
    timeline: false,
  },
  new_offers: {
    linkCard: 'collapsed',
    nextStep: true,
    offers: true,
    activeDeals: false,
    payment: false,
    earnings: false,
    onboarding: false,
    timeline: false,
  },
  active_deals: {
    linkCard: 'collapsed',
    nextStep: true,
    offers: false,
    activeDeals: true,
    payment: false,
    earnings: false,
    onboarding: false,
    timeline: true,
  },
  content_upload: {
    linkCard: 'collapsed',
    nextStep: true,
    offers: false,
    activeDeals: true,
    payment: false,
    earnings: false,
    onboarding: false,
    timeline: true,
  },
  revision_requested: {
    linkCard: 'collapsed',
    nextStep: true,
    offers: false,
    activeDeals: true,
    payment: false,
    earnings: false,
    onboarding: false,
    timeline: true,
  },
  payment_pending: {
    linkCard: 'collapsed',
    nextStep: true,
    offers: false,
    activeDeals: true,
    payment: true,
    earnings: false,
    onboarding: false,
    timeline: true,
  },
  completed: {
    linkCard: 'collapsed',
    nextStep: true,
    offers: false,
    activeDeals: false,
    payment: false,
    earnings: true,
    onboarding: false,
    timeline: true,
  },
};

// ============================================
// STATE DETECTION
// ============================================

function detectCreatorState(params: {
  hasPaymentPending: boolean;
  hasRevisionRequested: boolean;
  hasContentUploadNeeded: boolean;
  hasNewOffers: boolean;
  hasActiveDeals: boolean;
  hasCompletedDeals: boolean;
}): CreatorState {
  // Priority 1: Payment needs confirmation (highest urgency)
  if (params.hasPaymentPending) return 'payment_pending';

  // Priority 2: Brand requested changes
  if (params.hasRevisionRequested) return 'revision_requested';

  // Priority 3: Content submission needed
  if (params.hasContentUploadNeeded) return 'content_upload';

  // Priority 4: New offers to review
  if (params.hasNewOffers) return 'new_offers';

  // Priority 5: Active deals in progress
  if (params.hasActiveDeals) return 'active_deals';

  // Priority 6: Completed deals exist
  if (params.hasCompletedDeals) return 'completed';

  // Default: New creator
  return 'new';
}

// ============================================
// NEXT ACTION LOGIC
// ============================================

function getNextAction(
  state: CreatorState,
  deals: BrandDeal[],
  offersCount: number
): NextAction | null {
  switch (state) {
    case 'payment_pending': {
      const deal = deals.find(d =>
        ['payment_pending', 'payment_released', 'payment_sent'].includes(String(d.status || '').toLowerCase())
      );
      return deal ? { type: 'confirm_payment', label: "I've been paid", targetId: deal.id, deal } : null;
    }

    case 'revision_requested': {
      const deal = deals.find(d =>
        String(d.brand_approval_status || '').toLowerCase() === 'changes_requested'
      );
      return deal ? { type: 'view_revision', label: 'View feedback', targetId: deal.id, deal } : null;
    }

    case 'content_upload': {
      const deal = deals.find(d => {
        const s = String(d.status || '').toLowerCase();
        return !d.content_submitted_at && (s.includes('content') || s.includes('active') || s.includes('live'));
      });
      return deal ? { type: 'submit_content', label: 'Submit content', targetId: deal.id, deal } : null;
    }

    case 'new_offers':
      return { type: 'review_offer', label: 'Review offer' };

    case 'active_deals': {
      const deal = deals.find(d => !['completed', 'draft'].includes(String(d.status || '').toLowerCase()));
      return deal ? { type: 'view_deal', label: 'View deal', targetId: deal.id, deal } : null;
    }

    case 'completed':
      return { type: 'share_link', label: 'Share link' };

    case 'new':
      return { type: 'share_link', label: 'Share link' };

    default:
      return null;
  }
}

// ============================================
// HOOK
// ============================================

export function useCreatorDashboardState(params: UseCreatorDashboardStateParams): CreatorDashboardState {
  const { deals, offersCount, hasUrl, linkSharedAt } = params;

  // Detect deal-based conditions
  const hasPaymentPending = useMemo(() =>
    deals.some(d =>
      ['payment_pending', 'payment_released', 'payment_sent'].includes(String(d.status || '').toLowerCase())
    ),
  [deals]);

  const hasRevisionRequested = useMemo(() =>
    deals.some(d =>
      String(d.brand_approval_status || '').toLowerCase() === 'changes_requested'
    ),
  [deals]);

  const hasContentUploadNeeded = useMemo(() =>
    deals.some(d => {
      const s = String(d.status || '').toLowerCase();
      return !d.content_submitted_at && (s.includes('content') || s.includes('active') || s.includes('live') || s.includes('signed') || s.includes('executed'));
    }),
  [deals]);

  const hasActiveDeals = useMemo(() =>
    deals.some(d => !['completed', 'fully_executed', 'draft'].includes(String(d.status || '').toLowerCase())),
  [deals]);

  const hasCompletedDeals = useMemo(() =>
    deals.some(d =>
      ['completed', 'fully_executed'].includes(String(d.status || '').toLowerCase()) ||
      Boolean(d.payment_received_date)
    ),
  [deals]);

  // Determine state
  const state = useMemo(() =>
    detectCreatorState({
      hasPaymentPending,
      hasRevisionRequested,
      hasContentUploadNeeded,
      hasNewOffers: offersCount > 0,
      hasActiveDeals,
      hasCompletedDeals,
    }),
  [hasPaymentPending, hasRevisionRequested, hasContentUploadNeeded, offersCount, hasActiveDeals, hasCompletedDeals]);

  // Get next action
  const nextAction = useMemo(() =>
    getNextAction(state, deals, offersCount),
  [state, deals, offersCount]);

  // Get section config
  const sections = useMemo(() =>
    SECTION_CONFIG[state],
  [state]);

  // Determine if sticky CTA should show
  const stickyCta = useMemo(() =>
    state === 'new' && hasUrl,
  [state, hasUrl]);

  // Get urgent deal (the one needing action)
  const urgentDeal = useMemo(() => {
    if (state === 'payment_pending') {
      return deals.find(d =>
        ['payment_pending', 'payment_released', 'payment_sent'].includes(String(d.status || '').toLowerCase())
      );
    }
    if (state === 'revision_requested') {
      return deals.find(d =>
        String(d.brand_approval_status || '').toLowerCase() === 'changes_requested'
      );
    }
    if (state === 'content_upload') {
      return deals.find(d => {
        const s = String(d.status || '').toLowerCase();
        return !d.content_submitted_at && (s.includes('content') || s.includes('active') || s.includes('live'));
      });
    }
    return undefined;
  }, [state, deals]);

  return {
    state,
    nextAction,
    sections,
    stickyCta,
    urgentDeal,
  };
}

// ============================================
// LEGACY COMPATIBILITY
// ============================================

// Map new state to old stage string for WelcomeHeader
export function mapStateToLegacyStage(state: CreatorState): string {
  switch (state) {
    case 'new': return 'new';
    case 'new_offers': return 'has_offer';
    case 'active_deals':
    case 'content_upload':
    case 'revision_requested':
    case 'payment_pending':
      return 'active_deal';
    case 'completed': return 'completed';
    default: return 'new';
  }
}
