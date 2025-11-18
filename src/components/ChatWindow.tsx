"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Message, Profile } from '@/types';
import { useMessages, useSendMessage } from '@/lib/hooks/useMessages';
import { useQueryClient } from '@tanstack/react-query';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';
import { useSampleChatHistory } from '@/lib/hooks/useSampleChatHistory';
import { isTrialFeatureRestricted } from '@/lib/trial';
import UpgradeModal from '@/components/trial/UpgradeModal';

// Helper function to convert markdown-like bold syntax to JSX
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

interface ChatWindowProps {
  receiverId: string;
  receiverName: string;
  receiverAvatarUrl?: string;
}

const ChatWindow = ({ receiverId, receiverName, receiverAvatarUrl }: ChatWindowProps) => {
  const { user, profile, loading: sessionLoading, trialStatus } = useSession();
  const [newMessage, setNewMessage] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const currentUserId = user?.id;
  const isClient = profile?.role === 'client';
  
  // Check if this is CA or Lawyer chat (creator role checking CA/admin roles)
  const isCAOrLawyerChat = React.useMemo(() => {
    // This will be determined by checking the receiver role
    // For now, assume CA/Lawyer chat if user is creator
    return profile?.role === 'creator';
  }, [profile]);

  // Fetch messages using the new hook
  const { data: realMessages, isLoading: isLoadingMessages, error: messagesError } = useMessages({
    currentUserId: currentUserId,
    receiverId: receiverId,
    enabled: !!currentUserId && !!receiverId,
  });

  // Generate sample history if no real messages exist AND the user is a client
  const sampleHistory = useSampleChatHistory(profile?.first_name || null);
  
  // Determine which messages to display
  const isShowingSample = (realMessages === undefined || realMessages.length === 0) && isClient && sampleHistory.length > 0;
  
  const messagesToDisplay = isShowingSample 
    ? sampleHistory 
    : realMessages || [];

  // Count user's sent messages (only for CA/Lawyer chat during trial)
  const userMessagesCount = React.useMemo(() => {
    if (!isCAOrLawyerChat || !trialStatus.isTrial) return 0;
    return messagesToDisplay.filter(msg => {
      if (isShowingSample) {
        return msg.sender_id === 'client';
      }
      return msg.sender_id === currentUserId;
    }).length;
  }, [messagesToDisplay, isCAOrLawyerChat, trialStatus.isTrial, isShowingSample, currentUserId]);

  // Check if message sending is restricted
  const isMessageRestricted = React.useMemo(() => {
    if (!isCAOrLawyerChat || !trialStatus.isTrial) return false;
    return isTrialFeatureRestricted(profile, userMessagesCount, 1);
  }, [isCAOrLawyerChat, trialStatus.isTrial, profile, userMessagesCount]);

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
  }, [messagesToDisplay]); // Depend on messagesToDisplay instead of messages

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
          (payload) => {
            queryClient.invalidateQueries({ queryKey: ['messages', currentUserId, receiverId] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUserId, receiverId, queryClient]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !receiverId || !profile) return;

    // Check trial restrictions for CA/Lawyer chat
    if (isMessageRestricted) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        sender_id: currentUserId,
        receiver_id: receiverId,
        content: newMessage.trim(),
        senderFirstName: profile.first_name || '',
        senderLastName: profile.last_name || '',
        receiverFirstName: receiverName.split(' ')[0],
        receiverLastName: receiverName.split(' ')[1] || '',
      });
      setNewMessage('');
    } catch (error: any) {
      toast.error('Failed to send message', { description: error.message });
    }
  };

  if (sessionLoading || isLoadingMessages) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  if (!currentUserId) {
    return <div className="text-center text-destructive">Please log in to view messages.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-lg shadow-sm border border-border">
      <div className="flex items-center p-4 border-b border-border">
        <Avatar className="h-9 w-9 mr-3">
          <AvatarImage src={receiverAvatarUrl || DEFAULT_AVATAR_URL} alt={receiverName} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(receiverName.split(' ')[0], receiverName.split(' ')[1] || '')}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-semibold text-foreground">{receiverName}</h3>
      </div>

      <ScrollArea className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messagesToDisplay.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</div>
        ) : (
          messagesToDisplay.map((msg) => {
            let isCurrentUserMessage: boolean;

            if (isShowingSample) {
              // For sample messages, check the mock sender_id against the mock client ID
              isCurrentUserMessage = msg.sender_id === 'client';
            } else {
              // For real messages, check the actual sender_id against the current user's ID
              isCurrentUserMessage = msg.sender_id === currentUserId;
            }
            
            // Format content for display
            const content = formatMessageContent(msg.content);

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex items-end gap-2',
                  isCurrentUserMessage ? 'justify-end' : 'justify-start'
                )}
              >
                {!isCurrentUserMessage && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.sender?.avatar_url || receiverAvatarUrl || DEFAULT_AVATAR_URL} alt={msg.sender?.first_name || receiverName} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {msg.sender ? getInitials(msg.sender.first_name, msg.sender.last_name) : getInitials(receiverName.split(' ')[0], receiverName.split(' ')[1] || '')}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[70%] p-3 rounded-lg',
                    isCurrentUserMessage
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-secondary text-secondary-foreground rounded-bl-none'
                  )}
                >
                  <p className="text-sm">{content}</p>
                  <span className="block text-xs mt-1 opacity-75">
                    {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {isCurrentUserMessage && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || DEFAULT_AVATAR_URL} alt={profile?.first_name || "You"} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(profile?.first_name, profile?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {isMessageRestricted && (
        <div className="px-4 py-3 bg-orange-500/10 border-t border-orange-500/30">
          <p className="text-xs text-orange-400 text-center">
            Free trial limit: 1 message. Upgrade to continue chatting.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSendMessage} className="flex p-4 border-t border-border gap-2">
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isMessageRestricted ? "Upgrade to send more messages..." : "Type your message..."}
          className="flex-1 bg-input text-foreground border-border"
          disabled={sendMessageMutation.isPending || isMessageRestricted || trialStatus.trialLocked}
        />
        <Button 
          type="submit" 
          disabled={!newMessage.trim() || sendMessageMutation.isPending || isMessageRestricted || trialStatus.trialLocked} 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        reason="chat_limit"
        message="Upgrade to continue chatting with your CA and Lawyer. Free trial includes 1 message each."
      />
    </div>
  );
};

export default ChatWindow;