"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Eye, Heart, Users, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';

const ContentMetrics: React.FC = () => {
  // Demo data - in real app, fetch from social sync module or analytics API
  const metrics = {
    highestPerformingPost: {
      views: 2100000,
      label: '2.1M views',
    },
    avgEngagementRate: 5.2,
    newFollowersThisMonth: 3200,
    mostEngagingPlatform: 'Instagram',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65 }}
    >
      <Card className="bg-gradient-to-br from-pink-900/20 via-purple-900/20 to-blue-900/20 border border-white/5 hover:border-pink-600/60 transition-all shadow-inner">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-pink-400" />
            <span className="text-xs font-semibold text-pink-400 uppercase tracking-wide">Your Content Insights</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Highest Performing Post */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs text-muted-foreground">Highest performing post</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {metrics.highestPerformingPost.label}
              </p>
            </div>

            {/* Avg Engagement Rate */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-pink-400" />
                <span className="text-xs text-muted-foreground">Avg engagement rate</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {metrics.avgEngagementRate}%
              </p>
            </div>

            {/* New Followers */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs text-muted-foreground">New followers this month</span>
              </div>
              <p className="text-lg font-bold text-emerald-400">
                +{metrics.newFollowersThisMonth.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Most Engaging Platform */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Instagram className="h-3.5 w-3.5 text-pink-400" />
                <span className="text-xs text-muted-foreground">Most engaging platform</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {metrics.mostEngagingPlatform}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ContentMetrics;
