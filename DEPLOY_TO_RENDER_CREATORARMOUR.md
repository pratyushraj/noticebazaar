# 🚀 Deploy CreatorArmour to Render

Quick deployment guide for CreatorArmour (rebranded from NoticeBazaar).

## ✅ Changes Pushed

All changes have been committed and pushed to GitHub:
- Email/password signup added
- Back to homepage button added
- CreatorArmour branding throughout
- Resend email service configured

---

## 🎯 Step 1: Deploy Backend API

### If you already have a service on Render:

1. **Go to Render Dashboard:** https://dashboard.render.com
2. **Find your API service** (likely named `noticebazaar-api`)
3. **Click "Manual Deploy"** → **"Deploy latest commit"**
4. **Verify environment variables** (see below)

### If creating a new service:

1. **Go to Render Dashboard:** https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub repository:** `noticebazaar`
4. **Configure:**
   - **Name:** `creatorarmour-api` (or keep `noticebazaar-api`)
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install --no-optional --ignore-scripts && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free (or Paid)

5. **Add Environment Variables:**
   ```
   SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   RESEND_API_KEY=re_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH
   LLM_PROVIDER=groq
   LLM_API_KEY=your-groq-api-key
   LLM_MODEL=llama-3.1-8b-instant
   FRONTEND_URL=https://creatorarmour.com
   NODE_ENV=production
   PORT=10000
   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
   ```

6. **Click "Create Web Service"**

---

## 🎯 Step 2: Deploy Frontend

### If you already have a service on Render:

1. **Find your frontend service** (likely `noticebazaar-frontend`)
2. **Click "Manual Deploy"** → **"Deploy latest commit"**
3. **Update environment variables** (see below)

### If creating a new service:

1. **Click "New +"** → **"Static Site"**
2. **Connect GitHub repository:** `noticebazaar`
3. **Configure:**
   - **Name:** `creatorarmour-frontend` (or keep existing name)
   - **Branch:** `main`
   - **Root Directory:** (leave empty)
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Environment:** `Node`

4. **Add Environment Variables:**
   ```
   VITE_SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_BASE_URL=https://your-api-url.onrender.com
   NODE_ENV=production
   ```

5. **Click "Create Static Site"**

---

## 🔗 Step 3: Connect Custom Domain (creatorarmour.com)

1. **In Render Dashboard**, go to your frontend service
2. **Click "Settings"** → **"Custom Domains"**
3. **Add domain:** `creatorarmour.com`
4. **Add domain:** `www.creatorarmour.com`
5. **Follow DNS instructions** (should already be configured in GoDaddy)
6. **Wait for SSL certificate** (5-15 minutes)

---

## ⚙️ Step 4: Update Environment Variables

### Backend API - Update these:

- `FRONTEND_URL`: Change to `https://creatorarmour.com`
- `RESEND_API_KEY`: Already set to `re_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH`

### Frontend - Update these:

- `VITE_API_BASE_URL`: Update to your API URL (e.g., `https://creatorarmour-api.onrender.com`)

---

## ✅ Step 5: Update Supabase Configuration

**CRITICAL:** Before OAuth will work, update Supabase:

1. **Go to:** https://supabase.com/dashboard/project/ooaxtwmqrvfzdqzoijcj
2. **Authentication** → **URL Configuration**
3. **Update Site URL:** `https://creatorarmour.com`
4. **Update Redirect URLs:**
   ```
   https://creatorarmour.com/**
   https://creatorarmour.com/#/creator-dashboard
   https://creatorarmour.com/#/creator-onboarding
   http://localhost:8080/**
   ```
5. **Save** and wait 1-2 minutes

See `UPDATE_SUPABASE_FOR_CREATORARMOUR.md` for detailed instructions.

---

## 🧪 Step 6: Test Deployment

After deployment completes (5-10 minutes):

1. **Visit:** https://creatorarmour.com
2. **Test signup:** Email/password and Google OAuth
3. **Test email:** OTP emails should work
4. **Check API:** https://your-api-url.onrender.com/

---

## 📝 Quick Checklist

- [ ] Backend API deployed
- [ ] Frontend deployed
- [ ] Custom domain connected (creatorarmour.com)
- [ ] SSL certificate active
- [ ] Environment variables updated
- [ ] Supabase redirect URLs updated
- [ ] Test signup/login
- [ ] Test email OTP
- [ ] Test Google OAuth

---

## 🆘 Troubleshooting

### OAuth 400 Error:
- Update Supabase redirect URLs (Step 5 above)

### Email not sending:
- Verify `RESEND_API_KEY` is set in backend
- Check Resend dashboard for domain verification

### API not responding:
- Check backend logs in Render
- Verify environment variables
- Check health endpoint: `/health`

---

## 🎉 Done!

Your CreatorArmour app should now be live at https://creatorarmour.com!

