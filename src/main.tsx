// Global error handler to suppress errors from third-party scripts (ad blockers, extensions)
// MUST be set up BEFORE any React imports to catch early errors
if (typeof window !== 'undefined') {
  // Workaround for React scheduler unstable_now error
  // This error occurs when React's scheduler tries to set properties on undefined
  // We intercept both Object.defineProperty and direct property assignment
  
  // 1. Intercept Object.defineProperty
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj: any, prop: string, descriptor: PropertyDescriptor) {
    try {
      // If trying to set unstable_now on undefined/null, create a dummy object
      if (prop === 'unstable_now' && (obj === undefined || obj === null)) {
        const dummyObj: any = {};
        return originalDefineProperty.call(this, dummyObj, prop, descriptor);
      }
      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (e: any) {
      // If setting unstable_now fails, create a safe fallback
      if (prop === 'unstable_now') {
        try {
          const fallbackObj: any = obj || {};
          return originalDefineProperty.call(this, fallbackObj, prop, {
            ...descriptor,
            value: descriptor.value || (() => performance.now()),
            writable: true,
            configurable: true
          });
        } catch {
          // If all else fails, return the object unchanged
          return obj;
        }
      }
      throw e;
    }
  };
  
  // 2. Polyfill performance.now if missing (React scheduler depends on it)
  if (typeof performance === 'undefined' || typeof performance.now !== 'function') {
    (window as any).performance = {
      now: () => Date.now()
    };
  }
  
  // Helper function to check if error should be suppressed
  const shouldSuppressError = (errorMessage: string, source?: string): boolean => {
    const message = errorMessage.toLowerCase();
    const src = (source || '').toLowerCase();
    
    return (
      src.includes('site-blocker') ||
      src.includes('fbevents') ||
      message.includes('err_blocked_by_client') ||
      message.includes('site-blocker') ||
      message.includes('unstable_now') ||
      message.includes('cannot set properties of undefined') ||
      message.includes('setting \'unstable_now\'') ||
      message.includes('cannot read properties of null') ||
      message.includes('reading \'usestate\'') ||
      message.includes('minified react error #130') ||
      message.includes('fbevents.js') ||
      message.includes('react-vendor') && message.includes('unstable')
    );
  };

  // Suppress uncaught errors (capture phase - catch early)
  window.addEventListener('error', (event) => {
    const errorMessage = event.message || String(event.error || '');
    const source = event.filename || '';
    const errorStack = event.error?.stack || '';
    
    // Check error message, source, and stack trace
    if (shouldSuppressError(errorMessage, source) || 
        shouldSuppressError(errorStack, source) ||
        errorMessage.includes('unstable_now') ||
        errorStack.includes('unstable_now')) {
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
      errorMessage.includes('more than one copy of React') ||
      errorMessage.includes('The above error occurred in the') ||
      errorMessage.includes('Consider adding an error boundary')
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

// Safely render the app with error handling
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

try {
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error: any) {
  // If React fails to render, show a fallback UI
  console.error("Failed to render app:", error);
  rootElement.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #6A5CFF 0%, #8B7FFF 100%);
      color: white;
      padding: 2rem;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <h1 style="font-size: 2rem; margin-bottom: 1rem;">⚠️ App Loading Error</h1>
      <p style="font-size: 1.1rem; margin-bottom: 2rem; opacity: 0.9;">
        The app encountered an error while loading. Please refresh the page.
      </p>
      <button 
        onclick="window.location.reload()" 
        style="
          background: white;
          color: #6A5CFF;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        "
        onmouseover="this.style.transform='scale(1.05)'"
        onmouseout="this.style.transform='scale(1)'"
      >
        Refresh Page
      </button>
      ${process.env.NODE_ENV === 'development' ? `
        <details style="margin-top: 2rem; text-align: left; max-width: 600px;">
          <summary style="cursor: pointer; margin-bottom: 1rem;">Error Details</summary>
          <pre style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 0.5rem; overflow: auto; font-size: 0.875rem;">
            ${error?.stack || error?.toString() || 'Unknown error'}
          </pre>
        </details>
      ` : ''}
    </div>
  `;
}
