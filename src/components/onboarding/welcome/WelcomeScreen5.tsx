"use client";

import React from 'react';
import { LifeBuoy } from 'lucide-react';
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
      name: 'Anjali Sharma',
      role: 'Creator Taxes',
      photo: '/avatars/ca_anjali_sharma.png',
    },
    {
      name: 'Prateek Sharma',
      role: 'Deal Agreements',
      photo: '/avatars/adv_prateek_sharma.png',
    },
  ];

  return (
    <OnboardingSlide>
      <div className="mt-6 md:mt-0 mb-6">
        <IconBubble icon={LifeBuoy} size="lg" color="green" animated />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3 text-muted-foreground dark:text-foreground">
        Expert Backup When Needed
      </h1>

      <p className="text-lg md:text-xl font-semibold text-muted-foreground dark:text-foreground/80 mb-5 md:mb-8">
        Legal + tax support built for creators.
      </p>

      <div className="space-y-3 md:space-y-4 max-w-md w-full mb-5 md:mb-8">
        {advisors.map((advisor, index) => {
          return (
            <GradientCard key={index} padding="md" className="text-left">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden border border-border shadow-sm flex-shrink-0 bg-card">
                  <img
                    src={advisor.photo}
                    alt={advisor.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-base font-semibold mb-1 text-muted-foreground dark:text-foreground">{advisor.name}</div>
                  <div className="text-sm text-muted-foreground dark:text-foreground/60">{advisor.role}</div>
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
