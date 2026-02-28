"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Link2 } from 'lucide-react';
import { OnboardingSlide } from '../OnboardingSlide';
import { IconBubble } from '../IconBubble';
import { GradientCard } from '../GradientCard';
import { PrimaryButton } from '../PrimaryButton';

interface WelcomeScreen1Props {
  onNext: () => void;
}

/**
 * Welcome Screen 1: Hook (Pain -> Outcome)
 */
export const WelcomeScreen1: React.FC<WelcomeScreen1Props> = ({ onNext }) => {
  return (
    <OnboardingSlide slideKey="welcome-1">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-12 md:mt-0 mb-8"
      >
        <IconBubble icon={Link2} size="lg" color="purple" animated />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="text-2xl md:text-3xl font-bold leading-tight mb-3"
      >
        Stop Negotiating in DMs
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.18 }}
        className="text-lg md:text-xl font-semibold text-white/80 mb-8"
      >
        Turn brand chaos into one professional collab link.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24 }}
        className="max-w-lg w-full mb-8"
      >
        <GradientCard padding="md" className="text-center">
          <div className="text-lg font-semibold mb-2">Share one link</div>
          <p className="text-base text-white/70">
            Brands send offers professionally. No more back-and-forth chats.
          </p>
        </GradientCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mt-6 md:mt-auto w-full max-w-md"
      >
        <PrimaryButton onClick={onNext} className="w-full">Next</PrimaryButton>
      </motion.div>
    </OnboardingSlide>
  );
};
