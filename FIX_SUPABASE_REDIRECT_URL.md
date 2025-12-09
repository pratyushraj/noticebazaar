# Fix Supabase OAuth Redirect URL

## Problem
Supabase is redirecting to `https://noticebazaar.com/#/login` instead of `https://noticebazaar.com/#/creator-dashboard` after OAuth.

## Solution: Update Supabase Dashboard Settings

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj
2. Go to **Authentication** → **URL Configuration**

### Step 2: Update Site URL
**Current (WRONG):**
```
https://noticebazaar.com/#/login
```

**Should be:**
```
https://noticebazaar.com
```

**OR:**
```
https://noticebazaar.com/
```

⚠️ **Important:** The Site URL should NOT include the hash route (`/#/login`). It should be just the domain.

### Step 3: Update Redirect URLs
Add these URLs to the **Redirect URLs** list:

```
https://noticebazaar.com/**
https://noticebazaar.com/#/creator-dashboard
https://noticebazaar.com/#/creator-onboarding
https://noticebazaar.com/#/login
http://localhost:8080/**
http://localhost:8080/#/creator-dashboard
```

The `**` wildcard allows all routes under that domain.

### Step 4: Save Changes
Click **Save** and wait a few seconds for changes to propagate.

## Why This Matters

- **Site URL**: This is the base URL Supabase uses. It should be your domain without any hash routes.
- **Redirect URLs**: These are the allowed redirect destinations after OAuth. The `redirectTo` parameter in `signInWithOAuth()` must match one of these URLs.

## Current Code Configuration

In `src/pages/Login.tsx`, we're setting:
```typescript
redirectTo: `${window.location.origin}/#/creator-dashboard`
```

This should work IF:
1. Site URL is set to `https://noticebazaar.com` (not `/#/login`)
2. `https://noticebazaar.com/**` is in the Redirect URLs list

## After Updating

1. Wait 1-2 minutes for Supabase to update
2. Clear browser cache/cookies
3. Test OAuth login again
4. Should redirect to `/#/creator-dashboard` instead of `/#/login`

