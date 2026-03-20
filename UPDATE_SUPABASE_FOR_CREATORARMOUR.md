# Update Supabase Configuration for CreatorArmour

## ⚠️ CRITICAL: Fix Google OAuth 400 Error

The error occurs because Supabase is still configured with `noticebazaar.com` but your app now uses `creatorarmour.com`.

## Step 1: Update Supabase Dashboard Settings

### 1.1 Update Site URL

1. Go to: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj
2. Navigate to: **Authentication** → **URL Configuration**
3. Update **Site URL** from:
   ```
   https://noticebazaar.com
   ```
   To:
   ```
   https://creatorarmour.com
   ```

### 1.2 Update Redirect URLs

In the same **URL Configuration** page, update the **Redirect URLs** list:

**Remove old URLs:**
- `https://noticebazaar.com/**`
- `https://noticebazaar.com/#/creator-dashboard`
- `https://noticebazaar.com/#/creator-onboarding`

**Add new URLs:**
```
https://creatorarmour.com/**
https://creatorarmour.com/#/creator-dashboard
https://creatorarmour.com/#/creator-onboarding
https://creatorarmour.com/#/login
http://localhost:8080/**
http://localhost:8080/#/creator-dashboard
http://localhost:8080/#/creator-onboarding
http://localhost:32100/**
```

**Note:** The `**` wildcard allows all routes under that domain.

### 1.3 Save Changes

Click **Save** and wait 1-2 minutes for changes to propagate.

## Step 2: Update Google OAuth App (if applicable)

If you have a Google OAuth app configured:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Update **Authorized JavaScript origins**:
   - Remove: `https://noticebazaar.com`
   - Add: `https://creatorarmour.com`
4. Update **Authorized redirect URIs**:
   - Remove: `https://ooaxtwmqrvfzdqzoijcj.supabase.co/auth/v1/callback` (if it had noticebazaar.com in the config)
   - Ensure: `https://ooaxtwmqrvfzdqzoijcj.supabase.co/auth/v1/callback` is present

## Step 3: Verify Configuration

After updating:

1. **Clear browser cache and cookies**
2. **Test Google OAuth signup** again
3. Should redirect to `https://creatorarmour.com/#/creator-onboarding` (or localhost for local dev)

## Why This Fixes the Error

The 400 error occurs because:
- Supabase JWT token has `site_url: "https://noticebazaar.com"`
- Your app is trying to redirect to `localhost:8080` or `creatorarmour.com`
- Google OAuth sees this mismatch and rejects the request

Updating Supabase configuration to use `creatorarmour.com` will fix the JWT token and allow OAuth to work correctly.

