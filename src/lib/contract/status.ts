/**
 * Status mapping utilities for contract data
 * Extracted from ContractUploadFlow.tsx for testability
 */

import type { KeyTermStatus, IssueCategory, NegotiationStrength, ContractIssue } from './types';

/**
 * Get key term status for display
 * @param term - Key term name
 * @param value - Key term value
 * @returns KeyTermStatus with badge and color info
 */
export function getKeyTermStatus(term: string, value: string | undefined): KeyTermStatus {
  if (!value) {
    return {
      badge: 'Missing',
      color: 'text-red-500',
      bgColor: 'bg-red-500/20',
      label: `${term} not specified`
    };
  }
  
  const lowerValue = value.toLowerCase();
  
  // Check for risky values
  const riskyTerms = ['unlimited', 'perpetual', 'exclusive', 'irrevocable', 'worldwide', 'all media'];
  if (riskyTerms.some(risky => lowerValue.includes(risky))) {
    return {
      badge: 'Risky',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/20',
      label: `Potentially risky ${term.toLowerCase()}`
    };
  }
  
  // Check for fair values
  const fairTerms = ['limited', 'non-exclusive', 'revocable', 'specified', 'defined'];
  if (fairTerms.some(fair => lowerValue.includes(fair))) {
    return {
      badge: 'Fair',
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
      label: `${term} is reasonably defined`
    };
  }
  
  return {
    badge: 'Standard',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    label: `${term} specified`
  };
}

/**
 * Get issue category information
 * @param issue - Contract issue
 * @returns IssueCategory with icon, label, emoji, and background color
 */
export function getIssueCategory(issue: ContractIssue): IssueCategory {
  const category = issue.category?.toLowerCase() || '';
  
  const categoryMap: Record<string, IssueCategory> = {
    'payment': { icon: 'Money', label: 'Payment', emoji: '💰', bgColor: 'bg-yellow-500/20' },
    'intellectual property': { icon: 'Lightbulb', label: 'IP Rights', emoji: '💡', bgColor: 'bg-purple-500/20' },
    'ip': { icon: 'Lightbulb', label: 'IP Rights', emoji: '💡', bgColor: 'bg-purple-500/20' },
    'exclusivity': { icon: 'Lock', label: 'Exclusivity', emoji: '🔒', bgColor: 'bg-red-500/20' },
    'termination': { icon: 'XCircle', label: 'Termination', emoji: '❌', bgColor: 'bg-red-500/20' },
    'confidentiality': { icon: 'Eye', label: 'Confidentiality', emoji: '👁', bgColor: 'bg-blue-500/20' },
    'liability': { icon: 'AlertTriangle', label: 'Liability', emoji: '⚠️', bgColor: 'bg-orange-500/20' },
    'usage rights': { icon: 'Camera', label: 'Usage Rights', emoji: '📷', bgColor: 'bg-cyan-500/20' },
    'usage': { icon: 'Camera', label: 'Usage Rights', emoji: '📷', bgColor: 'bg-cyan-500/20' },
    'deliverables': { icon: 'Package', label: 'Deliverables', emoji: '📦', bgColor: 'bg-indigo-500/20' },
    'deadline': { icon: 'Clock', label: 'Deadlines', emoji: '⏰', bgColor: 'bg-pink-500/20' },
    'term': { icon: 'Calendar', label: 'Term', emoji: '📅', bgColor: 'bg-teal-500/20' },
    'termination': { icon: 'XCircle', label: 'Termination', emoji: '🚪', bgColor: 'bg-red-500/20' },
    'indemnification': { icon: 'Shield', label: 'Indemnification', emoji: '🛡️', bgColor: 'bg-amber-500/20' },
    'warranty': { icon: 'CheckCircle', label: 'Warranty', emoji: '✅', bgColor: 'bg-green-500/20' },
    'dispute': { icon: 'Scale', label: 'Dispute Resolution', emoji: '⚖️', bgColor: 'bg-slate-500/20' },
    'governing law': { icon: 'Globe', label: 'Governing Law', emoji: '🌍', bgColor: 'bg-blue-500/20' },
    'assignment': { icon: 'ArrowRight', label: 'Assignment', emoji: '➡️', bgColor: 'bg-violet-500/20' },
    'moral rights': { icon: 'Heart', label: 'Moral Rights', emoji: '💝', bgColor: 'bg-rose-500/20' },
  };
  
  // Find matching category
  for (const [key, value] of Object.entries(categoryMap)) {
    if (category.includes(key)) {
      return value;
    }
  }
  
  // Default category
  return { icon: 'FileText', label: 'General', emoji: '📄', bgColor: 'bg-gray-500/20' };
}

/**
 * Get impact description if issue is ignored
 * @param issue - Contract issue
 * @returns Impact description string
 */
export function getImpactIfIgnored(issue: ContractIssue): string {
  const category = issue.category?.toLowerCase() || '';
  const severity = issue.severity?.toLowerCase() || 'medium';
  
  const impactMap: Record<string, string> = {
    'payment': 'You may not receive timely or full payment for your work',
    'intellectual property': 'You could lose ownership or control over your creative work',
    'exclusivity': 'You may be restricted from working with other brands or clients',
    'termination': 'The contract may be terminated unfairly without proper notice',
    'confidentiality': 'Your private information may be exposed or misused',
    'liability': 'You could be held responsible for damages beyond your control',
    'usage rights': 'Your content may be used in ways you did not agree to',
    'deliverables': 'Scope creep or unclear expectations could lead to disputes',
    'deadline': 'Unrealistic deadlines may lead to breach of contract',
    'indemnification': 'You may be liable for third-party claims',
  };
  
  let impact = impactMap[category] || 'This issue could lead to unfavorable contract terms';
  
  // Add severity context
  if (severity === 'high') {
    impact += '. This is a critical issue that should be addressed before signing.';
  } else if (severity === 'medium') {
    impact += '. Consider negotiating this term.';
  }
  
  return impact;
}

/**
 * Get suggested fix for an issue
 * @param issue - Contract issue
 * @returns Suggested fix string
 */
export function getSuggestedFix(issue: ContractIssue): string {
  // If issue has a recommendation, use it
  if (issue.recommendation) {
    return issue.recommendation;
  }
  
  const category = issue.category?.toLowerCase() || '';
  
  const fixMap: Record<string, string> = {
    'payment': 'Request clear payment terms including amount, due dates, and late payment penalties',
    'intellectual property': 'Limit the license to specific uses and retain ownership of your work',
    'exclusivity': 'Narrow the scope of exclusivity or add a time limit',
    'termination': 'Add notice period requirements and specify termination conditions',
    'confidentiality': 'Define what information is confidential and the duration of the obligation',
    'liability': 'Cap liability to a reasonable amount and exclude indirect damages',
    'usage rights': 'Specify exact platforms, duration, and geographic scope of usage',
    'deliverables': 'List specific deliverables with clear acceptance criteria',
    'deadline': 'Negotiate realistic deadlines with extension provisions',
    'indemnification': 'Limit indemnification to your direct actions and add mutual indemnity',
  };
  
  return fixMap[category] || 'Review this clause with legal counsel before agreeing';
}

/**
 * Get negotiation strength for an issue
 * @param issue - Contract issue
 * @returns NegotiationStrength with label, color, and emoji
 */
export function getNegotiationStrength(issue: ContractIssue): NegotiationStrength {
  const severity = issue.severity?.toLowerCase() || 'medium';
  const category = issue.category?.toLowerCase() || '';
  
  // High severity issues have stronger negotiation position
  if (severity === 'high') {
    // Some categories are stronger negotiation points
    if (['payment', 'intellectual property', 'exclusivity'].some(c => category.includes(c))) {
      return { label: 'Strong', color: 'text-green-500', emoji: '💪' };
    }
    return { label: 'Moderate', color: 'text-yellow-500', emoji: '⚖️' };
  }
  
  if (severity === 'medium') {
    return { label: 'Moderate', color: 'text-yellow-500', emoji: '⚖️' };
  }
  
  return { label: 'Limited', color: 'text-gray-400', emoji: '📍' };
}

/**
 * Get top issues sorted by severity
 * @param issues - Array of contract issues
 * @param limit - Maximum number of issues to return (default 5)
 * @returns Sorted and filtered issues
 */
export function getTopIssues(issues: ContractIssue[], limit: number = 5): ContractIssue[] {
  if (!issues || !Array.isArray(issues)) return [];
  
  const severityOrder = { high: 0, medium: 1, low: 2 };
  
  return [...issues]
    .filter(issue => issue && issue.severity)
    .sort((a, b) => {
      const orderA = severityOrder[a.severity.toLowerCase() as keyof typeof severityOrder] ?? 3;
      const orderB = severityOrder[b.severity.toLowerCase() as keyof typeof severityOrder] ?? 3;
      return orderA - orderB;
    })
    .slice(0, limit);
}

/**
 * Get brand approval status display information
 * @param status - Brand approval status
 * @returns Status display information
 */
export function getBrandApprovalStatusInfo(status: string): {
  color: string;
  label: string;
  description: string;
  animate?: boolean;
} {
  const statusMap: Record<string, { color: string; label: string; description: string; animate?: boolean }> = {
    'sent': { color: 'yellow', label: 'Sent to Brand', description: 'Waiting for their response', animate: true },
    'viewed': { color: 'blue', label: 'Brand Viewed', description: 'Brand opened your message' },
    'negotiating': { color: 'orange', label: 'Negotiating', description: 'Changes being discussed', animate: true },
    'approved': { color: 'green', label: 'Approved', description: 'Contract finalized' },
    'rejected': { color: 'red', label: 'Rejected', description: 'Brand declined changes' },
  };
  
  return statusMap[status?.toLowerCase()] || { color: 'gray', label: 'Unknown', description: 'Status unknown' };
}
