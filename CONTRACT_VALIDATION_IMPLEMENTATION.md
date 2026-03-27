# Contract Scanner - Strict Validation Implementation

## Overview
The Contract Scanner now implements **strict document-type validation** that ONLY accepts Brand Deal Contracts and automatically rejects all other PDF types.

## Validation Rules

### ✅ ACCEPTS ONLY:
- Influencer–Brand collaboration agreements
- Creator-brand sponsorship contracts
- PR / Marketing deliverable agreements
- Paid partnership agreements
- Content creation deliverable sheets
- Usage rights + deliverables + payment-based brand contracts

### ❌ REJECTS:
- Legal notices (including Zoomcar legal notices)
- Consumer complaints
- Car rental agreements or claims
- Insurance policies/claims
- Government forms (PAN, Aadhaar, GST, income tax)
- Employment agreements
- Court documents (summons, petitions, affidavits, FIR info)
- Invoices, receipts, bills
- Generic PDFs not related to creator-brand deals

## Implementation Details

### 1. Validation Function (`isValidBrandDealContract`)

**Location:**
- Frontend: `src/lib/utils/contractValidation.ts`
- Backend: `server/src/services/contractAnalysis.ts`

**Validation Process:**
1. **Rejection Check First**: Scans for rejection patterns - if ANY match, immediately rejects
2. **Brand Deal Indicators Check**: Requires at least 2 of the following indicators:
   - Deliverables: "posts", "videos", "reels", "stories", "content", "deliverables"
   - Payment terms: "payment", "fee", "compensation", "amount payable"
   - Campaign details: "campaign", "timeline", "deadline", "deliver by", "term"
   - Rights: "usage rights", "content rights", "license", "distribution rights"
   - Exclusivity: "exclusive", "exclusivity", "non-compete"
   - Collaboration terms: "brand", "creator", "influencer", "scope of work"

### 2. Rejection Patterns

The scanner rejects documents containing:
- `legal notice`, `booking id`, `court`, `insurance`, `repair estimate`, `vehicle`
- `registration no`, `consumer complaint`, `summons`
- `agreement for rent`, `invoice`, `policy number`
- `employment agreement`, `employee contract`, `job offer`
- `pan`, `aadhaar`, `gst`, `income tax`, `passport form`

### 3. Error Response Format

**Frontend Validation Error:**
```typescript
{
  isValid: false,
  error: '⚠️ This document does not appear to be a brand deal contract.\n\nThe Contract Scanner only supports influencer–brand collaboration agreements.\n\nPlease upload a brand deal contract.'
}
```

**Backend API Error Response:**
```json
{
  "status": 400,
  "error": "⚠️ This document does not appear to be a brand deal contract.\n\nThe Contract Scanner only supports influencer–brand collaboration agreements.\n\nPlease upload a brand deal contract.",
  "message": "⚠️ This document does not appear to be a brand deal contract.\n\nThe Contract Scanner only supports influencer–brand collaboration agreements.\n\nPlease upload a brand deal contract.",
  "validationError": true
}
```

## Files Modified

### Frontend
1. **`src/lib/utils/contractValidation.ts`**
   - Updated `isValidBrandDealContract()` with strict validation
   - Requires at least 2 brand deal indicators
   - Comprehensive rejection patterns
   - Updated error message format

2. **`src/pages/ContractUploadFlow.tsx`**
   - Already has validation integration
   - Shows error toast on validation failure
   - Blocks upload for invalid documents

### Backend
1. **`server/src/services/contractAnalysis.ts`**
   - Updated `isValidBrandDealContract()` to match frontend
   - Validation runs BEFORE analysis
   - Throws ValidationError with proper message

2. **`server/src/routes/protection.ts`**
   - Catches validation errors
   - Returns 400 status with `validationError: true`
   - Includes both `error` and `message` fields

## Example: Invalid PDF Rejection

**Input:** Zoomcar legal notice PDF containing "legal notice" and "booking id"

**Validation Process:**
1. Extract text from PDF
2. Check rejection patterns → **MATCH**: "legal notice" pattern found
3. **IMMEDIATE REJECTION** (doesn't check brand deal indicators)

**Response:**
```json
{
  "status": 400,
  "error": "⚠️ This document does not appear to be a brand deal contract.\n\nThe Contract Scanner only supports influencer–brand collaboration agreements.\n\nPlease upload a brand deal contract.",
  "validationError": true
}
```

**User sees:**
```
⚠️ This document does not appear to be a brand deal contract.

The Contract Scanner only supports influencer–brand collaboration agreements.

Please upload a brand deal contract.
```

## Example: Valid Brand Deal Contract

**Input:** Brand collaboration contract containing:
- "deliverables: 3 Instagram posts"
- "payment: ₹50,000"
- "campaign timeline: 30 days"
- "exclusivity: 60 days"
- "brand obligations"

**Validation Process:**
1. Extract text from PDF
2. Check rejection patterns → **NO MATCH**
3. Check brand deal indicators:
   - ✅ Deliverables: "posts" found
   - ✅ Payment: "payment" found
   - ✅ Campaign: "campaign timeline" found
   - ✅ Exclusivity: "exclusivity" found
   - ✅ Collaboration: "brand obligations" found
4. **5 indicators found** (requires 2) → **VALID**
5. Proceeds with contract analysis

## Testing Checklist

- [x] Rejects legal notices (Zoomcar, etc.)
- [x] Rejects consumer complaints
- [x] Rejects car rental agreements
- [x] Rejects insurance documents
- [x] Rejects government forms
- [x] Rejects employment agreements
- [x] Rejects invoices/receipts
- [x] Accepts valid brand deal contracts with 2+ indicators
- [x] Returns proper error message format
- [x] Returns 400 status code for invalid documents
- [x] Frontend validation blocks upload
- [x] Backend validation blocks analysis

## Notes

- Validation runs on **both frontend and backend** for defense in depth
- Frontend validation provides immediate feedback
- Backend validation ensures security even if frontend is bypassed
- Error messages are consistent across frontend and backend
- Validation happens **BEFORE** any analysis processing

