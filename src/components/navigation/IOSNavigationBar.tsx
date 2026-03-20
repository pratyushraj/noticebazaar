"use client";

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IOSNavigationBarProps {
  title: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}

const IOSNavigationBar: React.FC<IOSNavigationBarProps> = ({
  title,
  showBackButton = true,
  rightAction,
  className
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Don't show back button on main dashboard
  const shouldShowBack = showBackButton && location.pathname !== '/creator-dashboard';

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full h-14",
      "bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] border-b border-white/10",
      "shadow-[0_1px_0_rgba(0,0,0,0.1)]",
      className
    )}>
      <div className="flex items-center justify-between h-full px-4">
        {/* Left: Back Button */}
        <div className="flex items-center min-w-[80px]">
          {shouldShowBack && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-white active:opacity-50 transition-opacity"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-base font-medium">Back</span>
            </button>
          )}
        </div>

        {/* Center: Title */}
        <h1 className="text-lg font-semibold text-white text-center flex-1 truncate px-2">
          {title}
        </h1>

        {/* Right: Action Button */}
        <div className="flex items-center justify-end min-w-[80px]">
          {rightAction || <div className="w-10" />}
        </div>
      </div>
    </header>
  );
};

export default IOSNavigationBar;

