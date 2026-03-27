import { describe, it, expect } from 'vitest';
import {
  getKeyTermStatus,
  getIssueCategory,
  getImpactIfIgnored,
  getSuggestedFix,
  getNegotiationStrength,
  getTopIssues,
  getBrandApprovalStatusInfo,
} from './status';
import type { ContractIssue } from './types';

describe('getKeyTermStatus', () => {
  it('should return Missing for undefined value', () => {
    const result = getKeyTermStatus('Payment', undefined);
    expect(result.badge).toBe('Missing');
    expect(result.color).toBe('text-red-500');
  });

  it('should return Missing for empty string', () => {
    const result = getKeyTermStatus('Payment', '');
    expect(result.badge).toBe('Missing');
  });

  it('should return Risky for unlimited usage', () => {
    const result = getKeyTermStatus('Usage Rights', 'Unlimited worldwide usage');
    expect(result.badge).toBe('Risky');
    expect(result.color).toBe('text-orange-500');
  });

  it('should return Risky for perpetual', () => {
    const result = getKeyTermStatus('License', 'Perpetual irrevocable license');
    expect(result.badge).toBe('Risky');
  });

  it('should return Risky for exclusive', () => {
    const result = getKeyTermStatus('Exclusivity', 'Exclusive rights');
    expect(result.badge).toBe('Risky');
  });

  it('should return Fair for limited', () => {
    const result = getKeyTermStatus('Usage', 'Limited to social media only');
    expect(result.badge).toBe('Fair');
    expect(result.color).toBe('text-green-500');
  });

  it('should return Fair for non-exclusive', () => {
    const result = getKeyTermStatus('Rights', 'Non-exclusive license');
    expect(result.badge).toBe('Fair');
  });

  it('should return Standard for neutral terms', () => {
    const result = getKeyTermStatus('Payment', 'Net 30 days');
    expect(result.badge).toBe('Standard');
    expect(result.color).toBe('text-blue-500');
  });

  it('should be case-insensitive', () => {
    const result = getKeyTermStatus('Rights', 'UNLIMITED USAGE');
    expect(result.badge).toBe('Risky');
  });
});

describe('getIssueCategory', () => {
  it('should return payment category', () => {
    const issue: ContractIssue = { title: 'Late payment', category: 'payment', description: '', severity: 'high' };
    const result = getIssueCategory(issue);
    expect(result.label).toBe('Payment');
    expect(result.emoji).toBe('💰');
  });

  it('should return IP category for intellectual property', () => {
    const issue: ContractIssue = { title: 'IP issue', category: 'intellectual property', description: '', severity: 'medium' };
    const result = getIssueCategory(issue);
    expect(result.label).toBe('IP Rights');
    expect(result.emoji).toBe('💡');
  });

  it('should return exclusivity category', () => {
    const issue: ContractIssue = { title: 'Exclusivity', category: 'exclusivity', description: '', severity: 'high' };
    const result = getIssueCategory(issue);
    expect(result.label).toBe('Exclusivity');
    expect(result.emoji).toBe('🔒');
  });

  it('should return termination category', () => {
    const issue: ContractIssue = { title: 'Termination', category: 'termination', description: '', severity: 'medium' };
    const result = getIssueCategory(issue);
    expect(result.label).toBe('Termination');
  });

  it('should return liability category', () => {
    const issue: ContractIssue = { title: 'Liability', category: 'liability', description: '', severity: 'high' };
    const result = getIssueCategory(issue);
    expect(result.label).toBe('Liability');
    expect(result.emoji).toBe('⚠️');
  });

  it('should return usage rights category', () => {
    const issue: ContractIssue = { title: 'Usage', category: 'usage rights', description: '', severity: 'low' };
    const result = getIssueCategory(issue);
    expect(result.label).toBe('Usage Rights');
  });

  it('should return default category for unknown', () => {
    const issue: ContractIssue = { title: 'Unknown', category: 'unknown-category', description: '', severity: 'low' };
    const result = getIssueCategory(issue);
    expect(result.label).toBe('General');
    expect(result.emoji).toBe('📄');
  });

  it('should handle empty category', () => {
    const issue: ContractIssue = { title: 'Test', category: '', description: '', severity: 'low' };
    const result = getIssueCategory(issue);
    expect(result.label).toBe('General');
  });
});

describe('getImpactIfIgnored', () => {
  it('should return payment impact', () => {
    const issue: ContractIssue = { title: 'Payment', category: 'payment', description: '', severity: 'high' };
    const result = getImpactIfIgnored(issue);
    expect(result).toContain('payment');
    expect(result).toContain('critical issue');
  });

  it('should return IP impact', () => {
    const issue: ContractIssue = { title: 'IP', category: 'intellectual property', description: '', severity: 'medium' };
    const result = getImpactIfIgnored(issue);
    expect(result).toContain('ownership');
  });

  it('should return exclusivity impact', () => {
    const issue: ContractIssue = { title: 'Exclusivity', category: 'exclusivity', description: '', severity: 'low' };
    const result = getImpactIfIgnored(issue);
    expect(result).toContain('restricted');
  });

  it('should add severity context for high severity', () => {
    const issue: ContractIssue = { title: 'Test', category: 'payment', description: '', severity: 'high' };
    const result = getImpactIfIgnored(issue);
    expect(result).toContain('critical issue');
  });

  it('should add severity context for medium severity', () => {
    const issue: ContractIssue = { title: 'Test', category: 'payment', description: '', severity: 'medium' };
    const result = getImpactIfIgnored(issue);
    expect(result).toContain('Consider negotiating');
  });

  it('should return default impact for unknown category', () => {
    const issue: ContractIssue = { title: 'Test', category: 'unknown', description: '', severity: 'low' };
    const result = getImpactIfIgnored(issue);
    expect(result).toContain('unfavorable contract terms');
  });
});

describe('getSuggestedFix', () => {
  it('should return recommendation if present', () => {
    const issue: ContractIssue = {
      title: 'Test',
      category: 'payment',
      description: '',
      severity: 'high',
      recommendation: 'Request clear payment terms'
    };
    expect(getSuggestedFix(issue)).toBe('Request clear payment terms');
  });

  it('should return payment fix suggestion', () => {
    const issue: ContractIssue = { title: 'Payment', category: 'payment', description: '', severity: 'high' };
    const result = getSuggestedFix(issue);
    expect(result).toContain('payment terms');
  });

  it('should return IP fix suggestion', () => {
    const issue: ContractIssue = { title: 'IP', category: 'intellectual property', description: '', severity: 'high' };
    const result = getSuggestedFix(issue);
    expect(result).toContain('license');
  });

  it('should return exclusivity fix suggestion', () => {
    const issue: ContractIssue = { title: 'Exclusivity', category: 'exclusivity', description: '', severity: 'high' };
    const result = getSuggestedFix(issue);
    expect(result).toContain('exclusivity');
  });

  it('should return usage rights fix suggestion', () => {
    const issue: ContractIssue = { title: 'Usage', category: 'usage rights', description: '', severity: 'medium' };
    const result = getSuggestedFix(issue);
    expect(result).toContain('platforms');
  });

  it('should return default fix for unknown category', () => {
    const issue: ContractIssue = { title: 'Test', category: 'unknown', description: '', severity: 'low' };
    const result = getSuggestedFix(issue);
    expect(result).toContain('legal counsel');
  });
});

describe('getNegotiationStrength', () => {
  it('should return Strong for high severity payment issues', () => {
    const issue: ContractIssue = { title: 'Payment', category: 'payment', description: '', severity: 'high' };
    const result = getNegotiationStrength(issue);
    expect(result.label).toBe('Strong');
    expect(result.color).toBe('text-green-500');
  });

  it('should return Strong for high severity IP issues', () => {
    const issue: ContractIssue = { title: 'IP', category: 'intellectual property', description: '', severity: 'high' };
    const result = getNegotiationStrength(issue);
    expect(result.label).toBe('Strong');
  });

  it('should return Moderate for high severity other issues', () => {
    const issue: ContractIssue = { title: 'Test', category: 'unknown', description: '', severity: 'high' };
    const result = getNegotiationStrength(issue);
    expect(result.label).toBe('Moderate');
    expect(result.color).toBe('text-yellow-500');
  });

  it('should return Moderate for medium severity', () => {
    const issue: ContractIssue = { title: 'Test', category: 'payment', description: '', severity: 'medium' };
    const result = getNegotiationStrength(issue);
    expect(result.label).toBe('Moderate');
  });

  it('should return Limited for low severity', () => {
    const issue: ContractIssue = { title: 'Test', category: 'payment', description: '', severity: 'low' };
    const result = getNegotiationStrength(issue);
    expect(result.label).toBe('Limited');
    expect(result.color).toBe('text-gray-400');
  });
});

describe('getTopIssues', () => {
  it('should return empty array for null input', () => {
    expect(getTopIssues(null as unknown as ContractIssue[])).toEqual([]);
  });

  it('should return empty array for undefined input', () => {
    expect(getTopIssues(undefined as unknown as ContractIssue[])).toEqual([]);
  });

  it('should return empty array for non-array input', () => {
    expect(getTopIssues('not an array' as unknown as ContractIssue[])).toEqual([]);
  });

  it('should sort issues by severity', () => {
    const issues: ContractIssue[] = [
      { title: 'Low', category: 'test', description: '', severity: 'low' },
      { title: 'High', category: 'test', description: '', severity: 'high' },
      { title: 'Medium', category: 'test', description: '', severity: 'medium' },
    ];
    const result = getTopIssues(issues);
    expect(result[0].severity).toBe('high');
    expect(result[1].severity).toBe('medium');
    expect(result[2].severity).toBe('low');
  });

  it('should limit to specified number', () => {
    const issues: ContractIssue[] = [
      { title: '1', category: 'test', description: '', severity: 'high' },
      { title: '2', category: 'test', description: '', severity: 'high' },
      { title: '3', category: 'test', description: '', severity: 'high' },
    ];
    const result = getTopIssues(issues, 2);
    expect(result.length).toBe(2);
  });

  it('should default limit to 5', () => {
    const issues: ContractIssue[] = Array(10).fill(null).map((_, i) => ({
      title: `Issue ${i}`,
      category: 'test',
      description: '',
      severity: 'high' as const
    }));
    const result = getTopIssues(issues);
    expect(result.length).toBe(5);
  });

  it('should filter out invalid issues', () => {
    const issues: ContractIssue[] = [
      { title: 'Valid', category: 'test', description: '', severity: 'high' },
      { title: 'Invalid', category: 'test', description: '', severity: undefined as unknown as 'high' },
    ];
    const result = getTopIssues(issues);
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Valid');
  });
});

describe('getBrandApprovalStatusInfo', () => {
  it('should return sent status', () => {
    const result = getBrandApprovalStatusInfo('sent');
    expect(result.label).toBe('Sent to Brand');
    expect(result.color).toBe('yellow');
    expect(result.animate).toBe(true);
  });

  it('should return viewed status', () => {
    const result = getBrandApprovalStatusInfo('viewed');
    expect(result.label).toBe('Brand Viewed');
    expect(result.color).toBe('blue');
  });

  it('should return negotiating status', () => {
    const result = getBrandApprovalStatusInfo('negotiating');
    expect(result.label).toBe('Negotiating');
    expect(result.animate).toBe(true);
  });

  it('should return approved status', () => {
    const result = getBrandApprovalStatusInfo('approved');
    expect(result.label).toBe('Approved');
    expect(result.color).toBe('green');
  });

  it('should return rejected status', () => {
    const result = getBrandApprovalStatusInfo('rejected');
    expect(result.label).toBe('Rejected');
    expect(result.color).toBe('red');
  });

  it('should return unknown for invalid status', () => {
    const result = getBrandApprovalStatusInfo('invalid');
    expect(result.label).toBe('Unknown');
    expect(result.color).toBe('gray');
  });

  it('should be case-insensitive', () => {
    const result = getBrandApprovalStatusInfo('APPROVED');
    expect(result.label).toBe('Approved');
  });
});
