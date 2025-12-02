"use client";

import React from 'react';

interface RiskBadgeProps {
  riskLevel: 'low' | 'medium' | 'high';
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ riskLevel, className = '' }) => {
  const riskConfig = {
    low: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      border: 'border-green-500/30',
      label: 'Low Risk',
    },
    medium: {
      bg: 'bg-orange-500/20',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      label: 'Medium Risk',
    },
    high: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
      label: 'High Risk',
    },
  };

  const config = riskConfig[riskLevel];

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}>
      {config.label}
    </span>
  );
};

