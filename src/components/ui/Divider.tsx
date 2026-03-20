/**
 * Unified Divider Component
 * 
 * Consistent dividers using design system separators
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { separators } from '@/lib/design-system';

interface DividerProps {
  variant?: 'section' | 'card' | 'subtle';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  variant = 'section',
  className,
}) => {
  return (
    <div className={cn(
      variant === 'section' ? separators.section :
      variant === 'card' ? separators.card :
      separators.subtle,
      className
    )} />
  );
};

