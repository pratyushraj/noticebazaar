"use client";

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  brandName: string;
  brandLogo?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  brandName, 
  brandLogo, 
  size = 'md',
  className 
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Generate Clearbit logo URL as fallback
  const getClearbitLogo = (domain: string) => {
    // Extract domain from brand name or use brand name directly
    const domainName = brandName.toLowerCase().replace(/\s+/g, '');
    return `https://logo.clearbit.com/${domainName}.com`;
  };

  // Get initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const logoUrl = brandLogo || (!imageError ? getClearbitLogo(brandName) : null);

  // Use custom div for logo display instead of Avatar
  if (logoUrl && !imageError) {
    return (
      <div
        className={cn(
          "h-12 w-12 rounded-xl bg-white/5 border border-white/10 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.35)] flex items-center justify-center backdrop-blur-md overflow-hidden",
          size === 'sm' && 'h-8 w-8',
          size === 'lg' && 'h-14 w-14',
          className
        )}
      >
        <img
          src={logoUrl}
          alt={brandName}
          onError={() => setImageError(true)}
          className="h-[60%] w-[60%] object-contain opacity-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] saturate-[0.85]"
        />
      </div>
    );
  }

  // Fallback to Avatar for initials
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className={cn(
        "bg-primary/10 text-primary font-semibold",
        textSizeClasses[size]
      )}>
        {getInitials(brandName)}
      </AvatarFallback>
    </Avatar>
  );
};

export default BrandLogo;

