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
  const collabLink = usernameForLink ? `${window.location.origin}/collab/${usernameForLink}` : '';

  const copyCollabLink = () => {
    if (usernameForLink) {
      navigator.clipboard.writeText(collabLink);
      toast.success('Collab link copied!');
      triggerHaptic(HapticPatterns.light);
    } else {
      toast.error('Username not set. Please update your profile.');
    }
  };

  return (
    <CreatorNavigationWrapper title="Collaboration" hidePageTitle compactHeader>
      <div className={cn(sectionLayout.container, "space-y-4 md:space-y-7 pb-28 md:pb-28")}>
        {/* Header — compact on mobile so Collab Link + Brand Requests CTA fit above fold */}
        <div className="flex items-center justify-between mb-3 md:mb-6">
          <div className="space-y-1 md:space-y-2">
            <h1 className={cn(typography.h1, "mb-0 text-white")}>Collaboration</h1>
            <p className={cn(typography.body, "font-medium text-white/70")}>Replace brand DMs with structured collaboration requests.</p>
          </div>
        </div>

        {/* Hero: Collab Link — one primary CTA, one secondary text link */}
        <BaseCard
          variant="tertiary"
          className={cn(
            "p-3.5 md:p-5 relative overflow-hidden w-full",
            "border border-purple-400/45 ring-1 ring-purple-400/20 shadow-md shadow-purple-500/15"
          )}
        >
          <div className="absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 bg-purple-500/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-2 mb-1.5">
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
            <p className="text-sm text-purple-200/90 mb-3 break-words">
              One link for brands to send protected collaboration requests.
            </p>
            {usernameForLink && (
              <div className="mb-2.5 rounded-lg border border-white/20 bg-white/8 px-3 py-2 text-xs text-purple-100/90 truncate">
                {collabLink}
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              <motion.button
                onClick={copyCollabLink}
                whileTap={animations.microTap}
                className={cn(
                  "w-full min-h-[44px] px-4 rounded-lg flex items-center justify-center gap-2",
                  "bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:from-[#7C3AED] hover:to-[#4F46E5]",
                  "border border-purple-300/40 shadow-[0_2px_12px_rgba(139,92,246,0.35)]",
                  "font-semibold text-white text-sm transition-colors"
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
                  "inline-flex items-center justify-center gap-1.5 font-medium text-purple-200/90 text-sm min-h-[44px]",
                  "bg-white/8 hover:bg-white/12 border border-white/20 rounded-lg transition-colors",
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
