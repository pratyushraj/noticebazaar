/**
 * Shared helper functions for contract analysis display.
 */

import { DollarSign, FileCode, Ban, AlertCircle, AlertTriangle, LucideIcon } from 'lucide-react';
import type { Severity, ContractIssue, AnalysisResults, ActionType } from '@/lib/types/contract-analysis';

export interface RiskScoreInfo {
  color: string;
  bgColor: string;
  label: string;
  progressColor: string;
  glowColor: string;
  dotColor: string;
}

export function getRiskScoreInfo(score: number): RiskScoreInfo {
  if (score >= 71) {
    return {
      color: 'text-green-400',
      bgColor: 'bg-green-500',
      label: 'Low Legal Risk',
      progressColor: 'from-green-500 to-emerald-500',
      glowColor: 'rgba(16, 185, 129, 0.3)',
      dotColor: '#10b981',
    };
  } else if (score >= 41) {
    return {
      color: 'text-orange-400',
      bgColor: 'bg-orange-500',
      label: 'Moderate Legal Risk',
      progressColor: 'from-orange-500 to-yellow-500',
      glowColor: 'rgba(249, 115, 22, 0.3)',
      dotColor: '#f97316',
    };
  } else {
    return {
      color: 'text-red-400',
      bgColor: 'bg-red-500',
      label: 'High Legal Risk',
      progressColor: 'from-red-500 to-rose-500',
      glowColor: 'rgba(239, 68, 68, 0.3)',
      dotColor: '#ef4444',
    };
  }
}

export function getRiskVerdictLabel(overallRisk: 'low' | 'medium' | 'high' | string): string {
  if (overallRisk === 'high') return 'Needs Attention';
  if (overallRisk === 'medium') return 'Needs Negotiation';
  return 'Safe';
}

export interface KeyTermStatus {
  badge: string;
  color: string;
  label: string;
}

export function getKeyTermStatus(_term: string, value: string | undefined): KeyTermStatus {
  if (!value || value === 'Not specified') {
    return { badge: '⚠', color: 'bg-yellow-500/20 text-yellow-400', label: 'Specs Missing' };
  }
  const vagueTerms = ['tbd', 'to be determined', 'as per', 'negotiable', 'discuss'];
  const isVague = vagueTerms.some(v => value.toLowerCase().includes(v));
  if (isVague) {
    return { badge: '⚠', color: 'bg-yellow-500/20 text-yellow-400', label: 'Needs Attention' };
  }
  return { badge: '✅', color: 'bg-green-500/20 text-green-400', label: 'Clear' };
}

export interface IssueCategory {
  icon: LucideIcon;
  label: string;
  emoji: string;
}

export function getIssueCategory(issue: ContractIssue): IssueCategory {
  const title = issue.title.toLowerCase();
  const category = issue.category?.toLowerCase() || '';

  if (title.includes('payment') || title.includes('fee') || title.includes('compensation') || category.includes('payment')) {
    return { icon: DollarSign, label: 'Payment Issues', emoji: '💰' };
  }
  if (title.includes('intellectual') || title.includes('ip') || title.includes('ownership') || title.includes('rights') || category.includes('ip')) {
    return { icon: FileCode, label: 'Intellectual Property', emoji: '📜' };
  }
  if (title.includes('exclusive') || title.includes('exclusivity') || category.includes('exclusive')) {
    return { icon: Ban, label: 'Exclusivity', emoji: '⛔' };
  }
  if (title.includes('termination') || title.includes('cancel') || category.includes('termination')) {
    return { icon: AlertCircle, label: 'Termination', emoji: '🛑' };
  }
  return { icon: AlertTriangle, label: 'Other Issues', emoji: '⚠️' };
}

export function getImpactIfIgnored(issue: ContractIssue): string {
  const severity = issue.severity;
  const title = issue.title.toLowerCase();

  if (severity === 'high') {
    if (title.includes('payment')) return 'You may face financial penalties or delayed payments';
    if (title.includes('ip') || title.includes('rights')) return 'You may lose ownership of your content';
    if (title.includes('exclusive')) return 'You may be restricted from working with other brands';
    return 'This could lead to significant legal or financial consequences';
  }
  if (severity === 'medium') return 'This may limit your flexibility or create future complications';
  return 'This could become a concern in future negotiations';
}

export function getSuggestedFix(issue: ContractIssue): string {
  const title = issue.title.toLowerCase();
  const category = (issue.category || '').toLowerCase();

  if (title.includes('late fee') || category.includes('late fee')) {
    return 'Ask the brand to define the late fee % and when it applies.';
  }
  if (title.includes('payment') || category.includes('payment')) {
    return 'Ask the brand to clearly write the amount, due date, and payment method.';
  }
  if (title.includes('usage') || title.includes('license') || category.includes('usage')) {
    return 'Limit how long and where the brand can use your content.';
  }
  if (title.includes('termination') || category.includes('termination')) {
    return 'Add a clear exit option with notice period and payment for work done.';
  }
  if (title.includes('exclusiv') || category.includes('exclusiv')) {
    return 'Clarify which competitors you cannot work with and for how long.';
  }
  return 'Ask the brand to add one clear sentence to make this safer for you.';
}

export interface NegotiationStrength {
  label: string;
  color: string;
  emoji: string;
}

export function getNegotiationStrength(issue: ContractIssue): NegotiationStrength {
  if (issue.severity === 'high') {
    return { label: 'Hard to Negotiate', color: 'bg-red-500/30 text-red-300 border-red-500/50', emoji: '🔴' };
  }
  if (issue.severity === 'medium') {
    return { label: 'Moderate', color: 'bg-orange-500/30 text-orange-300 border-orange-500/50', emoji: '🟠' };
  }
  return { label: 'Easy to Negotiate', color: 'bg-green-500/30 text-green-300 border-green-500/50', emoji: '🟢' };
}

export function getTopIssues(issues: ContractIssue[], resolvedIssues: Set<number>): ContractIssue[] {
  const severityOrder = { high: 3, medium: 2, warning: 1, low: 0 };
  return issues
    .filter(issue => !resolvedIssues.has(issue.id))
    .sort((a, b) => (severityOrder[b.severity as keyof typeof severityOrder] || 0) - (severityOrder[a.severity as keyof typeof severityOrder] || 0))
    .slice(0, 2);
}

export function getActionType(analysisResults: AnalysisResults | null): ActionType {
  if (!analysisResults) return 'CLARIFICATION';
  const hasHighOrMediumIssues = analysisResults.issues.some(
    (issue: ContractIssue) => issue.severity === 'high' || issue.severity === 'medium'
  );
  if (hasHighOrMediumIssues) return 'NEGOTIATION';
  return 'CLARIFICATION';
}

export function generateBrandRequests(analysisResults: AnalysisResults | null): string[] {
  if (!analysisResults) return [];
  const requests: string[] = [];

  if (!analysisResults.keyTerms?.dealValue || analysisResults.keyTerms.dealValue === 'Not specified') {
    requests.push('Please specify the exact payment amount and currency.');
  }
  if (!analysisResults.keyTerms?.paymentSchedule || analysisResults.keyTerms.paymentSchedule === 'Not specified') {
    requests.push('Please clarify the payment timeline and milestones.');
  }
  if (!analysisResults.keyTerms?.deliverables || analysisResults.keyTerms.deliverables === 'Not specified') {
    requests.push('Please list the exact deliverables expected.');
  }

  analysisResults.issues.forEach((issue) => {
    if (issue.severity === 'high' || issue.severity === 'medium') {
      const fix = getSuggestedFix(issue);
      if (!requests.includes(fix)) {
        requests.push(fix);
      }
    }
  });

  return requests;
}
