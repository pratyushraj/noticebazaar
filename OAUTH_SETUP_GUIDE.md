# OAuth Setup Guide for NoticeBazaar

## Current Issues

1. **422 Error**: This typically means the redirect URL is not in Supabase's allowed list
2. **400 Error (GitHub OAuth)**: GitHub OAuth provider may not be configured in Supabase
3. **400 Error (Google OAuth)**: Google OAuth redirect URI mismatch - the redirect URI in Google Cloud Console doesn't match Supabase's callback URL

## Required Setup Steps

### 1. Configure Google OAuth in Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list
4. Enable Google provider
5. You'll need to create a Google OAuth app first (see step 2 below)
6. Add your Google OAuth App credentials:
   - **Client ID**: From your Google OAuth app
   - **Client Secret**: From your Google OAuth app

### 2. Create Google OAuth App

1. Go to https://console.cloud.google.com/
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - **User Type**: External (unless you have a Google Workspace)
   - **App name**: NoticeBazaar
   - **User support email**: Your email
   - **Developer contact**: Your email
   - Click **Save and Continue**
   - **Scopes**: Add `email`, `profile`, `openid`
   - **Test users**: Add your email if in testing mode
   - Click **Save and Continue**
6. Back to **Credentials**, select **OAuth client ID**
7. **Application type**: Web application
8. **Name**: NoticeBazaar Web Client
9. **Authorized redirect URIs**: Add this EXACT URL:
   ```
   https://[your-supabase-project-id].supabase.co/auth/v1/callback
   ```
   **Important**: Replace `[your-supabase-project-id]` with your actual Supabase project reference ID (found in your Supabase project URL)
   
   Example: If your Supabase URL is `https://abc123xyz.supabase.co`, then use:
   ```
   https://abc123xyz.supabase.co/auth/v1/callback
   ```
10. Click **Create**
11. Copy the **Client ID** and **Client Secret**
12. Add these to Supabase Dashboard (step 1 above)

### 3. Configure GitHub OAuth in Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **GitHub** in the list
4. Enable GitHub provider
5. Add your GitHub OAuth App credentials:
   - **Client ID**: From your GitHub OAuth app
   - **Client Secret**: From your GitHub OAuth app

### 4. Configure Redirect URLs in Supabase

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Add the following **Site URL**:
   ```
   https://www.noticebazaar.com
   ```
3. Add the following **Redirect URLs** (one per line):
   ```
   https://www.noticebazaar.com/creator-onboarding
   https://www.noticebazaar.com/*
   http://localhost:32100/creator-onboarding
   http://localhost:8080/creator-onboarding
   ```

### 5. Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: NoticeBazaar
   - **Homepage URL**: `https://www.noticebazaar.com`
   - **Authorization callback URL**: 
     ```
     https://[your-supabase-project-id].supabase.co/auth/v1/callback
     ```
     Replace `[your-supabase-project-id]` with your actual Supabase project reference ID
4. Click **Register application**
5. Copy the **Client ID** and generate a **Client Secret**
6. Add these to Supabase Dashboard (step 1 above)

### 6. Verify Environment Variables

Make sure these are set in your Supabase project:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

## Testing

After configuration:
1. Try signing up with GitHub
2. Check browser console for any errors
3. Verify redirect works to `/creator-onboarding`

## Common Issues

- **422 Error**: Redirect URL not in allowed list → Add to Supabase URL Configuration
- **400 Error (Google OAuth)**: Redirect URI mismatch → 
  1. Check Google Cloud Console > Credentials > OAuth 2.0 Client ID
  2. Ensure `https://[your-project-id].supabase.co/auth/v1/callback` is in "Authorized redirect URIs"
  3. The URI must match EXACTLY (including https, no trailing slash, correct project ID)
  4. Verify the Client ID and Secret in Supabase Dashboard match Google Cloud Console
- **400 Error (GitHub OAuth)**: GitHub OAuth not configured → Enable and configure in Supabase Dashboard
- **Redirect fails**: Check that callback URL in OAuth provider matches Supabase's callback URL

## Quick Fix for Google OAuth 400 Error

If you're getting a 400 error with Google OAuth:

1. **Find your Supabase project ID**:
   - Go to Supabase Dashboard
   - Check your project URL: `https://[project-id].supabase.co`
   - The `[project-id]` is what you need

2. **Add redirect URI to Google Cloud Console**:
   - Go to https://console.cloud.google.com/apis/credentials
   - Click on your OAuth 2.0 Client ID
   - Under "Authorized redirect URIs", add:
     ```
     https://[your-project-id].supabase.co/auth/v1/callback
     ```
   - Replace `[your-project-id]` with your actual Supabase project ID
   - Click **Save**

3. **Verify in Supabase**:
   - Go to Supabase Dashboard > Authentication > Providers > Google
   - Ensure Client ID and Client Secret are correctly entered
   - Make sure the provider is **Enabled**

4. **Clear browser cache** and try again

