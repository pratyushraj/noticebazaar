# OAuth Setup Guide for NoticeBazaar

## Current Issues

1. **422 Error**: This typically means the redirect URL is not in Supabase's allowed list
2. **400 Error (GitHub OAuth)**: GitHub OAuth provider may not be configured in Supabase

## Required Setup Steps

### 1. Configure GitHub OAuth in Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **GitHub** in the list
4. Enable GitHub provider
5. Add your GitHub OAuth App credentials:
   - **Client ID**: From your GitHub OAuth app
   - **Client Secret**: From your GitHub OAuth app

### 2. Configure Redirect URLs in Supabase

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

### 3. Create GitHub OAuth App

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

### 4. Verify Environment Variables

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
- **400 Error**: GitHub OAuth not configured → Enable and configure in Supabase Dashboard
- **Redirect fails**: Check that callback URL in GitHub matches Supabase's callback URL

