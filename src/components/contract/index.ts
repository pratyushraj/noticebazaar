/**
 * Contract components - barrel export
 * Re-exports all contract-related components for easier imports
 */

// Main components
export { ContractHeader } from './ContractHeader';
export { FileUploadZone } from './FileUploadZone';
export { AnalysisResults } from './AnalysisResults';
export { ContractIssues } from './ContractIssues';
export { AICounterProposal } from './AICounterProposal';

// Type exports
export type { ContractHeaderProps } from './ContractHeader';
export type { FileUploadZoneProps } from './FileUploadZone';
export type { AnalysisResultsProps } from './AnalysisResults';
export type { ContractIssuesProps } from './ContractIssues';

// Default exports for convenience
export { default as ContractHeaderDefault } from './ContractHeader';
export { default as FileUploadZoneDefault } from './FileUploadZone';
export { default as AnalysisResultsDefault } from './AnalysisResults';
export { default as ContractIssuesDefault } from './ContractIssues';
