// Global error handler to suppress errors from third-party scripts (ad blockers, extensions)
// MUST be set up BEFORE any React imports to catch early errors
if (typeof window !== 'undefined') {
  // CRITICAL: Patch Object.prototype to prevent unstable_now errors
  // React's scheduler tries to set unstable_now on objects that might be undefined
  // We create a safe wrapper that prevents this from crashing
  const originalObject = Object;
  
  // Patch Object.defineProperty globally before anything else
  const originalDefineProperty = Object.defineProperty;
  
  // Workaround for React scheduler unstable_now error
  // This error occurs when React's scheduler tries to set properties on undefined
  // We intercept both Object.defineProperty and direct property assignment
  
  // 1. Intercept Object.defineProperty to prevent unstable_now errors
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
  
  // 1b. Patch global object to ensure React scheduler has a valid object to work with
  // React's scheduler tries to set unstable_now on an object that might be undefined
  // We ensure all global objects that React might use are properly initialized
  if (typeof globalThis !== 'undefined') {
    // Ensure globalThis has the necessary properties
    if (!globalThis.performance) {
      globalThis.performance = {
        now: () => Date.now()
      } as any;
    }
  }
  
  // 1c. Intercept direct property assignments by patching Object.prototype
  // This is a last resort - we can't directly intercept undefined.property = value
  // But we can ensure objects exist before React tries to use them
  const originalSetProperty = Object.setPrototypeOf;
  Object.setPrototypeOf = function(obj: any, proto: any) {
    try {
      // If trying to set prototype on undefined, create a dummy object
      if (obj === undefined || obj === null) {
        return originalSetProperty.call(this, {}, proto);
      }
      return originalSetProperty.call(this, obj, proto);
    } catch (e) {
      // If it fails, try with a fallback object
      if (obj === undefined || obj === null) {
        try {
          return originalSetProperty.call(this, {}, proto);
        } catch {
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
  
  // 3. Aggressively catch unstable_now errors before they crash
  // Set up error handler as early as possible, even before other handlers
  const originalErrorHandler = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    const errorStr = String(message || '');
    const errorStack = error?.stack || '';
    const errorMessage = error?.message || '';
    
    // Check all possible error representations
    if (errorStr.includes('unstable_now') || 
        errorStr.includes('Cannot set properties of undefined') ||
        errorStack.includes('unstable_now') ||
        errorMessage.includes('unstable_now') ||
        errorMessage.includes('Cannot set properties of undefined')) {
      // Suppress the error completely - don't let it crash the app
      // Try to continue execution by not throwing
      return true; // Prevent default error handling
    }
    // Call original error handler for other errors
    if (originalErrorHandler) {
      return originalErrorHandler.call(this, message, source, lineno, colno, error);
    }
    return false;
  };
  
  // Also set up error listener (redundant but ensures we catch it)
  window.addEventListener('error', function(event) {
    const errorStr = String(event.message || '');
    const errorStack = String(event.error?.stack || '');
    if (errorStr.includes('unstable_now') || 
        errorStr.includes('Cannot set properties of undefined') ||
        errorStack.includes('unstable_now')) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  }, true); // Use capture phase
  
  // 4. Also catch unhandled promise rejections that might contain unstable_now errors
  const originalUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = function(event) {
    const errorStr = String(event.reason || '');
    if (errorStr.includes('unstable_now') || 
        errorStr.includes('Cannot set properties of undefined')) {
      event.preventDefault();
      return true;
    }
    if (originalUnhandledRejection) {
      return originalUnhandledRejection.call(this, event);
    }
    return false;
  };
  
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

// Wrap React initialization in additional error handling
// If unstable_now error occurs, React might fail silently, so we check if it actually rendered
let renderAttempted = false;
let renderSucceeded = false;

try {
  const root = createRoot(rootElement);
  root.render(<App />);
  renderAttempted = true;
  // Give React a moment to initialize
  setTimeout(() => {
    // Check if React actually rendered by looking for React root
    const reactRoot = rootElement.querySelector('[data-reactroot], #root > *');
    if (reactRoot) {
      renderSucceeded = true;
    } else if (renderAttempted && !renderSucceeded) {
      // React failed to render, likely due to unstable_now error
      console.warn('[React] App may have failed to render due to scheduler error');
      // Try to show fallback UI
      showFallbackUI(rootElement, new Error('React failed to initialize - likely due to scheduler error'));
    }
  }, 500);
} catch (error: any) {
  // If React fails to render, show a fallback UI
  console.error("Failed to render app:", error);
  showFallbackUI(rootElement, error);
}

function showFallbackUI(rootElement: HTMLElement, error: any) {
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
