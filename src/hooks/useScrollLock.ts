import { useEffect } from 'react';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scrollLock';

/**
 * Hook to manage body scroll locking for modals, drawers, and sheets.
 * Handles automatic cleanup on unmount and uses reference counting.
 * 
 * @param lock - Whether to lock the scroll
 */
export function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (lock) {
      lockBodyScroll();
      return () => unlockBodyScroll();
    }
  }, [lock]);
}
