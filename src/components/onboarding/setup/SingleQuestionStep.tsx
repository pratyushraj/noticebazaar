"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { GradientCard } from '../GradientCard';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';

interface SingleQuestionStepProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLoading?: boolean;
  aside?: React.ReactNode;
}

export const SingleQuestionStep: React.FC<SingleQuestionStepProps> = ({
  title,
  description,
  children,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  isLoading = false,
  aside,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <GradientCard padding="lg" className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-base text-slate-500 dark:text-white/80">
              {description}
            </p>
          ) : null}
          {aside ? <div className="mt-4">{aside}</div> : null}
        </div>

        <div className="mb-8">{children}</div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SecondaryButton onClick={onBack} showBackIcon>
            Back
          </SecondaryButton>
          <PrimaryButton onClick={onNext} disabled={nextDisabled} isLoading={isLoading}>
            {nextLabel}
          </PrimaryButton>
        </div>
      </GradientCard>
    </motion.div>
  );
};
