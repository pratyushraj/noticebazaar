// Lawyer Dashboard - Inbox, conversation view, contract preview, quick replies
// Matches existing NoticeBazaar design (purple gradient, glass cards)

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Search, Filter, FileText, CheckCircle, 
  AlertTriangle, Clock, Send, X, Eye, Download, Scale, ChevronLeft, LogOut, Loader2
} from 'lucide-react';
import { spacing, typography, iconSizes, radius, glass, shadows, animations } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { toast } from 'sonner';
import { useSignOut } from '@/lib/hooks/useAuth';

interface Conversation {
  id: string;
  title: string | null;
  risk_tag: string | null;
  unread_count_creator: number;
  unread_count_advisor: number;
  last_message_at: string | null;
  last_message: {
    content: string;
    sent_at: string;
  } | null;
  participants: Array<{
    user_id: string;
    role: string;
    profiles: {
      first_name: string;
      last_name: string;
      avatar_url: string;
    };
  }>;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sent_at: string;
  is_read: boolean;
  attachments?: Array<{
    id: string;
    file_name: string;
    signed_download_url: string;
  }>;
}

const QUICK_REPLIES = [
  "I've reviewed the contract. Let's schedule a call to discuss.",
  "The contract terms look good. Proceeding with the deal.",
  "I need clarification on the exclusivity clause.",
  "There are some legal concerns that need to be addressed.",
  "The payment terms are acceptable from a legal standpoint."
];

export default function LawyerDashboard() {
  const { profile, user } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<'all' | 'high_risk' | 'payment' | 'legal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const signOutMutation = useSignOut();
  
  // Mobile view state
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  // Fetch conversations
  useEffect(() => {
    if (!user?.id) return;

    const fetchConversations = async () => {
      try {
        // Verify auth session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        const authUserId = session?.user?.id;
        
        console.log('[LawyerDashboard] Auth session:', {
          hasSession: !!session,
          authUserId: authUserId,
          profileUserId: user.id,
          matches: authUserId === user.id,
        });
        
        if (sessionError) {
          console.error('[LawyerDashboard] Session error:', sessionError);
        }
        
        if (!authUserId) {
          console.error('[LawyerDashboard] No auth user ID found');
          setConversations([]);
          setIsLoading(false);
          return;
        }
        
        console.log('[LawyerDashboard] Fetching conversations for auth user:', authUserId);
        
        // First, get conversations where user is a participant
        // IMPORTANT: conversation_participants.user_id should match auth.uid() (not profile.id)
        const { data: participantData, error: participantError } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id')
          .eq('user_id', authUserId);

        if (participantError) {
          console.error('[LawyerDashboard] Error fetching participants:', {
            error: participantError,
            message: participantError.message,
            code: participantError.code,
            details: participantError.details,
            hint: participantError.hint,
          });
          throw participantError;
        }

        console.log('[LawyerDashboard] Found participants:', participantData?.length || 0);
        console.log('[LawyerDashboard] Participant data:', participantData);
        console.log('[LawyerDashboard] Participant user_ids:', participantData?.map(p => p.user_id));
        console.log('[LawyerDashboard] Expected auth.uid():', authUserId);
        
        // Check if participant user_ids match auth.uid()
        const mismatchedParticipants = participantData?.filter(p => p.user_id !== authUserId) || [];
        if (mismatchedParticipants.length > 0) {
          console.warn('[LawyerDashboard] WARNING: Some participants have mismatched user_id:', mismatchedParticipants);
        }
        
        const participantConversationIds = participantData?.map(p => p.conversation_id).filter(Boolean) || [];
        
        if (participantConversationIds.length === 0) {
          console.log('[LawyerDashboard] No conversation IDs found from participants');
          setConversations([]);
          setIsLoading(false);
          return;
        }

        console.log('[LawyerDashboard] Conversation IDs to fetch:', participantConversationIds);

        // Try RPC function first (bypasses RLS issues)
        let conversationsData: any[] = [];
        let conversationsError: any = null;

        console.log('[LawyerDashboard] Trying RPC function first...');
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_conversations');
        
        console.log('[LawyerDashboard] RPC function result:', {
          dataCount: rpcData?.length || 0,
          error: rpcError,
          errorCode: rpcError?.code,
          errorMessage: rpcError?.message,
        });
        
        if (!rpcError && rpcData && rpcData.length > 0) {
          conversationsData = rpcData;
          console.log('[LawyerDashboard] Using RPC function results:', conversationsData.length);
        } else {
          // Fallback to direct query
          console.log('[LawyerDashboard] RPC failed, trying direct query...');
          const { data: batchData, error: batchError } = await supabase
            .from('conversations')
            .select('*')
            .in('id', participantConversationIds)
            .order('updated_at', { ascending: false });
          
          console.log('[LawyerDashboard] Direct query result:', {
            dataCount: batchData?.length || 0,
            error: batchError,
            errorCode: batchError?.code,
            errorMessage: batchError?.message,
          });
          
          if (batchData) {
            conversationsData = batchData;
          }
          conversationsError = batchError;
          
          // If batch query failed, try individual queries as fallback
          if (batchError && (!batchData || batchData.length === 0)) {
            console.warn('[LawyerDashboard] Batch query failed, trying individual queries:', batchError);
            const individualResults: any[] = [];
            for (const convId of participantConversationIds) {
              const { data: singleData, error: singleError } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', convId)
                .single();
              
              if (!singleError && singleData) {
                individualResults.push(singleData);
              } else {
                console.warn(`[LawyerDashboard] Failed to fetch conversation ${convId}:`, singleError);
              }
            }
            if (individualResults.length > 0) {
              conversationsData = individualResults;
            }
          }
        }

        if (conversationsError && conversationsData.length === 0) {
          console.error('[LawyerDashboard] Error fetching conversations:', {
            error: conversationsError,
            message: conversationsError.message,
            code: conversationsError.code,
            details: conversationsError.details,
            hint: conversationsError.hint,
          });
          // Don't throw - try to continue with empty array
        }

        console.log('[LawyerDashboard] Found conversations:', conversationsData.length);
        console.log('[LawyerDashboard] Conversations data:', conversationsData);
        
        // Use the conversations we fetched (they're already filtered by participant IDs)
        const filteredConversations = conversationsData;
        
        console.log('[LawyerDashboard] Filtered conversations:', filteredConversations.length);
        
        if (filteredConversations.length === 0) {
          console.log('[LawyerDashboard] No conversations found after filtering');
          setConversations([]);
          setIsLoading(false);
          return;
        }

        // Fetch all participants for these conversations
        const filteredConversationIds = filteredConversations.map(c => c.id);
        const { data: allParticipants, error: participantsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id, role')
          .in('conversation_id', filteredConversationIds);

        if (participantsError) throw participantsError;

        // Get unique user IDs and fetch profiles
        const userIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Create a map of user_id -> profile
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        // Fetch last messages for each conversation
        const lastMessagesMap = new Map<string, { content: string; sent_at: string }>();
        const conversationIdsForMessages = filteredConversations.map(c => c.id);
        if (conversationIdsForMessages.length > 0) {
          for (const convId of conversationIdsForMessages) {
            const { data: lastMessage, error: msgError } = await supabase
              .from('messages')
              .select('content, sent_at')
              .eq('conversation_id', convId)
              .eq('is_deleted', false)
              .order('sent_at', { ascending: false })
              .limit(1)
              .single();
            
            if (!msgError && lastMessage) {
              lastMessagesMap.set(convId, {
                content: lastMessage.content,
                sent_at: lastMessage.sent_at,
              });
            }
          }
        }

        // Join conversations with participants, profiles, and last messages
        const conversationsWithParticipants = filteredConversations.map(conv => ({
          ...conv,
          last_message: lastMessagesMap.get(conv.id) || null,
          participants: allParticipants
            ?.filter(p => p.conversation_id === conv.id)
            .map(p => ({
              user_id: p.user_id,
              role: p.role,
              profiles: profilesMap.get(p.user_id) || null
            })) || []
        })) || [];

        console.log('[LawyerDashboard] Setting conversations:', conversationsWithParticipants.length);
        setConversations(conversationsWithParticipants);
      } catch (err: any) {
        console.error('[LawyerDashboard] Error in fetchConversations:', err);
        toast.error('Failed to load conversations', { description: err.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !user?.id) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            attachments:message_attachments(id, file_name, signed_download_url)
          `)
          .eq('conversation_id', selectedConversation)
          .eq('is_deleted', false)
          .order('sent_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err: any) {
        toast.error('Failed to load messages', { description: err.message });
      }
    };

    fetchMessages();

    // Subscribe to new messages (listen for INSERT, UPDATE, DELETE)
    const channel = supabase
      .channel(`messages:${selectedConversation}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversation}`
      }, (payload) => {
        console.log('[LawyerDashboard] Real-time message update:', {
          event: payload.eventType,
          new: payload.new,
          old: payload.old,
        });
        // Optimistically update UI for INSERT events
        if (payload.eventType === 'INSERT' && payload.new) {
          const newMessage = payload.new as any;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, {
              id: newMessage.id,
              content: newMessage.content,
              sender_id: newMessage.sender_id,
              sent_at: newMessage.sent_at,
              is_read: newMessage.is_read || false,
              attachments: []
            }];
          });
        }
        // Refetch messages to ensure we have the latest (handles UPDATE, DELETE)
        fetchMessages();
      })
      .subscribe((status) => {
        console.log('[LawyerDashboard] Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user?.id]);

  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    if (filter !== 'all') {
      filtered = filtered.filter(c => c.risk_tag === filter);
    }

    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [conversations, filter, searchQuery]);

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const creatorParticipant = selectedConv?.participants.find(p => p.role === 'creator');

  // Handle conversation selection
  const handleSelectConversation = (convId: string) => {
    triggerHaptic(HapticPatterns.medium);
    setSelectedConversation(convId);
    // On mobile, hide list and show chat
    if (window.innerWidth < 768) {
      setShowListOnMobile(false);
      setShowChatOnMobile(true);
    }
  };

  // Handle back button
  const handleBack = () => {
    setShowChatOnMobile(false);
    setShowListOnMobile(true);
    setSelectedConversation(null);
  };

  return (
    <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white fixed inset-0">
      <div className="flex h-full">
        {/* Left Sidebar - Filters & Conversation List */}
        <aside className={cn(
          "w-full md:w-80 border-r border-white/10 bg-white/5 backdrop-blur-xl",
          "transition-transform duration-300 ease-in-out",
          showListOnMobile ? "block" : "hidden md:block"
        )}>
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  "bg-gradient-to-br from-purple-500/20 to-indigo-500/20"
                )}>
                  <Scale className={iconSizes.md} />
                </div>
                <div>
                  <div className="font-semibold">Legal Advisor</div>
                  <div className="text-xs text-white/60">Contract Review</div>
                </div>
              </div>
              <motion.button
                onClick={async () => {
                  triggerHaptic(HapticPatterns.medium);
                  try {
                    // Analytics tracking
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', 'logout', {
                        event_category: 'engagement',
                        event_label: 'user_logout',
                        method: 'lawyer_dashboard'
                      });
                    }
                    await signOutMutation.mutateAsync();
                  } catch (error: any) {
                    console.error('Logout failed', error);
                  }
                }}
                disabled={signOutMutation.isPending}
                whileTap={animations.microTap}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  "text-white/70 hover:text-white hover:bg-white/10",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                aria-label="Log out"
              >
                {signOutMutation.isPending ? (
                  <Loader2 className={iconSizes.sm} />
                ) : (
                  <LogOut className={iconSizes.sm} />
                )}
              </motion.button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className={cn(iconSizes.sm, "absolute left-3 top-1/2 -translate-y-1/2 text-white/40")} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2 rounded-xl",
                  glass.appleSubtle,
                  "border border-white/10",
                  "text-white placeholder:text-white/40",
                  "focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                )}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'high_risk', 'payment', 'legal'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    setFilter(f);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    filter === f
                      ? "bg-purple-500 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/15"
                  )}
                >
                  {f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="overflow-y-auto h-[calc(100dvh-200px)]">
            {isLoading ? (
              <div className="p-4 text-center text-white/50">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-white/50">No conversations found</div>
            ) : (
              filteredConversations.map((conv) => (
                <motion.button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  whileTap={animations.microTap}
                  className={cn(
                    "w-full p-4 text-left border-b border-white/5",
                    "hover:bg-white/5 transition-colors",
                    selectedConversation === conv.id && "bg-white/10"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      "bg-gradient-to-br from-purple-500/20 to-indigo-500/20"
                    )}>
                      <MessageSquare className={iconSizes.md} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold truncate">
                          {conv.title || creatorParticipant?.profiles?.first_name || 'Conversation'}
                        </div>
                        {conv.unread_count_advisor > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500 text-xs font-semibold">
                            {conv.unread_count_advisor}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-white/60 truncate">
                        {conv.last_message?.content || 'No messages yet'}
                      </div>
                      {conv.risk_tag && (
                        <div className={cn(
                          "inline-block px-2 py-0.5 rounded text-xs mt-1",
                          conv.risk_tag === 'high_risk' && "bg-red-500/20 text-red-300",
                          conv.risk_tag === 'payment' && "bg-yellow-500/20 text-yellow-300",
                          conv.risk_tag === 'legal' && "bg-blue-500/20 text-blue-300"
                        )}>
                          {conv.risk_tag.replace('_', ' ')}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </aside>

        {/* Main Content - Conversation View */}
        <main className={cn(
          "flex-1 flex flex-col h-full",
          showChatOnMobile ? "flex" : "hidden md:flex"
        )}>
          {selectedConversation ? (
            <ConversationView
              conversation={selectedConv!}
              messages={messages}
              onBack={handleBack}
              onSendMessage={async (content) => {
                if (!user?.id) return;
                const { data, error } = await supabase
                  .from('messages')
                  .insert({
                    conversation_id: selectedConversation,
                    sender_id: user.id,
                    content: content.trim()
                  })
                  .select(`
                    *,
                    attachments:message_attachments(id, file_name, signed_download_url)
                  `)
                  .single();
                
                if (error) {
                  console.error('Failed to send message:', error);
                  throw error;
                }
                
                // Optimistically add message to UI immediately
                if (data) {
                  setMessages(prev => [...prev, data]);
                }
                
                // Also refetch to ensure we have the latest (triggers will update conversation metadata)
                setTimeout(() => {
                  const fetchMessages = async () => {
                    const { data: freshData } = await supabase
                      .from('messages')
                      .select(`
                        *,
                        attachments:message_attachments(id, file_name, signed_download_url)
                      `)
                      .eq('conversation_id', selectedConversation)
                      .eq('is_deleted', false)
                      .order('sent_at', { ascending: true });
                    if (freshData) setMessages(freshData);
                  };
                  fetchMessages();
                }, 500);
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white/50">
                <Scale className={cn(iconSizes.xl, "mx-auto mb-4 opacity-50")} />
                <p>Select a conversation to review contracts</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ConversationView({
  conversation,
  messages,
  onSendMessage,
  onBack
}: {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  onBack?: () => void;
}) {
  const { user } = useSession();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Scroll helper with fallbacks
  const scrollToLast = (smooth = true) => {
    const el = lastMessageRef.current;
    const container = messagesContainerRef.current;
    
    if (!container) return;
    
    // If we have a last message element, prefer scrollIntoView
    if (el && typeof el.scrollIntoView === 'function') {
      try {
        el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end', inline: 'nearest' });
        return;
      } catch (err) {
        // ignore and fall back
      }
    }
    
    // Fallback: adjust scrollTop
    container.scrollTop = container.scrollHeight - container.clientHeight;
  };

  // Auto-scroll when messages change
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    const latestId = messages[messages.length - 1]?.id;
    if (!latestId) return;
    
    const changed = lastMessageIdRef.current !== latestId;
    lastMessageIdRef.current = latestId;
    
    // On mobile, keyboard may shift layout. Allow a tiny delay:
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const timeout = isMobile ? 120 : 40;
    
    const t = setTimeout(() => {
      scrollToLast(changed);
    }, timeout);
    
    return () => clearTimeout(t);
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    
    setIsSending(true);
    try {
      await onSendMessage(newMessage);
      setNewMessage('');
      
      // Refocus input so keyboard stays up on mobile
      setTimeout(() => {
        inputRef.current?.focus();
        // Small delay then scroll to ensure new message is rendered
        setTimeout(() => {
          scrollToLast(true);
        }, 70);
      }, 30);
    } catch (err: any) {
      toast.error('Failed to send message', { description: err.message });
    } finally {
      setIsSending(false);
    }
  };

  const creatorParticipant = conversation.participants.find(p => p.role === 'creator');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn("p-4 border-b border-white/10 flex-shrink-0", glass.apple)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back button for mobile */}
            {onBack && (
              <button
                onClick={onBack}
                className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Back to conversations"
              >
                <ChevronLeft className={iconSizes.md} />
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
              <Scale className={iconSizes.md} />
            </div>
            <div>
              <div className="font-semibold">
                {conversation.title || creatorParticipant?.profiles?.first_name || 'Conversation'}
              </div>
              <div className="text-sm text-white/60">
                {creatorParticipant?.profiles?.first_name || ''} {creatorParticipant?.profiles?.last_name || ''}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {QUICK_REPLIES.slice(0, 2).map((reply, i) => (
              <button
                key={i}
                onClick={() => setNewMessage(reply)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs",
                  "bg-white/10 hover:bg-white/15",
                  "transition-colors"
                )}
              >
                Quick Reply
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto min-h-0 p-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {messages.map((msg, index) => {
          const isOwn = msg.sender_id === user?.id;
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
          
          // Improved grouping - group by sender and time (within same minute)
          const isFirstOfGroup = 
            index === 0 ||
            !prevMsg ||
            prevMsg.sender_id !== msg.sender_id ||
            new Date(msg.sent_at).getTime() - new Date(prevMsg.sent_at).getTime() > 60000;
          
          const isLastInGroup = !nextMsg || 
            nextMsg.sender_id !== msg.sender_id ||
            new Date(nextMsg.sent_at).getTime() - new Date(msg.sent_at).getTime() > 60000;
          
          const isGrouped = !isFirstOfGroup;
          const isLast = index === messages.length - 1;
          const showTail = isFirstOfGroup;
          
          return (
            <motion.div
              key={msg.id}
              ref={isLast ? lastMessageRef : undefined}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "flex mb-1",
                isOwn ? "justify-end" : "justify-start",
                isGrouped && "mt-0.5"
              )}
              aria-live={isLast ? 'polite' : undefined}
            >
              <div className={cn(
                "max-w-[80%] px-3 py-2 text-sm",
                // WhatsApp/iMessage style rounded corners
                isOwn
                  ? cn(
                      "bg-purple-600 text-white",
                      showTail ? "rounded-2xl rounded-br-sm" : "rounded-2xl"
                    )
                  : cn(
                      "bg-white/10 text-white",
                      showTail ? "rounded-2xl rounded-bl-sm" : "rounded-2xl"
                    )
              )}>
                <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.signed_download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-white/80 hover:text-white"
                      >
                        <FileText className={iconSizes.sm} />
                        {att.file_name}
                        <Download className={iconSizes.sm} />
                      </a>
                    ))}
                  </div>
                )}
                <div className={cn(
                  "text-[10px] mt-1 flex items-center gap-1",
                  isOwn ? "text-white/70 justify-end" : "text-white/50"
                )}>
                  {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input */}
      <div className={cn("p-4 border-t border-white/10 flex-shrink-0", glass.apple)}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className={cn(
              "flex-1 px-4 py-2 rounded-xl",
              glass.appleSubtle,
              "border border-white/10",
              "text-white placeholder:text-white/40",
              "focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            )}
          />
          <motion.button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            whileTap={animations.microTap}
            className={cn(
              "px-6 py-2 rounded-xl font-medium",
              "bg-purple-500 hover:bg-purple-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            <Send className={iconSizes.sm} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

