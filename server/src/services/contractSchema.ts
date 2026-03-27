// @ts-nocheck
// Contract Schema - Single Source of Truth for Contract Generation
// This JSON structure is used to generate DOCX contracts via template engine

import { ContractVariables } from './contractTemplate.js';

/**
 * ContractSchema - The canonical JSON structure for all contract data
 * This is the single source of truth that gets interpolated into DOCX templates
 */
export interface ContractSchema extends ContractVariables {
  // Additional metadata for template generation
  metadata?: {
    contract_version: string;
    generated_at: string;
    generated_by: 'template-first' | 'ai-assisted';
    has_additional_terms: boolean;
  };
  
  // Additional terms (if any) - appended to contract
  additional_terms?: string;
  
  // Disclaimer text (single, consistent)
  disclaimer: string;
}

/**
 * Default disclaimer text (single source, no duplicates)
 */
export const DEFAULT_DISCLAIMER = `This agreement was generated using the CreatorArmour Contract Scanner based on information provided by the Parties. CreatorArmour is not a party to this agreement and does not provide legal representation. The Parties are advised to independently review this agreement before execution.`;

/**
 * Convert ContractVariables to ContractSchema
 */
export function variablesToSchema(
  variables: ContractVariables,
  additionalTerms?: string,
  metadata?: ContractSchema['metadata']
): ContractSchema {
  return {
    ...variables,
    additional_terms: additionalTerms,
    disclaimer: DEFAULT_DISCLAIMER,
    metadata: metadata || {
      contract_version: 'v3',
      generated_at: new Date().toISOString(),
      generated_by: 'template-first',
      has_additional_terms: !!(additionalTerms && additionalTerms.trim().length > 0),
    },
  };
}

