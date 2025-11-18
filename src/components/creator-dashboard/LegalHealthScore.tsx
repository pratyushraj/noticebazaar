"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';
import { BrandDeal } from '@/types';

interface LegalHealthScoreProps {
  brandDeals?: BrandDeal[];
}

const LegalHealthScore: React.FC<LegalHealthScoreProps> = ({ brandDeals = [] }) => {
  const score = React.useMemo(() => {
    let points = 0;
    let maxPoints = 0;

    // Check reviewed contracts
    const contractsWithReview = brandDeals.filter(deal => deal.contract_file_url);
    maxPoints += 20;
    if (contractsWithReview.length > 0) {
      points += 20;
    }

    // Check for disputes (mock: no disputes)
    maxPoints += 25;
    points += 25; // No open disputes

    // Check for delayed payments
    const now = new Date();
    const overdueCount = brandDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      return dueDate < now;
    }).length;
    maxPoints += 30;
    if (overdueCount === 0) {
      points += 30;
    } else if (overdueCount <= 2) {
      points += 15;
    }

    // Check for indemnity clauses (mock: missing some)
    maxPoints += 25;
    points += 12; // Some missing

    return Math.round((points / maxPoints) * 100);
  }, [brandDeals]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-400" />
          Legal Health Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-6xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
          <p className="text-sm text-white/60 mt-1">out of 100</p>
        </div>

        <div className="space-y-2">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(score)} transition-all duration-500`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-white/70">Reviewed contracts</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <XCircle className="h-4 w-4 text-orange-400" />
            <span className="text-white/70">Missing indemnity clause</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-white/70">No open disputes</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-white/70">Delayed brands flagged</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LegalHealthScore;

