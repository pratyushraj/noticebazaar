"use client";

import React from 'react';
import { Shield } from 'lucide-react';
import { OnboardingSlide } from '../OnboardingSlide';
import { IconBubble } from '../IconBubble';
import { GradientCard } from '../GradientCard';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';

interface WelcomeScreen2Props {
  onNext: () => void;
  onBack: () => void;
}

/**
 * Welcome Screen 2: Protection Features
 * - Stats cards with numbers
 * - Animated shield icon
 * - Back/Next navigation
 */
export const WelcomeScreen2: React.FC<WelcomeScreen2Props> = ({ onNext, onBack }) => {
  const stats = [
    { value: '10,000+', label: 'Contracts Analyzed' },
    { value: '85%', label: 'Issues Caught' },
    { value: '₹2Cr+', label: 'Creator Value Protected' },
  ];

  return (
    <OnboardingSlide>
      {/* Animated Icon */}
      <IconBubble
        icon={Shield}
        size="lg"
        color="green"
        animated
        className="mb-8"
      />

      {/* Title */}
      <h1 className="text-3xl font-bold leading-tight mb-4">
        Never Sign a Bad Deal Again
      </h1>

      {/* Subtitle */}
      <p className="text-xl font-semibold text-white/80 mb-12">
        AI-Powered Contract Protection
      </p>

      {/* Stats Cards */}
      <div className="space-y-4 max-w-md w-full mb-12">
        {stats.map((stat, index) => (
          <GradientCard key={index} padding="md">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {stat.value}
            </div>
            <div className="text-base text-white/80">{stat.label}</div>
          </GradientCard>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <SecondaryButton onClick={onBack} showBackIcon>
          Back
        </SecondaryButton>
        <PrimaryButton onClick={onNext}>Next</PrimaryButton>
      </div>
    </OnboardingSlide>
  );
};

