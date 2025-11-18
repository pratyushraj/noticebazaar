"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Award, Medal } from 'lucide-react';
import { BrandDeal } from '@/types';

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
      <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Top Paying Brands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/60 text-center py-4">No brand data available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Top Paying Brands
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topBrands.map((brand, index) => (
          <div
            key={brand.name}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex-shrink-0">
              {getRankIcon(index + 1)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{brand.name}</p>
              <p className="text-xs text-white/60">
                {brand.dealCount} deal{brand.dealCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">₹{brand.totalAmount.toLocaleString('en-IN')}</p>
              <p className="text-xs text-white/40">total</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TopPayingBrands;

