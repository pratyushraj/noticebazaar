# What else to check (after Supabase migrations)

Use this after `supabase db push` is done to confirm everything works.

---

## 1. Migration status

- [ ] `supabase migration list` — pending migrations (empty Remote) are applied or intentionally skipped.
- [ ] In Supabase Dashboard → Table Editor: `profiles` has `content_niches`, `open_to_collabs`, `media_kit_url`; `collab_requests` has `brand_address`, `brand_gstin`, `brand_contact_id`; `brand_deals` has `brand_contact_id`; `brand_contacts` table exists.

---

## 2. Hash → path redirect (old email links)

- [ ] Open `http://localhost:8080/#/contract-ready/any-token` → should redirect to `/contract-ready/any-token` (no `#`).
- [ ] Same for `/#/ship/:token`, `/#/deal-details/:token`, `/#/creator-dashboard`, `/#/deal/:token`, `/#/feedback/:token`.

---

## 3. Collab link form (brand address + GSTIN)

- [ ] Creator collab link page: form has **Company / Brand Address** (required) and optional **GSTIN**.
- [ ] **Fetch from GST** (if present): enter valid GSTIN → brand name/address fill; form still submits with your data.
- [ ] Submit form with address (and optional GSTIN) → request is created; in DB, `collab_requests.brand_address` and `collab_requests.brand_gstin` are set.

---

## 4. Brand contacts (agency)

- [ ] After collab submit: in DB, `collab_requests.brand_contact_id` is set and `brand_contacts` has a row for that email.
- [ ] After accepting a collab (deal created): `brand_deals.brand_contact_id` is set; same or updated `brand_contacts` row.

---

## 5. Creator agency profile fields

- [ ] `profiles.content_niches`, `open_to_collabs`, `media_kit_url` exist and are readable (e.g. Creator profile/settings if you expose them).
- [ ] Any new UI that edits these fields saves and loads correctly.

---

## 6. SessionContext (no repeated timeouts on dashboard)

- [ ] Log in → go to **Creator dashboard** (`/creator-dashboard`).
- [ ] Refresh or wait for token refresh; open DevTools console.
- [ ] No repeated 2.5s timeouts or “profile fetch” errors when already on dashboard.

---

## 7. Server and env

- [ ] `cd server && pnpm run dev` — server starts (no EADDRINUSE; port 3001 free if already in use).
- [ ] `.env`: `RESEND_API_KEY`, Supabase URL + keys, GST API key (if used) set and valid.

---

## 8. Email links (path-based, no hash)

- [ ] Trigger an email that contains app links (e.g. contract ready, collab confirmation).
- [ ] Links in email are path-based (e.g. `https://yourapp.com/contract-ready/TOKEN`) and **not** `/#/contract-ready/TOKEN`.

---

## 9. Contract content (address + GSTIN)

- [ ] Accept a collab request that had **brand address** (and optional **GSTIN**).
- [ ] Generate/download contract: it includes brand address and GSTIN (if provided).

---

## 10. Smoke test

- [ ] Login → Creator dashboard loads.
- [ ] Open a deal (or deal details) → page loads.
- [ ] Contract ready / ship / feedback links (with real or test tokens) open the right pages.

---

**Optional:** Run app and server, then go through the list in order. If any item fails, fix that before moving on.
