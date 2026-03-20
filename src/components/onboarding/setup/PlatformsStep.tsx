"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Youtube, Instagram, Twitter, Linkedin, Globe, Podcast, CheckCircle } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { GradientCard } from '../GradientCard';
import { SkipButton } from '../SkipButton';

type Platform = 'youtube' | 'instagram' | 'twitter' | 'linkedin' | 'website' | 'podcast';

interface PlatformsStepProps {
  selectedPlatforms: Platform[];
  onPlatformToggle: (platform: Platform) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

/**
 * Setup Step 3: Platform Selection
 * - Grid of platform cards
 * - Multi-select with checkmarks
 */
export const PlatformsStep: React.FC<PlatformsStepProps> = ({
  selectedPlatforms,
  onPlatformToggle,
  onNext,
  onBack,
  onSkip,
}) => {
  const platforms: Array<{
    id: Platform;
    icon: typeof Youtube;
    label: string;
    color: string;
  }> = [
    { id: 'youtube', icon: Youtube, label: 'YouTube', color: 'bg-red-500' },
    { id: 'instagram', icon: Instagram, label: 'Instagram', color: 'bg-pink-500' },
    { id: 'twitter', icon: Twitter, label: 'Twitter', color: 'bg-blue-400' },
    { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: 'bg-blue-600' },
    { id: 'website', icon: Globe, label: 'Website/Blog', color: 'bg-purple-500' },
    { id: 'podcast', icon: Podcast, label: 'Podcast', color: 'bg-orange-500' },
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
          Where do you create?
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isSelected = selectedPlatforms.includes(platform.id);
            return (
              <button
                key={platform.id}
                onClick={() => onPlatformToggle(platform.id)}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'bg-purple-600/30 border-purple-400'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                aria-label={`Select ${platform.label}`}
                aria-pressed={isSelected}
              >
                <div
                  className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center mb-2 mx-auto`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm font-medium text-center">{platform.label}</div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4">
          <SecondaryButton onClick={onBack} showBackIcon>
            Back
          </SecondaryButton>
          <PrimaryButton onClick={onNext} disabled={selectedPlatforms.length === 0}>
            Continue
          </PrimaryButton>
        </div>
      </GradientCard>
    </motion.div>
    </>
  );
};

