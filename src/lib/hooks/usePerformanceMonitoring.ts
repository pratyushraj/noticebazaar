import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '@/lib/utils/analytics';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  const location = useLocation();
  const pageLoadTimeRef = useRef<number>(0);
  const interactionCountRef = useRef<number>(0);

  // Track page load performance
  useEffect(() => {
    const startTime = performance.now();

    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      pageLoadTimeRef.current = loadTime;

      // Track page load performance
      trackEvent('page_load_performance', {
        page: location.pathname,
        load_time: Math.round(loadTime),
        performance_rating: loadTime < 1000 ? 'excellent' :
                           loadTime < 3000 ? 'good' : 'poor'
      });
    };

    // Use requestIdleCallback for better performance
    const idleCallback = window.requestIdleCallback ?
      window.requestIdleCallback(handleLoad, { timeout: 2000 }) :
      setTimeout(handleLoad, 0);

    return () => {
      if (window.requestIdleCallback) {
        window.cancelIdleCallback(idleCallback);
      } else {
        clearTimeout(idleCallback);
      }
    };
  }, [location.pathname]);

  // Track route changes
  useEffect(() => {
    trackEvent('page_view', {
      page: location.pathname,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      device_pixel_ratio: window.devicePixelRatio
    });
  }, [location.pathname]);

  // Track user interactions
  useEffect(() => {
    const handleInteraction = (event: Event) => {
      interactionCountRef.current += 1;

      // Track significant interactions (not every click)
      if (interactionCountRef.current % 10 === 0) {
        trackEvent('user_engagement', {
          interactions: interactionCountRef.current,
          page: location.pathname,
          time_spent: Math.round((performance.now() - pageLoadTimeRef.current) / 1000)
        });
      }
    };

    // Throttled interaction tracking
    let interactionTimeout: NodeJS.Timeout;
    const throttledInteraction = () => {
      clearTimeout(interactionTimeout);
      interactionTimeout = setTimeout(handleInteraction, 100);
    };

    document.addEventListener('click', throttledInteraction);
    document.addEventListener('keydown', throttledInteraction);
    document.addEventListener('scroll', throttledInteraction);

    return () => {
      clearTimeout(interactionTimeout);
      document.removeEventListener('click', throttledInteraction);
      document.removeEventListener('keydown', throttledInteraction);
      document.removeEventListener('scroll', throttledInteraction);
    };
  }, [location.pathname]);

  // Track memory usage (if available)
  useEffect(() => {
    const trackMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        trackEvent('memory_usage', {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
          page: location.pathname
        });
      }
    };

    // Track memory usage only when tab is active and every 60 seconds
    const memoryInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        trackMemoryUsage();
      }
    }, 60000);

    return () => clearInterval(memoryInterval);
  }, [location.pathname]);

  // Track errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack?.substring(0, 500),
        page: location.pathname
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackEvent('unhandled_promise_rejection', {
        reason: String(event.reason),
        page: location.pathname
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [location.pathname]);
};

// Web Vitals tracking component
export const WebVitalsTracker = () => {
  useEffect(() => {
    try {
      onCLS((metric) => {
        trackEvent('web_vitals_cls', {
          value: metric.value,
          rating: metric.rating,
          page: window.location.pathname
        });
      });

      onINP((metric) => {
        trackEvent('web_vitals_inp', {
          value: metric.value,
          rating: metric.rating,
          page: window.location.pathname
        });
      });

      onFCP((metric) => {
        trackEvent('web_vitals_fcp', {
          value: metric.value,
          rating: metric.rating,
          page: window.location.pathname
        });
      });

      onLCP((metric) => {
        trackEvent('web_vitals_lcp', {
          value: metric.value,
          rating: metric.rating,
          page: window.location.pathname
        });
      });

      onTTFB((metric) => {
        trackEvent('web_vitals_ttfb', {
          value: metric.value,
          rating: metric.rating,
          page: window.location.pathname
        });
      });
    } catch (error) {
      console.warn('Web Vitals tracking not available:', error);
    }
  }, []);

  return null; // This component doesn't render anything
};
