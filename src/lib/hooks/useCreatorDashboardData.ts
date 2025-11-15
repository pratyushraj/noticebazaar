import { useSupabaseQuery } from './useSupabaseQuery';
import {
  MOCK_CREATOR_KPI_CARDS,
  MOCK_CREATOR_QUICK_ACTIONS,
  MOCK_PENDING_BRAND_PAYMENTS,
  MOCK_ACTIVE_BRAND_DEALS,
  MOCK_PREVIOUS_BRANDS,
  MOCK_TOTAL_INCOME_TRACKED,
  MOCK_CONTRACTS_REQUIRING_REVIEW,
  MOCK_PROTECTION_COMPLIANCE,
  MOCK_TAX_COMPLIANCE_STATUS,
  MOCK_AI_ACTION_CENTER,
  CreatorKpi,
  QuickAction,
  ContractReview,
  AIAction,
} from '@/data/creatorDashboardData';
import { ComplianceDeadline, BrandDeal } from '@/types'; // Import ComplianceDeadline and BrandDeal

interface CreatorDashboardData {
  kpiCards: CreatorKpi[];
  quickActions: QuickAction[];
  pendingBrandPayments: { amount: string; status: string; details: string };
  activeBrandDeals: BrandDeal[];
  previousBrands: string[];
  totalIncomeTracked: string;
  contractsRequiringReview: ContractReview[];
  protectionCompliance: { healthScore: number; categories: { name: string; status: string }[] };
  taxComplianceStatus: { amount: string; deals: string; nextDue: string };
  importantDeadlines: ComplianceDeadline[]; // Use imported type
  aiActionCenter: AIAction[];
}

export const useCreatorDashboardData = (enabled: boolean = true) => {
  return useSupabaseQuery<CreatorDashboardData, Error>(
    ['creatorDashboardData'],
    async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        kpiCards: MOCK_CREATOR_KPI_CARDS,
        quickActions: MOCK_CREATOR_QUICK_ACTIONS,
        pendingBrandPayments: MOCK_PENDING_BRAND_PAYMENTS,
        activeBrandDeals: MOCK_ACTIVE_BRAND_DEALS,
        previousBrands: MOCK_PREVIOUS_BRANDS,
        totalIncomeTracked: MOCK_TOTAL_INCOME_TRACKED,
        contractsRequiringReview: MOCK_CONTRACTS_REQUIRING_REVIEW,
        protectionCompliance: MOCK_PROTECTION_COMPLIANCE,
        taxComplianceStatus: MOCK_TAX_COMPLIANCE_STATUS,
        importantDeadlines: [], // Now fetched via dedicated hook
        aiActionCenter: MOCK_AI_ACTION_CENTER,
      };
    },
    {
      enabled: enabled,
      errorMessage: 'Failed to load creator dashboard data',
    }
  );
};