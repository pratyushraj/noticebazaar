let lockCount = 0;

/**
 * Targets the actual scroll container in the app.
 * On mobile, this is #root. On desktop (>=1024px), it reverts to document.body.
 */
function getScrollContainer(): HTMLElement {
  const root = document.getElementById('root');
  const isMobile = window.innerWidth < 1024;
  return (isMobile && root) ? root : document.body;
}

export function lockBodyScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  lockCount++;
  
  if (lockCount === 1) {
    const container = getScrollContainer();
    const html = document.documentElement;
    
    // Lock the root scroller
    container.style.overflow = 'hidden';
    container.style.touchAction = 'none'; // Prevent touch gestures from leaking
    
    // Also lock documentElement for total safety on some iOS versions
    html.style.overflow = 'hidden';
    
    // If we're on mobile and using #root as scroller, we need to ensure 
    // the scroll position doesn't jump, but #root usually handles this 
    // better than body if height: 100% is set.
  }
}

export function unlockBodyScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  lockCount = Math.max(0, lockCount - 1);
  
  if (lockCount === 0) {
    const container = getScrollContainer();
    const html = document.documentElement;
    
    container.style.overflow = '';
    container.style.touchAction = '';
    html.style.overflow = '';
  }
}
