"use client";

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Declare fbq globally to satisfy TypeScript
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

const FacebookPixelTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if the fbq function is available (i.e., the script loaded)
    if (window.fbq) {
      console.log('FB Pixel: Tracking PageView for:', location.pathname);
      // Fire the PageView event on every route change
      window.fbq('track', 'PageView');
    }
  }, [location.pathname]);

  return null;
};

export default FacebookPixelTracker;