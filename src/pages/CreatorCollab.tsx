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
            Replace brand DMs with structured collaboration requests.
          </p>
        </div>

        {/* Collaboration Tools Cards */}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-4 mb-8">
          {/* Card 1: Collab Link - Hero Card (Visually Dominant for first-time creators) */}
          <BaseCard variant="tertiary" className="p-5 md:p-7 relative overflow-hidden w-full md:col-span-1 min-h-[200px] md:min-h-[220px] border-2 border-purple-400/50 ring-2 ring-purple-400/25 shadow-xl shadow-purple-500/25">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-purple-500/30 flex items-center justify-center flex-shrink-0 ring-2 ring-purple-400/30">
                    <Link2 className="w-6 h-6 md:w-7 md:h-7 text-purple-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className={cn(typography.h4, "font-bold text-white")}>Collab Link</h3>
                      <span className="px-2.5 py-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 text-[10px] md:text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 border border-purple-400/40">
                        Recommended
                      </span>
                    </div>
                    <p className={cn(typography.caption, "text-purple-200/90 leading-relaxed mb-3")}>
                      Let brands send you structured collaboration requests instead of DMs.
                    </p>
                    {/* Helper microcopy */}
                    <p className={cn(typography.caption, "text-purple-300/70 text-xs leading-relaxed")}>
                      This replaces Instagram & WhatsApp DMs and protects you legally.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
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
                    "flex-1 px-4 py-2.5 bg-purple-600/30 hover:bg-purple-600/40",
                    "border border-purple-400/50 hover:border-purple-400/70",
                    "rounded-lg transition-all duration-200",
                    "flex items-center justify-center gap-2",
                    typography.bodySmall,
                    "font-medium text-purple-100",
                    "w-full sm:w-auto shadow-md shadow-purple-500/20"
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
                    "px-4 py-2.5 bg-white/10 hover:bg-white/15",
                    "border border-white/20 hover:border-white/30",
                    "rounded-lg transition-all duration-200",
                    "flex items-center justify-center gap-2",
                    typography.bodySmall,
                    "text-purple-200/90 hover:text-white",
                    "w-full sm:w-auto"
                  )}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </motion.button>
              </div>
            </div>
          </BaseCard>

          {/* Card 2: Contracts & Protection - De-emphasized for first-time creators */}
          <BaseCard variant="tertiary" className="p-5 relative overflow-hidden opacity-75">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-blue-400/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(typography.h4, "font-medium mb-1 text-purple-200/80")}>Contracts & Protection</h3>
                  <p className={cn(typography.caption, "text-purple-300/60 text-xs")}>
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
                  "w-full px-4 py-2 bg-blue-600/15 hover:bg-blue-600/25",
                  "border border-blue-500/20 hover:border-blue-500/40",
                  "rounded-lg transition-all duration-200",
                  "flex items-center justify-center gap-2",
                  typography.bodySmall,
                  "font-medium text-blue-200/80 text-sm"
                )}
              >
                View Contracts
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
              <p className={cn(typography.caption, "text-purple-300/50 text-center mt-2 text-xs")}>
                Available after you accept a collaboration
              </p>
            </div>
          </BaseCard>

          {/* Card 3: Deals Tracker - De-emphasized for first-time creators */}
          <BaseCard variant="tertiary" className="p-5 relative overflow-hidden opacity-75">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-green-400/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(typography.h4, "font-medium mb-1 text-purple-200/80")}>Deals</h3>
                  <p className={cn(typography.caption, "text-purple-300/60 text-xs")}>
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
                  "w-full px-4 py-2 bg-green-600/15 hover:bg-green-600/25",
                  "border border-green-500/20 hover:border-green-500/40",
                  "rounded-lg transition-all duration-200",
                  "flex items-center justify-center gap-2",
                  typography.bodySmall,
                  "font-medium text-green-200/80 text-sm"
                )}
              >
                View Deals
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
              <p className={cn(typography.caption, "text-purple-300/50 text-center mt-2 text-xs")}>
                Available after you accept a collaboration
              </p>
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

