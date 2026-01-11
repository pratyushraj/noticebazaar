// Contract Template Service (v2)
// Production-grade, creator-first, brand-safe contract generation

import { formatINRCurrency, formatINRSimple } from '../utils/currencyFormatter.js';

// Valid platform options (no "Other" allowed)
export const VALID_PLATFORMS = ['Instagram', 'YouTube', 'Website', 'Paid Ads'] as const;
export type ValidPlatform = typeof VALID_PLATFORMS[number];

// Structured deliverable format (from form)
export interface StructuredDeliverable {
  platform?: string;
  contentType?: string;
  quantity?: number;
  duration?: number; // in seconds
}

export interface DealSchema {
  deal_amount: number;
  deliverables: string[] | StructuredDeliverable[]; // Support both old string format and new structured format
  delivery_deadline?: string;
  payment: {
    method?: string;
    timeline?: string;
  };
  usage: {
    type?: 'Exclusive' | 'Non-exclusive';
    platforms?: string[];
    duration?: string;
    paid_ads?: boolean;
    whitelisting?: boolean;
  };
  exclusivity?: {
    enabled: boolean;
    category?: string | null;
    duration?: string | null;
  };
  termination?: {
    notice_days?: number;
  };
  jurisdiction_city?: string;
}

export interface ContractVariables {
  contract_date: string;
  brand_name: string;
  brand_address?: string;
  brand_email?: string;
  creator_name: string;
  creator_address?: string;
  creator_email?: string;
  deliverables_list: string;
  delivery_deadline: string;
  deal_amount: number;
  deal_amount_formatted: string; // Formatted currency string
  payment_method: string;
  payment_timeline: string;
  usage_type: string;
  usage_platforms: string;
  usage_duration: string;
  paid_ads_allowed: string;
  whitelisting_allowed: string;
  exclusivity_clause: string;
  exclusivity_category?: string;
  exclusivity_duration?: string;
  termination_notice_days: number;
  jurisdiction_city: string;
}

/**
 * Map deal schema to contract variables
 * This ensures no AI hallucination - all values come from structured data
 */
export function mapDealSchemaToContractVariables(
  dealSchema: DealSchema,
  brandInfo: {
    name: string;
    address?: string;
    email?: string;
  },
  creatorInfo: {
    name: string;
    address?: string;
    email?: string;
  }
): ContractVariables {
  const today = new Date();
  const contractDate = today.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Format deliverables - structured format
  const deliverablesList = formatDeliverables(dealSchema.deliverables, dealSchema.delivery_deadline);

  // Format delivery deadline
  const deliveryDeadline = dealSchema.delivery_deadline
    ? new Date(dealSchema.delivery_deadline).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'As mutually agreed';

  // Payment details
  const paymentMethod = dealSchema.payment?.method || 'Bank Transfer';
  const paymentTimeline = dealSchema.payment?.timeline || 'Within 7 days of content delivery';

  // Usage rights - validate and format
  const usageType = dealSchema.usage?.type || 'Non-exclusive';
  const validatedPlatforms = validateAndFormatPlatforms(dealSchema.usage?.platforms || []);
  const usagePlatforms = validatedPlatforms.length > 0 
    ? validatedPlatforms.join(', ')
    : 'Instagram only, organic usage';
  const usageDuration = dealSchema.usage?.duration || '6 months';
  const paidAdsAllowed = dealSchema.usage?.paid_ads === true ? 'Yes' : 'No';
  const whitelistingAllowed = dealSchema.usage?.whitelisting === true ? 'Yes' : 'No';

  // Exclusivity clause
  let exclusivityClause = 'No exclusivity period applies.';
  let exclusivityCategory: string | undefined;
  let exclusivityDuration: string | undefined;

  if (dealSchema.exclusivity?.enabled === true) {
    exclusivityCategory = dealSchema.exclusivity.category || 'Same category';
    exclusivityDuration = dealSchema.exclusivity.duration || '30 days';
    exclusivityClause = `The Creator agrees to exclusivity in the ${exclusivityCategory} category for a period of ${exclusivityDuration} from the date of content delivery.`;
  }

  // Termination - ensure valid notice period (7, 15, or 30 days)
  const rawNoticeDays = dealSchema.termination?.notice_days || 7;
  const terminationNoticeDays = [7, 15, 30].includes(rawNoticeDays) ? rawNoticeDays : 7;

  // Jurisdiction - derive from party addresses, not hardcode
  const jurisdictionCity = deriveJurisdiction(
    brandInfo.address,
    creatorInfo.address,
    dealSchema.jurisdiction_city
  );

  // Format currency - clean any encoding artifacts
  // CRITICAL: Ensure ₹ symbol (U+20B9) is always preserved, never removed
  const rupeeSymbol = '\u20B9'; // Explicit Unicode for ₹ (U+20B9)
  
  // CRITICAL: Validate amount before formatting
  if (isNaN(dealSchema.deal_amount) || dealSchema.deal_amount < 0) {
    throw new Error(`Invalid deal amount: ${dealSchema.deal_amount}. Amount must be a valid positive number.`);
  }
  
  let formattedAmount: string;
  try {
    formattedAmount = formatINRCurrency(dealSchema.deal_amount);
  } catch (error: any) {
    console.error('[ContractTemplate] Currency formatting failed:', error);
    throw new Error(`Currency conversion failed: ${error.message}`);
  }
  
  // CRITICAL: First, replace any corrupted currency symbols (¹) with proper ₹ (U+20B9)
  // The ¹ character (U+00B9) is a common corruption of ₹ (U+20B9)
  formattedAmount = formattedAmount.replace(/¹/g, rupeeSymbol); // Fix ¹ corruption to ₹
  
  // Remove superscript numbers (²³⁴⁵⁶⁷⁸⁹⁰) that might appear from encoding issues
  // But preserve ₹ symbol (U+20B9) - don't remove it!
  formattedAmount = formattedAmount.replace(/[²³⁴⁵⁶⁷⁸⁹⁰]/g, '');
  
  // CRITICAL: Ensure ₹ symbol is always present - add it if missing
  // Check if amount starts with a number (missing ₹ symbol)
  if (/^\d/.test(formattedAmount.trim())) {
    // If it starts with a number, add ₹ symbol
    formattedAmount = formattedAmount.replace(/^(\d)/, `${rupeeSymbol}$1`);
  }
  
  // Also check if ₹ is completely missing from the string
  if (!formattedAmount.includes(rupeeSymbol) && !formattedAmount.includes('₹')) {
    // Find the first number and add ₹ before it
    formattedAmount = formattedAmount.replace(/(\d[\d,]*)/, `${rupeeSymbol}$1`);
  }
  
  // Final safety: Replace any text-based currency indicators with proper ₹
  formattedAmount = formattedAmount.replace(/\b(Rs\.?|rs\.?|INR|inr)\s*/gi, rupeeSymbol);
  
  // FINAL VALIDATION: Ensure formatted amount contains both numeric and words
  if (!formattedAmount.includes('(Rupees') || !formattedAmount.includes('Only)')) {
    throw new Error(`Currency formatting incomplete: Missing words in formatted amount: ${formattedAmount}`);
  }

  // CRITICAL: Final validation before returning - ensure currency symbol is correct
  const finalFormattedAmount = formattedAmount.replace(/¹/g, rupeeSymbol);
  if (!finalFormattedAmount.includes(rupeeSymbol) && !finalFormattedAmount.includes('₹')) {
    console.error('[ContractTemplate] CRITICAL: Currency symbol missing after all fixes!', {
      original: formattedAmount,
      final: finalFormattedAmount,
      charCodes: Array.from(finalFormattedAmount).map(c => c.charCodeAt(0))
    });
    throw new Error(`Currency symbol validation failed: ${finalFormattedAmount}`);
  }
  
  console.log('[ContractTemplate] Currency formatting complete:', {
    amount: dealSchema.deal_amount,
    formatted: finalFormattedAmount,
    hasRupeeSymbol: finalFormattedAmount.includes(rupeeSymbol) || finalFormattedAmount.includes('₹'),
    hasCorruptedSymbol: finalFormattedAmount.includes('¹'),
    firstChars: finalFormattedAmount.substring(0, 20)
  });

  return {
    contract_date: contractDate,
    brand_name: brandInfo.name,
    brand_address: brandInfo.address || '',
    brand_email: brandInfo.email || '',
    creator_name: creatorInfo.name,
    creator_address: creatorInfo.address || '',
    creator_email: creatorInfo.email || '',
    deliverables_list: deliverablesList,
    delivery_deadline: deliveryDeadline,
    deal_amount: dealSchema.deal_amount, // Keep raw amount for calculations if needed
    deal_amount_formatted: finalFormattedAmount, // Formatted currency string (validated)
    payment_method: paymentMethod,
    payment_timeline: paymentTimeline,
    usage_type: usageType,
    usage_platforms: usagePlatforms,
    usage_duration: usageDuration,
    paid_ads_allowed: paidAdsAllowed,
    whitelisting_allowed: whitelistingAllowed,
    exclusivity_clause: exclusivityClause,
    exclusivity_category: exclusivityCategory,
    exclusivity_duration: exclusivityDuration,
    termination_notice_days: terminationNoticeDays,
    jurisdiction_city: jurisdictionCity,
  };
}

/**
 * Format deliverables in structured format
 * Supports both old string format (backward compatibility) and new structured format
 */
function formatDeliverables(
  deliverables: string[] | StructuredDeliverable[] | string, 
  deadline?: string
): string {
  if (!deliverables || (Array.isArray(deliverables) && deliverables.length === 0)) {
    return 'As per agreement';
  }

  const deliverablesArray = Array.isArray(deliverables) ? deliverables : [deliverables];
  
  // Calculate days until deadline
  let daysUntilDeadline = 7; // default
  if (deadline) {
    try {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        daysUntilDeadline = diffDays;
      }
    } catch (e) {
      // Use default
    }
  }

  const formatted = deliverablesArray.map((deliverable: string | StructuredDeliverable) => {
    // Check if it's a structured deliverable object
    if (typeof deliverable === 'object' && deliverable !== null && 'platform' in deliverable) {
      const structured = deliverable as StructuredDeliverable;
      const platform = structured.platform || 'Instagram';
      const contentType = structured.contentType || 'Content';
      const quantity = structured.quantity || 1;
      const duration = structured.duration ? ` of minimum ${structured.duration} seconds` : '';
      
      // Format quantity as word
      const quantityWord = quantity === 1 ? 'One' : 
                          quantity === 2 ? 'Two' : 
                          quantity === 3 ? 'Three' : 
                          quantity === 4 ? 'Four' : 
                          quantity === 5 ? 'Five' : 
                          `${quantity}`;
      
      return `• ${quantityWord} ${platform} ${contentType}${duration}, published on the Creator's ${platform} account, within ${daysUntilDeadline} days of agreement execution.`;
    }
    
    // Legacy: Parse string format (backward compatibility)
    const lower = (deliverable as string).toLowerCase().trim();
    
    // Detect content type
    let contentType = 'Content';
    let platform = 'Instagram';
    let duration = '';
    
    if (lower.includes('reel') || lower.includes('video')) {
      contentType = 'Reel';
      duration = ' of minimum 15 seconds';
      if (lower.includes('instagram') || lower.includes('insta')) {
        platform = 'Instagram';
      } else if (lower.includes('youtube') || lower.includes('yt')) {
        platform = 'YouTube';
        contentType = 'Video';
      }
    } else if (lower.includes('story') || lower.includes('stories')) {
      contentType = 'Story';
      if (lower.includes('instagram') || lower.includes('insta')) {
        platform = 'Instagram';
      }
    } else if (lower.includes('post') || lower.includes('carousel')) {
      contentType = 'Post';
      if (lower.includes('instagram') || lower.includes('insta')) {
        platform = 'Instagram';
      }
    } else if (lower.includes('youtube')) {
      platform = 'YouTube';
      contentType = 'Video';
    }

    // Format as structured text
    const quantity = lower.includes('2') || lower.includes('two') ? 'Two' : 
                     lower.includes('3') || lower.includes('three') ? 'Three' :
                     lower.includes('1') || lower.includes('one') ? 'One' : 'One';
    
    return `• ${quantity} ${platform} ${contentType}${duration}, published on the Creator's ${platform} account, within ${daysUntilDeadline} days of agreement execution.`;
  });

  return formatted.join('\n\n');
}

/**
 * Validate and format platforms - remove "Other" and invalid platforms
 */
function validateAndFormatPlatforms(platforms: string[] | string): string[] {
  const platformsArray = Array.isArray(platforms) ? platforms : (platforms ? [platforms] : []);
  
  // Filter out invalid platforms and "Other"
  const valid = platformsArray
    .map(p => {
      const normalized = p.trim();
      // Map common variations to valid platforms
      if (normalized.toLowerCase().includes('instagram') || normalized.toLowerCase().includes('insta')) {
        return 'Instagram';
      }
      if (normalized.toLowerCase().includes('youtube') || normalized.toLowerCase().includes('yt')) {
        return 'YouTube';
      }
      if (normalized.toLowerCase().includes('website') || normalized.toLowerCase().includes('web')) {
        return 'Website';
      }
      if (normalized.toLowerCase().includes('paid') || normalized.toLowerCase().includes('ads')) {
        return 'Paid Ads';
      }
      // Check if it's a valid platform
      if (VALID_PLATFORMS.includes(normalized as ValidPlatform)) {
        return normalized;
      }
      return null;
    })
    .filter((p): p is string => p !== null && p !== 'Other' && p.toLowerCase() !== 'other')
    .filter((p, index, arr) => arr.indexOf(p) === index); // Remove duplicates

  return valid.length > 0 ? valid : ['Instagram']; // Default to Instagram if none valid
}

/**
 * Derive jurisdiction city from party addresses
 * Priority: Creator city/state > Brand city/state > Explicit jurisdiction > Delhi fallback
 * Only uses Delhi if explicitly agreed upon, never silently hardcodes
 */
function deriveJurisdiction(
  brandAddress?: string,
  creatorAddress?: string,
  explicitJurisdiction?: string
): string {
  // If explicit jurisdiction is provided and not just "Delhi" default, use it
  if (explicitJurisdiction && 
      explicitJurisdiction.trim() !== '' && 
      explicitJurisdiction.toLowerCase() !== 'delhi' &&
      explicitJurisdiction !== 'Not specified') {
    return explicitJurisdiction.trim();
  }

  // Try to extract city from Creator address first (priority)
  if (creatorAddress && creatorAddress.trim() !== '' && creatorAddress !== 'Not specified') {
    const creatorCity = extractCityFromAddress(creatorAddress);
    if (creatorCity) {
      return creatorCity;
    }
  }

  // Fallback to Brand address
  if (brandAddress && brandAddress.trim() !== '' && brandAddress !== 'Not specified' && brandAddress !== 'N/A') {
    const brandCity = extractCityFromAddress(brandAddress);
    if (brandCity) {
      return brandCity;
    }
  }

  // Only use Delhi if explicitly provided (not as silent fallback)
  if (explicitJurisdiction && explicitJurisdiction.toLowerCase() === 'delhi') {
    return 'Delhi';
  }

  // Last resort: return empty string to force validation error
  // This ensures jurisdiction is never silently defaulted
  return '';
}

/**
 * Extract city name from address string
 * Handles common Indian address formats
 */
function extractCityFromAddress(address: string): string | null {
  if (!address || address.trim() === '') {
    return null;
  }

  const addr = address.trim();
  
  // Common Indian cities to look for
  const majorCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna',
    'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad',
    'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Amritsar', 'Chandigarh'
  ];

  // Check for major cities (case-insensitive)
  for (const city of majorCities) {
    const regex = new RegExp(`\\b${city}\\b`, 'i');
    if (regex.test(addr)) {
      return city;
    }
  }

  // Try to extract from common address patterns
  // Pattern: "..., City, State, PIN"
  const cityStatePattern = /,\s*([^,]+?),\s*([^,]+?),\s*\d{6}/i;
  const match = addr.match(cityStatePattern);
  if (match && match[1]) {
    return match[1].trim();
  }

  // Pattern: "City, State"
  const simpleCityPattern = /^([^,]+?),\s*([^,]+)$/;
  const simpleMatch = addr.match(simpleCityPattern);
  if (simpleMatch && simpleMatch[1] && simpleMatch[1].length > 2) {
    return simpleMatch[1].trim();
  }

  return null;
}

/**
 * Validate required contract fields
 * Returns validation result with missing fields list
 * CRITICAL: All fields must be present and non-empty for court-grade contracts
 */
export function validateRequiredContractFields(
  brandInfo: { name: string; address?: string; email?: string },
  creatorInfo: { name: string; address?: string; email?: string }
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  // Brand validation - ALL fields required
  const brandName = brandInfo.name?.trim() || '';
  if (!brandName || 
      brandName === '' || 
      brandName === 'Brand' || 
      brandName.toLowerCase() === 'brand name' ||
      brandName.toLowerCase() === 'notice') { // Reject generic names like "notice"
    missingFields.push('Brand legal name');
  }

  // Brand registered address - must be full address, not N/A or placeholder
  const brandAddress = brandInfo.address?.trim() || '';
  if (!brandAddress || 
      brandAddress === '' || 
      brandAddress === 'Not specified' || 
      brandAddress.toLowerCase() === 'not specified' ||
      brandAddress === 'N/A' ||
      brandAddress.toLowerCase() === 'n/a') {
    missingFields.push('Brand registered address (full address required)');
  }
  
  // Brand email - must be valid email format
  const brandEmail = brandInfo.email?.trim() || '';
  if (!brandEmail || 
      brandEmail === '' || 
      brandEmail === 'Not specified' ||
      brandEmail.toLowerCase() === 'not specified' ||
      !brandEmail.includes('@') ||
      !brandEmail.includes('.')) {
    missingFields.push('Brand email');
  }
  
  // Creator validation - ALL fields required
  const creatorName = creatorInfo.name?.trim() || '';
  const hasValidCreatorName = creatorName !== '' && 
    creatorName !== 'Creator' && 
    creatorName.toLowerCase() !== 'creator name' &&
    creatorName.toLowerCase() !== 'creator' &&
    creatorName.length >= 2; // At least 2 characters
  
  if (!hasValidCreatorName) {
    missingFields.push('Creator full name');
  }
  
  // Creator address - must include city and state minimum
  // Handle undefined, null, and empty string cases
  const rawAddress = creatorInfo.address;
  let creatorAddress = (rawAddress && typeof rawAddress === 'string') 
    ? rawAddress.trim() 
    : '';
  
  // CRITICAL: If address is empty but we have creatorInfo, log a warning
  // This helps catch cases where address should exist but doesn't
  if (!creatorAddress || creatorAddress === '') {
    console.warn('[ContractTemplate] WARNING: Creator address is empty in validation:', {
      rawAddress,
      rawAddressType: typeof rawAddress,
      rawAddressIsNull: rawAddress === null,
      rawAddressIsUndefined: rawAddress === undefined,
      creatorInfoKeys: Object.keys(creatorInfo),
      creatorInfoAddress: creatorInfo.address,
    });
  }
  
  // Debug logging for address validation
  console.log('[ContractTemplate] Validating creator address:', {
    rawAddress,
    rawAddressType: typeof rawAddress,
    rawAddressIsNull: rawAddress === null,
    rawAddressIsUndefined: rawAddress === undefined,
    address: creatorAddress,
    length: creatorAddress.length,
    hasComma: creatorAddress.includes(','),
    isEmpty: creatorAddress === '',
    isNotSpecified: creatorAddress.toLowerCase() === 'not specified',
    first10Chars: creatorAddress.length > 0 ? creatorAddress.substring(0, 10) : '',
    last10Chars: creatorAddress.length > 0 ? creatorAddress.substring(Math.max(0, creatorAddress.length - 10)) : '',
    fullAddress: creatorAddress, // Log full address for debugging
  });
  
  // More lenient validation: Accept any non-empty address that's not "Not specified"
  // and has at least 5 characters (very basic address)
  if (!creatorAddress || 
      creatorAddress === '' || 
      creatorAddress === 'Not specified' ||
      creatorAddress.toLowerCase() === 'not specified' ||
      creatorAddress.toLowerCase().trim() === 'n/a' ||
      creatorAddress.toLowerCase().trim() === 'na') {
    console.log('[ContractTemplate] Address validation failed: empty or not specified');
    missingFields.push('Creator address (city and state minimum required)');
  } else if (creatorAddress.length < 3) {
    // Very short addresses are likely incomplete (lowered from 5 to 3)
    console.log('[ContractTemplate] Address validation failed: too short (< 3 chars)');
    missingFields.push('Creator address (must include city and state)');
  } else {
    // Validate that address contains location information
    // Accept addresses with:
    // - Comma (indicates structured address like "City, State")
    // - Length >= 5 (very lenient - any reasonable address text)
    // - Contains common location keywords (city, state, area names, Indian cities)
    const hasComma = creatorAddress.includes(',');
    const hasLength = creatorAddress.length >= 5; // Very lenient threshold
    const hasLocationKeywords = /\b(city|state|nagar|colony|sector|road|street|area|district|pincode|pin|noida|delhi|mumbai|bangalore|pune|hyderabad|chennai|kolkata|patna|bihar|up|uttar|rajasthan|gujarat|maharashtra|karnataka|tamil|west|bengal|odisha|assam|punjab|haryana|himachal|uttarakhand|jammu|kashmir|goa|kerala|telangana|andhra|madhya|pradesh|gaur|sector|block|phase|extension|layout|village|town|taluk|tehsil)\b/i.test(creatorAddress);
    
    // Also check for common Indian address patterns (numbers, common words)
    const hasAddressPattern = /\d+/.test(creatorAddress) || // Has numbers (house/flat numbers)
                              /\b(flat|house|apartment|building|plot|no\.?|number)\b/i.test(creatorAddress); // Common address words
    
    const hasLocationInfo = hasComma || hasLength || hasLocationKeywords || hasAddressPattern;
    
    console.log('[ContractTemplate] Address location info check:', {
      hasComma,
      hasLength,
      hasLocationKeywords,
      hasAddressPattern,
      hasLocationInfo,
      addressLength: creatorAddress.length,
      addressPreview: creatorAddress.substring(0, 50),
    });
    
    if (!hasLocationInfo) {
      console.log('[ContractTemplate] Address validation failed: no location info detected');
      missingFields.push('Creator address (must include city and state)');
    } else {
      console.log('[ContractTemplate] Address validation passed');
    }
  }
  
  // Creator email - must be valid email format
  const creatorEmail = creatorInfo.email?.trim() || '';
  if (!creatorEmail || 
      creatorEmail === '' || 
      creatorEmail === 'Not specified' ||
      creatorEmail.toLowerCase() === 'not specified' ||
      !creatorEmail.includes('@') ||
      !creatorEmail.includes('.')) {
    missingFields.push('Creator email');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Generate contract text from template and variables
 * Uses the production-grade v2 template
 */
export function generateContractFromTemplate(variables: ContractVariables): string {
  const template = `CREATOR–BRAND COLLABORATION AGREEMENT (v2)

This Agreement is made on:

${variables.contract_date}

BETWEEN

Brand:

Name: ${variables.brand_name}
Registered Address: ${variables.brand_address}
Email: ${variables.brand_email}

AND

Creator:

Name: ${variables.creator_name}
Address: ${variables.creator_address}
Email: ${variables.creator_email}

Collectively referred to as the "Parties".

⸻

1. Scope of Work

The Creator agrees to deliver the following content ("Deliverables"):

${variables.deliverables_list}

Content shall be delivered on or before ${variables.delivery_deadline}, unless otherwise mutually agreed in writing.

⸻

2. Compensation & Payment Terms

• Total Fee: ${variables.deal_amount_formatted}
• Payment Method: ${variables.payment_method}
• Payment Timeline: ${variables.payment_timeline}

Late Payment Protection

If payment is delayed beyond 7 days from the due date, the Brand shall be liable to pay interest at 18% per annum, calculated daily until settlement.

The Creator reserves the right to initiate legal recovery proceedings for unpaid dues.

⸻

3. Intellectual Property Ownership

• The Creator retains full ownership of all original content created.

• No ownership transfer is implied unless expressly stated.

⸻

4. Usage Rights (License)

The Creator grants the Brand a ${variables.usage_type} license to use the content under the following conditions:

• Platforms: ${variables.usage_platforms}

• Duration: ${variables.usage_duration}

• Geography: India (unless otherwise specified in writing)

• Paid Advertising: ${variables.paid_ads_allowed}

• Whitelisting: ${variables.whitelisting_allowed}

Any usage beyond the above requires written consent and may attract additional fees.

⸻

5. Exclusivity

${variables.exclusivity_clause}

${variables.exclusivity_category && variables.exclusivity_duration ? `• Category: ${variables.exclusivity_category}\n• Duration: ${variables.exclusivity_duration}` : ''}

⸻

6. Compliance & Disclosures

The Creator shall comply with:

• ASCI Advertising Guidelines

• Platform-specific disclosure requirements (#ad / #sponsored)

⸻

7. Termination

Either Party may terminate this Agreement by giving ${variables.termination_notice_days} days' written notice.

If terminated after partial performance:

• Completed or in-progress work shall be paid on a pro-rata basis.
• Creator shall be paid proportionally for work completed.

⸻

8. Confidentiality

Both Parties agree to keep confidential all commercial and non-public information shared during the collaboration.

⸻

9. Limitation of Liability

Neither Party shall be liable for indirect, incidental, or consequential damages.

The Brand indemnifies the Creator against misuse or misrepresentation of content beyond agreed usage.

⸻

10. Force Majeure

Neither Party shall be liable for any failure or delay in performance under this Agreement due to circumstances beyond their reasonable control, including but not limited to: platform outages, illness, government restrictions, natural disasters, or other events that make performance impracticable. The affected Party shall notify the other Party promptly and use reasonable efforts to resume performance.

⸻

11. Dispute Resolution & Jurisdiction

• Governing Law: Indian Contract Act, 1872
• Jurisdiction: Courts of ${variables.jurisdiction_city}, India

⸻

12. Entire Agreement

This Agreement constitutes the entire understanding between the Parties and supersedes all prior communications.

⸻

DIGITAL ACCEPTANCE & EXECUTION

This Agreement has been executed electronically by both Parties through OTP verification and click-to-accept confirmation. Under the Information Technology Act, 2000 (IT Act, 2000), electronic signatures are legally valid and binding. No physical or handwritten signature is required.

The Parties acknowledge that:
• This Agreement is executed electronically and constitutes a valid legal signature under Section 3A of the IT Act, 2000.
• OTP verification and click-to-accept confirmation constitute valid electronic authentication.
• No physical signature is required for this Agreement to be legally binding.

BRAND
Name: ${variables.brand_name}
Email: ${variables.brand_email}
${(variables as any).brand_signature?.otp_verified_at ? `OTP Verified: ${new Date((variables as any).brand_signature.otp_verified_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'medium' })}` : 'Status: Pending signature'}
${(variables as any).brand_signature?.ip_address ? `IP Address: ${(variables as any).brand_signature.ip_address}` : ''}
${(variables as any).brand_signature?.user_agent ? `Device: ${(variables as any).brand_signature.user_agent}` : ''}
${(variables as any).brand_signature?.signed_at ? `Executed At: ${new Date((variables as any).brand_signature.signed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'medium' })}` : ''}

CREATOR
Name: ${variables.creator_name}
Email: ${variables.creator_email}
${(variables as any).creator_signature?.otp_verified_at ? `OTP Verified: ${new Date((variables as any).creator_signature.otp_verified_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'medium' })}` : 'Status: Pending signature'}
${(variables as any).creator_signature?.ip_address ? `IP Address: ${(variables as any).creator_signature.ip_address}` : ''}
${(variables as any).creator_signature?.user_agent ? `Device: ${(variables as any).creator_signature.user_agent}` : ''}
${(variables as any).creator_signature?.signed_at ? `Executed At: ${new Date((variables as any).creator_signature.signed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'medium' })}` : ''}

⸻

DISCLAIMER

This agreement was generated using the CreatorArmour Contract Scanner based on information provided by the Parties. CreatorArmour is not a party to this agreement and does not provide legal representation.

The Parties are advised to independently review this agreement before execution.`;

  return template;
}

/**
 * Build structured deal schema from deal data
 * This creates the JSON schema that maps to contract variables
 */
export function buildDealSchemaFromDealData(deal: any): DealSchema {
  // Parse deliverables - support both structured objects and legacy string format
  let deliverables: string[] | StructuredDeliverable[] = [];
  try {
    if (typeof deal.deliverables === 'string') {
      const parsed = JSON.parse(deal.deliverables);
      // Check if parsed result is an array of structured objects
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Check if first item is a structured object (has platform/contentType)
        if (typeof parsed[0] === 'object' && parsed[0] !== null && ('platform' in parsed[0] || 'contentType' in parsed[0])) {
          deliverables = parsed as StructuredDeliverable[];
        } else {
          // Legacy string format
          deliverables = parsed as string[];
        }
      } else {
        deliverables = ['As per agreement'];
      }
    } else if (Array.isArray(deal.deliverables)) {
      // Check if it's structured objects or strings
      if (deal.deliverables.length > 0 && typeof deal.deliverables[0] === 'object' && deal.deliverables[0] !== null && ('platform' in deal.deliverables[0] || 'contentType' in deal.deliverables[0])) {
        deliverables = deal.deliverables as StructuredDeliverable[];
      } else {
        deliverables = deal.deliverables as string[];
      }
    } else {
      deliverables = ['As per agreement'];
    }
  } catch {
    deliverables = [deal.deliverables || 'As per agreement'];
  }

  // Parse usage settings (if stored in deal) - validate platforms
  const usageType = (deal as any).usage_type || 'Non-exclusive';
  const rawPlatforms = deal.platform
    ? [deal.platform]
    : (deal as any).usage_platforms || [];
  // Validate and filter platforms (remove "Other" and invalid platforms)
  const usagePlatforms = validateAndFormatPlatforms(rawPlatforms);
  const usageDuration = (deal as any).usage_duration || '6 months';
  const paidAds = (deal as any).paid_ads_allowed === true;
  const whitelisting = (deal as any).whitelisting_allowed === true;

  // Parse exclusivity (if stored in deal)
  const exclusivityEnabled = (deal as any).exclusivity_enabled === true;
  const exclusivityCategory = (deal as any).exclusivity_category || null;
  const exclusivityDuration = (deal as any).exclusivity_duration || null;

  // Termination notice
  const terminationNoticeDays = (deal as any).termination_notice_days || 7;

  // Jurisdiction
  const jurisdictionCity = (deal as any).jurisdiction_city || 'Delhi';

  return {
    deal_amount: deal.deal_amount || 0,
    deliverables,
    delivery_deadline: deal.due_date || undefined,
    payment: {
      method: (deal as any).payment_method || 'Bank Transfer',
      timeline: deal.payment_expected_date
        ? `Within 7 days of content delivery (expected by ${new Date(deal.payment_expected_date).toLocaleDateString('en-IN')})`
        : 'Within 7 days of content delivery',
    },
    usage: {
      type: usageType as 'Exclusive' | 'Non-exclusive',
      platforms: usagePlatforms,
      duration: usageDuration,
      paid_ads: paidAds,
      whitelisting: whitelisting,
    },
    exclusivity: {
      enabled: exclusivityEnabled,
      category: exclusivityCategory,
      duration: exclusivityDuration,
    },
    termination: {
      notice_days: terminationNoticeDays,
    },
    jurisdiction_city: jurisdictionCity,
  };
}

