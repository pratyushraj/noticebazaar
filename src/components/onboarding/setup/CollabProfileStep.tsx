"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, FileText, Loader2, Sparkles, User } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { GradientCard } from '../GradientCard';

interface CollabProfileStepProps {
  bio: string;
  followers: string;
  brandDealsCompleted: string;
  audienceGenderSplit: string;
  primaryAudienceLanguage: string;
  postingFrequency: string;
  avgReelViewsManual: string;
  avgLikesManual: string;
  onBioChange: (value: string) => void;
  onFollowersChange: (value: string) => void;
  onBrandDealsCompletedChange: (value: string) => void;
  onAudienceGenderSplitChange: (value: string) => void;
  onPrimaryAudienceLanguageChange: (value: string) => void;
  onPostingFrequencyChange: (value: string) => void;
  onAvgReelViewsManualChange: (value: string) => void;
  onAvgLikesManualChange: (value: string) => void;
  onGenerateBio: () => void;
  isGeneratingBio?: boolean;
  errors?: {
    bio?: string;
    followers?: string;
    brandDealsCompleted?: string;
    audiencePersona?: string;
    postingFrequency?: string;
    performanceSignal?: string;
  };
  onBack: () => void;
  onNext: () => void;
}

export const CollabProfileStep: React.FC<CollabProfileStepProps> = ({
  bio,
  followers,
  brandDealsCompleted,
  audienceGenderSplit,
  primaryAudienceLanguage,
  postingFrequency,
  avgReelViewsManual,
  avgLikesManual,
  onBioChange,
  onFollowersChange,
  onBrandDealsCompletedChange,
  onAudienceGenderSplitChange,
  onPrimaryAudienceLanguageChange,
  onPostingFrequencyChange,
  onAvgReelViewsManualChange,
  onAvgLikesManualChange,
  onGenerateBio,
  isGeneratingBio = false,
  errors,
  onBack,
  onNext,
}) => {
  const postingFrequencyOptions = [
    'Daily',
    '5-6 posts/week',
    '3-4 posts/week',
    '1-2 posts/week',
    'Weekly',
    'Bi-weekly',
    'Monthly',
  ];
  const primaryLanguageOptions = [
    'Hindi',
    'English',
    'Hindi + English',
    'Tamil',
    'Telugu',
    'Bengali',
    'Marathi',
    'Kannada',
    'Malayalam',
    'Gujarati',
    'Punjabi',
  ];
  const audienceSplitOptions = [
    '70% Women / 30% Men',
    '60% Women / 40% Men',
    '50% Women / 50% Men',
    '40% Women / 60% Men',
    '30% Women / 70% Men',
    'Mostly Women (80%+)',
    'Mostly Men (80%+)',
  ];

  const canContinue =
    bio.trim().length >= 20 &&
    Number(followers) > 0 &&
    Number(brandDealsCompleted) >= 0 &&
    (audienceGenderSplit.trim().length > 0 || primaryAudienceLanguage.trim().length > 0) &&
    postingFrequency.trim().length > 0 &&
    (Number(avgReelViewsManual) > 0 || Number(avgLikesManual) > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <GradientCard padding="lg" className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold leading-tight mb-2 text-center text-slate-900 dark:text-white">
          Build your creator profile
        </h2>
        <p className="text-base text-slate-500 dark:text-white/80 text-center mb-8">
          Add the audience and performance details brands need before they reach out.
        </p>

        <div className="space-y-4 mb-7">
          <label className="block">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-white/80">
                <FileText className="w-4 h-4" />
                Bio for brands
              </span>
              <button
                type="button"
                onClick={onGenerateBio}
                disabled={isGeneratingBio}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGeneratingBio ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Generate
                  </>
                )}
              </button>
            </div>
            <p className="mb-2 text-xs text-slate-500 dark:text-white/65">
              Tell brands what you create, what audience you serve, and what collaborations fit best.
            </p>
            <textarea
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              rows={3}
              maxLength={280}
              placeholder="I create short-form beauty reviews for urban Indian women and work best on launch reels, tutorials, and product storytelling."
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-emerald-500 transition-colors resize-none"
            />
            <p className="mt-1 text-[11px] text-slate-400 dark:text-white/50">Keep it short and useful. Minimum 20 characters.</p>
            {errors?.bio && <p className="mt-2 text-xs font-medium text-rose-600">{errors.bio}</p>}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-white/80">
                <User className="w-4 h-4" />
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
              {errors?.followers && <p className="mt-2 text-xs font-medium text-rose-600">{errors.followers}</p>}
            </label>

            <label className="block">
              <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-white/80">
                <User className="w-4 h-4" />
                Brand deals completed
              </span>
              <input
                type="number"
                min={0}
                value={brandDealsCompleted}
                onChange={(e) => onBrandDealsCompletedChange(e.target.value)}
                placeholder="0 if you are just starting"
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-emerald-500 transition-colors"
              />
              {errors?.brandDealsCompleted && <p className="mt-2 text-xs font-medium text-rose-600">{errors.brandDealsCompleted}</p>}
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 p-4">
            <p className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-white/85">
              <BarChart3 className="w-4 h-4" />
              Creator signals
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={audienceGenderSplit}
                onChange={(e) => onAudienceGenderSplitChange(e.target.value)}
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">Audience split</option>
                {audienceSplitOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={primaryAudienceLanguage}
                onChange={(e) => onPrimaryAudienceLanguageChange(e.target.value)}
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">Primary language</option>
                {primaryLanguageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={postingFrequency}
                onChange={(e) => onPostingFrequencyChange(e.target.value)}
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">Posting frequency</option>
                {postingFrequencyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
            {errors?.audiencePersona && <p className="mt-3 text-xs font-medium text-rose-600">{errors.audiencePersona}</p>}
            {errors?.postingFrequency && <p className="mt-2 text-xs font-medium text-rose-600">{errors.postingFrequency}</p>}
            {errors?.performanceSignal && <p className="mt-2 text-xs font-medium text-rose-600">{errors.performanceSignal}</p>}
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
