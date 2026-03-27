# 🚀 Deploy to Vercel via Dashboard

Since you've hit the CLI deployment limit, use the Vercel Dashboard instead.

## 📋 Steps to Deploy via Dashboard

### Step 1: Push to GitHub (if not already)

```bash
git add .
git commit -m "Switch to BrowserRouter for clean URLs"
git push
```

### Step 2: Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Login if needed

2. **Select Your Project:**
   - Find "noticebazaar" project
   - Click on it

3. **Redeploy Latest:**
   - Go to **Deployments** tab
   - Find the latest deployment
   - Click **"..."** (three dots) → **Redeploy**
   - Or click **"Deploy"** button to deploy latest from Git

### Step 3: Set Environment Variables

**IMPORTANT:** Make sure these are set in Vercel Dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add/Update these for **Production**:

```
VITE_SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDEyNTYsImV4cCI6MjA3NTA3NzI1Nn0.xIIz_9W9PAnxTKDdJZ3_wQ6OO7NQJbiy4P_PP0CSVBQ
VITE_API_BASE_URL=https://noticebazaar-api.onrender.com
NODE_ENV=production
```

3. Click **Save**
4. **Redeploy** after adding variables (if needed)

### Step 4: Connect GitHub (if not connected)

If your project isn't connected to GitHub:

1. Go to **Settings** → **Git**
2. Click **Connect Git Repository**
3. Select your GitHub repository
4. Vercel will auto-deploy on every push

### Step 5: Verify Deployment

1. Visit your Vercel deployment URL
2. Test `/login` route - should work now!
3. Check browser console for any errors

## ✅ Alternative: Wait and Retry CLI

If you prefer CLI, wait 10 hours and run:

```bash
vercel --prod --yes
```

## 🎯 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Project Settings**: https://vercel.com/dashboard → Your Project → Settings
- **Environment Variables**: Settings → Environment Variables
- **Deployments**: Deployments tab

## 📝 Notes

- The `vercel.json` is already configured correctly
- BrowserRouter change is in the code
- Just need to deploy the latest version
- Environment variables must be set for the app to work

