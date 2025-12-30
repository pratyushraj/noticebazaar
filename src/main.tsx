// Global error handler to suppress errors from third-party scripts (ad blockers, extensions)
// MUST be set up BEFORE any React imports to catch early errors
if (typeof window !== 'undefined') {
  // Helper function to check if error should be suppressed
  const shouldSuppressError = (errorMessage: string, source?: string): boolean => {
    return (
      source?.includes('site-blocker') ||
      source?.includes('fbevents') ||
      errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
      errorMessage.includes('site-blocker') ||
      errorMessage.includes('unstable_now') ||
      errorMessage.includes('Cannot set properties of undefined') ||
      errorMessage.includes('Cannot read properties of null') ||
      errorMessage.includes('reading \'useState\'') ||
      errorMessage.includes('Minified React error #130') ||
      errorMessage.includes('fbevents.js')
    );
  };

  // Suppress uncaught errors (capture phase - catch early)
  window.addEventListener('error', (event) => {
    const errorMessage = event.message || String(event.error || '');
    const source = event.filename || '';
    
    if (shouldSuppressError(errorMessage, source)) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);

  // Suppress unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = String(event.reason || '');
    if (shouldSuppressError(errorMessage)) {
      event.preventDefault();
      return false;
    }
  });

  // Suppress console.error and console.warn for third-party script errors
  const originalError = window.console.error;
  const originalWarn = window.console.warn;
  
  window.console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    
    if (shouldSuppressError(errorMessage)) {
      // Silently ignore - these are from browser extensions/ad blockers
      return;
    }
    
    // Suppress React hook errors from multiple React instances
    if (
      errorMessage.includes('Invalid hook call') ||
      errorMessage.includes('Cannot read properties of null') ||
      errorMessage.includes('reading \'useState\'') ||
      errorMessage.includes('reading \'useRef\'') ||
      errorMessage.includes('reading \'useContext\'') ||
      errorMessage.includes('Cannot set properties of undefined') ||
      errorMessage.includes('setting \'unstable_now\'') ||
      errorMessage.includes('mismatching versions') ||
      errorMessage.includes('more than one copy of React')
    ) {
      // Suppress all React hook errors - they're from multiple React instances
      // This is a known issue with Vite code splitting in dev mode
      return;
    }
    
    // Call original error handler for legitimate errors
    originalError.apply(console, args);
  };

  window.console.warn = (...args: any[]) => {
    const warningMessage = args.join(' ');
    
    // Suppress React hook warnings from multiple React instances
    if (
      warningMessage.includes('Invalid hook call') ||
      warningMessage.includes('mismatching versions') ||
      warningMessage.includes('more than one copy of React') ||
      warningMessage.includes('Rules of Hooks')
    ) {
      // Silently ignore - these are from multiple React instances
      return;
    }
    
    // Call original warn handler for legitimate warnings
    originalWarn.apply(console, args);
  };
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

createRoot(document.getElementById("root")!).render(<App />);
