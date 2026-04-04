/**
 * ErrorFallback Component
 * 
 * Premium error fallback UI using design system tokens
 * Used by ErrorBoundary components throughout the app
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { BaseCard } from '@/components/ui/card-variants';
import { typography, spacing, iconSizes, buttons, gradients } from '@/lib/design-system';
import { motion } from 'framer-motion';

const isDebugEnabled = () => {
  if (import.meta.env.DEV) return true;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.has('debug') || params.get('debug') === '1';
  } catch {
    return false;
  }
};

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  variant?: 'full' | 'inline' | 'modal';
  title?: string;
  description?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  variant = 'full',
  title,
  description,
}) => {
  const debug = isDebugEnabled();

  const handleGoHome = () => {
    resetError();
    // Use window.location with hash for HashRouter compatibility
    // This works even when ErrorBoundary is rendered outside Router context
    window.location.href = '/creator-dashboard';
  };

  const handleCopyError = async () => {
    const payload = [
      `Title: ${title || 'Something went wrong'}`,
      error ? `Name: ${error.name}` : '',
      error ? `Message: ${error.message}` : '',
      error?.stack ? `Stack:\n${error.stack}` : '',
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // Clipboard may be blocked; ignore.
    }
  };

  const content = (
    <div className="text-center text-slate-900 dark:text-white">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4"
      >
        <AlertTriangle className={`${iconSizes.xl} text-red-400`} />
      </motion.div>
      
      <h2 className={`${typography.h3} mb-2 text-slate-900 dark:text-white`}>
        {title || 'Something went wrong'}
      </h2>
      
      <p className={`${typography.bodySmall} mb-6 max-w-md mx-auto text-slate-600 dark:text-white/80`}>
        {description || error?.message || 'An unexpected error occurred. Please try again.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button type="button"
          onClick={resetError}
          className={`${buttons.primary} flex items-center justify-center gap-2`}
        >
          <RefreshCw className={iconSizes.md} />
          Try Again
        </button>
        
        <button type="button"
          onClick={handleGoHome}
          className={`${buttons.secondary} flex items-center justify-center gap-2`}
        >
          <Home className={iconSizes.md} />
          Go Home
        </button>
      </div>

      {debug && error && (
        <details className="mt-6 text-left max-w-2xl mx-auto">
          <summary className={`${typography.caption} cursor-pointer mb-2 text-slate-700 dark:text-white/70`}>
            Error Details
          </summary>
          <div className="flex items-center justify-end mb-2">
            <button
              type="button"
              onClick={() => void handleCopyError()}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white"
            >
              Copy Error
            </button>
          </div>
          <pre className={`${typography.caption} bg-slate-950/5 dark:bg-white/5 p-4 rounded-lg overflow-auto max-h-48 text-slate-800 dark:text-white/80`}>
            {error.stack || error.toString()}
          </pre>
        </details>
      )}
    </div>
  );

  if (variant === 'inline') {
    return (
      <BaseCard variant="secondary" className={spacing.cardPadding.secondary}>
        {content}
      </BaseCard>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <BaseCard variant="primary" className="max-w-md w-full">
          {content}
        </BaseCard>
      </div>
    );
  }

  // Full page variant
  return (
    <div className={`nb-screen-height ${gradients.page} flex items-center justify-center ${spacing.page}`}>
      <BaseCard variant="primary" className="max-w-lg w-full">
        {content}
      </BaseCard>
    </div>
  );
};
