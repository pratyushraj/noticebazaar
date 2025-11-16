"use client";

import React, { useEffect, useRef } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Message } from '@/types';
import { useMessages, useSendMessage } from '@/lib/hooks/useMessages';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSampleChatHistory } from '@/lib/hooks/useSampleChatHistory';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  receiverId: string;
  receiverName: string;
  receiverRole: string;
  receiverAvatarUrl?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  receiverId, 
  receiverName, 
  receiverRole,
  receiverAvatarUrl 
}) => {
  const { user, profile, loading: sessionLoading } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const currentUserId = user?.id;
  const isClient = profile?.role === 'client';

  // Fetch messages
  const { data: realMessages, isLoading: isLoadingMessages, error: messagesError } = useMessages({
    currentUserId: currentUserId,
    receiverId: receiverId,
    enabled: !!currentUserId && !!receiverId,
  });

  // Generate sample history if no real messages exist AND the user is a client
  const sampleHistory = useSampleChatHistory(profile?.first_name || null);
  
  // Determine which messages to display
  const isShowingSample = (realMessages === undefined || realMessages.length === 0) && isClient && sampleHistory.length > 0;
  const messagesToDisplay = isShowingSample ? sampleHistory : realMessages || [];

  // Mutation for sending messages
  const sendMessageMutation = useSendMessage();

  useEffect(() => {
    if (messagesError) {
      toast.error('Error fetching messages', { description: messagesError.message });
    }
  }, [messagesError]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesToDisplay]);

  // Real-time subscription
  useEffect(() => {
    if (currentUserId && receiverId) {
      const sortedIds = [currentUserId, receiverId].sort();
      const channelName = `chat_${sortedIds[0]}_${sortedIds[1]}`;

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId}))`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['messages', currentUserId, receiverId] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUserId, receiverId, queryClient]);

  const handleSendMessage = async (message: string) => {
    if (!currentUserId || !receiverId || !profile) return;

    try {
      await sendMessageMutation.mutateAsync({
        sender_id: currentUserId,
        receiver_id: receiverId,
        content: message,
        senderFirstName: profile.first_name || '',
        senderLastName: profile.last_name || '',
        receiverFirstName: receiverName.split(' ')[0],
        receiverLastName: receiverName.split(' ')[1] || '',
      });
    } catch (error: any) {
      toast.error('Failed to send message', { description: error.message });
    }
  };

  if (sessionLoading || isLoadingMessages) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-card rounded-xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-destructive">
        Please log in to view messages.
      </div>
    );
  }

  const currentUserName = profile ? `${profile.first_name} ${profile.last_name}` : 'You';

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden">
      <ChatHeader 
        name={receiverName}
        role={receiverRole}
        avatarUrl={receiverAvatarUrl}
      />

      <ScrollArea className="flex-1">
        <div className="p-4">
          {messagesToDisplay.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">
                No messages yet. Start the conversation.
              </p>
            </div>
          ) : (
            messagesToDisplay.map((msg: Message) => {
              let isCurrentUserMessage: boolean;
              
              if (isShowingSample) {
                isCurrentUserMessage = msg.sender_id === 'client';
              } else {
                isCurrentUserMessage = msg.sender_id === currentUserId;
              }

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isCurrentUser={isCurrentUserMessage}
                  currentUserAvatar={profile?.avatar_url}
                  receiverAvatar={receiverAvatarUrl}
                  currentUserName={currentUserName}
                  receiverName={receiverName}
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <MessageInput
        onSend={handleSendMessage}
        isLoading={sendMessageMutation.isPending}
      />
    </div>
  );
};

export default ChatWindow;

