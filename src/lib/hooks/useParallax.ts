"use client";

import { useState, useEffect, useMemo } from 'react';

interface UseParallaxOptions {
  intensity?: number; // Movement intensity (e.g., 0.2 for 20% movement)
  disabledBreakpoint?: number; // Screen width below which to disable (e.g., 768)
}

/**
 * Custom hook to calculate a subtle parallax effect based on scroll position.
 * Disables the effect on small screens and if the user prefers reduced motion.
 */
export const useParallax = (options: UseParallaxOptions = {}) => {
  const { intensity = 0.2, disabledBreakpoint = 768 } = options;
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // 1. Handle scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Handle screen size and reduced motion
  useEffect(() => {
    const checkMediaQueries = () => {
      setIsMobile(window.innerWidth < disabledBreakpoint);
      setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    };

    checkMediaQueries();
    window.addEventListener('resize', checkMediaQueries);
    return () => window.removeEventListener('resize', checkMediaQueries);
  }, [disabledBreakpoint]);

  // 3. Calculate transform value
  const transformY = useMemo(() => {
    if (isMobile || prefersReducedMotion) {
      return 0;
    }
    // Calculate movement: scroll position * intensity
    return Math.round(scrollY * intensity);
  }, [scrollY, intensity, isMobile, prefersReducedMotion]);

  // Return the style object to be applied to the background element
  return {
    transform: `translateY(${transformY}px)`,
    transition: 'transform 0.1s ease-out', // Subtle transition for smoothness
    willChange: 'transform', // Optimization hint
  };
};