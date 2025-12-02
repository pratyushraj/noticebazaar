
// Notice Bazaar - Secure Messages (single-file safe snapshot)
// IMPORTANT: This file is a self-contained React + TypeScript snapshot designed to avoid duplicate
// declaration issues by keeping all components scoped in this file.

import { useEffect, useRef, useState, useMemo } from 'react';
import clsx from 'clsx';
import { Lock, MessageSquare, ArrowUp, Loader2, Mic, ArrowLeft } from 'lucide-react';
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
import { logger } from '@/lib/utils/logger';
import { spacing, typography, iconSizes, radius, shadows, glass, animations, vision, motion as motionTokens, colors } from '@/lib/design-system';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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

// --- AdvisorCard (scoped, not exported) - iOS 17 + visionOS ---
function AdvisorCardScoped({ advisor, selected, onClick }: { advisor: Advisor; selected?: boolean; onClick?: (a: Advisor) => void }) {
  return (
    <motion.button
      type="button"
      onClick={() => {
        triggerHaptic(HapticPatterns.light);
        onClick?.(advisor);
      }}
      whileTap={animations.microTap}
      whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
      className={cn(
        'w-full text-left flex items-center gap-3 transition-all duration-150 ease-in-out relative overflow-hidden',
        radius.lg,
        'border',
        selected 
          ? 'bg-blue-500/20 ring-2 ring-blue-400/50 border-blue-400/50 shadow-[0_6px_20px_rgba(59,130,246,0.15)] p-3.5 scale-[1.02]' 
          : cn(glass.appleSubtle, 'border-white/10 p-3 hover:bg-white/10'),
        spacing.cardPadding.secondary
      )}
    >
      {/* Spotlight on hover */}
      {!selected && <div className={cn(vision.spotlight.hover, "opacity-0 group-hover:opacity-100")} />}
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

      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-2">
          <div className={cn(typography.body, "font-semibold text-white truncate")}>{advisor.name}</div>
          {advisor.isTyping && (
            <div className="flex gap-1">
              <span className={cn("w-1.5 h-1.5 bg-blue-400", radius.full, "animate-bounce")} style={{ animationDelay: '0ms' }} />
              <span className={cn("w-1.5 h-1.5 bg-blue-400", radius.full, "animate-bounce")} style={{ animationDelay: '150ms' }} />
              <span className={cn("w-1.5 h-1.5 bg-blue-400", radius.full, "animate-bounce")} style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
        <div className={cn(typography.bodySmall, "text-white/60 truncate")}>{advisor.role}</div>
        {/* Last message preview */}
        {advisor.lastMessage && (
          <div className={cn(typography.bodySmall, "text-white/50 truncate mt-0.5")}>
            {advisor.lastMessage}
          </div>
        )}
      </div>

      <div className={cn('p-1', radius.md, "flex-shrink-0 relative z-10", selected ? 'text-blue-400' : 'text-white/40')}>
        <MessageSquare className={iconSizes.sm} />
      </div>
    </motion.button>
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
      <aside className={cn(
        "w-[280px] min-w-[260px] max-w-[280px]",
        spacing.cardPadding.tertiary,
        radius.lg,
        glass.apple,
        shadows.sm,
        "flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden"
      )}>
        {/* Spotlight */}
        <div className={cn(vision.spotlight.base, "opacity-20")} />
        <Loader2 className={cn(iconSizes.lg, "animate-spin text-purple-400 relative z-10")} />
        <p className={cn("mt-3", typography.bodySmall, "text-white/60 relative z-10")}>Loading advisors...</p>
      </aside>
    );
  }

  if (advisors.length === 0) {
    return (
      <aside className={cn(
        "w-[280px] min-w-[260px] max-w-[280px]",
        spacing.cardPadding.tertiary,
        radius.lg,
        glass.apple,
        shadows.sm,
        "flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden"
      )}>
        {/* Spotlight */}
        <div className={cn(vision.spotlight.base, "opacity-20")} />
        <p className={cn(typography.bodySmall, "text-white/60 text-center relative z-10")}>No advisors available.</p>
      </aside>
    );
  }

  return (
    <aside className={cn(
      "w-[280px] min-w-[260px] max-w-[280px]",
      radius.lg,
      glass.apple,
      shadows.sm,
      "flex flex-col overflow-hidden relative"
    )}>
      {/* Vision Pro depth elevation */}
      <div className={vision.depth.elevation} />
      
      {/* Spotlight gradient */}
      <div className={cn(vision.spotlight.base, "opacity-30")} />
      
      <div className={cn("px-4 py-3 border-b border-white/10", colors.bg.secondary, "relative z-10")}>
        <div className={cn(typography.label, "text-white/60")}>Select Advisor</div>
      </div>

      <ScrollArea className="flex-1 relative z-10">
        <div className={cn(spacing.cardPadding.tertiary, "flex flex-col gap-2")}>
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
    <div className={cn(
      "flex items-center justify-between",
      spacing.cardPadding.secondary,
      "border-b border-white/10",
      glass.appleStrong,
      "flex-shrink-0 mb-6 md:mb-8",
      radius.lg,
      "relative overflow-hidden"
    )}>
      {/* Vision Pro depth elevation */}
      <div className={vision.depth.elevation} />
      
      {/* Spotlight gradient */}
      <div className={cn(vision.spotlight.base, "opacity-40")} />
      
      <div className={cn("flex items-center gap-3 flex-1 min-w-0 relative z-10")}>
        <LocalAvatar size="sm" src={advisor?.avatarUrl} alt={advisor?.name || 'Advisor'} />
        <div className="leading-tight flex-1 min-w-0">
          <div className={cn(typography.body, "font-semibold text-white truncate")}>{advisor?.name ?? 'Select an advisor'}</div>
          <div className={cn(typography.bodySmall, "text-white/60 truncate")}>{advisor?.role ?? ''}</div>
        </div>
      </div>

      <div className={cn("flex items-center gap-2 flex-shrink-0 mr-2 relative z-10")}>
        {otherAdvisor && onSwitchAdvisor && (
          <AdvisorModeSwitch 
            mode={currentMode}
            onToggle={handleToggle}
          />
        )}
        <div className={cn(
          "hidden md:inline-flex items-center gap-1.5",
          radius.md,
          spacing.cardPadding.tertiary,
          "border border-white/10",
          colors.bg.secondary,
          typography.caption,
          "text-white/60"
        )}>
          <Lock className={iconSizes.xs} />
          <span>End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
}

// --- MessageInput (scoped) ---
type MessageInputVariant = 'inline' | 'mobile-fixed';

function MessageInputScoped({ 
  onSend, 
  isLoading,
  variant = 'inline',
  className,
}: { 
  onSend?: (text: string) => void; 
  isLoading?: boolean;
  variant?: MessageInputVariant;
  className?: string;
}) {
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    const nextHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 120 ? 'auto' : 'hidden';
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
        logger.debug('Voice message recorded', { size: audioBlob.size, bytes: audioBlob.size });
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

  const handleFocus = () => {
    setIsFocused(true);
    window.requestAnimationFrame(() => {
      textareaRef.current?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    });
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const wrapperClasses =
    variant === 'mobile-fixed'
      ? cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-50 px-3",
          glass.appleStrong,
          "border-t border-white/10",
          shadows.vision,
          "pb-[max(env(safe-area-inset-bottom,16px),16px)] relative overflow-hidden"
        )
      : "w-full flex flex-col flex-shrink-0";

  const bubbleClasses =
    variant === 'mobile-fixed'
      ? cn(
          "mx-auto w-[94%] max-w-md",
          radius.xl,
          spacing.cardPadding.secondary,
          glass.apple,
          shadows.depth,
          "transition-all duration-200 relative overflow-hidden",
          isFocused ? "translate-y-[-6px]" : ""
        )
      : cn(
          "w-full",
          spacing.cardPadding.secondary,
          "flex items-end gap-2.5",
          glass.appleStrong,
          radius.xl,
          shadows.vision,
          "transition-all duration-300 ease-out focus-within:border-white/40 focus-within:shadow-[0_18px_40px_rgba(0,0,0,0.5)]",
          "relative overflow-hidden"
        );

  const rowClasses =
    variant === 'mobile-fixed'
      ? "flex items-center gap-3 w-full min-h-[52px] flex-nowrap"
      : "flex items-end gap-2.5 w-full";

  return (
    <div className={cn(wrapperClasses, className)}>
      {/* Spotlight gradient for mobile */}
      {variant === 'mobile-fixed' && <div className={cn(vision.spotlight.base, "opacity-30")} />}
      
      <div className={bubbleClasses}>
        {/* Spotlight gradient */}
        <div className={cn(vision.spotlight.base, "opacity-20")} />
        
        <div className={rowClasses}>
        {/* Voice message button (hold to record) - iOS 17 + visionOS */}
        <motion.button 
          className={cn(
            "h-10 w-10 md:w-11 md:h-11 flex items-center justify-center",
            radius.full,
            "border border-white/10 transition-all duration-200 relative z-10",
            isRecording
              ? "bg-red-500/30 text-red-400 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]"
              : cn(colors.bg.secondary, "text-white/70 hover:bg-white/20")
          )}
          whileTap={animations.microTap}
          style={{ touchAction: 'manipulation' }}
          type="button"
          onMouseDown={handleMicMouseDown}
          onMouseUp={handleMicMouseUp}
          onTouchStart={handleMicMouseDown}
          onTouchEnd={handleMicMouseUp}
          aria-label="Hold to record voice message"
        >
          <Mic className={cn(iconSizes.sm, "md:w-5 md:h-5")} />
        </motion.button>

        {/* Text input area - iOS 17 + visionOS */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your secure message…"
          aria-label="Type your secure message"
          disabled={isLoading}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "bg-transparent resize-none overflow-hidden w-full flex-1 min-w-0 text-white",
            typography.body,
            "leading-[20px] placeholder:text-white/40 outline-none border-none transition-all duration-200 disabled:opacity-50 max-h-[120px] relative z-10"
          )}
          rows={1}
        />

        {/* Send button - iOS 17 + visionOS */}
        <motion.button
          onClick={() => {
            triggerHaptic(HapticPatterns.light);
            handleSend();
          }}
          disabled={!value.trim() || isLoading}
          whileTap={animations.microTap}
          className={cn(
            "flex-shrink-0 h-10 w-10 md:w-11 md:h-11",
            radius.full,
            "flex items-center justify-center transition-all duration-300 ease-out disabled:cursor-not-allowed border border-white/10 relative z-10",
            value.trim()
              ? cn(gradients.primary, "text-white", shadows.md)
              : cn(colors.bg.secondary, "text-white/30")
          )}
          style={{ touchAction: 'manipulation' }}
          aria-label="Send message"
          type="button"
        >
          {isLoading ? (
            <Loader2 className={cn(iconSizes.md, "animate-spin")} />
          ) : (
            <ArrowUp className={iconSizes.md} />
          )}
        </motion.button>
      </div>
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
    <motion.div 
      initial={motionTokens.slide.up.initial}
      animate={motionTokens.slide.up.animate}
      transition={motionTokens.slide.up.transition}
      className={cn('flex items-end gap-2', isCurrentUser ? 'justify-end' : 'justify-start')}
    >
      {!isCurrentUser && (
        <LocalAvatar 
          size="sm" 
          src={advisorAvatar} 
          alt={advisorName || 'Advisor'} 
        />
      )}
      
      <div
        className={cn(
          'inline-block leading-[1.4] max-w-[75%] relative overflow-hidden',
          typography.body,
          spacing.cardPadding.secondary,
          radius.lg,
          isCurrentUser
            ? cn(gradients.primary, "text-white rounded-br-[4px]", shadows.md)
            : cn(glass.apple, "text-white rounded-bl-[4px]")
        )}
      >
        {/* Spotlight for advisor messages */}
        {!isCurrentUser && <div className={cn(vision.spotlight.base, "opacity-10")} />}
        
        <p className={cn("leading-relaxed break-words relative z-10")}>{message.text}</p>
        <div className={cn(
          typography.caption,
          "mt-1 relative z-10",
          isCurrentUser ? "text-white/70" : "text-white/50"
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
  currentUserName,
  isLoading
}: { 
  advisor?: Advisor | null;
  advisors?: Advisor[];
  messages?: Message[]; 
  onSend?: (text: string) => void;
  onSwitchAdvisor?: (advisorId: string) => void;
  currentUserAvatar?: string;
  currentUserName?: string;
  isLoading?: boolean;
}) {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasMessages = (messages ?? []).length > 0;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className={cn(
      "flex flex-col flex-1 min-h-0 overflow-hidden relative",
      "rounded-none md:rounded-[20px]",
      glass.appleStrong,
      "md:border md:border-white/15",
      shadows.vision
    )}>
      {/* Vision Pro depth elevation */}
      <div className={vision.depth.elevation} />
      
      {/* Spotlight gradient */}
      <div className={cn(vision.spotlight.base, "opacity-30")} />
      
      <ChatHeaderScoped advisor={advisor} advisors={advisors} onSwitchAdvisor={onSwitchAdvisor} />

      <div className="flex-1 overflow-y-auto min-h-0 overflow-x-hidden overscroll-contain">
        <div className="p-4 md:p-6 lg:p-8">
          {!hasMessages ? (
            <div className="mb-2 md:mb-8 pb-[140px] md:pb-0">
              <NoMessagesEmptyState
                onStartChat={() => onSend?.('Hello! I need help.')}
                onUploadContract={() => {
                  toast.info('Upload contract feature coming soon');
                  navigate('/contract-upload');
                }}
              />
              
              {/* Desktop input */}
              <div className="hidden md:block mt-8">
                <MessageInputScoped
                  onSend={onSend}
                  isLoading={isLoading}
                  className="md:flex"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-[140px] md:pb-0">
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

      {/* Input bar at bottom when there are messages */}
      {hasMessages && (
        <div 
          className="hidden md:block px-4 md:px-6 lg:px-8 pt-3 flex-shrink-0 bg-transparent border-t border-white/10 md:border-t-0"
          style={{ 
            paddingBottom: `max(12px, env(safe-area-inset-bottom, 12px))`,
            paddingTop: '12px'
          }}
        >
          <MessageInputScoped
            onSend={onSend}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Mobile fixed composer */}
      <MessageInputScoped
        onSend={onSend}
        isLoading={isLoading}
        variant="mobile-fixed"
        className="md:hidden"
      />

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
      <div className="flex-1 overflow-y-auto min-h-0 px-4 md:px-0 overflow-x-hidden" style={{ 
        paddingBottom: '0px',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div className="w-full max-w-[420px] mx-auto md:mx-0 md:max-w-none">
          {/* Back to Dashboard Button - iOS 17 + visionOS */}
          <div className={cn("flex justify-start", spacing.compact)}>
            <motion.button
              onClick={() => {
                triggerHaptic(HapticPatterns.light);
                navigate('/creator-dashboard');
              }}
              whileTap={animations.microTap}
              whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
              className={cn(
                "flex items-center gap-2",
                spacing.cardPadding.secondary,
                radius.md,
                glass.apple,
                shadows.sm,
                typography.bodySmall,
                "font-medium text-white",
                "transition-all"
              )}
            >
              <ArrowLeft className={iconSizes.sm} />
              <span>Back to Dashboard</span>
            </motion.button>
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
                isLoading={sendMessageMutation.isPending || isLoadingMessages || cometChat.isLoading}
              />
            </div>
          </div>

          {/* Footer - hidden on mobile, shown on desktop */}
          <footer className="hidden md:block mt-8 text-center text-[11px] opacity-40">
            © 2025 NoticeBazaar — Secure Legal Portal
          </footer>
        </div>
      </div>
    </div>
    </ContextualTipsProvider>
  );
}
