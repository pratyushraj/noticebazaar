# OG Preview Setup for CreatorArmour

## Current Configuration

OG preview links now use `api.creatorarmour.com` instead of `noticebazaar-api.onrender.com` for cleaner URLs.

## Required Setup

### Step 1: Configure Backend Custom Domain

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Select your backend service (`noticebazaar-api`)

2. **Add Custom Domain:**
   - Go to **Settings** → **Custom Domains**
   - Click **Add Custom Domain**
   - Enter: `api.creatorarmour.com`
   - Click **Save**

3. **Configure DNS:**
   - Render will show you DNS records to add
   - Go to your domain registrar (where you manage `creatorarmour.com`)
   - Add a **CNAME record**:
     ```
     Type: CNAME
     Name: api
     Value: [value provided by Render]
     TTL: 3600
     ```
   - Save and wait 5-15 minutes for DNS propagation

### Step 2: Verify Setup

Once DNS propagates:

```bash
# Test OG endpoint
curl https://api.creatorarmour.com/og

# Should return HTML with OG meta tags
```

### Step 3: Update Environment Variables (Optional)

If you want to explicitly set the API URL:

**In Render Dashboard → Frontend Service → Environment Variables:**
```
VITE_API_BASE_URL=https://api.creatorarmour.com
```

## How It Works

1. **User generates collaboration link** → `https://api.creatorarmour.com/og/deal/[token-id]`
2. **Social media crawler** → Hits backend, gets HTML with OG meta tags
3. **Backend redirects** → Frontend: `https://creatorarmour.com/#/deal-details/[token-id]`
4. **User clicks link** → Opens deal details page

## Fallback Behavior

If `api.creatorarmour.com` is not configured:
- The code will fallback to the backend URL (`noticebazaar-api.onrender.com`)
- OG previews will still work, but URLs will show `noticebazaar-api.onrender.com`

## Testing

After setup, test OG previews:

1. **Generate a collaboration link** in the app
2. **Check the link format** - should be `api.creatorarmour.com/og/deal/...`
3. **Test on social platforms:**
   - WhatsApp: Share link and check preview
   - Facebook: Use https://developers.facebook.com/tools/debug/
   - Twitter: Use https://cards-dev.twitter.com/validator

## Troubleshooting

**OG link shows noticebazaar-api.onrender.com:**
- Check if `api.creatorarmour.com` DNS is configured correctly
- Verify custom domain is added in Render dashboard
- Wait for DNS propagation (can take up to 24 hours)

**OG preview doesn't show:**
- Check backend is running: `curl https://api.creatorarmour.com/health`
- Check OG route: `curl https://api.creatorarmour.com/og`
- Verify deal/token exists in database

