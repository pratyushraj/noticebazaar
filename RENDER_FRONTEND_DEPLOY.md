# 🚀 Deploy Frontend to Render (Static Site)

Deploy your CreatorArmour frontend to Render as a Static Site.

## Quick Deploy Steps

### Option 1: Via Render Dashboard (Recommended - 5 minutes)

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Sign up/Login with GitHub

2. **Create New Static Site:**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository: `creatorarmour`
   - Select the repository

3. **Configure Static Site:**
   - **Name:** `creatorarmour-frontend`
   - **Branch:** `main`
   - **Root Directory:** (leave empty - root of repo)
   - **Build Command:** `corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm run build`
   - **Publish Directory:** `dist`
   - **Environment:** `Node`

4. **Add Environment Variables:**
   Click "Add Environment Variable" and add:
   ```
   VITE_SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_API_BASE_URL=https://creatorarmour-api.onrender.com
   NODE_ENV=production
   ```

5. **Deploy:**
   - Click "Create Static Site"
   - Render will automatically build and deploy
   - You'll get a URL like: `https://creatorarmour-frontend.onrender.com`

6. **Configure Custom Domain (Optional):**
   - Go to Settings → Custom Domains
   - Add: `creatorarmour.com` or `www.creatorarmour.com`
   - Follow DNS instructions shown
   - Wait 5-15 minutes for DNS propagation

---

### Option 2: Deploy via Render Dashboard (Recommended)

**Note:** Render Blueprint doesn't support `static_site` type in `render.yaml`, so you must create the static site separately via the Dashboard after deploying the API via Blueprint.

1. **First, deploy API via Blueprint:**
   - Go to Render Dashboard
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml` (which contains only the API service)
   - Add API environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.)
   - Click "Apply"

2. **Then, create frontend static site (separately):**
   - In Render Dashboard, click "New +" → "Static Site"
   - Connect the same GitHub repository: `creatorarmour`
   - Configure as shown in Option 1 above
   - Add frontend environment variables
   - Deploy!

---

## Render Free Tier for Static Sites

✅ **Unlimited static sites**  
✅ **100 GB bandwidth/month**  
✅ **Automatic HTTPS**  
✅ **Custom domains**  
✅ **Auto-deploy on git push**  
✅ **No spin-down** (always available)

---

## After Deployment

### Test Your Frontend:
```bash
curl https://creatorarmour-frontend.onrender.com
```

Should return your HTML page.

### Update Supabase Redirect URLs:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to **Site URL**: `https://creatorarmour-frontend.onrender.com`
3. Add to **Redirect URLs**: 
   - `https://creatorarmour-frontend.onrender.com/**`
   - `https://creatorarmour-frontend.onrender.com/auth/callback`

---

## Troubleshooting

**Build fails?**
- Check Node.js version in Render (should auto-detect from package.json)
- Check build logs in Render dashboard
- Verify `dist/` folder is created after build

**Environment variables not working?**
- Make sure they're set in Render dashboard
- Restart deployment after adding variables
- Check variable names start with `VITE_` for Vite

**404 errors on routes?**
- Render static sites need proper routing configuration
- Make sure `dist/index.html` exists
- Check that React Router is configured correctly

**CORS errors?**
- Update `VITE_API_BASE_URL` to match your API URL
- Check API CORS settings allow your frontend domain

---

## Manual Build & Deploy (Alternative)

If you want to build locally and upload:

```bash
# Build locally
npm run build

# The dist/ folder contains your static site
# You can upload this to any static hosting
```

---

## Next Steps

1. ✅ Deploy frontend to Render
2. ✅ Update Supabase redirect URLs
3. ✅ Test authentication flow
4. ✅ Verify API connectivity
5. ✅ Add custom domain (optional)

