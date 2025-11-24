"use client";

// Notice Bazaar - Secure Messages (single-file safe snapshot)
// IMPORTANT: This file is a self-contained React + TypeScript snapshot designed to avoid duplicate
// declaration issues by keeping all components scoped in this file.

import { useEffect, useRef, useState, useMemo } from 'react';
import clsx from 'clsx';
import { Lock, MessageSquare, Paperclip, ArrowUp, Loader2, ChevronRight, FileText, Mic, MicOff } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import { useProfiles } from '@/lib/hooks/useProfiles';
import { useMessages, useSendMessage } from '@/lib/hooks/useMessages';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSampleChatHistory } from '@/lib/hooks/useSampleChatHistory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateAvatarUrl } from '@/lib/utils/avatar';
import SmartInboxZero from '@/components/messages/SmartInboxZero';

// --- Types (local to this file) ---
type Advisor = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  online?: boolean;
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
        'w-full text-left rounded-xl p-3 flex items-center gap-3 transition-all duration-150 ease-in-out',
        'border border-border/40',
        selected ? 'bg-muted/40 ring-1 ring-blue-400/30 shadow-[0_6px_20px_rgba(59,130,246,0.06)]' : 'hover:bg-muted/30'
      )}
    >
      <div className="relative flex-shrink-0">
        <LocalAvatar size="sm" src={advisor.avatarUrl} alt={advisor.name} />
        {advisor.online && (
          <span className="absolute right-0 bottom-0 inline-block w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-background" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{advisor.name}</div>
        <div className="text-xs text-muted-foreground truncate">{advisor.role}</div>
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
function ChatHeaderScoped({ advisor }: { advisor?: Advisor | null }) {
  return (
    <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-white/5 bg-white/[0.06] backdrop-blur-[40px] flex-shrink-0">
      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
        <LocalAvatar size="sm" src={advisor?.avatarUrl} alt={advisor?.name || 'Advisor'} />
        <div className="leading-tight flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{advisor?.name ?? 'Select an advisor'}</div>
          <div className="text-xs text-white/60 truncate">{advisor?.role ?? ''}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
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
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null); // SpeechRecognition type

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
  }, [value]);

  // Voice-to-text setup
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setValue(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error('Speech recognition error. Please try again.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleVoiceToggle = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
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
    <div className="w-full px-3 md:px-4 py-1.5 bg-white/[0.06] backdrop-blur-[40px] border-t border-white/5 flex-shrink-0">
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-2 md:px-3 py-1 transition-all duration-150 focus-within:border-blue-400/50 focus-within:ring-1 focus-within:ring-blue-400/20">
        <button 
          className="p-1.5 rounded-full hover:bg-white/10 transition text-white/60 hover:text-white flex-shrink-0" 
          type="button"
          onClick={() => {
            // TODO: Implement attachment functionality
          }}
        >
          <Paperclip size={16} className="md:w-[18px] md:h-[18px]" />
        </button>

        {/* Voice-to-text button */}
        <button
          onClick={handleVoiceToggle}
          className={clsx(
            "p-1.5 rounded-full transition flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center",
            isListening 
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse" 
              : "hover:bg-white/10 text-white/60 hover:text-white"
          )}
          type="button"
          aria-label={isListening ? "Stop recording" : "Start voice input"}
        >
          {isListening ? (
            <MicOff size={16} className="md:w-[18px] md:h-[18px]" />
          ) : (
            <Mic size={16} className="md:w-[18px] md:h-[18px]" />
          )}
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your secure message…"
          disabled={isLoading}
          className="resize-none overflow-hidden bg-transparent flex-1 text-sm outline-none placeholder:text-white/40 text-white disabled:opacity-50 max-h-[96px]"
          rows={1}
        />

        <button
          onClick={handleSend}
          disabled={!value.trim() || isLoading}
          className={clsx(
            "ml-1 md:ml-2 w-8 h-8 md:w-9 md:h-9 rounded-full bg-blue-600 hover:bg-blue-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center border border-blue-400/30 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]",
            value.trim() && "hover:shadow-[0_0_0_2px_rgba(59,130,246,0.3),0_4px_12px_rgba(59,130,246,0.2)]"
          )}
          aria-label="Send message"
          type="button"
        >
          <ArrowUp size={14} className="md:w-4 md:h-4 text-white" />
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
          'inline-block text-sm p-3 rounded-2xl shadow-sm max-w-[75%]',
          isCurrentUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-muted/30 text-foreground rounded-bl-md'
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
  messages, 
  onSend, 
  isLoading,
  currentUserAvatar,
  currentUserName
}: { 
  advisor?: Advisor | null; 
  messages?: Message[]; 
  onSend?: (text: string) => void;
  isLoading?: boolean;
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
    <div className="flex-1 flex flex-col rounded-xl md:border md:border-white/10 overflow-hidden bg-white/[0.06] backdrop-blur-[40px] md:shadow-[0_8px_32px_rgba(0,0,0,0.3)] h-full">
      <ChatHeaderScoped advisor={advisor} />

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 md:p-6">
          {!hasMessages ? (
            <div className="h-full min-h-[calc(100vh-400px)] md:min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-6">
              {/* Glassmorphism panel for empty state */}
              <div className="w-full max-w-md bg-white/[0.06] backdrop-blur-[40px] border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 md:p-8">
                <div className="flex flex-col items-center gap-4">
                  {/* Lighter icon */}
                  <div className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10">
                    <MessageSquare size={32} className="text-white/60" />
                  </div>
                  
                  {/* Title and subtitle */}
                  <div className="space-y-1">
                    <div className="text-lg font-semibold text-white">No Messages Yet</div>
                    <div className="text-sm text-white/60">Start by selecting a topic below</div>
              </div>
              
                  {/* Secondary action - Upload Contract */}
                  <button
                    onClick={() => {
                      // TODO: Implement upload contract functionality
                      toast.info('Upload contract feature coming soon');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-400/20 hover:bg-purple-500/20 hover:border-purple-400/30 transition-all text-sm font-medium text-white"
                  >
                    <FileText className="w-4 h-4" />
                    Upload a Contract
                  </button>
                  
                  {/* iOS-style suggestion buttons */}
                  <div className="w-full space-y-2 mt-2">
                  {[
                    { label: 'Contract Review', icon: '📄' },
                    { label: 'Payment Questions', icon: '💰' },
                    { label: 'Legal Advice', icon: '⚖️' },
                    { label: 'Tax Compliance', icon: '📊' },
                  ].map((topic) => (
                    <button
                      key={topic.label}
                      onClick={() => onSend?.(`I need help with ${topic.label.toLowerCase()}`)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.06] backdrop-blur-[20px] border border-white/10 hover:bg-white/[0.1] hover:border-white/20 transition-all text-left active:scale-[0.98]"
                    >
                        <span className="text-xl">{topic.icon}</span>
                        <span className="text-sm font-medium text-white flex-1">{topic.label}</span>
                        <ChevronRight className="w-4 h-4 text-white/40" />
                    </button>
                  ))}
                </div>
              </div>
              </div>
            </div>
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
      </ScrollArea>

      <MessageInputScoped onSend={onSend} isLoading={isLoading} />
    </div>
  );
}

// --- Main MessagesPage Component ---
export default function MessagesPage() {
  const { loading: sessionLoading, profile, isAdmin, user } = useSession();
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const queryClient = useQueryClient();

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

  // Convert profiles to Advisor format
  const advisors: Advisor[] = useMemo(() => {
    if (isAdmin) {
      return clientProfiles.map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        role: 'Client',
        avatarUrl: p.avatar_url || generateAvatarUrl(p.first_name, p.last_name),
        online: false, // TODO: Implement online status
      }));
    } else {
      const result: Advisor[] = [];
      if (adminProfile) {
        result.push({
          id: adminProfile.id,
          name: `${adminProfile.first_name} ${adminProfile.last_name}`,
          role: 'Legal Advisor',
          avatarUrl: adminProfile.avatar_url || generateAvatarUrl(adminProfile.first_name, adminProfile.last_name),
          online: false,
        });
      }
      if (caProfile) {
        result.push({
          id: caProfile.id,
          name: `${caProfile.first_name} ${caProfile.last_name}`,
          role: 'Chartered Accountant',
          avatarUrl: caProfile.avatar_url || generateAvatarUrl(caProfile.first_name, caProfile.last_name),
          online: false,
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

  // Fetch messages
  const { data: realMessages, isLoading: isLoadingMessages } = useMessages({
    currentUserId: currentUserId,
    receiverId: selectedAdvisorId || '',
    enabled: !!currentUserId && !!selectedAdvisorId,
  });

  // Generate sample history if no real messages exist AND the user is a client
  const sampleHistory = useSampleChatHistory(profile?.first_name || null);
  
  // Convert messages to new format
  const messages: Message[] = useMemo(() => {
    if (!selectedAdvisorId || !currentUserId) return [];

    // Use sample history if available
    if ((!realMessages || realMessages.length === 0) && isClient && sampleHistory.length > 0) {
      return sampleHistory.map(msg => ({
        id: msg.id,
        advisorId: selectedAdvisorId,
        author: msg.sender_id === 'client' ? 'user' : 'advisor',
        text: typeof msg.content === 'string' ? msg.content : String(msg.content),
        createdAt: msg.sent_at,
      }));
    }

    // Convert real messages
    if (!realMessages) return [];
    return realMessages.map(msg => ({
      id: msg.id,
      advisorId: selectedAdvisorId,
      author: msg.sender_id === currentUserId ? 'user' : 'advisor',
      text: typeof msg.content === 'string' ? msg.content : String(msg.content),
      createdAt: msg.sent_at,
    }));
  }, [realMessages, selectedAdvisorId, currentUserId, isClient, sampleHistory]);

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
    <div className="w-full h-[calc(100vh-12rem)] md:h-screen flex flex-col antialiased overflow-hidden -mx-4 md:mx-0 md:p-6 md:min-h-screen md:pb-0 pb-16 md:pb-0">
      {/* Advisor Selection Cards - CA and Legal Advisor */}
      <div className="px-4 md:px-0 mb-4 md:mb-6 flex-shrink-0">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {/* CA Card */}
          {caProfile && (
            <div
              onClick={() => {
                const caAdvisor = advisors.find(a => a.role === 'Chartered Accountant');
                if (caAdvisor) {
                  handleSelectAdvisor(caAdvisor);
                }
              }}
              className={clsx(
                "bg-white/[0.06] backdrop-blur-[40px] border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-3 cursor-pointer transition-all hover:border-white/20 hover:bg-white/[0.08] h-[72px] flex items-center",
                selectedAdvisorId === caProfile.id 
                  ? "border-blue-400/50 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.3),0_8px_32px_rgba(0,0,0,0.3)]" 
                  : "border-white/10"
              )}
            >
              <div className="relative flex-shrink-0">
                <LocalAvatar size="sm" src={caProfile.avatar_url || generateAvatarUrl(caProfile.first_name, caProfile.last_name)} alt={`${caProfile.first_name} ${caProfile.last_name}`} />
                <span className="absolute right-0 bottom-0 inline-block w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-background" />
              </div>
              <div className="flex-1 min-w-0 ml-3">
                <p className="text-sm font-semibold text-white truncate">{caProfile.first_name} {caProfile.last_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-white/60">Chartered Accountant</p>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10">
                    <Lock className="h-2.5 w-2.5 text-green-400" />
                    <span className="text-[10px] text-white/50">Private</span>
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Legal Advisor Card */}
          {adminProfile && (
            <div
              onClick={() => {
                const legalAdvisor = advisors.find(a => a.role === 'Legal Advisor');
                if (legalAdvisor) {
                  handleSelectAdvisor(legalAdvisor);
                }
              }}
              className={clsx(
                "bg-white/[0.06] backdrop-blur-[40px] border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-3 cursor-pointer transition-all hover:border-white/20 hover:bg-white/[0.08] h-[72px] flex items-center",
                selectedAdvisorId === adminProfile.id 
                  ? "border-blue-400/50 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.3),0_8px_32px_rgba(0,0,0,0.3)]" 
                  : "border-white/10"
              )}
            >
              <div className="relative flex-shrink-0">
                <LocalAvatar size="sm" src={adminProfile.avatar_url || generateAvatarUrl(adminProfile.first_name, adminProfile.last_name)} alt={`${adminProfile.first_name} ${adminProfile.last_name}`} />
                <span className="absolute right-0 bottom-0 inline-block w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-background" />
              </div>
              <div className="flex-1 min-w-0 ml-3">
                <p className="text-sm font-semibold text-white truncate">{adminProfile.first_name} {adminProfile.last_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-white/60">Legal Advisor</p>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10">
                    <Lock className="h-2.5 w-2.5 text-green-400" />
                    <span className="text-[10px] text-white/50">Private</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content area - flex-1 to fill remaining space */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden md:overflow-visible">
        {/* Desktop: Fixed sidebar */}
        {!isMobile && (
          <AdvisorListScoped
            advisors={advisors}
            selectedId={selectedAdvisorId}
            onSelect={handleSelectAdvisor}
            isLoading={isLoadingAdvisors}
          />
        )}

        {/* Chat Window - flex-1 to fill space */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <ChatWindowScoped
            advisor={selectedAdvisor}
            messages={messages}
            onSend={handleSend}
            isLoading={sendMessageMutation.isPending || isLoadingMessages}
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
  );
}
