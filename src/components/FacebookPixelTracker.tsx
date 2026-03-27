"use client";

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Declare fbq globally to satisfy TypeScript
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

const PIXEL_SCRIPT_URL = 'https://connect.facebook.net/en_US/fbevents.js';

const FacebookPixelTracker = () => {
  const location = useLocation();
  const pixelLoaded = useRef(false);

  // Load Meta Pixel only in production when VITE_META_PIXEL_ID is set
  useEffect(() => {
    if (!import.meta.env.PROD || pixelLoaded.current) return;
    const pixelId = import.meta.env.VITE_META_PIXEL_ID;
    if (!pixelId || typeof pixelId !== 'string') return;

    const script = document.createElement('script');
    script.async = true;
    script.src = PIXEL_SCRIPT_URL;
    script.onload = () => {
      try {
        if (typeof window.fbq === 'function') {
          window.fbq('init', pixelId);
          window.fbq('track', 'PageView');
          pixelLoaded.current = true;
        }
      } catch (_) {
        // no-op if ad blocker or init fails
      }
    };
    script.onerror = () => { /* no-op */ };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname]);

  return null;
};

export default FacebookPixelTracker;