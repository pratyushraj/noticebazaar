# 🚀 Deploy Frontend to Render - Quick Steps

Since your API is already working, let's deploy the frontend separately as a Static Site.

## Step-by-Step Instructions

### 1. Cancel Current Blueprint (if still open)
- Click "Cancel" on the Blueprint page

### 2. Create Frontend Static Site

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - You should see your existing `noticebazaar-api` service

2. **Create New Static Site:**
   - Click **"New +"** button (top right)
   - Select **"Static Site"**

3. **Connect Repository:**
   - Click **"Connect GitHub"** (if not already connected)
   - Select repository: `noticebazaar`
   - Click **"Connect"**

4. **Configure Static Site:**
   
   **Basic Settings:**
   - **Name:** `noticebazaar-frontend`
   - **Branch:** `main`
   - **Root Directory:** (leave empty - uses repo root)
   - **Build Command:** `corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm run build`
   - **Publish Directory:** `dist`
   - **Environment:** `Node` (auto-detected)

5. **Add Environment Variables:**
   
   Click **"Add Environment Variable"** and add these one by one:
   
   ```
   Key: VITE_SUPABASE_URL
   Value: https://ooaxtwmqrvfzdqzoijcj.supabase.co
   ```
   
   ```
   Key: VITE_SUPABASE_ANON_KEY
   Value: [your-anon-key-here]
   ```
   
   ```
   Key: VITE_API_BASE_URL
   Value: https://noticebazaar-api.onrender.com
   ```
   
   ```
   Key: NODE_ENV
   Value: production
   ```

6. **Deploy:**
   - Click **"Create Static Site"**
   - Render will automatically:
     - Clone your repo
     - Install dependencies
     - Build your frontend
     - Deploy to a URL like: `https://noticebazaar-frontend.onrender.com`

### 3. Wait for Build (2-5 minutes)

- Watch the build logs in real-time
- You'll see progress: "Installing dependencies" → "Building" → "Deploying"
- When done, you'll see: "Your site is live at https://..."

### 4. Test Your Frontend

```bash
curl https://noticebazaar-frontend.onrender.com
```

Should return your HTML page.

### 5. Update Supabase Redirect URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to **Site URL**: `https://noticebazaar-frontend.onrender.com`
3. Add to **Redirect URLs**: 
   - `https://noticebazaar-frontend.onrender.com/**`
   - `https://noticebazaar-frontend.onrender.com/auth/callback`

### 6. Test Authentication

1. Visit: `https://noticebazaar-frontend.onrender.com`
2. Try signing in
3. Verify it connects to your API

## Troubleshooting

**Build fails?**
- Check build logs in Render dashboard
- Make sure `dist/` folder is created after build
- Verify Node.js version is compatible

**Environment variables not working?**
- Make sure variable names start with `VITE_` (for Vite)
- Restart deployment after adding variables
- Check they're set for the correct environment (Production)

**404 errors on routes?**
- This is normal for React Router - Render will handle it
- Make sure `dist/index.html` exists

**CORS errors?**
- Verify `VITE_API_BASE_URL` points to your API
- Check API CORS settings allow your frontend domain

## What You'll Have

✅ **API:** `https://noticebazaar-api.onrender.com` (already working)  
✅ **Frontend:** `https://noticebazaar-frontend.onrender.com` (newly deployed)  
✅ **Both services auto-deploy on git push**  
✅ **Free tier for both**  

## Next Steps

1. Deploy frontend (follow steps above)
2. Update Supabase redirect URLs
3. Test the full application
4. Add custom domain (optional)

---

**Quick Checklist:**
- [ ] Cancel Blueprint page
- [ ] Create Static Site in Render Dashboard
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Deploy and wait for build
- [ ] Update Supabase redirect URLs
- [ ] Test authentication flow

