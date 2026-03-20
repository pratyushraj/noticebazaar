# 🔧 Fix Netlify Deployment Issues

## The Problems

1. **MIME type error**: `Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "application/octet-stream"`
   - Netlify is serving source files instead of compiled JavaScript
   
2. **404 errors**: `favicon.ico` and `manifest.json` not found
   - Files exist but aren't being served correctly

## Root Cause

Netlify isn't building the project correctly:
- Wrong build command (may be using npm instead of pnpm)
- Missing or incorrect `netlify.toml` configuration
- Build output not being served properly

## Solution: Fix Netlify Configuration

### Step 1: Update Netlify Build Settings

1. **Go to Netlify Dashboard:**
   - Visit: https://app.netlify.com
   - Select your site

2. **Go to Site Settings → Build & Deploy → Build Settings**

3. **Update Build Settings:**
   - **Build command:** `corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm run build`
   - **Publish directory:** `dist`
   - **Base directory:** (leave empty)

4. **Save changes**

### Step 2: Verify Environment Variables

Go to **Site Settings → Environment Variables** and ensure you have:
```
VITE_SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=https://noticebazaar-api.onrender.com
NODE_ENV=production
```

### Step 3: Clear Cache and Redeploy

1. **Clear Build Cache:**
   - Go to **Deploys** tab
   - Click **"Trigger deploy"** → **"Clear cache and deploy site"**

2. **Wait for build to complete** (2-5 minutes)

3. **Check build logs** to verify:
   - ✅ `pnpm install` runs successfully
   - ✅ `pnpm run build` completes
   - ✅ `dist/` folder is created

### Step 4: Verify Files in Build Output

After build completes, check the build logs show:
```
✓ built in Xs
dist/index.html
dist/assets/...
dist/favicon.ico
dist/manifest.json
```

## Alternative: Use netlify.toml (Already Created)

I've created `netlify.toml` in your repo root. This file will automatically configure Netlify when you deploy.

**To use it:**
1. Commit and push `netlify.toml` to your repo
2. Netlify will automatically use these settings
3. No need to manually configure build settings

## Quick Fix Checklist

- [ ] Updated build command to use pnpm
- [ ] Set publish directory to `dist`
- [ ] Added all environment variables
- [ ] Cleared cache and redeployed
- [ ] Verified build logs show successful build
- [ ] Tested site loads correctly

## If Build Still Fails

### Check Build Logs

Look for these errors in Netlify build logs:
- `npm: command not found` → Use pnpm build command
- `dist/ folder not found` → Build command isn't running
- `Cannot find module` → Dependencies not installing

### Manual Build Test

Test build locally first:
```bash
# Make sure pnpm is available
corepack enable

# Install dependencies
pnpm install

# Build
pnpm run build

# Verify dist/ folder exists
ls -la dist/
```

If local build works but Netlify fails, compare:
- Node.js version (Netlify uses Node 18+ by default)
- Environment variables
- Build command syntax

## Expected Build Output

After successful build, `dist/` should contain:
```
dist/
├── index.html          (updated with correct script paths)
├── favicon.ico
├── manifest.json
├── assets/
│   ├── index-[hash].js  (compiled JavaScript)
│   ├── index-[hash].css (compiled CSS)
│   └── ...
└── _redirects
```

## Test After Deployment

1. **Visit your Netlify URL**
2. **Open browser DevTools → Console**
3. **Check for errors:**
   - ✅ No MIME type errors
   - ✅ No 404 errors for favicon/manifest
   - ✅ JavaScript loads correctly
   - ✅ App renders

## Still Having Issues?

### Common Fixes

1. **Node.js Version:**
   - Add to `netlify.toml`: `NODE_VERSION = "20"`
   - Or set in Netlify dashboard

2. **pnpm Not Found:**
   - Use: `corepack enable && corepack prepare pnpm@latest --activate && pnpm install`

3. **Build Timeout:**
   - Netlify free tier: 15 minutes
   - If build takes longer, optimize dependencies

4. **Environment Variables:**
   - Make sure all `VITE_*` variables are set
   - Redeploy after adding variables

---

**After completing these steps, your Netlify deployment should work correctly!** 🎉

