# Configure Supabase Redirect URLs - Step by Step Guide

This guide will help you configure the optional Supabase settings to ensure redirect URLs work correctly.

## Step 1: Add Redirect URLs in Supabase Dashboard

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `ooaxtwmqrvfzdqzoijcj` (or your project name)
3. **Navigate to Authentication**:
   - Click **Authentication** in the left sidebar
   - Click **URL Configuration** tab
4. **Add Redirect URLs**:
   - In the **Redirect URLs** section, click **Add URL**
   - Add each of the following (one at a time):
     - `http://localhost:32100/**` (for local development)
     - `https://noticebazaar.com/**` (for production)
     - `https://*.vercel.app/**` (if using Vercel - allows any Vercel preview URL)
     - `https://*.netlify.app/**` (if using Netlify)
   - Click **Save** after adding each URL

**Note**: The `/**` wildcard allows all paths under that domain.

## Step 2: Set FRONTEND_URL Environment Variable

1. **Go to Edge Functions**:
   - Click **Edge Functions** in the left sidebar
   - Click **Secrets** tab (or go to Settings → Edge Functions → Secrets)
2. **Add FRONTEND_URL Secret**:
   - Click **Add Secret** or **New Secret**
   - **Name**: `FRONTEND_URL`
   - **Value**: `https://noticebazaar.com` (or your production domain)
   - Click **Save**

**Note**: This is optional since the code now auto-detects the origin, but it's good to have as a fallback.

## Step 3: Verify Site URL (Optional but Recommended)

1. **Go to Authentication** → **URL Configuration**
2. **Check Site URL**:
   - The **Site URL** should be set to your production domain: `https://noticebazaar.com`
   - If not, update it to match your production domain
   - This is used as a fallback for redirects

## Quick Verification

After completing these steps:

1. **Test locally**: 
   - Start your app at `http://localhost:32100`
   - Try signing in with Face ID
   - Magic link should redirect to `http://localhost:32100`

2. **Test in production**:
   - Deploy your app
   - Try signing in with Face ID
   - Magic link should redirect to your production domain

## Troubleshooting

If redirects still don't work:

1. **Check the redirect URL in the magic link email** - it should match your domain
2. **Check Edge Function logs** in Supabase Dashboard to see what origin was detected
3. **Verify the redirect URL is in the allowed list** in Authentication → URL Configuration
4. **Clear browser cache** and try again

## Current Status

✅ **Code is already fixed** - The app now auto-detects the origin
✅ **Edge Function deployed** - Uses request origin automatically
⏳ **Optional Dashboard config** - Complete the steps above for extra reliability

Even without these steps, the app should work because of the auto-detection. These steps just add an extra layer of reliability.

