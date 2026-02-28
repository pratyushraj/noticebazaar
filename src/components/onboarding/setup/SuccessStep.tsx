"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, Copy, MessageCircle, Instagram } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { GradientCard } from '../GradientCard';
import { IconBubble } from '../IconBubble';
import { getCollabReadiness } from '@/lib/collab/readiness';

interface SuccessStepProps {
  userName: string;
  onGoToDashboard: () => void;
  onCompleteCollabProfile?: () => void;
  collabProfile?: Record<string, any> | null;
  /** Full collab link (e.g. https://creatorarmour.com/collab/username) — when set, show Share your collab link card */
  collabLink?: string;
  /** Short label for display (e.g. creatorarmour.com/collab/username) */
  collabShortLabel?: string;
}

/**
 * Success Screen: Onboarding Complete
 * - Celebration animation
 * - Profile summary
 * - CTA to dashboard
 */
export const SuccessStep: React.FC<SuccessStepProps> = ({
  userName,
  onGoToDashboard,
  onCompleteCollabProfile,
  collabProfile,
  collabLink,
  collabShortLabel,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!collabLink) return;
    try {
      await navigator.clipboard.writeText(collabLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShareWhatsApp = () => {
    if (!collabLink) return;
    const message = encodeURIComponent(`For collaborations, submit here:\n\n${collabLink}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleShareInstagram = async () => {
    if (!collabLink) return;
    try {
      await navigator.clipboard.writeText(collabLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const isFilled = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  };

  const readiness = getCollabReadiness({
    instagramHandle: collabProfile?.instagram_handle || collabProfile?.username || null,
    category: collabProfile?.creator_category || collabProfile?.category || null,
    niches: collabProfile?.content_niches || null,
    topCities: collabProfile?.top_cities || null,
    audienceGenderSplit: collabProfile?.audience_gender_split || null,
    primaryAudienceLanguage: collabProfile?.primary_audience_language || null,
    postingFrequency: collabProfile?.posting_frequency || null,
    avgReelViews: collabProfile?.avg_reel_views || collabProfile?.avg_reel_views_manual || null,
    avgLikes: collabProfile?.avg_likes || collabProfile?.avg_likes_manual || null,
    openToCollabs: collabProfile?.open_to_collabs,
    avgRateReel: collabProfile?.avg_rate_reel || null,
    pricingMin: collabProfile?.pricing_min || null,
    pricingAvg: collabProfile?.pricing_avg || null,
    pricingMax: collabProfile?.pricing_max || null,
    suggestedBarterValueMin: collabProfile?.suggested_barter_value_min || null,
    suggestedBarterValueMax: collabProfile?.suggested_barter_value_max || null,
    regionLabel: collabProfile?.collab_region_label || null,
    mediaKitUrl: collabProfile?.media_kit_url || null,
    firstDealCount: collabProfile?.past_brand_count || collabProfile?.collab_brands_count_override || 0,
  });
  const readinessState = readiness.label;
  const readinessTone = readiness.toneClass;
  const hasAudience = isFilled(collabProfile?.top_cities) && (isFilled(collabProfile?.audience_gender_split) || isFilled(collabProfile?.primary_audience_language));
  const hasActivity = isFilled(collabProfile?.posting_frequency) && (isFilled(collabProfile?.avg_reel_views) || isFilled(collabProfile?.avg_likes) || isFilled(collabProfile?.avg_rate_reel));
  const hasCollabSetup = collabProfile?.open_to_collabs !== false && (isFilled(collabProfile?.avg_rate_reel) || isFilled(collabProfile?.suggested_barter_value_min) || isFilled(collabProfile?.suggested_barter_value_max)) && isFilled(collabProfile?.collab_region_label);
  const hasCampaignReady = isFilled(collabProfile?.media_kit_url) || isFilled(collabProfile?.past_brand_count) || isFilled(collabProfile?.collab_brands_count_override);
  const readinessNudge = !hasAudience
    ? 'Add audience city + language to unlock Insight Visible'
    : !hasActivity
      ? 'Add posting frequency + reach to unlock Activity Signal'
      : !hasCollabSetup
        ? 'Add rate/barter preference + region label to unlock Collaboration Ready'
        : 'Keep your page evolving for better-fit brand requests';
  const readinessComplete = readiness.stageKey === 'campaign_ready' || readiness.stageKey === 'collaboration_ready';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <GradientCard padding="lg" className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="mb-6"
        >
          <IconBubble
            icon={CheckCircle}
            size="lg"
            color="green"
            className="mx-auto"
          />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-bold leading-tight mb-4">
          You're All Set! 🎉
        </h1>

        {/* Subtitle */}
        <p className="text-xl font-semibold text-white/80 mb-6">
          Welcome to CreatorArmour, {userName}!
        </p>

        {/* Share your collab link — prominent after onboarding */}
        {collabLink && collabShortLabel && (
          <GradientCard padding="md" className="mb-6 text-left max-w-md mx-auto border border-white/20">
            <p className="text-sm font-semibold text-white/90 mb-2">Share your collab link</p>
            <p className="text-xs text-white/60 mb-3">Add to bio or send to brands. Every request is protected.</p>
            <div className="flex items-center gap-2 mb-3">
              <code className="flex-1 min-w-0 truncate text-xs text-white/90 bg-white/10 px-2 py-1.5 rounded border border-white/10">
                {collabShortLabel}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="flex-shrink-0 h-8 px-3 rounded bg-white/20 hover:bg-white/30 border border-white/20 text-white text-xs font-medium flex items-center gap-1.5"
                aria-label="Copy link"
              >
                {copied ? <span className="text-green-400">Copied!</span> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 h-9 rounded border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-medium flex items-center justify-center gap-1.5"
                aria-label="Share via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </button>
              <button
                type="button"
                onClick={handleShareInstagram}
                className="flex-1 h-9 rounded border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-medium flex items-center justify-center gap-1.5"
                aria-label="Share via Instagram (copy link)"
              >
                <Instagram className="w-3.5 h-3.5" /> Instagram
              </button>
            </div>
          </GradientCard>
        )}

        {/* Collab Page Readiness */}
        <GradientCard padding="md" className="mb-8 text-left max-w-md mx-auto border border-white/20">
          <p className="text-sm font-semibold text-white/90 mb-1">🚀 Make Your Collab Page Brand-Ready</p>
          <p className="text-xs text-white/60 mb-3">
            Brands typically check these before sending offers.
          </p>
          <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium mb-3 ${readinessTone}`}>
            {readinessState}
          </div>
          <div className="space-y-2 mb-4">
            {[
              { label: 'Identity Ready', done: readiness.rank >= 1, help: 'Instagram + category + niche set' },
              { label: 'Insight Visible', done: readiness.rank >= 2, help: 'Audience city + gender/language visible' },
              { label: 'Activity Signal', done: readiness.rank >= 3, help: 'Posting frequency + reach signals added' },
              { label: 'Collaboration Ready', done: readiness.rank >= 4, help: 'Open to collabs + rate/barter + region' },
              { label: 'Campaign Ready', done: readiness.rank >= 5, help: 'Media kit or first deal completed' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2 text-xs">
                <CheckCircle className={`w-3.5 h-3.5 mt-0.5 ${item.done ? 'text-green-400' : 'text-white/30'}`} />
                <div>
                  <span className={item.done ? 'text-white/80' : 'text-white/50'}>{item.label}</span>
                  {!item.done && <p className="text-[11px] text-white/40 mt-0.5">{item.help}</p>}
                </div>
              </div>
            ))}
          </div>
          {!readinessComplete && (
            <p className="text-xs text-white/60 mb-3">{readinessNudge}</p>
          )}
          {readinessComplete && (
            <p className="text-xs text-emerald-300/90 mb-3">Your page now communicates clearly with brands.</p>
          )}
          {!readinessComplete && onCompleteCollabProfile && (
            <button
              type="button"
              onClick={onCompleteCollabProfile}
              className="w-full h-10 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-medium"
            >
              Improve how brands see you
            </button>
          )}
        </GradientCard>

        {/* CTA Button */}
        <PrimaryButton onClick={onGoToDashboard} icon={<Sparkles className="w-5 h-5" />}>
          Complete Deal Settings
        </PrimaryButton>
      </GradientCard>
    </motion.div>
  );
};
