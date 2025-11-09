# Troubleshooting Edge Function 500 Errors

If you're getting a 500 Internal Server Error from Supabase Edge Functions, follow these steps:

## 1. Check Edge Function Logs

The most important step is to check the actual error in Supabase logs:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Click on the function that's failing (e.g., `link-social-account`)
5. Go to the **Logs** tab
6. Look for error messages - they will show the actual issue

## 2. Verify Environment Variables (Secrets)

Edge Functions need environment variables (secrets) to work. Check if they're set:

1. Go to **Settings** > **Edge Functions** > **Secrets** in Supabase Dashboard
2. Verify these secrets are set:
   - `SUPABASE_URL` - Should be automatically set, but verify it exists
   - `SUPABASE_SERVICE_ROLE_KEY` - Should be automatically set, but verify it exists
   - `FACEBOOK_APP_ID` - Required for Instagram linking
   - `FACEBOOK_APP_SECRET` - Required for Instagram linking
   - `GOOGLE_CLIENT_ID` - Required for YouTube linking
   - `GOOGLE_CLIENT_SECRET` - Required for YouTube linking
   - `TIKTOK_CLIENT_KEY` - Required for TikTok linking
   - `TWITTER_CLIENT_ID` - Required for Twitter linking
   - `TWITTER_CLIENT_SECRET` - Required for Twitter linking

## 3. Common Issues and Solutions

### Issue: "Missing Supabase credentials"
**Solution:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` should be automatically available. If missing, check your Supabase project settings.

### Issue: "Facebook/Instagram OAuth not configured"
**Solution:** Add `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` to Edge Function secrets.

### Issue: "Unauthorized: Invalid token"
**Solution:** The user's authentication token is invalid. Make sure the user is logged in and the token is being sent correctly.

### Issue: Function not deployed
**Solution:** Redeploy the Edge Function:
```bash
supabase functions deploy link-social-account
```

## 4. Test the Function Locally

You can test Edge Functions locally with Supabase CLI:

```bash
# Start local Supabase
supabase start

# Serve the function locally
supabase functions serve link-social-account
```

## 5. Check Function Deployment Status

1. Go to **Edge Functions** in Supabase Dashboard
2. Verify the function is deployed and active
3. Check the deployment timestamp - if it's old, redeploy

## 6. Verify Function Code

Make sure the function code is correct:
- Check for syntax errors
- Verify all imports are correct
- Ensure error handling is in place

## 7. Check Network Tab in Browser

In your browser's Developer Tools:
1. Open **Network** tab
2. Try the action that triggers the error
3. Click on the failed request
4. Check the **Response** tab for error details
5. Check the **Headers** tab to verify the Authorization header is being sent

## 8. Common Error Messages

### "Internal server error"
- Check Edge Function logs for the actual error
- Verify all environment variables are set
- Check if the function code has any runtime errors

### "Missing platform or authorization header"
- Verify the request includes the `Authorization` header
- Check that the platform parameter is being sent in the request body

### "Invalid platform"
- Ensure the platform value is one of: `instagram`, `youtube`, `tiktok`, `twitter`

## Getting Help

If you're still stuck:
1. Check the Edge Function logs (most important!)
2. Verify all secrets are set correctly
3. Make sure the function is deployed
4. Check the browser console for any client-side errors

