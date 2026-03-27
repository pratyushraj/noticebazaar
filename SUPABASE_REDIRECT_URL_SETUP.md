# Supabase Redirect URL Setup Guide

This guide explains how to configure redirect URLs for Supabase authentication to work correctly on all environments (local, mobile, and production).

## Problem

Magic links and OAuth callbacks were redirecting to `localhost:3000` instead of the actual app domain, causing authentication failures on mobile and production.

## Solution

We've implemented automatic origin detection that uses the current request origin instead of hardcoded URLs.

## Configuration Steps

### 1. Supabase Dashboard Configuration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Add the following to **Redirect URLs**:
   - `http://localhost:32100/**` (for local development)
   - `https://noticebazaar.com/**` (for production)
   - `https://*.vercel.app/**` (if using Vercel)
   - Add any other domains where your app is hosted

### 2. Edge Function Environment Variables

1. Go to **Edge Functions** → **Secrets** in Supabase Dashboard
2. Add/Update the `FRONTEND_URL` secret:
   - For production: `https://noticebazaar.com`
   - For local development: `http://localhost:32100` (optional, will auto-detect)

**Note:** The Edge Function now automatically detects the request origin, so `FRONTEND_URL` is only used as a fallback.

### 3. Client-Side Configuration

The Supabase client is now configured to:
- Automatically use `window.location.origin` as the redirect URL
- Detect sessions from URL hash fragments
- Clean up URL hash after successful authentication

No additional configuration needed on the client side.

## How It Works

1. **Request Origin Detection**: When a user authenticates, the Edge Function extracts the origin from the request headers (`origin` or `referer`)
2. **Priority Order**:
   - Request origin (most reliable)
   - `FRONTEND_URL` environment variable
   - `localhost:32100` (development fallback)
3. **Client-Side**: The Supabase client uses `window.location.origin` for all redirect URLs

## Testing

1. **Local Development**: 
   - Access app at `http://localhost:32100`
   - Magic links will redirect to `http://localhost:32100`

2. **Production**:
   - Access app at `https://noticebazaar.com`
   - Magic links will redirect to `https://noticebazaar.com`

3. **Mobile**:
   - Access app via its domain
   - Magic links will use the same domain automatically

## Troubleshooting

If redirects still go to localhost:

1. **Check Supabase Dashboard**: Ensure your production domain is in the Redirect URLs list
2. **Check Environment Variables**: Verify `FRONTEND_URL` is set correctly (though it should auto-detect)
3. **Check Browser Console**: Look for any errors in the authentication flow
4. **Check Edge Function Logs**: Verify the origin is being detected correctly

## Files Modified

- `src/integrations/supabase/client.ts` - Added automatic redirect URL detection
- `supabase/functions/passkey-authenticate/index.ts` - Improved origin detection
- `src/contexts/SessionContext.tsx` - Added hash fragment handling
- `src/components/auth/BiometricLogin.tsx` - Uses current origin for OTP

