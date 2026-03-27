"use client";

import React, { useEffect, useRef } from 'react';
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  // Perfect auto-scroll function
  const scrollToBottom = () => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  };

  // Perfect auto-scroll after sending
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    const timeout = setTimeout(() => {
      scrollToBottom();
    }, 50); // works with mobile keyboard
    
    return () => clearTimeout(timeout);
  }, [messages.length]);

  return (
    <div className="flex-1 flex flex-col rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
      <ChatHeader advisor={advisor} />

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain px-3"
        style={{
          paddingBottom: 0,
          marginBottom: 0,
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {!hasMessages ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center text-muted-foreground gap-4">
            <MessageSquare size={48} className="opacity-10" />
            <div className="text-sm">No messages yet. Start the conversation.</div>
          </div>
        ) : (
          <div>
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
            <div ref={messagesEndRef} aria-live="polite" />
          </div>
        )}
      </div>

      <MessageInput onSend={onSend} isLoading={isLoading} />
    </div>
  );
};
