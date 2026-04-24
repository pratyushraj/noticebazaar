

import React from 'react';
import { motion } from 'framer-motion';
import { Landmark, Smartphone } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { GradientCard } from '../GradientCard';

interface PayoutSetupStepProps {
  bankAccountName: string;
  bankUpi: string;
  onBankAccountNameChange: (value: string) => void;
  onBankUpiChange: (value: string) => void;
  bankUpiError?: string;
  onBack: () => void;
  onNext: () => void;
}

export const PayoutSetupStep: React.FC<PayoutSetupStepProps> = ({
  bankAccountName,
  bankUpi,
  onBankAccountNameChange,
  onBankUpiChange,
  bankUpiError,
  onBack,
  onNext,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <GradientCard padding="lg" className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold leading-tight mb-2 text-center text-muted-foreground dark:text-foreground">
          Add payout details later if you want
        </h2>
        <p className="text-base text-muted-foreground dark:text-foreground/80 text-center mb-8">
          You can finish onboarding without payout info. Add it now only if you want brands to have a ready payment method from day one.
        </p>

        <div className="rounded-xl border border-border dark:border-border bg-background/60 dark:bg-card p-4 mb-7">
          <p className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground dark:text-foreground/85">
            <Smartphone className="w-4 h-4" />
            Payment setup
          </p>
          <p className="mb-3 text-xs text-muted-foreground dark:text-foreground/65">
            This is optional right now. You can add or change payout details later from your creator profile.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground dark:text-foreground/80">
                <Landmark className="w-4 h-4" />
                Account holder name
              </span>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => onBankAccountNameChange(e.target.value)}
                placeholder="Your payout name"
                className="w-full bg-card dark:bg-card border border-border dark:border-border rounded-xl px-4 py-3 text-base text-muted-foreground dark:text-foreground placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-primary transition-colors"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground dark:text-foreground/80">
                <Smartphone className="w-4 h-4" />
                UPI ID
              </span>
              <input
                type="text"
                value={bankUpi}
                onChange={(e) => onBankUpiChange(e.target.value)}
                placeholder="yourname@upi"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full bg-card dark:bg-card border border-border dark:border-border rounded-xl px-4 py-3 text-base text-muted-foreground dark:text-foreground placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-primary transition-colors"
              />
              {bankUpiError ? (
                <p className="mt-2 text-xs font-medium text-rose-600">{bankUpiError}</p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground dark:text-foreground/60">Optional for now. If you enter one, it should be valid.</p>
              )}
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SecondaryButton onClick={onBack}>Back</SecondaryButton>
          <PrimaryButton onClick={onNext}>
            Finish setup
          </PrimaryButton>
        </div>
      </GradientCard>
    </motion.div>
  );
};
