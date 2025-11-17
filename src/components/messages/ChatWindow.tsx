"use client";

import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';
import { ChatHeader } from './ChatHeader';
import { MessageInput } from './MessageInput';
import { MessageBubble } from './MessageBubble';
import type { Advisor, Message } from '@/types/messages';

type Props = {
  advisor?: Advisor | null;
  messages?: Message[];
  onSend?: (text: string) => void;
  isLoading?: boolean;
  currentUserAvatar?: string;
  currentUserName?: string;
};

export const ChatWindow: React.FC<Props> = ({ 
  advisor, 
  messages = [], 
  onSend, 
  isLoading = false,
  currentUserAvatar,
  currentUserName
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
      <ChatHeader advisor={advisor} />

      <ScrollArea className="flex-1">
        <div className="p-6">
          {!hasMessages ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center text-muted-foreground gap-4">
              <MessageSquare size={48} className="opacity-10" />
              <div className="text-sm">No messages yet. Start the conversation.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isCurrentUser={m.author === 'user'}
                  currentUserAvatar={currentUserAvatar}
                  currentUserName={currentUserName}
                  advisorName={advisor?.name}
                  advisorAvatar={advisor?.avatarUrl}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      <MessageInput onSend={onSend} isLoading={isLoading} />
    </div>
  );
};
