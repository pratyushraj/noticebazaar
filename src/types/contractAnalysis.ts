/**
 * Contract Analysis Result Types
 */

export type RiskLevel = "Low" | "Medium" | "High";

export type IssueCategory = 
  | "Payment Terms" 
  | "Deliverables" 
  | "IP Rights" 
  | "Tax" 
  | "Exclusivity" 
  | "Termination" 
  | "Usage Rights" 
  | "Liability" 
  | "Confidentiality" 
  | "Legal Terms" 
  | "Miscellaneous";

export type ImpactLevel = "Low" | "Medium" | "High";

export interface ContractIssue {
  id: string;
  title: string;
  category: IssueCategory;
  impact: ImpactLevel;
  description: string;
  recommendation: string;
  section?: string; // Auto-generated section number
}

export interface VerifiedItem {
  id: string;
  title: string;
  category: string;
  description: string;
  section?: string;
}

export interface KeyTerms {
  dealValue: string | null;
  duration: string | null;
  deliverables: string | null;
  paymentTerms: string | null;
}

export interface ContractAnalysisResult {
  score: number;
  riskLevel: RiskLevel;
  keyTerms: KeyTerms;
  issues: ContractIssue[];
  verified: VerifiedItem[];
}

