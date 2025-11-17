"use client";

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { AdvisorCard } from './AdvisorCard';
import type { Advisor } from '@/types/messages';

type Props = {
  advisors: Advisor[];
  selectedId?: string | null;
  onSelect?: (advisor: Advisor) => void;
  isLoading?: boolean;
};

export const AdvisorList: React.FC<Props> = ({ advisors, selectedId, onSelect, isLoading }) => {
  if (isLoading) {
    return (
      <aside className="w-[280px] min-w-[260px] max-w-[280px] p-4 rounded-xl bg-card border border-border/40 shadow-sm flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-xs text-muted-foreground">Loading advisors...</p>
      </aside>
    );
  }

  if (advisors.length === 0) {
    return (
      <aside className="w-[280px] min-w-[260px] max-w-[280px] p-4 rounded-xl bg-card border border-border/40 shadow-sm flex flex-col items-center justify-center min-h-[200px]">
        <p className="text-xs text-muted-foreground text-center">No advisors available.</p>
      </aside>
    );
  }

  return (
    <aside className="w-[280px] min-w-[260px] max-w-[280px] rounded-xl bg-card border border-border/40 shadow-sm shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40 bg-muted/20">
        <div className="text-[10px] text-muted-foreground tracking-wide uppercase">Select Advisor</div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 flex flex-col gap-2">
          {advisors.map((a) => (
            <AdvisorCard key={a.id} advisor={a} selected={selectedId === a.id} onClick={onSelect} />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
};
