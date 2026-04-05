# Brand Dashboard State Machine

## Overview

The brand dashboard guides brands through their workflow, highlighting the most urgent action.

---

## State Priority (highest to lowest)

```
1. content_waiting_approval → Creator submitted content, needs review
2. payment_pending         → Content approved, payment needed
3. offer_response_pending  → Offer sent, waiting for creator response
4. content_in_progress     → Deal active, creator making content
5. completed               → Deals done
6. new                     → No activity yet
```

---

## State Detection Logic

```typescript
function getBrandState(params: {
  hasContentWaitingApproval: boolean;
  hasPaymentPending: boolean;
  hasOfferResponsePending: boolean;
  hasContentInProgress: boolean;
  hasCompletedDeals: boolean;
}): BrandState {

  // Priority 1: Review content (highest urgency)
  if (params.hasContentWaitingApproval) return 'content_waiting_approval';

  // Priority 2: Send payment (approved content)
  if (params.hasPaymentPending) return 'payment_pending';

  // Priority 3: Waiting for creator response to offer
  if (params.hasOfferResponsePending) return 'offer_response_pending';

  // Priority 4: Content being made
  if (params.hasContentInProgress) return 'content_in_progress';

  // Priority 5: Completed deals exist
  if (params.hasCompletedDeals) return 'completed';

  // Default: New brand
  return 'new';
}
```

---

## Dashboard Sections by State

### State: `new` (no activity)

**Sections:**
1. ✅ Welcome Header — greeting + stats
2. ✅ Primary Action — "Send New Offer" button (prominent)
3. ✅ Empty State — "Find creators to collaborate with"

**Next Action:** `create_offer`

---

### State: `offer_response_pending` (offers sent)

**Sections:**
1. ✅ Welcome Header
2. ✅ Next Step — "Waiting for creator response" with offer count
3. ✅ Pending Offers — all offers with expiry timers

**Next Action:** `view_offer`

**Urgency:** Medium — show expiry timers

---

### State: `content_in_progress` (creator making content)

**Sections:**
1. ✅ Welcome Header
2. ✅ Next Step — "Creator is making content" with deadline
3. ✅ Active Deals — deal cards with progress

**Next Action:** `view_deal`

---

### State: `content_waiting_approval` (needs review)

**Sections:**
1. ✅ Welcome Header
2. ✅ Next Step — "Review content" (urgent styling)
3. ✅ Content Review Card — preview + approve/request changes
4. ✅ Active Deals — other deals

**Next Action:** `review_content`

**Urgency:** Highest — warning color, deadline shown

---

### State: `payment_pending` (approved, needs payment)

**Sections:**
1. ✅ Welcome Header
2. ✅ Next Step — "Send payment" (success styling)
3. ✅ Payment Card — amount + payment methods
4. ✅ Active Deals — other deals

**Next Action:** `send_payment`

**Urgency:** High — success color, amount prominent

---

### State: `completed` (past deals)

**Sections:**
1. ✅ Welcome Header
2. ✅ Stats Summary — spend, deals, creators
3. ✅ Completed Deals — history with ratings
4. ✅ Creator History — past collaborators

**Next Action:** `create_offer` (subtle)

---

## Section Visibility Matrix

| Section              | new | offer_pending | content_progress | review | payment | completed |
|---------------------|-----|---------------|------------------|--------|---------|-----------|
| Welcome Header      | ✅   | ✅             | ✅                | ✅      | ✅       | ✅          |
| Primary Action      | ✅   | ⬜              | ⬜                 | ⬜       | ⬜        | ✅          |
| Next Step Card      | ⬜    | ✅             | ✅                | ✅      | ✅       | ✅          |
| Pending Offers      | ⬜    | ✅             | ⬜                 | ⬜       | ⬜        | ⬜           |
| Active Deals        | ⬜    | ⬜              | ✅                | ✅      | ✅       | ⬜           |
| Content Review      | ⬜    | ⬜              | ⬜                 | ✅      | ⬜        | ⬜           |
| Payment Card        | ⬜    | ⬜              | ⬜                 | ⬜       | ✅       | ⬜           |
| Completed Deals     | ⬜    | ⬜              | ⬜                 | ⬜       | ⬜        | ✅          |
| Creator History     | ⬜    | ⬜              | ⬜                 | ⬜       | ⬜        | ✅          |

---

## Next Action Types

| Action              | Label                 | Color    | Icon      |
|---------------------|-----------------------|----------|-----------|
| `create_offer`      | Send new offer        | primary  | Plus      |
| `view_offer`        | View offer            | default  | Eye       |
| `view_deal`         | View deal             | default  | ArrowRight|
| `review_content`    | Review content        | warning  | FileCheck |
| `send_payment`      | Send payment          | success  | Send      |

---

## Urgency Indicators

### Content Review Urgency
- **Critical**: Deadline < 24h → red badge
- **Warning**: Deadline < 48h → yellow badge
- **Normal**: Deadline > 48h → default

### Offer Expiry Urgency
- **Critical**: Expires < 24h → red badge
- **Warning**: Expires < 72h → yellow badge
- **Normal**: Expires > 72h → default

---

## Key Differences from Creator Dashboard

| Aspect           | Creator Dashboard            | Brand Dashboard              |
|-----------------|------------------------------|------------------------------|
| Primary flow    | Receive → Accept → Deliver   | Send → Review → Pay          |
| Urgency driver  | Deadline for content         | Deadline for review          |
| Payment action  | Confirm receipt              | Send payment                 |
| Content action  | Submit                       | Approve/Request changes      |
