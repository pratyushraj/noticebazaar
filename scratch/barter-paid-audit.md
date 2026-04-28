# Barter vs Paid Deal Flow Audit

## Executive Summary

The codebase maintains **parallel but divergent** flows for barter (product-based) and paid (monetary) collaborations. The divergence is **intentional** but suffers from:
- **Inconsistent status semantics** (`'Drafting'` means different things)
- **Missing guards** at API layer (barter can submit content before receiving product)
- **Scattered type checks** with inconsistent naming (`deal_type` vs `collab_type`)
- **Duplicated contract generation** logic

---

## 1. Flow Divergence Matrix

| Phase | Barter Flow | Paid Flow | Divergence Point |
|---|---|---|---|
| **Offer** | Brand submits with `collab_type='barter'`, includes `barter_description`, `barter_value`, `barter_product_image_url` | `collab_type='paid'`, includes `exact_budget`, `budget_range` | Collab request form validation differs |
| **Acceptance** | Returns `needs_delivery_details: true` **before contract generation** | Generates contract immediately, returns contract URL & token | `collabRequests.ts:1356-1363` (PATCH accept) and `1606-1613` (email confirm) branch on `isBarter` |
| **Deal creation** | `status='Drafting'`, `deal_type='barter'`, `deal_amount` = 0 or barter_value | **BUG:** `status='Drafting'` (should be `'CONTRACT_READY'`), `deal_type='paid'`, `deal_amount=exact_budget` | Same endpoint, different `deal_type` flag — but status is wrong for paid |
| **Pre-contract** | **Must** submit delivery details via `PATCH /api/deals/:id/delivery-details` → sets `shipping_required=true`, `shipping_status='pending'`, generates contract | No delivery step. Contract already generated. | Barter requires additional step |
| **Contract generation** | Generated **after** delivery details saved. Includes clause: `Barter Collaboration: {description}` | Generated immediately on acceptance | Contract generation timing differs by ~1-3 days |
| **Brand signing** | Identical: brand receives email link, signs → `deal_execution_status='signed'` | Identical | Converges |
| **Creator signing** | Identical: OTP verify → sign → `SIGNED_BY_CREATOR` | Identical | Converges |
| **Fully executed** | `FULLY_EXECUTED` after both signed | `FULLY_EXECUTED` after both signed | Converges |
| **Content Making** | **Blocked until** `shipping_status='delivered'` (creator confirmed received) | **Blocked until** `payment_id` exists / escrow funded (`amount_paid>0`) | Enforcement in `useUpdateDealProgress:1135-1144` |
| **Content workflow** | Identical post start: submit link → brand review → approve/revision | Identical | Converges |
| **Settlement** | Brand marks shipped → creator confirms received → auto-completes after approval | Brand releases payment → creator confirms receipt → auto-completes | Separate field sets: `shipping_*` vs `payment_*` |
| **Completion** | `status='COMPLETED'` | `status='COMPLETED'` | Converges |

---

## 2. Barter-Specific Paths (Key Files)

| Location | Condition | Action |
|---|---|---|
| `collabRequests.ts:631-639` | `collab_type === 'barter'` | Requires `barter_product_image_url` |
| `collabRequests.ts:1295` | `request.collab_type === 'barter'` | Sets `isBarter=true`, `deal_type='barter'`, `deal_amount=0` |
| `collabRequests.ts:1306` | Unconditional | Sets `status='Drafting'` ← **BUG: wrong for paid** |
| `collabRequests.ts:1356-1363` | `if (isBarter)` | Returns `needs_delivery_details: true`, **skips contract generation** |
| `collabRequests.ts:1606-1613` | `if (isBarter)` | Same early return for PATCH accept |
| `collabRequests.ts:1730-1732` | `collab_type==='barter' && barter_description` | Adds `Barter Collaboration:` clause to contract |
| `deals.ts:1156-1405` | `PATCH /:dealId/delivery-details` | Validates name/phone/address, sets `shipping_required=true`, `shipping_status='pending'`, **then generates contract** |
| `deals.ts:1419-1479` | `PATCH /shipping/confirm-received` | Creator confirms product received → `shipping_status='delivered'` |
| `deals.ts:1485-1568` | `PATCH /shipping/report-issue` | Reports shipping problem |
| `collabType.ts:6-25` | `isBarterLikeCollab()` | Checks `requires_shipping`, `shipping_required`, or type contains 'barter' |
| `DealDetailPage.tsx:1207-1209` | `dealTypeLower==='barter' && statusLower==='drafting' && !delivery_address` | Auto-redirects to `/deal-delivery-details` |

---

## 3. Paid-Specific Paths (Key Files)

| Location | Condition | Action |
|---|---|---|
| `collabRequests.ts:733-736` | `collab_type === 'paid'` | Sets `budget_range`, `exact_budget` |
| `collabRequests.ts:1292-1294` | `collab_type === 'paid'` | `dealAmount = exact_budget` |
| `deals.ts:22-29` | `inferRequiresPayment()` | Returns true if `deal_amount>0` or type includes 'paid' |
| `deals.ts:566-639` | `PATCH /:id/release-payment` | Brand marks payment sent → `status='PAYMENT_RELEASED'` |
| `deals.ts:269-299` | `PATCH /:id/confirm-payment-received` | Creator confirms → `payment_received_date` set → `status='COMPLETED'` |
| `useBrandDeals.ts:1135-1144` | `stage==='content_making' && isPaidLikeCollab()` | Throws if `payment_id` or `amount_paid>0` missing |
| `BrandDealDetailPage.tsx:567-682` | `deal.deal_type !== 'barter'` | Shows Payment Info card with release button |
| `BrandMobileDashboard.tsx:2020` | `isPaidLikeCollab(offer) && !isPureBarter` | Payment reminder CTA |

---

## 4. Critical Inconsistencies & Bugs

### 4.1 `Drafting` Status Overloaded (Severity: HIGH)

**Problem:** `'Drafting'` represents **two opposite states**:
- **Barter (pre-delivery):`'Drafting'` = waiting for creator to add address before contract gen
- **Paid (post-contract):`'Drafting'` = contract generated, waiting for brand signature

**Evidence:**
```typescript
// collabRequests.ts:1306 — initial deal creation (both types)
status: 'Drafting'

// collabRequests.ts:1767 — after contract uploaded (paid deals only reach here)
status: 'Drafting', // Comment: "Contract is ready, awaiting brand signature" ← MISMATCH
```

**Why it matters:**
- UI logic in `DealDetailPage.tsx` uses `statusLower === 'drafting'` to determine `isBarterDeliveryPending` and `guidedDealState`. For paid deals, this incorrectly suggests delivery is needed.
- `useBrandDeals:401` includes `'drafting'` in signed statuses, so both appear on dashboard but with different meanings.
- `DEAL_ALLOWED_TRANSITIONS` (dealStatuses.ts) allows `NEGOTIATION → CONTRACT_READY` but not `DRAFTING → CONTRACT_READY`. The system might not allow proper transition from erroneous `'Drafting'` state.

**Fix:** Set correct initial status:
- Barter: keep `'Drafting'` (pre-delivery)
- Paid: set `'CONTRACT_READY'` after contract generation
```typescript
// In collabRequests.ts accept flow
const dealStatus = isBarter ? 'Drafting' : 'CONTRACT_READY';  // ← Fix line 1306
// Later after contract upload for paid:
await supabase.from('brand_deals').update({
  contract_file_url: contractUrl,
  status: 'CONTRACT_READY', // ← Fix line 1767
  ...
});
```

Also adjust PATCH /accept/:id/accept (line 1442) and counter acceptance (line 1539) similarly.

---

### 4.2 Submit-Content Allows Barrels w/ Shipping Pending (Severity: MEDIUM)

**Problem:** `PATCH /api/deals/:id/submit-content` (deals.ts:371-479) checks only status-based allowlist:
```typescript
const canSubmit = current === 'CONTENT_MAKING' || current === 'DRAFTING' || ...;
```
For barter deals in `'Drafting'` (no delivery address saved), `canSubmit=true`. API permits content link submission even though product hasn't shipped.

**UI Protection:** `DealDetailPage.tsx:1207-1208` computes `isBarterDeliveryPending` and hides content submission panel. But direct API calls bypass this.

**Impact:** Creator could technically submit fake content before receiving product, causing disputes later.

**Fix:** Add server-side guard:
```typescript
// Check barter delivery before content submission
if (isBarterLikeCollab(deal) && deal.shipping_required && deal.shipping_status !== 'delivered') {
  return res.status(409).json({
    success: false,
    error: 'Cannot submit content until you have received the product. Please confirm delivery first.',
  });
}
```

---

### 4.3 Payment Enforcement Only in Progress Hook (Severity: MEDIUM)

`useUpdateDealProgress` (useBrandDeals.ts:1135-1144) blocks `content_making` if paid deal lacks payment. But progress updates are **not the only path** to `content_making` — status can be set directly via other APIs.

**Missing check in:**
- `submit-content` endpoint (deals.ts) — could set status to `'Content Delivered'` from `'Drafting'` without escrow
- `regenerate-contract` doesn't enforce anything
- `review-content` doesn't enforce (but brand action so expected)

**Fix:** Add consistent `isPaidLikeCollab` payment check in `submit-content` as well before allowing content submission.

---

### 4.4 `deal_type` vs `collab_type` Inconsistency (Severity: MEDIUM)

**Two fields exist**:
- `collab_requests.collab_type` (submission time)
- `brand_deals.deal_type` (post-acceptance)

Derived at acceptance time (collabRequests.ts:1307, 1540):
```typescript
deal_type: isBarter ? 'barter' : 'paid',
```

**No DB-level constraint** to ensure consistency if someone manually updates one field. No trigger/foreign key.

**Vocabulary drift:**
- Official type values: `'paid'`, `'barter'`, `'both'` (collabRequests.ts:582)
- `collabType.ts` also recognizes `'hybrid'`, `'paid_barter'` as synonyms
- Some inline checks use string `includes('barter')` which may match `'both'` correctly, but `'hybrid'` may be missed if not in the list

**Fix:** Consolidate to single field. Consider dropping `deal_type` entirely and using `collab_type` everywhere (or vice versa). Add trigger to keep them in sync if both needed.

---

### 4.5 Aliased "Barter" Variants Not Normalized (Severity: LOW)

Code accepts `['both', 'hybrid', 'paid_barter']` as barter-like in `isBarterLikeCollab`. But official collab request only allows `'paid'`, `'barter'`, `'both'`. Where do `'hybrid'` / `'paid_barter'` originate?

Likely legacy migrations or direct DB inserts. `isPaidLikeCollab` also includes these. Should normalize at data entry points (accept flow) and map to `'both'`.

---

### 4.6 Regenerate Contract Bypasses Preconditions (Severity: MED)

`PATCH /api/deals/:dealId/regenerate-contract` (deals.ts:1575+) allows any deal owner to regenerate contract **without checking:**
- Barter: `shipping_required && delivery_address` exists
- Paid: `brand_response_status === 'accepted_verified'`

This could generate contract with missing data, causing errors or incomplete agreements.

**Fix:** Add pre-checks matching original contract generation conditions.

---

### 4.7 Barter Deals Hidden in CreatorContracts List (Severity: LOW)

`CreatorContracts.tsx:35` filters out barter deals in `Drafting` without delivery address entirely:
```typescript
if (deal.deal_type === 'barter' && deal.status === 'Drafting' && !deal.delivery_address) return false;
```
This hides incomplete barter deals from the contracts page. Should show with "Action Required: Add delivery details" CTA.

---

### 4.8 Missing `collab_type` in `brand_deals` Queries

`brand_deals` table only has `deal_type`. Frontend reads from there. But `collab_requests` has `collab_type`. When debugging in console or logs, can't trace back to original collab request type without joining.

**Recommendation:** Add `collab_type` as redundant column to `brand_deals` for easier debugging, or always join through `collab_request_id`.

---

## 5. Schema Mismatch Summary

| Column | Barter Usage | Paid Usage |
|---|---|---|
| `deal_type` | `'barter'` | `'paid'` |
| `deal_amount` | Usually `0` or `barter_value` reference | Actual monetary value (>0) |
| `delivery_*` fields | Used extensively | Should be NULL |
| `shipping_required` | `true` after delivery-details saved | Should be `false` or NULL |
| `shipping_status` | `'pending' → 'shipped' → 'delivered'` | Unused |
| `payment_id`, `amount_paid`, `payment_status` | Unused | Escrow tracking fields |
| `payment_released_at`, `utr_number`, `payment_received_date` | Unused | Payment settlement fields |
| `brand_response_status` | Used for contract acceptance (`accepted_verified`) | Same |
| `contract_file_url` | Generated **after** delivery details | Generated immediately on accept |
| `progress_percentage` | Stages: Drafting(20%) → AwaitingProduct(50%) → FullyExecuted(100%) | Stages: Drafting(20%)? → ContractReady(40%) → BrandSigned(60%) → FullyExecuted(80%) |

**Note:** `DEAL_PROGRESS_STAGES` includes `awaiting_product_shipment: 50%` (barter-only). Paid has no equivalent intermediate stage between `Drafting` and `CONTRACT_READY`.

---

## 6. Validation Guard Locations

| Check | Barter | Paid | Where enforced |
|---|---|---|---|
| Delivery details before contract | ✅ Required for contract gen in `delivery-details` endpoint | N/A | API redirects, contract gen endpoint checks |
| Shipping before content | ❌ **Missing** in `submit-content` API (only UI prevents) | N/A | UI only; should be API |
| Escrow before content | N/A | ✅ Enforced in `useUpdateDealProgress` only | Frontend hook + client API; missing server guard |
| Brand signature before creator sign | ✅ Both require `brand_response_status='accepted_verified'` | ✅ Same | `upload-signed-contract` endpoint checks (deals.ts:772) |
| Status transition rules | ✅ Central `validateStatusTransition` used in `useUpdateDealProgress` | ✅ Same | Frontend hook only; no backend validation on all updates |

---

## 7. Duplicated / Scattered Logic

**Helper duplication:**
- `isBarterLikeCollab()` defined in `src/lib/deals/collabType.ts` (canonical) — **but also** redefined inline in:
  - `CollabLinkLanding.tsx:837`
  - `dashboardShared.tsx`
- `inferRequiresPayment()` in `deals.ts:22-29` duplicates logic from `isPaidLikeCollab` (slightly different)

**Contract generation code** duplicated across 3 endpoints:
1. `collabRequests.ts` PATCH /:id/accept (lines 1615-1811)
2. collabRequests.ts POST /accept/confirm (lines 1365-1463)
3. deals.ts POST /:dealId/regenerate-contract (lines 1575-1716)

Each has slight variations in defaults (brandAddress fallback, deadline calculation). This creates drift risk.

**Status normalization** scattered:
- `normalizeStatus()` in `deals.ts` — `.toUpperCase().replaceAll(' ', '_')`
- `getDealStageFromStatus()` in `useBrandDeals.ts` — tries both cases and fallback to progress
- `DEAL_STAGE_DISPLAY` mapping in `dealStatusFlow.ts` — maps canonical keys to UI labels

---

## 8. Recommendations (Priority Ordered)

### Immediate (This Sprint)

1. **Fix `Drafting` status for paid deals** — change all 4 occurrences in `collabRequests.ts`:
   - Line 1306: set `status: isBarter ? 'Drafting' : 'CONTRACT_READY'`
   - Line 1442: same
   - Line 1539: same
   - Line 1767: set `status: 'CONTRACT_READY'` (already contract ready; awaiting brand signature)

2. **Add shipping validation in `submit-content` API** — before allowing content submission for barter deals, verify `shipping_status === 'delivered'` if `requiresShipping`.

3. **Add payment validation in `submit-content` API** — similarly, for paid deals, verify escrow funded (`amount_paid > 0` or `payment_id` exists).

4. **Add shipping validation in `regenerate-contract`** — barter deals must have delivery details before contract regen.

5. **Remove demo data fallback** — `useBrandDeals.ts:286-299` returning fake data in prod masks errors. Replace with explicit error toast: "Unable to load deals — check connection".

### Short-term (Next Sprint)

6. **Consolidate deal-type helpers** — keep only `isBarterLikeCollab()` and `isPaidLikeCollab()` from `collabType.ts`. Remove all inline redefinitions. Ensure they check `requires_shipping`/`shipping_required` flags first (authoritative), then fall back to type strings.

7. **Normalize collab type vocabulary** — accept only `'paid'`, `'barter'`, `'both'` in API. Map legacy `'hybrid'`/`'paid_barter'` to `'both'` in request validation phase.

8. **Unify contract generation** — create `services/contractGenerator.ts` with a single function:
   ```typescript
   generateDealContract({ deal, collabRequest, creatorProfile, options })
   ```
   Called from all 3 acceptance endpoints with consistent additionalTerms.

9. **Add server-side status transition validation** — Create a PostgreSQL function or backend middleware that calls `validateStatusTransition` before any `UPDATE brand_deals SET status = ...`. Currently only the frontend hook enforces; direct API calls skip it.

10. **Fix CreatorContracts filter** — Instead of hiding incomplete barter deals, display them with explicit action: "Add delivery details to generate contract".

### Long-term (Architectural)

11. **Merge `deal_type` and `collab_type`** — Keep `collab_type` as source of truth; remove `deal_type`. Add computed column or view if needed for legacy queries.

12. **Create explicit Deal state machine table** — Instead of string status, store `state_id` referencing `deal_states(id)` with defined transitions. This prevents invalid state jumps.

13. **Add audit logging to all mutation endpoints** — Some endpoints like `submit-content` currently do NOT log to `deal_action_logs`. Missing audit trail.

14. **Add RLS policy for brand access by `brand_id` not email** — Current brand dashboard uses `brand_email = auth.email`. If brand updates their email in `profiles`, deal access breaks. Link `brand_deals.brand_id` to `brands.id` and enforce via RLS.

---

## 9. Test Coverage Gaps

No automated tests covering:
- Barter: accept → delivery → contract → shipping → content → completion
- Paid: accept → contract → sign(2x) → escrow → content → payment(release+confirm) → complete
- Edge cases:
  - Barrels submitting content before `shipping_status='delivered'` (should fail)
  - Paid deals trying `content_making` without `amount_paid>0` (should fail)
  - Duplicate acceptance (double-click) — produces two deals? (unique index on `collab_request_id` prevents but no user-friendly error)
  - Barter deal accepted, delivery added, contract generated, brand never signs — what status sits at?

**Recommendation:** Create `scripts/test-barter-end-to-end.ts` and `scripts/test-paid-end-to-end.ts` that simulate full flows via API calls.

---

## 10. Quick Reference: Status Semantics by Deal Type

| Status | Barter Meaning | Paid Meaning |
|---|---|---|
| `Drafting` | Creator must add delivery address (pre-contract) | **BUG:** Wrongly used post-contract; should be `CONTRACT_READY` |
| `Awaiting Product Shipment` | After delivery saved; waiting for brand to ship | N/A |
| `CONTRACT_READY` | N/A (barter uses `Drafting` + delivery) | Contract generated, waiting for brand signature |
| `SIGNED_BY_BRAND` | After brand signs contract | Same |
| `SIGNED_BY_CREATOR` | After creator signs | Same |
| `FULLY_EXECUTED` | Both signed, product in-transit or delivered (depends on shipping) | Both signed, escrow funded (if paid) |
| `Content Making` | Creator making content — **requires** `shipping_status='delivered'` | Creator making content — **requires** `amount_paid>0` |
| `Content Delivered` | Link submitted | Same |
| `CONTENT_APPROVED` | Brand approved | Same |
| `PAYMENT_RELEASED` | N/A | Brand marked payment sent |
| `PAYMENT_RECEIVED` | N/A | Creator confirmed receipt |
| `COMPLETED` | Final | Final |

---

**Audit completed.** Key action items:

1. Fix status assignment for paid deals at acceptance → `CONTRACT_READY`
2. Add shipping/payment guards to `submit-content` endpoint
3. Regenerate-contract guard
4. Consolidate type-check helpers
5. Write e2e tests for both flows
