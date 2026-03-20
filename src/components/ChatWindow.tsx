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
import { 
  useConversationMessages, 
  useSendConversationMessage,
  findOrCreateConversation,
  isLawyerOrAdvisor,
  getAuthUserIdFromProfileId
} from '@/lib/hooks/useConversationMessages';
import { useQueryClient } from '@tanstack/react-query';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';
// Sample history disabled - no demo messages
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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLawyerChat, setIsLawyerChat] = useState(false);
  const [isCheckingConversation, setIsCheckingConversation] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const currentUserId = user?.id;
  
  // Check if receiver is a lawyer/advisor and find/create conversation
  useEffect(() => {
    if (!currentUserId || !receiverId) return;

    const checkAndSetupConversation = async () => {
      try {
        setIsCheckingConversation(true);
        const isAdvisor = await isLawyerOrAdvisor(receiverId);
        setIsLawyerChat(isAdvisor);

        if (isAdvisor) {
          console.log('[ChatWindow] Setting up conversation for advisor:', { receiverId, receiverName, currentUserId });
          
          // Get auth.users ID from profile ID (they should be the same, but verify)
          const advisorAuthId = await getAuthUserIdFromProfileId(receiverId);
          
          console.log('[ChatWindow] Advisor auth ID:', advisorAuthId);
          
          if (!advisorAuthId) {
            console.error('[ChatWindow] Could not find auth user ID for advisor:', receiverId);
            toast.error('Failed to setup chat', { description: 'Could not find advisor user ID' });
            setIsCheckingConversation(false);
            return;
          }

          // Use new conversation system for lawyers/advisors
          // Note: currentUserId should already be auth.users.id from useSession
          console.log('[ChatWindow] Creating/finding conversation...');
          const convId = await findOrCreateConversation(
            currentUserId,
            advisorAuthId,
            `Chat with ${receiverName}`
          );
          console.log('[ChatWindow] Conversation ID:', convId);
          setConversationId(convId);
        }
      } catch (error: any) {
        console.error('Failed to setup conversation:', error);
        toast.error('Failed to setup chat', { description: error.message });
      } finally {
        setIsCheckingConversation(false);
      }
    };

    checkAndSetupConversation();
  }, [currentUserId, receiverId, receiverName]);

  // Check if this is CA or Lawyer chat (creator role checking CA/admin roles)
  const isCAOrLawyerChat = React.useMemo(() => {
    // This will be determined by checking the receiver role
    // For now, assume CA/Lawyer chat if user is creator
    return profile?.role === 'creator';
  }, [profile]);

  // Fetch messages - use conversation system for lawyers, legacy for others
  const { data: legacyMessages, isLoading: isLoadingLegacyMessages, error: legacyMessagesError } = useMessages({
    currentUserId: currentUserId,
    receiverId: receiverId,
    enabled: !!currentUserId && !!receiverId && !isLawyerChat,
  });

  const { data: conversationMessages, isLoading: isLoadingConversationMessages, error: conversationMessagesError } = useConversationMessages({
    conversationId: conversationId,
    enabled: !!conversationId && isLawyerChat,
  });

  // Determine which messages to use
  const realMessages = isLawyerChat ? conversationMessages : legacyMessages;
  const isLoadingMessages = isLawyerChat ? isLoadingConversationMessages : isLoadingLegacyMessages;
  const messagesError = isLawyerChat ? conversationMessagesError : legacyMessagesError;

  // Sample history disabled - no demo messages for any users
  // Always use real messages, never sample history
  const messagesToDisplay = realMessages || [];

  // Count user's sent messages (only for CA/Lawyer chat during trial)
  const userMessagesCount = React.useMemo(() => {
    if (!isCAOrLawyerChat || !trialStatus.isTrial) return 0;
    return messagesToDisplay.filter(msg => {
      return msg.sender_id === currentUserId;
    }).length;
  }, [messagesToDisplay, isCAOrLawyerChat, trialStatus.isTrial, currentUserId]);

  // Check if message sending is restricted
  const isMessageRestricted = React.useMemo(() => {
    if (!isCAOrLawyerChat || !trialStatus.isTrial) return false;
    return isTrialFeatureRestricted(profile, userMessagesCount, 1);
  }, [isCAOrLawyerChat, trialStatus.isTrial, profile, userMessagesCount]);

  // Mutations for sending messages
  const sendLegacyMessageMutation = useSendMessage();
  const sendConversationMessageMutation = useSendConversationMessage();

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

  // Real-time subscriptions
  useEffect(() => {
    if (!currentUserId || !receiverId) return;

    if (isLawyerChat && conversationId) {
      // Subscribe to conversation messages
      const channel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else if (!isLawyerChat) {
      // Subscribe to legacy messages
      const sortedIds = [currentUserId, receiverId].sort();
      const channelName = `chat_${sortedIds[0]}_${sortedIds[1]}`;

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'legacy_messages',
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
  }, [currentUserId, receiverId, conversationId, isLawyerChat, queryClient]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !receiverId || !profile) return;

    // Check trial restrictions for CA/Lawyer chat
    if (isMessageRestricted) {
      setShowUpgradeModal(true);
      return;
    }

    // Wait for conversation to be set up if it's a lawyer chat
    if (isLawyerChat && !conversationId) {
      toast.error('Setting up conversation...', { description: 'Please wait a moment' });
      return;
    }

    try {
      if (isLawyerChat && conversationId) {
        // Use new conversation system
        await sendConversationMessageMutation.mutateAsync({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: newMessage.trim(),
        });
      } else {
        // Use legacy system
        await sendLegacyMessageMutation.mutateAsync({
          sender_id: currentUserId,
          receiver_id: receiverId,
          content: newMessage.trim(),
          senderFirstName: profile.first_name || '',
          senderLastName: profile.last_name || '',
          receiverFirstName: receiverName.split(' ')[0],
          receiverLastName: receiverName.split(' ')[1] || '',
        });
      }
      setNewMessage('');
    } catch (error: any) {
      toast.error('Failed to send message', { description: error.message });
    }
  };

  if (sessionLoading || isLoadingMessages || isCheckingConversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">
          {isCheckingConversation ? 'Setting up conversation...' : 'Loading messages...'}
        </p>
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
            // For real messages, check the actual sender_id against the current user's ID
            const isCurrentUserMessage = msg.sender_id === currentUserId;
            
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
                    <AvatarImage 
                      src={
                        (msg as any).sender?.avatar_url || 
                        receiverAvatarUrl || 
                        DEFAULT_AVATAR_URL
                      } 
                      alt={(msg as any).sender?.first_name || receiverName} 
                    />
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {(msg as any).sender 
                        ? getInitials((msg as any).sender.first_name, (msg as any).sender.last_name) 
                        : getInitials(receiverName.split(' ')[0], receiverName.split(' ')[1] || '')}
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
                      {getInitials(profile?.first_name || null, profile?.last_name || null)}
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
          disabled={
            (isLawyerChat ? sendConversationMessageMutation.isPending : sendLegacyMessageMutation.isPending) ||
            isMessageRestricted ||
            trialStatus.trialLocked ||
            isCheckingConversation
          }
        />
        <Button 
          type="submit" 
          disabled={
            !newMessage.trim() ||
            (isLawyerChat ? sendConversationMessageMutation.isPending : sendLegacyMessageMutation.isPending) ||
            isMessageRestricted ||
            trialStatus.trialLocked ||
            isCheckingConversation
          } 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {(isLawyerChat ? sendConversationMessageMutation.isPending : sendLegacyMessageMutation.isPending) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
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