# Creator Deal Flow — Redesign Spec v2
## Creator Armour

---

## Design Principles

1. **One thing at a time** — every screen has exactly ONE primary action
2. **Always know what to do next** — no ambiguity, no guessing
3. **Mobile-first** — touch targets ≥ 48px, sticky CTAs never scroll away during the action
4. **Reduce anxiety** — tell creators what happens AFTER each action before they take it
5. **Protect creators** — never ask for money/payment info, only receive it

---

## Creator Deal Flow — 11 Steps

---

### Step 1: New Offer Received (Notification)

**Push notification:**
- "[@brand] sent you an offer! ₹[X] for [deliverable] — Tap to review"

**What creator sees:**
- Badge count on dashboard
- Offer appears at top of "Pending" tab in CreatorDashboard

**Primary action:** Tap notification → opens CollabRequestBriefPage

**Data required:** None — this is passive

**Delayed:** Response, price, address — all come AFTER viewing

**UX notes:**
- Notification should feel exciting, not alarming
- Show brand name + amount + deliverable in notification body

---

### Step 2: Creator Reviews Offer

**Page:** `CollabRequestBriefPage`

**What creator sees:**
- Brand name + verified badge (if any)
- Deal type badge: Paid / Free Products / Paid + Product
- Deal value prominently displayed
- Deliverables as chips (Reel × 1, Story × 3, etc.)
- Deadline countdown
- Campaign brief (what the brand wants)
- "What you get" section
- "If you accept" section explaining what happens next

**Main button:** "Accept Offer" (green, large, sticky at bottom)

**Text says:**
- "₹5,000 for 1 Reel"
- "Deadline: Mar 25 (5 days left)"
- "If you accept: deal moves to your active workflow, you only add details when needed"

**Required:** None — just reviewing

**Optional:** None — all needed info is pre-filled by brand

**Delayed:** Address (only if barter), price confirmation (only if paid and price missing)

**UX notes:**
- This is a READING screen, not an ACTION screen. No pressure.
- The "Accept" button should feel low-commitment — "Try it, you can still counter later"
- Do NOT show a counter-offer form on this page — it confuses the main flow
- Counter offer is available but secondary (smaller button above Decline)
- Brand's Instagram handle shown as a link, not a required field

---

### Step 3: Creator Accepts or Counters

**What creator does:**

**Option A — Accept (primary, one tap):**
- Tap "Accept Offer"
- If missing price (paid deal, no rate set): pop-up asks for reel price → save → accept
- If missing address (barter deal, no address set): pop-up asks for address → save → accept
- Toast: "Offer accepted! Deal is now active."
- Redirects to DealDetailPage

**Option B — Counter (secondary):**
- Tap "Counter offer"
- Modal opens with:
  - Current offer summary (amount, deliverables)
  - Counter price field (pre-filled with original)
  - Notes field (optional)
- "Send Counter" → toast "Counter sent" → returns to pending

**Option C — Decline:**
- Tap "Decline" (with confirmation)
- Toast "Offer declined" → returns to dashboard

**Required:**
- Accept: price (if paid, missing) OR address (if barter, missing) — but only if really missing
- Counter: counter price (if paid deal)

**Optional:**
- Counter notes
- Decline reason (shown to brand)

**Automated:** Accept/counter/decline updates deal status in database → notifies brand

**What happens next:**
- After accept: redirect to DealDetailPage with "OFFER_ACCEPTED" state
- After counter: stays in pending, brand gets notified
- After decline: return to dashboard pending tab

**UX notes:**
- Acceptance should be frictionless — 1 tap if price/address already set
- The requirement dialog (asking for price/address) should clearly state WHY it's needed
- Counter offer should feel like a normal negotiation path, not an escape hatch
- After accepting, immediately show the creator their deal is active

---

### Step 4: If Product Deal → Add Address

**Page:** `DealDetailPage` with `OFFER_ACCEPTED` state, OR redirected to `DealDeliveryDetailsPage`

**What creator sees:**
- "Add your shipping address" header
- Address form: Flat/House, Area, City, State, Pincode
- Hint: "The brand will use this to ship your products"
- Map preview if possible (city-level is fine)

**Main button:** "Save Address"

**Required fields:**
- Full address (all lines)

**Optional:** Phone number for delivery updates

**Automated:** Address saved → notify brand "Creator added delivery address"

**UX notes:**
- This step should only appear for barter/hybrid deals
- Do NOT make this part of a contract flow — it's just shipping info
- Show estimated delivery expectation: "Brand typically ships within X days of accepting"
- Keep the deal active immediately after address — don't gate on brand shipping confirmation

---

### Step 5: If Paid Deal → Confirm Price (if missing)

**This step is already integrated into Step 3's accept dialog.**
- If creator has no rate set, the accept dialog asks for reel price
- This is the right place — deferred until absolutely needed

**Required:** Reel/content price (only if not already in profile)

**UX notes:**
- Do NOT ask creator to set a global rate card here — only confirm for this deal
- Show comparison: "Your current rate: ₹X. This brand offered ₹Y."

---

### Step 6: Creator Creates Content

**Page:** `DealDetailPage` — "Make" state

**What creator sees:**
- Status: "Start making your content"
- Deal summary: what to deliver, deadline
- Brand's campaign brief reminder
- Reference content links (if any)
- "Started making content?" button → marks content as in-progress

**Main button:** "I've started making content" (marks `CONTENT_IN_PROGRESS`)

**Required:** None — just starting is enough to mark

**Optional:**
- Progress notes
- "Add to calendar" for deadline

**Automated:** Deadline reminder sent 24h before due

**UX notes:**
- Do NOT require content to be submitted at this step
- "Started" is a low-commitment action — creators often need to confirm to themselves they're doing it
- Show countdown timer: "X days left to submit"
- Show what happens after: "Once live, paste your post link here"

---

### Step 7: Creator Submits Post Link

**Page:** `DealDetailPage` — "Share" step (formerly "Upload")

**What creator sees:**
- "Share your post link" header
- Input field: paste Instagram/reel/story link
- "What happens next" hint: "Brand will review within 7 days. If they want changes, you'll be notified."
- Submit button: "Submit Link"

**Main button:** "Submit Link"

**Required fields:**
- Content URL (validated as Instagram/YouTube link)

**Optional:**
- Caption preview (optional, not blocking)
- Creator notes for brand

**Automated:** On submit → notify brand "Creator submitted content"

**After submit:**
- Show confirmation: "✅ Link submitted! Brand will review within 7 days."
- Show link that was submitted (clickable)
- Show next step: "Waiting for brand review..."

**UX notes:**
- Rename from "Upload" to "Share" or "Submit Link" — it's a URL paste, not a file upload
- The 7-day review expectation is important — creators hate waiting indefinitely
- After submitting, show a "Submitted at [time]" timestamp
- If brand requests changes: status changes to "Changes Requested" + show brand's feedback
- Do NOT auto-submit or pre-fill — creator must consciously submit

---

### Step 8: Brand Reviews Content

**This happens on the BRAND side. Creator just waits.**

**What creator sees:**
- Status: "Awaiting brand review"
- Submitted link shown (verified)
- "Brand has 7 days to review. You'll be notified of any changes needed."
- If brand requests changes: status changes, feedback shown, prompt to resubmit

**Required:** None — just waiting

**Automated:**
- Reminder to brand if no review in 48h
- Status update when brand approves

**UX notes:**
- This is an ANXIOUS wait for creators. Reduce it.
- Show expected timeline: "Brand typically reviews within 2-3 days"
- If changes requested: show structured feedback, not just "changes needed"
- Show brand's specific comments clearly

---

### Step 9: Brand Approves Content

**What creator sees (push notification):**
- "[@brand] approved your content! 🎉 Payment incoming."

**Page:** `DealDetailPage` updates:
- Status: "Approved — Payment incoming"
- "Payment details" section appears:
  - Amount: ₹X
  - Expected by: [date]
  - Brand's UPI: [tap to copy]
  - "Mark payment received" button

**Required:** None

**Optional:** Remind brand (if overdue)

**Automated:** Notification to brand: "Payment due in X days"

**UX notes:**
- Approval should feel like a reward moment — celebratory if possible
- Immediately show the payment info — creator is excited to see it
- UPI copy button is crucial — make it one tap
- If payment overdue: show "Remind brand" as prominent action

---

### Step 10: Brand Pays Outside Platform, Marks Sent

**This happens OFF-platform (UPI/bank transfer).**

**What creator sees:**
- Status: "Payment sent — awaiting your confirmation"
- "Brand marked payment as sent. Confirm when you receive it."
- Amount shown: ₹X

**Main button:** "I've Received Payment" (large, green)

**Required:**
- Creator must confirm receipt (this is the ONLY trust action)

**Optional:**
- UTR number entry (for their own records)
- Payment proof upload (for their own records)

**NOT required:**
- Bank details — already saved in profile

**Automated:** On confirm → deal status → COMPLETED

**UX notes:**
- "Mark payment received" is the most important creator action
- Show expected amount prominently — creator should verify before clicking
- After confirming: show "Deal Complete! 🎉" celebration screen
- Offer "Leave a review" as next step (optional)

---

### Step 11: Deal Completed

**What creator sees:**
- "Deal Complete! 🎉" full-screen celebration (brief)
- Deal summary card:
  - Brand: @[brand]
  - Deliverables: Reel × 1
  - Earned: ₹5,000
  - Completed: [date]
- "Rate your experience with @[brand]" (1-5 stars, optional)
- "Share your work" — adds to creator's public profile
- "Send another offer to @[brand]" — back to collab link
- "Back to Dashboard" button

**Required:** None

**Optional:**
- Public review of brand
- Private rating
- Social share

**Automated:** Creator's completed deals count +1, profile updated

**UX notes:**
- This is the emotional peak — make it feel rewarding
- Rating should be optional, not a gate
- "Share your work" is a soft upsell — creator might want to show the collaboration
- Short celebration, then quick return to dashboard

---

## Creator Dashboard Tabs — Proposed Structure

```
Creator Dashboard
├── Inbox (notifications, not deals)
├── Deals
│   ├── Pending (offers awaiting your response)
│   ├── Active (in progress)
│   └── Completed (done)
├── Payments (standalone payment tracking)
└── Profile (public collab page, rates, settings)
```

**Pending tab shows:**
- New offers with time received ("2h ago")
- Brand name, amount, deliverable summary
- Status: Awaiting your response
- Tap to open CollabRequestBriefPage

**Active tab shows:**
- In-progress deals with current step
- Deal name, brand, deadline
- Status chip: "Waiting for brand review" / "Changes requested" / "Approved — payment pending"
- Progress bar: 0% → 100% through deal lifecycle

**Completed tab shows:**
- Past deals with earnings
- Star rating (if given)
- Tap to view summary

---

## Summary: What to Collect When

| Field | Step 2 (Review) | Step 3 (Accept) | Step 7 (Submit) | Step 10 (Confirm) |
|---|---|---|---|---|
| View offer | ✅ | | | |
| Accept offer | | ✅ | | |
| Price (if missing) | | ✅ (dialog) | | |
| Address (if barter) | | ✅ (dialog) | | |
| Content link | | | ✅ Required | |
| Payment receipt confirm | | | | ✅ Required |
| UTR / screenshot | | | Optional | Optional |

---

## Key UI Fixes Needed

### CollabRequestBriefPage
- ✅ Already has sticky CTA (good)
- ✅ "If you accept" section (good)
- ⚠️ Counter offer button needs more prominence (fixed earlier)
- ⚠️ Add "Expires in X days" urgency indicator (good)
- ⚠️ On accept: show loading state then redirect (good)

### DealDetailPage
- ✅ "Upload" renamed to "Share" (fixed earlier)
- ⚠️ Content submitted: add confirmation state ("✅ Link submitted, brand reviewing")
- ⚠️ Reduce number of visible steps — only show current + next step
- ⚠️ "PAYG" label confusing — show human-readable: "Brand approved — payment incoming"
- ⚠️ Add calendar/notification for deadline reminders
- ⚠️ "Mark payment received" should be the ONLY prominent action on payment screen

### PaymentDetailPage
- ✅ "Add UPI when payment is near" guidance (good)
- ✅ Amount confirmation before marking received (good)
- ⚠️ "Remind brand" is placeholder — needs real implementation
- ⚠️ On payment received: redirect to deal completion celebration, not stay on payment page
- ⚠️ After deal complete: show "rate this brand" inline on payment page

### CreatorDashboard
- ⚠️ Need "Pending" / "Active" / "Completed" tabs (not just "Deals")
- ⚠️ Pending offers should show time received
- ⚠️ Active deals should show current step + action hint

---

## Files to Modify

| File | Priority | Changes |
|---|---|---|
| `DealDetailPage.tsx` | High | Add "link submitted" confirmation, reduce step clutter, fix status labels |
| `PaymentDetailPage.tsx` | High | Fix post-confirmation flow, add deal completion redirect |
| `CreatorDashboard.tsx` | Medium | Add Pending/Active/Completed tabs for deals |
| `CollabRequestBriefPage.tsx` | Medium | Add urgency indicator, improve counter offer UX |

---

## Notification Map

| Event | Creator gets |
|---|---|
| New offer received | ✅ Push + badge |
| Brand counters | ✅ Push: "Brand sent a counter offer" |
| Brand confirms deal details | ✅ Push: "Deal confirmed — start creating!" |
| Content approved | ✅ Push: "Brand approved! Payment incoming." |
| Payment marked sent | ✅ Push: "Brand marked payment as sent." |
| Deal completed | ✅ Push: "Deal complete! 🎉" |
| 24h before deadline | ⚠️ Reminder to submit content |
| 48h no content review | ✅ Reminder to brand (system) |
| Payment overdue | ⚠️ Push to both |
