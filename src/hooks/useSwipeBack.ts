import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export const useSwipeBack = (enabled: boolean = true) => {
  const navigate = useNavigate();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const minSwipeDistance = 50;

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartX.current || !touchStartY.current) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      // Check if horizontal swipe is greater than vertical (to avoid conflicts with scroll)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        // Swipe from left edge (first 50px)
        if (touchStartX.current < 50 && deltaX > minSwipeDistance) {
          navigate(-1);
        }
      }

      touchStartX.current = 0;
      touchStartY.current = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, navigate]);
};

