import React, { useState, KeyboardEvent } from 'react';
import { Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ChipInputProps {
  value: string;
  chips: string[];
  onChange: (value: string) => void;
  onChipsChange: (chips: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
}

export const ChipInput: React.FC<ChipInputProps> = ({
  value,
  chips,
  onChange,
  onChipsChange,
  disabled,
  placeholder = "e.g., tax, equipment, travel",
  error,
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed && !chips.includes(trimmed)) {
        onChipsChange([...chips, trimmed]);
        onChange('');
      } else if (trimmed === '') {
        onChange('');
      }
    } else if (e.key === 'Backspace' && value === '' && chips.length > 0) {
      onChipsChange(chips.slice(0, -1));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Auto-parse comma-separated values
    if (newValue.includes(',')) {
      const parts = newValue.split(',');
      const completedTags = parts.slice(0, -1)
        .map(t => t.trim())
        .filter(t => t.length > 0 && !chips.includes(t));
      
      if (completedTags.length > 0) {
        onChipsChange([...chips, ...completedTags]);
      }
      
      // Keep only the last part (incomplete tag)
      const lastPart = parts[parts.length - 1].trim();
      onChange(lastPart);
    } else {
      onChange(newValue);
    }
  };

  const removeChip = (chipToRemove: string) => {
    onChipsChange(chips.filter(chip => chip !== chipToRemove));
  };

  return (
    <div>
      <div className="relative">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 z-10" />
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "w-full pl-9 pr-4 py-3 rounded-xl",
            "bg-white/10 border border-white/20 backdrop-blur-xl",
            "text-white placeholder:text-white/40",
            "focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-400/50 focus:border-red-400"
          )}
        />
      </div>
      
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          <AnimatePresence>
            {chips.map((chip) => (
              <motion.div
                key={chip}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg",
                  "bg-white/10 border border-white/20 backdrop-blur-xl",
                  "text-sm text-white/90"
                )}
              >
                <span>{chip}</span>
                <button
                  type="button"
                  onClick={() => removeChip(chip)}
                  disabled={disabled}
                  className={cn(
                    "p-0.5 rounded hover:bg-white/20 transition-colors",
                    "text-white/60 hover:text-white"
                  )}
                  aria-label={`Remove ${chip} tag`}
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
      
      <p className="text-xs text-white/60 mt-1">
        Press Enter or comma to add a tag
      </p>
    </div>
  );
};
