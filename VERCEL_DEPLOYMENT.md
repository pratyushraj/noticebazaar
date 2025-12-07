# 🚀 Vercel Deployment Guide for NoticeBazaar

This guide will help you deploy both the frontend and backend to Vercel.

## 📋 Project Structure

- **Frontend**: Root directory (Vite + React)
- **Backend**: `server/` directory (Express + TypeScript)

## 🎯 Deployment Strategy

### Option 1: Frontend Only (Recommended for Start)

Deploy just the frontend to Vercel, and keep the backend on Render or another service.

### Option 2: Full Stack (Frontend + Backend API Routes)

Deploy both frontend and backend to Vercel using serverless functions.

---

## 🚀 Quick Deploy: Frontend Only

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy Frontend

```bash
# From project root
vercel --prod
```

### Step 4: Configure Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables for **Production**:

```
VITE_SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDEyNTYsImV4cCI6MjA3NTA3NzI1Nn0.xIIz_9W9PAnxTKDdJZ3_wQ6OO7NQJbiy4P_PP0CSVBQ
VITE_API_BASE_URL=https://noticebazaar-api.onrender.com
NODE_ENV=production
```

5. Click **Save**
6. Redeploy: Go to **Deployments** → Click **"..."** → **Redeploy**

### Step 5: Add Custom Domain (Optional)

1. Vercel Dashboard → Project → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `noticebazaar.com`)
4. Follow DNS setup instructions

---

## 🚀 Full Stack Deployment (Frontend + Backend)

### Step 1: Create API Directory Structure

Vercel uses the `api/` directory for serverless functions. We'll create API routes that proxy to your Express server.

### Step 2: Update vercel.json

The existing `vercel.json` already has the correct configuration for the frontend. For backend, we have two options:

**Option A: Deploy Backend Separately** (Recommended)
- Deploy backend to Render/Railway/Fly.io
- Frontend calls backend API URL

**Option B: Use Vercel Serverless Functions**
- Convert Express routes to Vercel serverless functions
- More complex but keeps everything in one place

### Step 3: Environment Variables

Add these to Vercel Dashboard → Settings → Environment Variables:

**For Frontend:**
```
VITE_SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDEyNTYsImV4cCI6MjA3NTA3NzI1Nn0.xIIz_9W9PAnxTKDdJZ3_wQ6OO7NQJbiy4P_PP0CSVBQ
VITE_API_BASE_URL=https://your-backend-url.vercel.app
NODE_ENV=production
```

**For Backend (if using serverless functions):**
```
SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXh0d21xcnZmemRxem9pamNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMTI1NiwiZXhwIjoyMDc1MDc3MjU2fQ.hKeyfz-wZ6JOs3mupPDppKDYuHii0GRcxc04oRROD4c
LLM_PROVIDER=groq
LLM_API_KEY=your-groq-api-key-here
LLM_MODEL=llama-3.1-8b-instant
FRONTEND_URL=https://your-frontend-url.vercel.app
NODE_ENV=production
```

---

## 🔧 Vercel Configuration

### Build Settings

Vercel will auto-detect Vite, but you can verify in **Settings** → **General**:

- **Framework Preset**: Vite
- **Build Command**: `pnpm build` (or `npm run build`)
- **Output Directory**: `dist`
- **Install Command**: `pnpm install` (or `npm install`)

### Root Directory

- **Root Directory**: `.` (project root)

---

## 📝 Deployment Checklist

- [ ] Install Vercel CLI
- [ ] Login to Vercel
- [ ] Deploy frontend: `vercel --prod`
- [ ] Set environment variables in Vercel Dashboard
- [ ] Add custom domain (optional)
- [ ] Test deployment
- [ ] Verify API connections
- [ ] Test contract upload flow

---

## 🐛 Troubleshooting

### Build Fails

1. Check build logs in Vercel Dashboard
2. Ensure all dependencies are in `package.json`
3. Check Node.js version (Vercel uses Node 18.x by default)

### Environment Variables Not Working

1. Ensure variables start with `VITE_` for frontend
2. Redeploy after adding variables
3. Check variable names match exactly

### API Calls Failing

1. Verify `VITE_API_BASE_URL` is set correctly
2. Check CORS settings on backend
3. Verify backend is accessible

### Routing Issues

The `vercel.json` already includes SPA routing configuration. If routes don't work:

1. Check `vercel.json` rewrites section
2. Ensure all routes redirect to `/index.html`

---

## 🎯 Next Steps

1. **Deploy Frontend**: `vercel --prod`
2. **Set Environment Variables**: Add in Vercel Dashboard
3. **Test**: Visit your Vercel URL
4. **Add Domain**: Configure custom domain
5. **Monitor**: Check Vercel Analytics

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## ✅ Quick Deploy Command

```bash
# One command to deploy
vercel --prod --yes
```

This will:
1. Deploy to production
2. Auto-detect settings
3. Create deployment URL

Then add environment variables in the dashboard!

