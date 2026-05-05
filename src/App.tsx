import React, { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SplashScreen } from "@/components/mobile/SplashScreen";
import AppToaster from "./components/AppToaster";
import FacebookPixelTracker from "./components/FacebookPixelTracker";
import GoogleAnalyticsTracker from "./components/GoogleAnalyticsTracker";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { GlobalLoadingBar } from "./components/GlobalLoadingBar";
import NetworkStatusWrapper from "./components/NetworkStatusWrapper";
import ScrollToTop from "./components/ScrollToTop";
import AppRoutes from "./app/AppRoutes";
import { useKeyboardNavigation } from "@/lib/hooks/useKeyboardNavigation";
import { usePerformanceMonitoring, WebVitalsTracker } from "@/lib/hooks/usePerformanceMonitoring";

const APP_SHELL_VERSION = '2026-05-03-1';

const RouterInstrumentation = () => {
  usePerformanceMonitoring();
  return null;
};

const App = () => {
  // Enhanced accessibility with keyboard navigation
  useKeyboardNavigation();

  // Service Worker Registration and Version Management
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // ONLY register service worker in production to avoid dev preamble/cache conflicts
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          const previousVersion = window.localStorage.getItem('app_shell_version');
          if (previousVersion !== APP_SHELL_VERSION) {
            registration.update().catch(() => {});
            window.localStorage.setItem('app_shell_version', APP_SHELL_VERSION);
          }
        })
        .catch((error) => {
          console.error('[App] Service worker registration failed:', error);
        });
    } else {
      // In development, ensure any active service worker is removed to prevent cache interference
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
          console.log('[App] Unregistered active Service Worker in development mode to prevent preamble errors.');
        }
      });
    }
  }, []);

  // Removed the temporary useEffect block for role update
  const [showSplash, setShowSplash] = useState(true);
  const [appLoaded, setAppLoaded] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);

  // Redirect hash-based public token URLs to path-based URLs (BrowserRouter uses pathname, not hash)
  useEffect(() => {
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    if (pathname !== "/" || !hash || !hash.startsWith("#/")) return;
    const pathFromHash = hash.slice(1);
    const hashRouteMatch = pathFromHash.match(
      /^\/(contract-ready|ship|deal-details|deal\/brand-response|deal|proposal-sent|feedback|brand-reply|brand\/response)\/[^/]+/
    );
    if (hashRouteMatch) {
      window.location.replace(window.location.origin + pathFromHash);
    }
  }, []);

  // Mark app as loaded (prefetch removed - not needed for SPA routing)
  useEffect(() => {
    if (!appLoaded) {
      setAppLoaded(true);
    }
  }, [appLoaded]);

  // Check if splash should be shown (only on first load)
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) {
      setShowSplash(false);
      setSplashComplete(true);
    }
  }, []);

  // Handle OAuth errors and malformed OAuth URLs (before routing)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorCode = urlParams.get('error_code');
    const errorDescription = urlParams.get('error_description');

    // Check for malformed OAuth callback (tokens in pathname instead of hash)
    const pathname = window.location.pathname;
    const hasOAuthInPathname = pathname.includes('access_token=') || pathname.includes('refresh_token=');

    if (hasOAuthInPathname) {
      console.log('[App] Detected OAuth tokens in pathname, moving to hash...');

      // Extract tokens from pathname
      const tokenPart = pathname.substring(pathname.indexOf('access_token='));
      const newHash = '#' + tokenPart;

      // Clean the URL and set hash
      window.history.replaceState({}, '', '/');
      window.location.hash = newHash;

      return; // Exit early, let SessionContext handle the OAuth flow
    }

    if (error || errorCode || errorDescription) {
      // Clean the URL immediately to prevent routing to error string
      const cleanPath = window.location.pathname;
      const cleanUrl = cleanPath;
      window.history.replaceState({}, '', cleanUrl);

      // Redirect to login page where error will be displayed
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('hasSeenSplash', 'true');
    // Wait for splash to fully fade out before showing app
    setTimeout(() => {
      setSplashComplete(true);
    }, 250); // Slightly longer than splash fade-out duration
  };

  return (
    <ErrorBoundary>
      <GlobalLoadingBar />
      <AppToaster />
      {/* Splash Screen */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Main App - Only show after splash is completely gone */}
      {splashComplete && (
        <div className="min-h-dvh bg-[#020D0A]">
          <RouterInstrumentation />
          <ScrollToTop />
          <NetworkStatusWrapper>
            <FacebookPixelTracker />
            <GoogleAnalyticsTracker /> {/* Add GA4 tracker here */}
            <WebVitalsTracker />
            <TooltipProvider delayDuration={400}>
              <AppRoutes />
            </TooltipProvider>
          </NetworkStatusWrapper>
        </div>
      )}
    </ErrorBoundary>
  );
};

export default App;
