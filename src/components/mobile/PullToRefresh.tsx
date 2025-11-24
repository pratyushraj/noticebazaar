"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useMotionValue(0);
  const springY = useSpring(currentY, { stiffness: 300, damping: 30 });
  const pullDistance = useTransform(springY, [0, threshold * 1.5], [0, threshold * 1.5]);
  const opacity = useTransform(pullDistance, [0, threshold], [0, 1]);
  const scale = useTransform(pullDistance, [0, threshold], [0.5, 1]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      const current = e.touches[0].clientY;
      const delta = current - startY.current;
      
      if (delta > 0 && container.scrollTop === 0) {
        e.preventDefault();
        currentY.set(Math.min(delta, threshold * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;
      const distance = currentY.get();
      
      if (distance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        currentY.set(threshold);
        await onRefresh();
        setIsRefreshing(false);
      }
      
      currentY.set(0);
      setIsPulling(false);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, isRefreshing, threshold, onRefresh]);

  return (
    <div ref={containerRef} className="relative overflow-auto h-full">
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-50"
        style={{
          y: useTransform(pullDistance, (d) => d - 60),
          opacity,
        }}
      >
        <motion.div
          style={{ scale }}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center"
        >
          {isRefreshing ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <motion.div
              animate={{ rotate: pullDistance.get() >= threshold ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
      <motion.div
        style={{
          y: pullDistance,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;

