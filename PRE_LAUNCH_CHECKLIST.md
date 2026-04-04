# Creator Armour — Pre-Launch Checklist

## ✅ Code: Already Done
- Terms of Service: `/terms-of-service` ✅ linked in footer
- Privacy Policy: `/privacy-policy` ✅ linked in footer
- Refund Policy: `/refund-policy` ✅ (route exists)
- Public auth routes (login, signup, reset-password) ✅
- Email templates (offer received, deal accepted, etc.) ✅

## ⚠️ Configuration Needed (not code) — These block email sending

### 1. RESEND_API_KEY (Critical — no emails without this)
**Where:** Render dashboard → noticebazaar-api service → Environment Variables
**Value:** Your Resend API key from resend.com
**Impact:** Transactional emails silently fail (no crash, just don't send)
**Files affected:** All `*EmailService.ts` files in `api/server/services/`

### 2. Supabase Email Confirmation
**Where:** Supabase dashboard → Authentication → Email auth → Confirm email = ON
**Impact:** Users can sign up without verifying their email address

### 3. Verify RLS Policies (Can't test without DB access)
**Where:** Supabase dashboard → Table Editor → profiles → Policies
**Check:** Brands should be able to SELECT creators profiles table (for /api/creators)
**Impact:** Creator search/discover may return empty results if RLS blocks reads

## 🧪 Testing Steps (do before launch)

### Auth Flow
1. Open creatorarmour.com → Signup
2. Check email inbox for verification link
3. Complete profile setup
4. Share collab link

### Brand → Creator Flow
1. Open incognito → creatorarmour.com → Signup as brand
2. Go to /brand-discover
3. Search or browse creators
4. Click "Send Offer"
5. Fill and submit offer form
6. Open creator inbox → accept offer

### Email Testing
1. Submit a collab request as a brand
2. Check creator email inbox — should receive offer notification
3. If no email arrives → RESEND_API_KEY is likely not set

## 🚀 Launch Day
1. All config items above checked ✅
2. Test auth flow end-to-end ✅
3. Test brand → creator offer flow ✅
4. Disable any test accounts
5. Set Supabase rate limiting (if available)
