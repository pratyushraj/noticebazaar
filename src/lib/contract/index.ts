/**
 * Contract utilities - barrel export
 * Re-exports all utility functions for easier imports
 */

// Formatters
export {
  getRiskScoreInfo,
  getRiskVerdictLabel,
  sanitizeWhatsAppMessage,
  formatNegotiationMessage,
  getProtectionStatus,
  getProgressGradient,
  formatDate,
  formatCurrency,
  formatFileSize,
  truncateText,
} from './formatters';

// Validators
export {
  validateCreatorContactInfo,
  validateContractFile,
  validateKeyTerms,
  validateNegotiationRequest,
  validateWhatsAppMessage,
  validateBrandContactInfo,
  isReadyForAnalysis,
  validateAnalysisResults,
} from './validators';

// Status helpers
export * from './status';

// Constants
export * from './constants';

// Types
export type {
  RiskScoreInfo,
  RiskLevel,
  ProgressGradient,
  ProtectionStatus,
  ValidationResult,
  KeyTerms,
  ContractAnalysisResult,
  ContractIssue,
  NegotiationState,
} from './types';
