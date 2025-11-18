"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BrandDeal } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AILegalRiskMeterProps {
  brandDeals?: BrandDeal[];
}

const AILegalRiskMeter: React.FC<AILegalRiskMeterProps> = ({ brandDeals = [] }) => {
  const riskData = useMemo(() => {
    const now = new Date();
    
    // Count pending contracts
    const pendingContracts = brandDeals.filter(d => 
      d.status === 'Drafting' || (d.status === 'Approved' && !d.payment_received_date)
    ).length;

    // Count contracts near expiry (due within 30 days)
    const nearExpiry = brandDeals.filter(d => {
      const dueDate = new Date(d.due_date || d.payment_expected_date);
      const daysUntil = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntil >= 0 && daysUntil <= 30;
    }).length;

    // Calculate risk score (0-100, lower is better/less risky)
    let riskScore = 50; // Base score
    
    // Add risk for pending contracts
    riskScore += pendingContracts * 5;
    
    // Add risk for near-expiry contracts
    riskScore += nearExpiry * 3;

    // Cap at 100
    riskScore = Math.min(100, riskScore);

    // For demo mode (empty or few deals), show low risk
    if (brandDeals.length <= 6) {
      return {
        score: 52,
        label: 'Low Risk',
        color: 'green',
        tooltip: '2 pending contracts need renewal.',
      };
    }

    const getRiskLabel = (score: number) => {
      if (score <= 30) return { label: 'Very Low', color: 'emerald' };
      if (score <= 50) return { label: 'Low', color: 'green' };
      if (score <= 70) return { label: 'Medium', color: 'yellow' };
      return { label: 'High', color: 'red' };
    };

    const riskConfig = getRiskLabel(riskScore);
    const tooltip = pendingContracts > 0 
      ? `${pendingContracts} pending contract${pendingContracts > 1 ? 's' : ''} need${pendingContracts === 1 ? 's' : ''} renewal.`
      : 'All contracts are in good standing.';

    return {
      score: riskScore,
      label: riskConfig.label,
      color: riskConfig.color,
      tooltip,
    };
  }, [brandDeals]);

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'from-emerald-500/20 to-emerald-600/20',
          border: 'border-emerald-700/40',
          text: 'text-emerald-400',
          meter: 'bg-emerald-500',
        };
      case 'green':
        return {
          bg: 'from-green-500/20 to-green-600/20',
          border: 'border-green-700/40',
          text: 'text-green-400',
          meter: 'bg-green-500',
        };
      case 'yellow':
        return {
          bg: 'from-yellow-500/20 to-yellow-600/20',
          border: 'border-yellow-700/40',
          text: 'text-yellow-400',
          meter: 'bg-yellow-500',
        };
      default:
        return {
          bg: 'from-red-600/20 to-red-800/20',
          border: 'border-white/5',
          text: 'text-red-400',
          meter: 'bg-red-500',
        };
    }
  };

  const colors = getColorClasses(riskData.color);
  const meterWidth = 100 - riskData.score; // Inverse: lower score = better = more filled

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className={cn("bg-gradient-to-br", colors.bg, "border", colors.border, "hover:border-opacity-60 transition-all shadow-inner")}>
        <CardContent className="p-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Legal Risk Meter</span>
                    </div>
                    <span className={cn("text-lg font-bold", colors.text)}>
                      {riskData.score}
                    </span>
                  </div>

                  {/* Risk Meter */}
                  <div className="relative h-2 bg-gray-800/50 rounded-full overflow-hidden mb-2">
                    <div
                      className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-500", colors.meter)}
                      style={{ width: `${meterWidth}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-semibold", colors.text)}>
                      {riskData.label} Risk
                    </span>
                    <AlertTriangle className={cn("h-4 w-4", colors.text)} />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-card text-foreground border-border">
                <p className="text-xs">{riskData.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AILegalRiskMeter;

