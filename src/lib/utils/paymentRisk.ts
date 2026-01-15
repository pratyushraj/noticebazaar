/**
 * Payment Risk Level Calculation Utility
 * 
 * Prioritizes payment timing over contract risk score.
 * "High Risk" only appears when payment is overdue.
 */

export type PaymentRiskLevel = 'low' | 'moderate' | 'overdue';

export interface PaymentRiskConfig {
  level: PaymentRiskLevel;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  description: string;
}

/**
 * Calculate payment risk level based on payment timing and contract risk score
 * 
 * Priority order:
 * 1. If overdue -> "overdue"
 * 2. If due today or ≤ 7 days -> "moderate"
 * 3. If contract risk score >= 15 -> "moderate"
 * 4. Otherwise -> "low"
 * 
 * @param expectedDate - Expected payment date
 * @param contractRiskScore - Contract risk score (0-100)
 * @param currentDate - Current date (defaults to now)
 * @returns PaymentRiskLevel
 */
export function calculatePaymentRiskLevel(
  expectedDate: Date | null | undefined,
  contractRiskScore: number = 0,
  currentDate: Date = new Date()
): PaymentRiskLevel {
  // If no expected date, default to low risk
  if (!expectedDate) {
    return contractRiskScore >= 15 ? 'moderate' : 'low';
  }

  // Normalize dates to start of day for accurate comparison
  const expected = new Date(expectedDate);
  expected.setHours(0, 0, 0, 0);
  const current = new Date(currentDate);
  current.setHours(0, 0, 0, 0);

  const diffTime = expected.getTime() - current.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // 1) If payment is overdue (current_date > expected_payment_date)
  if (diffDays < 0) {
    return 'overdue';
  }

  // 2) If payment is due today OR due in ≤ 7 days
  if (diffDays === 0 || diffDays <= 7) {
    return 'moderate';
  }

  // 3) If contract risk score >= 15
  if (contractRiskScore >= 15) {
    return 'moderate';
  }

  // 4) Otherwise -> low risk
  return 'low';
}

/**
 * Get risk configuration for display
 */
export function getPaymentRiskConfig(riskLevel: PaymentRiskLevel): PaymentRiskConfig {
  const configs: Record<PaymentRiskLevel, PaymentRiskConfig> = {
    overdue: {
      level: 'overdue',
      color: 'text-red-400/70',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      label: 'Payment Overdue',
      description: 'Payment has crossed the agreed timeline.',
    },
    moderate: {
      level: 'moderate',
      color: 'text-yellow-400/70',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      label: 'Moderate Delay Risk',
      description: 'Payment is due soon. Monitor closely.',
    },
    low: {
      level: 'low',
      color: 'text-green-400/70',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      label: 'Low Risk',
      description: 'Payment is on track based on contract terms.',
    },
  };

  return configs[riskLevel];
}

/**
 * Get risk level tooltip text
 */
export function getPaymentRiskTooltip(): string {
  return 'Risk level is based on payment timeline and contract terms. It helps you prioritize follow-ups — not predict payment failure.';
}

