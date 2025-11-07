"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreatorKpi } from '@/data/creatorDashboardData';
import { cn } from '@/lib/utils';

interface CreatorKpiCardsProps {
  kpiCards: CreatorKpi[];
}

const CreatorKpiCards: React.FC<CreatorKpiCardsProps> = ({ kpiCards }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiCards.map((kpi, index) => (
        <Card key={index} className="bg-card shadow-sm border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
            <kpi.icon className={cn("h-4 w-4", kpi.color)} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
            <p className="text-xs text-muted-foreground">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CreatorKpiCards;