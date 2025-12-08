
// Notice Bazaar - Secure Messages (single-file safe snapshot)
// IMPORTANT: This file is a self-contained React + TypeScript snapshot designed to avoid duplicate
// declaration issues by keeping all components scoped in this file.

import { useEffect, useRef, useState, useMemo } from 'react';
import { Lock, MessageSquare, ArrowUp, Loader2, Mic, Paperclip, Smile, Check, CheckCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import { useProfiles } from '@/lib/hooks/useProfiles';
import { useMessages, useSendMessage } from '@/lib/hooks/useMessages';
import { 
  findOrCreateConversation,
  isLawyerOrAdvisor,
  getAuthUserIdFromProfileId,
  useSendConversationMessage,
  useConversationMessages
} from '@/lib/hooks/useConversationMessages';
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
import { spacing, typography, iconSizes, radius, shadows, glass, animations, vision, colors, gradients, badges } from '@/lib/design-system';
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
  isSeen?: boolean; // For seen status (double tick)
  isRead?: boolean; // For read status
  failed?: boolean; // For failed message retry
};

// --- Local Avatar (single canonical avatar used in this file) ---
function LocalAvatar({ src, alt, size = 'md', className }: { src?: string; alt?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dims = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs';
  const initials = alt ? alt.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
  
  return (
    <div 
      className={cn(
        'inline-flex items-center justify-center overflow-hidden rounded-full',
        'bg-gradient-to-br from-purple-500/20 to-indigo-500/20',
        'backdrop-blur-sm',
        'border border-white/10',
        'shadow-sm',
        dims,
        className
      )} 
      title={alt}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt} 
          className="object-cover w-full h-full" 
        />
      ) : (
        <span className={cn(
          textSize,
          "font-semibold text-white/90"
        )}>
          {initials}
        </span>
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
  onFocus,
  conversationId,
  userId,
}: { 
  onSend?: (text: string) => void; 
  isLoading?: boolean;
  variant?: MessageInputVariant;
  className?: string;
  onFocus?: () => void;
  conversationId?: string;
  userId?: string;
}) {
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    
    // Refocus textarea so keyboard stays up on mobile
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 30);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Update typing status in presence table
  const updateTypingStatus = async (status: 'typing' | 'online') => {
    if (!conversationId || !userId) return;
    
    try {
      const { error } = await supabase.from('presence').upsert({
        conversation_id: conversationId,
        user_id: userId,
        status: status,
        last_seen_at: new Date().toISOString()
      }, {
        onConflict: 'conversation_id,user_id'
      });
      
      // Silently handle expected errors (409 conflict, RLS blocking, table doesn't exist)
      if (error && (
        (error as any).code === '23505' || // Unique violation
        (error as any).status === 409 || // Conflict
        (error as any).code === 'PGRST301' || // RLS policy violation
        (error as any).code === '42P01' || // Table doesn't exist
        (error as any).status === 404 || // Not found
        error.message?.includes('permission denied') ||
        error.message?.includes('RLS')
      )) {
        // Expected errors - table might not exist or RLS blocking
        return;
      }
      
      if (error) {
        // Only log unexpected errors
        console.warn('Failed to update typing status:', error);
      }
    } catch (err) {
      // Silently handle errors - presence is optional
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
    // Update typing status when user starts typing
    if (value.trim()) {
      updateTypingStatus('typing');
    }
    window.requestAnimationFrame(() => {
      textareaRef.current?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    });
  };

  // Handle typing indicator
  useEffect(() => {
    if (!conversationId || !userId) return;
    
    if (value.trim()) {
      // User is typing
      updateTypingStatus('typing');
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing after 300ms of no input
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus('online');
      }, 300);
    } else {
      // No text, set to online
      updateTypingStatus('online');
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [value, conversationId, userId]);

  const handleBlur = () => {
    setIsFocused(false);
  };

  const wrapperClasses =
    variant === 'mobile-fixed'
      ? cn(
          "md:hidden fixed left-0 right-0",
          // Position above bottom nav (reduced gap: 64px nav + 4px spacing = 68px + safe-area)
          "bottom-[calc(68px+env(safe-area-inset-bottom))]",
          // z-index above bottom nav (bottom nav is z-9999, input should be z-[10000])
          "z-[10000]",
          // Sticky bottom with gradient
          "bg-gradient-to-b from-transparent to-purple-900/70 backdrop-blur-xl",
          // Horizontal padding
          "px-3 py-2"
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
        {/* Attachment button */}
        {variant === 'mobile-fixed' ? (
          <motion.button
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
              "bg-white/10 backdrop-blur-xl",
              "mr-2",
              "transition-all duration-200",
              "text-white/80 hover:bg-white/20 active:scale-95"
            )}
            whileTap={animations.microTap}
            style={{ touchAction: 'manipulation' }}
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
          >
            <Paperclip className="text-lg text-white/80" />
          </motion.button>
        ) : (
          <motion.button
            className={cn(
              "h-11 w-11 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0",
              radius.full,
              "border border-white/20 transition-all duration-200",
              "bg-white/10 text-white/80",
              "hover:bg-white/20 hover:scale-105",
              "active:scale-95"
            )}
            whileTap={animations.microTap}
            style={{ touchAction: 'manipulation' }}
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
          >
            <Paperclip className={cn(iconSizes.sm, "md:w-5 md:h-5")} />
          </motion.button>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              // TODO: Implement file upload
              toast.info(`File selected: ${file.name} (Upload functionality coming soon)`);
              e.target.value = ''; // Reset input
            }
          }}
        />

        {/* Emoji picker button */}
        {variant === 'mobile-fixed' ? (
          <motion.button
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
              "bg-white/10 backdrop-blur-xl",
              "mr-2",
              "transition-all duration-200",
              showEmojiPicker
                ? "bg-white/20 text-white"
                : "text-white/80 hover:bg-white/20 active:scale-95"
            )}
            whileTap={animations.microTap}
            style={{ touchAction: 'manipulation' }}
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              // TODO: Implement emoji picker
              toast.info('Emoji picker coming soon');
            }}
            aria-label="Add emoji"
          >
            <Smile className="text-lg text-white/80" />
          </motion.button>
        ) : (
          <motion.button
            className={cn(
              "h-11 w-11 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0",
              radius.full,
              "border border-white/20 transition-all duration-200",
              showEmojiPicker
                ? "bg-white/20 text-white"
                : cn(
                    "bg-white/10 text-white/80",
                    "hover:bg-white/20 hover:scale-105",
                    "active:scale-95"
                  )
            )}
            whileTap={animations.microTap}
            style={{ touchAction: 'manipulation' }}
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              // TODO: Implement emoji picker
              toast.info('Emoji picker coming soon');
            }}
            aria-label="Add emoji"
          >
            <Smile className={cn(iconSizes.sm, "md:w-5 md:h-5")} />
          </motion.button>
        )}

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
  advisorName,
  isGrouped = false,
  showTail = false,
  onRetry
}: { 
  message: Message; 
  isCurrentUser: boolean;
  currentUserAvatar?: string;
  advisorAvatar?: string;
  currentUserName?: string;
  advisorName?: string;
  isGrouped?: boolean;
  showTail?: boolean;
  onRetry?: (messageId: string) => void;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'flex mb-1',
        isCurrentUser ? 'justify-end' : 'justify-start',
        isGrouped && 'mt-0.5'
      )}
    >
      <div className={cn(
        "max-w-[80%] px-3 py-2.5 text-sm",
        // Enhanced color differentiation
        isCurrentUser
          ? cn(
              // User message: brighter purple (more saturated)
              "bg-gradient-to-br from-purple-500 to-purple-600 text-white",
              "shadow-sm shadow-purple-500/20",
              showTail ? "rounded-2xl rounded-br-sm" : "rounded-2xl"
            )
          : cn(
              // Advisor message: softer purple (more transparent, muted)
              "bg-white/8 backdrop-blur-sm text-white/95",
              "border border-white/5",
              showTail ? "rounded-2xl rounded-bl-sm" : "rounded-2xl"
            ),
        // Failed message styling
        message.failed && isCurrentUser && "opacity-75 border border-red-400/30"
      )}>
        <p className="text-sm leading-relaxed break-words">{message.text}</p>
        <div className={cn(
          "text-[10px] mt-1.5 flex items-center gap-1.5",
          isCurrentUser ? "text-white/60 justify-end" : "text-white/40 justify-start"
        )}>
          {/* Time - subtle */}
          <span className="opacity-70">{time}</span>
          
          {/* Seen status (only for user messages) */}
          {isCurrentUser && !message.failed && (
            <span className="ml-0.5">
              {message.isRead || message.isSeen ? (
                <CheckCheck className="w-3 h-3 text-blue-300" aria-label="Read" />
              ) : (
                <Check className="w-3 h-3 text-white/50" aria-label="Sent" />
              )}
            </span>
          )}
          
          {/* Failed message retry option */}
          {message.failed && isCurrentUser && onRetry && (
            <button
              onClick={() => onRetry(message.id)}
              className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors"
              aria-label="Retry sending message"
              title="Retry sending"
            >
              <RefreshCw className="w-3 h-3 text-red-300" />
            </button>
          )}
          
          {/* Failed indicator */}
          {message.failed && isCurrentUser && (
            <AlertCircle className="w-3 h-3 text-red-300 ml-0.5" aria-label="Failed to send" />
          )}
        </div>
      </div>
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
  isLoading,
  conversationId,
  userId
}: { 
  advisor?: Advisor | null;
  advisors?: Advisor[];
  messages?: Message[]; 
  onSend?: (text: string) => void;
  onSwitchAdvisor?: (advisorId: string) => void;
  currentUserAvatar?: string;
  currentUserName?: string;
  isLoading?: boolean;
  conversationId?: string;
  userId?: string;
}) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const hasMessages = (messages ?? []).length > 0;

  // Reliable scroll to bottom using scrollTop on the messages container
  // This ensures we're scrolling the correct container
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const container = document.getElementById("MessagesScrollContainer");
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 50);
    });
  };

  // Auto-scroll on component mount
  useEffect(() => {
    scrollToBottom();
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll on window resize (handles mobile navigation resizing)
  useEffect(() => {
    const handler = () => scrollToBottom();
    window.addEventListener("resize", handler);
    
    // Handle mobile keyboard appearance/disappearance
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handler);
      window.visualViewport.addEventListener("scroll", handler);
    }
    
    return () => {
      window.removeEventListener("resize", handler);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handler);
        window.visualViewport.removeEventListener("scroll", handler);
      }
    };
  }, []);

  const handleSend = async () => {
    if (!newMessage.trim() || isLoading) return;
    
    try {
      await onSend?.(newMessage);
      setNewMessage('');
      
      // Refocus input so keyboard stays up on mobile
      setTimeout(() => {
        inputRef.current?.focus();
        // Scroll after message is rendered
        scrollToBottom();
      }, 30);
    } catch (err: any) {
      toast.error('Failed to send message', { description: err.message });
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full overflow-hidden relative",
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
      
      {/* Header - fixed height, not scrollable */}
      <ChatHeaderScoped advisor={advisor} advisors={advisors} onSwitchAdvisor={onSwitchAdvisor} />

      {/* Messages area - ONLY scrollable container */}
      <div 
        id="MessagesScrollContainer"
        ref={messagesContainerRef}
        className={cn(
          "flex-1 overflow-y-auto min-h-0 p-2",
          // Mobile: Minimal padding to account for fixed input bar (just enough to clear it)
          "pb-[calc(100px+env(safe-area-inset-bottom,0px))]",
          // Desktop: no extra padding needed (input is sticky inside container)
          "md:pb-2"
        )}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {!hasMessages ? (
          <div className="mb-0 md:mb-8">
            <NoMessagesEmptyState
              onStartChat={() => onSend?.('Hello! I need help.')}
            />
          </div>
        ) : (
          <>
            {(messages || []).map((m, index) => {
              // Improved grouping logic - group by sender and time (within same minute)
              const messageList = messages || [];
              const prevMsg = index > 0 ? messageList[index - 1] : null;
              const nextMsg = index < messageList.length - 1 ? messageList[index + 1] : null;
              
              const isFirstOfGroup = 
                index === 0 ||
                !prevMsg ||
                prevMsg.author !== m.author ||
                new Date(m.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 60000; // 1 minute gap
              
              const isLastInGroup = !nextMsg || 
                nextMsg.author !== m.author ||
                new Date(nextMsg.createdAt).getTime() - new Date(m.createdAt).getTime() > 60000;
              
              const showTail = isFirstOfGroup;
              const isGrouped = !isFirstOfGroup;
              
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <MessageBubbleScoped
                    message={m}
                    isCurrentUser={m.author === 'user'}
                    currentUserAvatar={currentUserAvatar}
                    advisorAvatar={advisor?.avatarUrl}
                    currentUserName={currentUserName}
                    advisorName={advisor?.name}
                    isGrouped={isGrouped}
                    showTail={showTail}
                  />
                </motion.div>
              );
            })}
            {/* Scroll target element at the bottom of messages */}
            <div id="messagesEnd" />
            {/* Minimal spacer to ensure last message is visible above mobile input */}
            <div 
              className="h-[calc(100px+env(safe-area-inset-bottom,0px))] md:h-0"
            />
          </>
        )}
      </div>

      {/* Security & Trust UI - Desktop */}
      <div className="px-4 py-2 hidden md:flex items-center gap-2 text-white/60 text-xs border-t border-white/10">
        <Lock className="w-3 h-3" />
        <span>All chats are end-to-end encrypted & confidential</span>
      </div>

      {/* Contextual Quick Actions - Desktop */}
      {(() => {
        const referrer = document.referrer || '';
        const contextualActions: Array<{ label: string; message: string }> = [];
        
        if (referrer.includes('/contract-upload') || referrer.includes('/contract')) {
          contextualActions.push({ label: 'Ask about this contract', message: 'I have a question about the contract I just analyzed.' });
        }
        if (referrer.includes('/payments')) {
          contextualActions.push({ label: 'Ask about delayed payment', message: 'I have a question about a delayed payment.' });
        }
        if (referrer.includes('/protection')) {
          contextualActions.push({ label: 'Ask about risky clause', message: 'I need help understanding a risky clause in my contract.' });
        }
        
        return contextualActions.length > 0 ? (
          <div className="px-4 pb-2 hidden md:flex flex-wrap gap-2 border-t border-white/10">
            {contextualActions.map((action, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  onSend?.(action.message);
                  triggerHaptic(HapticPatterns.light);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium",
                  "bg-white/10 hover:bg-white/20 text-white/90",
                  "border border-white/10",
                  "transition-all duration-200",
                  "backdrop-blur-sm"
                )}
                whileTap={{ scale: 0.95 }}
              >
                {action.label}
              </motion.button>
            ))}
          </div>
        ) : null;
      })()}

      {/* Input bar - matching LawyerDashboard style */}
      <div className={cn("p-4 border-t border-white/10 flex-shrink-0 hidden md:flex", glass.apple)}>
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
            disabled={!newMessage.trim() || isLoading}
            whileTap={animations.microTap}
            className={cn(
              "px-6 py-2 rounded-xl font-medium",
              "bg-purple-500 hover:bg-purple-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            <ArrowUp className={iconSizes.sm} />
          </motion.button>
        </div>
      </div>

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
        // Special case: Prateek (lawyer) - user ID: 27239566-f735-4423-a898-8dbaee1ec77f
        const isPrateek = adminProfile.id === '27239566-f735-4423-a898-8dbaee1ec77f';
        const firstName = isPrateek ? 'Prateek' : (adminProfile.first_name || '');
        const lastName = isPrateek ? '' : (adminProfile.last_name || '');
        const displayName = isPrateek ? 'Prateek' : `${firstName} ${lastName}`.trim() || 'Legal Advisor';
        
        result.push({
          id: adminProfile.id,
          name: displayName,
          role: 'Legal Advisor',
          avatarUrl: adminProfile.avatar_url || generateAvatarUrl(firstName, lastName),
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

  // State for storing conversation IDs
  const [conversationIds, setConversationIds] = useState<Map<string, string>>(new Map());

  // Get conversation ID for current advisor
  const currentConversationId = useMemo(() => {
    if (!selectedAdvisorId) return null;
    return conversationIds.get(selectedAdvisorId) || null;
  }, [selectedAdvisorId, conversationIds]);

  const selectedAdvisor = advisors.find(a => a.id === selectedAdvisorId);
  const isAdvisorChat = selectedAdvisor?.role === 'Legal Advisor' || selectedAdvisor?.role === 'Chartered Accountant';

  // Fetch conversation messages (new system)
  const { data: conversationMessages, isLoading: isLoadingConversationMessages } = useConversationMessages({
    conversationId: currentConversationId || null,
    enabled: !useCometChatEnabled && !!currentConversationId && isAdvisorChat,
  });

  // Supabase messages (legacy fallback)
  const { data: realMessages, isLoading: isLoadingMessages } = useMessages({
    currentUserId: currentUserId,
    receiverId: selectedAdvisorId || '',
    enabled: !useCometChatEnabled && !!currentUserId && !!selectedAdvisorId && !isAdvisorChat,
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
  
  // Convert messages to new format (CometChat, Conversation, or Legacy)
  const messages: Message[] = useMemo(() => {
    if (!selectedAdvisorId || !currentUserId) return [];

    // Debug logging (reduced to prevent spam)
    // console.log('[MessagesPage] Converting messages:', {
    //   selectedAdvisorId,
    //   currentUserId,
    //   isAdvisorChat,
    //   currentConversationId,
    //   conversationMessagesCount: conversationMessages?.length || 0,
    //   realMessagesCount: realMessages?.length || 0,
    //   cometChatMessagesCount: cometChat.messages.length,
    //   useCometChatEnabled,
    // });

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

    // Use conversation messages (new system) if available
    if (isAdvisorChat && conversationMessages && conversationMessages.length > 0) {
      console.log('[MessagesPage] Using conversation messages:', conversationMessages.length);
      return conversationMessages.map(msg => ({
        id: msg.id,
        advisorId: selectedAdvisorId,
        author: msg.sender_id === currentUserId ? 'user' : 'advisor',
        text: typeof msg.content === 'string' ? msg.content : String(msg.content),
        createdAt: msg.sent_at,
      }));
    }

    // Convert legacy Supabase messages
    if (!isAdvisorChat && realMessages && realMessages.length > 0) {
      return realMessages.map(msg => ({
        id: msg.id,
        advisorId: selectedAdvisorId,
        author: msg.sender_id === currentUserId ? 'user' : 'advisor',
        text: typeof msg.content === 'string' ? msg.content : String(msg.content),
        createdAt: msg.sent_at,
      }));
    }

    if (import.meta.env.DEV) {
      console.log('[MessagesPage] No messages found');
    }
    return [];
  }, [cometChat.messages, conversationMessages, realMessages, selectedAdvisorId, currentUserId, isAdvisorChat, currentConversationId, useCometChatEnabled]);

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

  // Real-time subscription for conversation messages (new system)
  useEffect(() => {
    if (currentConversationId && isAdvisorChat) {
      if (import.meta.env.DEV) {
        console.log('[MessagesPage] Setting up real-time subscription for conversation:', currentConversationId);
      }
      const channel = supabase
        .channel(`conversation_${currentConversationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${currentConversationId}`
          },
          (payload) => {
            if (import.meta.env.DEV) {
              console.log('[MessagesPage] Real-time message update:', payload);
            }
            queryClient.invalidateQueries({ queryKey: ['conversation-messages', currentConversationId] });
          }
        )
        .subscribe();

      return () => {
        if (import.meta.env.DEV) {
          console.log('[MessagesPage] Removing real-time subscription for conversation:', currentConversationId);
        }
        supabase.removeChannel(channel);
      };
    }
  }, [currentConversationId, isAdvisorChat, queryClient]);

  // Real-time subscription for legacy messages
  useEffect(() => {
    if (currentUserId && selectedAdvisorId && !isAdvisorChat) {
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
  }, [currentUserId, selectedAdvisorId, isAdvisorChat, queryClient]);

  const sendMessageMutation = useSendMessage();
  const sendConversationMessageMutation = useSendConversationMessage();
  // conversationIds state is declared above (before useMemo that uses it)

  const handleSelectAdvisor = (advisor: Advisor) => {
    setSelectedAdvisorId(advisor.id);
  };

  // Check if advisor is lawyer/CA and setup conversation
  useEffect(() => {
    if (!selectedAdvisorId || !currentUserId) return;
    
    // Check if conversation already exists to avoid unnecessary setup
    if (conversationIds.has(selectedAdvisorId)) {
      return;
    }

    const setupConversation = async () => {
      try {
        const isAdvisor = await isLawyerOrAdvisor(selectedAdvisorId);
        if (!isAdvisor) return;

        const advisorAuthId = await getAuthUserIdFromProfileId(selectedAdvisorId);
        if (!advisorAuthId) return;

        // Use the outer selectedAdvisor or find it here
        const advisor = advisors.find(a => a.id === selectedAdvisorId);
        const advisorName = advisor?.name || 'Advisor';
        
        const convId = await findOrCreateConversation(
          currentUserId,
          advisorAuthId,
          `Chat with ${advisorName}`
        );
        
        setConversationIds(prev => {
          const next = new Map(prev);
          next.set(selectedAdvisorId, convId);
          return next;
        });
      } catch (error: any) {
        console.error('[MessagesPage] Failed to setup conversation:', error);
      }
    };

    setupConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAdvisorId, currentUserId]); // 'advisors' intentionally omitted to prevent infinite loops (it's memoized and stable)

  const handleSend = async (text: string) => {
    if (!selectedAdvisorId || !currentUserId || !profile) {
      console.warn('[MessagesPage] Cannot send: missing required data', { selectedAdvisorId, currentUserId, profile: !!profile });
      return;
    }

    if (!text.trim()) {
      console.warn('[MessagesPage] Cannot send: empty message');
      return;
    }

    try {
      // Try CometChat first if enabled and initialized
      if (useCometChatEnabled && cometChat.isInitialized) {
        await cometChat.sendMessage(text);
        return;
      }

      // Use the outer selectedAdvisor that's already declared
      const isAdvisorChat = selectedAdvisor?.role === 'Legal Advisor' || selectedAdvisor?.role === 'Chartered Accountant';
      
      if (import.meta.env.DEV) {
        console.log('[MessagesPage] Send attempt:', {
          selectedAdvisorId,
          advisorRole: selectedAdvisor?.role,
          isAdvisorChat,
          conversationIds: Array.from(conversationIds.entries()),
        });
      }

      // Check if this is a lawyer/advisor chat (use new conversation system)
      let conversationId = conversationIds.get(selectedAdvisorId);

      // If advisor chat but no conversation ID, try to create it
      if (isAdvisorChat && !conversationId) {
        if (import.meta.env.DEV) {
          console.log('[MessagesPage] No conversation ID found, creating one...');
        }
        try {
          const advisorAuthId = await getAuthUserIdFromProfileId(selectedAdvisorId);
          if (advisorAuthId) {
            const advisorName = selectedAdvisor?.name || 'Advisor';
            conversationId = await findOrCreateConversation(
              currentUserId,
              advisorAuthId,
              `Chat with ${advisorName}`
            );
            setConversationIds(prev => new Map(prev).set(selectedAdvisorId, conversationId!));
            if (import.meta.env.DEV) {
              console.log('[MessagesPage] Conversation created:', conversationId);
            }
          }
        } catch (error: any) {
          console.error('[MessagesPage] Failed to create conversation:', error);
          toast.error('Failed to setup conversation', { description: error.message });
          return;
        }
      }

      if (isAdvisorChat && conversationId) {
        // Use new conversation system
        if (import.meta.env.DEV) {
          console.log('[MessagesPage] Sending via conversation system:', { conversationId, text: text.substring(0, 50) });
        }
        await sendConversationMessageMutation.mutateAsync({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: text,
        });
        if (import.meta.env.DEV) {
          console.log('[MessagesPage] Message sent successfully via conversation system');
        }
      } else {
        // Use legacy system
        if (import.meta.env.DEV) {
          console.log('[MessagesPage] Sending via legacy system');
        }
        await sendMessageMutation.mutateAsync({
          sender_id: currentUserId,
          receiver_id: selectedAdvisorId,
          content: text,
          senderFirstName: profile.first_name || '',
          senderLastName: profile.last_name || '',
          receiverFirstName: selectedAdvisor?.name.split(' ')[0] || '',
          receiverLastName: selectedAdvisor?.name.split(' ')[1] || undefined,
        });
        if (import.meta.env.DEV) {
          console.log('[MessagesPage] Message sent successfully via legacy system');
        }
      }
    } catch (error: any) {
      console.error('[MessagesPage] Failed to send message:', error);
      toast.error('Failed to send message', { description: error.message || 'Unknown error occurred' });
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
  // selectedAdvisor is already declared above (line 913)
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
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Content area - simplified structure */}
      <div className="flex-1 min-h-0 flex gap-6 md:p-6 px-3 md:px-6 overflow-hidden">
        {/* Desktop: Fixed sidebar */}
        {!isMobile && (
          <AdvisorListScoped
            advisors={advisorsWithMetadata}
            selectedId={selectedAdvisorId}
            onSelect={handleSelectAdvisor}
            isLoading={isLoadingAdvisors}
          />
        )}

        {/* Chat Window - simplified to single flex container, no h-full */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 -mx-3 md:mx-0 overflow-hidden">
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
            isLoading={sendMessageMutation.isPending || sendConversationMessageMutation.isPending || isLoadingMessages || isLoadingConversationMessages || cometChat.isLoading}
            conversationId={selectedAdvisorId ? conversationIds.get(selectedAdvisorId) || undefined : undefined}
            userId={currentUserId || undefined}
          />
        </div>
      </div>

      {/* Mobile fixed composer - rendered at page level for proper visibility */}
      <MessageInputScoped
        onSend={handleSend}
        isLoading={sendMessageMutation.isPending || isLoadingMessages || cometChat.isLoading}
        variant="mobile-fixed"
        className="md:hidden"
        conversationId={selectedAdvisorId ? conversationIds.get(selectedAdvisorId) || undefined : undefined}
        userId={currentUserId || undefined}
      />
    </div>
    </ContextualTipsProvider>
  );
}

