"use client";

import React from 'react';
import { XCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { RiskLevel } from '@/types/contractAnalysis';
import { motion } from 'framer-motion';

interface ScoreCardProps {
  score: number;
  riskLevel: RiskLevel;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score, riskLevel }) => {
  // Score color logic
  const getScoreColor = () => {
    if (score > 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Risk tag colors
  const getRiskConfig = () => {
    switch (riskLevel) {
      case 'High':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-400/30',
          icon: XCircle,
          label: 'High Risk',
        };
      case 'Medium':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-400/30',
          icon: AlertTriangle,
          label: 'Medium Risk',
        };
      case 'Low':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-400/30',
          icon: CheckCircle,
          label: 'Low Risk',
        };
    }
  };

  const riskConfig = getRiskConfig();
  const RiskIcon = riskConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative bg-[rgba(255,255,255,0.08)] backdrop-blur-[24px] rounded-[20px] p-6 border border-[rgba(255,255,255,0.15)] shadow-[0_8px_40px_rgba(0,0,0,0.25)]"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-16 h-16 rounded-2xl ${riskConfig.bgColor} flex items-center justify-center border ${riskConfig.borderColor}`}>
            <RiskIcon className={`w-8 h-8 ${riskConfig.color}`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1 text-white">Contract Analyzed</h2>
            <p className={`text-sm ${riskConfig.color} font-medium`}>
              {riskConfig.label}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-bold ${getScoreColor()}`}>{score}</div>
          <div className="text-sm text-white/60">Protection Score</div>
        </div>
      </div>
    </motion.div>
  );
};

