"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { GradientCard } from '../GradientCard';
import { IconBubble } from '../IconBubble';

interface SuccessStepProps {
  userName: string;
  userType: string;
  platformsCount: number;
  goalsCount: number;
  onGoToDashboard: () => void;
}

/**
 * Success Screen: Onboarding Complete
 * - Celebration animation
 * - Profile summary
 * - CTA to dashboard
 */
export const SuccessStep: React.FC<SuccessStepProps> = ({
  userName,
  userType,
  platformsCount,
  goalsCount,
  onGoToDashboard,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <GradientCard padding="lg" className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="mb-6"
        >
          <IconBubble
            icon={CheckCircle}
            size="lg"
            color="green"
            className="mx-auto"
          />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-bold leading-tight mb-4">
          You're All Set! 🎉
        </h1>

        {/* Subtitle */}
        <p className="text-xl font-semibold text-white/80 mb-8">
          Welcome to NoticeBazaar, {userName}!
        </p>

        {/* Profile Summary */}
        <GradientCard padding="md" className="mb-8 text-left max-w-md mx-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">User Type</span>
              <span className="text-base font-semibold capitalize">{userType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Platforms</span>
              <span className="text-base font-semibold">{platformsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Goals</span>
              <span className="text-base font-semibold">{goalsCount}</span>
            </div>
          </div>
        </GradientCard>

        {/* CTA Button */}
        <PrimaryButton onClick={onGoToDashboard} icon={<Sparkles className="w-5 h-5" />}>
          Start Protecting My Deals
        </PrimaryButton>
      </GradientCard>
    </motion.div>
  );
};

