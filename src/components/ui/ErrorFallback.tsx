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
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
  const navigate = useNavigate();

  const handleGoHome = () => {
    resetError();
    navigate('/creator-dashboard');
  };

  const content = (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4"
      >
        <AlertTriangle className={`${iconSizes.xl} text-red-400`} />
      </motion.div>
      
      <h2 className={`${typography.h3} mb-2`}>
        {title || 'Something went wrong'}
      </h2>
      
      <p className={`${typography.bodySmall} mb-6 max-w-md mx-auto`}>
        {description || error?.message || 'An unexpected error occurred. Please try again.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={resetError}
          className={`${buttons.primary} flex items-center justify-center gap-2`}
        >
          <RefreshCw className={iconSizes.md} />
          Try Again
        </button>
        
        <button
          onClick={handleGoHome}
          className={`${buttons.secondary} flex items-center justify-center gap-2`}
        >
          <Home className={iconSizes.md} />
          Go Home
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && error && (
        <details className="mt-6 text-left max-w-2xl mx-auto">
          <summary className={`${typography.caption} cursor-pointer mb-2`}>
            Error Details (Development Only)
          </summary>
          <pre className={`${typography.caption} bg-white/5 p-4 rounded-lg overflow-auto max-h-48`}>
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
    <div className={`min-h-screen ${gradients.page} flex items-center justify-center ${spacing.page}`}>
      <BaseCard variant="primary" className="max-w-lg w-full">
        {content}
      </BaseCard>
    </div>
  );
};

