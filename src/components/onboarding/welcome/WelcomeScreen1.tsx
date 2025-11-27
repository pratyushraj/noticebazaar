"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Shield, TrendingUp, MessageCircle } from 'lucide-react';
import { OnboardingSlide } from '../OnboardingSlide';
import { IconBubble } from '../IconBubble';
import { GradientCard } from '../GradientCard';
import { PrimaryButton } from '../PrimaryButton';

interface WelcomeScreen1Props {
  onNext: () => void;
}

/**
 * Welcome Screen 1: Introduction to NoticeBazaar
 * - Features grid with 3 cards
 * - Animated icon bubble
 * - Standardized typography and spacing
 */
export const WelcomeScreen1: React.FC<WelcomeScreen1Props> = ({ onNext }) => {
  const features = [
    {
      icon: Shield,
      title: 'AI Contract Review',
      description: 'Get instant analysis in 30 seconds',
      color: 'green' as const,
    },
    {
      icon: TrendingUp,
      title: 'Track Earnings',
      description: 'Monitor payments & income',
      color: 'blue' as const,
    },
    {
      icon: MessageCircle,
      title: 'Legal Advisors',
      description: 'Chat with experts anytime',
      color: 'purple' as const,
    },
  ];

  return (
    <OnboardingSlide slideKey="welcome-1">
      {/* Animated Icon - Fade in */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <IconBubble
          icon={Sparkles}
          size="lg"
          color="purple"
          animated
          animationProps={{
            animate: { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] },
            transition: { duration: 2, repeat: Infinity, repeatDelay: 1 },
          }}
        />
      </motion.div>

      {/* Title - Slide up */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="text-3xl font-bold leading-tight mb-4"
      >
        Welcome to NoticeBazaar
      </motion.h1>

      {/* Subtitle - Slide up */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="text-xl font-semibold text-white/80 mb-12"
      >
        Legal & Tax Services Built for Content Creators
      </motion.p>

      {/* Features Grid - Staggered animations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full mb-12">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.2 + index * 0.1, // Staggered delay
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <GradientCard padding="md" className="text-center">
                <IconBubble
                  icon={Icon}
                  size="md"
                  color={feature.color}
                  className="mx-auto mb-4"
                />
                <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-white/60">{feature.description}</p>
              </GradientCard>
            </motion.div>
          );
        })}
      </div>

      {/* CTA Button - Slide up */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-auto"
      >
        <PrimaryButton onClick={onNext}>Next</PrimaryButton>
      </motion.div>
    </OnboardingSlide>
  );
};

