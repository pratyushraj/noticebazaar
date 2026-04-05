import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DeliverableAutoInfoProps {
  className?: string;
}

export const DeliverableAutoInfo: React.FC<DeliverableAutoInfoProps> = ({ className }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-2 px-3 py-2 bg-secondary/50 border border-purple-400/20 rounded-xl text-sm text-secondary cursor-help ${className}`}
          >
            <Info className="w-4 h-4 text-secondary" />
            <span>Deliverables will be automatically marked as completed on their due date.</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-secondary/95 border-border text-foreground max-w-xs">
          <p>You can edit deliverable details in Edit Deal.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

