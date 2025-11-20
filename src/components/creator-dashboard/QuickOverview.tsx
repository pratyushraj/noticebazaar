"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, FileWarning } from 'lucide-react';
import { motion } from 'framer-motion';
import { BrandDeal } from '@/types';

interface QuickOverviewProps {
  monthRevenue: number;
  activeClients: number;
  pendingNotices: number;
  brandDeals?: BrandDeal[];
}

const QuickOverview: React.FC<QuickOverviewProps> = ({
  monthRevenue,
  activeClients,
  pendingNotices,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* Month Revenue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0 }}
      >
        <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-xl hover:border-white/10 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/50 uppercase tracking-wide">Month Revenue</p>
              <p className="text-2xl font-bold text-white tabular-nums">
                ₹{monthRevenue.toLocaleString('en-IN')}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Clients */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-xl hover:border-white/10 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/50 uppercase tracking-wide">Active Clients</p>
              <p className="text-2xl font-bold text-white tabular-nums">{activeClients}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Notices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-xl hover:border-white/10 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <FileWarning className="h-4 w-4 text-yellow-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/50 uppercase tracking-wide">Pending Notices</p>
              <p className="text-2xl font-bold text-white tabular-nums">{pendingNotices}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default QuickOverview;

