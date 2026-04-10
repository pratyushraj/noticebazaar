# 🚀 Deploy NoticeBazaar to Render - Step by Step

This guide will help you deploy both backend and frontend to Render so noticebazaar.com is live.

## 📋 Prerequisites

✅ Code is pushed to GitHub (already done)  
✅ Render account (sign up at https://dashboard.render.com if needed)  
✅ Supabase credentials ready

---

## 🎯 Step 1: Deploy Backend API

### Via Render Dashboard:

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Sign up/Login with GitHub (recommended for auto-deploy)

2. **Create New Web Service:**
   - Click **"New +"** button (top right)
   - Select **"Web Service"**
   - Connect your GitHub repository: `noticebazaar`
   - Click **"Connect"** if not already connected

3. **Configure Backend Service:**
   
   **Basic Settings:**
   - **Name:** `noticebazaar-api`
   - **Region:** Choose closest to you (e.g., Oregon)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install --no-optional --ignore-scripts && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free (or Paid for better performance)

4. **Add Environment Variables:**
   
   Click **"Add Environment Variable"** and add these one by one:
   
   ```
   SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
   ```
   
   ```
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
   ```
   
   ```
   LLM_PROVIDER=groq
   ```
   
   ```
   LLM_API_KEY=your-groq-api-key-here
   ```
   
   ```
   LLM_MODEL=llama-3.1-8b-instant
   ```
   
   ```
   FRONTEND_URL=https://noticebazaar-frontend.onrender.com
   ```
   
   ```
   NODE_ENV=production
   ```
   
   ```
   PORT=10000
   ```
   
   ```
   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
   ```

5. **Set Health Check:**
   - Scroll down to **"Health Check Path"**
   - Set to: `/health`

6. **Deploy:**
   - Click **"Create Web Service"**
   - Render will automatically:
     - Clone your repo
     - Install dependencies
     - Build your backend
     - Deploy to a URL like: `https://noticebazaar-api.onrender.com`

7. **Wait for Build (2-5 minutes):**
   - Watch the build logs in real-time
   - You'll see: "Installing dependencies" → "Building" → "Deploying"
   - When done, you'll see: "Your service is live at https://..."

---

## 🎯 Step 2: Deploy Frontend (Static Site)

1. **Create New Static Site:**
   - In Render Dashboard, click **"New +"** → **"Static Site"**
   - Connect your GitHub repository: `noticebazaar` (if not already connected)
   - Select the repository

2. **Configure Frontend:**
   
   **Basic Settings:**
   - **Name:** `noticebazaar-frontend`
   - **Branch:** `main`
   - **Root Directory:** (leave empty - uses repo root)
   - **Build Command:** `corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm run build`
   - **Publish Directory:** `dist`
   - **Environment:** `Node`

3. **Add Environment Variables:**
   
   Click **"Add Environment Variable"** and add:
   
   ```
   VITE_SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
   ```
   
   ```
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```
   
   ```
   VITE_API_BASE_URL=https://noticebazaar-api.onrender.com
   ```
   
   ```
   NODE_ENV=production
   ```

4. **Deploy:**
   - Click **"Create Static Site"**
   - Render will automatically build and deploy
   - You'll get a URL like: `https://noticebazaar-frontend.onrender.com`

5. **Wait for Build (3-5 minutes):**
   - Watch the build logs
   - When done, your site will be live!

---

## ✅ Step 3: Update Supabase Redirect URLs

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj
   - Go to **Authentication** → **URL Configuration**

2. **Update URLs:**
   - **Site URL:** `https://noticebazaar-frontend.onrender.com`
   - **Redirect URLs:** Add these (one per line):
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

Should return:
```json
{"status":"ok","timestamp":"...","supabaseInitialized":true}
```

### Test Frontend:
1. Visit: `https://noticebazaar-frontend.onrender.com`
2. Test authentication flow
3. Test contract upload
4. Check browser console for any errors

---

## 🌐 Step 5: Add Custom Domain (Optional - for noticebazaar.com)

### For Frontend:

1. **In Render Dashboard:**
   - Go to your `noticebazaar-frontend` service
   - Click **"Settings"** → **"Custom Domains"**
   - Click **"Add Custom Domain"**
   - Enter: `noticebazaar.com` or `www.noticebazaar.com`
   - Render will show you DNS records to add

2. **Add DNS Records:**
   - Go to your domain registrar (where you manage noticebazaar.com)
   - Add the CNAME or A record as shown by Render
   - Wait 5-15 minutes for DNS propagation

3. **Update Environment Variables:**
   - Update `FRONTEND_URL` in backend to: `https://noticebazaar.com`
   - Update Supabase redirect URLs to include: `https://noticebazaar.com/**`

### For Backend (api.noticebazaar.com):

1. **In Render Dashboard:**
   - Go to your `noticebazaar-api` service
   - Click **"Settings"** → **"Custom Domains"**
   - Click **"Add Custom Domain"**
   - Enter: `api.noticebazaar.com`
   - Add DNS record as shown

2. **Update Frontend Environment Variable:**
   - Update `VITE_API_BASE_URL` to: `https://api.noticebazaar.com`
   - Redeploy frontend

---

## 🔧 Troubleshooting

### Backend Issues:

**Build fails:**
- Check Node.js version (should be 18+)
- Verify `server/package.json` has correct scripts
- Check build logs in Render dashboard

**API not responding:**
- Check environment variables are set correctly
- Verify health check endpoint: `/health`
- Check Render service logs

**CORS errors:**
- Update `FRONTEND_URL` in backend env vars
- Make sure it matches your frontend URL exactly

### Frontend Issues:

**404 on routes:**
- The `public/_redirects` file should handle this
- Verify `dist/index.html` is created after build
- Check that React Router is configured correctly

**Environment variables not working:**
- Make sure they start with `VITE_`
- Redeploy after adding variables
- Check variable names match exactly

**Build fails:**
- Check Node.js version
- Verify pnpm is available (corepack)
- Check build logs for specific errors

---

## 📝 Quick Checklist

- [ ] Backend deployed to Render
- [ ] Backend environment variables set
- [ ] Backend health check working (`/health`)
- [ ] Frontend deployed to Render
- [ ] Frontend environment variables set
- [ ] Supabase redirect URLs updated
- [ ] Test authentication flow
- [ ] Test API connectivity
- [ ] (Optional) Custom domain configured

---

## 🎉 Success!

Once all steps are complete:
- ✅ Backend: `https://noticebazaar-api.onrender.com`
- ✅ Frontend: `https://noticebazaar-frontend.onrender.com`
- ✅ Both services auto-deploy on git push
- ✅ Free tier available for both

---

## 📚 Next Steps

1. Test all functionality on production
2. Monitor error logs
3. Set up custom domain (optional)
4. Configure monitoring/analytics

