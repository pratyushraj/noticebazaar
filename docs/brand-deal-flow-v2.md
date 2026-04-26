# Brand Deal Flow — Redesign Spec v2
## CreatorArmour

---

## Design Principles

1. **Send first offer in under 2 minutes** — minimum viable info, rest filled later
2. **Never ask for what isn't needed yet** — defer everything possible until after offer is sent
3. **Brand always knows what to do next** — every state has exactly one primary action
4. **Notifications close the async loop** — brand doesn't have to keep checking
5. **Payments stay simple** — UPI outside platform, mark-as-sent to close the loop

---

## Brand Deal Flow — 12 Steps

---

### Step 1: Brand Opens Creator Collab Link

**Page:** `/collab/:username`

**What brand sees:**
- Creator profile header (name, followers, niche badge)
- Creator's collaboration packages (Pre-built service cards: Reel × 1, Story Pack × 3, etc.)
- Each package shows: deliverable type, quantity, price, deadline
- Trust badges: "Legally binding · Secure · CreatorArmour protected"

**Primary action:** Tap a package to select it

**Required:** None — just browsing

**Optional (shown later):** None at this stage

**Delayed:** Product details, campaign brief, brand contact — all come AFTER first offer sent

**Notifications:** None — this is passive browsing

**UX notes:**
- Packages are the hero. Brand should understand what creator offers WITHOUT reading anything
- Do NOT show a form at this step — show packages first, form comes next
- "Send Offer" CTA appears after package selection, floating at bottom

---

### Step 2: Brand Chooses Service / Package

**What brand sees:**
- Selected package highlighted with a checkmark and "Selected" badge
- Pricing clearly shown (₹X or "Free product")
- Estimated timeline shown (e.g., "Delivery in 7 days")

**Primary action:** Confirm package selection

**Required:**
- Package selection (just one tap)

**Optional:** None

**Delayed:** Customization, add-ons, notes

**Notifications:** None

**UX notes:**
- This is a 1-tap selection — no forms, no friction
- If brand wants something custom, provide a "Custom deal" option that opens the full form
- Selected package should visually "pop" — elevated card, border highlight, checkmark icon
- Do NOT ask for brand name, email, Instagram, or any contact info yet

---

### Step 3: Brand Fills Quick Offer Form

**Page:** Same as Step 1 — form slides up or replaces packages

**What brand sees:**
- Creator name + selected package summary at top (so they don't forget what they picked)
- Minimal form with 3 fields

**Required fields:**
1. **Your budget (₹)** — number input, pre-filled with package price as suggestion
   - Label: "Your offer amount"
   - Helper: "The creator will see this directly"
2. **Deadline** — date picker
   - Default: package's suggested deadline
   - Min date: today + creator's minimum lead time
   - Helper: "When do you need the content?"
3. **Brief description** — textarea, 2-3 sentences
   - Label: "What should they create?"
   - Placeholder: "Review our new serum on your skin type. 30-60 second reel, honest feedback..."
   - Character hint: "2-3 sentences is enough"

**Optional fields (shown but NOT blocking):**
- **Brand name** — auto-filled if logged in
- **Brand Instagram** — helpful but not required
- **Product link** — for product reviews
- **Reference content** — link to examples you like

**NOT shown (delayed until after offer sent):**
- Campaign goals / KPI
- Usage rights terms
- Contract preferences
- Payment method details

**Notifications:** None

**UX notes:**
- This is the ONLY form before sending. Keep it short.
- Budget + Deadline + What = minimum viable offer
- Add a subtle hint: "You can add more details after the creator accepts"
- Form should auto-save to localStorage so brand can return without losing data
- "Send Offer" button shows the key info: "Send ₹X offer · Deadline: [date]"

---

### Step 4: Brand Sends Offer

**What brand sees:**
- Summary card: "You're sending this offer"
  - To: @creator_username
  - Package: Reel × 1
  - Amount: ₹X
  - Deadline: [date]
  - Brief: [first 80 chars...]
- Confirmation button: "Send Offer"
- Success screen after sending

**Required:** All 3 fields from Step 3

**Optional:** None

**What happens on send:**
- Offer created in database with status `pending`
- Creator receives push notification + in-app notification
- Creator receives email (if enabled)
- Brand sees success screen with deal tracking link

**Notifications sent:**
- ✅ Creator: "New offer from @brand! Tap to review"
- ✅ Brand: "Offer sent! We'll notify you when [creator] responds"

**Success screen shows:**
- "Offer sent ✅"
- Deal card with status: "Awaiting creator response"
- "Share this deal link with your team" (optional)
- "Add deal notes" link (brand's private notes, not visible to creator)

**UX notes:**
- One-click send — no second confirmation dialog
- Success screen should feel rewarding ("Your offer is with @creator")
- Give brand their deal tracking URL immediately
- Offer ID is shown — brand can reference this in any communication with creator

---

### Step 5: Brand Awaits Creator Response

**Page:** Brand Dashboard → "Sent Offers" tab

**What brand sees:**
- Deal card showing:
  - Creator name + photo
  - Package sent
  - Amount + deadline
  - Status badge: "Awaiting response" (yellow)
  - Time since sent: "2 hours ago"
- Empty state on dashboard before any offers

**Primary action:** Nothing to do — just wait

**What NOT to show here:**
- Do not show the creator's acceptance rate or past deals at this stage (not relevant yet)
- Do not prompt brand to send another offer

**Notifications:**
- If no response in 24h: "Reminder: [creator] hasn't responded to your offer yet"
- If 48h: "Your offer expires in [X] days unless [creator] responds"

**Delayed:**
- Contract / agreement — comes after creator accepts
- Payment details — comes after content approved
- Anything requiring creator action

**UX notes:**
- The waiting state should be calm and informative, not anxious
- Show expected response time ("Creators typically respond within 24 hours")
- Give brand the ability to retract the offer (with confirmation)
- Show expiration date of the offer so brand knows it's time-boxed

---

### Step 6: Creator Accepts or Counters

**What brand sees (push notification):**
- "@[creator] accepted your offer! 🎉 Review details and confirm"

**Brand Dashboard updates:**
- Deal status changes to: "Accepted — Awaiting your confirmation" (blue)
- Deal card expands to show:
  - Creator's accepted terms
  - If creator countered: creator's counter amount + notes
  - "Confirm Deal" button (prominent)

**If creator countered:**
- Show: Creator's counter offer amount + any notes
- Two buttons: "Accept Counter" | "Decline Counter"
- Counter details are clearly shown: what changed (amount, deadline, deliverables)

**Required:** None — just reviewing

**Notifications:**
- Push: "[@creator] accepted your offer — confirm to move forward"
- If countered: "[@creator] sent a counter offer"

**UX notes:**
- "Confirm Deal" should be the ONLY prominent action
- If countered, make the counter amount visually prominent (compare to original)
- Brand should be able to message creator from this screen
- Do not auto-progress — creator accepted, now brand must consciously confirm

---

### Step 7: Brand Confirms Final Details

**Page:** Deal detail page in brand dashboard

**What brand sees:**
- Full deal summary
  - Creator details
  - Deliverables (exact)
  - Amount
  - Deadline
  - Campaign brief
- "Add product details" section (if barter/hybrid) — this is NOW required
- "Add delivery address" section (for barter deals) — creator's address shown (masked: city only)
- "Add payment notes" section (optional) — "We'll pay via UPI on [date]"

**Required fields (appear NOW, were delayed from Step 3):**
- **Product name + description** (for barter deals) — brand fills this
- **Shipping address confirmation** — creator already provided city, brand confirms full address

**Optional fields:**
- **Payment schedule** — "We pay after approval" or "50% now, 50% after"
- **Notes for creator** — anything specific about the shoot
- **Private internal notes** — brand's team notes (not visible to creator)

**NOT shown yet:**
- Payment proof upload (comes after payment sent)
- Contract signing (may not be needed for simple deals)

**Primary action:** "Confirm Deal Details"

**Notifications sent:**
- ✅ Creator: "[@brand] confirmed the deal! You can start creating."
- ✅ Brand: "Deal confirmed. [Creator] has been notified to start."

**UX notes:**
- This is the "paperwork" step — keep it efficient, pre-fill what you know
- The product details form should be simple: product name, approx value, what's in the box
- Shipping address should auto-populate from creator's profile city, brand fills the rest
- After confirm: move deal to "In Progress" pipeline

---

### Step 8: Creator Submits Content

**What brand sees (push notification):**
- "[@creator] shared their content! Tap to review"

**Brand Dashboard:**
- Deal status: "Content submitted" (blue)
- Deal card shows:
  - Content link (clickable — opens Instagram)
  - Creator's note (if any)
  - "Approve" button
  - "Request Changes" button

**Required:** None — just reviewing

**What brand can do:**
1. **Approve** — one click
2. **Request Changes** — mandatory note explaining what needs changing
3. **Message Creator** — follow up without taking action

**Notifications (if no action in 48h):**
- "You have content awaiting review from [@creator]. Tap to review."

**UX notes:**
- Content link should open directly in a preview (if possible) or new tab
- If brand requests changes, give structured options: "Wrong product shown", "Video too short", "Audio quality", "Other" + free text
- Do not auto-approve — brand must consciously approve
- Set an expectation: "Creators typically deliver within [deadline]. You can request changes after review."

---

### Step 9: Brand Approves Content

**What brand sees:**
- Confirmation dialog: "Approve this content?"
  - Shows: content link, creator note, deal amount
  - Warning: "Once approved, payment will be due within 7 days"
  - Button: "Approve & Proceed to Payment"

**On approve:**
- Deal status → "Approved — Payment pending"
- Creator notified: "[@brand] approved your content! Payment incoming."
- Brand sees payment details section appear:
  - Amount due
  - Creator's UPI / bank details (from profile)
  - "Add payment notes" — "Paid via [UPI/Bank transfer] on [date]"

**Required:** None — one-click approval

**Optional:**
- Private rating of creator (1-5 stars, not shown publicly) — for brand's own tracking
- Internal notes about the collaboration

**Notifications sent:**
- ✅ Creator: "Your content was approved! 🎉"
- ✅ Creator: "Payment will be sent within 7 days"
- ✅ Brand dashboard: Payment section now active

**UX notes:**
- Make approval feel conclusive — this is a key moment
- Show a summary: what creator delivered vs what was agreed
- Be clear about payment timeline — brand should know WHEN to pay
- Do NOT assume payment method — show creator's UPI prominently
- Offer to "Mark payment sent" as next step, not auto-request

---

### Step 10: Brand Pays Creator Outside Platform

**This step happens OFF-platform.**

**What brand does:**
- Pays creator via UPI / bank transfer / Google Pay — outside CreatorArmour
- No platform involvement in the actual money transfer

**What brand sees on CreatorArmour:**
- Payment guidance card:
  - "Pay ₹[X] to [Creator Name]"
  - UPI: [creator's UPI] (tap to copy)
  - Bank: [if provided]
  - "Mark as Paid" button — this is the only platform action

**Required:** None — brand does this on their own

**Delayed:**
- Payment proof upload — comes after marking as sent (optional but encouraged)
- Receipt generation — automatic after mark-as-paid

**UX notes:**
- Make it impossible to not find the UPI — show it prominently with a "Copy" button
- If creator hasn't set UPI: "Creator hasn't added UPI yet. Remind them?" (triggers notification to creator)
- Don't pretend the platform handles the payment — be honest: "Transfer manually, then mark as sent"

---

### Step 11: Brand Marks Payment Sent

**What brand sees (before marking):**
- "Mark Payment Sent" button — large, green
- Clicking opens confirmation:
  - Amount: ₹[X]
  - To: @creator_username
  - Method: (dropdown: UPI / Bank Transfer / Cash / Other)
  - UTR number (optional): for bank transfers
  - "Add payment screenshot" (optional): uploads proof
  - Button: "Yes, payment sent"

**After marking as sent:**
- Deal status → "Payment sent — Awaiting creator confirmation"
- Creator receives notification: "[@brand] marked payment as sent! Please confirm when you receive it."
- Brand sees: "Waiting for [@creator] to confirm receipt"

**Optional at this stage:**
- Upload payment screenshot / UTR — stored for brand's records
- Add note: "Paid to [UPI/Account ending XXXX]"

**NOT required:**
- Creator's bank account details (already shown in Step 10)
- Any signature or contract

**Notifications sent:**
- ✅ Creator: "[@brand] marked payment as sent. Please confirm when you receive it."
- ✅ Brand (if no creator confirmation in 48h): "Has [@creator] received the payment? Confirm or follow up."

**UX notes:**
- "Mark as sent" is the key trust action — make it feel official but simple
- Offer to send a reminder to creator automatically
- Keep payment proof optional — reduces friction but gives record if needed later
- Show the 5-minute undo window on creator's side too (if creator confirms then realizes money didn't come, they can undo)

---

### Step 12: Deal Completed

**What brand sees:**
- Confirmation: "Deal completed! 🎉"
- Deal summary card:
  - Creator: @[username]
  - Content delivered: [link]
  - Amount paid: ₹[X]
  - Paid on: [date]
  - Payment method: [UPI/Bank]
- Private rating prompt: "Rate your experience with @[creator]" (1-5 stars + optional comment)
- "Leave a review" (public, optional) — builds creator's reputation
- "Send another offer" CTA — back to Step 1 with this creator pre-selected

**What creator sees:**
- Deal marked as "Completed"
- CreatorArmour can prompt creator to "Share your work" on their profile

**Notifications sent:**
- ✅ Both: "Deal completed! Thank you for using CreatorArmour."
- Optional: "Share your collaboration" prompt (public link)

**Post-completion:**
- Creator's profile updates: past collaborations count +1
- Both parties can leave private ratings (visible only to platform, used for trust scores)
- Platform can prompt for public review (optional for both)

**UX notes:**
- This is the emotional end of the journey — make it feel satisfying
- Rating should be optional, not a gate
- "Send another offer" should pre-fill the creator's collab link — lowest friction for repeat deals
- Give brand a shareable deal summary (for their own records or case studies)

---

## Summary: What to Collect When

| Field | Step 1 (Browse) | Step 3 (Quick Form) | Step 7 (Confirm) | Step 11 (Mark Paid) |
|---|---|---|---|---|
| Package selection | ✅ | | | |
| Budget | | ✅ Required | | |
| Deadline | | ✅ Required | | |
| Campaign brief | | ✅ Required | | |
| Brand name | | Auto-filled | | |
| Brand Instagram | | Optional | | |
| Product details | | | ✅ Required (barter) | |
| Shipping address | | | ✅ Required (barter) | |
| Payment notes | | | Optional | |
| Payment method | | | | Optional |
| UTR / screenshot | | | | Optional |
| Private rating | | | | | ✅ Optional |

---

## Notification Map

| Event | Brand gets | Creator gets |
|---|---|---|
| Offer sent | ✅ Confirmation | ✅ New offer |
| Creator accepts | ✅ Accepted | |
| Creator counters | ✅ Counter offer | |
| Brand confirms deal | ✅ Confirmed | ✅ Confirmed |
| Creator submits content | ✅ Submitted | |
| Brand approves | | ✅ Approved |
| Brand marks paid | | ✅ Marked paid |
| Creator confirms receipt | ✅ Receipt confirmed | |
| Deal completes | ✅ Completed | ✅ Completed |
| 24h no response (offer) | | ⚠️ Reminder |
| 48h no content review | ⚠️ Review reminder | |
| 48h no payment confirm | | ⚠️ Payment follow-up |

---

## Proposed Brand Dashboard Layout

```
┌─────────────────────────────────────────────┐
│  Brand Dashboard                            │
│  [Sent Offers] [Active Deals] [Completed]    │
├─────────────────────────────────────────────┤
│  Sent Offers (pending response)             │
│  ┌────────────────────────────────────────┐ │
│  │ @creator_name  ·  Reel × 1             │ │
│  │ ₹5,000  ·  Due: Mar 20                │ │
│  │ [Awaiting response]  ·  Sent 2h ago   │ │
│  │ [Retract offer]                         │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  Active Deals (confirmed, in progress)      │
│  ┌────────────────────────────────────────┐ │
│  │ @creator_name  ·  Reel × 1             │ │
│  │ ₹5,000  ·  Deadline: Mar 25           │ │
│  │ [Content submitted] → [Review] [Approve]│
│  └────────────────────────────────────────┘ │
│                                             │
│  Payment Pending                            │
│  ┌────────────────────────────────────────┐ │
│  │ @creator_name  ·  Approved             │ │
│  │ ₹5,000  ·  Pay by: Mar 22             │ │
│  │ UPI: creator@oksbi  [Copy] [Paid →]    │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  Completed                                  │
│  ┌────────────────────────────────────────┐ │
│  │ @creator_name  ·  Reel × 1  ·  ₹5,000  │ │
│  │ Paid Mar 18  ·  [★★★☆☆] [Review]       │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|---|---|
| `CollabLinkLanding.tsx` | Already done — budget field, deadline validation |
| `BrandNewDealPage.tsx` | Redirects to collab link; keep minimal |
| `BrandDashboard.tsx` | Add "Sent Offers" tab with retract + track |
| `BrandDealConsole.tsx` | Simplify — approve/request changes/mark paid |
| `PaymentDetailPage.tsx` | Add "Mark Payment Sent" flow for brand side |
| `CollabRequestBriefPage.tsx` | Creator side — keep accept/counter/decline |
| Notification hooks | Add push notifications for brand-side events |
| Supabase DB | Add `deal_status` transitions + `payment_sent_at` |

---

## Next Steps (Priority Order)

1. **Fix Step 5–6**: Build brand dashboard "Sent Offers" tab with accept/counter/decline states
2. **Fix Step 9–11**: Simplify payment flow — show UPI, "Mark as Paid" button, no proof required
3. **Fix Step 8**: Make content review on brand side simpler — preview + Approve / Request Changes inline
4. **Add Step 12**: Post-completion summary + rating flow
5. **Notifications**: Set up push notifications for all events above
6. **Mobile polish**: All sticky CTAs must remain visible during dialogs
