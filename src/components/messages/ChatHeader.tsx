"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';

interface ChatHeaderProps {
  name: string;
  role: string;
  avatarUrl?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ name, role, avatarUrl }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border/40 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={avatarUrl || DEFAULT_AVATAR_URL} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(name.split(' ')[0], name.split(' ')[1] || '')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{name}</h3>
          <p className="text-xs text-muted-foreground truncate">{role}</p>
        </div>
      </div>
      
      <Badge 
        variant="outline" 
        className="text-[10px] px-2 py-0.5 border-border/40 bg-muted/30 text-muted-foreground flex items-center gap-1.5 flex-shrink-0"
      >
        <Lock className="h-3 w-3" />
        End-to-end encrypted
      </Badge>
    </div>
  );
};

export default ChatHeader;

