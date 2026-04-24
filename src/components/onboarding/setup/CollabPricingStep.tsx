

import React from 'react';
import { motion } from 'framer-motion';
import { Package2, Sparkles } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { GradientCard } from '../GradientCard';

interface CollabPricingStepProps {
  starterPrice: string;
  engagementPrice: string;
  productValue: string;
  onStarterPriceChange: (value: string) => void;
  onEngagementPriceChange: (value: string) => void;
  onProductValueChange: (value: string) => void;
  onAutoSuggestPrices: () => void;
  errors?: {
    starterPrice?: string;
    engagementPrice?: string;
    productValue?: string;
  };
  onBack: () => void;
  onNext: () => void;
}

export const CollabPricingStep: React.FC<CollabPricingStepProps> = ({
  starterPrice,
  engagementPrice,
  productValue,
  onStarterPriceChange,
  onEngagementPriceChange,
  onProductValueChange,
  onAutoSuggestPrices,
  errors,
  onBack,
  onNext,
}) => {
  const canContinue = Number(starterPrice) > 0 && Number(engagementPrice) > 0 && Number(productValue) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <GradientCard padding="lg" className="max-w-2xl mx-auto">
        <div className="mb-3 flex flex-col items-center gap-3 text-center">
          <h2 className="text-3xl font-bold leading-tight text-muted-foreground dark:text-foreground">
            Set your starter pricing
          </h2>
          <p className="text-base text-muted-foreground dark:text-foreground/80 max-w-xl">
            Add simple starting prices brands can understand fast. You can change these later.
          </p>
          <button
            type="button"
            onClick={onAutoSuggestPrices}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2 text-xs font-bold text-foreground shadow-[0_8px_20px_rgba(16,185,129,0.28)] transition-all hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto Suggest Prices
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
          <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
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
                placeholder="1499"
                className="w-full bg-background border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm font-semibold text-muted-foreground placeholder-slate-400 outline-none focus:border-primary transition-colors"
              />
            </div>
            {errors?.starterPrice && <p className="mt-2 text-xs font-medium text-rose-600">{errors.starterPrice}</p>}
          </div>

          <div className="rounded-2xl border-2 border-warning bg-gradient-to-b from-amber-50/60 to-white p-3 shadow-[0_8px_18px_rgba(245,158,11,0.15)]">
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
                placeholder="2999"
                className="w-full bg-card border border-warning rounded-xl pl-7 pr-3 py-2.5 text-sm font-semibold text-muted-foreground placeholder-slate-400 outline-none focus:border-primary transition-colors"
              />
            </div>
            {errors?.engagementPrice && <p className="mt-2 text-xs font-medium text-rose-600">{errors.engagementPrice}</p>}
          </div>

          <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Product Review (Barter)</p>
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
                className="w-full bg-background border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm font-semibold text-muted-foreground placeholder-slate-400 outline-none focus:border-primary transition-colors"
              />
            </div>
            {errors?.productValue && <p className="mt-2 text-xs font-medium text-rose-600">{errors.productValue}</p>}
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
