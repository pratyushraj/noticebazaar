/**
 * Navigation Gestures Utilities
 * Implements swipe-right to go back, swipe-up to close modals
 */

import { useNavigate } from 'react-router-dom';

interface SwipeGestureOptions {
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  threshold?: number; // Minimum distance in pixels
  velocity?: number; // Minimum velocity in px/ms
}

/**
 * Hook for swipe-right to go back navigation
 */
export const useSwipeBack = (enabled: boolean = true) => {
  const navigate = useNavigate();

  const handleSwipeRight = () => {
    if (enabled && window.history.length > 1) {
      navigate(-1);
    }
  };

  return {
    onSwipeRight: handleSwipeRight,
  };
};

/**
 * Hook for swipe gestures on any element
 */
export const useSwipeGesture = (options: SwipeGestureOptions = {}) => {
  const {
    onSwipeRight,
    onSwipeUp,
    threshold = 50,
    velocity = 0.3,
  } = options;

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX || !touchStartY) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const deltaTime = touchEndTime - touchStartTime;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;

    // Swipe right (go back)
    if (
      deltaX > threshold &&
      Math.abs(deltaY) < Math.abs(deltaX) * 0.5 && // More horizontal than vertical
      velocityX > velocity
    ) {
      onSwipeRight?.();
    }

    // Swipe up (close modal)
    if (
      deltaY < -threshold &&
      Math.abs(deltaX) < Math.abs(deltaY) * 0.5 && // More vertical than horizontal
      velocityY > velocity
    ) {
      onSwipeUp?.();
    }

    // Reset
    touchStartX = 0;
    touchStartY = 0;
    touchStartTime = 0;
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
};

/**
 * Higher-order component to add swipe gestures to any component
 */
export const withSwipeGestures = <P extends object>(
  Component: React.ComponentType<P>,
  options: SwipeGestureOptions = {}
) => {
  return (props: P) => {
    const swipeHandlers = useSwipeGesture(options);
    return <Component {...props} {...swipeHandlers} />;
  };
};

