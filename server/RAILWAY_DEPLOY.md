# 🚂 Railway Deployment Guide

Quick guide to deploy the API server to Railway.

## Step 1: Login to Railway

Run this command in your terminal:
```bash
cd server
railway login
```

This will open your browser to authenticate with Railway.

## Step 2: Initialize Railway Project

```bash
railway init
```

Choose:
- **Create a new project** (or select existing)
- Name it: `noticebazaar-api` (or any name you prefer)

## Step 3: Set Environment Variables

```bash
railway variables set SUPABASE_URL=https://ooaxtwmqrvfzdqzoijcj.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
railway variables set FRONTEND_URL=https://noticebazaar.com
railway variables set NODE_ENV=production
```

**Important:** Replace `your-service-role-key-here` with your actual Supabase service role key.

## Step 4: Deploy

```bash
railway up
```

This will:
1. Build the project
2. Deploy to Railway
3. Give you a Railway URL (like `https://your-app.railway.app`)

## Step 5: Configure Custom Domain

1. Go to Railway Dashboard: https://railway.app/dashboard
2. Select your project
3. Go to **Settings** → **Networking**
4. Click **Add Custom Domain**
5. Enter: `api.noticebazaar.com`
6. Railway will show you DNS records to add
7. Add the CNAME record to your DNS provider
8. Wait for DNS propagation (5-15 minutes)

## Step 6: Verify Deployment

```bash
curl https://api.noticebazaar.com/health
```

Should return:
```json
{"status":"ok","timestamp":"...","supabaseInitialized":true,"nodeEnv":"production"}
```

## Troubleshooting

### Build Fails
- Check Railway logs: `railway logs`
- Ensure all environment variables are set
- Check that TypeScript compiles: `npm run build`

### API Returns 500
- Check Railway logs: `railway logs`
- Verify environment variables are correct
- Check Supabase connection

### Domain Not Working
- Wait 15-30 minutes for DNS propagation
- Verify DNS records are correct
- Check Railway dashboard for domain status

## Railway CLI Commands

```bash
railway status          # Check deployment status
railway logs            # View live logs
railway variables       # List all environment variables
railway open            # Open project in browser
```

