import { useMemo } from 'react';
import type { BrandDeal } from '@/types';

// ============================================
// TYPES
// ============================================

export type BrandState =
  | 'new'
  | 'offer_response_pending'
  | 'content_in_progress'
  | 'content_waiting_approval'
  | 'payment_pending'
  | 'completed';

export type BrandNextActionType =
  | 'create_offer'
  | 'view_offer'
  | 'view_deal'
  | 'review_content'
  | 'send_payment';

export interface BrandNextAction {
  type: BrandNextActionType;
  label: string;
  targetId?: string;
  deal?: BrandDeal;
  urgency?: 'critical' | 'warning' | 'normal';
}

export interface BrandDashboardSections {
  welcomeHeader: boolean;
  primaryAction: boolean;
  nextStep: boolean;
  pendingOffers: boolean;
  activeDeals: boolean;
  contentReview: boolean;
  paymentCard: boolean;
  completedDeals: boolean;
  creatorHistory: boolean;
}

export interface BrandDashboardState {
  state: BrandState;
  nextAction: BrandNextAction | null;
  sections: BrandDashboardSections;
  urgentDeal?: BrandDeal;
  pendingOffersCount: number;
  activeDealsCount: number;
  completedDealsCount: number;
  totalSpend: number;
}

interface UseBrandDashboardStateParams {
  deals: BrandDeal[];
  sentOffersCount: number;
}

// ============================================
// SECTION CONFIG BY STATE
// ============================================

const SECTION_CONFIG: Record<BrandState, BrandDashboardSections> = {
  new: {
    welcomeHeader: true,
    primaryAction: true,
    nextStep: false,
    pendingOffers: false,
    activeDeals: false,
    contentReview: false,
    paymentCard: false,
    completedDeals: false,
    creatorHistory: false,
  },
  offer_response_pending: {
    welcomeHeader: true,
    primaryAction: false,
    nextStep: true,
    pendingOffers: true,
    activeDeals: false,
    contentReview: false,
    paymentCard: false,
    completedDeals: false,
    creatorHistory: false,
  },
  content_in_progress: {
    welcomeHeader: true,
    primaryAction: false,
    nextStep: true,
    pendingOffers: false,
    activeDeals: true,
    contentReview: false,
    paymentCard: false,
    completedDeals: false,
    creatorHistory: false,
  },
  content_waiting_approval: {
    welcomeHeader: true,
    primaryAction: false,
    nextStep: true,
    pendingOffers: false,
    activeDeals: true,
    contentReview: true,
    paymentCard: false,
    completedDeals: false,
    creatorHistory: false,
  },
  payment_pending: {
    welcomeHeader: true,
    primaryAction: false,
    nextStep: true,
    pendingOffers: false,
    activeDeals: true,
    contentReview: false,
    paymentCard: true,
    completedDeals: false,
    creatorHistory: false,
  },
  completed: {
    welcomeHeader: true,
    primaryAction: true,
    nextStep: true,
    pendingOffers: false,
    activeDeals: false,
    contentReview: false,
    paymentCard: false,
    completedDeals: true,
    creatorHistory: true,
  },
};

// ============================================
// STATE DETECTION
// ============================================

function detectBrandState(params: {
  hasContentWaitingApproval: boolean;
  hasPaymentPending: boolean;
  hasOfferResponsePending: boolean;
  hasContentInProgress: boolean;
  hasCompletedDeals: boolean;
}): BrandState {
  // Priority 1: Review content (highest urgency)
  if (params.hasContentWaitingApproval) return 'content_waiting_approval';

  // Priority 2: Send payment (approved content)
  if (params.hasPaymentPending) return 'payment_pending';

  // Priority 3: Waiting for creator response to offer
  if (params.hasOfferResponsePending) return 'offer_response_pending';

  // Priority 4: Content being made
  if (params.hasContentInProgress) return 'content_in_progress';

  // Priority 5: Completed deals exist
  if (params.hasCompletedDeals) return 'completed';

  // Default: New brand
  return 'new';
}

// ============================================
// DEAL STATUS HELPERS
// ============================================

function isContentWaitingApproval(deal: BrandDeal): boolean {
  const s = String(deal.status || '').toLowerCase();
  return s.includes('submitted') || s.includes('delivered') || 
         s.includes('awaiting_approval') || s.includes('content_review');
}

function isPaymentPending(deal: BrandDeal): boolean {
  const s = String(deal.status || '').toLowerCase();
  return (s.includes('approved') && !s.includes('payment_received')) ||
         s.includes('payment_pending') || s.includes('awaiting_payment');
}

function isOfferResponsePending(deal: BrandDeal): boolean {
  const s = String(deal.status || '').toLowerCase();
  return s === 'pending' || s === 'sent' || s.includes('awaiting_response') ||
         s.includes('proposal') || s === '';
}

function isContentInProgress(deal: BrandDeal): boolean {
  const s = String(deal.status || '').toLowerCase();
  return s.includes('content') || s.includes('live') || s.includes('making') ||
         s.includes('active') || s.includes('contract_signed') || s.includes('executed');
}

function isCompleted(deal: BrandDeal): boolean {
  const s = String(deal.status || '').toLowerCase();
  return s.includes('completed') || s.includes('payment_received') || s.includes('vested');
}

// ============================================
// URGENCY CALCULATION
// ============================================

function getReviewUrgency(deal: BrandDeal): 'critical' | 'warning' | 'normal' {
  const deadline = deal.due_date ? new Date(deal.due_date) : null;
  if (!deadline) return 'normal';
  
  const hoursLeft = (deadline.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft < 24) return 'critical';
  if (hoursLeft < 48) return 'warning';
  return 'normal';
}

function getOfferExpiryUrgency(deal: BrandDeal): 'critical' | 'warning' | 'normal' {
  const expiresAt = (deal as any).expires_at ? new Date((deal as any).expires_at) : null;
  if (!expiresAt) return 'normal';
  
  const hoursLeft = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft < 24) return 'critical';
  if (hoursLeft < 72) return 'warning';
  return 'normal';
}

// ============================================
// NEXT ACTION LOGIC
// ============================================

function getNextAction(
  state: BrandState,
  deals: BrandDeal[],
  sentOffersCount: number
): BrandNextAction | null {
  switch (state) {
    case 'content_waiting_approval': {
      const deal = deals.find(isContentWaitingApproval);
      if (!deal) return null;
      return {
        type: 'review_content',
        label: 'Review content',
        targetId: deal.id,
        deal,
        urgency: getReviewUrgency(deal),
      };
    }

    case 'payment_pending': {
      const deal = deals.find(isPaymentPending);
      if (!deal) return null;
      return {
        type: 'send_payment',
        label: 'Send payment',
        targetId: deal.id,
        deal,
        urgency: 'critical',
      };
    }

    case 'offer_response_pending': {
      const deal = deals.find(isOfferResponsePending);
      if (!deal) return null;
      return {
        type: 'view_offer',
        label: 'View offer',
        targetId: deal.id,
        deal,
        urgency: getOfferExpiryUrgency(deal),
      };
    }

    case 'content_in_progress': {
      const deal = deals.find(isContentInProgress);
      if (!deal) return null;
      return {
        type: 'view_deal',
        label: 'View deal',
        targetId: deal.id,
        deal,
      };
    }

    case 'completed':
      return { type: 'create_offer', label: 'Send new offer' };

    case 'new':
      return { type: 'create_offer', label: 'Send your first offer' };

    default:
      return null;
  }
}

// ============================================
// HOOK
// ============================================

export function useBrandDashboardState(params: UseBrandDashboardStateParams): BrandDashboardState {
  const { deals, sentOffersCount } = params;

  // Detect deal-based conditions
  const hasContentWaitingApproval = useMemo(() =>
    deals.some(isContentWaitingApproval),
  [deals]);

  const hasPaymentPending = useMemo(() =>
    deals.some(isPaymentPending),
  [deals]);

  const hasOfferResponsePending = useMemo(() =>
    sentOffersCount > 0 || deals.some(isOfferResponsePending),
  [deals, sentOffersCount]);

  const hasContentInProgress = useMemo(() =>
    deals.some(isContentInProgress),
  [deals]);

  const hasCompletedDeals = useMemo(() =>
    deals.some(isCompleted),
  [deals]);

  // Determine state
  const state = useMemo(() =>
    detectBrandState({
      hasContentWaitingApproval,
      hasPaymentPending,
      hasOfferResponsePending,
      hasContentInProgress,
      hasCompletedDeals,
    }),
  [hasContentWaitingApproval, hasPaymentPending, hasOfferResponsePending, hasContentInProgress, hasCompletedDeals]);

  // Get next action
  const nextAction = useMemo(() =>
    getNextAction(state, deals, sentOffersCount),
  [state, deals, sentOffersCount]);

  // Get section config
  const sections = useMemo(() =>
    SECTION_CONFIG[state],
  [state]);

  // Get urgent deal
  const urgentDeal = useMemo(() => {
    if (state === 'content_waiting_approval') return deals.find(isContentWaitingApproval);
    if (state === 'payment_pending') return deals.find(isPaymentPending);
    if (state === 'offer_response_pending') return deals.find(isOfferResponsePending);
    return undefined;
  }, [state, deals]);

  // Counts
  const pendingOffersCount = useMemo(() =>
    deals.filter(isOfferResponsePending).length + sentOffersCount,
  [deals, sentOffersCount]);

  const activeDealsCount = useMemo(() =>
    deals.filter(d => !isCompleted(d) && !isOfferResponsePending(d)).length,
  [deals]);

  const completedDealsCount = useMemo(() =>
    deals.filter(isCompleted).length,
  [deals]);

  const totalSpend = useMemo(() =>
    deals.filter(isCompleted).reduce((sum, d) => sum + (Number(d.deal_amount) || 0), 0),
  [deals]);

  return {
    state,
    nextAction,
    sections,
    urgentDeal,
    pendingOffersCount,
    activeDealsCount,
    completedDealsCount,
    totalSpend,
  };
}

// ============================================
// UTILITY EXPORTS
// ============================================

export { isContentWaitingApproval, isPaymentPending, isOfferResponsePending, isContentInProgress, isCompleted };
