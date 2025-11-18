"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, TrendingUp, Shield, Award, CheckCircle2 } from 'lucide-react';
import { BrandDeal } from '@/types';

interface CreatorScoreBadgeProps {
  brandDeals?: BrandDeal[];
}

const CreatorScoreBadge: React.FC<CreatorScoreBadgeProps> = ({ brandDeals = [] }) => {
  const score = React.useMemo(() => {
    let points = 0;
    let maxPoints = 100;

    // On-time deliveries (40 points)
    const now = new Date();
    const onTimeDeliveries = brandDeals.filter(deal => {
      if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
      const expectedDate = new Date(deal.payment_expected_date);
      const receivedDate = new Date(deal.payment_received_date);
      return receivedDate <= expectedDate;
    }).length;
    const totalCompleted = brandDeals.filter(deal => deal.status === 'Completed').length;
    const onTimeRate = totalCompleted > 0 ? (onTimeDeliveries / totalCompleted) * 100 : 100;
    points += (onTimeRate / 100) * 40;

    // Payment collection consistency (30 points)
    const paidDeals = brandDeals.filter(deal => deal.status === 'Completed' && deal.payment_received_date);
    const pendingDeals = brandDeals.filter(deal => deal.status === 'Payment Pending');
    const totalDealsWithPayment = paidDeals.length + pendingDeals.length;
    const collectionRate = totalDealsWithPayment > 0 ? (paidDeals.length / totalDealsWithPayment) * 100 : 100;
    points += (collectionRate / 100) * 30;

    // Dispute resolution (30 points) - Mock: no disputes = full points
    points += 30;

    return Math.round(Math.min(points, maxPoints));
  }, [brandDeals]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Fair';
  };

  return (
    <Card className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border border-yellow-500/30 rounded-2xl shadow-[0_0_20px_-6px_rgba(234,179,8,0.2)]">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Award className="h-8 w-8 text-yellow-400" />
              <div className="absolute inset-0 bg-yellow-400/20 blur-xl"></div>
            </div>
            <div>
              <p className="text-sm text-white/60">Creator Trust Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(score)} flex items-center gap-2`}>
                {score}
                <span className="text-white/40 text-lg">/ 100</span>
              </p>
              <p className="text-xs text-white/50 mt-1">{getScoreLabel(score)}</p>
            </div>
          </div>
          <div className="text-right">
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
          </div>
        </div>

        <div className="mt-4 space-y-2 text-xs text-white/60">
          <div className="flex items-center justify-between">
            <span>Based on:</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-green-400" />
            <span>On-time deliveries</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-blue-400" />
            <span>Payment collection consistency</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-purple-400" />
            <span>Dispute resolution</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatorScoreBadge;

