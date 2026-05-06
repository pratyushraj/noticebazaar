/**
 * Haptic feedback utilities for mobile devices
 */

// Track whether user has interacted with the page (required for haptics)
let userHasInteracted = false;

// Set up interaction listener on first import
if (typeof window !== 'undefined') {
  const markInteraction = () => {
    userHasInteracted = true;
    // Remove listeners after first interaction
    document.removeEventListener('click', markInteraction);
    document.removeEventListener('touchstart', markInteraction);
    document.removeEventListener('keydown', markInteraction);
  };
  
  document.addEventListener('click', markInteraction, { once: true });
  document.addEventListener('touchstart', markInteraction, { once: true });
  document.addEventListener('keydown', markInteraction, { once: true });
}

/**
 * Trigger haptic feedback (vibration) on supported devices
 * Only works after user has interacted with the page (browser security requirement)
 * @param pattern - Vibration pattern in milliseconds (default: 50ms)
 */
export const triggerHaptic = (pattern: number | number[] = 50): void => {
  // Browser requires user interaction before allowing vibration
  if (!userHasInteracted) {
    return;
  }

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      // Silently fail if vibration is not supported or blocked
      console.debug('Haptic feedback not available:', error);
    }
  }
};

/**
 * Haptic feedback patterns for different actions
 */
export const HapticPatterns = {
  light: 10,
  medium: 50,
  heavy: 100,
  selection: 10,
  double: [50, 50, 50] as number[],
  success: [50, 30, 50] as number[],
  error: [100, 50, 100] as number[],
};

