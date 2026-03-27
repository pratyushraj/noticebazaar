"use client";

import { useRef, useEffect, useState } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // Minimum distance in pixels
  velocity?: number; // Minimum velocity in px/ms
}

/**
 * Hook for detecting swipe gestures
 * - Supports left/right swipes
 * - Configurable threshold and velocity
 * - Works on touch devices
 */
export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  velocity = 0.3,
}: SwipeGestureOptions) => {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      setIsSwiping(true);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) {
        setIsSwiping(false);
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;
      const distance = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Check if horizontal swipe is dominant
      if (distance > absDeltaY && distance > threshold) {
        const velocityX = distance / deltaTime;

        if (velocityX > velocity) {
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        }
      }

      touchStartRef.current = null;
      setIsSwiping(false);
    };

    const element = document.body;
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold, velocity]);

  return { isSwiping };
};

