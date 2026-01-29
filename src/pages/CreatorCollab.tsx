"use client";

import { Link2, Copy, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { sectionLayout, animations, typography } from '@/lib/design-system';
import { BaseCard } from '@/components/ui/card-variants';
import CollabRequestsSection from '@/components/collab/CollabRequestsSection';
import CollabLinkAnalytics from '@/components/collab/CollabLinkAnalytics';
import { CreatorNavigationWrapper } from '@/components/navigation/CreatorNavigationWrapper';

const CreatorCollab = () => {
  const { profile } = useSession();
  const usernameForLink = profile?.instagram_handle || profile?.username;

  const copyCollabLink = () => {
    if (usernameForLink) {
      const link = `${window.location.origin}/collab/${usernameForLink}`;
      navigator.clipboard.writeText(link);
      toast.success('Collab link copied!');
      triggerHaptic(HapticPatterns.light);
    } else {
      toast.error('Username not set. Please update your profile.');
    }
  };

  return (
    <CreatorNavigationWrapper title="Collaboration" hidePageTitle compactHeader>
      <div className={cn(sectionLayout.container, "space-y-8 pb-28 md:space-y-10")}>
        {/* Header — Payments/Deals style: title + subtitle in content */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="space-y-1 md:space-y-2">
            <h1 className={cn(typography.h1, "mb-0 text-white")}>Collaboration</h1>
            <p className={cn(typography.body, "font-medium text-white/70")}>Replace brand DMs with structured collaboration requests.</p>
          </div>
        </div>

        {/* Hero: Collab Link — one primary CTA, one secondary text link */}
        <BaseCard
          variant="tertiary"
          className={cn(
            "p-4 md:p-5 relative overflow-hidden w-full",
            "border border-purple-400/40 ring-1 ring-purple-400/15 shadow-md shadow-purple-500/10"
          )}
        >
          <div className="absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 bg-purple-500/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-purple-500/25 flex items-center justify-center flex-shrink-0 ring-1 ring-purple-400/25">
                  <Link2 className="w-5 h-5 md:w-6 md:h-6 text-purple-300" />
                </div>
                <h2 className={cn(typography.h4, "font-bold text-white break-words")}>Collab Link</h2>
              </div>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-200/90 text-[10px] font-medium rounded-full whitespace-nowrap flex-shrink-0 border border-purple-400/30">
                Recommended
              </span>
            </div>
            <p className="text-sm text-purple-200/90 mb-4 break-words">
              One link for brands to send protected collaboration requests.
            </p>
            <div className="flex flex-col gap-3">
              <motion.button
                onClick={copyCollabLink}
                whileTap={animations.microTap}
                className={cn(
                  "w-full min-h-[44px] px-4 rounded-lg flex items-center justify-center gap-2",
                  "bg-purple-600/40 hover:bg-purple-600/50 border border-purple-400/50",
                  "font-medium text-purple-100 text-sm transition-colors"
                )}
              >
                <Copy className="w-4 h-4 flex-shrink-0" />
                Copy Collab Link
              </motion.button>
              <motion.a
                href={usernameForLink ? `/collab/${usernameForLink}` : undefined}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!usernameForLink) {
                    e.preventDefault();
                    toast.error('Username not set. Please update your profile.');
                  } else {
                    triggerHaptic(HapticPatterns.light);
                  }
                }}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 font-medium text-purple-200/90 text-sm hover:text-purple-100 transition-colors min-h-[44px]",
                  !usernameForLink && "pointer-events-none opacity-60"
                )}
              >
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                Preview as brand
              </motion.a>
            </div>
          </div>
        </BaseCard>

        {/* Brand Requests — immediately after Collab Link */}
        <div data-section="collab-requests">
          <CollabRequestsSection copyCollabLink={copyCollabLink} usernameForLink={usernameForLink ?? undefined} />
        </div>

        {/* Collab Link Analytics — below Brand Requests, compact */}
        <div data-section="collab-analytics">
          <CollabLinkAnalytics />
        </div>
      </div>
    </CreatorNavigationWrapper>
  );
};

export default CreatorCollab;

