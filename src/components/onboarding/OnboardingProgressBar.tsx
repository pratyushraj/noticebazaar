"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

/**
 * Progress bar for setup steps
 * - Shows "Step X of Y"
 * - Animated progress fill
 */
export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({
  currentStep,
  totalSteps,
  className,
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={cn('mb-8 text-center', className)}>
      <div className="text-sm text-slate-400 dark:text-white/60 mb-2">
        Step {currentStep} of {totalSteps}
      </div>
      <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-gradient-to-r from-emerald-600 to-green-600 h-2 rounded-full"
        />
      </div>
    </div>
  );
};
