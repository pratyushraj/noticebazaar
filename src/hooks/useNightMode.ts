"use client";

import { useState, useEffect } from 'react';

export const useNightMode = () => {
  const [nightCount, setNightCount] = useState(0);
  const [hasNightOwlBadge, setHasNightOwlBadge] = useState(false);

  useEffect(() => {
    // Check if it's night time (8 PM - 6 AM)
    const checkNightTime = () => {
      const hour = new Date().getHours();
      return hour >= 20 || hour < 6;
    };

    // Load night count from localStorage
    const stored = localStorage.getItem('night_mode_count');
    const storedBadge = localStorage.getItem('night_owl_badge');
    
    if (stored) {
      setNightCount(parseInt(stored, 10));
    }
    if (storedBadge === 'true') {
      setHasNightOwlBadge(true);
    }

    // Increment count if it's night time and we haven't counted today
    if (checkNightTime()) {
      const lastCountDate = localStorage.getItem('last_night_count_date');
      const today = new Date().toDateString();
      
      if (lastCountDate !== today) {
        const newCount = (stored ? parseInt(stored, 10) : 0) + 1;
        setNightCount(newCount);
        localStorage.setItem('night_mode_count', newCount.toString());
        localStorage.setItem('last_night_count_date', today);

        if (newCount >= 10 && !hasNightOwlBadge) {
          setHasNightOwlBadge(true);
          localStorage.setItem('night_owl_badge', 'true');
        }
      }
    }
  }, [hasNightOwlBadge]);

  return { nightCount, hasNightOwlBadge };
};

