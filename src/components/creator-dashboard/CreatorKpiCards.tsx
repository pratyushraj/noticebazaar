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
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      {kpiCards.map((kpi, index) => {
        const Icon = kpi.icon;
        const ChangeIcon = kpi.changeDirection === 'up' ? ArrowUp : kpi.changeDirection === 'down' ? ArrowDown : Minus;
        const changeColor = kpi.changeDirection === 'up' ? 'text-green-500' : kpi.changeDirection === 'down' ? 'text-red-500' : 'text-muted-foreground';

        return (
          <Card key={index} className="creator-card-base shadow-lg p-3 md:p-4 aspect-square flex flex-col"> {/* Square tiles on mobile */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0 flex-shrink-0"> {/* Minimal padding */}
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground truncate">{kpi.title}</CardTitle>
              <div className="relative flex-shrink-0 ml-1">
                <Icon className={cn("h-3.5 w-3.5 md:h-4 md:w-4", kpi.color)} />
                {/* Optional glow effect for icons */}
                <span className={cn("absolute inset-0 rounded-full opacity-30 blur-sm", kpi.color.replace('text-', 'bg-'))}></span>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0 flex-1 flex flex-col justify-center"> {/* Minimal padding, centered content */}
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">{kpi.value}</div>
              <div className="flex flex-col gap-1">
                {kpi.changePercentage !== undefined && (
                  <span className={cn("flex items-center text-xs md:text-sm font-medium", changeColor)}>
                    <ChangeIcon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    {kpi.changePercentage}% {kpi.changeDirection === 'up' ? 'increase' : kpi.changeDirection === 'down' ? 'decrease' : ''}
                  </span>
                )}
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">{kpi.statusDescription || kpi.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CreatorKpiCards;