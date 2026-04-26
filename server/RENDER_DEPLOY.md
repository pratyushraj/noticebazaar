# 🚀 Render Deployment Guide (Free Tier)

Render's free tier supports web services, making it a perfect alternative to Railway.

## Quick Deploy Steps

### Option 1: Deploy via Render Dashboard (Recommended - 5 minutes)

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Sign up/Login with GitHub (recommended for auto-deploy)

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `creatorarmour`
   - Select the repository

3. **Configure Service:**
   - **Name:** `creatorarmour-api`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. **Add Environment Variables:**
   Click "Add Environment Variable" and add:
   ```
   SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   FRONTEND_URL=https://creatorarmour.com
   NODE_ENV=production
   PORT=10000
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy
   - You'll get a URL like: `https://creatorarmour-api.onrender.com`

6. **Configure Custom Domain (Optional):**
   - Go to Settings → Custom Domains
   - Add: `api.creatorarmour.com`
   - Follow DNS instructions shown
   - Wait 5-15 minutes for DNS propagation

### Option 2: Use render.yaml Blueprint (Auto-config)

1. Go to Render Dashboard
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository: `creatorarmour`
4. Render will auto-detect `server/render.yaml`
5. Review the configuration
6. Add environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FRONTEND_URL)
7. Click "Apply"

## After Deployment

### Test Your API:
```bash
curl https://creatorarmour-api.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "supabaseInitialized": true,
  "nodeEnv": "production"
}
```

### Update Frontend:
Once your API is deployed, update your frontend environment variable:
```
VITE_API_BASE_URL=https://creatorarmour-api.onrender.com
```
Or if you set up custom domain:
```
VITE_API_BASE_URL=https://api.creatorarmour.com
```

## Render Free Tier Limits

✅ **Web services supported** (unlike Railway free tier)  
✅ **750 hours/month free**  
✅ **Automatic SSL certificates**  
✅ **Custom domains**  
✅ **Auto-deploy from GitHub**  
⚠️ **Spins down after 15 min inactivity** (wakes on first request, ~30s delay)

## Troubleshooting

### Build Fails:
- Check build logs in Render dashboard
- Ensure `server/package.json` has correct scripts
- Verify Node.js version (Render uses latest LTS)

### API Returns 500:
- Check environment variables are set correctly
- Verify Supabase credentials
- Check logs in Render dashboard

### Custom Domain Not Working:
- Wait 15-30 minutes for DNS propagation
- Verify DNS records match Render's instructions
- Check domain in Render dashboard shows "Active"

## Next Steps

1. Deploy to Render (follow steps above)
2. Test `/health` endpoint
3. Update frontend `VITE_API_BASE_URL`
4. Test contract upload from production
5. Set up custom domain if needed
