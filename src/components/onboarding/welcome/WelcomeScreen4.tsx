"use client";

import React from 'react';
import { TrendingUp, CheckCircle } from 'lucide-react';
import { OnboardingSlide } from '../OnboardingSlide';
import { IconBubble } from '../IconBubble';
import { GradientCard } from '../GradientCard';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';

interface WelcomeScreen4Props {
  onNext: () => void;
  onBack: () => void;
}

/**
 * Welcome Screen 4: Earnings Layer
 */
export const WelcomeScreen4: React.FC<WelcomeScreen4Props> = ({ onNext, onBack }) => {
  const benefits = [
    'Real-time earnings',
    'Auto invoices',
    'Payment reminders',
    'Tax-ready reports',
  ];

  return (
    <OnboardingSlide>
      <div className="mt-12 md:mt-0 mb-8">
        <IconBubble
          icon={TrendingUp}
          size="lg"
          color="blue"
          animated
          animationProps={{
            animate: { scale: [1, 1.1, 1] },
            transition: { duration: 2, repeat: Infinity },
          }}
        />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3">
        Know What You Earn
      </h1>

      <p className="text-lg md:text-xl font-semibold text-white/80 mb-6 md:mb-10">
        Every deal tracked automatically.
      </p>

      <div className="space-y-3 max-w-md w-full mb-6 md:mb-10">
        {benefits.map((benefit, index) => (
          <GradientCard key={index} padding="sm">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-base text-white/80">{benefit}</span>
            </div>
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
