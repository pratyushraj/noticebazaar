// Advisor Dashboard - Inbox, conversation view, contract preview, quick replies
// Matches existing CreatorArmour design (purple gradient, glass cards)

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { MessageSquare, Search, FileText, Send, Download, ChevronLeft, LogOut, Loader2 } from 'lucide-react';
import { iconSizes, glass, animations } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { toast } from 'sonner';
import { useSignOut } from '@/lib/hooks/useAuth';
import { LinkPreview, extractUrls, renderMessageText } from '@/components/messages/LinkPreview';

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
  "The payment terms look good. Proceeding with the deal.",
  "I need clarification on the exclusivity clause.",
  "Tax information is missing. Please provide GST details."
];

export default function AdvisorDashboard() {
  const { profile, user } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<'all' | 'high_risk' | 'payment' | 'tax'>('all');
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
        // First, get conversations where user is a participant
        const { data: participantData, error: participantError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        if (participantError) throw participantError;

        const conversationIds = participantData?.map(p => p.conversation_id) || [];
        
        if (conversationIds.length === 0) {
          setConversations([]);
          setIsLoading(false);
          return;
        }

        // Fetch conversations
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            *
          `)
          .in('id', conversationIds)
          .order('updated_at', { ascending: false });

        if (conversationsError) throw conversationsError;

        // Fetch last-message payloads separately.
        // Some environments return 400 from PostgREST for the `messages!last_message_id(...)` embed,
        // so we avoid the join and stitch results client-side.
        const lastMessageIds = Array.from(
          new Set((conversationsData || []).map((c: any) => c?.last_message_id).filter(Boolean))
        );
        const lastMessagesById = new Map<string, { content: string; sent_at: string }>();
        if (lastMessageIds.length > 0) {
          const { data: lastMessages, error: lastMessagesError } = await supabase
            .from('messages')
            .select('id, content, sent_at')
            .in('id', lastMessageIds);
          if (lastMessagesError) {
            // Non-fatal: render list without last message.
            console.warn('[AdvisorDashboard] Failed to fetch last messages:', lastMessagesError.message);
          } else {
            for (const m of lastMessages || []) {
              lastMessagesById.set(m.id, { content: m.content, sent_at: m.sent_at });
            }
          }
        }

        // Fetch all participants for these conversations
        const { data: allParticipants, error: participantsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id, role')
          .in('conversation_id', conversationIds);

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

        // Join conversations with participants and profiles
        const conversationsWithParticipants = conversationsData?.map(conv => ({
          ...conv,
          last_message: conv?.last_message_id ? lastMessagesById.get(conv.last_message_id) ?? null : null,
          participants: allParticipants
            ?.filter(p => p.conversation_id === conv.id)
            .map(p => ({
              user_id: p.user_id,
              role: p.role,
              profiles: profilesMap.get(p.user_id) || null
            })) || []
        })) || [];

        setConversations(conversationsWithParticipants);
      } catch (err: any) {
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
      void supabase.removeChannel(channel);
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

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${selectedConversation}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversation}`
      }, () => {
        fetchMessages();
      })
      .subscribe();

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
    <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-foreground">
      <div className="flex min-h-dvh">
        {/* Left Sidebar - Filters & Conversation List */}
        <aside className={cn(
          "w-full md:w-80 border-r border-border bg-card backdrop-blur-xl",
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
                  <MessageSquare className={iconSizes.md} />
                </div>
                <div>
                  <div className="font-semibold">Chartered Accountant</div>
                  <div className="text-xs text-foreground/60">Tax & Finance</div>
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
                        method: 'advisor_dashboard'
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
                  "text-foreground/70 hover:text-foreground hover:bg-secondary/50",
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
              <Search className={cn(iconSizes.sm, "absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40")} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2 rounded-xl",
                  glass.appleSubtle,
                  "border border-border",
                  "text-foreground placeholder:text-foreground/40",
                  "focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                )}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'high_risk', 'payment', 'tax'] as const).map((f) => (
                <button type="button"
                  key={f}
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    setFilter(f);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    filter === f
                      ? "bg-secondary text-foreground"
                      : "bg-secondary/50 text-foreground/70 hover:bg-secondary/15"
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
              <div className="p-4 text-center text-foreground/50">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-foreground/50">No conversations found</div>
            ) : (
              filteredConversations.map((conv) => (
                <motion.button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  whileTap={animations.microTap}
                  className={cn(
                    "w-full p-4 text-left border-b border-border/5",
                    "hover:bg-card transition-colors",
                    selectedConversation === conv.id && "bg-secondary/50"
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
                          <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-semibold">
                            {conv.unread_count_advisor}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-foreground/60 truncate">
                        {conv.last_message?.content || 'No messages yet'}
                      </div>
                      {conv.risk_tag && (
                        <div className={cn(
                          "inline-block px-2 py-0.5 rounded text-xs mt-1",
                          conv.risk_tag === 'high_risk' && "bg-destructive/20 text-destructive",
                          conv.risk_tag === 'payment' && "bg-yellow-500/20 text-yellow-300",
                          conv.risk_tag === 'tax' && "bg-info/20 text-info"
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
                const { error } = await supabase.from('messages').insert({
                  conversation_id: selectedConversation,
                  sender_id: user.id,
                  content
                });
                if (error) throw error;
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-foreground/50">
                <MessageSquare className={cn(iconSizes.xl, "mx-auto mb-4 opacity-50")} />
                <p>Select a conversation to view messages</p>
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
      <div className={cn("p-4 border-b border-border flex-shrink-0", glass.apple)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back button for mobile */}
            {onBack && (
              <button type="button"
                onClick={onBack}
                className="md:hidden p-2 -ml-2 rounded-lg hover:bg-secondary/50 transition-colors"
                aria-label="Back to conversations"
              >
                <ChevronLeft className={iconSizes.md} />
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
              <MessageSquare className={iconSizes.md} />
            </div>
            <div>
              <div className="font-semibold">
                {conversation.title || creatorParticipant?.profiles?.first_name || 'Conversation'}
              </div>
              <div className="text-sm text-foreground/60">
                {creatorParticipant?.profiles?.first_name || ''} {creatorParticipant?.profiles?.last_name || ''}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {QUICK_REPLIES.slice(0, 2).map((reply, i) => (
              <button type="button"
                key={i}
                onClick={() => setNewMessage(reply)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs",
                  "bg-secondary/50 hover:bg-secondary/15",
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
                      "bg-secondary text-foreground",
                      showTail ? "rounded-2xl rounded-br-sm" : "rounded-2xl"
                    )
                  : cn(
                      "bg-secondary/50 text-foreground",
                      showTail ? "rounded-2xl rounded-bl-sm" : "rounded-2xl"
                    )
              )}>
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed break-words">
                    {renderMessageText(msg.content)}
                  </p>
                  {extractUrls(msg.content).map((url, i) => (
                    <LinkPreview key={i} url={url} />
                  ))}
                </div>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.signed_download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-foreground/80 hover:text-foreground"
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
                  isOwn ? "text-foreground/70 justify-end" : "text-foreground/50"
                )}>
                  {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input */}
      <div className={cn("p-4 border-t border-border flex-shrink-0", glass.apple)}>
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
              "border border-border",
              "text-foreground placeholder:text-foreground/40",
              "focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            )}
          />
          <motion.button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            whileTap={animations.microTap}
            className={cn(
              "px-6 py-2 rounded-xl font-medium",
              "bg-secondary hover:bg-secondary",
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
