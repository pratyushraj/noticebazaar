# Quick Setup: Supabase Redirect URLs

## ✅ Step 1: Set FRONTEND_URL Secret (DONE via CLI)

The `FRONTEND_URL` secret has been set via CLI. Verify it:

```bash
supabase secrets list --project-ref ooaxtwmqrvfzdqzoijcj
```

## 📋 Step 2: Add Redirect URLs in Supabase Dashboard

**You need to do this manually in the Dashboard:**

1. **Open Supabase Dashboard**: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj
2. **Go to Authentication**:
   - Click **Authentication** in left sidebar
   - Click **URL Configuration** tab
3. **Add Redirect URLs** (click "Add URL" for each):
   - `http://localhost:32100/**`
   - `https://noticebazaar.com/**`
   - `https://*.vercel.app/**` (if using Vercel)
4. **Set Site URL**:
   - In the same page, set **Site URL** to: `https://noticebazaar.com`
5. **Click Save**

## 🎯 Why This Matters

Even though the code auto-detects origins, adding these URLs to Supabase:
- ✅ Provides a fallback if origin detection fails
- ✅ Allows Supabase to validate redirect URLs
- ✅ Prevents "redirect_uri_mismatch" errors
- ✅ Works better with OAuth providers

## ✨ Current Status

- ✅ Code auto-detects origin (already working)
- ✅ Edge Function uses request origin (deployed)
- ✅ FRONTEND_URL secret set (done via CLI)
- ⏳ Redirect URLs in Dashboard (you need to add these)

The app should work even without Step 2, but adding the redirect URLs makes it more reliable.

