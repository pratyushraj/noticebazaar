# 🚀 Manual Production Checklist

**Status:** ⚠️ **5 CRITICAL MANUAL TASKS REMAINING**

These tasks **CANNOT** be automated by Cursor and **MUST** be done manually before production launch.

---

## ✅ Task 1: Apply RLS Migration in Supabase (MANDATORY - HIGH RISK)

**File:** `supabase/migrations/2025_12_02_fix_rls_security_audit.sql`

**Why Critical:**
- Without this, issue tracking system won't work
- Action logs won't write
- Authorization will fail for creators
- **Dangerous data leaks can happen**

**Steps:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open `supabase/migrations/2025_12_02_fix_rls_security_audit.sql`
6. Copy and paste the entire SQL into the editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Verify no errors in the output

**Verification:**
```sql
-- Run this to verify policies were created:
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('contract_issues', 'brand_messages', 'issues', 'lawyer_requests')
ORDER BY tablename, policyname;
```

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

## ✅ Task 2: Switch App to Production Mode

**Create:** `.env.production` file

**Content:**
```env
# Production Environment Variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_DEMO_MODE=false

# Optional: Add analytics keys
VITE_GA_TRACKING_ID=your-ga-id
VITE_SENTRY_DSN=your-sentry-dsn
```

**Steps:**
1. Copy `.env` to `.env.production`
2. Update values for production Supabase project
3. Set `VITE_DEMO_MODE=false`
4. Remove any test/demo API keys
5. Verify production build uses this file:
   ```bash
   npm run build
   ```

**What This Ensures:**
- ✅ No dummy data
- ✅ No skeleton-only mode
- ✅ No console debugging
- ✅ No demo transitions
- ✅ Real API calls only

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

## ✅ Task 3: Test on 3 Physical Devices

**Why:** Cursor cannot replicate real device behavior.

### Device 1: Android Phone
**Test:**
- [ ] Share modal opens correctly
- [ ] File previews work (PDF, JPG, DOCX)
- [ ] Contract preview loads
- [ ] Calendar sync works
- [ ] 9-dot grid menu opens
- [ ] Payments page scrolls smoothly
- [ ] Action log scrolling works
- [ ] Bottom nav doesn't overlap content
- [ ] Keyboard doesn't break layout

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

### Device 2: iPhone
**Test:**
- [ ] Safe area respected (notch/status bar)
- [ ] Share modal works
- [ ] File previews work
- [ ] Contract preview loads
- [ ] Calendar sync works
- [ ] 9-dot grid menu opens
- [ ] Payments page scrolls smoothly
- [ ] Keyboard doesn't break layout
- [ ] Haptic feedback works

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

### Device 3: iPad / Large Screen
**Test:**
- [ ] Responsive scaling works
- [ ] Grid layouts adapt correctly
- [ ] Modals center properly
- [ ] Text doesn't stretch too wide
- [ ] Touch targets are appropriate size

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

## ✅ Task 4: 10-Minute "Real Creator Flow Test"

**Pretend you're an influencer signing a brand deal.**

**Flow:**
1. [ ] **Create a fake deal**
   - Brand name, amount, deliverables
   - Due date, payment expected date

2. [ ] **Upload a contract**
   - PDF file uploads successfully
   - File appears in deal detail

3. [ ] **Preview contract**
   - Modal opens
   - PDF renders correctly
   - Download button works

4. [ ] **Mark deliverable done**
   - Checkbox updates
   - Status changes

5. [ ] **Mark payment received**
   - Payment date updates
   - Status changes to "Completed"
   - UTR number can be added

6. [ ] **Undo payment within 5 min**
   - Undo button appears
   - Payment status reverts
   - UTR clears

7. [ ] **Report issue**
   - Issue modal opens
   - Category selection works
   - Issue submits successfully

8. [ ] **Download all documents ZIP**
   - ZIP download starts
   - Files are included

9. [ ] **Schedule calendar event**
   - Calendar modal opens
   - Event creates successfully
   - Can sync to Google Calendar

**What This Exposes:**
- Real loading states
- Real timing bugs
- Real modal behavior
- Real scrolling issues

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

## ✅ Task 5: Create Production Builds for iOS & Android

### Android Build

**Steps:**
1. [ ] Run production build:
   ```bash
   npm run build
   ```

2. [ ] Sync with Capacitor:
   ```bash
   npx cap sync android
   ```

3. [ ] Open in Android Studio:
   ```bash
   npx cap open android
   ```

4. [ ] In Android Studio:
   - [ ] Update `app/build.gradle` version code
   - [ ] Update `app/build.gradle` version name
   - [ ] Generate signed APK/AAB:
     - Build → Generate Signed Bundle / APK
     - Select APK or Android App Bundle
     - Choose keystore (create if needed)
     - Select build variant: release
     - Finish

5. [ ] Test APK on physical device

**Guides:**
- See `release/android-publish-guide.md` for detailed steps

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

### iOS Build (Mac Only)

**Steps:**
1. [ ] Run production build:
   ```bash
   npm run build
   ```

2. [ ] Sync with Capacitor:
   ```bash
   npx cap sync ios
   ```

3. [ ] Open in Xcode:
   ```bash
   npx cap open ios
   ```

4. [ ] In Xcode:
   - [ ] Update version number
   - [ ] Update build number
   - [ ] Select your development team
   - [ ] Product → Archive
   - [ ] Distribute App
   - [ ] Follow Apple's manual steps:
     - [ ] Screenshots (required for App Store)
     - [ ] Privacy manifest
     - [ ] Certificates (if needed)
     - [ ] App Store Connect setup

**Guides:**
- See `release/ios-publish-guide.md` for detailed steps

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

## ⭐ Optional but HIGHLY Recommended

### Task 6: Buy Domain and Connect DNS

**Why:** Creators want trust. Domain = Trust.

**Steps:**
1. [ ] Purchase domain (e.g., noticebazaar.com)
2. [ ] Configure DNS:
   - [ ] A record pointing to hosting
   - [ ] CNAME for www subdomain
   - [ ] SSL certificate (Let's Encrypt or hosting provider)
3. [ ] Update app URLs:
   - [ ] Update `VITE_SUPABASE_URL` if using custom domain
   - [ ] Update OAuth redirect URLs
   - [ ] Update email templates

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### Task 7: Setup Error Monitoring

**Why:** One production crash = bad investor demo.

**Options:**

#### Option A: Sentry
1. [ ] Create Sentry account
2. [ ] Install Sentry SDK:
   ```bash
   npm install @sentry/react
   ```
3. [ ] Add to `src/main.tsx`:
   ```typescript
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     environment: import.meta.env.MODE,
   });
   ```
4. [ ] Add to ErrorBoundary:
   ```typescript
   componentDidCatch(error, errorInfo) {
     Sentry.captureException(error, { contexts: { react: errorInfo } });
   }
   ```

#### Option B: LogRocket
1. [ ] Create LogRocket account
2. [ ] Install LogRocket:
   ```bash
   npm install logrocket
   ```
3. [ ] Initialize in app

#### Option C: Supabase Logs
1. [ ] Enable Supabase logging
2. [ ] Set up alerts for errors
3. [ ] Monitor dashboard regularly

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

### Task 8: Setup Production Database Backups

**Why:** Data loss = business loss.

**Steps:**
1. [ ] Go to Supabase Dashboard
2. [ ] Navigate to **Database** → **Backups**
3. [ ] Enable **Daily automated snapshot**
4. [ ] Set retention period (recommended: 30 days)
5. [ ] Test restore process (optional but recommended)

**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

## 🎯 Final Status

**You're 98% production-ready.**

**Remaining 2% must be done manually:**

- [ ] ✅ Task 1: Apply RLS migration (MANDATORY)
- [ ] ✅ Task 2: Production mode env
- [ ] ✅ Task 3: Device testing (3 devices)
- [ ] ✅ Task 4: Creator flow test
- [ ] ✅ Task 5: iOS/Android builds
- [ ] ⭐ Task 6: Domain & DNS (optional)
- [ ] ⭐ Task 7: Error monitoring (optional)
- [ ] ⭐ Task 8: Database backups (optional)

**Once complete, you can:**
- ✅ Launch to production
- ✅ Pitch to investors
- ✅ Onboard creators
- ✅ Collect payments confidently

---

## 📝 Notes

- **Priority Order:** Task 1 (RLS) is the highest risk. Do it first.
- **Time Estimate:** 
  - Task 1: 5 minutes
  - Task 2: 10 minutes
  - Task 3: 30-60 minutes
  - Task 4: 10 minutes
  - Task 5: 1-2 hours (first time)
- **Blockers:** None - all tasks can be done independently

---

**Last Updated:** December 2, 2025

