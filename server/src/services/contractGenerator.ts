// Contract Generation Service (v2)
// Production-grade, creator-first, brand-safe contract generation

import { callLLM } from './aiContractAnalysis.js';
import { generateSafeContractPdf } from './safeContractGenerator.js';
import {
  buildDealSchemaFromDealData,
  mapDealSchemaToContractVariables,
  generateContractFromTemplate,
  validateRequiredContractFields,
  type DealSchema,
  type StructuredDeliverable,
} from './contractTemplate.js';

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
}

export interface ContractGenerationResponse {
  contractText: string;
  fileBuffer?: Buffer;
  fileName?: string;
  contentType?: string;
  metadata?: {
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

    // PRIMARY METHOD: Generate contract using template (MANDATORY - no AI hallucination)
    // This is the ONLY production path. Template ensures:
    // - No invented addresses, names, or terms
    // - Consistent legal structure
    // - Court-defensible output
    console.log('[ContractGenerator] Generating contract with v2 template (with all fixes applied)...');
    console.log('[ContractGenerator] Currency amount:', dealSchema.deal_amount);
    console.log('[ContractGenerator] Deliverables:', JSON.stringify(dealSchema.deliverables));
    let contractText = generateContractFromTemplate(variables);
    console.log('[ContractGenerator] Contract text generated, length:', contractText.length);
    console.log('[ContractGenerator] Contract preview (first 500 chars):', contractText.substring(0, 500));

    // CRITICAL: Post-process cleanup to remove template artifacts before PDF render
    // This prevents internal template delimiters from leaking into final PDF
    console.log('[ContractGenerator] Starting artifact cleanup...');
    const beforeCleanup = contractText;
    
    // FIRST: Fix currency symbol corruption BEFORE any other processing
    // Replace any corrupted ¹ (U+00B9) with proper ₹ (U+20B9)
    const rupeeSymbol = '\u20B9';
    contractText = contractText
      .replace(/¹/g, rupeeSymbol) // Fix ¹ corruption to ₹
      .replace(/\u00B9/g, rupeeSymbol); // Explicit Unicode fix
    
    // SECOND: Remove .; artifacts (common template delimiter leak) - comprehensive patterns
    contractText = contractText
      // Remove .; artifacts - most aggressive patterns first
      .replace(/\.\s*;\s*/g, '.') // Remove .; with any spacing
      .replace(/;\s*\.\s*/g, '.') // Remove ;. with any spacing
      .replace(/\.;\s*/g, '. ') // Remove .; followed by space
      .replace(/;\s*\./g, '.') // Remove ;. 
      .replace(/;\s*\.\s*/g, '. ') // Remove ;. with spaces
      .replace(/\s*\.\s*;\s*/g, '. ') // Remove .; with spaces around
      .replace(/\.\s*;\s*\./g, '.') // Remove .;. pattern
      .replace(/;\s*\.\s*;/g, '.') // Remove ;.; pattern
      // Remove standalone semicolons and periods that are artifacts
      .replace(/^\s*[.;]\s*/gm, '') // Remove lines starting with . or ;
      .replace(/\s*[.;]\s*$/gm, '') // Remove lines ending with . or ;
      // Remove empty tokens and template separators
      .replace(/\s*\.\s*;\s*/g, '. ') // Final pass for .; with spaces
      .replace(/;\s*\.\s*/g, '. ') // Final pass for ;. with spaces
      // Clean up spacing issues
      .replace(/\s+\./g, '.') // Remove spaces before periods
      .replace(/\.\s*\./g, '.') // Remove double periods
      .replace(/\s+;/g, ' ') // Remove stray semicolons
      .replace(/;\s+/g, ' ') // Remove semicolons with spaces
      // Remove any remaining stray punctuation artifacts
      .replace(/[.;]{2,}/g, '.') // Multiple . or ; become single .
      .replace(/\s*[.;]\s*([A-Z])/g, ' $1') // Clean up before capital letters
      // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .replace(/[ \t]+/g, ' ') // Normalize multiple spaces/tabs
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove triple newlines
      // Clean bullet points
      .replace(/\n\s*•\s*•/g, '\n•') // Remove double bullets
      .replace(/\n\s*•\s*\n/g, '\n') // Remove bullets on empty lines
      .trim();
    
    // THIRD: Final currency symbol validation and fix
    // Ensure ₹ symbol is present in currency amounts
    contractText = contractText.replace(
      /(\d[\d,]*)\s*\(Rupees\s+([^)]+)\s+Only\)/g,
      (match, amount, words) => {
        // If amount doesn't start with ₹, add it
        if (!match.includes(rupeeSymbol) && !match.includes('₹')) {
          return `${rupeeSymbol}${amount} (Rupees ${words} Only)`;
        }
        return match;
      }
    );
    
    // Log cleanup results
    const artifactsRemoved = (beforeCleanup.match(/\.;/g) || []).length;
    const afterArtifacts = (contractText.match(/\.;/g) || []).length;
    console.log('[ContractGenerator] Post-process cleanup completed:', {
      beforeLength: beforeCleanup.length,
      afterLength: contractText.length,
      artifactsBefore: artifactsRemoved,
      artifactsAfter: afterArtifacts,
      currencySymbol: contractText.includes('₹') ? '✅ Present' : '❌ Missing',
      hasDisclaimer: contractText.includes('CreatorArmour is not a party') ? '✅ Present' : '❌ Missing'
    });

    // Validate template output (should always succeed if validation passed)
    if (!contractText || contractText.length < 500) {
      console.error('[ContractGenerator] CRITICAL: Template generation failed. This should never happen after validation.');
      throw new Error('Template generation failed. Please ensure all required fields are provided correctly.');
    }

    // OPTIONAL ENHANCEMENT: If additional terms provided, enhance with AI
    // This is the ONLY acceptable use of AI - for incorporating user-provided additional terms
    // The base contract structure remains template-based (no AI hallucination)
    if (request.additionalTerms && request.additionalTerms.trim().length > 0) {
      console.log('[ContractGenerator] Enhancing contract with additional terms via AI (template structure preserved)...');
      
      const enhancementPrompt = `You are an expert legal contract drafter specializing in influencer-brand agreements under Indian law.

TASK:
Enhance the provided contract template by incorporating the following additional terms while maintaining ALL existing clauses and structure.

CRITICAL RULES:
- Follow Indian Contract Act, 1872
- Default to creator-protective language
- Do NOT modify existing clauses
- Do NOT invent new clauses beyond the additional terms
- Only add or enhance sections as needed
- Use professional legal formatting
- No markdown, no bullet emojis
- Use numbered clauses and clear headings
- Output must be ready for signing

EXISTING CONTRACT:
${contractText}

ADDITIONAL TERMS TO INCORPORATE:
${request.additionalTerms}

OUTPUT:
Return ONLY the enhanced contract text with additional terms properly integrated.
Do not include explanations, notes, or commentary.`;

      try {
        const enhancedText = await callLLM(enhancementPrompt);
        let cleanedText = enhancedText.trim();
        
        // Clean up AI response
        cleanedText = cleanedText.replace(/```[\s\S]*?```/g, '');
        cleanedText = cleanedText.replace(/```/g, '');
        
        // Validate enhancement maintains contract structure
        if (cleanedText && cleanedText.length > contractText.length) {
          // Verify key sections are still present
          const keySections = [
            'CREATOR–BRAND COLLABORATION AGREEMENT',
            'Scope of Work',
            'Compensation & Payment Terms',
            'Intellectual Property Ownership',
            'Dispute Resolution & Jurisdiction'
          ];
          
          const allSectionsPresent = keySections.every(section => 
            cleanedText.includes(section)
          );
          
          if (allSectionsPresent) {
          contractText = cleanedText;
            console.log('[ContractGenerator] Contract enhanced with additional terms (structure verified)');
          } else {
            console.warn('[ContractGenerator] AI enhancement removed critical sections, using template version');
            // Continue with template-based contract
          }
        }
      } catch (enhancementError: any) {
        console.warn('[ContractGenerator] AI enhancement failed, using template:', enhancementError.message);
        // Continue with template-based contract (this is safe - template is complete)
      }
    }

    // ⚠️ FALLBACK REMOVED: AI-only generation is intentionally disabled
    // Template generation should ALWAYS succeed after validation
    // If it doesn't, this indicates a system error that must be fixed, not worked around

    console.log('[ContractGenerator] Contract generated successfully (template-first, v2), length:', contractText.length);

    // Generate PDF from contract text
    const pdfBuffer = await generateSafeContractPdf(contractText, 'generated-from-scratch-v2');

    return {
      contractText,
      fileBuffer: pdfBuffer,
      fileName: `${request.brandName.replace(/[^a-zA-Z0-9]/g, '_')}_${request.creatorName.replace(/[^a-zA-Z0-9]/g, '_')}_Contract_v2_${Date.now()}.pdf`,
      contentType: 'application/pdf',
      // Metadata for future reference
      metadata: {
        contract_version: 'v2',
        jurisdiction_used: variables.jurisdiction_city,
        generated_at: new Date().toISOString(),
        generated_by: 'template-first',
        has_additional_terms: !!(request.additionalTerms && request.additionalTerms.trim().length > 0)
      }
    };
  } catch (error: any) {
    console.error('[ContractGenerator] Failed to generate contract:', error);
    throw new Error(`Failed to generate contract: ${error.message}`);
  }
}

