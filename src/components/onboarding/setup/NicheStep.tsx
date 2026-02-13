"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { GradientCard } from '../GradientCard';
import { SkipButton } from '../SkipButton';

export const SUGGESTED_NICHES = [
    'Fashion', 'Fitness', 'Tech', 'Beauty', 'Food', 'Travel', 'Lifestyle',
    'Gaming', 'Education', 'Finance', 'Health', 'Entertainment', 'Parenting',
    'Business', 'Art', 'Music'
] as const;

export type ContentNiche = typeof SUGGESTED_NICHES[number];

interface NicheStepProps {
    selectedNiches: string[];
    onNicheToggle: (niche: string) => void;
    onNext: () => void;
    onBack: () => void;
    onSkip?: () => void;
}

/**
 * Setup Step: Content Niche Selection
 * - Grid of niche tags/cards
 * - Multi-select with checkmarks
 */
export const NicheStep: React.FC<NicheStepProps> = ({
    selectedNiches,
    onNicheToggle,
    onNext,
    onBack,
    onSkip,
}) => {
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
                    <h2 className="text-3xl font-bold leading-tight mb-4 text-center">
                        What is your niche?
                    </h2>
                    <p className="text-white/60 text-center mb-8">
                        Select the topics you create content about. This helps brands find you.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                        {SUGGESTED_NICHES.map((niche) => {
                            const isSelected = selectedNiches.includes(niche);
                            return (
                                <button
                                    key={niche}
                                    onClick={() => onNicheToggle(niche)}
                                    className={`relative py-3 px-4 rounded-xl border transition-all text-sm font-medium ${isSelected
                                            ? 'bg-purple-600/30 border-purple-400 text-white shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]'
                                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                    aria-label={`Select ${niche}`}
                                    aria-pressed={isSelected}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <span>{niche}</span>
                                        {isSelected && (
                                            <CheckCircle className="w-4 h-4 text-purple-400" />
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
                        <PrimaryButton onClick={onNext} disabled={selectedNiches.length === 0}>
                            Continue
                        </PrimaryButton>
                    </div>
                </GradientCard>
            </motion.div>
        </>
    );
};
