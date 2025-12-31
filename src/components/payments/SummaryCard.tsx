"use client";

import React from 'react';
import { Wallet, TrendingUp } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils/currency';

interface SummaryCardProps {
  thisMonth: number;
  growthPercentage: number;
  pending: number;
  nextPayout: number;
  payoutDate: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  thisMonth,
  growthPercentage,
  pending,
  nextPayout,
  payoutDate,
}) => {
  return (
    <div className="relative bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-purple-600/20 backdrop-blur-xl rounded-[28px] p-6 md:p-8 border border-white/15 shadow-lg shadow-black/10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:rounded-[28px] before:pointer-events-none">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="w-6 h-6 text-purple-300" />
        <span className="text-sm font-medium text-purple-200">This Month</span>
      </div>
      
      {/* Main Amount */}
      <div className="mb-6">
        <div className="text-5xl font-bold mb-2 text-white">{formatIndianCurrency(thisMonth)}</div>
        <div className="flex items-center gap-2 text-sm">
          {growthPercentage > 0 ? (
            <span className="text-green-400 flex items-center gap-1 font-medium">
              <TrendingUp className="w-4 h-4" />
              +{growthPercentage.toFixed(0)}% from last month
            </span>
          ) : growthPercentage < 0 ? (
            <span className="text-red-400 flex items-center gap-1 font-medium">
              <TrendingUp className="w-4 h-4 rotate-180" />
              {growthPercentage.toFixed(0)}% from last month
            </span>
          ) : (
            <span className="text-purple-300 text-sm font-medium">No change from last month</span>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
        <div>
          <div className="text-purple-200 text-xs mb-2 font-medium">Pending</div>
          <div className="text-2xl md:text-3xl font-bold text-white">{formatIndianCurrency(pending)}</div>
        </div>
        <div>
          <div className="text-purple-200 text-xs mb-2 font-medium">Next Payout</div>
          <div className="text-2xl md:text-3xl font-bold text-white mb-1">{formatIndianCurrency(nextPayout)}</div>
          <div className="text-sm text-purple-300 font-medium">{payoutDate}</div>
        </div>
      </div>
    </div>
  );
};

