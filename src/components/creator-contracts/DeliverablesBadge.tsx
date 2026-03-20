"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DeliverablesBadgeProps {
  deliverables: string | string[];
  maxDisplay?: number;
  className?: string;
}

const DeliverablesBadge: React.FC<DeliverablesBadgeProps> = ({ 
  deliverables, 
  maxDisplay = 2,
  className 
}) => {
  // Handle both string and array formats
  const deliverablesArray = Array.isArray(deliverables) 
    ? deliverables 
    : typeof deliverables === 'string' 
      ? deliverables.split(',').map(d => d.trim()).filter(Boolean)
      : [];

  if (deliverablesArray.length === 0) {
    return <span className="text-xs text-muted-foreground">No deliverables</span>;
  }

  const displayItems = deliverablesArray.slice(0, maxDisplay);
  const remainingCount = deliverablesArray.length - maxDisplay;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {displayItems.map((item, index) => (
        <Badge
          key={index}
          variant="outline"
          className="rounded-full px-2 py-0.5 text-xs bg-accent/50 text-foreground border-border/50"
        >
          {item}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge
          variant="outline"
          className="rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground border-border/50"
        >
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
};

export default DeliverablesBadge;

