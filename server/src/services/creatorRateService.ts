// @ts-nocheck
import { supabase } from '../lib/supabase.js';

/**
 * Creator Rate Service
 * Handles calculation of learned rates and fallback estimations based on follower counts.
 */

// India-focused baseline rate constants (in INR)
const BASE_RATE_PER_FOLLOWER = 0.06; // ~₹1 per 16-17 followers
const MIN_REEL_RATE = 1500;
const MAX_REEL_RATE = 800000;

/**
 * Estimates a creator's reel rate based on their follower count.
 * Fallback when no manual or learned rate is available.
 */
export function estimateReelRate(followers: number | null): number {
    if (!followers || followers <= 0) return MIN_REEL_RATE;

    let estimated = followers * BASE_RATE_PER_FOLLOWER;

    // India market tier floors
    if (followers > 5000000) {
        estimated = Math.max(estimated, 150000);
    } else if (followers > 1000000) {
        estimated = Math.max(estimated, 80000);
    } else if (followers > 500000) {
        estimated = Math.max(estimated, 40000);
    }

    // Nano/micro creator stability floors
    if (followers >= 10000) {
        estimated = Math.max(estimated, 2000);
    } else if (followers >= 5000) {
        estimated = Math.max(estimated, 1500);
    }

    return Math.max(MIN_REEL_RATE, Math.min(MAX_REEL_RATE, Math.round(estimated)));
}

export function estimateReelBudgetRange(rate: number | null): { min: number; max: number } {
    const safeRate = Math.max(MIN_REEL_RATE, Math.round(rate || MIN_REEL_RATE));
    return {
        min: Math.round(safeRate * 0.8),
        max: Math.round(safeRate * 1.2),
    };
}

export function estimateBarterValueRange(rate: number | null): { min: number; max: number } {
    const safeRate = Math.max(MIN_REEL_RATE, Math.round(rate || MIN_REEL_RATE));
    return {
        min: Math.round(safeRate * 0.9),
        max: Math.round(safeRate * 1.3),
    };
}

/**
 * Calculates the effective reel rate using priority: Manual > Learned > Estimated
 */
export function getEffectiveReelRate(profile: any): number {
    if (profile.avg_rate_reel && profile.avg_rate_reel > 0) {
        return profile.avg_rate_reel;
    }

    if (profile.learned_avg_rate_reel && profile.learned_avg_rate_reel > 0) {
        return profile.learned_avg_rate_reel;
    }

    return estimateReelRate(profile.instagram_followers || 0);
}

/**
 * Updates a creator's learned rate based on a newly completed paid deal.
 * Uses a running average calculation.
 */
export async function updateLearnedRateForCreator(creatorId: string, dealAmount: number) {
    try {
        // 1. Fetch current profile data
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('learned_avg_rate_reel, learned_deal_count')
            .eq('id', creatorId)
            .single();

        if (fetchError || !profile) {
            console.error('[CreatorRateService] Failed to fetch profile for rate update:', fetchError);
            return;
        }

        const oldCount = profile.learned_deal_count || 0;
        const oldRate = profile.learned_avg_rate_reel || 0;

        // 2. Calculate new running average
        const newCount = oldCount + 1;
        const newRate = Math.round(((oldRate * oldCount) + dealAmount) / newCount);

        // 3. Update profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                learned_avg_rate_reel: newRate,
                learned_deal_count: newCount,
                updated_at: new Date().toISOString()
            })
            .eq('id', creatorId);

        if (updateError) {
            console.error('[CreatorRateService] Failed to update profile with learned rate:', updateError);
        } else {
            console.log(`[CreatorRateService] Updated learned rate for creator ${creatorId}: ₹${newRate} (${newCount} deals)`);
        }
    } catch (err) {
        console.error('[CreatorRateService] Unexpected error updating learned rate:', err);
    }
}

/**
 * Identifies if a deal qualifies for reel rate learning.
 * Criteria: Paid deal, Status = FULLY_EXECUTED, Deliverables include "Reel".
 */
export function qualifiesForRateLearning(deal: any): boolean {
    if (!deal) return false;

    // Must be a paid deal
    const isPaid = deal.deal_type === 'paid' || (deal.deal_amount && deal.deal_amount > 0);
    if (!isPaid) return false;

    // Check deliverables for "Reel"
    const deliverablesStr = typeof deal.deliverables === 'string'
        ? deal.deliverables
        : JSON.stringify(deal.deliverables || '');

    const hasReel = deliverablesStr.toLowerCase().includes('reel');

    return hasReel;
}
