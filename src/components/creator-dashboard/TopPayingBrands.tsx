"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Award, Medal } from 'lucide-react';
import { BrandDeal } from '@/types';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/ui/empty-state';

interface TopPayingBrandsProps {
  brandDeals?: BrandDeal[];
}

const TopPayingBrands: React.FC<TopPayingBrandsProps> = ({ brandDeals = [] }) => {
  const topBrands = React.useMemo(() => {
    // Group deals by brand and sum their amounts
    const brandTotals = brandDeals.reduce((acc, deal) => {
      const brandName = deal.brand_name;
      if (!acc[brandName]) {
        acc[brandName] = {
          name: brandName,
          totalAmount: 0,
          dealCount: 0,
        };
      }
      acc[brandName].totalAmount += deal.deal_amount;
      acc[brandName].dealCount += 1;
      return acc;
    }, {} as Record<string, { name: string; totalAmount: number; dealCount: number }>);

    // Sort by total amount and get top 3
    return Object.values(brandTotals)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 3);
  }, [brandDeals]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Award className="h-5 w-5 text-gray-300" />;
      case 3:
        return <Medal className="h-5 w-5 text-orange-400" />;
      default:
        return null;
    }
  };

  if (topBrands.length === 0) {
    return (
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-yellow-500/10 border border-yellow-500/20">
            <Trophy className="h-5 w-5 text-yellow-400" />
            </div>
            <CardTitle>Top Paying Brands</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Trophy}
            title="No brand data yet"
            description="Complete deals with brands to see your top revenue sources here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="default" interactive>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-yellow-500/10 border border-yellow-500/20">
          <Trophy className="h-5 w-5 text-yellow-400" />
          </div>
          <CardTitle>Top Paying Brands</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {topBrands.map((brand, index) => (
          <motion.div
            key={brand.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-smooth card-interactive"
          >
            <div className="flex-shrink-0">
              {getRankIcon(index + 1)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-semibold text-white truncate">{brand.name}</p>
              <p className="text-small text-white/60">
                {brand.dealCount} deal{brand.dealCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-white number-large">₹{brand.totalAmount.toLocaleString('en-IN')}</p>
              <p className="text-small text-white/40">total</p>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TopPayingBrands;

