"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Link2 } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { GradientCard } from '../GradientCard';
import { SkipButton } from '../SkipButton';

interface InstagramStepProps {
  instagramUsername: string;
  onUsernameChange: (username: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

/**
 * Setup Step: Instagram username for collab link
 * Collected right after name so collab link = username from the start.
 */
export const InstagramStep: React.FC<InstagramStepProps> = ({
  instagramUsername,
  onUsernameChange,
  onNext,
  onBack,
  onSkip,
}) => {
  const [value, setValue] = useState(instagramUsername);

  const normalized = value
    .replace(/@/g, '')
    .replace(/\s/g, '')
    .toLowerCase()
    .trim();
  const isValid = normalized.length >= 3;

  const handleNext = () => {
    onUsernameChange(normalized);
    onNext();
  };

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
          <div className="flex items-center justify-center gap-2 mb-2">
            <Instagram className="w-8 h-8 text-pink-400" aria-hidden />
            <Link2 className="w-5 h-5 text-white/60" aria-hidden />
          </div>
          <h2 className="text-3xl font-bold leading-tight mb-2 text-center">
            Your Instagram username
          </h2>
          <p className="text-base text-white/80 text-center mb-6">
            This becomes your collaboration link so brands can find you. Same as your Instagram handle.
          </p>

          <div className="mb-6">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. your_handle"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-lg text-white placeholder-white/50 outline-none focus:border-purple-500 focus:bg-white/10 transition-colors"
              autoFocus
              aria-label="Instagram username"
              aria-required="false"
            />
            {normalized && (
              <p className="text-sm text-white/60 mt-2 text-center">
                Your link: <span className="text-purple-300 font-medium">/collab/{normalized || 'username'}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <SecondaryButton onClick={onBack} className="flex-1 order-2 sm:order-1">
              Back
            </SecondaryButton>
            <PrimaryButton
              onClick={handleNext}
              disabled={!isValid}
              className="flex-1 order-1 sm:order-2"
            >
              Continue
            </PrimaryButton>
          </div>
        </GradientCard>
      </motion.div>
    </>
  );
};
