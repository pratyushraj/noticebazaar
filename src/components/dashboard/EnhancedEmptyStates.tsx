"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Zap, Search, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EnhancedEmptyStateProps {
  type: 'no-deals' | 'no-recommendations' | 'no-search-results' | 'no-active-deals';
  isDark?: boolean;
  onAction?: () => void;
}

const EnhancedEmptyStates: React.FC<EnhancedEmptyStateProps> = ({
  type,
  isDark = true,
  onAction,
}) => {
  const states = {
    'no-deals': {
      icon: Briefcase,
      title: "No deals yet",
      description: "Share your collab link to start receiving verified brand offers",
      emojis: ['💼', '🤝', '📈'],
      actionLabel: 'Share Collab Link',
      color: 'from-blue-600 to-cyan-600',
      bgColor: 'bg-info/10 border-info/20',
    },
    'no-recommendations': {
      icon: Star,
      title: "You're all caught up!",
      description: "No recommendations right now. Keep completing deals to unlock growth insights",
      emojis: ['🎉', '⭐', '🚀'],
      actionLabel: 'View Analytics',
      color: 'from-purple-600 to-pink-600',
      bgColor: 'bg-secondary/50 border-purple-500/20',
    },
    'no-search-results': {
      icon: Search,
      title: "No deals found",
      description: "Try adjusting your search or filter criteria",
      emojis: ['🔍', '📝', '🎯'],
      actionLabel: 'Clear Filters',
      color: 'from-amber-600 to-orange-600',
      bgColor: 'bg-warning/10 border-warning/20',
    },
    'no-active-deals': {
      icon: Zap,
      title: "No active deals",
      description: "Accept offers or create new deals to get started",
      emojis: ['⚡', '🔥', '💡'],
      actionLabel: 'Browser Offers',
      color: 'from-red-600 to-orange-600',
      bgColor: 'bg-destructive/10 border-destructive/20',
    },
  };

  const state = states[type];
  const Icon = state.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'p-8 rounded-3xl border text-center relative overflow-hidden',
        isDark ? `${state.bgColor} border-border` : 'bg-background border-border shadow-sm'
      )}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {state.emojis.map((emoji, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.5, y: -10 }}
            transition={{
              duration: 3 + idx,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: idx * 0.2,
            }}
            className={cn(
              'absolute text-4xl',
              idx === 0 ? 'top-2 right-4' : idx === 1 ? 'bottom-4 left-2' : 'top-1/3 right-1/4'
            )}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className={cn(
            'w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br',
            state.color
          )}
        >
          <Icon className="w-8 h-8 text-foreground" />
        </motion.div>

        {/* Title */}
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className={cn(
            'text-lg sm:text-xl font-bold mb-2',
            isDark ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {state.title}
        </motion.h3>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className={cn(
            'text-sm mb-6 max-w-xs mx-auto',
            isDark ? 'text-foreground/60' : 'text-muted-foreground'
          )}
        >
          {state.description}
        </motion.p>

        {/* Action Button */}
        {onAction && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
          >
            <Button
              onClick={onAction}
              className={cn(
                'bg-gradient-to-r text-foreground font-bold rounded-xl px-6 py-2.5 text-sm hover:shadow-lg transition-all active:scale-95 shadow-lg',
                state.color
              )}
            >
              {state.actionLabel}
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default EnhancedEmptyStates;
