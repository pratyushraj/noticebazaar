"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OnboardingProgressDotsProps {
  totalSteps: number;
  currentStep: number;
  className?: string;
}

/**
 * Progress indicator dots for onboarding
 * - iOS-style dots with active state animation
 * - Positioned at top center
 */
export const OnboardingProgressDots: React.FC<OnboardingProgressDotsProps> = ({
  totalSteps,
  currentStep,
  className,
}) => {
  return (
    <div
      className={cn(
        "absolute top-6 left-1/2 -translate-x-1/2 z-50",
        "flex gap-2 items-center",
        className
      )}
    >
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index === currentStep;
        return (
          <motion.div
            key={index}
            initial={false}
            animate={{
              width: isActive ? 32 : 8,
              opacity: isActive ? 1 : 0.3,
            }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "h-2 rounded-full",
              isActive ? "bg-white" : "bg-white/30"
            )}
          />
        );
      })}
    </div>
  );
};

