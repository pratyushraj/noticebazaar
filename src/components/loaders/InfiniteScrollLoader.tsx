"use client";

import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface InfiniteScrollLoaderProps {
  isLoading: boolean;
  hasMore: boolean;
  message?: string;
  endMessage?: string;
}

/**
 * Infinite scroll loader component
 * - Shows loading spinner when fetching more items
 * - Shows end message when no more items available
 * - Smooth animations
 * - iOS 17 design system styling
 */
export const InfiniteScrollLoader: React.FC<InfiniteScrollLoaderProps> = ({
  isLoading,
  hasMore,
  message = 'Loading more...',
  endMessage = "You've reached the end",
}) => {
  if (!hasMore) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6"
      >
        <div className="flex items-center justify-center gap-2 text-sm text-white/60">
          <CheckCircle2 className="w-4 h-4" />
          <span>{endMessage}</span>
        </div>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-6"
      >
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
          <span className="text-sm text-white/70">{message}</span>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default InfiniteScrollLoader;

