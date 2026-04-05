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
    suggestedRate?: number;
    onRateChange: (rate: string) => void;
    onDealTypeChange: (type: DealType) => void;
    onBarterValueMinChange: (value: string) => void;
    reelRateError?: string;
    barterValueError?: string;
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
    suggestedRate,
    onRateChange,
    onDealTypeChange,
    onBarterValueMinChange,
    reelRateError,
    barterValueError,
    onNext,
    onBack,
    onSkip,
}) => {
    const parsedRate = Number.parseFloat(reelRate);
    const parsedBarterMin = Number.parseFloat(barterValueMin);
    const effectiveRate = Number.isFinite(parsedRate) && parsedRate > 0
        ? Math.round(parsedRate)
        : (suggestedRate || 0);
    const suggestedMin = effectiveRate > 0 ? Math.round(effectiveRate * 0.8) : 0;
    const suggestedMax = effectiveRate > 0 ? Math.round(effectiveRate * 1.2) : 0;
    const suggestedBarterMin = effectiveRate > 0 ? Math.round(effectiveRate * 0.9) : 0;
    const hasValidRate = Number.isFinite(parsedRate) && parsedRate > 0;
    const hasValidBarterMin = Number.isFinite(parsedBarterMin) && parsedBarterMin > 0;
    const isValidRate =
        (dealType === 'paid' && hasValidRate) ||
        (dealType === 'barter' && hasValidBarterMin) ||
        (dealType === 'hybrid' && hasValidRate && hasValidBarterMin) ||
        (dealType === 'all' && hasValidRate && hasValidBarterMin);

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
                    <div className="w-16 h-16 bg-info dark:bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <IndianRupee className="w-8 h-8 text-info dark:text-secondary" />
                    </div>

                    <h2 className="text-3xl font-bold leading-tight mb-2 text-center text-muted-foreground dark:text-foreground">
                        How do you usually work with brands?
                    </h2>
                    <p className="text-base text-muted-foreground dark:text-foreground/80 text-center mb-8">
                        Set your starting paid rate and barter threshold. You can adjust both later.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                        {[
                            { id: 'paid', icon: Wallet, label: 'Paid Deal' },
                            { id: 'barter', icon: Package, label: 'Product Exchange' },
                            { id: 'hybrid', icon: RefreshCcw, label: 'Cash + Product' },
                            { id: 'all', icon: Layers, label: 'All Deal Types' },
                        ].map((type) => (
                            <button type="button"
                                key={type.id}
                                onClick={() => onDealTypeChange(type.id as DealType)}
                                className={`h-11 rounded-lg border text-[11px] font-black uppercase tracking-tight inline-flex items-center justify-center gap-1.5 transition-all ${dealType === type.id
                                    ? 'bg-info border-info text-info shadow-sm dark:bg-violet-500/30 dark:border-violet-400 dark:text-foreground'
                                    : 'bg-background border-border text-muted-foreground hover:bg-background dark:bg-card dark:border-border dark:text-foreground/70 dark:hover:text-foreground'
                                    }`}
                            >
                                <type.icon className="w-3.5 h-3.5" />
                                {type.label}
                            </button>
                        ))}
                    </div>

                    {(dealType === 'paid' || dealType === 'hybrid' || dealType === 'all') && (
                        <div className="relative mb-4">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-foreground/50 text-xl font-medium">
                                ₹
                            </div>
                            <input
                                type="number"
                                value={reelRate}
                                onChange={(e) => onRateChange(e.target.value)}
                                placeholder="Reel price (e.g. 5000)"
                                className="w-full bg-background dark:bg-card border border-border dark:border-border rounded-xl pl-12 pr-6 py-4 text-xl text-muted-foreground dark:text-foreground placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-info dark:focus:border-purple-500 transition-colors"
                                autoFocus
                                aria-label="Enter your base reel rate"
                            />
                            {suggestedRate && !reelRate && (
                                <div className="mt-4 text-center">
                                    <span className="text-sm text-info dark:text-secondary font-medium">
                                        Suggested: ₹{suggestedRate.toLocaleString('en-IN')}
                                    </span>
                                    <button type="button"
                                        onClick={() => onRateChange(suggestedRate.toString())}
                                        className="ml-2 text-xs text-muted-foreground dark:text-foreground/40 hover:text-muted-foreground dark:hover:text-foreground transition-colors underline"
                                    >
                                        Use this
                                    </button>
                                </div>
                            )}
                            <p className="mt-3 text-xs text-muted-foreground dark:text-foreground/60">
                                Use the amount you would quote for a typical branded reel.
                            </p>
                            {reelRateError && <p className="mt-2 text-xs font-medium text-rose-600">{reelRateError}</p>}
                        </div>
                    )}

                    {(dealType === 'barter' || dealType === 'hybrid' || dealType === 'all') && (
                        <div className="grid grid-cols-1 gap-3 mb-6">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-foreground/50 text-lg font-medium">₹</div>
                                <input
                                    type="number"
                                    value={barterValueMin}
                                    onChange={(e) => onBarterValueMinChange(e.target.value)}
                                    placeholder="Product value"
                                    className="w-full bg-background dark:bg-card border border-border dark:border-border rounded-xl pl-10 pr-4 py-3 text-base text-muted-foreground dark:text-foreground placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-info dark:focus:border-purple-500 transition-colors"
                                    aria-label="Enter minimum product value"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground dark:text-foreground/60">
                                Add the minimum product value you would accept for barter or product-only work.
                            </p>
                            {barterValueError && <p className="text-xs font-medium text-rose-600">{barterValueError}</p>}
                        </div>
                    )}

                    {effectiveRate > 0 && (
                        <div className="mb-6 rounded-xl border border-border dark:border-border bg-background/50 dark:bg-card p-4 text-sm text-muted-foreground dark:text-foreground/80">
                            <p className="font-semibold text-muted-foreground dark:text-foreground mb-2">How this appears to brands:</p>
                            <p>Paid collaboration: ₹{suggestedMin.toLocaleString('en-IN')} - ₹{suggestedMax.toLocaleString('en-IN')}</p>
                            <p>Recommended barter value: ₹{suggestedBarterMin.toLocaleString('en-IN')}+</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <button type="button"
                            onClick={onBack}
                            className="w-full py-4 text-muted-foreground dark:text-foreground/70 font-medium hover:text-muted-foreground dark:hover:text-foreground transition-colors"
                        >
                            Back
                        </button>
                        <PrimaryButton onClick={onNext} disabled={!isValidRate}>
                            Continue
                        </PrimaryButton>
                    </div>

                    <p className="text-xs text-center text-muted-foreground dark:text-foreground/40 mt-6">
                        Don't worry, you can always change this later in your profile settings.
                    </p>
                </GradientCard>
            </motion.div>
        </>
    );
};
