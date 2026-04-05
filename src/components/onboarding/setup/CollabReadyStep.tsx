"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, FileText, Landmark, Loader2, Package2, Smartphone, Sparkles, User } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { GradientCard } from '../GradientCard';

interface CollabReadyStepProps {
  bio: string;
  followers: string;
  brandDealsCompleted: string;
  audienceGenderSplit: string;
  primaryAudienceLanguage: string;
  postingFrequency: string;
  avgReelViewsManual: string;
  avgLikesManual: string;
  starterPrice: string;
  engagementPrice: string;
  productValue: string;
  bankAccountName: string;
  bankUpi: string;
  onBioChange: (value: string) => void;
  onFollowersChange: (value: string) => void;
  onBrandDealsCompletedChange: (value: string) => void;
  onAudienceGenderSplitChange: (value: string) => void;
  onPrimaryAudienceLanguageChange: (value: string) => void;
  onPostingFrequencyChange: (value: string) => void;
  onAvgReelViewsManualChange: (value: string) => void;
  onAvgLikesManualChange: (value: string) => void;
  onStarterPriceChange: (value: string) => void;
  onEngagementPriceChange: (value: string) => void;
  onProductValueChange: (value: string) => void;
  onBankAccountNameChange: (value: string) => void;
  onBankUpiChange: (value: string) => void;
  onGenerateBio: () => void;
  onAutoSuggestPrices: () => void;
  isGeneratingBio?: boolean;
  onBack: () => void;
  onNext: () => void;
}

export const CollabReadyStep: React.FC<CollabReadyStepProps> = ({
  bio,
  followers,
  brandDealsCompleted,
  audienceGenderSplit,
  primaryAudienceLanguage,
  postingFrequency,
  avgReelViewsManual,
  avgLikesManual,
  starterPrice,
  engagementPrice,
  productValue,
  bankAccountName,
  bankUpi,
  onBioChange,
  onFollowersChange,
  onBrandDealsCompletedChange,
  onAudienceGenderSplitChange,
  onPrimaryAudienceLanguageChange,
  onPostingFrequencyChange,
  onAvgReelViewsManualChange,
  onAvgLikesManualChange,
  onStarterPriceChange,
  onEngagementPriceChange,
  onProductValueChange,
  onBankAccountNameChange,
  onBankUpiChange,
  onGenerateBio,
  onAutoSuggestPrices,
  isGeneratingBio = false,
  onBack,
  onNext,
}) => {
  const bioTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const BIO_MAX_HEIGHT = 180;
  const adjustBioHeight = () => {
    const el = bioTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(el.scrollHeight, BIO_MAX_HEIGHT);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > BIO_MAX_HEIGHT ? 'auto' : 'hidden';
  };

  React.useEffect(() => {
    adjustBioHeight();
  }, [bio]);

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
  const bioValid = bio.trim().length >= 20;
  const followersValid = Number(followers) > 0;
  const brandDealsValid = Number(brandDealsCompleted) >= 0;
  const hasAudiencePersona = audienceGenderSplit.trim().length > 0 || primaryAudienceLanguage.trim().length > 0;
  const postingFrequencyValid = postingFrequency.trim().length > 0;
  const hasPerformanceSignal = Number(avgReelViewsManual) > 0 || Number(avgLikesManual) > 0;
  const starterValid = Number(starterPrice) > 0;
  const engagementValid = Number(engagementPrice) > 0;
  const productValid = Number(productValue) > 0;
  const payoutValid = bankUpi.trim().length > 0;
  const canContinue = bioValid && followersValid && brandDealsValid && hasAudiencePersona && postingFrequencyValid && hasPerformanceSignal && starterValid && engagementValid && productValid && payoutValid;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <GradientCard padding="lg" className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold leading-tight mb-2 text-center text-muted-foreground dark:text-foreground">
          Make your collab page complete
        </h2>
        <p className="text-base text-muted-foreground dark:text-foreground/80 text-center mb-8">
          Add audience + pricing signals so your collab page is complete on day one.
        </p>

        <div className="space-y-4 mb-7">
          <label className="block">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground dark:text-foreground/80">
                <FileText className="w-4 h-4" />
                Bio for brands
              </span>
              <button type="button"
                onClick={onGenerateBio}
                disabled={isGeneratingBio}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-2.5 py-1 text-xs font-semibold text-primary transition-all hover:bg-primary disabled:opacity-60 disabled:cursor-not-allowed"
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
            <p className="mb-2 text-xs text-muted-foreground dark:text-foreground/65">
              Tell brands what type of collaborations work best for you.
            </p>
            <textarea
              ref={bioTextareaRef}
              value={bio}
              onChange={(e) => {
                onBioChange(e.target.value);
                adjustBioHeight();
              }}
              onInput={adjustBioHeight}
              rows={2}
              maxLength={280}
              placeholder="Tell brands what you create, audience type, and campaign strengths..."
              className="w-full bg-background dark:bg-card border border-border dark:border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground dark:text-foreground placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-primary transition-colors resize-none"
            />
            <p className="mt-1 text-[11px] text-muted-foreground dark:text-foreground/50">Keep it short and clear (max 280 chars).</p>
          </label>

          <label className="block">
            <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground dark:text-foreground/80">
              <User className="w-4 h-4" />
              Instagram followers
            </span>
            <input
              type="number"
              min={1}
              value={followers}
              onChange={(e) => onFollowersChange(e.target.value)}
              placeholder="e.g. 12000"
              className="w-full bg-background dark:bg-card border border-border dark:border-border rounded-xl px-4 py-3 text-base text-muted-foreground dark:text-foreground placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-primary transition-colors"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground dark:text-foreground/80">
              <User className="w-4 h-4" />
              Brand deals completed
            </span>
            <input
              type="number"
              min={0}
              value={brandDealsCompleted}
              onChange={(e) => onBrandDealsCompletedChange(e.target.value)}
              placeholder="e.g. 12 (enter 0 if none)"
              className="w-full bg-background dark:bg-card border border-border dark:border-border rounded-xl px-4 py-3 text-base text-muted-foreground dark:text-foreground placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-primary transition-colors"
            />
          </label>

          <div className="rounded-xl border border-border dark:border-border bg-background/60 dark:bg-card p-4">
            <p className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground dark:text-foreground/85">
              <BarChart3 className="w-4 h-4" />
              Creator signals
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={audienceGenderSplit}
                onChange={(e) => onAudienceGenderSplitChange(e.target.value)}
                className="w-full bg-card dark:bg-card border border-border dark:border-border rounded-xl px-3 py-2.5 text-sm text-muted-foreground dark:text-foreground outline-none focus:border-primary transition-colors"
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
                className="w-full bg-card dark:bg-card border border-border dark:border-border rounded-xl px-3 py-2.5 text-sm text-muted-foreground dark:text-foreground outline-none focus:border-primary transition-colors"
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
                className="w-full bg-card dark:bg-card border border-border dark:border-border rounded-xl px-3 py-2.5 text-sm text-muted-foreground dark:text-foreground outline-none focus:border-primary transition-colors"
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
                  className="w-full bg-card dark:bg-card border border-border dark:border-border rounded-xl px-3 py-2.5 text-sm text-muted-foreground dark:text-foreground placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-primary transition-colors"
                />
                <input
                  type="number"
                  min={0}
                  value={avgLikesManual}
                  onChange={(e) => onAvgLikesManualChange(e.target.value)}
                  placeholder="Avg likes"
                  className="w-full bg-card dark:bg-card border border-border dark:border-border rounded-xl px-3 py-2.5 text-sm text-muted-foreground dark:text-foreground placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border dark:border-border bg-background/60 dark:bg-card p-4">
            <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground dark:text-foreground/85">
                <Package2 className="w-4 h-4" />
                Your collaboration packages
              </p>
              <button type="button"
                onClick={onAutoSuggestPrices}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2 text-xs font-bold text-foreground shadow-[0_8px_20px_rgba(16,185,129,0.28)] transition-all hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Auto Suggest Prices
              </button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground dark:text-foreground/65">
              Set starting prices brands will see on your collab page.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-border bg-card p-2.5 shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Starter Creator Package</p>
                <ul className="mt-1.5 space-y-0.5 text-[11px] font-semibold text-muted-foreground">
                  <li>• 1 Reel</li>
                  <li>• Basic brand tagging</li>
                </ul>
                <div className="mt-2.5 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">₹</span>
                  <input
                    type="number"
                    min={1}
                    value={starterPrice}
                    onChange={(e) => onStarterPriceChange(e.target.value)}
                    placeholder="e.g. 1,499"
                    className="w-full bg-background border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm font-semibold text-muted-foreground placeholder-slate-400 outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div className="rounded-2xl border-2 border-warning bg-gradient-to-b from-amber-50/60 to-white p-2.5 shadow-[0_8px_18px_rgba(245,158,11,0.15)]">
                <div className="inline-flex rounded-full bg-warning px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-warning">
                  Most Popular
                </div>
                <p className="mt-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Engagement Package</p>
                <ul className="mt-1.5 space-y-0.5 text-[11px] font-semibold text-muted-foreground">
                  <li>• 1 Reel</li>
                  <li>• 2 Story mentions</li>
                  <li>• Link sticker</li>
                </ul>
                <div className="mt-2.5 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">₹</span>
                  <input
                    type="number"
                    min={1}
                    value={engagementPrice}
                    onChange={(e) => onEngagementPriceChange(e.target.value)}
                    placeholder="e.g. 2,999"
                    className="w-full bg-card border border-warning rounded-xl pl-7 pr-3 py-2.5 text-sm font-semibold text-muted-foreground placeholder-slate-400 outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-2.5 shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Product Review (Free Products)</p>
                <ul className="mt-1.5 space-y-0.5 text-[11px] font-semibold text-muted-foreground">
                  <li>• 1 Unboxing</li>
                  <li>• 1 Story mention</li>
                </ul>
                <div className="mt-2.5 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">₹</span>
                  <input
                    type="number"
                    min={1}
                    value={productValue}
                    onChange={(e) => onProductValueChange(e.target.value)}
                    placeholder="Minimum product value"
                    className="w-full bg-background border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm font-semibold text-muted-foreground placeholder-slate-400 placeholder:text-[13px] sm:placeholder:text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
            <p className="mt-2.5 text-[11px] text-muted-foreground dark:text-foreground/65">
              You can change these prices anytime.
            </p>
          </div>

          <div className="rounded-xl border border-border dark:border-border bg-background/60 dark:bg-card p-4">
            <p className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground dark:text-foreground/85">
              <Smartphone className="w-4 h-4" />
              Payment setup
            </p>
            <p className="mb-3 text-xs text-muted-foreground dark:text-foreground/65">
              Brands will use this UPI ID when releasing payment for paid collaborations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground dark:text-foreground/80">
                  <Landmark className="w-4 h-4" />
                  Account holder name
                </span>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => onBankAccountNameChange(e.target.value)}
                  placeholder="Your payout name"
                  className="w-full bg-card dark:bg-card border border-border dark:border-border rounded-xl px-4 py-3 text-base text-muted-foreground dark:text-foreground placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-primary transition-colors"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground dark:text-foreground/80">
                  <Smartphone className="w-4 h-4" />
                  UPI ID
                </span>
                <input
                  type="text"
                  value={bankUpi}
                  onChange={(e) => onBankUpiChange(e.target.value)}
                  placeholder="yourname@upi"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full bg-card dark:bg-card border border-border dark:border-border rounded-xl px-4 py-3 text-base text-muted-foreground dark:text-foreground placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-primary transition-colors"
                />
              </label>
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
