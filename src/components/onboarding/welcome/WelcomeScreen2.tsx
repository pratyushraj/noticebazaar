"use client";

import React from 'react';
import { Link2, CheckCircle } from 'lucide-react';
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
 * Welcome Screen 2: Core Product
 */
export const WelcomeScreen2: React.FC<WelcomeScreen2Props> = ({ onNext, onBack }) => {
  const bullets = ['Receive offers', 'Track terms', 'Approve safely'];

  return (
    <OnboardingSlide>
      <div className="mt-12 md:mt-0 mb-8">
        <IconBubble icon={Link2} size="lg" color="purple" animated />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3">
        Your Professional Collab Link
      </h1>

      <p className="text-lg md:text-xl font-semibold text-white/80 mb-6">
        One link for all brand deals.
      </p>

      <div className="space-y-3 max-w-md w-full mb-4">
        {bullets.map((item, index) => (
          <GradientCard key={index} padding="sm">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-base text-white/80">{item}</span>
            </div>
          </GradientCard>
        ))}
      </div>

      <p className="text-sm text-white/65 mb-8">Send this instead of your Instagram bio.</p>

      <div className="flex gap-4">
        <SecondaryButton onClick={onBack} showBackIcon>
          Back
        </SecondaryButton>
        <PrimaryButton onClick={onNext}>Next</PrimaryButton>
      </div>
    </OnboardingSlide>
  );
};
