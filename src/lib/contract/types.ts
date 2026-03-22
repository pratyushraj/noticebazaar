/**
 * TypeScript interfaces for contract data
 * Extracted from ContractUploadFlow.tsx for testability
 */

// Risk score information
export interface RiskScoreInfo {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  glowColor: string;
}

// Risk verdict types
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Key term status
export interface KeyTermStatus {
  badge: string;
  color: string;
  bgColor: string;
  label: string;
}

// Issue category information
export interface IssueCategory {
  icon: string;
  label: string;
  emoji: string;
  bgColor: string;
}

// Negotiation strength
export interface NegotiationStrength {
  label: string;
  color: string;
  emoji: string;
}

// Contract issue
export interface ContractIssue {
  id?: string;
  title: string;
  category: string;
  description: string;
  recommendation?: string;
  severity: 'low' | 'medium' | 'high';
  clause?: string;
  impact?: string;
  fix?: string;
  strength?: 'weak' | 'medium' | 'strong';
}

// Protection status
export interface ProtectionStatus {
  status: string;
  color: string;
  bgColor: string;
  icon: string;
  message: string;
}

// Progress gradient
export interface ProgressGradient {
  from: string;
  to: string;
}

// Key terms from contract analysis
export interface KeyTerms {
  dealValue?: string;
  deliverables?: string;
  usageRights?: string;
  exclusivity?: string;
  paymentTerms?: string;
  termination?: string;
  confidentiality?: string;
  intellectualProperty?: string;
  [key: string]: string | undefined;
}

// Analysis results
export interface AnalysisResults {
  riskScore?: number;
  riskLevel?: RiskLevel;
  overallRisk?: string;
  issues?: ContractIssue[];
  keyTerms?: KeyTerms;
  summary?: string;
  recommendations?: string[];
}

// Brand approval status
export type BrandApprovalStatus = 'sent' | 'viewed' | 'negotiating' | 'approved' | 'rejected';

// Creator contact info validation result
export interface ValidationResult {
  isValid: boolean;
  message: string;
}

// Contract file info
export interface ContractFile {
  name: string;
  size: number;
  type: string;
  url?: string;
}
