import { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
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

type RetryableError = Error & {
  status?: number;
};

// Configure React Query with timeout and retry settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: RetryableError) => {
        // Don't retry on 4xx errors (client errors)
        if (typeof error.status === "number" && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retry up to 2 times for network/server errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

const APP_SHELL_VERSION = '2026-04-25-1';

const RouterInstrumentation = () => {
  usePerformanceMonitoring();
  return null;
};

const App = () => {
  // Enhanced accessibility with keyboard navigation
  useKeyboardNavigation();

  // Local dev safety: if a service worker was previously registered, it can cache `/api/*` and
  // serve stale responses (including 404s), making auth and dashboard data look broken.
  // On localhost, proactively unregister SW and clear our Workbox caches.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const previousVersion = window.localStorage.getItem('app_shell_version');
    if (previousVersion === APP_SHELL_VERSION) return;

    navigator.serviceWorker.getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => { /* ignore */ });

    // Best-effort cache cleanup. This is safe to do once per app-shell version
    // because stale HTML can pin old chunk URLs and produce MIME errors.
    const c: any = (window as any).caches;
    if (c?.keys && c?.delete) {
      c.keys()
        .then((keys: string[]) => Promise.all(keys.map((k) => c.delete(k))))
        .catch(() => { /* ignore */ });
    }

    window.localStorage.setItem('app_shell_version', APP_SHELL_VERSION);
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
      <QueryClientProvider client={queryClient}>
        <GlobalLoadingBar />
        <TooltipProvider>
          <AppToaster />
          {/* Splash Screen */}
          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

          {/* Main App - Only show after splash is completely gone */}
          {splashComplete && (
            <div className="min-h-screen">
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <RouterInstrumentation />
                <ScrollToTop />
                <NetworkStatusWrapper>
                  <FacebookPixelTracker />
                  <GoogleAnalyticsTracker /> {/* Add GA4 tracker here */}
                  <WebVitalsTracker />
                  <AppRoutes />
                </NetworkStatusWrapper>
              </BrowserRouter>
            </div>
          )}
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
