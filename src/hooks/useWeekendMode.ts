import { useEffect } from 'react';

/**
 * Hook to apply weekend mode styling (warmer colors, relaxed vibe)
 */
export const useWeekendMode = () => {
  useEffect(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      document.documentElement.classList.add('weekend-mode');
      return () => {
        document.documentElement.classList.remove('weekend-mode');
      };
    }
  }, []);
};

