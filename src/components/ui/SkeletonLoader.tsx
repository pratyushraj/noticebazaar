import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  variant?: 'score' | 'issues' | 'keyTerms';
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ variant = 'score', className = '' }) => {
  const baseAnimation = {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  };

  if (variant === 'score') {
    return (
      <div className={`bg-white/10 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-white/10 shadow-xl ${className}`} style={{ transform: 'translateZ(0)' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Circular Skeleton */}
          <div className="relative w-40 h-40 flex-shrink-0">
            <motion.div
              animate={baseAnimation}
              className="w-40 h-40 rounded-full bg-white/10"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                animate={baseAnimation}
                className="w-16 h-16 rounded-full bg-white/20"
              />
            </div>
          </div>
          
          {/* Text Skeleton */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <motion.div
              animate={baseAnimation}
              className="h-8 w-48 bg-white/10 rounded-lg mx-auto md:mx-0"
            />
            <motion.div
              animate={baseAnimation}
              className="h-6 w-32 bg-white/10 rounded-lg mx-auto md:mx-0"
            />
            <motion.div
              animate={baseAnimation}
              className="h-4 w-40 bg-white/10 rounded-lg mx-auto md:mx-0"
            />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'issues') {
    return (
      <div className={`bg-white/10 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-white/10 shadow-xl ${className}`} style={{ transform: 'translateZ(0)' }}>
        <motion.div
          animate={baseAnimation}
          className="h-8 w-48 bg-white/10 rounded-lg mb-6"
        />
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={baseAnimation}
              className="h-32 bg-white/5 rounded-xl border border-white/10 p-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <motion.div
                    animate={baseAnimation}
                    className="h-6 w-3/4 bg-white/10 rounded"
                  />
                  <motion.div
                    animate={baseAnimation}
                    className="h-6 w-20 bg-white/10 rounded-full"
                  />
                </div>
                <motion.div
                  animate={baseAnimation}
                  className="h-4 w-full bg-white/10 rounded"
                />
                <motion.div
                  animate={baseAnimation}
                  className="h-4 w-2/3 bg-white/10 rounded"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'keyTerms') {
    return (
      <div className={`bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-white/10 shadow-lg ${className}`} style={{ transform: 'translateZ(0)' }}>
        <motion.div
          animate={baseAnimation}
          className="h-8 w-32 bg-white/10 rounded-lg mb-5 pb-4 border-b border-white/5"
        />
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={baseAnimation}
              className="h-20 bg-white/5 rounded-xl border border-white/10 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <motion.div
                    animate={baseAnimation}
                    className="h-4 w-32 bg-white/10 rounded"
                  />
                  <motion.div
                    animate={baseAnimation}
                    className="h-4 w-48 bg-white/10 rounded"
                  />
                </div>
                <motion.div
                  animate={baseAnimation}
                  className="h-6 w-16 bg-white/10 rounded-full"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};


