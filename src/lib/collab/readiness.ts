export type CollabReadinessStageKey =
  | 'live'
  | 'identity_ready'
  | 'insight_visible'
  | 'activity_signal'
  | 'collaboration_ready'
  | 'campaign_ready';

export interface CollabReadinessInput {
  instagramHandle?: string | null;
  instagramLinked?: boolean;
  category?: string | null;
  niches?: string[] | null;
  topCities?: string[] | null;
  audienceGenderSplit?: string | null;
  primaryAudienceLanguage?: string | null;
  postingFrequency?: string | null;
  avgReelViews?: number | string | null;
  avgLikes?: number | string | null;
  openToCollabs?: boolean | null;
  avgRateReel?: number | string | null;
  pricingMin?: number | string | null;
  pricingAvg?: number | string | null;
  pricingMax?: number | string | null;
  suggestedReelRate?: number | string | null;
  suggestedBarterValueMin?: number | string | null;
  suggestedBarterValueMax?: number | string | null;
  regionLabel?: string | null;
  mediaKitUrl?: string | null;
  firstDealCount?: number | string | null;
}

export interface CollabReadinessResult {
  stageKey: CollabReadinessStageKey;
  label: string;
  rank: number;
  toneClass: string;
  description: string;
  missingSignalMessage?: string;
}

const isFilled = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  return true;
};

const toPositiveNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const collabReadinessToneByStage: Record<CollabReadinessStageKey, string> = {
  live: 'text-slate-300 bg-slate-500/10 border-slate-300/35',
  identity_ready: 'text-slate-200 bg-slate-500/15 border-slate-300/40',
  insight_visible: 'text-teal-200 bg-teal-500/20 border-teal-300/40',
  activity_signal: 'text-blue-200 bg-blue-500/20 border-blue-300/40',
  collaboration_ready: 'text-violet-200 bg-violet-500/20 border-violet-400/40',
  campaign_ready: 'text-amber-100 bg-amber-500/20 border-amber-300/45',
};

const stageMeta: Record<CollabReadinessStageKey, { rank: number; label: string; description: string }> = {
  live: { rank: 0, label: 'Collab Page Live', description: 'Your page is live and visible to brands.' },
  identity_ready: { rank: 1, label: 'Identity Ready', description: 'Your page is now recognizable to brands.' },
  insight_visible: { rank: 2, label: 'Insight Visible', description: 'Brands can understand your audience better.' },
  activity_signal: { rank: 3, label: 'Activity Signal', description: 'Your consistency is visible to brands.' },
  collaboration_ready: { rank: 4, label: 'Collaboration Ready', description: 'You are ready to receive structured offers.' },
  campaign_ready: { rank: 5, label: 'Campaign Ready', description: 'Brands can commit with confidence.' },
};

export const getCollabReadiness = (input: CollabReadinessInput): CollabReadinessResult => {
  const hasInstagram = Boolean(input.instagramLinked) || isFilled(input.instagramHandle);
  const hasCategory = isFilled(input.category);
  const hasNiche = isFilled(input.niches);
  const hasCity = isFilled(input.topCities);
  const hasGender = isFilled(input.audienceGenderSplit);
  const hasLanguage = isFilled(input.primaryAudienceLanguage);
  const hasPostingFrequency = isFilled(input.postingFrequency);
  const hasViewsOrLikes = isFilled(input.avgReelViews) || isFilled(input.avgLikes);
  const isOpenToCollabs = input.openToCollabs !== false;
  const hasRateOrBarter =
    isFilled(input.avgRateReel) ||
    isFilled(input.pricingMin) ||
    isFilled(input.pricingAvg) ||
    isFilled(input.pricingMax) ||
    isFilled(input.suggestedReelRate) ||
    isFilled(input.suggestedBarterValueMin) ||
    isFilled(input.suggestedBarterValueMax);
  const hasRegion = isFilled(input.regionLabel);
  const hasMediaKit = isFilled(input.mediaKitUrl);
  const hasFirstDeal = toPositiveNumber(input.firstDealCount) > 0;

  const identityReady = hasInstagram && hasCategory && hasNiche;
  const insightVisible = identityReady && hasCity && (hasGender || hasLanguage);
  const activitySignal = insightVisible && hasPostingFrequency && hasViewsOrLikes;
  const collaborationReady = activitySignal && isOpenToCollabs && hasRateOrBarter && hasRegion;
  const campaignReady = collaborationReady && (hasMediaKit || hasFirstDeal);

  const stageKey: CollabReadinessStageKey = campaignReady
    ? 'campaign_ready'
    : collaborationReady
      ? 'collaboration_ready'
      : activitySignal
        ? 'activity_signal'
        : insightVisible
          ? 'insight_visible'
          : identityReady
            ? 'identity_ready'
            : 'live';

  let missingSignalMessage: string | undefined;
  if (!identityReady) {
    missingSignalMessage = 'Adding profile identity helps brands quickly understand who you are.';
  } else if (!insightVisible) {
    missingSignalMessage = 'Adding audience insight helps brands understand where you perform best.';
  } else if (!activitySignal) {
    missingSignalMessage = 'Sharing posting rhythm builds brand confidence.';
  } else if (!collaborationReady) {
    missingSignalMessage = 'Indicating availability helps brands approach at the right time.';
  } else if (!campaignReady) {
    missingSignalMessage = 'Supporting material helps brands move faster.';
  }

  return {
    stageKey,
    label: stageMeta[stageKey].label,
    rank: stageMeta[stageKey].rank,
    toneClass: collabReadinessToneByStage[stageKey],
    description: stageMeta[stageKey].description,
    missingSignalMessage,
  };
};
