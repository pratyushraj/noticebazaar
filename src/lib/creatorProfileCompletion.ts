import type { Profile } from '@/types';

export interface CreatorChecklistItem {
  id: 'intro' | 'audience' | 'past_work' | 'media_kit' | 'testimonials';
  title: string;
  description: string;
  weight: number;
  complete: boolean;
  prompt: string;
}

export type CreatorStage = 'new' | 'priced' | 'link_shared' | 'first_offer' | 'first_deal' | 'active' | 'power';

export interface CreatorLifecycleContext {
  offersReceived?: number;
  offersAccepted?: number;
  completedDeals?: number;
  totalDeals?: number;
  totalEarnings?: number;
  storefrontViews?: number;
}

export interface CreatorNudge {
  id: string;
  title: string;
  description: string;
  cta?: string;
  checklistItemId?: CreatorChecklistItem['id'];
  tone?: 'default' | 'success' | 'warning';
}

const hasText = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const hasNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0;
const hasArray = (value: unknown) => Array.isArray(value) && value.length > 0;

const ACTIVE_DEALS_THRESHOLD = 3;
const POWER_DEALS_THRESHOLD = 10;
const POWER_EARNINGS_THRESHOLD = 200000;

const getCompletedDeals = (profile: Partial<Profile> | null | undefined, context?: CreatorLifecycleContext) =>
  Math.max(0, Number(context?.completedDeals ?? profile?.completed_deals ?? 0) || 0);

const getOffersReceived = (profile: Partial<Profile> | null | undefined, context?: CreatorLifecycleContext) =>
  Math.max(0, Number(context?.offersReceived ?? profile?.offers_received ?? 0) || 0);

const getOffersAccepted = (profile: Partial<Profile> | null | undefined, context?: CreatorLifecycleContext) =>
  Math.max(0, Number(context?.offersAccepted ?? profile?.offers_accepted ?? 0) || 0);

const getTotalDeals = (profile: Partial<Profile> | null | undefined, context?: CreatorLifecycleContext) =>
  Math.max(0, Number(context?.totalDeals ?? profile?.total_deals ?? getOffersAccepted(profile, context) ?? 0) || 0);

const getTotalEarnings = (profile: Partial<Profile> | null | undefined, context?: CreatorLifecycleContext) =>
  Math.max(0, Number(context?.totalEarnings ?? profile?.total_earnings ?? 0) || 0);

const getStorefrontViews = (profile: Partial<Profile> | null | undefined, context?: CreatorLifecycleContext) =>
  Math.max(0, Number(context?.storefrontViews ?? profile?.storefront_views ?? 0) || 0);

export const getCreatorChecklistItems = (profile: Partial<Profile> | null | undefined): CreatorChecklistItem[] => {
  const followers = Number((profile as any)?.followers_count ?? profile?.instagram_followers ?? 0);
  const avgViews = Number((profile as any)?.avg_views ?? profile?.avg_reel_views_manual ?? 0);

  return [
    {
      id: 'intro',
      title: 'Add a short intro',
      description: 'Tell brands what you create and why your audience fits.',
      weight: 30,
      complete: hasText(profile?.bio) || hasText(profile?.collab_intro_line),
      prompt: 'Add a short intro so brands understand your vibe in one glance.',
    },
    {
      id: 'audience',
      title: 'Add audience basics',
      description: 'Share niche, city, language, followers, and rough views.',
      weight: 25,
      complete: (
        (hasArray(profile?.content_niches) || hasText((profile as any)?.niche)) &&
        (hasText(profile?.primary_audience_language) || hasText((profile as any)?.language)) &&
        (hasArray(profile?.top_cities) || hasText((profile as any)?.city)) &&
        (followers > 0 || avgViews > 0)
      ),
      prompt: 'A little audience context helps brands trust your fit faster.',
    },
    {
      id: 'past_work',
      title: 'Add past work',
      description: 'Show previous brand work or creator proof.',
      weight: 20,
      complete: hasArray((profile as any)?.past_collabs) || hasArray(profile?.collab_past_work_items) || hasArray((profile as any)?.brand_logos),
      prompt: 'Even 1-2 past collaborations make your storefront feel real.',
    },
    {
      id: 'media_kit',
      title: 'Add media kit',
      description: 'Share a deck or Notion page with more detail.',
      weight: 15,
      complete: hasText(profile?.media_kit_url),
      prompt: 'A media kit helps serious brands move from interest to brief faster.',
    },
    {
      id: 'testimonials',
      title: 'Add testimonials',
      description: 'Show brand feedback or social proof.',
      weight: 10,
      complete: hasArray((profile as any)?.testimonials) || hasArray((profile as any)?.case_studies),
      prompt: 'Testimonials are lightweight trust signals that help first-time brands book.',
    },
  ];
};

export const getCreatorCompletionMetrics = (profile: Partial<Profile> | null | undefined) => {
  const items = getCreatorChecklistItems(profile);
  const completedWeight = items.reduce((sum, item) => sum + (item.complete ? item.weight : 0), 0);
  const storefrontWeight = items
    .filter((item) => ['intro', 'audience', 'past_work', 'media_kit', 'testimonials'].includes(item.id))
    .reduce((sum, item) => sum + (item.complete ? item.weight : 0), 0);
  const storefrontMaxWeight = items
    .filter((item) => ['intro', 'audience', 'past_work', 'media_kit', 'testimonials'].includes(item.id))
    .reduce((sum, item) => sum + item.weight, 0);

  return {
    items,
    profileCompletion: Math.min(100, completedWeight),
    storefrontCompletion: storefrontMaxWeight > 0 ? Math.min(100, Math.round((storefrontWeight / storefrontMaxWeight) * 100)) : 0,
    completedCount: items.filter((item) => item.complete).length,
  };
};

export const getCreatorStage = (
  profile: Partial<Profile> | null | undefined,
  context?: CreatorLifecycleContext,
): CreatorStage => {
  const totalEarnings = getTotalEarnings(profile, context);
  const totalDeals = getTotalDeals(profile, context);
  const completedDeals = getCompletedDeals(profile, context);
  const offersReceived = getOffersReceived(profile, context);
  const hasSharedLink = Boolean(profile?.link_shared_at);

  if (completedDeals >= POWER_DEALS_THRESHOLD || totalEarnings >= POWER_EARNINGS_THRESHOLD) return 'power';
  if (completedDeals >= ACTIVE_DEALS_THRESHOLD || totalDeals >= ACTIVE_DEALS_THRESHOLD) return 'active';
  if (completedDeals > 0) return 'first_deal';
  if (offersReceived > 0 || totalDeals > 0) return 'first_offer';
  if (hasSharedLink) return 'link_shared';
  return 'new';
};

export const getCreatorLifecycleMetrics = (
  profile: Partial<Profile> | null | undefined,
  context?: CreatorLifecycleContext,
) => {
  const completion = getCreatorCompletionMetrics(profile);
  const offersReceived = getOffersReceived(profile, context);
  const offersAccepted = getOffersAccepted(profile, context);
  const completedDeals = getCompletedDeals(profile, context);
  const totalDeals = getTotalDeals(profile, context);
  const totalEarnings = getTotalEarnings(profile, context);
  const storefrontViews = getStorefrontViews(profile, context);
  const creatorStage = getCreatorStage(profile, context);

  return {
    creatorStage,
    offersReceived,
    offersAccepted,
    completedDeals,
    totalDeals,
    totalEarnings,
    storefrontViews,
    conversionRate: offersReceived > 0 ? Math.round((offersAccepted / offersReceived) * 100) : 0,
    profileCompletion: completion.profileCompletion,
    storefrontCompletion: completion.storefrontCompletion,
    items: completion.items,
  };
};

export const getCreatorNudges = (
  profile: Partial<Profile> | null | undefined,
  context?: CreatorLifecycleContext,
): CreatorNudge[] => {
  const completion = getCreatorCompletionMetrics(profile);
  const lifecycle = getCreatorLifecycleMetrics(profile, context);
  const nudges: CreatorNudge[] = [];
  const daysSinceSignup = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (!completion.items.find((item) => item.id === 'intro')?.complete) {
    nudges.push({
      id: 'missing-intro',
      title: 'Creators with an intro get more brand inquiries.',
      description: 'A two-line intro helps brands understand your niche and fit quickly.',
      cta: 'Add intro',
      checklistItemId: 'intro',
    });
  }

  if (!completion.items.find((item) => item.id === 'past_work')?.complete) {
    nudges.push({
      id: 'missing-proof',
      title: 'Add past collaborations to build trust with brands.',
      description: 'Even one campaign or logo makes your storefront feel more credible.',
      cta: 'Add past work',
      checklistItemId: 'past_work',
    });
  }

  if (completion.profileCompletion < 50) {
    nudges.push({
      id: 'low-completion',
      title: 'Add just enough detail to help brands trust your page.',
      description: `Your collab page is ${completion.profileCompletion}% complete right now.`,
      cta: 'Improve page',
      tone: 'warning',
    });
  }

  if (lifecycle.offersReceived === 0 && daysSinceSignup >= 3) {
    nudges.push({
      id: 'no-offers-yet',
      title: 'Share your collab link with brands or add it to your Instagram bio.',
      description: 'No offers yet. The next unlock is getting your link in front of real brands.',
      cta: 'Share link',
      tone: 'warning',
    });
  }

  if (lifecycle.offersReceived > 0) {
    nudges.push({
      id: 'first-offer',
      title: 'You received your first offer! Review and respond.',
      description: 'We will ask for price, address, or payout details only if this deal needs them.',
      cta: 'Review offers',
      tone: 'success',
    });
  }

  if (lifecycle.completedDeals > 0) {
    nudges.push({
      id: 'first-deal-complete',
      title: 'Great job! Add this collaboration to your past work section.',
      description: 'Completed deals become proof for future brands.',
      cta: 'Update past work',
      checklistItemId: 'past_work',
      tone: 'success',
    });
  }

  return nudges.slice(0, 4);
};

export const getCreatorProgressPatch = (
  profile: Partial<Profile> | null | undefined,
  context?: CreatorLifecycleContext,
) => {
  const lifecycle = getCreatorLifecycleMetrics(profile, context);

  return {
    creator_stage: lifecycle.creatorStage,
    profile_completion: lifecycle.profileCompletion,
    storefront_completion: lifecycle.storefrontCompletion,
    offers_received: lifecycle.offersReceived,
    offers_accepted: lifecycle.offersAccepted,
    completed_deals: lifecycle.completedDeals,
    total_deals: lifecycle.totalDeals,
    total_earnings: lifecycle.totalEarnings,
    storefront_views: lifecycle.storefrontViews,
    conversion_rate: lifecycle.conversionRate,
  };
};
