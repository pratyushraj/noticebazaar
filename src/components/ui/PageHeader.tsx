/**
 * Unified PageHeader Component
 * 
 * Premium iOS-style header with consistent spacing, z-index, and safe-area handling
 * Used across all pages for navigation consistency
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { spacing, typography, iconSizes, animations } from '@/lib/design-system';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

interface PageHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  onBack?: () => void;
  onMenuClick?: () => void;
  rightActions?: React.ReactNode;
  className?: string;
  subtitle?: string;
  premium?: boolean; // Premium iOS 17 styling
  compact?: boolean; // ~30% less height on mobile
  backIconOnly?: boolean; // Show only arrow, no "Back" text
  /** When true, show only menu/back + right actions (no title/subtitle). Payments/Deals style. */
  hideTitle?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBackButton = false,
  showMenuButton = false,
  onBack,
  onMenuClick,
  rightActions,
  className,
  subtitle,
  premium = false,
  compact = false,
  backIconOnly = false,
  hideTitle = false,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    triggerHaptic(HapticPatterns.light);
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleMenuClick = () => {
    triggerHaptic(HapticPatterns.light);
    if (onMenuClick) {
      onMenuClick();
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full relative",
        premium 
          ? "bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-purple-800/95 backdrop-blur-xl border-b border-white/15"
          : "bg-purple-900/95 backdrop-blur-xl border-b border-white/10",
        "shadow-lg",
        className
      )}
      style={{
        paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        paddingBottom: compact ? '10px' : '16px',
        paddingLeft: 'calc(16px + env(safe-area-inset-left, 0px))',
        paddingRight: 'calc(16px + env(safe-area-inset-right, 0px))',
        ...(premium && {
          boxShadow: '0 8px 24px rgba(0,0,0,0.3), 0 0 1px rgba(255,255,255,0.1)',
        }),
      }}
    >
      {/* Glare layer at top */}
      {premium && (
        <div 
          className="absolute inset-x-0 top-0 h-20 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, transparent 100%)',
          }}
        />
      )}
      
      <div
        className={cn(
          "flex items-center justify-between gap-3 relative z-10",
          "px-4 sm:px-6 min-h-0 w-full max-w-full",
          compact ? "py-2.5 sm:py-5" : "py-4 sm:py-5"
        )}
      >
        {/* Left: Back Button or Menu — safe padding, left-aligned */}
        <div className="flex items-center flex-shrink-0 min-w-0">
          {showBackButton && (
            <button
              onClick={handleBack}
              className={cn(
                "flex items-center gap-1 text-white",
                animations.cardPress,
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2",
                (premium || backIconOnly) && "w-9 h-9 justify-center"
              )}
              aria-label="Go back"
            >
              <ArrowLeft className={premium || backIconOnly ? iconSizes.sm : iconSizes.md} />
              {!premium && !backIconOnly && <span className={cn(typography.body, "font-medium")}>Back</span>}
            </button>
          )}
          {showMenuButton && !showBackButton && (
            <button
              onClick={handleMenuClick}
              className={cn(
                premium ? "w-9 h-9 rounded-lg" : "p-2 rounded-lg",
                animations.cardPress,
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                "flex items-center justify-center"
              )}
              aria-label="Open menu"
            >
              <Menu className={premium ? iconSizes.sm : iconSizes.md} />
            </button>
          )}
        </div>

        {/* Center: Title + Subtitle — or empty when hideTitle (Payments/Deals style) */}
        {!hideTitle && (
          <div className="flex-1 min-w-0 text-center px-2 overflow-visible max-w-full">
            <h1 className="text-white font-semibold leading-snug break-words whitespace-normal text-lg sm:text-xl">
              {title}
            </h1>
            {subtitle && (
              <p className="text-white/70 mt-1 break-words whitespace-normal text-xs sm:text-sm leading-snug">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {hideTitle && <div className="flex-1 min-w-0" />}

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-2 flex-shrink-0 min-w-0">
          {rightActions}
        </div>
      </div>
    </header>
  );
};

