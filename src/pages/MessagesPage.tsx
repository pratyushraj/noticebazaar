
// Notice Bazaar - Secure Messages (single-file safe snapshot)
// IMPORTANT: This file is a self-contained React + TypeScript snapshot designed to avoid duplicate
// declaration issues by keeping all components scoped in this file.

import { useEffect, useRef, useState, useMemo } from 'react';
import clsx from 'clsx';
import { Lock, MessageSquare, ArrowUp, Loader2, Mic } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import { useProfiles } from '@/lib/hooks/useProfiles';
import { useMessages, useSendMessage } from '@/lib/hooks/useMessages';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
// Sample history disabled - no demo messages
import { generateAvatarUrl } from '@/lib/utils/avatar';
import { useCometChat } from '@/lib/cometchat/useCometChat';
import { COMETCHAT_CONFIG } from '@/lib/cometchat/config';
import { AdvisorModeSwitch } from '@/components/AdvisorModeSwitch';
import { ContextualTipsProvider } from '@/components/contextual-tips/ContextualTipsProvider';
import { NoMessagesEmptyState } from '@/components/empty-states/PreconfiguredEmptyStates';
import { logger } from '@/lib/utils/logger';
import { spacing, typography, iconSizes, radius, shadows, glass, animations, vision, motion as motionTokens, colors, gradients, badges } from '@/lib/design-system';
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
        // replaced-by-ultra-polish
        selected 
          ? cn(badges.info, 'ring-2 ring-blue-400/50 border-blue-400/50', shadows.sm, spacing.cardPadding.secondary, 'scale-[1.02]') 
          : cn(glass.appleSubtle, 'border-white/10', spacing.cardPadding.tertiary, 'hover:bg-white/10'),
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
        {/* Unread dot - replaced-by-ultra-polish */}
        {advisor.unreadCount && advisor.unreadCount > 0 && (
          <span className={cn("absolute -top-1 -right-1 inline-flex items-center justify-center", iconSizes.md, badges.danger, radius.full, typography.caption, "font-semibold ring-2 ring-background")}>
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

      <div className="flex-1 relative z-10 overflow-visible">
        <div className={cn(spacing.cardPadding.tertiary, "flex flex-col gap-2")}>
          {advisors.map((a) => (
            <AdvisorCardScoped key={a.id} advisor={a} selected={selectedId === a.id} onClick={onSelect} />
          ))}
        </div>
      </div>
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
      "px-3 py-3 md:px-5 md:py-4",
      "border-b border-white/10",
      "bg-white/5 backdrop-blur-xl md:bg-white/10",
      "flex-shrink-0 mb-3 md:mb-8",
      "md:rounded-t-[20px]",
      "relative overflow-hidden"
    )}>
      {/* Vision Pro depth elevation - desktop only */}
      <div className="hidden md:block">{vision.depth.elevation}</div>
      
      {/* Spotlight gradient - desktop only */}
      <div className={cn("hidden md:block", vision.spotlight.base, "opacity-40")} />
      
      <div className={cn("flex items-center gap-2 md:gap-3 flex-1 min-w-0 relative z-10")}>
        <LocalAvatar size="sm" src={advisor?.avatarUrl} alt={advisor?.name || 'Advisor'} />
        <div className="leading-tight flex-1 min-w-0">
          <div className={cn("text-sm md:text-base font-semibold text-white truncate")}>{advisor?.name ?? 'Select an advisor'}</div>
          <div className={cn("text-xs md:text-sm text-white/60 truncate")}>{advisor?.role ?? ''}</div>
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
    // Auto-resize for both mobile and desktop
    textarea.style.height = 'auto';
    const minHeight = variant === 'mobile-fixed' ? 44 : 40;
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), 120);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 120 ? 'auto' : 'hidden';
  }, [value, variant]);

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
          "md:hidden fixed left-0 right-0",
          // Position above bottom nav (bottom nav is ~60px tall)
          "bottom-[60px]",
          // Highest z-index to be above bottom nav (bottom nav is z-[100])
          "z-[9999]",
          // Background transparent to let page show through
          "bg-transparent",
          // Safe area support
          "pb-[calc(env(safe-area-inset-bottom,0px)+12px)]",
          // Horizontal padding
          "px-4"
        )
      : "w-full flex flex-col flex-shrink-0";

  const bubbleClasses =
    variant === 'mobile-fixed'
      ? cn(
          // Auto height to fit content
          "min-h-[56px] sm:min-h-[64px]",
          // Flex container with items centered
          "flex items-center gap-2",
          // Glass morphism
          "bg-white/10 backdrop-blur-xl",
          "border border-white/10",
          "rounded-2xl",
          // Padding
          "py-2.5 px-3",
          // Overflow visible to prevent clipping
          "overflow-visible",
          // Smooth transitions
          "transition-all duration-300 ease-out",
          // Focus state: subtle lift
          isFocused 
            ? "shadow-[0_8px_24px_rgba(138,60,255,0.3)] border-white/20" 
            : ""
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
      ? "flex items-center gap-2 w-full flex-nowrap"
      : "flex items-end gap-2.5 w-full";

  return (
    <div className={cn(wrapperClasses, className)}>
      <div className={bubbleClasses}>
        <div className={rowClasses}>
        {/* Voice message button (hold to record) - iOS 17 + visionOS */}
        {variant === 'mobile-fixed' ? (
          <motion.button 
            className={cn(
              // Compact mobile button
              "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
              "bg-white/10 backdrop-blur-xl",
              "mr-2",
              "transition-all duration-200",
              // replaced-by-ultra-polish
              isRecording
                ? cn(badges.danger, "animate-pulse", shadows.md, "scale-110")
                : "text-white/80 hover:bg-white/20 active:scale-95"
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
            <Mic className="text-lg text-white/80" />
          </motion.button>
        ) : (
          <motion.button 
            className={cn(
              // Desktop button
              "h-11 w-11 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0",
              radius.full,
              "border border-white/20 transition-all duration-200",
              // replaced-by-ultra-polish
              isRecording
                ? cn(badges.danger, "animate-pulse", shadows.md, "scale-110")
                : cn(
                    "bg-white/10 text-white/80",
                    "hover:bg-white/20 hover:scale-105",
                    "active:scale-95"
                  )
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
        )}

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
            variant === 'mobile-fixed' 
              ? cn(
                  // Mobile-specific styling
                  "flex-1 min-w-0 bg-transparent outline-none",
                  "text-white text-[15px]",
                  "placeholder:text-white/50",
                  "leading-tight",
                  "px-2 py-1",
                  "resize-none",
                  "overflow-visible",
                  "h-auto",
                  "min-h-[44px]",
                  "max-h-[120px]",
                  "disabled:opacity-50",
                  "selection:bg-white/20 selection:text-white",
                  "relative z-10",
                  // Ensure visibility
                  "opacity-100",
                  "visible"
                )
              : cn(
                  // Desktop styling
                  "bg-transparent resize-none overflow-hidden w-full flex-1 min-w-0",
                  "text-white",
                  "text-[15px] leading-[20px]",
                  "placeholder:text-white/50",
                  "outline-none border-none",
                  "transition-all duration-200",
                  "disabled:opacity-50",
                  "max-h-[120px]",
                  "relative z-10",
                  "px-2 py-2.5",
                  "selection:bg-white/20 selection:text-white"
                )
          )}
          rows={variant === 'mobile-fixed' ? 1 : 1}
        />

        {/* Send button - iOS 17 + visionOS */}
        {variant === 'mobile-fixed' ? (
          <motion.button
            onClick={() => {
              triggerHaptic(HapticPatterns.light);
              handleSend();
            }}
            disabled={!value.trim() || isLoading}
            whileTap={animations.microTap}
            className={cn(
              // Compact mobile button
              "flex-shrink-0 h-10 w-10 rounded-xl",
              "flex items-center justify-center",
              "bg-white/10 backdrop-blur-xl",
              "ml-2",
              "transition-all duration-300 ease-out",
              "disabled:cursor-not-allowed",
              value.trim()
                ? cn(
                    gradients.primary,
                    "text-white",
                    "hover:scale-105 active:scale-95"
                  )
                : "text-white/30"
            )}
            style={{ touchAction: 'manipulation' }}
            aria-label="Send message"
            type="button"
          >
            {isLoading ? (
              <Loader2 className="text-lg animate-spin" />
            ) : (
              <ArrowUp className="text-lg text-white/80" />
            )}
          </motion.button>
        ) : (
          <motion.button
            onClick={() => {
              triggerHaptic(HapticPatterns.light);
              handleSend();
            }}
            disabled={!value.trim() || isLoading}
            whileTap={animations.microTap}
            className={cn(
              // Desktop button
              "flex-shrink-0 h-11 w-11 md:w-12 md:h-12",
              radius.full,
              "flex items-center justify-center",
              "transition-all duration-300 ease-out",
              "disabled:cursor-not-allowed",
              "border border-white/20",
              "relative z-10",
              value.trim()
                ? cn(
                    gradients.primary,
                    "text-white",
                    shadows.md,
                    "hover:scale-105 active:scale-95",
                    "shadow-[0_4px_16px_rgba(138,60,255,0.4)]"
                  )
                : cn(
                    "bg-white/10 text-white/30",
                    "hover:bg-white/15"
                  )
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
        )}
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
    </motion.div>
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasMessages = (messages ?? []).length > 0;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className={cn(
      "flex flex-col flex-1 min-h-0 overflow-visible relative",
      "rounded-none md:rounded-[20px]",
      "bg-transparent md:bg-white/5",
      "backdrop-blur-none md:backdrop-blur-xl",
      "md:border md:border-white/15",
      "md:shadow-[0_0_50px_-10px_rgba(0,0,0,0.45)]"
    )}>
      {/* Vision Pro depth elevation - desktop only */}
      <div className="hidden md:block">{vision.depth.elevation}</div>
      
      {/* Spotlight gradient - desktop only */}
      <div className={cn("hidden md:block", vision.spotlight.base, "opacity-30")} />
      
      <ChatHeaderScoped advisor={advisor} advisors={advisors} onSwitchAdvisor={onSwitchAdvisor} />

      <div className="flex-1 min-h-0 overflow-visible">
        <div className="p-2 md:p-6 lg:p-8">
          {!hasMessages ? (
            <div className="mb-0 md:mb-8 pb-[100px] md:pb-0">
              <NoMessagesEmptyState
                onStartChat={() => onSend?.('Hello! I need help.')}
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
            <div className="space-y-3 md:space-y-4 pb-[120px] md:pb-0">
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

    </div>
  );
}

// --- Main MessagesPage Component ---
export default function MessagesPage() {
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

  // Sample history disabled - no demo messages for any users
  const sampleHistory: never[] = [];
  
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

    // Sample history disabled - no demo messages for any users
    // All users (clients, creators, new accounts) will see empty state if no real messages

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
            table: 'legacy_messages',
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
    <div className="flex flex-col min-h-full md:h-screen md:p-6 overflow-visible bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 ios-safe-bottom">
      {/* Content with safe area padding for bottom nav + input */}
      <div className="flex-1 min-h-0 px-3 md:px-0 overflow-visible pb-[calc(120px+env(safe-area-inset-bottom,0px))]">
        <div className="w-full max-w-[420px] mx-auto md:mx-0 md:max-w-none pt-2 md:pt-4">
          {/* Main content area */}
          <div className="flex gap-6">
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
            <div className="flex-1 min-w-0 flex flex-col min-h-0 -mx-3 md:mx-0">
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
          {/* replaced-by-ultra-polish */}
          <footer className={cn("hidden md:block mt-8 text-center", typography.caption, "opacity-40")}>
            © 2025 NoticeBazaar — Secure Legal Portal
          </footer>
        </div>
      </div>

      {/* Mobile fixed composer - rendered at page level for proper visibility */}
      <MessageInputScoped
        onSend={handleSend}
        isLoading={sendMessageMutation.isPending || isLoadingMessages || cometChat.isLoading}
        variant="mobile-fixed"
        className="md:hidden"
      />
    </div>
    </ContextualTipsProvider>
  );
}
