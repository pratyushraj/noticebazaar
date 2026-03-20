"use client";

import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
  iconContainerClassName?: string;
}

const QuickActionCard = React.forwardRef<HTMLDivElement, QuickActionCardProps>(
  ({ icon, title, description, onClick, className, iconContainerClassName }, ref) => {
    return (
      <Card 
        ref={ref} // Forward the ref to the Card component
        className={cn(
          "p-6 rounded-xl shadow-lg border border-border transition-all duration-200 hover:border-primary hover:shadow-xl cursor-pointer bg-card",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-0 flex flex-col space-y-4">
          {/* Icon container: large icon, white text */}
          <div className={cn("h-10 w-10 flex items-center justify-center text-white", iconContainerClassName)}>
            {icon}
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
);

QuickActionCard.displayName = "QuickActionCard";

export default QuickActionCard;