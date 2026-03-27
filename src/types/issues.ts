/**
 * Issue types and interfaces
 */

export type IssueStatus = 'pending' | 'under_review' | 'resolved';
export type IssueCategory = 
  | 'payment_delay'
  | 'contract_mismatch'
  | 'deliverables_dispute'
  | 'wrong_amount'
  | 'other';

export type AssignedTeam = 'legal' | 'ca' | 'support';

export interface Issue {
  id: string;
  deal_id: string;
  user_id: string;
  category: IssueCategory;
  message: string;
  status: IssueStatus;
  assigned_team?: AssignedTeam | null;
  created_at: string;
  updated_at: string;
}

export interface IssueHistory {
  id: string;
  issue_id: string;
  action: string;
  message?: string | null;
  created_at: string;
}

export interface DealActionLog {
  id: string;
  deal_id: string;
  user_id?: string | null;
  event: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CreateIssueInput {
  deal_id: string;
  category: IssueCategory;
  message: string;
}

export interface UpdateIssueInput {
  status?: IssueStatus;
  assigned_team?: AssignedTeam | null;
  message?: string;
}

export interface CreateIssueHistoryInput {
  issue_id: string;
  action: string;
  message?: string;
}

export interface CreateActionLogInput {
  deal_id: string;
  event: string;
  metadata?: Record<string, any>;
}

