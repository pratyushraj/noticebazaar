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
            onClick={action.onClick}
            className={cn(
              "flex flex-col items-center justify-center p-4 h-24 rounded-xl", // Increased height to h-24, added rounded-xl
              action.variant === 'destructive' 
                ? 'quick-action-button-destructive-gradient text-destructive-foreground' // Apply destructive gradient
                : 'quick-action-button-gradient text-secondary-foreground' // Apply general gradient
            )}
          >
            <action.icon className="h-6 w-6 mb-2" /> {/* Increased icon size */}
            <span className="text-sm font-semibold">{action.label}</span> {/* Added font-semibold */}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CreatorQuickActions;