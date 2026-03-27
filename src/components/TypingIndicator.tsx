"use client";

import React from 'react';
import { cn } from '@/lib/utils';

const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-1 p-2 bg-secondary rounded-lg rounded-bl-none max-w-[70%]">
      <span className="text-sm text-secondary-foreground italic mr-2">Lexi is typing...</span>
      <div className="flex space-x-1">
        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
};

export default TypingIndicator;