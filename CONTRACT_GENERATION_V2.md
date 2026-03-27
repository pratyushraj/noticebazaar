# Contract Generation System v2

## Overview

Production-grade, creator-first, brand-safe contract generation system with structured data mapping and hardened AI prompts.

## Architecture

### 1. Contract Template (`contractTemplate.ts`)

**Core Components:**
- `DealSchema`: Structured JSON schema representing deal configuration
- `ContractVariables`: Mapped variables for template interpolation
- `mapDealSchemaToContractVariables()`: Maps UI schema → contract variables (prevents AI hallucination)
- `generateContractFromTemplate()`: Generates contract from v2 template
- `buildDealSchemaFromDealData()`: Builds schema from database deal record

### 2. Contract Generator (`contractGenerator.ts`)

**Generation Flow:**
1. **Primary Method**: Template-based generation (no AI, deterministic)
2. **Enhancement**: AI enhancement for additional terms (if provided)
3. **Fallback**: AI generation with structured prompt (if template fails)

**Key Features:**
- Uses structured `DealSchema` to prevent AI hallucination
- Template-first approach ensures consistency
- AI only used for enhancement/fallback
- Hardened prompt with strict rules

### 3. Production Contract Template (v2)

**Sections:**
1. Scope of Work
2. Compensation & Payment Terms (with 18% late payment interest)
3. Intellectual Property Ownership (Creator retains ownership)
4. Usage Rights (License) - configurable
5. Exclusivity - configurable
6. Compliance & Disclosures (ASCI guidelines)
7. Termination (configurable notice period)
8. Confidentiality
9. Limitation of Liability (Creator-protective)
10. Dispute Resolution & Jurisdiction (Indian Contract Act, 1872)
11. Entire Agreement

## Deal Schema Structure

```typescript
{
  deal_amount: number;
  deliverables: string[];
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
```

## UI → Contract Mapping

| UI Control | Contract Section | Variable |
|------------|------------------|----------|
| Deal Amount | Section 2 | `deal_amount` |
| Deliverables | Section 1 | `deliverables_list` |
| Usage Type Toggle | Section 4 | `usage_type` |
| Paid Ads Toggle | Section 4 | `paid_ads_allowed` |
| Whitelisting Toggle | Section 4 | `whitelisting_allowed` |
| Exclusivity Toggle | Section 5 | `exclusivity.enabled` |
| Termination Slider | Section 7 | `termination_notice_days` |
| Jurisdiction Dropdown | Section 10 | `jurisdiction_city` |

## AI Prompt (Hardened)

**Key Rules:**
- ✅ Only interpolate from provided schema
- ❌ Never invent or assume values
- ✅ Follow Indian Contract Act, 1872
- ✅ Default to creator-protective language
- ✅ No placeholders in final output
- ✅ Professional legal formatting only

## Benefits

1. **Consistency**: Template-based generation ensures uniform contracts
2. **Accuracy**: Structured mapping prevents AI hallucination
3. **Legal Compliance**: Built-in Indian law compliance
4. **Creator Protection**: Default creator-friendly terms
5. **Brand Safety**: Professional, court-ready contracts
6. **Scalability**: Easy to extend with new clauses

## Usage

```typescript
// Build schema from deal data
const dealSchema = buildDealSchemaFromDealData(deal);

// Map to contract variables
const variables = mapDealSchemaToContractVariables(
  dealSchema,
  brandInfo,
  creatorInfo
);

// Generate contract
const contractText = generateContractFromTemplate(variables);

// Or use generator service
const result = await generateContractFromScratch({
  brandName: 'Brand Name',
  creatorName: 'Creator Name',
  dealSchema,
  // ... other fields
});
```

## Migration Notes

- Old contracts: Still supported via fallback AI generation
- New contracts: Use v2 template system
- Database: No schema changes required (uses existing deal fields)
- Future: Can add new deal fields for enhanced contract customization

## Testing

Test with various deal configurations:
- With/without exclusivity
- Different usage types
- Various payment terms
- Different jurisdictions
- Additional terms enhancement

