/**
 * Partner Program Utilities
 * Helper functions for commission calculation, TDS, and tier management
 */

export type PartnerTier = 'starter' | 'partner' | 'growth' | 'elite' | 'pro';

export interface TDSResult {
  tdsApplied: boolean;
  tdsAmount: number;
  netAmount: number;
}

/**
 * Apply TDS according to Section 194-O rules
 * If yearly payout > ₹15,000 → TDS = 5%
 * Else → No TDS
 */
export function applyTDS(amount: number, userYearlyTotal: number): TDSResult {
  const yearlyThreshold = 15000; // ₹15,000
  const tdsRate = 0.05; // 5%

  const shouldApplyTDS = userYearlyTotal + amount > yearlyThreshold;

  if (shouldApplyTDS) {
    let tdsAmount: number;
    // If user hasn't crossed threshold yet, only apply TDS on amount above threshold
    if (userYearlyTotal < yearlyThreshold) {
      tdsAmount = (userYearlyTotal + amount - yearlyThreshold) * tdsRate;
    } else {
      // Apply TDS on entire amount
      tdsAmount = amount * tdsRate;
    }
    const netAmount = amount - tdsAmount;
    return {
      tdsApplied: true,
      tdsAmount: Math.round(tdsAmount * 100) / 100, // Round to 2 decimal places
      netAmount: Math.round(netAmount * 100) / 100,
    };
  }

  return {
    tdsApplied: false,
    tdsAmount: 0,
    netAmount: amount,
  };
}

/**
 * Get commission rate based on tier
 */
export function getCommissionRate(tier: PartnerTier): number {
  switch (tier) {
    case 'starter':
      return 0.0; // 0%
    case 'partner':
      return 0.20; // 20%
    case 'elite':
      return 0.25; // 25%
    case 'pro':
      return 0.30; // 30%
    default:
      return 0.0;
  }
}

/**
 * Calculate commission amount
 */
export function calculateCommission(
  subscriptionAmount: number,
  tier: PartnerTier
): number {
  const rate = getCommissionRate(tier);
  return Math.round(subscriptionAmount * rate * 100) / 100;
}

/**
 * Get tier based on paid referrals count
 */
export function getTierFromReferrals(paidReferralsCount: number): PartnerTier {
  if (paidReferralsCount >= 100) {
    return 'pro';
  } else if (paidReferralsCount >= 10) {
    return 'elite';
  } else if (paidReferralsCount >= 1) {
    return 'partner';
  }
  return 'starter';
}

/**
 * Get tier benefits description
 */
export function getTierBenefits(tier: PartnerTier): string[] {
  switch (tier) {
    case 'starter':
      return [
        'Earn commissions when referrals subscribe',
        'Track your referral performance',
        'Access partner dashboard',
      ];
    case 'partner':
      return [
        '20% commission per paid subscription',
        'Monthly payouts',
        'All starter benefits',
      ];
    case 'elite':
      return [
        '25% commission per paid subscription',
        'Free Elite Plan unlocked automatically for 12 months',
        'Priority support',
        'All partner benefits',
      ];
    case 'pro':
      return [
        '30% commission per paid subscription',
        'Lifetime Premium subscription',
        'Listed on "Wall of Fame"',
        'Exclusive partner perks',
        'All elite benefits',
      ];
    default:
      return [];
  }
}

/**
 * Get milestone rewards
 */
export interface MilestoneReward {
  milestone: string;
  referralsRequired: number;
  rewardValue: number;
  rewardType: 'voucher';
  voucherBrand: string;
}

export const MILESTONE_REWARDS: MilestoneReward[] = [
  {
    milestone: '5_referrals',
    referralsRequired: 5,
    rewardValue: 250,
    rewardType: 'voucher',
    voucherBrand: 'Amazon',
  },
  {
    milestone: '20_referrals',
    referralsRequired: 20,
    rewardValue: 750,
    rewardType: 'voucher',
    voucherBrand: 'Myntra',
  },
  {
    milestone: '50_referrals',
    referralsRequired: 50,
    rewardValue: 2000,
    rewardType: 'voucher',
    voucherBrand: 'Croma',
  },
  {
    milestone: '100_referrals',
    referralsRequired: 100,
    rewardValue: 5000,
    rewardType: 'voucher',
    voucherBrand: 'Flipkart',
  },
];

/**
 * Format referral link
 */
export function formatReferralLink(code: string): string {
  const baseUrl = import.meta.env.VITE_APP_URL || 'https://noticebazaar.com';
  return `${baseUrl}/p/${code}`;
}

/**
 * Get next tier requirements
 */
export function getNextTierRequirements(
  currentTier: PartnerTier,
  currentPaidReferrals: number
): { tier: PartnerTier; referralsNeeded: number } | null {
  if (currentTier === 'pro') {
    return null; // Already at max tier
  }

  if (currentTier === 'starter') {
    return { tier: 'partner', referralsNeeded: Math.max(0, 1 - currentPaidReferrals) };
  }

  if (currentTier === 'partner') {
    return { tier: 'elite', referralsNeeded: Math.max(0, 10 - currentPaidReferrals) };
  }

  if (currentTier === 'elite') {
    return { tier: 'pro', referralsNeeded: Math.max(0, 100 - currentPaidReferrals) };
  }

  return null;
}

