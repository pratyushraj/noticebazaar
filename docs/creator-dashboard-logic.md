# Creator Dashboard State Machine

## Overview

The dashboard adapts based on creator state, always surfacing the most important next action.

---

## State Priority (highest to lowest)

```
1. payment_pending     → Payment needs confirmation
2. revision_requested  → Brand asked for changes
3. content_upload      → Deal active, needs content
4. new_offers          → Pending offers to review
5. active_deals        → Deal in progress, no action needed
6. completed           → Past deals exist
7. new                 → Fresh creator, no activity
```

---

## State Detection Logic

```typescript
function getCreatorState(params: {
  hasPaymentPending: boolean;
  hasRevisionRequested: boolean;
  hasContentUploadNeeded: boolean;
  hasNewOffers: boolean;
  hasActiveDeals: boolean;
  hasCompletedDeals: boolean;
}): CreatorState {

  // Priority 1: Payment confirmation
  if (params.hasPaymentPending) return 'payment_pending';

  // Priority 2: Revision needed
  if (params.hasRevisionRequested) return 'revision_requested';

  // Priority 3: Content upload
  if (params.hasContentUploadNeeded) return 'content_upload';

  // Priority 4: New offers
  if (params.hasNewOffers) return 'new_offers';

  // Priority 5: Active deals
  if (params.hasActiveDeals) return 'active_deals';

  // Priority 6: Completed deals
  if (params.hasCompletedDeals) return 'completed';

  // Default: New creator
  return 'new';
}
```

---

## Dashboard Sections by State

### State: `new` (no activity)

**Sections (in order):**
1. ✅ Link Card — with share CTAs
2. ✅ Next Step — "Share your link"
3. ✅ Empty State — encouragement to share
4. ✅ Onboarding Checklist — optional, collapsed by default

**Next Action:** `share_link`

**Sticky Mobile CTA:** Yes — Share on WhatsApp / Copy link

---

### State: `new_offers` (pending offers)

**Sections (in order):**
1. ✅ Link Card — minimal, collapsed
2. ✅ Next Step — "Review your offer" (prominent)
3. ✅ Offers Section — all pending offers as cards
4. ⬜ Active Deals — hidden (none yet)

**Next Action:** `review_offer`

---

### State: `active_deals` (deal in progress)

**Sections (in order):**
1. ⬜ Link Card — collapsed by default
2. ✅ Next Step — based on deal status
3. ⬜ Offers Section — hidden (none pending)
4. ✅ Active Deal Cards — with progress timeline
5. ⬜ Earnings Summary — hidden until completed

**Next Action:** `view_deal` or context-specific (see below)

---

### State: `content_upload` (needs content)

**Sections (in order):**
1. ⬜ Link Card — collapsed
2. ✅ Next Step — "Submit your content" (urgent styling)
3. ✅ Deal Card — with timeline showing current step
4. ⬜ Offers — hidden

**Next Action:** `submit_content`

**Urgency:** High — warning color, deadline shown

---

### State: `revision_requested` (changes needed)

**Sections (in order):**
1. ⬜ Link Card — collapsed
2. ✅ Next Step — "Brand requested changes" (warning styling)
3. ✅ Deal Card — with feedback preview
4. ⬜ Offers — hidden

**Next Action:** `view_revision`

**Urgency:** High — warning color

---

### State: `payment_pending` (payment waiting)

**Sections (in order):**
1. ⬜ Link Card — collapsed
2. ✅ Payment Reminder Card — prominent, success styling
3. ✅ Deal Card — with payment details
4. ⬜ Offers — hidden

**Next Action:** `confirm_payment`

**Urgency:** Highest — success color, amount prominent

---

### State: `completed` (past deals)

**Sections (in order):**
1. ✅ Link Card — minimal
2. ✅ Earnings Summary — total earned, deal count
3. ⬜ Next Step — "Share your link for more deals"
4. ⬜ Active Deals — hidden
5. ✅ Activity Timeline — recent activity

**Next Action:** `share_link` (subtle)

---

## Section Visibility Matrix

| Section            | new | new_offers | active | content | revision | payment | completed |
|-------------------|-----|------------|--------|---------|----------|---------|-----------|
| Link Card         | ✅   | ✅ (small)  | ⬜       | ⬜        | ⬜         | ⬜        | ✅ (small) |
| Next Step Card    | ✅   | ✅          | ✅      | ✅       | ✅        | ✅       | ✅         |
| Offers Section    | ⬜    | ✅          | ⬜       | ⬜        | ⬜         | ⬜        | ⬜          |
| Active Deal Cards | ⬜    | ⬜           | ✅      | ✅       | ✅        | ✅       | ⬜          |
| Payment Card      | ⬜    | ⬜           | ⬜       | ⬜        | ⬜         | ✅       | ⬜          |
| Earnings Summary  | ⬜    | ⬜           | ⬜       | ⬜        | ⬜         | ⬜        | ✅          |
| Onboarding        | ✅   | ⬜           | ⬜       | ⬜        | ⬜         | ⬜        | ⬜          |
| Activity Timeline | ⬜    | ⬜           | ✅      | ✅       | ✅        | ✅       | ✅          |

---

## Next Action Types

| Action            | Label                    | Color   | Icon      |
|------------------|--------------------------|---------|-----------|
| `share_link`     | Share link               | primary | Share     |
| `review_offer`   | Review offer             | primary | ArrowRight|
| `view_deal`      | View deal                | default | Eye       |
| `submit_content` | Submit content           | warning | Upload    |
| `view_revision`  | View feedback            | warning | AlertCircle|
| `confirm_payment`| Confirm payment          | success | Check     |

---

## Implementation: `useCreatorDashboardState` Hook

```typescript
interface CreatorDashboardState {
  state: CreatorState;
  nextAction: NextAction;
  sections: {
    linkCard: 'full' | 'collapsed' | 'hidden';
    nextStep: boolean;
    offers: boolean;
    activeDeals: boolean;
    payment: boolean;
    earnings: boolean;
    onboarding: boolean;
    timeline: boolean;
  };
  stickyCta: boolean;
}

function useCreatorDashboardState(): CreatorDashboardState {
  const { deals, offers, profile } = useCreatorData();

  const hasPaymentPending = deals.some(d =>
    ['payment_pending', 'payment_released'].includes(d.status)
  );

  const hasRevisionRequested = deals.some(d =>
    d.brand_approval_status === 'changes_requested'
  );

  const hasContentUploadNeeded = deals.some(d =>
    d.status.includes('content') && !d.content_submitted_at
  );

  const hasNewOffers = offers.length > 0;

  const hasActiveDeals = deals.some(d =>
    !['completed', 'draft'].includes(d.status)
  );

  const hasCompletedDeals = deals.some(d =>
    d.status === 'completed' || d.payment_received_date
  );

  const state = getCreatorState({
    hasPaymentPending,
    hasRevisionRequested,
    hasContentUploadNeeded,
    hasNewOffers,
    hasActiveDeals,
    hasCompletedDeals,
  });

  return {
    state,
    nextAction: getNextAction(state, { deals, offers }),
    sections: SECTION_CONFIG[state],
    stickyCta: state === 'new',
  };
}
```

---

## Refactor Plan

1. **Extract state detection** into `useCreatorDashboardState` hook
2. **Replace scattered conditionals** with state-based rendering
3. **Simplify `nextStepData`** to use state machine
4. **Add `sections` config** for conditional rendering
5. **Test each state** with mock data

---

## Questions

- Should onboarding checklist be a separate modal or inline?
- Do we want animations when state changes (e.g., offer arrives)?
- Should payment card show bank details or just amount?
