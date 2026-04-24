

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'metrics' | 'full';
  isDark?: boolean;
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'card',
  isDark = true,
  count = 1,
}) => {
  const shimmerAnimation = {
    backgroundSize: '200% 100%',
    animation: 'shimmer 2s infinite',
  };

  const SkeletonCard = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'p-4 rounded-2xl border',
        isDark
          ? 'bg-card border-border'
          : 'bg-card border-border shadow-sm'
      )}
    >
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div
              className={cn(
                'w-10 h-10 rounded-xl',
                isDark ? 'bg-secondary/50' : 'bg-background'
              )}
              style={shimmerAnimation}
            />
            <div className="flex-1 space-y-2">
              <div
                className={cn(
                  'h-3 rounded-lg w-2/3',
                  isDark ? 'bg-secondary/50' : 'bg-background'
                )}
                style={shimmerAnimation}
              />
              <div
                className={cn(
                  'h-2 rounded-lg w-1/2',
                  isDark ? 'bg-card' : 'bg-background'
                )}
                style={shimmerAnimation}
              />
            </div>
          </div>
          <div
            className={cn(
              'h-6 w-16 rounded-lg',
              isDark ? 'bg-secondary/50' : 'bg-background'
            )}
            style={shimmerAnimation}
          />
        </div>

        {/* Content skeleton */}
        <div className="space-y-3 pt-2">
          <div
            className={cn(
              'h-2 rounded-lg w-3/4',
              isDark ? 'bg-card' : 'bg-background'
            )}
            style={shimmerAnimation}
          />
          <div
            className={cn(
              'h-2 rounded-lg w-1/2',
              isDark ? 'bg-card' : 'bg-background'
            )}
            style={shimmerAnimation}
          />
        </div>

        {/* Button skeleton */}
        <div
          className={cn(
            'h-10 rounded-xl',
            isDark ? 'bg-secondary/50' : 'bg-background'
          )}
          style={shimmerAnimation}
        />
      </div>
    </motion.div>
  );

  const SkeletonMetric = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'p-4 rounded-xl border',
        isDark
          ? 'bg-card border-border'
          : 'bg-card border-border shadow-sm'
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'w-8 h-8 rounded-lg',
              isDark ? 'bg-secondary/50' : 'bg-background'
            )}
            style={shimmerAnimation}
          />
          <div
            className={cn(
              'h-3 w-12 rounded',
              isDark ? 'bg-secondary/50' : 'bg-background'
            )}
            style={shimmerAnimation}
          />
        </div>
        <div
          className={cn(
            'h-2 rounded w-2/3',
            isDark ? 'bg-card' : 'bg-background'
          )}
          style={shimmerAnimation}
        />
        <div
          className={cn(
            'h-6 rounded w-1/2',
            isDark ? 'bg-secondary/50' : 'bg-background'
          )}
          style={shimmerAnimation}
        />
      </div>
    </motion.div>
  );

  // CSS for shimmer animation
  const shimmerStyle = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .shimmer {
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
      );
    }
  `;

  return (
    <>
      <style>{shimmerStyle}</style>
      <div>
        {type === 'metrics' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: count }).map((_, idx) => (
              <SkeletonMetric key={idx} />
            ))}
          </div>
        )}

        {type === 'card' && (
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        )}

        {type === 'list' && (
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  'p-3 rounded-lg border',
                  isDark
                    ? 'bg-card border-border'
                    : 'bg-card border-border'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded',
                      isDark ? 'bg-secondary/50' : 'bg-background'
                    )}
                    style={shimmerAnimation}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className={cn(
                        'h-2 rounded w-1/3',
                        isDark ? 'bg-secondary/50' : 'bg-background'
                      )}
                      style={shimmerAnimation}
                    />
                    <div
                      className={cn(
                        'h-2 rounded w-1/4',
                        isDark ? 'bg-card' : 'bg-background'
                      )}
                      style={shimmerAnimation}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {type === 'full' && (
          <div className="space-y-6">
            {/* Metrics skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <SkeletonMetric key={idx} />
              ))}
            </div>

            {/* Cards skeleton */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SkeletonLoader;
