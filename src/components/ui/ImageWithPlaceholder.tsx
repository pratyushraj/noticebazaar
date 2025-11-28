"use client";

import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageWithPlaceholderProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  aspectRatio?: 'square' | 'video' | 'auto' | 'portrait';
  onError?: () => void;
  onLoad?: () => void;
}

/**
 * Image component with loading placeholder and error handling
 * - Shows skeleton while loading
 * - Graceful fallback on error
 * - Supports multiple aspect ratios
 * - iOS 17 design system styling
 */
export const ImageWithPlaceholder: React.FC<ImageWithPlaceholderProps> = ({
  src,
  alt,
  className = '',
  fallback,
  aspectRatio = 'auto',
  onError,
  onLoad,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: '',
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    
    // Try fallback if available and not already using it
    if (fallback && currentSrc !== fallback) {
      setCurrentSrc(fallback);
      setHasError(false);
      setIsLoading(true);
      return;
    }
    
    setHasError(true);
    onError?.();
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[20px] bg-white/5',
        aspectClasses[aspectRatio],
        className
      )}
    >
      {/* Loading Skeleton */}
      {isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full bg-white/10" />
      )}

      {/* Error State */}
      {hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 p-4">
          <ImageIcon className="w-8 h-8 text-white/30 mb-2" />
          <p className="text-xs text-white/40 text-center">Image unavailable</p>
        </div>
      ) : (
        <img
          src={currentSrc}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default ImageWithPlaceholder;

