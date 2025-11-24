"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { BrandDeal } from '@/types';
import { cn } from '@/lib/utils';

interface ForexTickerProps {
  brandDeals: BrandDeal[] | undefined;
}

// Mock USD to INR rate (in real app, fetch from API)
const USD_TO_INR = 83.5;
const LAST_MONTH_RATE = 82.5;

export const ForexTicker: React.FC<ForexTickerProps> = ({ brandDeals }) => {
  const [position, setPosition] = useState(0);

  const usdDeals = useMemo(() => {
    if (!brandDeals) return [];
    return brandDeals.filter(deal => {
      const currency = (deal as any).currency || 'INR';
      return currency === 'USD' || currency === 'usd';
    });
  }, [brandDeals]);

  const totalUSD = useMemo(() => {
    return usdDeals.reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);
  }, [usdDeals]);

  const totalINR = totalUSD * USD_TO_INR;
  const lastMonthINR = totalUSD * LAST_MONTH_RATE;
  const difference = totalINR - lastMonthINR;
  const isPositive = difference > 0;

  useEffect(() => {
    if (totalUSD === 0) return;

    const interval = setInterval(() => {
      setPosition(prev => prev - 1);
    }, 50);

    return () => clearInterval(interval);
  }, [totalUSD]);

  if (totalUSD === 0) return null;

  const text = `$${totalUSD.toLocaleString('en-US')} = ₹${totalINR.toLocaleString('en-IN')} today (${isPositive ? '+' : ''}₹${Math.abs(difference).toLocaleString('en-IN')} vs last month)`;

  return (
    <div className="bg-white/[0.06] backdrop-blur-[40px] border border-white/10 rounded-xl p-2 overflow-hidden relative">
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-green-400 flex-shrink-0" />
        <div className="overflow-hidden flex-1">
          <motion.div
            animate={{ x: position }}
            transition={{ duration: 0, ease: "linear" }}
            className="flex items-center gap-4 whitespace-nowrap"
            style={{ width: 'max-content' }}
          >
            <span className="text-xs text-white/80">{text}</span>
            <span className="text-xs text-white/80">{text}</span>
            <span className="text-xs text-white/80">{text}</span>
          </motion.div>
        </div>
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />
        )}
      </div>
    </div>
  );
};

export default ForexTicker;

