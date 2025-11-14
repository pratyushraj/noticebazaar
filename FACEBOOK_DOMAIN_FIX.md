# Fix Facebook App Domain Error

## Error Message
"The domain of this URL isn't included in the app's domains. To be able to load this URL, add all domains and sub-domains of your app to the App Domains field in your app settings."

## Solution: Add Domains to Facebook App Settings

### Step 1: Go to Facebook App Settings

1. Go to https://developers.facebook.com/
2. Select your app (ID: **682055151364981**)
3. Go to **Settings** → **Basic**

### Step 2: Add App Domains

In the **App Domains** field, add these domains (one per line):

```
supabase.co
noticebazaar.com
noticebazaar-zugw.vercel.app
vercel.app
```

**Important:** Add the base domains, not full URLs. Facebook will automatically include subdomains.

### Step 3: Add Valid OAuth Redirect URIs

Go to **Settings** → **Basic** → Scroll down to **Valid OAuth Redirect URIs**

Add these exact URLs:

```
https://[your-project-id].supabase.co/functions/v1/social-account-callback
https://noticebazaar.com
https://noticebazaar-zugw.vercel.app
```

**Replace `[your-project-id]` with your actual Supabase project ID.**

To find your Supabase project ID:
1. Go to Supabase Dashboard
2. Check the URL: `https://supabase.com/dashboard/project/[project-id]`
3. Or check your Supabase project settings

### Step 4: Add Website URL

In **Settings** → **Basic**, add:

**Website URL:**
```
https://noticebazaar.com
```

### Step 5: Add Platform (if needed)

1. Go to **Settings** → **Basic**
2. Click **+ Add Platform**
3. Select **Website**
4. Add Site URL: `https://noticebazaar.com`

### Step 6: Save Changes

Click **Save Changes** at the bottom of the page.

### Step 7: Verify Environment Variables

Make sure these are set in Supabase Edge Functions secrets:

```bash
# Check if these are set
supabase secrets list

# If missing, add them:
supabase secrets set INSTAGRAM_REDIRECT_URI=https://[your-project-id].supabase.co/functions/v1/social-account-callback
supabase secrets set FRONTEND_URL=https://noticebazaar.com
```

## Common Issues

### Issue 1: Still getting domain error
- Wait 5-10 minutes for Facebook to propagate changes
- Clear browser cache
- Try in incognito mode

### Issue 2: Redirect URI mismatch
- Make sure the redirect URI in Facebook matches exactly what's in your code
- Check for trailing slashes (should match exactly)
- Verify HTTPS vs HTTP

### Issue 3: App in Development Mode
- If your app is in Development mode, only test users can use it
- Add test users in **Roles** → **Test Users**
- Or submit for App Review to make it public

## Testing

After making changes:

1. Wait 5-10 minutes for changes to propagate
2. Try linking Instagram again
3. If it still fails, check browser console for the exact URL that's failing
4. Add that specific domain to App Domains

## Quick Checklist

- [ ] Added `supabase.co` to App Domains
- [ ] Added `noticebazaar.com` to App Domains  
- [ ] Added `vercel.app` to App Domains
- [ ] Added redirect URI to Valid OAuth Redirect URIs
- [ ] Added Website URL
- [ ] Saved changes in Facebook App Settings
- [ ] Set `INSTAGRAM_REDIRECT_URI` in Supabase secrets
- [ ] Set `FRONTEND_URL` in Supabase secrets
- [ ] Waited 5-10 minutes for propagation
- [ ] Tested Instagram linking again

## Need Help?

If you're still getting errors, check:
1. Browser console for the exact failing URL
2. Facebook App Dashboard → **Tools** → **Graph API Explorer** for errors
3. Supabase Edge Function logs for redirect URI mismatches

