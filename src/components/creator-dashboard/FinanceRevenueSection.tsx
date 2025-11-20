"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, DollarSign, TrendingUp, Calendar, Users } from 'lucide-react';
import { BrandDeal } from '@/types';
import WeeklyPerformance from './WeeklyPerformance';
import TopPayingBrands from './TopPayingBrands';
import ProjectedEarnings from './ProjectedEarnings';

interface FinanceRevenueSectionProps {
  brandDeals?: BrandDeal[];
  currentEarnings: number;
}

const FinanceRevenueSection: React.FC<FinanceRevenueSectionProps> = ({
  brandDeals = [],
  currentEarnings,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate metrics
  const monthlyRevenue = currentEarnings;
  const weeklyRevenue = Math.round(currentEarnings / 4.33);
  const clientCount = new Set(brandDeals.map(deal => deal.brand_name)).size;

  return (
    <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-white">Finance Summary</CardTitle>
                  <p className="text-xs text-white/50 mt-0.5">Revenue, payments, and financial insights</p>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-white/50" />
              ) : (
                <ChevronDown className="h-5 w-5 text-white/50" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-4">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <p className="text-xs text-white/50 uppercase tracking-wide">Monthly Revenue</p>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">
                  ₹{monthlyRevenue.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <p className="text-xs text-white/50 uppercase tracking-wide">Weekly Revenue</p>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">
                  ₹{weeklyRevenue.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  <p className="text-xs text-white/50 uppercase tracking-wide">Active Clients</p>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">{clientCount}</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-yellow-400" />
                  <p className="text-xs text-white/50 uppercase tracking-wide">Avg Ticket</p>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">
                  ₹{clientCount > 0 ? Math.round(monthlyRevenue / clientCount).toLocaleString('en-IN') : '0'}
                </p>
              </div>
            </div>

            {/* Detailed Components */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <WeeklyPerformance brandDeals={brandDeals} />
              <TopPayingBrands brandDeals={brandDeals} />
              <ProjectedEarnings brandDeals={brandDeals} />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default FinanceRevenueSection;

