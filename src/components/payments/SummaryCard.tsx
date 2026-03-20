"use client";

import React from 'react';
import { formatIndianCurrency } from '@/lib/utils/currency';

interface SummaryCardProps {
  thisMonth: number;
  pending: number;
  paid: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  thisMonth,
  pending,
  paid,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6">
        <div className="text-sm text-white/60 mb-1">This Month Earnings</div>
        <div className="text-2xl md:text-3xl font-bold text-green-400">{formatIndianCurrency(thisMonth)}</div>
      </div>
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6">
        <div className="text-sm text-white/60 mb-1">Pending Amount</div>
        <div className="text-2xl md:text-3xl font-bold text-yellow-400">{formatIndianCurrency(pending)}</div>
      </div>
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6">
        <div className="text-sm text-white/60 mb-1">Paid Amount</div>
        <div className="text-2xl md:text-3xl font-bold text-green-400">{formatIndianCurrency(paid)}</div>
      </div>
    </div>
  );
};

