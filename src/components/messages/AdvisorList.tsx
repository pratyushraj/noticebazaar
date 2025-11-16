"use client";

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import AdvisorCard from './AdvisorCard';
import { Profile } from '@/types';

interface AdvisorListProps {
  advisors: (Profile & { chat_label?: string })[];
  selectedAdvisorId: string | null;
  onSelectAdvisor: (advisorId: string) => void;
  isLoading: boolean;
  title?: string;
}

const AdvisorList: React.FC<AdvisorListProps> = ({ 
  advisors, 
  selectedAdvisorId, 
  onSelectAdvisor, 
  isLoading,
  title = "Select Advisor"
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-card rounded-xl border border-border/40 p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground text-sm">Loading advisors...</p>
      </div>
    );
  }

  if (advisors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-card rounded-xl border border-border/40 p-4">
        <p className="text-sm text-muted-foreground text-center">No advisors available.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-card rounded-xl border border-border/40 shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border/40">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {advisors.map((advisor, index) => (
            <React.Fragment key={advisor.id}>
              <AdvisorCard
                advisor={advisor}
                isSelected={selectedAdvisorId === advisor.id}
                onClick={() => onSelectAdvisor(advisor.id)}
              />
              {index < advisors.length - 1 && (
                <Separator className="my-2 bg-border/30" />
              )}
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AdvisorList;

