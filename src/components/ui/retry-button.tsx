"use client";

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RetryButtonProps {
  onRetry: () => void;
  isLoading?: boolean;
  className?: string;
}

export function RetryButton({ onRetry, isLoading = false, className }: RetryButtonProps) {
  return (
    <Button
      onClick={onRetry}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className={cn(
        "rounded-[12px] bg-white/10 border-white/20 text-white hover:bg-white/15 active:scale-[0.97]",
        className
      )}
    >
      <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
      {isLoading ? 'Retrying...' : 'Retry'}
    </Button>
  );
}

