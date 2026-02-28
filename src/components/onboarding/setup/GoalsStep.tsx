"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, Target, Zap, MessageCircle, CheckCircle } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { GradientCard } from '../GradientCard';

type Goal = 'protect' | 'earnings' | 'taxes' | 'deals' | 'advice' | 'grow';

interface GoalsStepProps {
  selectedGoals: Goal[];
  onGoalToggle: (goal: Goal) => void;
  onNext: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

/**
 * Setup Step 4: Goals Selection
 * - List of goal options
 * - Multi-select with checkmarks
 */
export const GoalsStep: React.FC<GoalsStepProps> = ({
  selectedGoals,
  onGoalToggle,
  onNext,
  onBack,
  isSubmitting = false,
}) => {
  const goals: Array<{
    id: Goal;
    icon: typeof Shield;
    label: string;
  }> = [
    { id: 'protect', icon: Shield, label: 'Protect myself from bad contracts' },
    { id: 'earnings', icon: TrendingUp, label: 'Track my earnings better' },
    { id: 'taxes', icon: Target, label: 'Handle taxes correctly' },
    { id: 'deals', icon: Zap, label: 'Manage brand deals' },
    { id: 'advice', icon: MessageCircle, label: 'Get legal advice' },
    { id: 'grow', icon: TrendingUp, label: 'Grow my creator business' },
  ];

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
      <GradientCard padding="lg" className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold leading-tight mb-8 text-center">
          What are your goals?
        </h2>

        <div className="space-y-3 mb-6">
          {goals.map((goal) => {
            const Icon = goal.icon;
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <button
                key={goal.id}
                onClick={() => onGoalToggle(goal.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                  isSelected
                    ? 'bg-purple-600/30 border-purple-400'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                aria-label={`Select ${goal.label}`}
                aria-pressed={isSelected}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isSelected ? 'text-purple-300' : 'text-purple-400'
                  }`}
                />
                <span className="flex-1 text-base text-white/80">{goal.label}</span>
                {isSelected && (
                  <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4">
          <SecondaryButton onClick={onBack} showBackIcon>
            Back
          </SecondaryButton>
          <PrimaryButton
            onClick={onNext}
            disabled={selectedGoals.length === 0 || isSubmitting}
            isLoading={isSubmitting}
            icon={isSubmitting ? undefined : undefined}
          >
            {isSubmitting ? 'Setting up...' : 'Complete Setup'}
          </PrimaryButton>
        </div>
      </GradientCard>
    </motion.div>
  );
};
