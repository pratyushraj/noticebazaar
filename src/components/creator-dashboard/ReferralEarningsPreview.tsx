"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePartnerStats } from '@/lib/hooks/usePartnerProgram';
import { useSession } from '@/contexts/SessionContext';

const ReferralEarningsPreview: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useSession();
  const { data: partnerStats } = usePartnerStats(profile?.id);

  // Demo data if no real data
  const currentMonthEarnings = partnerStats?.current_month_earnings || 2500;
  const lastMonthEarnings = currentMonthEarnings ? currentMonthEarnings - 500 : 2000;
  const growth = lastMonthEarnings > 0 ? ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-white/5 hover:border-purple-600/60 transition-all shadow-inner cursor-pointer hover:shadow-lg"
        onClick={() => navigate('/partner-program')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Referral Earnings</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/partner-program');
              }}
            >
              View
            </Button>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">This Month</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                ₹{currentMonthEarnings.toLocaleString('en-IN')}
              </span>
              {growth > 0 && (
                <div className="flex items-center gap-1 text-emerald-400 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  <span>+₹{Math.abs(currentMonthEarnings - lastMonthEarnings).toLocaleString('en-IN')} from last month</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReferralEarningsPreview;

