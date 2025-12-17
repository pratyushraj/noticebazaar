# Fix Google OAuth "Unable to exchange external code" Error

## Problem
After clicking "Sign up with Google", users see:
- Error: `Unable to exchange external code`
- URL: `creatorarmour.com/?error=server_error&error_code=unexpected_failure&error_description=...`
- 404 page instead of proper error handling

## ✅ Error Handling Fixed
The app now:
1. ✅ Detects OAuth errors in URL query parameters
2. ✅ Cleans the URL to prevent 404 routing issues
3. ✅ Shows user-friendly error messages
4. ✅ Redirects to login/signup page with error toast

## Root Cause: OAuth Configuration Issue

The error "Unable to exchange external code" means Supabase cannot exchange the OAuth authorization code with Google. This typically happens due to:

### 1. Client ID/Secret Mismatch
**Check:**
- Google Cloud Console → APIs & Services → Credentials
- Supabase Dashboard → Authentication → Providers → Google

**Verify:**
- Client ID matches **exactly** (including hyphens)
- Client Secret matches **exactly** (including all characters)
- No extra spaces or line breaks

### 2. Redirect URI Mismatch
**Required in Google Cloud Console:**
```
https://ooaxtwmqrvfzdqzoijcj.supabase.co/auth/v1/callback
```

**Check:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", ensure the Supabase callback URL is listed **exactly** as shown above
4. Click "Save"

### 3. OAuth Consent Screen Configuration
**Check:**
1. Go to Google Cloud Console → APIs & Services → OAuth consent screen
2. Ensure:
   - **App name**: "CreatorArmour" (or your app name)
   - **User support email**: Your email
   - **Developer contact**: Your email
   - **App domain**: `creatorarmour.com`
   - **Authorized domains**: 
     - `creatorarmour.com`
     - `ooaxtwmqrvfzdqzoijcj.supabase.co`
3. Click "Save and Continue"
4. If in "Testing" mode, add test users
5. If ready for production, submit for verification

### 4. Supabase Configuration
**Check:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Find "Google" provider
3. Ensure:
   - ✅ Provider is **Enabled**
   - ✅ Client ID matches Google Cloud Console
   - ✅ Client Secret matches Google Cloud Console
4. Click "Save"

### 5. Site URL and Redirect URLs in Supabase
**Check:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. **Site URL**: `https://creatorarmour.com`
3. **Redirect URLs** should include:
   ```
   https://creatorarmour.com/**
   https://creatorarmour.com/#/creator-dashboard
   https://creatorarmour.com/#/creator-onboarding
   https://creatorarmour.com/#/login
   http://localhost:8080/**
   ```

## Step-by-Step Fix

### Step 1: Verify Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **CreatorArmour**
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (should be "Creator Armour - Web")
5. Click to edit
6. Verify:
   - **Authorized JavaScript origins**:
     - `https://creatorarmour.com`
     - `https://www.creatorarmour.com`
   - **Authorized redirect URIs**:
     - `https://ooaxtwmqrvfzdqzoijcj.supabase.co/auth/v1/callback` ⚠️ **MUST BE EXACT**
7. Click "Save"

### Step 2: Verify Supabase Google Provider
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj)
2. Navigate to **Authentication** → **Providers**
3. Find **Google** provider
4. Click to edit
5. Verify:
   - ✅ **Enabled** is checked
   - **Client ID**: Copy from Google Cloud Console (should start with something like `123456789-abc...`)
   - **Client Secret**: Copy from Google Cloud Console (should start with `GOCSPX-...`)
6. Click "Save"

### Step 3: Test OAuth Flow
1. Clear browser cache and cookies
2. Go to `https://creatorarmour.com/#/signup`
3. Click "Sign up with Google"
4. Complete Google OAuth flow
5. Should redirect back to `/#/creator-onboarding` with session established

## Common Issues

### Issue: "invalid_client" Error
**Cause:** Client ID or Secret is incorrect
**Fix:** 
- Double-check Client ID and Secret in both Google Cloud Console and Supabase
- Ensure no extra spaces or characters
- Regenerate Client Secret if needed

### Issue: "redirect_uri_mismatch" Error
**Cause:** Redirect URI in Google Cloud Console doesn't match Supabase callback
**Fix:**
- Ensure `https://ooaxtwmqrvfzdqzoijcj.supabase.co/auth/v1/callback` is in Google Cloud Console
- Check for typos or extra characters

### Issue: "access_denied" Error
**Cause:** User cancelled OAuth or consent screen issue
**Fix:**
- Check OAuth consent screen is properly configured
- If in "Testing" mode, ensure user email is in test users list
- Try again after a few seconds

### Issue: Code Expired
**Cause:** OAuth authorization codes expire quickly (usually within 1 minute)
**Fix:**
- This is normal if user takes too long
- User should try again immediately
- Error handling now shows a friendly message

## After Fixing

1. ✅ OAuth errors are now caught and displayed properly
2. ✅ Users see friendly error messages instead of 404
3. ✅ URL is cleaned automatically
4. ✅ Users can retry OAuth sign-in

## Next Steps

1. Verify Google OAuth configuration (Steps 1-2 above)
2. Test OAuth flow
3. If still failing, check Supabase logs:
   - Go to Supabase Dashboard → Logs → Auth Logs
   - Look for OAuth-related errors
4. If issue persists, regenerate OAuth credentials:
   - Create new OAuth client in Google Cloud Console
   - Update Supabase with new Client ID and Secret

