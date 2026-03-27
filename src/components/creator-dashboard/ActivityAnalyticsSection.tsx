"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BrandDeal } from '@/types';
import WeeklyPerformance from './WeeklyPerformance';
import LegalHealthScore from './LegalHealthScore';
import ContentMetrics from './ContentMetrics';
import ThisWeeksSummary from './ThisWeeksSummary';
import GoalProgressAnnual from './GoalProgressAnnual';

interface ActivityAnalyticsSectionProps {
  brandDeals?: BrandDeal[];
}

const ActivityAnalyticsSection: React.FC<ActivityAnalyticsSectionProps> = ({ brandDeals = [] }) => {
  return (
    <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
      <CardContent className="p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white mb-1">Activity & Analytics</h3>
          <p className="text-xs text-white/50">Performance metrics and insights</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <WeeklyPerformance brandDeals={brandDeals} />
          <LegalHealthScore brandDeals={brandDeals} />
          <ContentMetrics />
          <ThisWeeksSummary brandDeals={brandDeals} />
          <GoalProgressAnnual brandDeals={brandDeals} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityAnalyticsSection;

