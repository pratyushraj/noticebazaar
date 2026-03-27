import { useState, useEffect, useCallback, useRef } from 'react';
import { CometChat } from '@cometchat-pro/chat';
import { COMETCHAT_CONFIG } from './config';

interface UseCometChatOptions {
  currentUserId: string | undefined;
  receiverId: string | undefined;
  enabled?: boolean;
}

interface CometChatMessage {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: number;
  readAt?: number;
}

export const useCometChat = (options: UseCometChatOptions) => {
  const { currentUserId, receiverId, enabled = true } = options;
  const [messages, setMessages] = useState<CometChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const listenerIdRef = useRef<string | null>(null);
  const typingListenerIdRef = useRef<string | null>(null);

  // Initialize CometChat
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!COMETCHAT_CONFIG.APP_ID) {
        console.warn('CometChat not configured, using Supabase fallback');
        return;
      }

      try {
        const { initializeCometChat } = await import('./config');
        const initialized = await initializeCometChat();
        if (mounted) {
          setIsInitialized(initialized);
        }
      } catch (error) {
        console.error('CometChat initialization error:', error);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Generate auth token (simplified - in production, get from your backend)
  const generateAuthToken = async (uid: string): Promise<void> => {
    // In production, call your backend API to generate auth token
    // For development: create user if doesn't exist
    try {
      // Try to create user first (will fail if exists, that's okay)
      try {
        const user = new CometChat.User(uid);
        user.setName(uid);
        await CometChat.createUser(user, COMETCHAT_CONFIG.AUTH_KEY || '');
      } catch (createError) {
        // User might already exist, continue to login
        console.log('User may already exist, proceeding to login');
      }
    } catch (error) {
      console.error('Failed to setup CometChat user:', error);
      throw error;
    }
  };

  // Login user to CometChat
  useEffect(() => {
    if (!isInitialized || !currentUserId || !enabled) return;

    const login = async () => {
      try {
        // Setup user first
        await generateAuthToken(currentUserId);
        
        // Login with UID (non-secure, for development)
        // In production, use auth token from your backend API
        const user = await CometChat.login(currentUserId, COMETCHAT_CONFIG.AUTH_KEY || '');
        console.log('CometChat login successful:', user.getUid());
      } catch (error) {
        console.error('CometChat login failed:', error);
        // If login fails, CometChat features will be disabled
      }
    };

    login();
  }, [isInitialized, currentUserId, enabled]);

  // Fetch messages
  useEffect(() => {
    if (!isInitialized || !currentUserId || !receiverId || !enabled) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const limit = 50;
        const messagesRequest = new CometChat.MessagesRequestBuilder()
          .setUID(receiverId)
          .setLimit(limit)
          .build();

        const messageList = await messagesRequest.fetchPrevious();
        const formattedMessages: CometChatMessage[] = messageList.map((msg: any) => ({
          id: msg.getId(),
          text: msg.getText(),
          senderId: msg.getSender()?.getUid() || '',
          receiverId: receiverId,
          timestamp: msg.getSentAt(),
          readAt: msg.getReadAt(),
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Failed to fetch CometChat messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [isInitialized, currentUserId, receiverId, enabled]);

  // Listen for real-time messages
  useEffect(() => {
    if (!isInitialized || !currentUserId || !receiverId || !enabled) return;

    const listenerId = `listener_${currentUserId}_${receiverId}`;
    listenerIdRef.current = listenerId;

    const messageListener = new CometChat.MessageListener({
      onTextMessageReceived: (message: any) => {
        if (message.getSender()?.getUid() === receiverId) {
          setMessages((prev) => [
            ...prev,
            {
              id: message.getId(),
              text: message.getText(),
              senderId: message.getSender()?.getUid() || '',
              receiverId: receiverId,
              timestamp: message.getSentAt(),
            },
          ]);
        }
      },
      onMediaMessageReceived: () => {},
      onCustomMessageReceived: () => {},
      onTypingStarted: (typingIndicator: any) => {
        if (typingIndicator.getSender()?.getUid() === receiverId) {
          setIsTyping(true);
        }
      },
      onTypingEnded: (typingIndicator: any) => {
        if (typingIndicator.getSender()?.getUid() === receiverId) {
          setIsTyping(false);
        }
      },
    });

    CometChat.addMessageListener(listenerId, messageListener);

    return () => {
      if (listenerIdRef.current) {
        CometChat.removeMessageListener(listenerIdRef.current);
      }
    };
  }, [isInitialized, currentUserId, receiverId, enabled]);

  // Send message
  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      if (!isInitialized || !currentUserId || !receiverId) {
        throw new Error('CometChat not initialized or missing user IDs');
      }

      try {
        const textMessage = new CometChat.TextMessage(
          receiverId,
          text,
          CometChat.RECEIVER_TYPE.USER
        );

        const sentMessage = await CometChat.sendMessage(textMessage);
        
        setMessages((prev) => [
          ...prev,
          {
            id: sentMessage.getId(),
            text: sentMessage.getText(),
            senderId: currentUserId,
            receiverId: receiverId,
            timestamp: sentMessage.getSentAt(),
          },
        ]);
      } catch (error) {
        console.error('Failed to send CometChat message:', error);
        throw error;
      }
    },
    [isInitialized, currentUserId, receiverId]
  );

  return {
    messages,
    isLoading,
    isInitialized,
    isTyping,
    sendMessage,
  };
};

