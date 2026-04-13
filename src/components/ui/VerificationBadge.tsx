'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Blue tick verification badge (Instagram-style).
 * Show when payout_verified=true OR profile is fully completed.
 */
export function VerificationBadge({ className, size = 'md' }: VerificationBadgeProps) {
  const sizeMap = {
    sm: { outer: 14, inner: 8, stroke: 1.5 },
    md: { outer: 18, inner: 10, stroke: 1.5 },
    lg: { outer: 24, inner: 14, stroke: 2 },
  };

  const { outer, inner, stroke } = sizeMap[size];

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center shrink-0 rounded-full bg-blue-500 ring-1 ring-blue-500/30',
        className
      )}
      aria-label="Verified creator"
      title="Verified creator"
    >
      {/* SVG checkmark */}
      <svg
        width={inner}
        height={inner}
        viewBox="0 0 10 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M2 5.5L4 7.5L8 3"
          stroke="white"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
