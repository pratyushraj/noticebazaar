"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';
import { BrandDeal } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

interface LegalHealthScoreProps {
  brandDeals?: BrandDeal[];
  isLoading?: boolean;
}

const LegalHealthScore: React.FC<LegalHealthScoreProps> = ({ brandDeals = [], isLoading = false }) => {
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

  if (isLoading) {
    return (
      <Card variant="metric">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (brandDeals.length === 0) {
    return (
      <Card variant="metric">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/5 backdrop-blur-sm">
              <Shield className="h-5 w-5 text-white/80" />
            </div>
            Legal Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Shield}
            title="No legal data yet"
            description="Complete brand deals and review contracts to track your legal health score."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="metric">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/5 backdrop-blur-sm">
            <Shield className="h-5 w-5 text-violet-300 opacity-70" />
          </div>
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
              className={`h-full ${getBarColor(score)} transition-all duration-500 shadow-[0_0_18px_rgba(34,197,94,0.4)]`}
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

