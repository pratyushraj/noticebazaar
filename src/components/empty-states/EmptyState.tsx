"use client";

import React from 'react';
import { LucideIcon, MessageSquare, FileText, Search, Filter, X, Upload, Briefcase, Wallet, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type EmptyStateType = 
  | 'no-data'           // Zero deals, earnings, etc.
  | 'no-results'        // Search/filter with no matches
  | 'no-uploads'        // No contracts uploaded
  | 'no-messages'       // No messages yet
  | 'error'             // Error state
  | 'custom';           // Custom empty state

interface EmptyStateProps {
  type?: EmptyStateType;
  icon?: LucideIcon;
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
  children?: React.ReactNode; // For custom content
}

/**
 * Unified Empty State Component
 * - iOS 17 design system
 * - Multiple variants (default, compact, minimal)
 * - Smooth animations
 * - Accessible
 * - Supports custom illustrations
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  illustration,
  className,
  variant = 'default',
  children,
}) => {
  // Default icons based on type
  const defaultIcons: Record<EmptyStateType, LucideIcon> = {
    'no-data': Briefcase,
    'no-results': Search,
    'no-uploads': FileText,
    'no-messages': MessageSquare,
    'error': X,
    'custom': Inbox,
  };

  const DefaultIcon = Icon || defaultIcons[type];

  // Variant-specific classes
  const variantClasses = {
    default: 'py-16 px-6',
    compact: 'py-8 px-4',
    minimal: 'py-4 px-2',
  };

  const iconSizeClasses = {
    default: 'w-24 h-24',
    compact: 'w-16 h-16',
    minimal: 'w-12 h-12',
  };

  if (variant === 'minimal') {
    return (
      <div className={cn('flex flex-col items-center justify-center text-center', variantClasses[variant], className)}>
        {DefaultIcon && (
          <DefaultIcon className={cn(iconSizeClasses[variant], 'text-white/40 mb-2')} />
        )}
        <h3 className="text-sm font-semibold text-white/80">{title}</h3>
        {description && (
          <p className="text-xs text-white/60 mt-1">{description}</p>
        )}
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            size="sm"
            variant="outline"
            className="mt-3 bg-white/10 border-white/20 text-white hover:bg-white/15"
          >
            {primaryAction.icon && <primaryAction.icon className="w-3 h-3 mr-1.5" />}
            {primaryAction.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        variantClasses[variant],
        className
      )}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mb-6"
        >
          {illustration}
        </motion.div>
      ) : DefaultIcon ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className={cn(
            'rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-lg mb-6',
            iconSizeClasses[variant]
          )}
        >
          <DefaultIcon className={cn(
            variant === 'compact' ? 'w-8 h-8' : 'w-12 h-12',
            'text-white/50'
          )} />
        </motion.div>
      ) : null}

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={cn(
          'font-semibold text-white mb-2',
          variant === 'compact' ? 'text-lg' : 'text-xl'
        )}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'text-white/60 mb-6 max-w-sm leading-relaxed',
            variant === 'compact' ? 'text-sm' : 'text-base'
          )}
        >
          {description}
        </motion.p>
      )}

      {/* Custom Content */}
      {children && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      )}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 items-center justify-center"
        >
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              size={variant === 'compact' ? 'sm' : 'default'}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white min-w-[140px]"
            >
              {primaryAction.icon && <primaryAction.icon className="w-4 h-4 mr-2" />}
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size={variant === 'compact' ? 'sm' : 'default'}
              className="bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/30 min-w-[140px]"
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;

