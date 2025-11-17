"use client";

import React from 'react';
import { Lock } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';
import type { Advisor } from '@/types/messages';

type Props = {
  advisor?: Advisor | null;
};

export const ChatHeader: React.FC<Props> = ({ advisor }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src={advisor?.avatarUrl || DEFAULT_AVATAR_URL} alt={advisor?.name || 'Advisor'} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {advisor?.name ? getInitials(advisor.name.split(' ')[0], advisor.name.split(' ')[1] || '') : 'A'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="text-sm font-semibold text-foreground truncate">{advisor?.name ?? 'Select an advisor'}</div>
          <div className="text-xs text-muted-foreground truncate">{advisor?.role ?? ''}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] border border-border/40 bg-muted/20 text-muted-foreground">
          <Lock size={12} />
          <span>End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
};
