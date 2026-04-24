

import React from 'react';
import { motion } from 'framer-motion';
import { Clock3, MapPin } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { GradientCard } from '../GradientCard';

interface CollabBasicsStepProps {
  city: string;
  responseHours: string;
  onCityChange: (value: string) => void;
  onResponseHoursChange: (value: string) => void;
  cityError?: string;
  onNext: () => void;
  onBack: () => void;
}

export const CollabBasicsStep: React.FC<CollabBasicsStepProps> = ({
  city,
  responseHours,
  onCityChange,
  onResponseHoursChange,
  cityError,
  onNext,
  onBack,
}) => {
  const isValid = city.trim().length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <GradientCard padding="lg" className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold leading-tight mb-2 text-center text-muted-foreground dark:text-foreground">
          Collab page basics
        </h2>
        <p className="text-base text-muted-foreground dark:text-foreground/80 text-center mb-8">
          Add audience location + response time so brands can evaluate fit fast.
        </p>

        <div className="space-y-4 mb-7">
          <label className="block">
            <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground dark:text-foreground/80">
              <MapPin className="w-4 h-4" />
              Top audience city
            </span>
            <input
              type="text"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder="e.g. Delhi, Mumbai, Bengaluru"
              className="w-full bg-background dark:bg-card border border-border dark:border-border rounded-xl px-4 py-3.5 text-base text-muted-foreground dark:text-foreground placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-primary transition-colors"
            />
            <p className="mt-2 text-xs text-muted-foreground dark:text-foreground/60">This helps brands quickly judge audience fit and regional relevance.</p>
            {cityError && <p className="mt-2 text-xs font-medium text-rose-600">{cityError}</p>}
          </label>

          <label className="block">
            <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground dark:text-foreground/80">
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
              className="w-full bg-background dark:bg-card border border-border dark:border-border rounded-xl px-4 py-3.5 text-base text-muted-foreground dark:text-foreground placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-primary transition-colors"
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
