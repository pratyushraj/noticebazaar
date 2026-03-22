/**
 * Pure formatting functions for contract data
 * Extracted from ContractUploadFlow.tsx for testability
 */

import type { RiskScoreInfo, RiskLevel, ProgressGradient, ProtectionStatus } from './types';

/**
 * Get risk score information based on score value
 * @param score - Risk score (0-100)
 * @returns RiskScoreInfo with colors and labels
 */
export function getRiskScoreInfo(score: number): RiskScoreInfo {
  if (score >= 80) {
    return {
      color: 'text-red-500',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      label: 'High Risk',
      glowColor: 'shadow-red-500/30'
    };
  } else if (score >= 60) {
    return {
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/30',
      label: 'Moderate Risk',
      glowColor: 'shadow-orange-500/30'
    };
  } else if (score >= 40) {
    return {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
      label: 'Some Concerns',
      glowColor: 'shadow-yellow-500/30'
    };
  } else {
    return {
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      label: 'Low Risk',
      glowColor: 'shadow-green-500/30'
    };
  }
}

/**
 * Get risk verdict label based on overall risk level
 * @param overallRisk - Risk level string
 * @returns Human-readable risk label
 */
export function getRiskVerdictLabel(overallRisk: string): string {
  const labels: Record<string, string> = {
    'high': 'High Risk - Significant concerns detected',
    'medium': 'Medium Risk - Some issues need attention',
    'low': 'Low Risk - Minor or no concerns',
    'critical': 'Critical Risk - Do not sign without legal review',
  };
  return labels[overallRisk?.toLowerCase()] || 'Risk Assessment Pending';
}

/**
 * Sanitize text for WhatsApp message (remove problematic characters)
 * @param text - Text to sanitize
 * @returns Sanitized text safe for WhatsApp
 */
export function sanitizeWhatsAppMessage(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/[^\x20-\x7E\n\r]/g, '') // Remove non-printable ASCII
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Max 2 consecutive newlines
    .trim();
}

/**
 * Format negotiation message with proper structure
 * @param message - Raw negotiation message
 * @returns Formatted message ready for sharing
 */
export function formatNegotiationMessage(message: string): string {
  if (!message) return '';
  
  // Add greeting if not present
  let formatted = message.trim();
  
  // Ensure proper line breaks
  formatted = formatted.replace(/\r\n/g, '\n');
  
  // Add signature if not present
  if (!formatted.includes('Best regards') && !formatted.includes('Thanks')) {
    formatted += '\n\nLooking forward to your response.\n\nBest regards';
  }
  
  return formatted;
}

/**
 * Get protection status based on progress percentage
 * @param progress - Progress percentage (0-100)
 * @returns ProtectionStatus with status info
 */
export function getProtectionStatus(progress: number): ProtectionStatus {
  if (progress >= 90) {
    return {
      status: 'Protected',
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
      icon: '✓',
      message: 'Your contract is well-protected'
    };
  } else if (progress >= 70) {
    return {
      status: 'Mostly Protected',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20',
      icon: '⚡',
      message: 'A few minor improvements recommended'
    };
  } else if (progress >= 50) {
    return {
      status: 'Partially Protected',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/20',
      icon: '⚠',
      message: 'Some important clauses need attention'
    };
  } else {
    return {
      status: 'Needs Attention',
      color: 'text-red-500',
      bgColor: 'bg-red-500/20',
      icon: '✕',
      message: 'Significant gaps in protection detected'
    };
  }
}

/**
 * Get progress gradient colors based on progress percentage
 * @param progress - Progress percentage (0-100)
 * @returns ProgressGradient with color values
 */
export function getProgressGradient(progress: number): ProgressGradient {
  if (progress >= 80) {
    return { from: 'from-green-500', to: 'to-emerald-500' };
  } else if (progress >= 60) {
    return { from: 'from-blue-500', to: 'to-cyan-500' };
  } else if (progress >= 40) {
    return { from: 'from-yellow-500', to: 'to-orange-500' };
  } else {
    return { from: 'from-red-500', to: 'to-orange-500' };
  }
}

/**
 * Format a date string for display
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format currency amount for display (Indian Rupees)
 * @param amount - Numeric amount
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0';
  
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[₹,]/g, '')) : amount;
  
  if (isNaN(num)) return '₹0';
  
  // Format with Indian number system (lakhs, crores)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length (default 100)
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength - 3) + '...';
}
