# 🚀 Quick Start: Deploy to Render

## Option 1: Use Render Blueprint (Fastest - 2 minutes)

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Click **"New +"** → **"Blueprint"**

2. **Connect Repository:**
   - Connect GitHub repository: `noticebazaar`
   - Render will auto-detect `render.yaml`

3. **Add Environment Variables:**
   - Backend will be created automatically
   - Add these environment variables in the dashboard:
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

4. **Click "Apply"** - Backend will deploy automatically!

5. **Deploy Frontend Separately:**
   - Click **"New +"** → **"Static Site"**
   - Connect same repository
   - Configure:
     - **Name:** `noticebazaar-frontend`
     - **Build Command:** `corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm run build`
     - **Publish Directory:** `dist`
   - Add environment variables:
     ```
     VITE_SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDEyNTYsImV4cCI6MjA3NTA3NzI1Nn0.xIIz_9W9PAnxTKDdJZ3_wQ6OO7NQJbiy4P_PP0CSVBQ
     VITE_API_BASE_URL=https://noticebazaar-api.onrender.com
     NODE_ENV=production
     ```

---

## Option 2: Manual Setup (More Control)

See `DEPLOY_RENDER_NOW.md` for detailed step-by-step instructions.

---

## ✅ After Deployment

1. **Update Supabase Redirect URLs:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add: `https://noticebazaar-frontend.onrender.com/**`

2. **Test:**
   - Backend: `curl https://noticebazaar-api.onrender.com/health`
   - Frontend: Visit `https://noticebazaar-frontend.onrender.com`

---

## 📝 Environment Variables Reference

**Backend (`noticebazaar-api`):**
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- LLM_PROVIDER
- LLM_API_KEY
- LLM_MODEL
- FRONTEND_URL
- NODE_ENV=production
- PORT=10000
- PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

**Frontend (`noticebazaar-frontend`):**
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_API_BASE_URL
- NODE_ENV=production

---

## 🎯 URLs After Deployment

- **Backend:** `https://noticebazaar-api.onrender.com`
- **Frontend:** `https://noticebazaar-frontend.onrender.com`
- **Health Check:** `https://noticebazaar-api.onrender.com/health`

