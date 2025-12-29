# OG Preview Testing Checklist

## ✅ Implementation Verification

### Code Checks (Already Verified)

- ✅ **OG routes are public** - Registered before auth middleware (`server/src/index.ts:232`)
- ✅ **Absolute HTTPS URLs** - All URLs use `https://creatorarmour.com`
- ✅ **Meta tags in HTML** - Static HTML with meta tags before redirect
- ✅ **No JS blocking** - Returns static HTML, crawlers don't need JS
- ✅ **HTML escaping** - XSS protection with `escapeHtml()` function
- ✅ **Error handling** - Falls back to generic OG on errors

### Potential Issues to Address

⚠️ **OG Image URLs**: Currently uses `/og-generated/${dealId}.png` which may not exist yet
- **Solution**: Use default image as fallback: `https://creatorarmour.com/og-preview.png`

---

## 🧪 Production Testing Checklist

### 1️⃣ Test With Real Production URLs

**DO NOT test on localhost** - Social platforms cache aggressively and won't refresh localhost previews.

**Test URLs:**
- `https://creatorarmour.com/og/deal/[real-deal-id]`
- `https://creatorarmour.com/deal/[real-deal-id]` (should redirect to OG endpoint)

**Example:**
```
https://creatorarmour.com/og/deal/53219ab0-150d-4b23-85bc-af9cb6f284bf
```

---

### 2️⃣ WhatsApp Testing

#### Personal Chat
1. Open WhatsApp
2. Send link to yourself or a test contact
3. **Check:**
   - ✅ Title shows: "CreatorArmour — Deal Under Protection"
   - ✅ Description shows: "₹50,000 · XYZ Brand · Secure Contract · Payment Monitoring Enabled"
   - ✅ Image loads (or shows default preview image)
   - ✅ No default Supabase/framework preview
   - ✅ Link is clickable

#### Group Chat
1. Send link in a WhatsApp group
2. Verify preview appears correctly
3. **Note**: WhatsApp caches aggressively - if preview doesn't update:
   - Share link once
   - Delete the message
   - Share again (forces fresh fetch)

**Expected Result:**
```
┌─────────────────────────────┐
│ CreatorArmour — Deal Under │
│ Protection                  │
│                             │
│ ₹50,000 · XYZ Brand ·       │
│ Secure Contract · Payment   │
│ Monitoring Enabled          │
│                             │
│ [Preview Image]             │
│                             │
│ creatorarmour.com           │
└─────────────────────────────┘
```

---

### 3️⃣ Instagram DM Testing

1. Open Instagram
2. Go to DMs
3. Paste deal link
4. **Check:**
   - ✅ Preview card appears
   - ✅ Title and description visible
   - ✅ Image loads
   - ✅ No broken image placeholder

**If preview doesn't show:**
- Instagram may cache old previews
- Try sharing in a new conversation
- Wait 24 hours for cache to expire

---

### 4️⃣ Twitter / X Testing

**Tool**: https://cards-dev.twitter.com/validator

**Steps:**
1. Go to Twitter Card Validator
2. Paste deal URL: `https://creatorarmour.com/og/deal/[deal-id]`
3. Click "Preview card"
4. **Check:**
   - ✅ Card type: `summary_large_image`
   - ✅ Title appears correctly
   - ✅ Description appears correctly
   - ✅ Image URL is valid
   - ✅ No errors in validation

**Expected Output:**
```
Card Type: summary_large_image
Title: CreatorArmour — Deal Under Protection
Description: ₹50,000 · XYZ Brand · Secure Contract · Payment Monitoring Enabled
Image: https://creatorarmour.com/og-generated/[deal-id].png
```

---

### 5️⃣ LinkedIn Testing

**Tool**: https://www.linkedin.com/post-inspector/

**Steps:**
1. Go to LinkedIn Post Inspector
2. Paste deal URL: `https://creatorarmour.com/og/deal/[deal-id]`
3. Click "Inspect"
4. **Check:**
   - ✅ OG tags detected
   - ✅ Title shows
   - ✅ Description shows
   - ✅ Image URL is valid
   - ✅ No errors

**If cached:**
- Click "Clear cache" button
- Re-inspect the URL

---

### 6️⃣ Facebook / Messenger Testing

**Tool**: https://developers.facebook.com/tools/debug/

**Steps:**
1. Go to Facebook Sharing Debugger
2. Paste deal URL: `https://creatorarmour.com/og/deal/[deal-id]`
3. Click "Debug"
4. **Check:**
   - ✅ All OG tags detected
   - ✅ Title: "CreatorArmour — Deal Under Protection"
   - ✅ Description: Shows deal details
   - ✅ Image: Valid URL
   - ✅ URL: Correct deal URL
   - ✅ No warnings or errors

**If cached wrong:**
- Click **"Scrape Again"** button
- This forces Facebook to re-fetch the page
- Wait a few seconds and check again

**Common Issues:**
- ❌ "URL not found" → Check server is running
- ❌ "Missing og:image" → Verify image URL is absolute HTTPS
- ❌ "Cached version" → Click "Scrape Again"

---

## ⚠️ Common Issues & Solutions

### Issue: Preview doesn't show at all

**Possible Causes:**
1. ❌ Server OG routes require auth
   - **Fix**: Verify `/og` routes are registered BEFORE auth middleware
   - **Check**: `server/src/index.ts` line 232

2. ❌ Image URL is relative
   - **Fix**: Use absolute URLs: `https://creatorarmour.com/og-preview.png`
   - **Current**: ✅ Already using absolute URLs

3. ❌ HTTP instead of HTTPS
   - **Fix**: All URLs must be HTTPS
   - **Current**: ✅ Already using HTTPS

4. ❌ Meta tags load after redirect
   - **Fix**: Meta tags must be in initial HTML response
   - **Current**: ✅ Meta tags are in static HTML

5. ❌ SPA render blocking OG bots
   - **Fix**: Return static HTML, not JS-rendered content
   - **Current**: ✅ Returns static HTML

### Issue: Wrong preview shows

**Solution:**
- Platform cached old preview
- Use platform's cache clearing tool:
  - Facebook: "Scrape Again"
  - Twitter: Re-validate in card validator
  - LinkedIn: Clear cache in post inspector
  - WhatsApp: Delete message and re-share

### Issue: Image doesn't load

**Possible Causes:**
1. Image file doesn't exist at `/og-generated/[deal-id].png`
   - **Fix**: Use default image as fallback
   - **Current**: Should fallback to `og-preview.png`

2. CORS issues
   - **Fix**: Ensure image is served from same domain or CORS-enabled

3. Image too large
   - **Fix**: OG images should be < 8MB, recommended 1200x630px

---

## 🎯 Quick Test Commands

### Test OG Route Directly (cURL)

```bash
# Test deal OG preview
curl -I https://creatorarmour.com/og/deal/[deal-id]

# Should return:
# - Content-Type: text/html
# - Status: 200 OK

# View full HTML
curl https://creatorarmour.com/og/deal/[deal-id] | grep -i "og:"
```

### Test Generic OG

```bash
curl https://creatorarmour.com/og | grep -i "og:"
```

**Expected output:**
```
<meta property="og:type" content="website" />
<meta property="og:site_name" content="CreatorArmour" />
<meta property="og:title" content="CreatorArmour — Protect Your Brand Deals" />
<meta property="og:description" content="Generate contracts, track payments & stay protected — built for creators." />
<meta property="og:image" content="https://creatorarmour.com/og-preview.png" />
<meta property="og:url" content="https://creatorarmour.com" />
```

---

## 📋 Pre-Deployment Checklist

Before testing on production:

- [ ] Verify OG routes are deployed to production server
- [ ] Verify `/og` endpoint is accessible (no auth required)
- [ ] Verify default OG image exists: `https://creatorarmour.com/og-preview.png`
- [ ] Test with a real deal ID from production database
- [ ] Verify all URLs use HTTPS (not HTTP)
- [ ] Verify all image URLs are absolute (not relative)
- [ ] Check server logs for any errors when accessing `/og/deal/[id]`

---

## 🚀 Post-Deployment Testing

### Step 1: Test Generic OG
1. Visit: `https://creatorarmour.com/og`
2. View page source
3. Verify all OG meta tags are present

### Step 2: Test Deal OG
1. Get a real deal ID from production
2. Visit: `https://creatorarmour.com/og/deal/[deal-id]`
3. View page source
4. Verify deal-specific OG tags are present

### Step 3: Test on Each Platform
Follow the platform-specific testing steps above (WhatsApp, Instagram, Twitter, LinkedIn, Facebook)

### Step 4: Verify Cache Clearing
If previews are cached incorrectly:
- Use each platform's cache clearing tool
- Re-test after clearing cache

---

## 💡 Business Impact

**Why This Matters:**
- ✅ **Professional appearance** - Rich previews make you look legit
- ✅ **Higher click-through** - Attractive previews get more clicks
- ✅ **Brand trust** - Polished previews build credibility
- ✅ **Competitive advantage** - Most competitors don't have this

**Use Cases:**
- Share deal links with brands in WhatsApp/Instagram DMs
- Post deal updates on social media
- Share success stories with preview cards
- Build trust through professional link previews

---

## 📝 Notes

- **Cache Duration**: Most platforms cache OG previews for 24-48 hours
- **Image Size**: Recommended 1200x630px, max 8MB
- **Update Frequency**: If you change OG content, use cache clearing tools
- **Monitoring**: Check server logs for OG route access patterns

---

**Last Updated**: 2025-01-31  
**Status**: Ready for Production Testing

