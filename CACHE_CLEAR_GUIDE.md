# Clear Cache Guide - Fix "Old Dashboard Showing"

If you're seeing an old version of the dashboard after logging in, it's likely a browser cache issue. Follow these steps:

## Quick Fix (Recommended)

### Option 1: Hard Refresh
- **Chrome/Edge (Windows/Linux):** `Ctrl + Shift + R` or `Ctrl + F5`
- **Chrome/Edge (Mac):** `Cmd + Shift + R`
- **Firefox (Windows/Linux):** `Ctrl + Shift + R` or `Ctrl + F5`
- **Firefox (Mac):** `Cmd + Shift + R`
- **Safari (Mac):** `Cmd + Option + R`

### Option 2: Clear Browser Cache
1. Open browser DevTools (`F12` or `Cmd+Option+I`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Option 3: Clear Site Data
1. Open browser DevTools (`F12`)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Clear site data** or **Clear storage**
4. Check all boxes and click **Clear**
5. Refresh the page

## Mobile Browser Fix

### iOS Safari
1. Go to **Settings** → **Safari**
2. Tap **Clear History and Website Data**
3. Confirm
4. Reload the page

### Android Chrome
1. Open Chrome menu (three dots)
2. Go to **Settings** → **Privacy and security**
3. Tap **Clear browsing data**
4. Select **Cached images and files**
5. Tap **Clear data**
6. Reload the page

## Development Server Fix

If you're running a local dev server:

```bash
# Stop the server (Ctrl+C)
# Clear node_modules cache
rm -rf node_modules/.vite

# Restart the server
npm run dev
```

## Production Build Fix

If you're on production and seeing old content:

1. **Check if you're on the right URL:**
   - Make sure you're on `/client-dashboard` not `/dashboard-preview`
   - The preview route shows a different dashboard

2. **Force a new build:**
   ```bash
   # Clear build cache
   rm -rf dist
   rm -rf .vite
   
   # Rebuild
   npm run build
   ```

3. **Deploy the new build** to your hosting service

## Verify You're on the Right Route

The correct routes are:
- ✅ `/client-dashboard` - Current Client Dashboard (with logout button)
- ❌ `/dashboard-preview` - Old preview dashboard
- ❌ `/dashboard-white-preview` - Old white preview

Make sure your URL shows `/client-dashboard` after login.

## Still Seeing Old Dashboard?

1. **Check browser console** for errors:
   - Open DevTools (`F12`)
   - Go to **Console** tab
   - Look for any errors or warnings

2. **Check Network tab:**
   - Open DevTools → **Network** tab
   - Refresh the page
   - Look for cached files (they'll show "from disk cache" or "from memory cache")
   - If you see old JavaScript files, clear cache and try again

3. **Try incognito/private mode:**
   - This bypasses cache completely
   - If it works in incognito, it's definitely a cache issue

4. **Check if you're logged in with the right account:**
   - The dashboard might be showing based on user role
   - Make sure your profile has `role: 'client'` in the database

## Force Cache Bypass (Advanced)

Add this to your browser's address bar after the URL:
```
?v=2&nocache=true
```

Example:
```
https://noticebazaar.com/client-dashboard?v=2&nocache=true
```

This forces the browser to fetch fresh files.

