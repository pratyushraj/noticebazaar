"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {  } from 'lucide-react';
import { BrandDeal } from '@/types';
import BrandLogo from '@/components/creator-contracts/BrandLogo';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface TopBrandsCarouselProps {
  brandDeals: BrandDeal[] | undefined;
}

export const TopBrandsCarousel: React.FC<TopBrandsCarouselProps> = ({ brandDeals }) => {
  const topBrands = useMemo(() => {
    if (!brandDeals) return [];

    const brandMap = new Map<string, { name: string; totalEarnings: number; logo?: string }>();

    brandDeals.forEach(deal => {
      if (deal.status === 'Completed' && deal.payment_received_date) {
        const existing = brandMap.get(deal.brand_name) || { 
          name: deal.brand_name, 
          totalEarnings: 0,
          logo: (deal as any).brand_logo 
        };
        existing.totalEarnings += deal.deal_amount || 0;
        brandMap.set(deal.brand_name, existing);
      }
    });

    return Array.from(brandMap.values())
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 5);
  }, [brandDeals]);

  if (topBrands.length === 0) return null;

  return (
    <div className="bg-secondary/[0.06] backdrop-blur-[40px] border border-border rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Your Top Brands This Year</h3>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-2">
          {topBrands.map((brand, index) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 w-32 bg-card rounded-xl p-3 border border-border hover:border-purple-500/30 transition-all cursor-pointer group"
            >
              <div className="flex flex-col items-center gap-2">
                <BrandLogo
                  brandName={brand.name}
                  brandLogo={brand.logo}
                  size="md"
                  className="w-12 h-12"
                />
                <div className="text-center w-full">
                  <p className="text-xs font-semibold text-foreground truncate">{brand.name}</p>
                  <p className="text-xs text-secondary font-medium mt-1">
                    ₹{brand.totalEarnings.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default TopBrandsCarousel;
