"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Youtube, Users, Target, CheckCircle } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { GradientCard } from '../GradientCard';
import { IconBubble } from '../IconBubble';
import { SkipButton } from '../SkipButton';

type UserType = 'creator' | 'freelancer' | 'entrepreneur';

interface UserTypeStepProps {
  selectedType: UserType | '';
  onTypeSelect: (type: UserType) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

/**
 * Setup Step 2: User Type Selection
 * - Three option cards
 * - Selection state with checkmark
 */
export const UserTypeStep: React.FC<UserTypeStepProps> = ({
  selectedType,
  onTypeSelect,
  onNext,
  onBack,
  onSkip,
}) => {
  const types: Array<{
    id: UserType;
    icon: typeof Youtube;
    title: string;
    desc: string;
    color: 'purple' | 'blue' | 'green';
  }> = [
    {
      id: 'creator',
      icon: Youtube,
      title: 'Content Creator',
      desc: 'YouTuber, Influencer, Social Media',
      color: 'purple',
    },
    {
      id: 'freelancer',
      icon: Users,
      title: 'Freelancer',
      desc: 'Independent professional',
      color: 'blue',
    },
    {
      id: 'entrepreneur',
      icon: Target,
      title: 'Entrepreneur',
      desc: 'Creator business/agency',
      color: 'green',
    },
  ];

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
        <h2 className="text-3xl font-bold leading-tight mb-8 text-center">
          I am a...
        </h2>

        <div className="space-y-4 mb-6">
          {types.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => onTypeSelect(type.id)}
                className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'bg-purple-600/30 border-purple-400'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                aria-label={`Select ${type.title}`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center gap-4">
                  <IconBubble
                    icon={Icon}
                    size="md"
                    color={type.color}
                    className={isSelected ? 'opacity-100' : 'opacity-70'}
                  />
                  <div className="flex-1">
                    <div className="text-lg font-semibold mb-1">{type.title}</div>
                    <div className="text-sm text-white/60">{type.desc}</div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-6 h-6 text-purple-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-4">
          <SecondaryButton onClick={onBack} showBackIcon>
            Back
          </SecondaryButton>
          <PrimaryButton onClick={onNext} disabled={!selectedType}>
            Continue
          </PrimaryButton>
        </div>
      </GradientCard>
    </motion.div>
    </>
  );
};

