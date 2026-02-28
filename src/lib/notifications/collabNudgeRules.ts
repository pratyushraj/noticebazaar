export type CollabNudgePriority = 'high' | 'medium' | 'low' | 'positive';

export type CollabNudgeChannel = 'in_app' | 'whatsapp';

export interface CollabNudgeRule {
  key: string;
  priority: CollabNudgePriority;
  delayHours: number;
  channels: CollabNudgeChannel[];
  cooldownHours: number;
  title: string;
  message: string;
}

export interface CollabNudgeContext {
  eventKey: string;
  lastNudgeAt?: string | null;
  alreadyUpdated?: boolean;
  requestSubmitted?: boolean;
  dealInProgress?: boolean;
  missingSignal?: 'audience' | 'activity' | 'collab_setup' | 'campaign_ready' | 'none';
  recentNudgeAt?: string | null;
  profileUpdatedAt?: string | null;
  dealAcceptedAt?: string | null;
  offerReceivedAt?: string | null;
  activeCollaborationsCount?: number;
  pendingOfferCount?: number;
  brandVisitCount24h?: number;
  ignoredNudgesCount?: number;
  lastIgnoredAt?: string | null;
  hasAcceptedFirstDeal?: boolean;
  nudgeCategory?: 'readiness' | 'deal' | 'momentum';
  channelsSentLast7d?: Partial<Record<CollabNudgeChannel, number>>;
}

export const COLLAB_NUDGE_RULES: Record<string, CollabNudgeRule> = {
  post_signup_welcome: {
    key: 'post_signup_welcome',
    priority: 'high',
    delayHours: 0,
    channels: ['in_app', 'whatsapp'],
    cooldownHours: 48,
    title: 'Your collab page is live',
    message: 'Add audience insights so brands know where you reach best.',
  },
  first_brand_visit: {
    key: 'first_brand_visit',
    priority: 'medium',
    delayHours: 12,
    channels: ['in_app', 'whatsapp'],
    cooldownHours: 48,
    title: 'A brand checked your profile today',
    message: 'Adding audience city helps them understand your reach.',
  },
  second_visit_no_request: {
    key: 'second_visit_no_request',
    priority: 'medium',
    delayHours: 24,
    channels: ['in_app'],
    cooldownHours: 48,
    title: 'Brands are exploring your page',
    message: 'Sharing posting frequency builds confidence.',
  },
  first_request: {
    key: 'first_request',
    priority: 'positive',
    delayHours: 0,
    channels: ['in_app', 'whatsapp'],
    cooldownHours: 48,
    title: 'New collaboration request received',
    message: 'Review it inside Creator Armour.',
  },
  first_deal_completed: {
    key: 'first_deal_completed',
    priority: 'positive',
    delayHours: 0,
    channels: ['in_app', 'whatsapp'],
    cooldownHours: 48,
    title: 'You completed your first collaboration',
    message: 'Brands trust creators who show activity.',
  },
  inactive_7d: {
    key: 'inactive_7d',
    priority: 'low',
    delayHours: 0,
    channels: ['in_app'],
    cooldownHours: 168,
    title: 'Keep your collab page fresh',
    message: 'Updating recent activity helps brands reach out faster.',
  },
};

export const shouldSendCollabNudge = (context: CollabNudgeContext): boolean => {
  const rule = COLLAB_NUDGE_RULES[context.eventKey];
  if (!rule) return false;
  if (context.alreadyUpdated || context.requestSubmitted || context.dealInProgress) return false;
  const effectiveLastNudge = context.lastNudgeAt || context.recentNudgeAt;
  if (!effectiveLastNudge) return true;

  const last = new Date(effectiveLastNudge).getTime();
  if (Number.isNaN(last)) return true;
  const elapsedHours = (Date.now() - last) / (1000 * 60 * 60);
  return elapsedHours >= rule.cooldownHours;
};

export const COLLAB_NUDGE_EVENT_PRIORITY: Record<string, number> = {
  first_request: 100,
  first_deal_completed: 95,
  first_brand_visit: 70,
  second_visit_no_request: 60,
  inactive_7d: 40,
  post_signup_welcome: 30,
};

const BEGINNER_EVENTS = new Set(['post_signup_welcome', 'first_brand_visit', 'second_visit_no_request', 'inactive_7d']);
const DEAL_EVENTS = new Set(['first_request', 'first_deal_completed']);

const hoursSince = (value?: string | null): number => {
  if (!value) return Number.POSITIVE_INFINITY;
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return Number.POSITIVE_INFINITY;
  return (Date.now() - ts) / (1000 * 60 * 60);
};

const hasRecentActivitySuppression = (context: CollabNudgeContext) => {
  return hoursSince(context.profileUpdatedAt) < 24 ||
    hoursSince(context.dealAcceptedAt) < 24 ||
    hoursSince(context.offerReceivedAt) < 24;
};

const inSilentPeriod = (context: CollabNudgeContext) => {
  if ((context.ignoredNudgesCount || 0) < 3) return false;
  return hoursSince(context.lastIgnoredAt) < 24 * 7;
};

const signalSpecificMessage = (
  missingSignal: CollabNudgeContext['missingSignal'],
  fallback: string
) => {
  if (missingSignal === 'audience') return 'Adding audience insight helps brands understand where you perform best.';
  if (missingSignal === 'activity') return 'Sharing posting rhythm builds brand confidence.';
  if (missingSignal === 'collab_setup') return 'Indicating availability helps brands approach at the right time.';
  if (missingSignal === 'campaign_ready') return 'Supporting material helps brands move faster.';
  return fallback;
};

export const resolveCollabNudge = (context: CollabNudgeContext): CollabNudgeRule | null => {
  if (!shouldSendCollabNudge(context)) return null;
  const baseRule = COLLAB_NUDGE_RULES[context.eventKey];
  if (!baseRule) return null;
  return {
    ...baseRule,
    message: signalSpecificMessage(context.missingSignal, baseRule.message),
  };
};

export const canSendCollabNudge = (context: CollabNudgeContext): boolean => {
  const rule = COLLAB_NUDGE_RULES[context.eventKey];
  if (!rule) return false;

  if (inSilentPeriod(context)) return false;
  if (!shouldSendCollabNudge(context)) return false;

  const isDealEvent = DEAL_EVENTS.has(context.eventKey);
  const isBeginnerEvent = BEGINNER_EVENTS.has(context.eventKey);
  const isReadinessNudge = (context.nudgeCategory || 'readiness') === 'readiness' && !isDealEvent;

  // Offer override: pending offers suppress non-deal nudges.
  if ((context.pendingOfferCount || 0) > 0 && !isDealEvent) return false;

  // Activity suppression: if creator recently acted, skip nudge.
  if (hasRecentActivitySuppression(context) && !isDealEvent) return false;

  // Suppress profile-improvement nudges when collaboration is active.
  if ((context.activeCollaborationsCount || 0) > 0 && isReadinessNudge) return false;

  // Visit burst protection: one visit-based nudge max per 24h burst.
  if (context.eventKey === 'first_brand_visit' && (context.brandVisitCount24h || 0) > 1 && hoursSince(context.lastNudgeAt || context.recentNudgeAt) < 24) {
    return false;
  }

  // Milestone lock: disable beginner nudges after first accepted deal.
  if (context.hasAcceptedFirstDeal && isBeginnerEvent) return false;

  // WhatsApp safe frequency: max 2 nudges/week.
  const waSent = context.channelsSentLast7d?.whatsapp || 0;
  if (rule.channels.includes('whatsapp') && waSent >= 2) return false;

  return true;
};
