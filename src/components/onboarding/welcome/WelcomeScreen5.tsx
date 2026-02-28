"use client";

import React from 'react';
import { LifeBuoy, Users, Shield } from 'lucide-react';
import { OnboardingSlide } from '../OnboardingSlide';
import { IconBubble } from '../IconBubble';
import { GradientCard } from '../GradientCard';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';

interface WelcomeScreen5Props {
  onNext: () => void;
  onBack: () => void;
}

/**
 * Welcome Screen 5: Safety Net
 */
export const WelcomeScreen5: React.FC<WelcomeScreen5Props> = ({ onNext, onBack }) => {
  const advisors = [
    {
      icon: Users,
      name: 'Anjali Sharma',
      role: 'Creator Taxes',
      color: 'blue' as const,
    },
    {
      icon: Shield,
      name: 'Prateek Sharma',
      role: 'Brand Contracts',
      color: 'purple' as const,
    },
  ];

  return (
    <OnboardingSlide>
      <div className="mt-12 md:mt-0 mb-8">
        <IconBubble icon={LifeBuoy} size="lg" color="purple" animated />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3">
        Expert Backup When Needed
      </h1>

      <p className="text-lg md:text-xl font-semibold text-white/80 mb-6 md:mb-10">
        Legal + tax support built for creators.
      </p>

      <div className="space-y-3 md:space-y-4 max-w-md w-full mb-6 md:mb-10">
        {advisors.map((advisor, index) => {
          const Icon = advisor.icon;
          return (
            <GradientCard key={index} padding="md" className="text-left">
              <div className="flex items-center gap-4">
                <IconBubble icon={Icon} size="md" color={advisor.color} className="flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-base font-semibold mb-1">{advisor.name}</div>
                  <div className="text-sm text-white/60">{advisor.role}</div>
                </div>
              </div>
            </GradientCard>
          );
        })}
      </div>

      <div className="flex gap-4">
        <SecondaryButton onClick={onBack} showBackIcon>
          Back
        </SecondaryButton>
        <PrimaryButton onClick={onNext}>Get Started</PrimaryButton>
      </div>
    </OnboardingSlide>
  );
};
