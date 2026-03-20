import { useState, useEffect } from 'react';

export const useKeyboard = () => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Only run on mobile devices
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    if (!isMobile) return;

    const initialHeight = window.innerHeight;
    const viewportInitialHeight = window.visualViewport?.height || window.innerHeight;

    const handleViewportResize = () => {
      if (!window.visualViewport) {
        // Fallback: use window height comparison
        const currentHeight = window.innerHeight;
        const heightDiff = initialHeight - currentHeight;
        // If height decreased by more than 150px, keyboard is likely open
        setIsKeyboardOpen(heightDiff > 150);
        return;
      }

      const viewport = window.visualViewport;
      const currentViewportHeight = viewport.height;

      // Sensitive threshold for keyboard detection
      const threshold1 = viewportInitialHeight * 0.85;
      const threshold2 = viewportInitialHeight - 100;
      const isOpen = currentViewportHeight < Math.min(threshold1, threshold2);

      setIsKeyboardOpen(isOpen);
      
      if (isOpen) {
        setKeyboardHeight(viewportInitialHeight - currentViewportHeight);
      } else {
        setKeyboardHeight(0);
      }
    };

    const handleInputFocus = () => {
      setTimeout(handleViewportResize, 100);
    };

    const handleInputBlur = () => {
      setTimeout(handleViewportResize, 300);
    };

    // Initial check
    handleViewportResize();

    // Listen to visual viewport resize events (most reliable on iOS)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
    }

    // Fallback: window resize
    window.addEventListener('resize', handleViewportResize);

    // Listen to input focus/blur events as additional signals
    const addListeners = () => {
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.addEventListener('focus', handleInputFocus);
        input.addEventListener('blur', handleInputBlur);
      });
    };

    addListeners();
    // Re-check for new inputs periodically or on DOM changes if needed
    const interval = setInterval(addListeners, 2000);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
        window.visualViewport.removeEventListener('scroll', handleViewportResize);
      }
      window.removeEventListener('resize', handleViewportResize);
      
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.removeEventListener('focus', handleInputFocus);
        input.removeEventListener('blur', handleInputBlur);
      });
      clearInterval(interval);
    };
  }, []);

  return { isKeyboardOpen, keyboardHeight };
};
