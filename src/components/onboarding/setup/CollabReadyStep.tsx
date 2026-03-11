"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Package2, Users } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { GradientCard } from '../GradientCard';

interface CollabReadyStepProps {
  bio: string;
  followers: string;
  audienceGenderSplit: string;
  primaryAudienceLanguage: string;
  postingFrequency: string;
  avgReelViewsManual: string;
  avgLikesManual: string;
  starterPrice: string;
  engagementPrice: string;
  productValue: string;
  onBioChange: (value: string) => void;
  onFollowersChange: (value: string) => void;
  onAudienceGenderSplitChange: (value: string) => void;
  onPrimaryAudienceLanguageChange: (value: string) => void;
  onPostingFrequencyChange: (value: string) => void;
  onAvgReelViewsManualChange: (value: string) => void;
  onAvgLikesManualChange: (value: string) => void;
  onStarterPriceChange: (value: string) => void;
  onEngagementPriceChange: (value: string) => void;
  onProductValueChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const CollabReadyStep: React.FC<CollabReadyStepProps> = ({
  bio,
  followers,
  audienceGenderSplit,
  primaryAudienceLanguage,
  postingFrequency,
  avgReelViewsManual,
  avgLikesManual,
  starterPrice,
  engagementPrice,
  productValue,
  onBioChange,
  onFollowersChange,
  onAudienceGenderSplitChange,
  onPrimaryAudienceLanguageChange,
  onPostingFrequencyChange,
  onAvgReelViewsManualChange,
  onAvgLikesManualChange,
  onStarterPriceChange,
  onEngagementPriceChange,
  onProductValueChange,
  onBack,
  onNext,
}) => {
  const bioValid = bio.trim().length >= 20;
  const followersValid = Number(followers) > 0;
  const hasAudiencePersona = audienceGenderSplit.trim().length > 0 || primaryAudienceLanguage.trim().length > 0;
  const postingFrequencyValid = postingFrequency.trim().length > 0;
  const hasPerformanceSignal = Number(avgReelViewsManual) > 0 || Number(avgLikesManual) > 0;
  const starterValid = Number(starterPrice) > 0;
  const engagementValid = Number(engagementPrice) > 0;
  const productValid = Number(productValue) > 0;
  const canContinue = bioValid && followersValid && hasAudiencePersona && postingFrequencyValid && hasPerformanceSignal && starterValid && engagementValid && productValid;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <GradientCard padding="lg" className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold leading-tight mb-2 text-center text-slate-900 dark:text-white">
          Make your collab page complete
        </h2>
        <p className="text-base text-slate-500 dark:text-white/80 text-center mb-8">
          Add audience + pricing signals so your collab page is complete on day one.
        </p>

        <div className="space-y-4 mb-7">
          <label className="block">
            <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-white/80">
              <FileText className="w-4 h-4" />
              Bio for brands
            </span>
            <textarea
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              rows={3}
              placeholder="Tell brands what you create, audience type, and campaign strengths..."
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-emerald-500 transition-colors"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-white/80">
              <Users className="w-4 h-4" />
              Instagram followers
            </span>
            <input
              type="number"
              min={1}
              value={followers}
              onChange={(e) => onFollowersChange(e.target.value)}
              placeholder="e.g. 12000"
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-emerald-500 transition-colors"
            />
          </label>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 p-4">
            <p className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-white/85">
              <Users className="w-4 h-4" />
              Audience snapshot
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={audienceGenderSplit}
                onChange={(e) => onAudienceGenderSplitChange(e.target.value)}
                placeholder="Audience split (e.g. 70% Women, 30% Men)"
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-emerald-500 transition-colors"
              />
              <input
                value={primaryAudienceLanguage}
                onChange={(e) => onPrimaryAudienceLanguageChange(e.target.value)}
                placeholder="Primary language (e.g. Hindi + English)"
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-emerald-500 transition-colors"
              />
              <input
                value={postingFrequency}
                onChange={(e) => onPostingFrequencyChange(e.target.value)}
                placeholder="Posting frequency (e.g. 4 posts/week)"
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-emerald-500 transition-colors"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  value={avgReelViewsManual}
                  onChange={(e) => onAvgReelViewsManualChange(e.target.value)}
                  placeholder="Avg views"
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-emerald-500 transition-colors"
                />
                <input
                  type="number"
                  min={0}
                  value={avgLikesManual}
                  onChange={(e) => onAvgLikesManualChange(e.target.value)}
                  placeholder="Avg likes"
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 p-4">
            <p className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-white/85">
              <Package2 className="w-4 h-4" />
              Package pricing
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="number"
                min={1}
                value={starterPrice}
                onChange={(e) => onStarterPriceChange(e.target.value)}
                placeholder="Starter"
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-emerald-500 transition-colors"
              />
              <input
                type="number"
                min={1}
                value={engagementPrice}
                onChange={(e) => onEngagementPriceChange(e.target.value)}
                placeholder="Engagement"
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-emerald-500 transition-colors"
              />
              <input
                type="number"
                min={1}
                value={productValue}
                onChange={(e) => onProductValueChange(e.target.value)}
                placeholder="Product Review"
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SecondaryButton onClick={onBack}>Back</SecondaryButton>
          <PrimaryButton onClick={onNext} disabled={!canContinue}>
            Continue
          </PrimaryButton>
        </div>
      </GradientCard>
    </motion.div>
  );
};
