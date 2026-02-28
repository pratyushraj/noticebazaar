"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { PrimaryButton } from '../PrimaryButton';
import { GradientCard } from '../GradientCard';
import { SkipButton } from '../SkipButton';
import { IndianRupee, Package, RefreshCcw, Wallet, Layers } from 'lucide-react';

type DealType = 'paid' | 'barter' | 'hybrid' | 'all';

interface ReelRateStepProps {
    reelRate: string;
    dealType: DealType;
    barterValueMin: string;
    barterValueMax: string;
    suggestedRate?: number;
    onRateChange: (rate: string) => void;
    onDealTypeChange: (type: DealType) => void;
    onBarterValueMinChange: (value: string) => void;
    onBarterValueMaxChange: (value: string) => void;
    onNext: () => void;
    onBack: () => void;
    onSkip?: () => void;
}

/**
 * Setup Step: Reel Rate Input
 * - Number input for typical Reel charge
 * - Standardized card styling
 */
export const ReelRateStep: React.FC<ReelRateStepProps> = ({
    reelRate,
    dealType,
    barterValueMin,
    barterValueMax,
    suggestedRate,
    onRateChange,
    onDealTypeChange,
    onBarterValueMinChange,
    onBarterValueMaxChange,
    onNext,
    onBack,
    onSkip,
}) => {
    const parsedRate = Number.parseFloat(reelRate);
    const parsedBarterMin = Number.parseFloat(barterValueMin);
    const parsedBarterMax = Number.parseFloat(barterValueMax);
    const effectiveRate = Number.isFinite(parsedRate) && parsedRate > 0
        ? Math.round(parsedRate)
        : (suggestedRate || 0);
    const suggestedMin = effectiveRate > 0 ? Math.round(effectiveRate * 0.8) : 0;
    const suggestedMax = effectiveRate > 0 ? Math.round(effectiveRate * 1.2) : 0;
    const suggestedBarterMin = effectiveRate > 0 ? Math.round(effectiveRate * 0.9) : 0;
    const hasValidRate = Number.isFinite(parsedRate) && parsedRate > 0;
    const hasValidBarterMin = Number.isFinite(parsedBarterMin) && parsedBarterMin > 0;
    const hasValidBarterMax = barterValueMax.trim().length === 0 || (Number.isFinite(parsedBarterMax) && parsedBarterMax >= parsedBarterMin);
    const isValidRate =
        (dealType === 'paid' && hasValidRate) ||
        (dealType === 'barter' && hasValidBarterMin && hasValidBarterMax) ||
        (dealType === 'hybrid' && hasValidRate && hasValidBarterMin && hasValidBarterMax);

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
                    <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <IndianRupee className="w-8 h-8 text-purple-400" />
                    </div>

                    <h2 className="text-3xl font-bold leading-tight mb-2 text-center text-white">
                        Set your deal preferences
                    </h2>
                    <p className="text-base text-white/80 text-center mb-8">
                        Brands will see this on your collab link.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                        <button
                            type="button"
                            onClick={() => onDealTypeChange('paid')}
                            className={`h-11 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors ${
                                dealType === 'paid'
                                    ? 'bg-violet-500/30 border-violet-400 text-white'
                                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                            }`}
                        >
                            <Wallet className="w-4 h-4" />
                            Paid Deal
                        </button>
                        <button
                            type="button"
                            onClick={() => onDealTypeChange('barter')}
                            className={`h-11 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors ${
                                dealType === 'barter'
                                    ? 'bg-violet-500/30 border-violet-400 text-white'
                                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                            }`}
                        >
                            <Package className="w-4 h-4" />
                            Product Exchange
                        </button>
                        <button
                            type="button"
                            onClick={() => onDealTypeChange('hybrid')}
                            className={`h-11 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors ${
                                dealType === 'hybrid'
                                    ? 'bg-violet-500/30 border-violet-400 text-white'
                                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                            }`}
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Cash + Product
                        </button>
                        <button
                            type="button"
                            onClick={() => onDealTypeChange('all')}
                            className={`h-11 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors ${
                                dealType === 'all'
                                    ? 'bg-violet-500/30 border-violet-400 text-white'
                                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                            }`}
                        >
                            <Layers className="w-4 h-4" />
                            All Deal Types
                        </button>
                    </div>

                    {(dealType === 'paid' || dealType === 'hybrid' || dealType === 'all') && (
                        <div className="relative mb-4">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 text-xl font-medium">
                                ₹
                            </div>
                            <input
                                type="number"
                                value={reelRate}
                                onChange={(e) => onRateChange(e.target.value)}
                                placeholder="Reel price (e.g. 5000)"
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-4 text-xl text-white placeholder-white/50 outline-none focus:border-purple-500 focus:bg-white/10 transition-colors"
                                autoFocus
                                aria-label="Enter your base reel rate"
                            />
                            {suggestedRate && !reelRate && (
                                <div className="mt-4 text-center">
                                    <span className="text-sm text-purple-400 font-medium">
                                        Suggested: ₹{suggestedRate.toLocaleString('en-IN')}
                                    </span>
                                    <button
                                        onClick={() => onRateChange(suggestedRate.toString())}
                                        className="ml-2 text-xs text-white/40 hover:text-white transition-colors underline"
                                    >
                                        Use this
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {(dealType === 'barter' || dealType === 'hybrid' || dealType === 'all') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-lg font-medium">₹</div>
                                <input
                                    type="number"
                                    value={barterValueMin}
                                    onChange={(e) => onBarterValueMinChange(e.target.value)}
                                    placeholder="Min product value"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-base text-white placeholder-white/50 outline-none focus:border-purple-500 focus:bg-white/10 transition-colors"
                                    aria-label="Enter minimum barter value"
                                />
                            </div>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-lg font-medium">₹</div>
                                <input
                                    type="number"
                                    value={barterValueMax}
                                    onChange={(e) => onBarterValueMaxChange(e.target.value)}
                                    placeholder="Max product value (optional)"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-base text-white placeholder-white/50 outline-none focus:border-purple-500 focus:bg-white/10 transition-colors"
                                    aria-label="Enter maximum barter value"
                                />
                            </div>
                            <p className="md:col-span-2 text-xs text-white/60">
                                Creator reviews value based on audience fit and deliverables.
                            </p>
                        </div>
                    )}

                    {effectiveRate > 0 && (
                        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                            <p className="font-semibold text-white mb-2">How this appears to brands:</p>
                            <p>Paid collaboration: ₹{suggestedMin.toLocaleString('en-IN')} - ₹{suggestedMax.toLocaleString('en-IN')}</p>
                            <p>Recommended barter value: ₹{suggestedBarterMin.toLocaleString('en-IN')}+</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={onBack}
                            className="w-full py-4 text-white/70 font-medium hover:text-white transition-colors"
                        >
                            Back
                        </button>
                        <PrimaryButton onClick={onNext} disabled={!isValidRate}>
                            Continue
                        </PrimaryButton>
                    </div>

                    <p className="text-xs text-center text-white/40 mt-6">
                        Don't worry, you can always change this later in your profile settings.
                    </p>
                </GradientCard>
            </motion.div>
        </>
    );
};
