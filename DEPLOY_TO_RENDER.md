# 🚀 Deploy NoticeBazaar to Render

Complete guide to deploy both frontend and backend to Render.

## 📋 Prerequisites

- GitHub repository with your code
- Render account (free tier works)
- Supabase credentials ready

---

## 🎯 Step 1: Deploy Backend API

### Option A: Via Render Dashboard (Recommended)

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Sign up/Login with GitHub

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `noticebazaar`
   - Select the repository

3. **Configure Backend:**
   - **Name:** `noticebazaar-api`
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `pnpm install --no-optional --ignore-scripts && pnpm run build`
   - **Start Command:** `pnpm start` or `node dist/index.js`
   - **Plan:** Free (or Paid for better performance)

4. **Add Environment Variables:**
   Click "Add Environment Variable" and add:
   ```
   SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c
   LLM_PROVIDER=groq
   LLM_API_KEY=your-groq-api-key-here
   LLM_MODEL=llama-3.1-8b-instant
   FRONTEND_URL=https://noticebazaar-frontend.onrender.com
   NODE_ENV=production
   PORT=10000
   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Render will build and deploy
   - You'll get a URL like: `https://noticebazaar-api.onrender.com`

6. **Set Health Check:**
   - Go to Settings → Health Check Path
   - Set to: `/health`

---

## 🎯 Step 2: Deploy Frontend (Static Site)

1. **Create New Static Site:**
   - In Render Dashboard, click "New +" → "Static Site"
   - Connect your GitHub repository: `noticebazaar`
   - Select the repository

2. **Configure Frontend:**
   - **Name:** `noticebazaar-frontend`
   - **Branch:** `main`
   - **Root Directory:** (leave empty - root of repo)
   - **Build Command:** `corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm run build`
   - **Publish Directory:** `dist`
   - **Environment:** `Node`

3. **Add Environment Variables:**
   Click "Add Environment Variable" and add:
   ```
   VITE_SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDEyNTYsImV4cCI6MjA3NTA3NzI1Nn0.xIIz_9W9PAnxTKDdJZ3_wQ6OO7NQJbiy4P_PP0CSVBQ
   VITE_API_BASE_URL=https://noticebazaar-api.onrender.com
   NODE_ENV=production
   ```

4. **Deploy:**
   - Click "Create Static Site"
   - Render will build and deploy
   - You'll get a URL like: `https://noticebazaar-frontend.onrender.com`

5. **SPA Routing:**
   - The `public/_redirects` file is already configured
   - This ensures all routes redirect to `index.html` for React Router
   - BrowserRouter will work correctly with this setup

---

## ✅ Step 3: Update Supabase Redirect URLs

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj
   - Go to Authentication → URL Configuration

2. **Update URLs:**
   - **Site URL:** `https://noticebazaar-frontend.onrender.com`
   - **Redirect URLs:** Add:
     ```
     https://noticebazaar-frontend.onrender.com/**
     https://noticebazaar-frontend.onrender.com/auth/callback
     http://localhost:8080/**
     ```

3. **Save Changes**

---

## 🧪 Step 4: Test Deployment

### Test Backend:
```bash
curl https://noticebazaar-api.onrender.com/health
```
Should return: `{"status":"ok",...}`

### Test Frontend:
1. Visit: `https://noticebazaar-frontend.onrender.com`
2. Try `/login` route - should work with BrowserRouter!
3. Test authentication flow
4. Test contract upload

---

## 🔧 Troubleshooting

### Backend Issues:

**Build fails:**
- Check Node.js version (should be 18+)
- Verify `server/package.json` has correct scripts
- Check build logs in Render dashboard

**API not responding:**
- Check environment variables are set correctly
- Verify health check endpoint works
- Check Render service logs

**CORS errors:**
- Update `FRONTEND_URL` in backend env vars
- Check CORS settings in `server/src/index.ts`

### Frontend Issues:

**404 on routes:**
- Verify `public/_redirects` file exists
- Check that `dist/index.html` is created after build
- Ensure BrowserRouter is used (not HashRouter)

**Environment variables not working:**
- Make sure they start with `VITE_`
- Redeploy after adding variables
- Check variable names match exactly

**Build fails:**
- Check Node.js version
- Verify pnpm is available (corepack)
- Check build logs for specific errors

---

## 📝 Quick Deploy Checklist

- [ ] Backend deployed to Render
- [ ] Backend environment variables set
- [ ] Backend health check working
- [ ] Frontend deployed to Render
- [ ] Frontend environment variables set
- [ ] `public/_redirects` file exists
- [ ] Supabase redirect URLs updated
- [ ] Test `/login` route works
- [ ] Test authentication flow
- [ ] Test API connectivity

---

## 🎯 Next Steps

1. ✅ Both services deployed
2. ✅ Environment variables configured
3. ✅ Supabase URLs updated
4. ✅ Test all functionality
5. ✅ Add custom domain (optional)

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render Static Sites](https://render.com/docs/static-sites)
- [Render Web Services](https://render.com/docs/web-services)

