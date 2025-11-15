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

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {logoUrl && !imageError ? (
        <AvatarImage 
          src={logoUrl} 
          alt={brandName}
          onError={() => setImageError(true)}
          className="object-cover"
        />
      ) : null}
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

