"use client";

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { OnboardingSlide } from '../OnboardingSlide';
import { IconBubble } from '../IconBubble';
import { GradientCard } from '../GradientCard';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';

interface WelcomeScreen3Props {
  onNext: () => void;
  onBack: () => void;
}

/**
 * Welcome Screen 3: Protection Layer
 */
export const WelcomeScreen3: React.FC<WelcomeScreen3Props> = ({ onNext, onBack }) => {
  const stats = [
    { value: '10,000+', label: 'Deals structured' },
    { value: '85%', label: 'Risk clauses flagged' },
    { value: '₹2Cr+', label: 'Creator payments secured' },
  ];

  return (
    <OnboardingSlide>
      <div className="mt-12 md:mt-0 mb-8">
        <IconBubble icon={ShieldCheck} size="lg" color="green" animated />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3">
        Deals That Protect You
      </h1>

      <p className="text-lg md:text-xl font-semibold text-white/80 mb-6 md:mb-10">
        No more &quot;bro trust me&quot; partnerships.
      </p>

      <div className="space-y-3 md:space-y-4 max-w-md w-full mb-6 md:mb-10">
        {stats.map((stat, index) => (
          <GradientCard key={index} padding="md">
            <div className="text-3xl font-bold text-green-400 mb-2">{stat.value}</div>
            <div className="text-base text-white/80">{stat.label}</div>
          </GradientCard>
        ))}
      </div>

      <div className="flex gap-4">
        <SecondaryButton onClick={onBack} showBackIcon>
          Back
        </SecondaryButton>
        <PrimaryButton onClick={onNext}>Next</PrimaryButton>
      </div>
    </OnboardingSlide>
  );
};
