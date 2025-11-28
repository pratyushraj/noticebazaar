"use client";

// Notice Bazaar - Secure Messages (single-file safe snapshot)
// IMPORTANT: This file is a self-contained React + TypeScript snapshot designed to avoid duplicate
// declaration issues by keeping all components scoped in this file.

import { useEffect, useRef, useState, useMemo } from 'react';
import clsx from 'clsx';
import { Lock, MessageSquare, ArrowUp, Loader2, ChevronRight, FileText, Mic, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import { useProfiles } from '@/lib/hooks/useProfiles';
import { useMessages, useSendMessage } from '@/lib/hooks/useMessages';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSampleChatHistory } from '@/lib/hooks/useSampleChatHistory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateAvatarUrl } from '@/lib/utils/avatar';
import { useCometChat } from '@/lib/cometchat/useCometChat';
import { COMETCHAT_CONFIG } from '@/lib/cometchat/config';
import { AdvisorModeSwitch } from '@/components/AdvisorModeSwitch';
import { ContextualTipsProvider } from '@/components/contextual-tips/ContextualTipsProvider';
import { NoMessagesEmptyState } from '@/components/empty-states/PreconfiguredEmptyStates';

// --- Types (local to this file) ---
type Advisor = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  online?: boolean;
  lastMessage?: string;
  unreadCount?: number;
  isTyping?: boolean;
};

type Message = {
  id: string;
  advisorId: string;
  author: 'user' | 'advisor';
  text: string;
  createdAt: string;
};

// --- Local Avatar (single canonical avatar used in this file) ---
function LocalAvatar({ src, alt, size = 'md' }: { src?: string; alt?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const initials = alt ? alt.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
  
  return (
    <div className={clsx('inline-flex items-center justify-center overflow-hidden rounded-full bg-muted/30', dims)} title={alt}>
      {src ? (
        <img src={src} alt={alt} className="object-cover w-full h-full" />
      ) : (
        <span className="text-xs text-muted-foreground">{initials}</span>
      )}
    </div>
  );
}

// --- AdvisorCard (scoped, not exported) ---
function AdvisorCardScoped({ advisor, selected, onClick }: { advisor: Advisor; selected?: boolean; onClick?: (a: Advisor) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(advisor)}
      className={clsx(
        'w-full text-left rounded-[20px] flex items-center gap-3 transition-all duration-150 ease-in-out',
        'border',
        selected 
          ? 'bg-blue-500/20 ring-2 ring-blue-400/50 border-blue-400/50 shadow-[0_6px_20px_rgba(59,130,246,0.15)] p-3.5 scale-[1.02]' 
          : 'border-border/40 p-3 hover:bg-muted/30'
      )}
    >
      <div className="relative flex-shrink-0">
        <LocalAvatar size="sm" src={advisor.avatarUrl} alt={advisor.name} />
        {advisor.online && (
          <span className="absolute right-0 bottom-0 inline-block w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-background" />
        )}
        {/* Unread dot */}
        {advisor.unreadCount && advisor.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 bg-red-500 rounded-full text-[10px] font-semibold text-white ring-2 ring-background">
            {advisor.unreadCount > 9 ? '9+' : advisor.unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-[15px] font-semibold text-foreground truncate">{advisor.name}</div>
          {advisor.isTyping && (
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
        <div className="text-[13px] text-muted-foreground truncate">{advisor.role}</div>
        {/* Last message preview */}
        {advisor.lastMessage && (
          <div className="text-[13px] text-muted-foreground/70 truncate mt-0.5">
            {advisor.lastMessage}
          </div>
        )}
      </div>

      <div className={clsx('p-1 rounded-md flex-shrink-0', selected ? 'text-blue-400' : 'text-muted-foreground/40')}>
        <MessageSquare size={16} />
      </div>
    </button>
  );
}

// --- AdvisorList (scoped) ---
function AdvisorListScoped({ 
  advisors, 
  selectedId, 
  onSelect, 
  isLoading 
}: { 
  advisors: Advisor[]; 
  selectedId?: string | null; 
  onSelect?: (a: Advisor) => void;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <aside className="w-[280px] min-w-[260px] max-w-[280px] p-4 rounded-xl bg-card border border-border/40 shadow-sm flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-xs text-muted-foreground">Loading advisors...</p>
      </aside>
    );
  }

  if (advisors.length === 0) {
    return (
      <aside className="w-[280px] min-w-[260px] max-w-[280px] p-4 rounded-xl bg-card border border-border/40 shadow-sm flex flex-col items-center justify-center min-h-[200px]">
        <p className="text-xs text-muted-foreground text-center">No advisors available.</p>
      </aside>
    );
  }

  return (
    <aside className="w-[280px] min-w-[260px] max-w-[280px] rounded-xl bg-card border border-border/40 shadow-sm shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40 bg-muted/20">
        <div className="text-[10px] text-muted-foreground tracking-wide uppercase">Select Advisor</div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 flex flex-col gap-2">
          {advisors.map((a) => (
            <AdvisorCardScoped key={a.id} advisor={a} selected={selectedId === a.id} onClick={onSelect} />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}

// --- ChatHeader (scoped) ---
function ChatHeaderScoped({ 
  advisor, 
  advisors, 
  onSwitchAdvisor 
}: { 
  advisor?: Advisor | null;
  advisors?: Advisor[];
  onSwitchAdvisor?: (advisorId: string) => void;
}) {
  const otherAdvisor = advisors?.find(a => a.id !== advisor?.id);
  const currentMode: "ca" | "advisor" = advisor?.role === 'Chartered Accountant' ? "ca" : "advisor";
  
  const handleToggle = () => {
    if (otherAdvisor && onSwitchAdvisor) {
      onSwitchAdvisor(otherAdvisor.id);
    }
  };
  
  return (
    <div className="flex items-center justify-between px-2 md:px-4 py-1.5 md:py-3 border-b border-white/10 bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] flex-shrink-0">
      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
        <LocalAvatar size="sm" src={advisor?.avatarUrl} alt={advisor?.name || 'Advisor'} />
        <div className="leading-tight flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{advisor?.name ?? 'Select an advisor'}</div>
          <div className="text-xs text-white/60 truncate">{advisor?.role ?? ''}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {otherAdvisor && onSwitchAdvisor && (
          <AdvisorModeSwitch 
            mode={currentMode}
            onToggle={handleToggle}
          />
        )}
        <div className="hidden md:inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] border border-border/40 bg-muted/20 text-muted-foreground">
          <Lock size={12} />
          <span>End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
}

// --- MessageInput (scoped) ---
function MessageInputScoped({ onSend, isLoading }: { onSend?: (text: string) => void; isLoading?: boolean }) {
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
  }, [value]);

  // Hold-to-record voice message
  const handleMicMouseDown = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Create audio blob for future upload
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // TODO: Upload audio blob and send URL
        // For now, we just show a toast - audioBlob will be used when upload is implemented
        console.log('Voice message recorded:', audioBlob.size, 'bytes');
        toast.info('Voice message recorded! (Upload functionality coming soon)');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast.error('Microphone access denied');
    }
  };

  const handleMicMouseUp = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    if (!value.trim() || isLoading) return;
    onSend?.(value.trim());
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full flex flex-col flex-shrink-0">
      {/* iOS 17 Capsule Input - Larger radius, stronger blur, proper shadows */}
      <div className="w-full px-4 md:px-5 py-3 flex items-center justify-between gap-2.5 md:gap-3 bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] min-h-[52px] md:min-h-[56px] transition-all duration-300 ease-out focus-within:border-purple-400/50 focus-within:shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),0_0_0_2px_rgba(168,85,247,0.2)]">
        {/* Voice message button (hold to record) */}
        <button 
          className={clsx(
            "p-2 rounded-full transition-all duration-200 flex-shrink-0 w-10 h-10 md:w-11 md:h-11 flex items-center justify-center self-center",
            isRecording
              ? "bg-red-500/30 text-red-400 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]"
              : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white active:scale-95"
          )}
          type="button"
          onMouseDown={handleMicMouseDown}
          onMouseUp={handleMicMouseUp}
          onTouchStart={handleMicMouseDown}
          onTouchEnd={handleMicMouseUp}
          aria-label="Hold to record voice message"
        >
          <Mic size={16} className="md:w-5 md:h-5" />
        </button>

        {/* Text input area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your secure message…"
          disabled={isLoading}
          className="resize-none overflow-hidden bg-transparent flex-1 text-[16px] md:text-[15px] py-2.5 outline-none placeholder:text-white/50 text-white disabled:opacity-50 max-h-[96px] leading-relaxed"
          rows={1}
        />

        {/* Send button - iOS 17 style, brighter when active */}
        <button
          onClick={handleSend}
          disabled={!value.trim() || isLoading}
          className={clsx(
            "flex-shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 ease-out disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 touch-manipulation",
            value.trim()
              ? "bg-gradient-to-br from-[#A855F7] to-[#9333EA] hover:from-[#9333EA] hover:to-[#7E22CE] text-white shadow-[0_4px_16px_rgba(168,85,247,0.5),0_0_0_1px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_24px_rgba(168,85,247,0.6),0_0_0_2px_rgba(168,85,247,0.4)]"
              : "bg-white/[0.08] text-white/40 hover:bg-white/[0.12]"
          )}
          aria-label="Send message"
          type="button"
        >
          <ArrowUp size={20} className="md:w-6 md:h-6" />
        </button>
      </div>
    </div>
  );
}

// --- MessageBubble (scoped) ---
function MessageBubbleScoped({ 
  message, 
  isCurrentUser, 
  currentUserAvatar, 
  advisorAvatar, 
  currentUserName, 
  advisorName 
}: { 
  message: Message; 
  isCurrentUser: boolean;
  currentUserAvatar?: string;
  advisorAvatar?: string;
  currentUserName?: string;
  advisorName?: string;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={clsx('flex items-end gap-2', isCurrentUser ? 'justify-end' : 'justify-start')}>
      {!isCurrentUser && (
        <LocalAvatar 
          size="sm" 
          src={advisorAvatar} 
          alt={advisorName || 'Advisor'} 
        />
      )}
      
      <div
        className={clsx(
          'inline-block text-[15px] leading-[1.4] p-3.5 md:p-4 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.15)] max-w-[75%]',
          isCurrentUser
            ? 'bg-gradient-to-br from-[#007AFF] to-[#0051D5] text-white rounded-br-[4px] shadow-[0_4px_12px_rgba(0,122,255,0.3)]'
            : 'bg-white/[0.08] backdrop-blur-[20px] text-white rounded-bl-[4px] border border-white/10'
        )}
      >
        <p className="leading-relaxed break-words">{message.text}</p>
        <div className={clsx(
          "text-[11px] mt-1",
          isCurrentUser ? "text-white/70" : "text-muted-foreground"
        )}>
          {time}
        </div>
      </div>
      
      {isCurrentUser && (
        <LocalAvatar 
          size="sm" 
          src={currentUserAvatar} 
          alt={currentUserName || 'You'} 
        />
      )}
    </div>
  );
}

// --- ChatWindow (scoped) ---
function ChatWindowScoped({ 
  advisor,
  advisors,
  messages, 
  onSend,
  onSwitchAdvisor,
  currentUserAvatar,
  currentUserName
}: { 
  advisor?: Advisor | null;
  advisors?: Advisor[];
  messages?: Message[]; 
  onSend?: (text: string) => void;
  onSwitchAdvisor?: (advisorId: string) => void;
  currentUserAvatar?: string;
  currentUserName?: string;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasMessages = (messages ?? []).length > 0;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col rounded-none md:rounded-[20px] md:border md:border-white/15 bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] md:shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex-1 min-h-0">
      <ChatHeaderScoped advisor={advisor} advisors={advisors} onSwitchAdvisor={onSwitchAdvisor} />

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 md:p-6 lg:p-8">
          {!hasMessages ? (
            <NoMessagesEmptyState
              onStartChat={() => onSend?.('Hello! I need help.')}
              onUploadContract={() => {
                toast.info('Upload contract feature coming soon');
                navigate('/contract-upload');
              }}
            />
          ) : (
            <div className="space-y-4">
              {messages!.map((m) => (
                <MessageBubbleScoped
                  key={m.id}
                  message={m}
                  isCurrentUser={m.author === 'user'}
                  currentUserAvatar={currentUserAvatar}
                  advisorAvatar={advisor?.avatarUrl}
                  currentUserName={currentUserName}
                  advisorName={advisor?.name}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// --- Main MessagesPage Component ---
export default function MessagesPage() {
  const navigate = useNavigate();
  const { loading: sessionLoading, profile, isAdmin, user } = useSession();
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [typingAdvisors, setTypingAdvisors] = useState<Set<string>>(new Set());
  const [useCometChatEnabled, setUseCometChatEnabled] = useState(false);
  const queryClient = useQueryClient();

  // Check if CometChat is configured
  useEffect(() => {
    setUseCometChatEnabled(!!COMETCHAT_CONFIG.APP_ID);
  }, []);

  const currentUserId = user?.id;
  const isClient = profile?.role === 'client';

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- Admin View ---
  const { data: clientProfilesData, isLoading: isLoadingClientProfiles, error: clientProfilesError } = useProfiles({
    role: 'client',
    enabled: isAdmin && !!profile,
    disablePagination: true,
  });
  const clientProfiles = clientProfilesData?.data || [];

  // --- Client View ---
  const { data: adminProfilesData, isLoading: isLoadingAdminProfile, error: adminProfileError } = useProfiles({
    role: 'admin',
    enabled: !isAdmin && !!profile,
    disablePagination: true,
  });
  const adminProfile = adminProfilesData?.data?.[0] || null;

  const { data: caProfilesData, isLoading: isLoadingCAProfile, error: caProfileError } = useProfiles({
    role: 'chartered_accountant',
    enabled: !isAdmin && !!profile,
    disablePagination: true,
  });
  const caProfile = caProfilesData?.data?.[0] || null;

  // Convert profiles to Advisor format (deduplicated by ID)
  const advisors: Advisor[] = useMemo(() => {
    if (isAdmin) {
      return clientProfiles.map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        role: 'Client',
        avatarUrl: p.avatar_url || generateAvatarUrl(p.first_name, p.last_name),
        online: false, // TODO: Implement online status
        lastMessage: undefined,
        unreadCount: 0,
        isTyping: false,
      }));
    } else {
      const result: Advisor[] = [];
      const seenIds = new Set<string>();
      
      if (adminProfile && !seenIds.has(adminProfile.id)) {
        seenIds.add(adminProfile.id);
        result.push({
          id: adminProfile.id,
          name: `${adminProfile.first_name} ${adminProfile.last_name}`,
          role: 'Legal Advisor',
          avatarUrl: adminProfile.avatar_url || generateAvatarUrl(adminProfile.first_name, adminProfile.last_name),
          online: false,
          lastMessage: undefined,
          unreadCount: 0,
          isTyping: false,
        });
      }
      if (caProfile && !seenIds.has(caProfile.id)) {
        seenIds.add(caProfile.id);
        result.push({
          id: caProfile.id,
          name: `${caProfile.first_name} ${caProfile.last_name}`,
          role: 'Chartered Accountant',
          avatarUrl: caProfile.avatar_url || generateAvatarUrl(caProfile.first_name, caProfile.last_name),
          online: false,
          lastMessage: undefined,
          unreadCount: 0,
          isTyping: false,
        });
      }
      return result;
    }
  }, [isAdmin, clientProfiles, adminProfile, caProfile]);

  // Auto-select first advisor
  useEffect(() => {
    if (advisors.length > 0 && !selectedAdvisorId) {
      setSelectedAdvisorId(advisors[0].id);
    }
  }, [advisors, selectedAdvisorId]);

  // Try CometChat first, fallback to Supabase
  const cometChat = useCometChat({
    currentUserId: currentUserId,
    receiverId: selectedAdvisorId || '',
    enabled: useCometChatEnabled && !!currentUserId && !!selectedAdvisorId,
  });

  // Supabase messages (fallback)
  const { data: realMessages, isLoading: isLoadingMessages } = useMessages({
    currentUserId: currentUserId,
    receiverId: selectedAdvisorId || '',
    enabled: !useCometChatEnabled && !!currentUserId && !!selectedAdvisorId,
  });

  // Update typing indicators from CometChat
  useEffect(() => {
    if (cometChat.isTyping && selectedAdvisorId) {
      setTypingAdvisors(new Set([selectedAdvisorId]));
    } else if (!cometChat.isTyping && selectedAdvisorId) {
      setTypingAdvisors((prev) => {
        const next = new Set(prev);
        next.delete(selectedAdvisorId);
        return next;
      });
    }
  }, [cometChat.isTyping, selectedAdvisorId]);

  // Generate sample history if no real messages exist AND the user is a client
  const sampleHistory = useSampleChatHistory(profile?.first_name || null);
  
  // Convert messages to new format (CometChat or Supabase)
  const messages: Message[] = useMemo(() => {
    if (!selectedAdvisorId || !currentUserId) return [];

    // Use CometChat messages if available
    if (useCometChatEnabled && cometChat.messages.length > 0) {
      return cometChat.messages.map(msg => ({
        id: msg.id,
        advisorId: selectedAdvisorId,
        author: msg.senderId === currentUserId ? 'user' : 'advisor',
        text: msg.text,
        createdAt: new Date(msg.timestamp).toISOString(),
      }));
    }

    // Use sample history if available (fallback)
    if ((!realMessages || realMessages.length === 0) && isClient && sampleHistory.length > 0) {
      return sampleHistory.map(msg => ({
        id: msg.id,
        advisorId: selectedAdvisorId,
        author: msg.sender_id === 'client' ? 'user' : 'advisor',
        text: typeof msg.content === 'string' ? msg.content : String(msg.content),
        createdAt: msg.sent_at,
      }));
    }

    // Convert Supabase messages
    if (!realMessages) return [];
    return realMessages.map(msg => ({
      id: msg.id,
      advisorId: selectedAdvisorId,
      author: msg.sender_id === currentUserId ? 'user' : 'advisor',
      text: typeof msg.content === 'string' ? msg.content : String(msg.content),
      createdAt: msg.sent_at,
    }));
  }, [cometChat.messages, realMessages, selectedAdvisorId, currentUserId, isClient, sampleHistory, useCometChatEnabled]);

  // Compute last message and unread count for each advisor
  const advisorsWithMetadata = useMemo(() => {
    return advisors.map(advisor => {
      const advisorMessages = messages.filter(m => m.advisorId === advisor.id);
      const lastMessage = advisorMessages.length > 0 
        ? advisorMessages[advisorMessages.length - 1]
        : null;
      
      // Get last message preview text
      let lastMessageText: string | undefined;
      if (lastMessage) {
        const prefix = lastMessage.author === 'user' ? 'You: ' : `${advisor.name.split(' ')[0]}: `;
        lastMessageText = prefix + (lastMessage.text.length > 40 
          ? lastMessage.text.substring(0, 40) + '...' 
          : lastMessage.text);
      }

      // Calculate unread count (messages from advisor that user hasn't seen)
      // TODO: Implement proper unread tracking with seen_at timestamp
      const unreadCount = advisorMessages.filter(m => m.author === 'advisor').length;

      return {
        ...advisor,
        lastMessage: lastMessageText,
        unreadCount: unreadCount > 0 ? unreadCount : undefined,
        isTyping: typingAdvisors.has(advisor.id),
      };
    });
  }, [advisors, messages, typingAdvisors]);

  // Typing indicator simulation (only if not using CometChat)
  useEffect(() => {
    if (useCometChatEnabled) return; // CometChat handles typing indicators
    
    const interval = setInterval(() => {
      if (selectedAdvisorId && Math.random() > 0.7) {
        setTypingAdvisors(new Set([selectedAdvisorId]));
        setTimeout(() => setTypingAdvisors(new Set()), 2000);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedAdvisorId, useCometChatEnabled]);

  // Real-time subscription
  useEffect(() => {
    if (currentUserId && selectedAdvisorId) {
      const sortedIds = [currentUserId, selectedAdvisorId].sort();
      const channelName = `chat_${sortedIds[0]}_${sortedIds[1]}`;

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedAdvisorId}),and(sender_id.eq.${selectedAdvisorId},receiver_id.eq.${currentUserId}))`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['messages', currentUserId, selectedAdvisorId] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUserId, selectedAdvisorId, queryClient]);

  const sendMessageMutation = useSendMessage();

  const handleSelectAdvisor = (advisor: Advisor) => {
    setSelectedAdvisorId(advisor.id);
  };

  const handleSend = async (text: string) => {
    if (!selectedAdvisorId || !currentUserId || !profile) return;

    try {
      // Try CometChat first if enabled and initialized
      if (useCometChatEnabled && cometChat.isInitialized) {
        await cometChat.sendMessage(text);
        return;
      }

      // Fallback to Supabase
      await sendMessageMutation.mutateAsync({
        sender_id: currentUserId,
        receiver_id: selectedAdvisorId,
        content: text,
        senderFirstName: profile.first_name || '',
        senderLastName: profile.last_name || '',
        receiverFirstName: advisors.find(a => a.id === selectedAdvisorId)?.name.split(' ')[0] || '',
        receiverLastName: advisors.find(a => a.id === selectedAdvisorId)?.name.split(' ')[1] || undefined,
      });
    } catch (error: any) {
      toast.error('Failed to send message', { description: error.message });
    }
  };

  useEffect(() => {
    if (clientProfilesError) {
      toast.error('Error fetching client profiles', { description: clientProfilesError.message });
    }
    if (adminProfileError || caProfileError) {
      toast.error('Error fetching advisor profiles', { description: (adminProfileError || caProfileError)?.message });
    }
  }, [clientProfilesError, adminProfileError, caProfileError]);

  const isLoadingPage = sessionLoading || isLoadingClientProfiles || isLoadingAdminProfile || isLoadingCAProfile;
  const selectedAdvisor = advisors.find(a => a.id === selectedAdvisorId);
  const isLoadingAdvisors = isAdmin ? isLoadingClientProfiles : (isLoadingAdminProfile || isLoadingCAProfile);
  const currentUserName = profile ? `${profile.first_name} ${profile.last_name}` : 'You';

  if (isLoadingPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading messages page...</p>
      </div>
    );
  }

  return (
    <ContextualTipsProvider currentView="messages">
    <div className="flex flex-col h-[100dvh] md:h-screen md:p-6 overflow-hidden">
      {/* Scrollable content - shrinks when keyboard opens */}
      <div className="flex-1 overflow-y-auto min-h-0 px-0 pb-0 md:pb-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="w-full max-w-[460px] mx-auto md:mx-0 md:max-w-none">
          {/* Back to Dashboard Button */}
          <div className="flex justify-start mb-4">
            <button
              onClick={() => navigate('/creator-dashboard')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] backdrop-blur-[20px] border border-white/15 hover:bg-white/[0.12] hover:border-white/20 transition-all text-sm font-medium text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          {/* Main content area */}
          <div className="flex gap-6 h-full">
            {/* Desktop: Fixed sidebar */}
            {!isMobile && (
              <AdvisorListScoped
                advisors={advisorsWithMetadata}
                selectedId={selectedAdvisorId}
                onSelect={handleSelectAdvisor}
                isLoading={isLoadingAdvisors}
              />
            )}

            {/* Chat Window */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              <ChatWindowScoped
                advisor={selectedAdvisor}
                advisors={advisors}
                messages={messages}
                onSend={handleSend}
                onSwitchAdvisor={(advisorId) => {
                  const advisor = advisors.find(a => a.id === advisorId);
                  if (advisor) {
                    handleSelectAdvisor(advisor);
                  }
                }}
                currentUserAvatar={profile?.avatar_url || undefined}
                currentUserName={currentUserName}
              />
            </div>
          </div>

          {/* Footer - hidden on mobile, shown on desktop */}
          <footer className="hidden md:block mt-8 text-center text-[11px] opacity-40">
            © 2025 NoticeBazaar — Secure Legal Portal
          </footer>
        </div>
      </div>

      {/* FIXED input bar - iOS style, docks to keyboard */}
      <div 
        className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto w-full max-w-[460px] mx-auto md:max-w-none md:mx-0 px-4 md:px-5 pt-3 md:pb-3 flex-shrink-0 z-[60] bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] border-t border-white/10 md:border-t-0 md:bg-transparent transition-all duration-300 ease-out safe-area-inset-bottom"
        style={{ 
          paddingBottom: `max(12px, env(safe-area-inset-bottom, 12px))`,
          paddingTop: '12px'
        }}
      >
        <MessageInputScoped
          onSend={handleSend}
          isLoading={sendMessageMutation.isPending || isLoadingMessages || cometChat.isLoading}
        />
      </div>
    </div>
    </ContextualTipsProvider>
  );
}
