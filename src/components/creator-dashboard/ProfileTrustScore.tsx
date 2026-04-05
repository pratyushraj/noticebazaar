"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck, Calendar, Shield, Instagram, CreditCard, Star, TrendingUp, Award, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BrandDeal } from '@/types';

interface ProfileTrustScoreProps {
  profile?: any;
  brandDeals?: BrandDeal[];
}

const ProfileTrustScore: React.FC<ProfileTrustScoreProps> = ({ profile, brandDeals = [] }) => {
  const badgeData = useMemo(() => {
    // Calculate creator since year
    const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
    const creatorSince = createdAt.getFullYear();

    // Calculate trust score (0-100) - combining both logic
    let trustScore = 70; // Base score
    
    // Add points for verified items
    if (profile?.gstin) trustScore += 10;
    if (profile?.pan_number) trustScore += 10;
    if (profile?.bank_account_number) trustScore += 5;
    if (profile?.instagram_handle) trustScore += 3;
    if (profile?.youtube_channel_id) trustScore += 2;

    // Add points for performance (from CreatorScoreBadge logic)
    // On-time deliveries (40 points)
    const onTimeDeliveries = brandDeals.filter(deal => {
      if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
      const expectedDate = new Date(deal.payment_expected_date);
      const receivedDate = new Date(deal.payment_received_date);
      return receivedDate <= expectedDate;
    }).length;
    const totalCompleted = brandDeals.filter(deal => deal.status === 'Completed').length;
    const onTimeRate = totalCompleted > 0 ? (onTimeDeliveries / totalCompleted) * 100 : 100;
    trustScore += (onTimeRate / 100) * 20; // Reduced weight since we have other factors

    // Payment collection consistency (30 points)
    const paidDeals = brandDeals.filter(deal => deal.status === 'Completed' && deal.payment_received_date);
    const pendingDeals = brandDeals.filter(deal => deal.status === 'Payment Pending');
    const totalDealsWithPayment = paidDeals.length + pendingDeals.length;
    const collectionRate = totalDealsWithPayment > 0 ? (paidDeals.length / totalDealsWithPayment) * 100 : 100;
    trustScore += (collectionRate / 100) * 15; // Reduced weight

    // Dispute resolution (30 points) - Mock: no disputes = full points
    trustScore += 15;

    trustScore = Math.min(100, Math.round(trustScore));

    // For demo mode, show high score
    if (!profile && brandDeals.length <= 6) {
      return {
        creatorSince: 2024,
        trustScore: 90,
        verified: {
          pan: true,
          instagram: true,
          bank: true,
        },
        onTimeRate: 95,
        collectionRate: 92,
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
      onTimeRate: Math.round(onTimeRate),
      collectionRate: Math.round(collectionRate),
    };
  }, [profile, brandDeals]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-primary';
    if (score >= 60) return 'text-warning';
    return 'text-warning';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Fair';
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
              <BadgeCheck className="h-5 w-5 text-foreground" />
            </div>
            <CardTitle className="text-foreground">Profile & Trust Score</CardTitle>
          </div>
        </CardHeader>
        <CardContent>

          {/* Main Score Display */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Award className="h-12 w-12 text-warning" />
                <div className="absolute inset-0 bg-warning/20/20 blur-xl"></div>
              </div>
              <div>
                <p className="text-small text-foreground/60">Trust Score</p>
                <p className={cn("text-4xl font-bold number-large flex items-center gap-2 mt-1", getScoreColor(badgeData.trustScore))}>
                  {badgeData.trustScore}
                  <span className="text-foreground/40 text-xl">/ 100</span>
                </p>
                <p className="text-small text-foreground/50 mt-1">{getScoreLabel(badgeData.trustScore)}</p>
              </div>
            </div>
            <Star className="h-7 w-7 text-warning fill-[#FFD89B]" />
          </div>

          {/* Creator Since & Verified Badges */}
          <div className="space-y-4 pt-4 border-t border-[#4A3A4F]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-foreground/60" />
                <div>
                  <p className="text-small text-foreground/60">Creator Since</p>
                  <p className="text-body font-semibold text-foreground mt-0.5">{badgeData.creatorSince}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {badgeData.verified.pan && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20/20 border border-[#A8E6CF]/40">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-small text-primary font-medium">PAN</span>
                  </div>
                )}
                {badgeData.verified.instagram && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20/20 border border-[#F472B6]/40">
                    <Instagram className="h-4 w-4 text-primary" />
                    <span className="text-small text-primary font-medium">IG</span>
                  </div>
                )}
                {badgeData.verified.bank && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-info/20/20 border border-[#B4D4FF]/40">
                    <CreditCard className="h-4 w-4 text-info" />
                    <span className="text-small text-info font-medium">Bank</span>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-3 pt-3 border-t border-[#4A3A4F]">
              <div className="flex items-center gap-3 text-body">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-foreground/80">On-time deliveries: <span className="font-semibold text-foreground">{badgeData.onTimeRate}%</span></span>
              </div>
              <div className="flex items-center gap-3 text-body">
                <TrendingUp className="h-5 w-5 text-info" />
                <span className="text-foreground/80">Payment collection: <span className="font-semibold text-foreground">{badgeData.collectionRate}%</span></span>
              </div>
              <div className="flex items-center gap-3 text-body">
                <Shield className="h-5 w-5 text-secondary" />
                <span className="text-foreground/80">No open disputes</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProfileTrustScore;

