"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Eye, Heart, Users, Instagram, Youtube } from 'lucide-react';
import { motion } from 'framer-motion';

const ContentAnalytics: React.FC = () => {
  // Demo data - in real app, fetch from social sync module or analytics API
  const metrics = {
    highestPerformingPost: {
      views: 2100000,
      label: '2.1M views',
    },
    avgEngagementRate: 5.2,
    newFollowersThisMonth: 3200,
    mostEngagingPlatform: 'Instagram',
    instagramFollowers: 12400,
    instagramGrowth: 1200,
    youtubeAvgViews: 18900,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="bg-[#2A1F2E] border-[#4A3A4F] rounded-2xl shadow-lg hover:bg-[#3D2A3F] transition-all duration-300">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#E879F9] to-[#F472B6] border border-[#FF6B9D]/30 shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-white">Content & Audience Analytics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Highest Performing Post */}
            <div className="space-y-2 p-3 rounded-lg bg-[#1F1B2E] border border-[#4A3A4F] hover:bg-[#2A1F2E] transition-all">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#E879F9]" />
                <span className="text-small text-white/70">Highest performing post</span>
              </div>
              <p className="text-xl font-bold text-white number-large">
                {metrics.highestPerformingPost.label}
              </p>
            </div>

            {/* Avg Engagement Rate */}
            <div className="space-y-2 p-3 rounded-lg bg-[#1F1B2E] border border-[#4A3A4F] hover:bg-[#2A1F2E] transition-all">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-[#F472B6]" />
                <span className="text-small text-white/70">Avg engagement rate</span>
              </div>
              <p className="text-xl font-bold text-white number-large">
                {metrics.avgEngagementRate}%
              </p>
            </div>

            {/* New Followers */}
            <div className="space-y-2 p-3 rounded-lg bg-[#1F1B2E] border border-[#4A3A4F] hover:bg-[#2A1F2E] transition-all">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#B4D4FF]" />
                <span className="text-small text-white/70">New followers this month</span>
              </div>
              <p className="text-xl font-bold text-[#A8E6CF] number-large">
                +{metrics.newFollowersThisMonth.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Most Engaging Platform */}
            <div className="space-y-2 p-3 rounded-lg bg-[#1F1B2E] border border-[#4A3A4F] hover:bg-[#2A1F2E] transition-all">
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-[#F472B6]" />
                <span className="text-small text-white/70">Most engaging platform</span>
              </div>
              <p className="text-xl font-bold text-white number-large">
                {metrics.mostEngagingPlatform}
              </p>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="pt-6 border-t border-[#4A3A4F] space-y-4">
            {/* Instagram */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#1F1B2E] border border-[#4A3A4F] hover:bg-[#2A1F2E] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#E879F9] to-[#F472B6] border border-[#FF6B9D]/40 shadow-lg">
                  <Instagram className="h-4 w-4 text-white" />
                </div>
                <span className="text-body text-white/80 font-medium">Instagram</span>
              </div>
              <div className="text-right">
                <div className="text-body font-semibold text-white number-large">
                  {metrics.instagramFollowers.toLocaleString('en-IN')}
                </div>
                {metrics.instagramGrowth > 0 && (
                  <div className="flex items-center justify-end gap-1 text-[#A8E6CF] text-small mt-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>+{metrics.instagramGrowth.toLocaleString('en-IN')} this month</span>
                  </div>
                )}
              </div>
            </div>

            {/* YouTube */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#1F1B2E] border border-[#4A3A4F] hover:bg-[#2A1F2E] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#FF6B9D] to-[#FF8FAB] border border-[#FF6B9D]/40 shadow-lg">
                  <Youtube className="h-4 w-4 text-white" />
                </div>
                <span className="text-body text-white/80 font-medium">YT Avg Views</span>
              </div>
              <div className="text-right">
                <div className="text-body font-semibold text-white number-large">
                  {metrics.youtubeAvgViews.toLocaleString('en-IN')}
                </div>
                <div className="text-small text-white/60 mt-1">per video</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ContentAnalytics;

