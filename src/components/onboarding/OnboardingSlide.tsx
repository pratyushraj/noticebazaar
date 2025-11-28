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
        "flex flex-col items-center",
        "flex-1 w-full min-h-0", // Fill container, allow shrinking
        "p-4 md:p-6 pt-10 pb-20 md:pb-16", // More bottom padding on mobile for CTA
        "text-center",
        "overflow-y-auto overscroll-contain", // Allow scrolling, prevent bounce
        "scrollbar-hide", // Hide scrollbar
        className
      )}
    >
      {children}
    </motion.div>
  );
};

