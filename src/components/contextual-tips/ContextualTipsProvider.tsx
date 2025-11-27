"use client";

import React from 'react';
import { TipCard } from './TipCard';
import { useContextualTips } from '@/hooks/useContextualTips';

interface ContextualTipsProviderProps {
  currentView?: string;
  children?: React.ReactNode;
}

/**
 * Contextual Tips Provider
 * Automatically shows tips based on current view and user state
 */
export const ContextualTipsProvider: React.FC<ContextualTipsProviderProps> = ({
  currentView,
  children,
}) => {
  const { currentTip, handleDismiss, handleAction } = useContextualTips(currentView);

  return (
    <>
      {children}
      {currentTip && (
        <TipCard tip={currentTip} onDismiss={handleDismiss} onAction={handleAction} />
      )}
    </>
  );
};

