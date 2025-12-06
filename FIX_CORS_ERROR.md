# Fix CORS Error for Localhost:8080

## Problem
You're seeing CORS errors like:
```
Access to fetch at 'https://ooaxtwmqrvfzdqzoijcj.supabase.co/rest/v1/profiles?...' 
from origin 'http://localhost:8080' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

This happens because Supabase is blocking requests from `http://localhost:8080` since it's not in the allowed origins list.

## Solution: Add Localhost:8080 to Supabase Allowed Origins

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `ooaxtwmqrvfzdqzoijcj`

### Step 2: Configure CORS Settings (API Settings)
1. In the left sidebar, click **Settings** (gear icon)
2. Click **API** in the settings menu
3. Scroll down to find **CORS Configuration** or **Additional Allowed Origins**
   - Look for a section labeled "CORS" or "Allowed Origins"
   - If you see a text field or list, that's where you add origins
4. Add `http://localhost:8080` to the allowed origins:
   - If it's a text field: Type `http://localhost:8080` (one per line, or comma-separated)
   - If it's a list: Click "Add Origin" or "+" button, then enter `http://localhost:8080`
5. Click **Save** or **Update** at the bottom of the page

### Step 3: Configure Authentication Redirect URLs
1. In the left sidebar, click **Authentication**
2. Click **URL Configuration** tab
3. In the **Redirect URLs** section:
   - Click **Add URL** or "+" button
   - Enter: `http://localhost:8080/**`
   - Click **Save**
4. (Optional) Set **Site URL** to `http://localhost:8080` if you want it as the default

### Step 4: Verify Configuration
After saving, your allowed origins should include:
- `http://localhost:8080` ✅ (your dev server - **REQUIRED**)
- `http://localhost:5173` (if you also use default Vite port)
- Your production URL (if deployed)

### Step 5: Clear Browser Cache and Restart
1. **Hard refresh your browser**:
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + R`
2. **Restart your dev server**:
   ```bash
   # Stop your dev server (Ctrl+C or Cmd+C)
   # Then restart it
   npm run dev
   ```
3. **Wait 10-30 seconds** for Supabase to propagate the CORS changes

### Alternative: Use Port 5173 (Default Vite Port)
If you prefer to use the default Vite port instead:

1. **Update `vite.config.ts`:**
   ```typescript
   server: {
     host: "::",
     port: 5173, // Change from 8080 to 5173
   },
   ```

2. **Add `http://localhost:5173` to Supabase allowed origins** (if not already added)

3. **Restart dev server**

## Why This Happens
Supabase restricts API requests to specific origins for security. By default, it may only allow:
- Your production domain
- Common development ports (like 5173)

Since your app runs on port 8080, you need to explicitly add it to the allowed origins list.

## Verification
After fixing, you should see:
- ✅ No CORS errors in the browser console
- ✅ Profile data loads successfully
- ✅ Messages page works correctly

## Still Having Issues?

### If CORS errors persist after adding the origin:

1. **Wait a bit longer**: Supabase may take 1-2 minutes to propagate CORS changes
   - Try waiting 2-3 minutes, then hard refresh again

2. **Double-check the exact URL format**:
   - ✅ Correct: `http://localhost:8080` (no trailing slash)
   - ❌ Wrong: `http://localhost:8080/` or `localhost:8080`

3. **Check Supabase project status**:
   - Go to **Settings** → **General**
   - Ensure your project is **Active** (not paused)
   - Paused projects may have restricted API access

4. **Verify environment variables**:
   - Check your `.env` file has:
     ```
     VITE_SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
     VITE_SUPABASE_ANON_KEY=your_anon_key_here
     ```
   - Restart your dev server after changing `.env`

5. **Check browser console for exact error**:
   - Open DevTools (F12)
   - Go to **Console** tab
   - Look for the exact CORS error message
   - The error should show the origin that's being blocked

6. **Try incognito/private browsing**:
   - Sometimes browser extensions or cached data can interfere
   - Test in an incognito window to rule out browser issues

7. **Verify the request is reaching Supabase**:
   - Open DevTools → **Network** tab
   - Look for requests to `ooaxtwmqrvfzdqzoijcj.supabase.co`
   - Check if they're being blocked (red) or failing (yellow/red status)

8. **Alternative: Use a different port**:
   - If port 8080 continues to cause issues, you can switch to port 5173 (default Vite port)
   - Update `vite.config.ts`:
     ```typescript
     server: {
       port: 5173,
     }
     ```
   - Then add `http://localhost:5173` to Supabase allowed origins instead

## Quick Checklist

Before reporting the issue, verify:
- [ ] Added `http://localhost:8080` to **Settings → API → CORS Configuration**
- [ ] Added `http://localhost:8080/**` to **Authentication → URL Configuration → Redirect URLs**
- [ ] Clicked **Save** in both places
- [ ] Waited 1-2 minutes after saving
- [ ] Hard refreshed browser (Cmd+Shift+R / Ctrl+Shift+R)
- [ ] Restarted dev server
- [ ] Checked that project is not paused in Supabase
- [ ] Verified `.env` file has correct Supabase URL and key

