"use client";

import React from 'react';
import { PaymentRiskLevel, getPaymentRiskConfig } from '@/lib/utils/paymentRisk';

interface RiskBadgeProps {
  riskLevel: PaymentRiskLevel;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ riskLevel, className = '' }) => {
  const config = getPaymentRiskConfig(riskLevel);

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bgColor} ${config.color} ${config.borderColor} ${className}`}>
      {config.label}
    </span>
  );
};

