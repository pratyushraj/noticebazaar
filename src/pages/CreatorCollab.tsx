"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Copy, Shield, Briefcase, ChevronRight, ExternalLink, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { sectionLayout, animations, spacing, typography, separators, iconSizes, sectionHeader, radius, vision, motion as motionTokens } from '@/lib/design-system';
import { BaseCard } from '@/components/ui/card-variants';
import CollabRequestsSection from '@/components/collab/CollabRequestsSection';
import CollabLinkAnalytics from '@/components/collab/CollabLinkAnalytics';
import { CreatorNavigationWrapper } from '@/components/navigation/CreatorNavigationWrapper';

const CreatorCollab = () => {
  const navigate = useNavigate();
  const { profile } = useSession();

  return (
    <CreatorNavigationWrapper title="Collaboration" subtitle="Manage your collaboration requests and tools">
      <div className={cn(sectionLayout.container, spacing.loose, "pb-24")}>
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className={cn(typography.h1, "mb-2")}>Collaboration Tools</h1>
          <p className={cn(typography.body, "text-purple-200/80")}>
            Let brands send you structured collaboration requests instead of DMs.
          </p>
        </div>

        {/* Collaboration Tools Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* Card 1: Collab Link */}
          <BaseCard variant="tertiary" className="p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Link2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(typography.h4, "font-semibold mb-1")}>Collab Link</h3>
                    <p className={cn(typography.caption, "text-purple-300/70")}>
                      Let brands send you structured collaboration requests instead of DMs.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs font-medium rounded-full whitespace-nowrap">
                  Recommended
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <motion.button
                  onClick={() => {
                    const usernameForLink = profile?.instagram_handle || profile?.username;
                    if (usernameForLink) {
                      const link = `${window.location.origin}/collab/${usernameForLink}`;
                      navigator.clipboard.writeText(link);
                      toast.success('Collab link copied to clipboard!');
                      triggerHaptic(HapticPatterns.light);
                    } else {
                      toast.error('Username not set. Please update your profile.');
                    }
                  }}
                  whileTap={animations.microTap}
                  className={cn(
                    "flex-1 px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30",
                    "border border-purple-500/30 hover:border-purple-500/50",
                    "rounded-lg transition-all duration-200",
                    "flex items-center justify-center gap-2",
                    typography.bodySmall,
                    "font-medium text-purple-200"
                  )}
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </motion.button>
                <motion.button
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    const analyticsSection = document.querySelector('[data-section="collab-analytics"]');
                    if (analyticsSection) {
                      analyticsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  whileTap={animations.microTap}
                  className={cn(
                    "px-4 py-2.5 bg-white/5 hover:bg-white/10",
                    "border border-white/10 hover:border-white/20",
                    "rounded-lg transition-all duration-200",
                    "flex items-center justify-center gap-2",
                    typography.bodySmall,
                    "text-purple-300/80 hover:text-purple-200"
                  )}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </motion.button>
              </div>
            </div>
          </BaseCard>

          {/* Card 2: Contracts & Protection */}
          <BaseCard variant="tertiary" className="p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(typography.h4, "font-semibold mb-1")}>Contracts & Protection</h3>
                  <p className={cn(typography.caption, "text-purple-300/70")}>
                    Auto-generate contracts, track payments, and stay protected.
                  </p>
                </div>
              </div>
              <motion.button
                onClick={() => {
                  triggerHaptic(HapticPatterns.light);
                  navigate('/creator-contracts');
                }}
                whileTap={animations.microTap}
                className={cn(
                  "w-full px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30",
                  "border border-blue-500/30 hover:border-blue-500/50",
                  "rounded-lg transition-all duration-200",
                  "flex items-center justify-center gap-2",
                  typography.bodySmall,
                  "font-medium text-blue-200"
                )}
              >
                View Contracts
                <ChevronRight className="w-4 h-4" />
              </motion.button>
              <p className={cn(typography.caption, "text-purple-300/50 text-center mt-2")}>
                Used after collab acceptance
              </p>
            </div>
          </BaseCard>

          {/* Card 3: Deals Tracker */}
          <BaseCard variant="tertiary" className="p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(typography.h4, "font-semibold mb-1")}>Deals</h3>
                  <p className={cn(typography.caption, "text-purple-300/70")}>
                    Track accepted collaborations, deadlines, and payments.
                  </p>
                </div>
              </div>
              <motion.button
                onClick={() => {
                  triggerHaptic(HapticPatterns.light);
                  navigate('/creator-contracts');
                }}
                whileTap={animations.microTap}
                className={cn(
                  "w-full px-4 py-2.5 bg-green-600/20 hover:bg-green-600/30",
                  "border border-green-500/30 hover:border-green-500/50",
                  "rounded-lg transition-all duration-200",
                  "flex items-center justify-center gap-2",
                  typography.bodySmall,
                  "font-medium text-green-200"
                )}
              >
                View Deals
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </BaseCard>
        </div>

        {/* Collab Link Analytics */}
        <div className="mb-8" data-section="collab-analytics">
          <CollabLinkAnalytics />
        </div>

        {/* Collaboration Requests Section */}
        <div className="mb-8">
          <CollabRequestsSection />
        </div>
      </div>
    </CreatorNavigationWrapper>
  );
};

export default CreatorCollab;

