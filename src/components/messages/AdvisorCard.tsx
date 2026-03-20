"use client";

import React from 'react';
import clsx from 'clsx';
import { MessageSquare } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils/avatar';
import type { Advisor } from '@/types/messages';

type Props = {
  advisor: Advisor;
  selected?: boolean;
  onClick?: (advisor: Advisor) => void;
};

export const AdvisorCard: React.FC<Props> = ({ advisor, selected, onClick }) => {
  return (
    <button
      onClick={() => onClick?.(advisor)}
      className={clsx(
        'w-full text-left rounded-xl p-3 flex items-center gap-3 transition-all duration-150 ease-in-out',
        'border border-border/40',
        selected 
          ? 'bg-muted/40 ring-1 ring-blue-400/30 shadow-[0_6px_20px_rgba(59,130,246,0.06)]' 
          : 'hover:bg-muted/30'
      )}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={advisor.avatarUrl} alt={advisor.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getInitials(advisor.name.split(' ')[0], advisor.name.split(' ')[1] || '')}
          </AvatarFallback>
        </Avatar>
        {advisor.online && (
          <span className="absolute right-0 bottom-0 inline-block w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-background" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{advisor.name}</div>
        <div className="text-xs text-muted-foreground truncate">{advisor.role}</div>
      </div>

      <div className={clsx('p-1 rounded-md flex-shrink-0', selected ? 'text-blue-400' : 'text-muted-foreground/40')}>
        <MessageSquare size={16} />
      </div>
    </button>
  );
};
