"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, ArrowUp } from 'lucide-react';
import clsx from 'clsx';

type Props = {
  onSend?: (text: string) => void;
  isLoading?: boolean;
  placeholder?: string;
};

export const MessageInput: React.FC<Props> = ({ onSend, isLoading = false, placeholder = "Type your secure message…" }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
  }, [value]);

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
    <div className="sticky bottom-0 w-full px-4 py-3 bg-card border-t border-border/40">
      <div className="flex items-center gap-2 bg-muted/20 border border-border/40 rounded-full px-3 py-2 shadow-sm transition-all duration-150">
        <button
          type="button"
          className="p-2 rounded-full hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground"
          onClick={() => {
            // TODO: Implement attachment functionality
          }}
        >
          <Paperclip size={18} />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="resize-none overflow-hidden bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground/70 text-foreground disabled:opacity-50 max-h-[120px]"
          rows={1}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim() || isLoading}
          className={clsx(
            "ml-2 p-2 rounded-full bg-blue-600 hover:bg-blue-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
            value.trim() && "hover:shadow-[0_8px_24px_rgba(59,130,246,0.12)]"
          )}
          aria-label="Send message"
        >
          <ArrowUp size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
};
