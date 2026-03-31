"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Instagram, Link2, Loader2, XCircle } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { GradientCard } from '../GradientCard';
import { SkipButton } from '../SkipButton';
import { getApiBaseUrl } from '@/lib/utils/api';

interface InstagramStepProps {
  instagramUsername: string;
  onUsernameChange: (username: string) => void;
  error?: string;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

/**
 * Setup Step: Instagram username for collab link
 * Collected right after name so collab link = username from the start.
 */
export const InstagramStep: React.FC<InstagramStepProps> = ({
  instagramUsername,
  onUsernameChange,
  error,
  onNext,
  onBack,
  onSkip,
}) => {
  const [value, setValue] = useState(instagramUsername);
  const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');

  const normalized = value
    .replace(/@/g, '')
    .replace(/\s/g, '')
    .toLowerCase()
    .trim();
  const isValid = normalized.length >= 3;
  const canContinue = isValid && availability !== 'checking' && availability !== 'taken';

  useEffect(() => {
    if (!isValid) {
      setAvailability('idle');
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setAvailability('checking');
      try {
        const apiBaseUrl = getApiBaseUrl();
        const res = await fetch(`${apiBaseUrl}/api/collab/availability/${encodeURIComponent(normalized)}`, {
          method: 'GET',
          signal: controller.signal,
        });

        if (res.ok) {
          const payload = await res.json().catch(() => ({}));
          setAvailability(payload?.available ? 'available' : 'taken');
          return;
        }

        setAvailability('error');
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setAvailability('error');
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [normalized, isValid]);

  const handleNext = () => {
    if (!canContinue) return;
    onUsernameChange(normalized);
    onNext();
  };

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
          <div className="flex items-center justify-center gap-2 mb-2">
            <Instagram className="w-8 h-8 text-pink-500" aria-hidden />
            <Link2 className="w-5 h-5 text-slate-400 dark:text-white/60" aria-hidden />
          </div>
          <h2 className="text-3xl font-bold leading-tight mb-2 text-center text-slate-900 dark:text-white">
            Your Instagram username
          </h2>
          <p className="text-base text-slate-500 dark:text-white/80 text-center mb-6">
            This becomes your collaboration link so brands can find you. Use your handle now, and change it later if needed.
          </p>

          <div className="mb-6">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. your_handle"
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-6 py-4 text-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 outline-none focus:border-blue-500 dark:focus:border-purple-500 transition-colors"
              autoFocus
              aria-label="Instagram username"
              aria-required="false"
            />
            {normalized && (
              <div className="mt-2 space-y-1 text-center">
                <p className="text-sm text-slate-400 dark:text-white/60">
                  Your link: <span className="text-blue-600 dark:text-purple-300 font-medium tracking-tight">creatorarmour.com/{normalized || 'username'}</span>
                </p>
                {availability === 'checking' && (
                  <p className="text-xs font-semibold text-slate-500 inline-flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Checking availability...
                  </p>
                )}
                {availability === 'available' && (
                  <p className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    This handle is available
                  </p>
                )}
                {availability === 'taken' && (
                  <p className="text-xs font-semibold text-rose-600 inline-flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    This handle is already taken. Try another.
                  </p>
                )}
                {availability === 'error' && (
                  <p className="text-xs font-semibold text-amber-600">Could not verify now. You can still try continuing.</p>
                )}
              </div>
            )}
            {error && <p className="mt-3 text-center text-xs font-medium text-rose-600">{error}</p>}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <SecondaryButton onClick={onBack} className="flex-1 order-2 sm:order-1">
              Back
            </SecondaryButton>
            <PrimaryButton
              onClick={handleNext}
              disabled={!canContinue}
              className="flex-1 order-1 sm:order-2"
            >
              Continue
            </PrimaryButton>
          </div>
        </GradientCard>
      </motion.div>
    </>
  );
};
