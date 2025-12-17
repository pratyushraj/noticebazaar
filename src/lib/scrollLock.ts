let isLocked = false;

export function lockBodyScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined' || isLocked) {
    return;
  }

  // Use overflow locking instead of position: fixed to comply with iOS Safari best practices
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  isLocked = true;
}

export function unlockBodyScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !isLocked) {
    return;
  }

  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';

  isLocked = false;
}


