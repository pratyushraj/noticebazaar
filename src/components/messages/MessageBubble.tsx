"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import clsx from 'clsx';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';
import type { Message } from '@/types/messages';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  currentUserAvatar?: string;
  advisorAvatar?: string;
  currentUserName?: string;
  advisorName?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  currentUserAvatar,
  advisorAvatar,
  currentUserName,
  advisorName,
}) => {
  const time = new Date(message.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div
      className={clsx(
        'flex items-end gap-2',
        isCurrentUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isCurrentUser && (
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarImage 
            src={advisorAvatar || DEFAULT_AVATAR_URL} 
            alt={advisorName || 'Advisor'} 
          />
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
            {advisorName 
              ? getInitials(advisorName.split(' ')[0], advisorName.split(' ')[1] || '')
              : 'A'
            }
          </AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={clsx(
          'inline-block text-sm p-3 rounded-2xl shadow-sm max-w-[75%]',
          isCurrentUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-muted/30 text-foreground rounded-bl-md'
        )}
      >
        <p className="leading-relaxed break-words">{message.text}</p>
        <div className={clsx(
          "text-[11px] mt-1",
          isCurrentUser ? "text-white/70" : "text-muted-foreground"
        )}>
          {time}
        </div>
      </div>
      
      {isCurrentUser && (
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarImage 
            src={currentUserAvatar || DEFAULT_AVATAR_URL} 
            alt={currentUserName || 'You'} 
          />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {currentUserName 
              ? getInitials(currentUserName.split(' ')[0], currentUserName.split(' ')[1] || '')
              : 'Y'
            }
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
