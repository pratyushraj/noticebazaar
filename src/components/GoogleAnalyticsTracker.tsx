"use client";

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Declare gtag globally to satisfy TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const GA_MEASUREMENT_ID = 'G-PYTGVWEEVP';

const GoogleAnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if gtag function is available
    if (window.gtag) {
      console.log('GA4: Tracking Page View for:', location.pathname + location.search);
      // Send a page view event for client-side navigation
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: location.pathname + location.search,
        send_to: GA_MEASUREMENT_ID,
      });
    }
  }, [location.pathname, location.search]);

  return null;
};

export default GoogleAnalyticsTracker;