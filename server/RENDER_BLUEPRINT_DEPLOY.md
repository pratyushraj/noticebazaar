# 🚀 Render Blueprint Deployment (render.yaml)

Deploy using Render's Blueprint feature - it auto-detects `server/render.yaml` and configures everything!

## Quick Steps

### 1. Go to Render Dashboard
- Visit: https://dashboard.render.com
- Click **"New +"** → **"Blueprint"**

### 2. Connect Your Repository
- Select **"Connect GitHub"** (if not already connected)
- Choose repository: `creatorarmour`
- Render will automatically detect `server/render.yaml`

### 3. Review Configuration
Render will show you the service configuration from `render.yaml`:
- ✅ Service name: `creatorarmour-api`
- ✅ Root directory: `server`
- ✅ Build command: `npm install && npm run build`
- ✅ Start command: `npm start`
- ✅ Health check: `/health`
- ✅ Environment variables: `NODE_ENV=production`, `PORT=10000`

### 4. Add Required Environment Variables
You'll need to add these manually (they're secrets, so not in render.yaml):

Click **"Add Environment Variable"** and add:

```
SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-here>
FRONTEND_URL=https://creatorarmour.com
```

**Note:** `NODE_ENV` and `PORT` are already set from `render.yaml`, but you can verify they're there.

### 5. Select Instance Type
- Choose **Free** plan (for now)
- Or upgrade to Starter ($7/month) for always-on service

### 6. Deploy!
- Click **"Apply"** or **"Create Blueprint"**
- Render will:
  1. Clone your repo
  2. Navigate to `server/` directory
  3. Run `npm install && npm run build`
  4. Start with `npm start`
  5. Deploy your API

### 7. Wait for Deployment
- Build takes ~2-5 minutes
- Watch the logs in real-time
- You'll see: "Your service is live at https://creatorarmour-api.onrender.com"

## After Deployment

### Test Your API:
```bash
curl https://creatorarmour-api.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "supabaseInitialized": true,
  "nodeEnv": "production"
}
```

### Update Frontend:
Add to your frontend environment variables:
```env
VITE_API_BASE_URL=https://creatorarmour-api.onrender.com
```

Or if you set up a custom domain:
```env
VITE_API_BASE_URL=https://api.creatorarmour.com
```

## Custom Domain (Optional)

1. Go to your service → **Settings** → **Custom Domains**
2. Add: `api.creatorarmour.com`
3. Follow DNS instructions
4. Wait 5-15 minutes for DNS propagation

## Troubleshooting

### Build Fails:
- Check logs in Render dashboard
- Verify `server/package.json` exists
- Ensure TypeScript compiles successfully

### API Returns 500:
- Check environment variables are set correctly
- Verify Supabase credentials
- Check service logs

### Health Check Fails:
- Verify `/health` endpoint exists in your Express app
- Check that server starts on `PORT=10000`

## render.yaml Structure

Your `server/render.yaml` contains:
```yaml
services:
  - type: web
    name: creatorarmour-api
    env: node
    rootDir: server          # ← Critical: tells Render where your code is
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
    healthCheckPath: /health
```

This file is already in your repo, so Render will auto-detect it! 🎉

