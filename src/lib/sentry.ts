/**
 * Sentry Error Tracking Configuration
 * 
 * Setup:
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a new React project
 * 3. Copy your DSN from Project Settings
 * 4. Add to .env: VITE_SENTRY_DSN=your-dsn-here
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.MODE;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    
    // Only enable in production
    enabled: ENVIRONMENT === 'production',
    
    // Sample rate for performance monitoring (0.1 = 10%)
    tracesSampleRate: 0.1,
    
    // Filter out common non-critical errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'Can\'t find variable: ZiteReader',
      // Network errors
      'NetworkError',
      'Network request failed',
      // Random browser errors
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
    
    // Filter out browser extension errors
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
    ],
  });
}

// Helper to capture errors with context
export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Helper to add user context
export function setUserContext(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser(user);
}

// Helper to clear user context on logout
export function clearUserContext() {
  Sentry.setUser(null);
}

// Performance tracking helper
export function trackPerformance(name: string, fn: () => Promise<void>) {
  return Sentry.startSpan({ name }, fn);
}
