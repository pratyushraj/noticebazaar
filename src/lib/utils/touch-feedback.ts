/**
 * Touch Feedback Utilities
 * Provides native-like touch interactions (ripple, scale, haptics)
 */

import { HapticPatterns, triggerHaptic } from '@/lib/utils/haptics';

/**
 * Android ripple effect using CSS
 */
export const createRipple = (event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = 'touches' in event 
    ? event.touches[0].clientX - rect.left - size / 2
    : event.clientX - rect.left - size / 2;
  const y = 'touches' in event
    ? event.touches[0].clientY - rect.top - size / 2
    : event.clientY - rect.top - size / 2;

  const ripple = document.createElement('span');
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    transform: scale(0);
    animation: ripple 600ms ease-out;
    pointer-events: none;
    z-index: 1000;
  `;

  // Add ripple animation if not already present
  if (!document.getElementById('ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  button.style.position = 'relative';
  button.style.overflow = 'hidden';
  button.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 600);
};

/**
 * Scale animation on press (0.98 for 80ms)
 */
export const handlePressStart = (element: HTMLElement) => {
  element.style.transition = 'transform 80ms ease-out';
  element.style.transform = 'scale(0.98)';
};

export const handlePressEnd = (element: HTMLElement) => {
  element.style.transition = 'transform 150ms ease-out';
  element.style.transform = 'scale(1)';
};

/**
 * Combined touch feedback handler
 * Applies ripple, scale, and haptic feedback
 */
export const handleTouchFeedback = (
  event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>,
  options?: {
    ripple?: boolean;
    scale?: boolean;
    haptic?: boolean;
    hapticPattern?: HapticPatterns;
  }
) => {
  const {
    ripple = true,
    scale = true,
    haptic = true,
    hapticPattern = HapticPatterns.light,
  } = options || {};

  const element = event.currentTarget;

  // Ripple effect
  if (ripple) {
    createRipple(event);
  }

  // Scale animation
  if (scale) {
    handlePressStart(element);
    const handleEnd = () => {
      handlePressEnd(element);
      element.removeEventListener('mouseup', handleEnd);
      element.removeEventListener('touchend', handleEnd);
      element.removeEventListener('mouseleave', handleEnd);
    };
    element.addEventListener('mouseup', handleEnd);
    element.addEventListener('touchend', handleEnd);
    element.addEventListener('mouseleave', handleEnd);
  }

  // Haptic feedback (Android)
  if (haptic && 'vibrate' in navigator) {
    triggerHaptic(hapticPattern);
  }
};

/**
 * React hook for touch feedback
 */
export const useTouchFeedback = (options?: {
  ripple?: boolean;
  scale?: boolean;
  haptic?: boolean;
  hapticPattern?: HapticPatterns;
}) => {
  return {
    onMouseDown: (e: React.MouseEvent<HTMLElement>) => handleTouchFeedback(e, options),
    onTouchStart: (e: React.TouchEvent<HTMLElement>) => handleTouchFeedback(e, options),
  };
};

