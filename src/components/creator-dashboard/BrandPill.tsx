"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils/avatar';
import { cn } from '@/lib/utils';

interface BrandPillProps {
  brandName: string;
  logoUrl?: string;
  className?: string;
}

const BrandPill: React.FC<BrandPillProps> = ({ brandName, logoUrl, className }) => {
  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
      "brand-pill-gradient border border-white/10", // Custom gradient and border
      className
    )}>
      <Avatar className="h-5 w-5">
        <AvatarImage src={logoUrl} alt={brandName} />
        <AvatarFallback className="bg-gray-600 text-white text-xs">
          {getInitials(brandName, '')}
        </AvatarFallback>
      </Avatar>
      <span className="text-foreground">{brandName}</span>
    </div>
  );
};

export default BrandPill;