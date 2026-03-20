# 🔧 Fix Google OAuth Login with HashRouter

## Problem
Google OAuth login not working because redirect URLs don't match HashRouter format.

## ✅ Fix Applied

Updated OAuth redirect URLs to use hash prefix:

1. **Login.tsx**: `redirectTo={window.location.origin}` → `redirectTo={window.location.origin}/#/`
2. **Signup.tsx**: `redirectTo={window.location.origin}/creator-onboarding` → `redirectTo={window.location.origin}/#/creator-onboarding`
3. **Supabase Client**: `getRedirectUrl()` now returns `${window.location.origin}/#/`

## 📝 Supabase Redirect URLs Configuration

Make sure these URLs are in your Supabase **Redirect URLs** list:

```
https://noticebazaar.com/#/**
https://www.noticebazaar.com/#/**
https://noticebazaar-frontend.onrender.com/#/**
http://localhost:8080/#/**
http://localhost:5173/#/**
```

**Note:** The `#/**` pattern allows all hash-based routes.

## ✅ After Fix

1. **Google Login** will redirect to: `https://noticebazaar.com/#/`
2. **Google Signup** will redirect to: `https://noticebazaar.com/#/creator-onboarding`
3. **OAuth callbacks** will work correctly with HashRouter

## 🧪 Test

1. Go to `/login` (or `/#/login`)
2. Click "Sign in with Google"
3. Complete Google OAuth
4. Should redirect back to `/#/` or `/#/creator-onboarding`
5. Session should be established

---

## 🔄 If Switching to BrowserRouter Later

When you switch to BrowserRouter (after configuring Render redirects):

1. Update redirect URLs back to clean URLs:
   - Login: `redirectTo={window.location.origin}`
   - Signup: `redirectTo={window.location.origin}/creator-onboarding`
   - Supabase client: `return window.location.origin`

2. Update Supabase Redirect URLs to:
   ```
   https://noticebazaar.com/**
   https://www.noticebazaar.com/**
   ```

---

## 📋 Current Status

- ✅ OAuth redirect URLs updated for HashRouter
- ✅ Supabase client configured for hash-based redirects
- ⏳ Need to verify Supabase Redirect URLs include `#/**` patterns
- ⏳ Test Google login after deployment

