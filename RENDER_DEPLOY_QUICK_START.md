# 🚀 Quick Start: Deploy to Render

## Option 1: Use Render Blueprint (Fastest - 2 minutes)

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Click **"New +"** → **"Blueprint"**

2. **Connect Repository:**
   - Connect GitHub repository: `creatorarmour`
   - Render will auto-detect `render.yaml`

3. **Add Environment Variables:**
   - Backend will be created automatically
   - Add these environment variables in the dashboard:
     ```
     SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
     LLM_PROVIDER=groq
     LLM_API_KEY=your-groq-api-key-here
     LLM_MODEL=llama-3.1-8b-instant
     FRONTEND_URL=https://creatorarmour-frontend.onrender.com
     NODE_ENV=production
     PORT=10000
     PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
     ```

4. **Click "Apply"** - Backend will deploy automatically!

5. **Deploy Frontend Separately:**
   - Click **"New +"** → **"Static Site"**
   - Connect same repository
   - Configure:
     - **Name:** `creatorarmour-frontend`
     - **Build Command:** `corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm run build`
     - **Publish Directory:** `dist`
   - Add environment variables:
     ```
     VITE_SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
     VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
     VITE_API_BASE_URL=https://creatorarmour-api.onrender.com
     NODE_ENV=production
     ```

---

## Option 2: Manual Setup (More Control)

See `DEPLOY_RENDER_NOW.md` for detailed step-by-step instructions.

---

## ✅ After Deployment

1. **Update Supabase Redirect URLs:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add: `https://creatorarmour-frontend.onrender.com/**`

2. **Test:**
   - Backend: `curl https://creatorarmour-api.onrender.com/health`
   - Frontend: Visit `https://creatorarmour-frontend.onrender.com`

---

## 📝 Environment Variables Reference

**Backend (`creatorarmour-api`):**
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- LLM_PROVIDER
- LLM_API_KEY
- LLM_MODEL
- FRONTEND_URL
- NODE_ENV=production
- PORT=10000
- PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

**Frontend (`creatorarmour-frontend`):**
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_API_BASE_URL
- NODE_ENV=production

---

## 🎯 URLs After Deployment

- **Backend:** `https://creatorarmour-api.onrender.com`
- **Frontend:** `https://creatorarmour-frontend.onrender.com`
- **Health Check:** `https://creatorarmour-api.onrender.com/health`

