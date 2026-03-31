/**
 * Contract analysis types used across the upload flow and results display.
 */

export type RiskLevel = 'low' | 'medium' | 'high';

export type Severity = 'high' | 'medium' | 'low' | 'warning';

export interface ContractIssue {
  id: number;
  severity: Severity;
  category: string;
  title: string;
  description: string;
  clause?: string;
  recommendation: string;
}

export interface ContractVerifiedClause {
  id: number;
  category: string;
  title: string;
  description: string;
  clause?: string;
}

export interface ContractKeyTerms {
  dealValue?: string;
  duration?: string;
  deliverables?: string;
  paymentSchedule?: string;
  exclusivity?: string;
  brandName?: string;
}

export interface AnalysisResults {
  overallRisk: RiskLevel;
  score: number;
  negotiationPowerScore?: number;
  issues: ContractIssue[];
  verified: ContractVerifiedClause[];
  keyTerms: ContractKeyTerms;
  dealType?: 'contract' | 'barter';
}

export type AccordionSection =
  | 'keyTerms'
  | 'protectionStatus'
  | 'issues'
  | 'missingClauses'
  | 'financialBreakdown'
  | 'brandRequests';

export type ActionType = 'NEGOTIATION' | 'CLARIFICATION' | 'SUMMARY';

export type ClauseState = 'default' | 'loading' | 'success';
