# Update Supabase URL Configuration - Quick Steps

Based on your current Supabase Dashboard, here's what to change:

## Step 1: Update Site URL

**Current**: `http://localhost:3000`  
**Change to**: `https://noticebazaar.com`

1. In the **Site URL** field, replace `http://localhost:3000` with `https://noticebazaar.com`
2. Click **Save changes** (green button)

## Step 2: Add Redirect URLs

**Current**: Only `http://localhost:8080` is listed

**Add these URLs** (click "Add URL" for each):

1. `http://localhost:32100/**` (for local development)
2. `https://noticebazaar.com/**` (for production)
3. `https://*.vercel.app/**` (if using Vercel - allows any preview URL)
4. `https://*.netlify.app/**` (if using Netlify)

**Optional**: You can keep `http://localhost:8080` if you use that port, or remove it if not needed.

## Final Configuration Should Look Like:

**Site URL**: `https://noticebazaar.com`

**Redirect URLs**:
- ✅ `http://localhost:32100/**`
- ✅ `https://noticebazaar.com/**`
- ✅ `https://*.vercel.app/**` (if using Vercel)
- ✅ `http://localhost:8080` (optional - keep if you use this port)

## Why These Changes?

- **Site URL**: This is the default redirect URL Supabase uses when no specific redirect is provided
- **Redirect URLs**: These are the allowed domains for OAuth/magic link redirects. The `/**` wildcard allows all paths under that domain.

After making these changes, your passkey authentication and magic links will work correctly on both local and production environments!

