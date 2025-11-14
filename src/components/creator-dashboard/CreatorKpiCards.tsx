"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreatorKpi } from '@/types'; // Import CreatorKpi from types
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'; // Import trend icons

interface CreatorKpiCardsProps {
  kpiCards: CreatorKpi[];
}

const CreatorKpiCards: React.FC<CreatorKpiCardsProps> = ({ kpiCards }) => {
  // Filter out Protection Score - it will be rendered separately
  const filteredKpiCards = kpiCards.filter(kpi => kpi.title !== 'Protection Score');
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredKpiCards.map((kpi, index) => {
        const Icon = kpi.icon;
        const ChangeIcon = kpi.changeDirection === 'up' ? ArrowUp : kpi.changeDirection === 'down' ? ArrowDown : Minus;
        const changeColor = kpi.changeDirection === 'up' ? 'text-green-500' : kpi.changeDirection === 'down' ? 'text-red-500' : 'text-muted-foreground';

        return (
          <Card key={index} className="creator-card-base shadow-lg p-4"> {/* Applied new base card class */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0"> {/* Minimal padding */}
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <div className="relative">
                <Icon className={cn("h-4 w-4", kpi.color)} />
                {/* Optional glow effect for icons */}
                <span className={cn("absolute inset-0 rounded-full opacity-30 blur-sm", kpi.color.replace('text-', 'bg-'))}></span>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0"> {/* Minimal padding */}
              <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
              <div className="flex items-center text-sm mt-1">
                {kpi.changePercentage !== undefined && (
                  <span className={cn("flex items-center mr-2", changeColor)}>
                    <ChangeIcon className="h-4 w-4 mr-1" />
                    {kpi.changePercentage}%
                  </span>
                )}
                <p className="text-xs text-muted-foreground">{kpi.statusDescription || kpi.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CreatorKpiCards;