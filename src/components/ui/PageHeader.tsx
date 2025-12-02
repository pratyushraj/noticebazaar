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
import { AppsGridMenu } from '@/components/navigation/AppsGridMenu';

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  onBack?: () => void;
  onMenuClick?: () => void;
  rightActions?: React.ReactNode;
  className?: string;
  subtitle?: string;
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
        "sticky top-0 z-50 w-full",
        "bg-purple-900/95 backdrop-blur-xl border-b border-white/10",
        "shadow-lg",
        className
      )}
      style={{
        paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        paddingBottom: '16px',
        paddingLeft: 'calc(16px + env(safe-area-inset-left, 0px))',
        paddingRight: 'calc(16px + env(safe-area-inset-right, 0px))',
      }}
    >
      <div className={cn("flex items-center justify-between gap-3", spacing.cardPadding.tertiary, "py-3")}>
        {/* Left: Back Button or Menu */}
        <div className="flex items-center min-w-[80px]">
          {showBackButton && (
            <button
              onClick={handleBack}
              className={cn(
                "flex items-center gap-1 text-white",
                animations.cardPress,
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2"
              )}
              aria-label="Go back"
            >
              <ArrowLeft className={iconSizes.md} />
              <span className={cn(typography.body, "font-medium")}>Back</span>
            </button>
          )}
          {showMenuButton && !showBackButton && (
            <button
              onClick={handleMenuClick}
              className={cn(
                "p-2 rounded-lg",
                animations.cardPress,
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              )}
              aria-label="Open menu"
            >
              <Menu className={iconSizes.md} />
            </button>
          )}
        </div>

        {/* Center: Title */}
        <div className="flex-1 min-w-0 text-center px-2">
          <h1 className={cn(typography.h3, "truncate")}>
            {title}
          </h1>
          {subtitle && (
            <p className={cn(typography.bodySmall, "mt-0.5")}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-2 min-w-[80px]">
          {rightActions || (
            <AppsGridMenu
              trigger={
                <button
                  className={cn(
                    "p-2 rounded-lg",
                    animations.cardPress,
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  )}
                  aria-label="Open apps menu"
                >
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none"
                    className="text-white/70"
                  >
                    <circle cx="4" cy="4" r="2.2" fill="currentColor"/>
                    <circle cx="12" cy="4" r="2.2" fill="currentColor"/>
                    <circle cx="20" cy="4" r="2.2" fill="currentColor"/>
                    <circle cx="4" cy="12" r="2.2" fill="currentColor"/>
                    <circle cx="12" cy="12" r="2.2" fill="currentColor"/>
                    <circle cx="20" cy="12" r="2.2" fill="currentColor"/>
                    <circle cx="4" cy="20" r="2.2" fill="currentColor"/>
                    <circle cx="12" cy="20" r="2.2" fill="currentColor"/>
                    <circle cx="20" cy="20" r="2.2" fill="currentColor"/>
                  </svg>
                </button>
              }
            />
          )}
        </div>
      </div>
    </header>
  );
};

