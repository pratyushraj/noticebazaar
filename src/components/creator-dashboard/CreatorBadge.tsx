

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BadgeCheck, Calendar, Shield, Instagram, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CreatorBadgeProps {
  profile?: any;
}

const CreatorBadge: React.FC<CreatorBadgeProps> = ({ profile }) => {
  const badgeData = useMemo(() => {
    // Calculate creator since year
    const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
    const creatorSince = createdAt.getFullYear();

    // Calculate trust score (0-100)
    let trustScore = 70; // Base score
    
    // Add points for verified items
    if (profile?.gstin) trustScore += 10;
    if (profile?.pan_number) trustScore += 10;
    if (profile?.bank_account_number) trustScore += 5;
    if (profile?.instagram_handle) trustScore += 3;
    if (profile?.youtube_channel_id) trustScore += 2;

    trustScore = Math.min(100, trustScore);

    // For demo mode, show high score
    if (!profile) {
      return {
        creatorSince: 2024,
        trustScore: 90,
        verified: {
          pan: true,
          instagram: true,
          bank: true,
        },
      };
    }

    return {
      creatorSince,
      trustScore,
      verified: {
        pan: !!profile?.pan_number,
        instagram: !!profile?.instagram_handle,
        bank: !!profile?.bank_account_number,
      },
    };
  }, [profile]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border border-border/5 hover:border-border transition-all rounded-2xl shadow-[0px_4px_24px_rgba(0,0,0,0.25)] px-5 py-4">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 mb-3">
            <BadgeCheck className="h-4 w-4 text-info" />
            <span className="text-xs font-semibold text-info uppercase tracking-wide">Creator Badge</span>
          </div>

          <div className="space-y-3">
            {/* Creator Since & Trust Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Creator Since</p>
                  <p className="text-sm font-semibold text-foreground">{badgeData.creatorSince}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Trust Score</p>
                <p className={cn(
                  "text-sm font-bold",
                  badgeData.trustScore >= 80 ? "text-primary" :
                  badgeData.trustScore >= 60 ? "text-info" :
                  "text-yellow-400"
                )}>
                  {badgeData.trustScore}
                </p>
              </div>
            </div>

            {/* Verified Badges */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">Verified:</span>
              <div className="flex items-center gap-2">
                {badgeData.verified.pan && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/20 border border-primary/30">
                    <Shield className="h-3 w-3 text-primary" />
                    <span className="text-xs text-primary">PAN</span>
                  </div>
                )}
                {badgeData.verified.instagram && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-pink-500/20 border border-pink-500/30">
                    <Instagram className="h-3 w-3 text-pink-400" />
                    <span className="text-xs text-pink-400">Instagram</span>
                  </div>
                )}
                {badgeData.verified.bank && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-info/20 border border-info/30">
                    <CreditCard className="h-3 w-3 text-info" />
                    <span className="text-xs text-info">Bank</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CreatorBadge;

