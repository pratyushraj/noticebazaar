# 🔧 Fix Deployment Errors

## Issues Found

1. **PDF.js Worker 404**: CDN URL not found for version 5.4.449
2. **API Fetch Failed**: Render API may be sleeping or CORS blocking
3. **406 Error on partner_stats**: Already handled gracefully (non-critical)

## Fixes Applied

### 1. PDF.js Worker URL Fix

**Problem:** CDN URL for PDF.js worker was incorrect or not found.

**Fix:** Updated to use correct worker path for version 5.x:
```typescript
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
```

Version 5.x uses `.mjs` extension instead of `.js`.

### 2. CORS Configuration Fix

**Problem:** API server wasn't allowing requests from Render/Netlify frontend URLs.

**Fix:** Added Render and Netlify URL patterns to CORS allowed origins:
```typescript
// Allow Render frontend URLs
if (origin.includes('onrender.com')) {
  return callback(null, true);
}

// Allow Netlify frontend URLs
if (origin.includes('netlify.app')) {
  return callback(null, true);
}
```

### 3. API Fetch Error Handling

**Problem:** Render free tier spins down after inactivity (~50 seconds delay).

**Solution:** The code already has error handling, but you can improve user experience by:

1. **Show loading state** while API wakes up
2. **Add retry logic** for failed requests
3. **Show helpful message** if API is slow to respond

## Next Steps

### Update API CORS (Required)

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Select `noticebazaar-api` service

2. **Add Environment Variable:**
   ```
   FRONTEND_URL=https://noticebazaar-frontend.onrender.com
   ```
   (Or your actual frontend URL)

3. **Redeploy API:**
   - Go to Deploys tab
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait for deployment to complete

### Test After Fixes

1. **Clear browser cache** (or use incognito)
2. **Visit your frontend URL**
3. **Try uploading a contract:**
   - Should not see PDF.js worker 404
   - API should connect (may take 30-50 seconds if sleeping)
   - No CORS errors

### If API Still Fails

**Render Free Tier Spin-down:**
- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes ~50 seconds
- This is normal for free tier

**Solutions:**
1. **Wait 30-50 seconds** after first request (API is waking up)
2. **Upgrade to paid tier** for instant wake-up
3. **Add retry logic** in frontend (already partially implemented)

### Verify CORS is Working

Test API from browser console:
```javascript
fetch('https://noticebazaar-api.onrender.com/health', {
  method: 'GET',
  headers: {
    'Origin': 'https://noticebazaar-frontend.onrender.com'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

Should return health status without CORS errors.

## Files Changed

1. ✅ `src/lib/utils/contractValidation.ts` - Fixed PDF.js worker URL
2. ✅ `server/src/index.ts` - Added Render/Netlify to CORS
3. ✅ Created this guide

## Expected Results

After fixes:
- ✅ No PDF.js worker 404 errors
- ✅ API connects successfully (after wake-up delay on free tier)
- ✅ No CORS errors
- ⚠️ 406 error on partner_stats is expected (table may not exist yet - non-critical)

---

**Note:** The 406 error on `partner_stats` is already handled gracefully in the code. It returns `null` when the table doesn't exist, which is expected behavior. This is not a breaking error.

