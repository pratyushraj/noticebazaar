import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery'; // Import new hook
import { useSupabaseMutation } from './useSupabaseMutation'; // Import new hook
import { useAddActivityLog } from './useActivityLog'; // Import useAddActivityLog

interface UseMessagesOptions {
  currentUserId: string | undefined;
  receiverId: string | undefined;
  enabled?: boolean;
}

export const useMessages = (options: UseMessagesOptions) => {
  const { currentUserId, receiverId, enabled = true } = options;

  return useSupabaseQuery<Message[], Error>(
    ['messages', currentUserId, receiverId],
    async () => {
      if (!currentUserId || !receiverId) {
        throw new Error('Both currentUserId and receiverId are required to fetch messages.');
      }

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(first_name, last_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId})`)
        .order('sent_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }
      return data as Message[];
    },
    {
      enabled: enabled && !!currentUserId && !!receiverId,
      errorMessage: 'Failed to fetch messages',
    }
  );
};

interface SendMessageVariables {
  sender_id: string;
  receiver_id: string;
  content: string;
  senderFirstName?: string; // Optional for logging
  senderLastName?: string; // Optional for logging
  receiverFirstName?: string; // Optional for logging
  receiverLastName?: string; // Optional for logging
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const addActivityLogMutation = useAddActivityLog(); // Initialize the activity log hook

  return useSupabaseMutation<void, Error, SendMessageVariables>(
    async (newMessage) => {
      // Only insert the actual database columns, not the optional logging fields
      const { senderFirstName, senderLastName, receiverFirstName, receiverLastName, ...messageData } = newMessage;
      const { error } = await supabase.from('messages').insert(messageData);
      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: async (_, variables) => {
        // Invalidate the messages query to refetch the chat
        queryClient.invalidateQueries({ queryKey: ['messages', variables.sender_id, variables.receiver_id] });
        queryClient.invalidateQueries({ queryKey: ['messages', variables.receiver_id, variables.sender_id] });

        // Log activity for the sender (client)
        if (variables.senderFirstName && variables.senderLastName) {
          await addActivityLogMutation.mutateAsync({
            description: `You sent a message to ${variables.receiverFirstName || ''} ${variables.receiverLastName || ''}`,
            client_id: variables.sender_id,
          });
        }

        // Log activity for the receiver (if they are a client)
        // This assumes the receiver is a client if their ID is not the current user's ID
        // and we want to log it on their activity feed.
        if (variables.receiverFirstName && variables.receiverLastName) {
          await addActivityLogMutation.mutateAsync({
            description: `You received a message from ${variables.senderFirstName || ''} ${variables.senderLastName || ''}`,
            client_id: variables.receiver_id,
          });
        }
      },
      successMessage: 'Message sent!',
      errorMessage: 'Failed to send message',
    }
  );
};