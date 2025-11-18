"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Instagram, Youtube, TrendingUp, Users, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface AudienceAnalyticsPreviewProps {
  profile?: any;
}

const AudienceAnalyticsPreview: React.FC<AudienceAnalyticsPreviewProps> = () => {
  // Demo data - in real app, fetch from social sync module
  const instagramFollowers = 12400; // Demo: +1,200 this month from 11,200
  const instagramGrowth = 1200;
  const youtubeAvgViews = 18900;
  const engagementRate = 4.8;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-pink-900/20 to-orange-900/20 border border-white/5 hover:border-pink-600/60 transition-all shadow-inner">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Audience Analytics</span>
          </div>

          <div className="space-y-3">
            {/* Instagram */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30">
                  <Instagram className="h-3.5 w-3.5 text-pink-400" />
                </div>
                <span className="text-xs text-muted-foreground">Instagram</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">
                  {instagramFollowers.toLocaleString('en-IN')}
                </div>
                {instagramGrowth > 0 && (
                  <div className="flex items-center gap-1 text-emerald-400 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    <span>+{instagramGrowth.toLocaleString('en-IN')} this month</span>
                  </div>
                )}
              </div>
            </div>

            {/* YouTube */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-600/20 to-red-800/20 border border-white/5">
                  <Youtube className="h-3.5 w-3.5 text-red-400" />
                </div>
                <span className="text-xs text-muted-foreground">YT Avg Views</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">
                  {youtubeAvgViews.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-muted-foreground">per video</div>
              </div>
            </div>

            {/* Engagement Rate */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Engagement Rate</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">
                  {engagementRate}%
                </div>
                <div className="text-xs text-emerald-400">Above average</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AudienceAnalyticsPreview;

