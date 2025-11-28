"use client";

import React from 'react';
import { TrendingUp, CheckCircle } from 'lucide-react';
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
 * Welcome Screen 3: Earnings Tracking
 * - Benefit list with checkmarks
 * - Animated trending icon
 * - Back/Next navigation
 */
export const WelcomeScreen3: React.FC<WelcomeScreen3Props> = ({ onNext, onBack }) => {
  const benefits = [
    'Real-time earnings tracking',
    'Payment reminders',
    'Tax calculation & filing',
    'Invoice generation',
  ];

  return (
    <OnboardingSlide>
      {/* Animated Icon */}
      <IconBubble
        icon={TrendingUp}
        size="lg"
        color="blue"
        animated
        animationProps={{
          animate: { scale: [1, 1.1, 1] },
          transition: { duration: 2, repeat: Infinity },
        }}
        className="mb-6 md:mb-8"
      />

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3 md:mb-4">
        Track Every Rupee
      </h1>

      {/* Subtitle */}
      <p className="text-lg md:text-xl font-semibold text-white/80 mb-6 md:mb-12">
        Financial Dashboard Benefits
      </p>

      {/* Benefits List */}
      <div className="space-y-3 max-w-md w-full mb-6 md:mb-12">
        {benefits.map((benefit, index) => (
          <GradientCard key={index} padding="sm">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-base text-white/80">{benefit}</span>
            </div>
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

