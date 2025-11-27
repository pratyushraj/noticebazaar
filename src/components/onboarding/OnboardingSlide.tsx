"use client";

import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OnboardingSlideProps {
  children: React.ReactNode;
  className?: string;
  animationProps?: MotionProps;
  slideKey?: string; // For AnimatePresence
}

/**
 * Individual onboarding slide wrapper
 * - Beautiful fade-in + subtle slide-up animations
 * - Smooth transitions between slides
 * - Centered content with safe padding
 * - Bottom CTA always visible
 * - Uses flex-1 to fill container (no viewport conflicts)
 */
export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  children,
  className,
  slideKey,
  animationProps,
}) => {
  // Default beautiful animation: fade-in + slide-up
  const defaultAnimation: MotionProps = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30, scale: 0.95 },
    transition: { 
      duration: 0.4, 
      ease: [0.22, 1, 0.36, 1], // iOS-style easing
    },
  };

  return (
    <motion.div
      key={slideKey}
      {...(animationProps || defaultAnimation)}
      className={cn(
        "flex flex-col items-center justify-center",
        "flex-1 w-full", // Fill container, no viewport conflicts
        "p-6 pt-10 pb-16", // Safe padding, bottom CTA space
        "text-center",
        "overflow-y-auto", // Allow scrolling if needed
        "scrollbar-hide", // Hide scrollbar
        className
      )}
    >
      {children}
    </motion.div>
  );
};

