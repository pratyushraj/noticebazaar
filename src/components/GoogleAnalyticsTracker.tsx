"use client";

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = 'G-PYTGVWEEVP';

const GoogleAnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if gtag function is available
    const gtag = (window as any).gtag;
    if (gtag) {
      // Send a page view event for client-side navigation
      gtag('event', 'page_view', {
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