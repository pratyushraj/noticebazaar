"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { PrimaryButton } from '../PrimaryButton';
import { GradientCard } from '../GradientCard';
import { SkipButton } from '../SkipButton';

interface NameStepProps {
  name: string;
  onNameChange: (name: string) => void;
  onNext: () => void;
  onSkip?: () => void;
}

/**
 * Setup Step 1: Name Input
 * - Text input with validation
 * - Standardized card styling
 * - Optional skip button
 */
export const NameStep: React.FC<NameStepProps> = ({ 
  name, 
  onNameChange, 
  onNext,
  onSkip,
}) => {
  return (
    <>
      {onSkip && <SkipButton onClick={onSkip} />}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <GradientCard padding="lg" className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold leading-tight mb-2 text-center">
            What's your name?
          </h2>
          <p className="text-base text-white/80 text-center mb-8">
            Let's personalize your experience
          </p>

          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-lg text-white placeholder-white/50 outline-none focus:border-purple-500 focus:bg-white/10 transition-colors mb-6"
            autoFocus
            aria-label="Enter your name"
            aria-required="false"
          />

          <PrimaryButton onClick={onNext} disabled={!name.trim()}>
            Continue
          </PrimaryButton>
        </GradientCard>
      </motion.div>
    </>
  );
};

