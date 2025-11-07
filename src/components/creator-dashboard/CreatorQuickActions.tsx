"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { QuickAction } from '@/data/creatorDashboardData';
import { cn } from '@/lib/utils';

interface CreatorQuickActionsProps {
  quickActions: QuickAction[];
}

const CreatorQuickActions: React.FC<CreatorQuickActionsProps> = ({ quickActions }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'outline'}
            onClick={action.onClick}
            className={cn(
              "flex flex-col items-center justify-center p-4 h-auto text-lg",
              action.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            <action.icon className="h-5 w-5 mb-1" />
            <span className="text-sm">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CreatorQuickActions;