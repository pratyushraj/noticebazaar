"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, Copy, MessageCircle, Instagram } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { GradientCard } from '../GradientCard';
import { IconBubble } from '../IconBubble';

interface SuccessStepProps {
  userName: string;
  userType: string;
  platformsCount: number;
  goalsCount: number;
  onGoToDashboard: () => void;
  /** Full collab link (e.g. https://creatorarmour.com/collab/username) — when set, show Share your collab link card */
  collabLink?: string;
  /** Short label for display (e.g. creatorarmour.com/collab/username) */
  collabShortLabel?: string;
}

/**
 * Success Screen: Onboarding Complete
 * - Celebration animation
 * - Profile summary
 * - CTA to dashboard
 */
export const SuccessStep: React.FC<SuccessStepProps> = ({
  userName,
  userType,
  platformsCount,
  goalsCount,
  onGoToDashboard,
  collabLink,
  collabShortLabel,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!collabLink) return;
    try {
      await navigator.clipboard.writeText(collabLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShareWhatsApp = () => {
    if (!collabLink) return;
    const message = encodeURIComponent(`For collaborations, submit here:\n\n${collabLink}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleShareInstagram = async () => {
    if (!collabLink) return;
    try {
      await navigator.clipboard.writeText(collabLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <GradientCard padding="lg" className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="mb-6"
        >
          <IconBubble
            icon={CheckCircle}
            size="lg"
            color="green"
            className="mx-auto"
          />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-bold leading-tight mb-4">
          You're All Set! 🎉
        </h1>

        {/* Subtitle */}
        <p className="text-xl font-semibold text-white/80 mb-6">
          Welcome to CreatorArmour, {userName}!
        </p>

        {/* Share your collab link — prominent after onboarding */}
        {collabLink && collabShortLabel && (
          <GradientCard padding="md" className="mb-6 text-left max-w-md mx-auto border border-white/20">
            <p className="text-sm font-semibold text-white/90 mb-2">Share your collab link</p>
            <p className="text-xs text-white/60 mb-3">Add to bio or send to brands. Every request is protected.</p>
            <div className="flex items-center gap-2 mb-3">
              <code className="flex-1 min-w-0 truncate text-xs text-white/90 bg-white/10 px-2 py-1.5 rounded border border-white/10">
                {collabShortLabel}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="flex-shrink-0 h-8 px-3 rounded bg-white/20 hover:bg-white/30 border border-white/20 text-white text-xs font-medium flex items-center gap-1.5"
                aria-label="Copy link"
              >
                {copied ? <span className="text-green-400">Copied!</span> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 h-9 rounded border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-medium flex items-center justify-center gap-1.5"
                aria-label="Share via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </button>
              <button
                type="button"
                onClick={handleShareInstagram}
                className="flex-1 h-9 rounded border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-medium flex items-center justify-center gap-1.5"
                aria-label="Share via Instagram (copy link)"
              >
                <Instagram className="w-3.5 h-3.5" /> Instagram
              </button>
            </div>
          </GradientCard>
        )}

        {/* Profile Summary */}
        <GradientCard padding="md" className="mb-8 text-left max-w-md mx-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">User Type</span>
              <span className="text-base font-semibold capitalize">{userType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Platforms</span>
              <span className="text-base font-semibold">{platformsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Goals</span>
              <span className="text-base font-semibold">{goalsCount}</span>
            </div>
          </div>
        </GradientCard>

        {/* CTA Button */}
        <PrimaryButton onClick={onGoToDashboard} icon={<Sparkles className="w-5 h-5" />}>
          Start Protecting My Deals
        </PrimaryButton>
      </GradientCard>
    </motion.div>
  );
};

