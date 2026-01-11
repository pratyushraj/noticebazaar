// Contract Generation Service (v2)
// Production-grade, creator-first, brand-safe contract generation

import { callLLM } from './aiContractAnalysis.js';
import { generateContractDocx } from './contractDocxGenerator.js';
import {
  buildDealSchemaFromDealData,
  mapDealSchemaToContractVariables,
  validateRequiredContractFields,
  type DealSchema,
  type StructuredDeliverable,
} from './contractTemplate.js';
import { variablesToSchema, type ContractSchema } from './contractSchema.js';

export interface ContractGenerationRequest {
  brandName: string;
  creatorName: string;
  creatorEmail?: string;
  dealAmount: number;
  deliverables: string[] | StructuredDeliverable[]; // Support both formats
  paymentTerms?: string;
  dueDate?: string;
  paymentExpectedDate?: string;
  platform?: string;
  brandEmail?: string;
  brandPhone?: string;
  additionalTerms?: string;
  // New structured fields for v2
  dealSchema?: DealSchema;
  brandAddress?: string;
  creatorAddress?: string;
  usageType?: 'Exclusive' | 'Non-exclusive';
  usagePlatforms?: string[];
  usageDuration?: string;
  paidAdsAllowed?: boolean;
  whitelistingAllowed?: boolean;
  exclusivityEnabled?: boolean;
  exclusivityCategory?: string;
  exclusivityDuration?: string;
  terminationNoticeDays?: number;
  jurisdictionCity?: string;
  // Signature data (optional - for contracts downloaded after signing)
  brandSignature?: {
    signer_name: string;
    signer_email: string;
    signed_at?: string;
    otp_verified_at?: string;
    ip_address?: string;
    user_agent?: string;
  };
  creatorSignature?: {
    signer_name: string;
    signer_email: string;
    signed_at?: string;
    otp_verified_at?: string;
    ip_address?: string;
    user_agent?: string;
  };
}

export interface ContractGenerationResponse {
  contractDocx: Buffer; // DOCX is the primary output
  fileName: string;
  contentType: string;
  metadata: {
    contract_version: string;
    jurisdiction_used: string;
    generated_at: string;
    generated_by: 'template-first' | 'ai-assisted';
    has_additional_terms: boolean;
  };
}

/**
 * Generate a complete brand-safe contract from scratch (v2)
 * 
 * ⚠️ CRITICAL: Template-first architecture is MANDATORY for legal safety
 * 
 * Architecture:
 * 1. PRIMARY: Deterministic template-based generation (no AI hallucination)
 * 2. ENHANCEMENT: AI only for optional additional terms (if provided)
 * 3. FALLBACK: AI with structured prompt (ONLY if template generation fails - should never happen)
 * 
 * DO NOT bypass template-based generation.
 * AI-only generation is intentionally disabled for legal safety and court defensibility.
 * 
 * @param request - Contract generation request with validated fields
 * @returns Contract with PDF buffer and text
 * @throws Error if validation fails or generation cannot proceed
 */
export async function generateContractFromScratch(
  request: ContractGenerationRequest
): Promise<ContractGenerationResponse> {
  try {
    console.log('[ContractGenerator] Generating contract from scratch using v2 template system (template-first architecture)...');

    // CRITICAL: Validate required fields before generation
    const validation = validateRequiredContractFields(
      {
        name: request.brandName,
        address: request.brandAddress,
        email: request.brandEmail,
      },
      {
        name: request.creatorName,
        address: request.creatorAddress,
        email: request.creatorEmail,
      }
    );

    if (!validation.isValid) {
      const errorMessage = `Missing required fields: ${validation.missingFields.join(', ')}. Please complete all required details to generate a valid contract.`;
      console.error('[ContractGenerator] Validation failed:', validation.missingFields);
      // Attach missingFields to error for API to extract
      const error: any = new Error(errorMessage);
      error.missingFields = validation.missingFields;
      throw error;
    }

    // Build deal schema from request
    const dealSchema: DealSchema = request.dealSchema || {
      deal_amount: request.dealAmount,
      deliverables: Array.isArray(request.deliverables) ? request.deliverables : [request.deliverables || 'As per agreement'],
      delivery_deadline: request.dueDate,
      payment: {
        method: 'Bank Transfer',
        timeline: request.paymentTerms || request.paymentExpectedDate
          ? `Within 7 days of content delivery (expected by ${request.paymentExpectedDate || 'agreed date'})`
          : 'Within 7 days of content delivery',
      },
      usage: {
        type: request.usageType || 'Non-exclusive',
        platforms: request.usagePlatforms || (request.platform ? [request.platform] : ['All platforms']),
        duration: request.usageDuration || '6 months',
        paid_ads: request.paidAdsAllowed || false,
        whitelisting: request.whitelistingAllowed || false,
      },
      exclusivity: {
        enabled: request.exclusivityEnabled || false,
        category: request.exclusivityCategory || null,
        duration: request.exclusivityDuration || null,
      },
      termination: {
        notice_days: request.terminationNoticeDays || 7,
      },
      // Jurisdiction will be derived from addresses, not hardcoded
      jurisdiction_city: request.jurisdictionCity,
    };

    // Map to contract variables
    // Note: Validation already passed, so we can safely use these values
    const variables = mapDealSchemaToContractVariables(
      dealSchema,
      {
        name: request.brandName,
        address: request.brandAddress || '',
        email: request.brandEmail || '',
      },
      {
        name: request.creatorName,
        address: request.creatorAddress || '',
        email: request.creatorEmail || '',
      }
    );

    // Validate jurisdiction was derived (should not be empty after validation)
    if (!variables.jurisdiction_city || variables.jurisdiction_city.trim() === '') {
      throw new Error('Jurisdiction could not be determined from party addresses. Please ensure addresses include city and state information.');
    }

    // PRIMARY METHOD: Generate DOCX contract using template engine (MANDATORY - no AI hallucination)
    // This is the ONLY production path. DOCX template ensures:
    // - No invented addresses, names, or terms
    // - Consistent legal structure with proper Word styles
    // - Court-defensible output with lawyer-acceptable formatting
    console.log('[ContractGenerator] Generating DOCX contract with template engine (DOCX-first architecture)...');
    console.log('[ContractGenerator] Currency amount:', dealSchema.deal_amount);
    console.log('[ContractGenerator] Deliverables:', JSON.stringify(dealSchema.deliverables));
    console.log('[ContractGenerator] Variables deal_amount_formatted:', variables.deal_amount_formatted);

    // Convert ContractVariables to ContractSchema (single source of truth)
    const contractSchema = variablesToSchema(
      variables,
      request.additionalTerms,
      {
        contract_version: 'v3',
        generated_at: new Date().toISOString(),
        generated_by: request.additionalTerms ? 'ai-assisted' : 'template-first',
        has_additional_terms: !!(request.additionalTerms && request.additionalTerms.trim().length > 0),
      }
    );
    
    // Add signature data if provided
    if (request.brandSignature) {
      (contractSchema as any).brand_signature = request.brandSignature;
    }
    if (request.creatorSignature) {
      (contractSchema as any).creator_signature = request.creatorSignature;
    }
      
    // Generate DOCX directly from schema (PRIMARY OUTPUT)
    console.log('[ContractGenerator] Generating DOCX from ContractSchema...');
    const contractDocx = await generateContractDocx(contractSchema);
    console.log('[ContractGenerator] DOCX generated successfully, size:', contractDocx.length, 'bytes');

    // Generate filename: Brand_Creator_Agreement_v3.docx
    const brandNameClean = request.brandName.replace(/[^a-zA-Z0-9]/g, '_');
    const creatorNameClean = request.creatorName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${brandNameClean}_${creatorNameClean}_Agreement_v3.docx`;

    return {
      contractDocx, // PRIMARY OUTPUT - DOCX buffer
      fileName,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      metadata: {
        contract_version: 'v3',
        jurisdiction_used: variables.jurisdiction_city,
        generated_at: new Date().toISOString(),
        generated_by: request.additionalTerms ? 'ai-assisted' : 'template-first',
        has_additional_terms: !!(request.additionalTerms && request.additionalTerms.trim().length > 0)
      }
    };
  } catch (error: any) {
    console.error('[ContractGenerator] Failed to generate contract:', error);
    throw new Error(`Failed to generate contract: ${error.message}`);
  }
}

