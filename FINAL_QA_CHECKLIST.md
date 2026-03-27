# Final QA Checklist - Opportunities Feature

## ✅ Pre-Deployment Verification

Use this checklist after running `npm run sync-brands` and before deploying to production.

---

## 1. Brand Sync Validation

### Run Sync Script
```bash
npm run sync-brands
```

**Check:**
- [ ] No scraper crashes
- [ ] All three platforms (influencer.in, Winkl, Collabstr) attempted
- [ ] Logs show opportunities found
- [ ] No critical errors in console

### Database Validation
```bash
tsx scripts/validate-opportunities-db.ts
```

**Check:**
- [ ] Validation script passes
- [ ] No invalid apply URLs (localhost/noticebazaar)
- [ ] No expired opportunities marked as open
- [ ] All opportunities have brand_id
- [ ] Warnings logged for missing apply_url (expected)

---

## 2. BrandDetails Page (`/brands/:brandId`)

### UI Elements
- [ ] Brand logo/avatar displays
- [ ] Brand name and industry visible
- [ ] Rating and payment time shown (if available)
- [ ] Budget section shows fallback when absent
- [ ] Up to 4 opportunities displayed
- [ ] Source badges visible (Winkl/Collabstr/influencer.in)

### Compliance Modal
1. Click "Apply" button on any opportunity
2. **Verify:**
   - [ ] Modal opens immediately
   - [ ] Text matches: "You'll apply on the brand's original website. We don't collect or store your submission."
   - [ ] Cancel button visible and works
   - [ ] Continue button visible
   - [ ] Click Cancel → Modal closes
   - [ ] Click Continue → External website opens in new tab
   - [ ] No console errors

### Edge Cases
- [ ] Brand with 0 opportunities → Empty state shows
- [ ] Brand with missing budget → "Budget Not Provided" shown
- [ ] Opportunity with no description → "No description available" shown

---

## 3. BrandOpportunities Page (`/brands/:brandId/opportunities`)

### List Display
- [ ] All active opportunities listed
- [ ] Sorted by earliest deadline first
- [ ] Each opportunity card shows:
  - [ ] Title
  - [ ] Description (or fallback)
  - [ ] Budget (or "Budget Not Provided")
  - [ ] Deadline
  - [ ] Deliverable type
  - [ ] Platforms (if available)
  - [ ] Min followers (if available)
  - [ ] Source badge

### Modal Handling
1. Click "Apply Now" on any opportunity
2. **Verify:**
   - [ ] Modal opens
   - [ ] Text: "You'll apply on the brand's original website. We don't collect or store your submission."
   - [ ] Cancel button works
   - [ ] Continue button opens external URL
   - [ ] External URL is correct marketplace

### Edge Cases
- [ ] Opportunity with missing apply_url → Button disabled with "Apply URL Not Available"
- [ ] Expired opportunities NOT shown
- [ ] Opportunities with zero budget show fallback

---

## 4. Mobile QA (390px width)

### Buttons
- [ ] All "Apply Now" buttons are ≥48px tall
- [ ] Modal buttons (Cancel/Continue) are ≥48px tall
- [ ] Buttons are easily tappable

### Layout
- [ ] Cards don't overflow viewport
- [ ] Modal fits on screen
- [ ] Modal is scrollable if content is long
- [ ] Text is readable (not too small)

### Touch Interactions
- [ ] All buttons respond to tap
- [ ] Modal backdrop closes on tap
- [ ] No accidental clicks

---

## 5. Security Validation

### URL Validation
Run sync script and check logs:
- [ ] No localhost URLs in database
- [ ] No noticebazaar.com URLs in database
- [ ] No 127.0.0.1 URLs in database
- [ ] Warnings logged for invalid URLs (if any)

### Database Check
```sql
-- Run in Supabase SQL Editor
SELECT id, title, apply_url 
FROM opportunities 
WHERE apply_url LIKE '%localhost%' 
   OR apply_url LIKE '%noticebazaar%'
   OR apply_url LIKE '%127.0.0.1%';
```
**Expected:** 0 rows

### Frontend Check
- [ ] Opportunities without apply_url show disabled button
- [ ] External links use `target="_blank"` and `rel="noopener,noreferrer"`
- [ ] No internal URLs in apply_url field

---

## 6. Error State Validation

### Network Errors
1. Open browser DevTools → Network tab
2. Set to "Offline"
3. Navigate to `/brand-directory`
4. **Verify:**
   - [ ] Error state displays
   - [ ] "Retry" button available
   - [ ] No crash/white screen

### Missing Data
- [ ] Brand not found → Shows "Brand Not Found"
- [ ] No opportunities → Shows empty state with message
- [ ] Missing fields → Fallbacks display correctly

---

## 7. Accessibility Checklist

### Keyboard Navigation
- [ ] Tab navigation works through all buttons
- [ ] Enter/Space activates buttons
- [ ] Escape closes modal
- [ ] Focus ring visible on focused elements

### Screen Reader
- [ ] All buttons have accessible labels
- [ ] Modal has proper ARIA attributes
- [ ] Images have alt text

### Focus Management
- [ ] Modal traps focus (can't tab outside)
- [ ] Focus returns to trigger button when modal closes
- [ ] Focus visible on all interactive elements

---

## 8. Performance Checklist

### Load Times
- [ ] Brand Directory loads < 1s
- [ ] Brand Details loads < 700ms
- [ ] Opportunities page loads < 700ms
- [ ] No React hydration errors

### Console Checks
- [ ] No undefined errors
- [ ] No React warnings
- [ ] No network errors (when online)

---

## 9. Automated Testing

### Run E2E Tests
```bash
npx playwright test tests/e2e/opportunities-flow.spec.ts
```

**Verify:**
- [ ] All tests pass
- [ ] No flaky tests
- [ ] Mobile tests pass

### Run Database Validation
```bash
tsx scripts/validate-opportunities-db.ts
```

**Verify:**
- [ ] Validation passes
- [ ] No critical errors
- [ ] Warnings are acceptable

---

## 10. Cross-Browser Testing

Test on:
- [ ] Chrome/Edge (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop)
- [ ] Chrome (Mobile)
- [ ] Safari (iOS)

**Check:**
- [ ] All features work
- [ ] Modal displays correctly
- [ ] External links open
- [ ] No browser-specific errors

---

## 🎯 Quick Validation Script

Run this one-liner to check everything:

```bash
# 1. Sync brands
npm run sync-brands

# 2. Validate database
tsx scripts/validate-opportunities-db.ts

# 3. Run E2E tests
npx playwright test tests/e2e/opportunities-flow.spec.ts

# 4. Check for TypeScript errors
npm run type-check  # if available
```

---

## ✅ Sign-Off

Once all items are checked:

- [ ] All critical items pass
- [ ] Warnings are acceptable
- [ ] Mobile tested
- [ ] Security validated
- [ ] Ready for production

**Deploy! 🚀**

---

## 📝 Notes

- Some warnings (missing apply_url) are expected if scrapers can't find links
- Empty states are intentional when no data exists
- Budget/description fallbacks are working as designed
- External URL validation prevents security issues

