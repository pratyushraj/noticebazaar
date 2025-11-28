"use client";

import React from 'react';
import { MessageCircle, Users, Shield } from 'lucide-react';
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
 * Welcome Screen 4: Expert Support
 * - Advisor cards
 * - Animated message icon
 * - Back/Get Started navigation
 */
export const WelcomeScreen4: React.FC<WelcomeScreen4Props> = ({ onNext, onBack }) => {
  const advisors = [
    {
      icon: Users,
      name: 'Anjali Sharma',
      role: 'CA, Creator Taxes',
      color: 'blue' as const,
    },
    {
      icon: Shield,
      name: 'Prateek Sharma',
      role: 'Legal Advisor, Brand Contracts',
      color: 'purple' as const,
    },
  ];

  return (
    <OnboardingSlide>
      {/* Animated Icon */}
      <IconBubble
        icon={MessageCircle}
        size="lg"
        color="purple"
        animated
        className="mb-6 md:mb-8"
      />

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3 md:mb-4">
        Expert Help When You Need It
      </h1>

      {/* Subtitle */}
      <p className="text-lg md:text-xl font-semibold text-white/80 mb-6 md:mb-12">
        Connect with Legal & Tax Advisors
      </p>

      {/* Advisor Cards */}
      <div className="space-y-3 md:space-y-4 max-w-md w-full mb-6 md:mb-12">
        {advisors.map((advisor, index) => {
          const Icon = advisor.icon;
          return (
            <GradientCard key={index} padding="md" className="text-left">
              <div className="flex items-center gap-4">
                <IconBubble
                  icon={Icon}
                  size="md"
                  color={advisor.color}
                  className="flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="text-base font-semibold mb-1">
                    {advisor.name}
                  </div>
                  <div className="text-sm text-white/60">{advisor.role}</div>
                </div>
              </div>
            </GradientCard>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <SecondaryButton onClick={onBack} showBackIcon>
          Back
        </SecondaryButton>
        <PrimaryButton onClick={onNext}>Get Started</PrimaryButton>
      </div>
    </OnboardingSlide>
  );
};

