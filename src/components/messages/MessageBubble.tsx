"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';
import { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  currentUserAvatar?: string;
  receiverAvatar?: string;
  currentUserName?: string;
  receiverName?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  currentUserAvatar,
  receiverAvatar,
  currentUserName,
  receiverName,
}) => {
  const formatMessageContent = (content: string | React.ReactNode): React.ReactNode => {
    if (typeof content !== 'string') {
      return content;
    }
    const parts = content.split(/(\*\*.*?\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const content = formatMessageContent(message.content);
  const time = new Date(message.sent_at).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div
      className={cn(
        'flex items-end gap-2 mb-3',
        isCurrentUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isCurrentUser && (
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarImage 
            src={message.sender?.avatar_url || receiverAvatar || DEFAULT_AVATAR_URL} 
            alt={message.sender?.first_name || receiverName || 'User'} 
          />
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
            {message.sender 
              ? getInitials(message.sender.first_name, message.sender.last_name)
              : receiverName 
                ? getInitials(receiverName.split(' ')[0], receiverName.split(' ')[1] || '')
                : 'U'
            }
          </AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={cn(
          'max-w-[75%] rounded-xl px-4 py-2.5 shadow-sm',
          isCurrentUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        )}
      >
        <p className="text-sm leading-relaxed break-words">{content}</p>
        <span className={cn(
          "block text-[10px] mt-1.5",
          isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {time}
        </span>
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

export default MessageBubble;

