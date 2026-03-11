"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Clock3, MapPin, Tags } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { GradientCard } from '../GradientCard';

interface CollabBasicsStepProps {
  category: string;
  city: string;
  responseHours: string;
  onCategoryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onResponseHoursChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const CollabBasicsStep: React.FC<CollabBasicsStepProps> = ({
  category,
  city,
  responseHours,
  onCategoryChange,
  onCityChange,
  onResponseHoursChange,
  onNext,
  onBack,
}) => {
  const isValid = category.trim().length >= 2 && city.trim().length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <GradientCard padding="lg" className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold leading-tight mb-2 text-center text-slate-900 dark:text-white">
          Collab page basics
        </h2>
        <p className="text-base text-slate-500 dark:text-white/80 text-center mb-8">
          Add these now so your collab page is ready without extra editing later.
        </p>

        <div className="space-y-4 mb-7">
          <label className="block">
            <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-white/80">
              <Tags className="w-4 h-4" />
              Creator category
            </span>
            <input
              type="text"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              placeholder="e.g. Lifestyle, Beauty, Tech"
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-emerald-500 transition-colors"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-white/80">
              <MapPin className="w-4 h-4" />
              Primary city
            </span>
            <input
              type="text"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder="e.g. Delhi, Mumbai, Bengaluru"
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-emerald-500 transition-colors"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-white/80">
              <Clock3 className="w-4 h-4" />
              Typical response time (hours)
            </span>
            <input
              type="number"
              min={1}
              max={72}
              value={responseHours}
              onChange={(e) => onResponseHoursChange(e.target.value)}
              placeholder="e.g. 3"
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-emerald-500 transition-colors"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SecondaryButton onClick={onBack}>Back</SecondaryButton>
          <PrimaryButton onClick={onNext} disabled={!isValid}>
            Continue
          </PrimaryButton>
        </div>
      </GradientCard>
    </motion.div>
  );
};

