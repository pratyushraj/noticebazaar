# Social Accounts OAuth Setup Guide

This document explains how to set up OAuth credentials for the social account linking feature.

## Required Environment Variables

Add these to your Supabase project secrets (Settings > Edge Functions > Secrets):

### Instagram/Facebook
- `FACEBOOK_APP_ID` - Your Facebook App ID
- `FACEBOOK_APP_SECRET` - Your Facebook App Secret

**Setup Steps:**
1. Go to https://developers.facebook.com/
2. Create a new app
3. Add "Instagram Basic Display" product
4. Add "Pages" product (for Instagram Business accounts)
5. Set OAuth redirect URI: `https://[your-project].supabase.co/functions/v1/social-account-callback`
6. Get App ID and App Secret from Settings > Basic

### YouTube (Google)
- `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret

**Setup Steps:**
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Go to "Credentials" > "Create Credentials" > "OAuth client ID"
5. Application type: Web application
6. Authorized redirect URIs: `https://[your-project].supabase.co/functions/v1/social-account-callback`
7. Copy Client ID and Client Secret

### TikTok
- `TIKTOK_CLIENT_KEY` - Your TikTok Client Key
- `TIKTOK_CLIENT_SECRET` - Your TikTok Client Secret (if required)

**Setup Steps:**
1. Go to https://developers.tiktok.com/
2. Create a new app
3. Add "User Information" scope
4. Set redirect URI: `https://[your-project].supabase.co/functions/v1/social-account-callback`
5. Get Client Key from app settings

### Twitter/X
- `TWITTER_CLIENT_ID` - Your Twitter OAuth 2.0 Client ID
- `TWITTER_CLIENT_SECRET` - Your Twitter OAuth 2.0 Client Secret

**Setup Steps:**
1. Go to https://developer.twitter.com/
2. Create a new project and app
3. Enable OAuth 2.0
4. Set callback URL: `https://[your-project].supabase.co/functions/v1/social-account-callback`
5. Get Client ID and Client Secret

### Frontend URL
- `FRONTEND_URL` - Your frontend URL (e.g., `https://noticebazaar.com` or `http://localhost:32100`)

## Database Migration

Run the migration to create the `social_accounts` table:

```bash
supabase migration up
```

Or apply manually in Supabase Dashboard > SQL Editor.

## Deploy Edge Functions

Deploy all social account functions:

```bash
supabase functions deploy link-social-account
supabase functions deploy social-account-callback
supabase functions deploy save-social-account
supabase functions deploy sync-social-accounts
supabase functions deploy unlink-social-account
```

## Testing

1. Open the Creator Dashboard
2. Click "Link Social Accounts"
3. Click "Link [Platform]" button
4. Complete OAuth flow
5. Account should appear as linked with follower count

## Notes

- Tokens are stored encrypted in the database
- Tokens are automatically refreshed when expired (where supported)
- Use the "Sync Now" button to manually refresh follower counts
- Background sync can be set up with a cron job (see `sync-social-all` function)

