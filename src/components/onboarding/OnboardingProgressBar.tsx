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
      {/* Add top padding on mobile to account for safe area */}
      <div className="pt-[max(60px,calc(env(safe-area-inset-top,0px)+36px))] md:pt-0">
        <div className="text-sm text-white/60 mb-2">
          Step {currentStep} of {totalSteps}
        </div>
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full"
        />
      </div>
      </div>
    </div>
  );
};

