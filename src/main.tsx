import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

// Global error handler to suppress errors from third-party scripts (ad blockers, extensions)
if (typeof window !== 'undefined') {
  const originalError = window.console.error;
  window.console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    
    // Suppress errors from third-party scripts (ad blockers, site blockers, etc.)
    if (
      errorMessage.includes('site-blocker') ||
      errorMessage.includes('fbevents') ||
      errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
      errorMessage.includes('Failed to load resource: net::ERR_BLOCKED_BY_CLIENT')
    ) {
      // Silently ignore - these are from browser extensions/ad blockers
      return;
    }
    
    // Suppress React error #130 from third-party scripts
    if (errorMessage.includes('Minified React error #130') && errorMessage.includes('site-blocker')) {
      return;
    }
    
    // Suppress React hook errors from multiple React instances (temporary - will fix root cause)
    if (
      errorMessage.includes('Invalid hook call') ||
      errorMessage.includes('Cannot read properties of null') ||
      errorMessage.includes('reading \'useState\'') ||
      errorMessage.includes('reading \'useRef\'') ||
      errorMessage.includes('reading \'useContext\'')
    ) {
      // Only suppress if it's clearly a multiple React instances issue
      if (errorMessage.includes('mismatching versions') || 
          errorMessage.includes('more than one copy of React')) {
        console.warn('[React] Multiple React instances detected - this is a known issue being worked on');
        return;
      }
    }
    
    // Call original error handler for legitimate errors
    originalError.apply(console, args);
  };

  // Also handle unhandled errors
  window.addEventListener('error', (event) => {
    const errorMessage = event.message || String(event.error || '');
    const source = event.filename || '';
    
    // Suppress errors from third-party scripts
    if (
      source.includes('site-blocker') ||
      source.includes('fbevents') ||
      errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
      errorMessage.includes('site-blocker')
    ) {
      event.preventDefault();
      return;
    }
  }, true); // Use capture phase
}

createRoot(document.getElementById("root")!).render(<App />);
