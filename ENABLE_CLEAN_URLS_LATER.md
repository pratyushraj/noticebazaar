# 🔧 How to Enable Clean URLs (BrowserRouter) on Render

Currently using HashRouter for compatibility. To enable clean URLs (`/login` instead of `/#/login`):

## ✅ Step 1: Configure Render Redirects/Rewrites

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Open `creatorarmour-frontend` service
   - Click **Settings** (left sidebar)

2. **Configure Redirects:**
   - Under **"MANAGE"** section, click **"Redirects/Rewrites"**
   - Click **"Add Redirect"** or **"Add Rewrite"**
   - Configure:
     - **Source/From:** `/*`
     - **Destination/To:** `/index.html`
     - **Status Code:** `200` (MUST be 200, not 301/302)
   - Click **Save**

3. **Verify:**
   - The rewrite rule should appear in the list
   - Status should show as active

## ✅ Step 2: Switch to BrowserRouter

Once redirects are configured, update the code:

```typescript
// In src/App.tsx, change:
import { HashRouter } from 'react-router-dom';
// To:
import { BrowserRouter } from 'react-router-dom';

// And change:
<HashRouter>
// To:
<BrowserRouter>
```

Also update hardcoded navigation:
```typescript
// In src/components/ui/ErrorFallback.tsx:
window.location.href = '/creator-dashboard'; // Remove # prefix

// In src/lib/hooks/useAuth.ts:
window.location.href = '/login'; // Remove # prefix
```

## ✅ Step 3: Commit and Push

```bash
git add src/App.tsx src/components/ui/ErrorFallback.tsx src/lib/hooks/useAuth.ts
git commit -m "Switch to BrowserRouter - Render SPA routing configured"
git push
```

## ✅ Step 4: Test

After Render redeploys:
- ✅ `/login` should work (clean URL)
- ✅ `/creator-onboarding` should work
- ✅ `/creator-dashboard` should work
- ✅ All routes work with clean URLs (no `#`)

---

## 📝 Current Status

- ✅ HashRouter active (works immediately)
- ✅ All routes work with `#` prefix
- ⏳ Waiting for Render Redirects/Rewrites configuration
- ⏳ Then can switch to BrowserRouter for clean URLs

---

## 🎯 Why This Matters

- **HashRouter:** Works immediately, URLs like `/#/login`
- **BrowserRouter:** Requires server config, URLs like `/login` (cleaner, better SEO)

Once you configure Render redirects, you can switch to BrowserRouter for better URLs!

