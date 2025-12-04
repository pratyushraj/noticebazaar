import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  is_deleted: boolean;
  attachments?: Array<{
    id: string;
    file_name: string;
    signed_download_url: string;
  }>;
}

interface UseConversationMessagesOptions {
  conversationId: string | null;
  enabled?: boolean;
}

/**
 * Hook to fetch messages from a conversation (new system)
 */
export const useConversationMessages = (options: UseConversationMessagesOptions) => {
  const { conversationId, enabled = true } = options;

  return useSupabaseQuery<Message[], Error>(
    ['conversation-messages', conversationId],
    async () => {
      if (!conversationId) {
        throw new Error('conversationId is required');
      }

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          attachments:message_attachments(id, file_name, signed_download_url)
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('sent_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }
      return data as Message[];
    },
    {
      enabled: enabled && !!conversationId,
      errorMessage: 'Failed to fetch conversation messages',
    }
  );
};

interface SendConversationMessageVariables {
  conversation_id: string;
  sender_id: string;
  content: string;
}

/**
 * Hook to send a message in a conversation (new system)
 */
export const useSendConversationMessage = () => {
  const queryClient = useQueryClient();

  return useSupabaseMutation<void, Error, SendConversationMessageVariables>(
    async (messageData) => {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: messageData.conversation_id,
          sender_id: messageData.sender_id,
          content: messageData.content.trim(),
        });

      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: async (_, variables) => {
        // Invalidate conversation messages
        queryClient.invalidateQueries({ 
          queryKey: ['conversation-messages', variables.conversation_id] 
        });
        // Invalidate conversations list to update last_message_at
        queryClient.invalidateQueries({ 
          queryKey: ['conversations'] 
        });
      },
      successMessage: 'Message sent!',
      errorMessage: 'Failed to send message',
    }
  );
};

/**
 * Find or create a conversation between two users
 */
export async function findOrCreateConversation(
  creatorId: string,
  advisorId: string,
  title?: string
): Promise<string> {
  // First, check if a conversation already exists
  const { data: existingParticipants, error: checkError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', creatorId);

  if (checkError) {
    throw new Error(`Failed to check existing conversations: ${checkError.message}`);
  }

  // Check if any of these conversations also has the advisor
  if (existingParticipants && existingParticipants.length > 0) {
    const conversationIds = existingParticipants.map(p => p.conversation_id);
    
    const { data: advisorParticipants, error: advisorCheckError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', advisorId)
      .in('conversation_id', conversationIds);

    if (advisorCheckError) {
      throw new Error(`Failed to check advisor participation: ${advisorCheckError.message}`);
    }

    // If we found a conversation with both participants, return it
    if (advisorParticipants && advisorParticipants.length > 0) {
      return advisorParticipants[0].conversation_id;
    }
  }

  // No existing conversation found, create a new one
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      title: title || 'Legal Consultation',
      type: 'direct',
      risk_tag: 'legal',
    })
    .select()
    .single();

  if (convError) {
    throw new Error(`Failed to create conversation: ${convError.message}`);
  }

  // Add both participants
  const { error: participantsError } = await supabase
    .from('conversation_participants')
    .insert([
      {
        conversation_id: conversation.id,
        user_id: creatorId,
        role: 'creator',
      },
      {
        conversation_id: conversation.id,
        user_id: advisorId,
        role: 'advisor',
      },
    ]);

  if (participantsError) {
    throw new Error(`Failed to add participants: ${participantsError.message}`);
  }

  return conversation.id;
}

/**
 * Check if a user is a lawyer or advisor
 */
export async function isLawyerOrAdvisor(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.role === 'lawyer' || data.role === 'admin' || data.role === 'chartered_accountant';
}

