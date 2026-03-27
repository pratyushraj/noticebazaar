/**
 * Haptic feedback utilities for mobile devices
 */

/**
 * Trigger haptic feedback (vibration) on supported devices
 * @param pattern - Vibration pattern in milliseconds (default: 50ms)
 */
export const triggerHaptic = (pattern: number | number[] = 50): void => {
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
  double: [50, 50, 50] as number[],
  success: [50, 30, 50] as number[],
  error: [100, 50, 100] as number[],
};

